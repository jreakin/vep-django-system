import json
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model

User = get_user_model()


class StrategyRoomConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for WebXR Strategy Room real-time collaboration."""
    
    async def connect(self):
        """Handle WebSocket connection."""
        self.user = self.scope['user']
        
        if self.user.is_anonymous:
            await self.close()
            return
        
        # Get room ID from URL route
        self.room_id = self.scope['url_route']['kwargs']['room_id']
        self.room_group_name = f'strategy_room_{self.room_id}'
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Broadcast user joined event
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'user_joined',
                'user_id': str(self.user.id),
                'username': self.user.username,
                'message': f'{self.user.username} joined the strategy room'
            }
        )
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection."""
        if hasattr(self, 'room_group_name'):
            # Broadcast user left event
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'user_left',
                    'user_id': str(self.user.id),
                    'username': self.user.username,
                    'message': f'{self.user.username} left the strategy room'
                }
            )
            
            # Leave room group
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
                await self.handle_user_position(data)
            elif message_type == 'user_interaction':
                await self.handle_user_interaction(data)
            elif message_type == 'load_model':
                await self.handle_load_model(data)
            elif message_type == 'chat_message':
                await self.handle_chat_message(data)
                
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid JSON'
            }))
    
    async def handle_user_position(self, data):
        """Handle user position update."""
        # Broadcast position to other users in the room
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'position_update',
                'user_id': str(self.user.id),
                'username': self.user.username,
                'position': data.get('position'),
                'rotation': data.get('rotation'),
                'head_pose': data.get('head_pose'),
                'hand_poses': data.get('hand_poses')
            }
        )
    
    async def handle_user_interaction(self, data):
        """Handle user interaction with objects."""
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'interaction_update',
                'user_id': str(self.user.id),
                'username': self.user.username,
                'interaction_type': data.get('interaction_type'),
                'object_id': data.get('object_id'),
                'interaction_data': data.get('interaction_data')
            }
        )
    
    async def handle_load_model(self, data):
        """Handle loading a 3D model in the room."""
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'model_loaded',
                'user_id': str(self.user.id),
                'username': self.user.username,
                'model_url': data.get('model_url'),
                'model_type': data.get('model_type'),
                'position': data.get('position'),
                'scale': data.get('scale')
            }
        )
    
    async def handle_chat_message(self, data):
        """Handle chat message in the room."""
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'user_id': str(self.user.id),
                'username': self.user.username,
                'message': data.get('message')
            }
        )
    
    # Group message handlers
    async def user_joined(self, event):
        """Send user joined event to WebSocket."""
        await self.send(text_data=json.dumps({
            'type': 'user_joined',
            'user_id': event['user_id'],
            'username': event['username'],
            'message': event['message']
        }))
    
    async def user_left(self, event):
        """Send user left event to WebSocket."""
        await self.send(text_data=json.dumps({
            'type': 'user_left',
            'user_id': event['user_id'],
            'username': event['username'],
            'message': event['message']
        }))
    
    async def position_update(self, event):
        """Send position update to WebSocket."""
        # Don't send position updates back to the sender
        if event['user_id'] != str(self.user.id):
            await self.send(text_data=json.dumps({
                'type': 'position_update',
                'user_id': event['user_id'],
                'username': event['username'],
                'position': event['position'],
                'rotation': event['rotation'],
                'head_pose': event.get('head_pose'),
                'hand_poses': event.get('hand_poses')
            }))
    
    async def interaction_update(self, event):
        """Send interaction update to WebSocket."""
        await self.send(text_data=json.dumps({
            'type': 'interaction_update',
            'user_id': event['user_id'],
            'username': event['username'],
            'interaction_type': event['interaction_type'],
            'object_id': event['object_id'],
            'interaction_data': event['interaction_data']
        }))
    
    async def model_loaded(self, event):
        """Send model loaded event to WebSocket."""
        await self.send(text_data=json.dumps({
            'type': 'model_loaded',
            'user_id': event['user_id'],
            'username': event['username'],
            'model_url': event['model_url'],
            'model_type': event['model_type'],
            'position': event['position'],
            'scale': event['scale']
        }))
    
    async def chat_message(self, event):
        """Send chat message to WebSocket."""
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'user_id': event['user_id'],
            'username': event['username'],
            'message': event['message']
        }))