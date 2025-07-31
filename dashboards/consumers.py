import json
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from .models import Notification

User = get_user_model()


class NotificationConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for real-time notifications."""
    
    connection_limits = {}  # Track active connections per user
    max_connections_per_user = 5  # Maximum allowed connections per user
    message_rate_limit = 10  # Maximum messages per second
    
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


class StrategyRoomConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for WebXR Strategy Room collaboration."""
    
    async def connect(self):
        """Handle WebSocket connection."""
        self.user = self.scope['user']
        
        if self.user.is_anonymous:
            await self.close()
            return
        
        # Strategy room group for all connected users
        self.room_group_name = self.ROOM_GROUP_NAME
        
        # Join strategy room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Notify other users that someone joined
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'user_joined',
                'user_id': self.user.id,
                'username': self.user.username,
                'sender_channel': self.channel_name
            }
        )
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection."""
        # Notify other users that someone left
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'user_left',
                'user_id': self.user.id,
                'username': self.user.username,
                'sender_channel': self.channel_name
            }
        )
        
        # Leave strategy room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        """Handle received WebSocket message."""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'user_position':
                # Broadcast user position to other users
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'position_update',
                        'user_id': self.user.id,
                        'username': self.user.username,
                        'position': data.get('position'),
                        'rotation': data.get('rotation'),
                        'sender_channel': self.channel_name
                    }
                )
            elif message_type == 'object_interaction':
                # Broadcast object interactions to other users
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'object_interaction',
                        'user_id': self.user.id,
                        'username': self.user.username,
                        'object_id': data.get('object_id'),
                        'interaction_type': data.get('interaction_type'),
                        'object_data': data.get('object_data'),
                        'sender_channel': self.channel_name
                    }
                )
            elif message_type == 'load_usdz_model':
                # Broadcast USDZ model loading to other users
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'usdz_model_loaded',
                        'user_id': self.user.id,
                        'username': self.user.username,
                        'model_url': data.get('model_url'),
                        'position': data.get('position'),
                        'sender_channel': self.channel_name
                    }
                )
                
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid JSON'
            }))
    
    async def user_joined(self, event):
        """Handle user joined event."""
        # Don't send to the user who joined
        if event['sender_channel'] != self.channel_name:
            await self.send(text_data=json.dumps({
                'type': 'user_joined',
                'user_id': event['user_id'],
                'username': event['username']
            }))
    
    async def user_left(self, event):
        """Handle user left event."""
        # Don't send to the user who left
        if event['sender_channel'] != self.channel_name:
            await self.send(text_data=json.dumps({
                'type': 'user_left',
                'user_id': event['user_id'],
                'username': event['username']
            }))
    
    async def position_update(self, event):
        """Handle position update event."""
        # Don't send back to the user who sent the update
        if event['sender_channel'] != self.channel_name:
            await self.send(text_data=json.dumps({
                'type': 'user_position',
                'user_id': event['user_id'],
                'username': event['username'],
                'position': event['position'],
                'rotation': event['rotation']
            }))
    
    async def object_interaction(self, event):
        """Handle object interaction event."""
        # Don't send back to the user who sent the interaction
        if event['sender_channel'] != self.channel_name:
            await self.send(text_data=json.dumps({
                'type': 'object_interaction',
                'user_id': event['user_id'],
                'username': event['username'],
                'object_id': event['object_id'],
                'interaction_type': event['interaction_type'],
                'object_data': event['object_data']
            }))
    
    async def usdz_model_loaded(self, event):
        """Handle USDZ model loaded event."""
        # Don't send back to the user who loaded the model
        if event['sender_channel'] != self.channel_name:
            await self.send(text_data=json.dumps({
                'type': 'usdz_model_loaded',
                'user_id': event['user_id'],
                'username': event['username'],
                'model_url': event['model_url'],
                'position': event['position']
            }))


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