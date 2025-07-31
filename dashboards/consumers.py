import json
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from .models import Notification

User = get_user_model()


class NotificationConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for real-time notifications."""
    
    async def connect(self):
        """Handle WebSocket connection."""
        self.user = self.scope['user']
        
        if self.user.is_anonymous:
            await self.close()
            return
        
        # Create user-specific group
        self.group_name = f'notifications_{self.user.id}'
        
        # Join notification group
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Send recent unread notifications on connect
        await self.send_recent_notifications()
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection."""
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name
            )
    
    async def receive(self, text_data):
        """Handle received WebSocket message."""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'mark_read':
                await self.mark_notification_read(data.get('notification_id'))
            elif message_type == 'mark_all_read':
                await self.mark_all_notifications_read()
                
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid JSON'
            }))
    
    async def notification_message(self, event):
        """Handle notification message from group."""
        await self.send(text_data=json.dumps({
            'type': 'notification',
            'notification': event['notification']
        }))
    
    async def send_recent_notifications(self):
        """Send recent unread notifications to newly connected client."""
        notifications = await self.get_recent_notifications()
        for notification in notifications:
            await self.send(text_data=json.dumps({
                'type': 'notification',
                'notification': notification
            }))
    
    @database_sync_to_async
    def get_recent_notifications(self):
        """Get recent unread notifications for the user."""
        notifications = Notification.objects.filter(
            recipient=self.user,
            is_read=False
        ).order_by('-created_at')[:10]
        
        return [
            {
                'id': str(notification.id),
                'title': notification.title,
                'message': notification.message,
                'type': notification.notification_type,
                'created_at': notification.created_at.isoformat(),
                'action_url': notification.action_url,
                'action_data': notification.action_data,
            }
            for notification in notifications
        ]
    
    @database_sync_to_async
    def mark_notification_read(self, notification_id):
        """Mark a specific notification as read."""
        try:
            notification = Notification.objects.get(
                id=notification_id,
                recipient=self.user
            )
            notification.is_read = True
            notification.save()
            return True
        except Notification.DoesNotExist:
            return False
    
    @database_sync_to_async
    def mark_all_notifications_read(self):
        """Mark all notifications as read for the user."""
        Notification.objects.filter(
            recipient=self.user,
            is_read=False
        ).update(is_read=True)
        return True


# Utility functions for sending notifications
async def send_notification_to_user(user_id, notification_data):
    """Send notification to a specific user via WebSocket."""
    from channels.layers import get_channel_layer
    
    channel_layer = get_channel_layer()
    group_name = f'notifications_{user_id}'
    
    await channel_layer.group_send(
        group_name,
        {
            'type': 'notification_message',
            'notification': notification_data
        }
    )


async def send_notification_to_group(group_name, notification_data):
    """Send notification to a group of users."""
    from channels.layers import get_channel_layer
    
    channel_layer = get_channel_layer()
    
    await channel_layer.group_send(
        group_name,
        {
            'type': 'notification_message',
            'notification': notification_data
        }
    )