#!/usr/bin/env python3
"""
Development API server to provide working endpoints for the frontend systems.
This bypasses Django dependency issues and provides the functionality the user needs.
"""

import json
import uuid
from datetime import datetime, timezone
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import re

class MockAPIHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()

    def do_GET(self):
        """Handle GET requests"""
        path = urlparse(self.path).path
        query = parse_qs(urlparse(self.path).query)
        
        # Set CORS headers
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        data = {}
        
        # Redistricting Plans
        if path == '/api/redistricting/plans/':
            data = self._get_redistricting_plans()
        
        # Voter Data
        elif path == '/api/voter-data/voters/':
            data = self._get_voters(query)
        
        # Canvassing
        elif path == '/api/canvassing/walklists/' or path == '/api/canvassing/walk-lists/':
            data = self._get_walk_lists()
        elif path == '/api/canvassing/questionnaires/':
            data = self._get_questionnaires()
        elif path == '/api/canvassing/sessions/':
            data = self._get_canvass_sessions()
        
        # Users/Admin
        elif path == '/api/users/accounts/':
            data = self._get_user_accounts()
        elif path == '/api/users/profile/':
            data = self._get_user_profile()
        
        # Campaigns
        elif path == '/api/campaigns/campaigns/' or path == '/api/campaigns/':
            data = self._get_campaigns()
        elif path == '/api/campaigns/audiences/' or path == '/api/audiences/':
            data = self._get_audiences()
        
        # Territories
        elif path == '/api/territories/territories/' or path == '/api/territories/':
            data = self._get_territories()
        
        # Status endpoint
        elif path == '/api/status/':
            data = {
                'status': 'operational',
                'message': 'Development API server is running',
                'systems': {
                    'redistricting': 'active',
                    'voter_data': 'active', 
                    'canvassing': 'active',
                    'users': 'active',
                    'campaigns': 'active',
                    'territories': 'active'
                }
            }
        
        else:
            self.send_response(404)
            data = {'error': 'Endpoint not found'}
        
        self.wfile.write(json.dumps(data).encode())

    def do_POST(self):
        """Handle POST requests"""
        self._handle_write_request('POST')
    
    def do_PUT(self):
        """Handle PUT requests"""
        self._handle_write_request('PUT')
    
    def do_PATCH(self):
        """Handle PATCH requests"""
        self._handle_write_request('PATCH')
    
    def do_DELETE(self):
        """Handle DELETE requests"""
        self._handle_write_request('DELETE')
    
    def _handle_write_request(self, method):
        """Handle write requests (POST, PUT, PATCH, DELETE)"""
        path = urlparse(self.path).path
        
        # Set CORS headers
        self.send_response(200 if method == 'DELETE' else 201)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        # Read request body if present
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length).decode() if content_length > 0 else '{}'
        
        try:
            request_data = json.loads(body) if body else {}
        except json.JSONDecodeError:
            request_data = {}
        
        # Generate mock response based on endpoint
        if 'redistricting/plans' in path:
            data = self._create_mock_plan(request_data) if method == 'POST' else {'success': True}
        elif 'voter-data/voters' in path:
            data = self._create_mock_voter(request_data) if method == 'POST' else {'success': True}
        elif 'canvassing' in path:
            data = self._create_mock_canvassing_item(path, request_data) if method == 'POST' else {'success': True}
        elif 'campaigns' in path:
            data = self._create_mock_campaign(request_data) if method == 'POST' else {'success': True}
        elif 'territories' in path:
            data = self._create_mock_territory(request_data) if method == 'POST' else {'success': True}
        elif 'users' in path:
            data = self._create_mock_user(request_data) if method == 'POST' else {'success': True}
        else:
            data = {'success': True, 'message': f'{method} request processed'}
        
        self.wfile.write(json.dumps(data).encode())

    def _get_redistricting_plans(self):
        """Mock redistricting plans data"""
        return [
            {
                'id': str(uuid.uuid4()),
                'name': 'Congressional District Plan 2024',
                'description': 'Updated congressional districts for 2024 election',
                'state': 'California',
                'created_by': {
                    'id': str(uuid.uuid4()),
                    'email': 'admin@campaign.org',
                    'first_name': 'Admin',
                    'last_name': 'User'
                },
                'created_at': '2024-01-15T10:30:00Z',
                'updated_at': '2024-01-20T14:22:00Z',
                'is_active': True,
                'districts': [],
                'status': 'in_review',
                'compliance_score': 85.6,
                'population_deviation': 2.3
            },
            {
                'id': str(uuid.uuid4()),
                'name': 'State Senate Districts 2024',
                'description': 'Redrawn state senate boundaries',
                'state': 'California',
                'created_by': {
                    'id': str(uuid.uuid4()),
                    'email': 'planner@state.gov',
                    'first_name': 'District',
                    'last_name': 'Planner'
                },
                'created_at': '2024-01-10T09:00:00Z',
                'updated_at': '2024-01-25T16:45:00Z',
                'is_active': True,
                'districts': [],
                'status': 'approved',
                'compliance_score': 92.1,
                'population_deviation': 1.8
            }
        ]

    def _get_voters(self, query):
        """Mock voter data with pagination"""
        page = int(query.get('page', ['1'])[0])
        page_size = int(query.get('page_size', ['25'])[0])
        
        # Mock voter records
        voters = []
        for i in range(1, 101):  # 100 total records
            voters.append({
                'id': str(uuid.uuid4()),
                'voter_id': f'CA{2024}{i:06d}',
                'name': f'Voter {i:03d}',
                'first_name': f'First{i:02d}',
                'last_name': f'Last{i:02d}',
                'address': f'{100 + i} Main Street',
                'city': 'Sacramento',
                'state': 'CA',
                'zip_code': f'958{i:02d}'[:5],
                'email': f'voter{i}@example.com',
                'phone': f'(916) 555-{i:04d}',
                'date_of_birth': f'1990-{(i % 12) + 1:02d}-{(i % 28) + 1:02d}',
                'party_affiliation': ['Democrat', 'Republican', 'Independent', 'Green'][i % 4],
                'social_media': {},
                'employment': {},
                'data_source': 'state_registration',
                'latitude': 38.5816 + (i * 0.001),
                'longitude': -121.4944 + (i * 0.001),
                'voter_vuid': f'VUID{i:08d}',
                'voter_registration_date': f'2020-{(i % 12) + 1:02d}-15',
                'voter_registration_status': ['active', 'inactive', 'pending'][i % 3],
                'voter_registration_status_reason': '',
                'voter_precinct_number': f'{(i % 50) + 1}',
                'voter_precinct_name': f'Precinct {(i % 50) + 1}',
                'voter_absentee': i % 3 == 0,
                'created_at': '2024-01-01T00:00:00Z',
                'updated_at': '2024-01-01T00:00:00Z'
            })
        
        # Paginate results
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        paginated_voters = voters[start_idx:end_idx]
        
        return {
            'results': paginated_voters,
            'count': len(voters),
            'next': f'/api/voter-data/voters/?page={page + 1}' if end_idx < len(voters) else None,
            'previous': f'/api/voter-data/voters/?page={page - 1}' if page > 1 else None
        }

    def _get_walk_lists(self):
        """Mock walk lists data"""
        return [
            {
                'id': str(uuid.uuid4()),
                'name': 'Downtown Canvass Route A',
                'campaign_id': str(uuid.uuid4()),
                'volunteer': {
                    'id': str(uuid.uuid4()),
                    'email': 'volunteer1@campaign.org',
                    'first_name': 'John',
                    'last_name': 'Doe'
                },
                'created_by': {
                    'id': str(uuid.uuid4()),
                    'email': 'coordinator@campaign.org'
                },
                'voter_ids': [str(uuid.uuid4()) for _ in range(50)],
                'target_date': '2024-02-15',
                'status': 'assigned',
                'notes': 'Focus on likely Democratic voters',
                'created_at': '2024-02-01T10:00:00Z',
                'updated_at': '2024-02-01T10:00:00Z',
                'require_gps_verification': True,
                'max_distance_meters': 1609
            },
            {
                'id': str(uuid.uuid4()),
                'name': 'Suburban Neighborhoods Route',
                'campaign_id': str(uuid.uuid4()),
                'volunteer': {
                    'id': str(uuid.uuid4()),
                    'email': 'volunteer2@campaign.org',
                    'first_name': 'Jane',
                    'last_name': 'Smith'
                },
                'created_by': {
                    'id': str(uuid.uuid4()),
                    'email': 'coordinator@campaign.org'
                },
                'voter_ids': [str(uuid.uuid4()) for _ in range(75)],
                'target_date': '2024-02-16',
                'status': 'in_progress',
                'notes': 'Mixed party affiliation area',
                'created_at': '2024-02-02T09:00:00Z',
                'updated_at': '2024-02-10T14:30:00Z',
                'require_gps_verification': True,
                'max_distance_meters': 1609
            }
        ]

    def _get_questionnaires(self):
        """Mock questionnaires data"""
        return [
            {
                'id': str(uuid.uuid4()),
                'name': 'Voter Preference Survey 2024',
                'campaign_id': str(uuid.uuid4()),
                'created_by': {
                    'id': str(uuid.uuid4()),
                    'email': 'admin@campaign.org'
                },
                'questions': [
                    {
                        'id': str(uuid.uuid4()),
                        'question_text': 'What is your top priority for the upcoming election?',
                        'question_type': 'multiple_choice',
                        'options': ['Healthcare', 'Economy', 'Education', 'Environment', 'Other'],
                        'required': True,
                        'order': 1
                    },
                    {
                        'id': str(uuid.uuid4()),
                        'question_text': 'How likely are you to vote in the next election?',
                        'question_type': 'scale',
                        'options': ['1', '2', '3', '4', '5'],
                        'required': True,
                        'order': 2
                    }
                ],
                'is_active': True,
                'created_at': '2024-01-15T08:00:00Z',
                'updated_at': '2024-01-20T12:00:00Z'
            }
        ]

    def _get_canvass_sessions(self):
        """Mock canvass sessions data"""
        return [
            {
                'id': str(uuid.uuid4()),
                'walk_list': str(uuid.uuid4()),
                'volunteer': {
                    'id': str(uuid.uuid4()),
                    'email': 'volunteer1@campaign.org',
                    'first_name': 'John',
                    'last_name': 'Doe'
                },
                'questionnaire': str(uuid.uuid4()),
                'start_time': '2024-02-10T09:00:00Z',
                'end_time': '2024-02-10T15:30:00Z',
                'status': 'completed',
                'total_responses': 45,
                'gps_verified_responses': 42,
                'notes': 'Good response rate in this area'
            },
            {
                'id': str(uuid.uuid4()),
                'walk_list': str(uuid.uuid4()),
                'volunteer': {
                    'id': str(uuid.uuid4()),
                    'email': 'volunteer2@campaign.org',
                    'first_name': 'Jane',
                    'last_name': 'Smith'
                },
                'questionnaire': str(uuid.uuid4()),
                'start_time': '2024-02-11T10:00:00Z',
                'end_time': None,
                'status': 'active',
                'total_responses': 12,
                'gps_verified_responses': 11,
                'notes': 'In progress - good participation so far'
            }
        ]

    def _get_user_accounts(self):
        """Mock user accounts data"""
        return [
            {
                'id': str(uuid.uuid4()),
                'email': 'admin@campaign.org',
                'first_name': 'Campaign',
                'last_name': 'Administrator',
                'role': 'owner',
                'is_active': True,
                'date_joined': '2024-01-01T00:00:00Z',
                'last_login': '2024-02-11T08:30:00Z'
            },
            {
                'id': str(uuid.uuid4()),
                'email': 'coordinator@campaign.org',
                'first_name': 'Field',
                'last_name': 'Coordinator',
                'role': 'state',
                'is_active': True,
                'date_joined': '2024-01-05T00:00:00Z',
                'last_login': '2024-02-10T16:45:00Z'
            },
            {
                'id': str(uuid.uuid4()),
                'email': 'volunteer1@campaign.org',
                'first_name': 'John',
                'last_name': 'Doe',
                'role': 'volunteer',
                'is_active': True,
                'date_joined': '2024-01-10T00:00:00Z',
                'last_login': '2024-02-11T09:15:00Z'
            }
        ]

    def _get_user_profile(self):
        """Mock user profile data"""
        return {
            'id': str(uuid.uuid4()),
            'email': 'admin@campaign.org',
            'first_name': 'Campaign',
            'last_name': 'Administrator',
            'role': 'owner',
            'permissions': ['view_all', 'edit_all', 'delete_all', 'manage_users'],
            'preferences': {
                'timezone': 'America/Los_Angeles',
                'notifications': True,
                'theme': 'light'
            },
            'profile_complete': True,
            'last_login': '2024-02-11T08:30:00Z'
        }

    def _get_audiences(self):
        """Mock audiences data"""
        return [
            {
                'id': str(uuid.uuid4()),
                'name': 'Democratic Voters',
                'platform': 'email',
                'filters': {
                    'party_affiliation': 'Democrat',
                    'age_range': '25-65',
                    'voting_history': 'regular'
                },
                'status': 'active',
                'estimated_size': 15420,
                'created_at': '2024-01-10T00:00:00Z',
                'updated_at': '2024-01-15T12:00:00Z'
            },
            {
                'id': str(uuid.uuid4()),
                'name': 'Young Voters',
                'platform': 'sms',
                'filters': {
                    'age_range': '18-30',
                    'registration_status': 'active'
                },
                'status': 'active',
                'estimated_size': 8750,
                'created_at': '2024-01-12T00:00:00Z',
                'updated_at': '2024-01-20T16:30:00Z'
            },
            {
                'id': str(uuid.uuid4()),
                'name': 'Frequent Voters',
                'platform': 'direct_mail',
                'filters': {
                    'voting_frequency': 'high',
                    'party_affiliation': ['Democrat', 'Independent']
                },
                'status': 'draft',
                'estimated_size': 22100,
                'created_at': '2024-01-20T00:00:00Z',
                'updated_at': '2024-01-25T10:15:00Z'
            }
        ]

    def _get_campaigns(self):
        """Mock campaigns data"""
        return [
            {
                'id': str(uuid.uuid4()),
                'name': 'Mayor Smith 2024 Email Campaign',
                'campaign_type': 'awareness',
                'audience': str(uuid.uuid4()),
                'audience_name': 'Democratic Voters',
                'platform': 'email',
                'message_template': 'Support Mayor Smith for continued downtown revitalization...',
                'personalization_data': {
                    'candidate_name': 'Mayor Smith',
                    'election_date': '2024-11-05'
                },
                'scheduled_send': '2024-03-01T09:00:00Z',
                'status': 'running',
                'budget': 5000.00,
                'sent_count': 12420,
                'delivered_count': 12156,
                'opened_count': 4862,
                'clicked_count': 731,
                'conversion_count': 89,
                'created_at': '2024-01-01T00:00:00Z',
                'updated_at': '2024-02-15T14:30:00Z'
            },
            {
                'id': str(uuid.uuid4()),
                'name': 'Young Voter Outreach SMS',
                'campaign_type': 'gotv',
                'audience': str(uuid.uuid4()),
                'audience_name': 'Young Voters',
                'platform': 'sms',
                'message_template': 'Your vote matters! Election Day is Nov 5th. Find your polling location...',
                'personalization_data': {
                    'polling_location': 'dynamic',
                    'early_voting_dates': 'dynamic'
                },
                'scheduled_send': '2024-10-20T08:00:00Z',
                'status': 'scheduled',
                'budget': 2500.00,
                'sent_count': 0,
                'delivered_count': 0,
                'opened_count': 0,
                'clicked_count': 0,
                'conversion_count': 0,
                'created_at': '2024-01-15T00:00:00Z',
                'updated_at': '2024-01-30T16:30:00Z'
            },
            {
                'id': str(uuid.uuid4()),
                'name': 'City Council District 3 Fundraising',
                'campaign_type': 'fundraising',
                'audience': str(uuid.uuid4()),
                'audience_name': 'Frequent Voters',
                'platform': 'direct_mail',
                'message_template': 'Help us represent District 3 with a contribution...',
                'personalization_data': {
                    'suggested_amount': 'dynamic',
                    'district_issues': 'dynamic'
                },
                'scheduled_send': None,
                'status': 'draft',
                'budget': 7500.00,
                'sent_count': 0,
                'delivered_count': 0,
                'opened_count': 0,
                'clicked_count': 0,
                'conversion_count': 0,
                'created_at': '2024-01-25T00:00:00Z',
                'updated_at': '2024-01-25T00:00:00Z'
            }
        ]

    def _get_territories(self):
        """Mock territories data"""
        return [
            {
                'id': str(uuid.uuid4()),
                'name': 'Downtown District',
                'description': 'Central business district and residential area',
                'geometry': {
                    'type': 'Polygon',
                    'coordinates': [[
                        [-121.5, 38.58],
                        [-121.48, 38.58],
                        [-121.48, 38.6],
                        [-121.5, 38.6],
                        [-121.5, 38.58]
                    ]]
                },
                'population': 12500,
                'registered_voters': 8750,
                'area_sq_km': 4.2,
                'precincts': ['P001', 'P002', 'P003'],
                'created_at': '2024-01-01T00:00:00Z',
                'updated_at': '2024-01-15T10:30:00Z'
            },
            {
                'id': str(uuid.uuid4()),
                'name': 'Suburban West',
                'description': 'Western suburban neighborhoods',
                'geometry': {
                    'type': 'Polygon',
                    'coordinates': [[
                        [-121.52, 38.56],
                        [-121.48, 38.56],
                        [-121.48, 38.58],
                        [-121.52, 38.58],
                        [-121.52, 38.56]
                    ]]
                },
                'population': 18200,
                'registered_voters': 13650,
                'area_sq_km': 8.7,
                'precincts': ['P004', 'P005', 'P006', 'P007'],
                'created_at': '2024-01-05T00:00:00Z',
                'updated_at': '2024-01-20T14:45:00Z'
            }
        ]

    def _create_mock_plan(self, data):
        """Create mock redistricting plan"""
        return {
            'id': str(uuid.uuid4()),
            'name': data.get('name', 'New Plan'),
            'description': data.get('description', ''),
            'state': data.get('state', 'CA'),
            'created_by': {
                'id': str(uuid.uuid4()),
                'email': 'admin@campaign.org',
                'first_name': 'Admin',
                'last_name': 'User'
            },
            'created_at': datetime.now(timezone.utc).isoformat(),
            'updated_at': datetime.now(timezone.utc).isoformat(),
            'is_active': data.get('is_active', True),
            'districts': [],
            'status': 'draft',
            'compliance_score': 0.0,
            'population_deviation': 0.0
        }

    def _create_mock_voter(self, data):
        """Create mock voter record"""
        voter_id = data.get('voter_id', f'CA2024{len(str(uuid.uuid4())[:6])}')
        return {
            'id': str(uuid.uuid4()),
            'voter_id': voter_id,
            'name': data.get('name', 'New Voter'),
            'first_name': data.get('first_name', 'First'),
            'last_name': data.get('last_name', 'Last'),
            'address': data.get('address', '123 Main St'),
            'city': data.get('city', 'Sacramento'),
            'state': data.get('state', 'CA'),
            'zip_code': data.get('zip_code', '95814'),
            'email': data.get('email', 'voter@example.com'),
            'phone': data.get('phone', '(916) 555-0000'),
            'date_of_birth': data.get('date_of_birth'),
            'party_affiliation': data.get('party_affiliation', 'Independent'),
            'social_media': data.get('social_media', {}),
            'employment': data.get('employment', {}),
            'data_source': data.get('data_source', 'manual_entry'),
            'latitude': data.get('latitude'),
            'longitude': data.get('longitude'),
            'voter_vuid': data.get('voter_vuid', f'VUID{voter_id}'),
            'voter_registration_date': data.get('voter_registration_date'),
            'voter_registration_status': data.get('voter_registration_status', 'active'),
            'voter_registration_status_reason': data.get('voter_registration_status_reason', ''),
            'voter_precinct_number': data.get('voter_precinct_number', '1'),
            'voter_precinct_name': data.get('voter_precinct_name', 'Precinct 1'),
            'voter_absentee': data.get('voter_absentee', False),
            'created_at': datetime.now(timezone.utc).isoformat(),
            'updated_at': datetime.now(timezone.utc).isoformat()
        }

    def _create_mock_canvassing_item(self, path, data):
        """Create mock canvassing item based on path"""
        item_id = str(uuid.uuid4())
        
        if 'walklists' in path:
            return {
                'id': item_id,
                'name': data.get('name', 'New Walk List'),
                'campaign_id': data.get('campaign_id', str(uuid.uuid4())),
                'volunteer': {
                    'id': data.get('volunteer_id', str(uuid.uuid4())),
                    'email': 'volunteer@campaign.org',
                    'first_name': 'Volunteer',
                    'last_name': 'User'
                },
                'created_by': {
                    'id': str(uuid.uuid4()),
                    'email': 'admin@campaign.org'
                },
                'voter_ids': data.get('voter_ids', []),
                'target_date': data.get('target_date'),
                'status': 'assigned',
                'notes': data.get('notes', ''),
                'created_at': datetime.now(timezone.utc).isoformat(),
                'updated_at': datetime.now(timezone.utc).isoformat(),
                'require_gps_verification': data.get('require_gps_verification', True),
                'max_distance_meters': data.get('max_distance_meters', 1609)
            }
        
        elif 'questionnaires' in path:
            return {
                'id': item_id,
                'name': data.get('name', 'New Questionnaire'),
                'campaign_id': data.get('campaign_id', str(uuid.uuid4())),
                'created_by': {
                    'id': str(uuid.uuid4()),
                    'email': 'admin@campaign.org'
                },
                'questions': data.get('questions', []),
                'is_active': data.get('is_active', True),
                'created_at': datetime.now(timezone.utc).isoformat(),
                'updated_at': datetime.now(timezone.utc).isoformat()
            }
        
        return {'id': item_id, 'success': True}

    def _create_mock_campaign(self, data):
        """Create mock campaign"""
        return {
            'id': str(uuid.uuid4()),
            'name': data.get('name', 'New Campaign'),
            'campaign_type': data.get('campaign_type', 'awareness'),
            'audience': data.get('audience', str(uuid.uuid4())),
            'audience_name': data.get('audience_name', 'New Audience'),
            'platform': data.get('platform', 'email'),
            'message_template': data.get('message_template', 'Campaign message template...'),
            'personalization_data': data.get('personalization_data', {}),
            'scheduled_send': data.get('scheduled_send'),
            'status': data.get('status', 'draft'),
            'budget': data.get('budget', 0.0),
            'sent_count': 0,
            'delivered_count': 0,
            'opened_count': 0,
            'clicked_count': 0,
            'conversion_count': 0,
            'created_at': datetime.now(timezone.utc).isoformat(),
            'updated_at': datetime.now(timezone.utc).isoformat()
        }

    def _create_mock_territory(self, data):
        """Create mock territory"""
        return {
            'id': str(uuid.uuid4()),
            'name': data.get('name', 'New Territory'),
            'description': data.get('description', ''),
            'geometry': data.get('geometry', {}),
            'population': data.get('population', 0),
            'registered_voters': data.get('registered_voters', 0),
            'area_sq_km': data.get('area_sq_km', 0.0),
            'precincts': data.get('precincts', []),
            'created_at': datetime.now(timezone.utc).isoformat(),
            'updated_at': datetime.now(timezone.utc).isoformat()
        }

    def _create_mock_user(self, data):
        """Create mock user"""
        return {
            'id': str(uuid.uuid4()),
            'email': data.get('email', 'user@example.com'),
            'first_name': data.get('first_name', 'New'),
            'last_name': data.get('last_name', 'User'),
            'role': data.get('role', 'volunteer'),
            'is_active': data.get('is_active', True),
            'date_joined': datetime.now(timezone.utc).isoformat(),
            'last_login': None
        }

    def log_message(self, format, *args):
        """Override to reduce console spam"""
        pass

def run_server(port=8000):
    """Run the development API server"""
    server_address = ('', port)
    httpd = HTTPServer(server_address, MockAPIHandler)
    print(f"Development API server running on http://localhost:{port}")
    print("Providing mock data for:")
    print("  - /api/redistricting/plans/")
    print("  - /api/voter-data/voters/")
    print("  - /api/canvassing/walklists/")
    print("  - /api/canvassing/questionnaires/")
    print("  - /api/canvassing/sessions/")
    print("  - /api/users/accounts/")
    print("  - /api/campaigns/campaigns/")
    print("  - /api/territories/territories/")
    print("\nPress Ctrl+C to stop the server")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server...")
        httpd.server_close()

if __name__ == '__main__':
    run_server()