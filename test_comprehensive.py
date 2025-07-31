"""
Comprehensive test suite for VEP Django System
Tests all major features and API endpoints
"""

import pytest
from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.contrib.gis.geos import Point, Polygon
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
import json

# Import models from all apps
from users.models import User, AuthPIN
from voter_data.models import VoterRecord
from territories.models import Territory, WalkListTerritory, TerritoryAssignment
from forms.models import FormTemplate, FormField, FormResponse
from canvassing.models import CanvassResponse, CanvassSession
from analytics.models import AnalyticsQuery, AnalyticsDashboard
from redistricting.models import RedistrictingPlan, District

User = get_user_model()


class BaseTestCase(APITestCase):
    """Base test case with common setup."""
    
    def setUp(self):
        self.client = APIClient()
        
        # Create test users
        self.owner_user = User.objects.create_user(
            phone_number='+15551234567',
            role='owner',
            is_verified=True
        )
        
        self.campaign_user = User.objects.create_user(
            phone_number='+15551234568',
            role='campaign',
            is_verified=True
        )
        
        self.volunteer_user = User.objects.create_user(
            phone_number='+15551234569',
            role='campaign',
            is_verified=True
        )
        
        # Create test voter
        self.test_voter = VoterRecord.objects.create(
            voter_id='TEST001',
            name='John Doe',
            address='123 Main St',
            city='Testville',
            state='TX',
            zip_code='12345',
            location=Point(-97.7431, 30.2672),  # Austin, TX
            account_owner=self.owner_user
        )


class UserAuthenticationTests(BaseTestCase):
    """Test user authentication and authorization."""
    
    def test_user_creation(self):
        """Test creating users with different roles."""
        self.assertEqual(self.owner_user.role, 'owner')
        self.assertEqual(self.campaign_user.role, 'campaign')
        self.assertTrue(self.owner_user.is_verified)
    
    def test_pin_generation(self):
        """Test PIN generation for authentication."""
        pin = AuthPIN.objects.create(user=self.owner_user)
        self.assertEqual(len(pin.pin), 6)
        self.assertTrue(pin.is_valid())
    
    def test_user_api_access(self):
        """Test API access with authentication."""
        self.client.force_authenticate(user=self.owner_user)
        response = self.client.get('/api/users/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class VoterDataTests(BaseTestCase):
    """Test voter data management."""
    
    def test_voter_creation(self):
        """Test creating voter records."""
        self.assertEqual(self.test_voter.name, 'John Doe')
        self.assertEqual(self.test_voter.state, 'TX')
        self.assertIsInstance(self.test_voter.location, Point)
    
    def test_voter_spatial_queries(self):
        """Test spatial queries on voter data."""
        # Create another voter nearby
        nearby_voter = VoterRecord.objects.create(
            voter_id='TEST002',
            name='Jane Smith',
            location=Point(-97.7435, 30.2675),  # Close to first voter
            account_owner=self.owner_user
        )
        
        # Test distance-based query
        center_point = Point(-97.7433, 30.2673)
        nearby_voters = VoterRecord.objects.filter(
            location__distance_lte=(center_point, 1000)  # Within 1km
        )
        
        self.assertEqual(nearby_voters.count(), 2)
    
    def test_voter_api_endpoints(self):
        """Test voter data API endpoints."""
        self.client.force_authenticate(user=self.owner_user)
        
        # Test list voters
        response = self.client.get('/api/voter-data/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Test create voter
        voter_data = {
            'voter_id': 'TEST003',
            'name': 'Bob Johnson',
            'address': '456 Oak Ave',
            'city': 'Testville',
            'state': 'TX',
            'zip_code': '12345',
            'latitude': 30.2680,
            'longitude': -97.7440
        }
        response = self.client.post('/api/voter-data/', voter_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)


class TerritoryManagementTests(BaseTestCase):
    """Test territory and spatial features."""
    
    def setUp(self):
        super().setUp()
        
        # Create test territory
        self.test_territory = Territory.objects.create(
            name='Test Precinct 1',
            territory_type='precinct',
            boundary=Polygon(((
                (-97.750, 30.260), (-97.740, 30.260),
                (-97.740, 30.270), (-97.750, 30.270),
                (-97.750, 30.260)
            ))),
            created_by=self.owner_user,
            status='active'
        )
    
    def test_territory_creation(self):
        """Test creating territories with spatial boundaries."""
        self.assertEqual(self.test_territory.name, 'Test Precinct 1')
        self.assertEqual(self.test_territory.territory_type, 'precinct')
        self.assertIsInstance(self.test_territory.boundary, Polygon)
        self.assertIsNotNone(self.test_territory.center_point)
    
    def test_territory_voter_assignment(self):
        """Test assigning voters to territories."""
        self.client.force_authenticate(user=self.owner_user)
        
        # Assign voters to territory
        response = self.client.post(
            f'/api/territories/territories/{self.test_territory.id}/assign-voters/'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check assignment was created
        assignment = TerritoryAssignment.objects.filter(
            territory=self.test_territory,
            voter_id=self.test_voter.id
        ).first()
        self.assertIsNotNone(assignment)
    
    def test_spatial_voter_query(self):
        """Test spatial queries for voters within territories."""
        self.client.force_authenticate(user=self.owner_user)
        
        response = self.client.get(
            f'/api/territories/territories/{self.test_territory.id}/spatial-query/',
            {'buffer_meters': 500}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('voters', response.data)
    
    def test_walk_list_creation(self):
        """Test creating walk lists with GPS settings."""
        self.client.force_authenticate(user=self.owner_user)
        
        walk_list_data = {
            'name': 'Test Walk List',
            'territory': self.test_territory.id,
            'volunteer': self.volunteer_user.id,
            'require_gps_verification': True,
            'max_distance_meters': 1609,  # 1 mile
        }
        
        response = self.client.post('/api/territories/walk-lists/', walk_list_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)


class DynamicFormsTests(BaseTestCase):
    """Test dynamic forms system."""
    
    def setUp(self):
        super().setUp()
        
        # Create test form template
        self.form_template = FormTemplate.objects.create(
            name='Test Survey',
            form_type='survey',
            description='Test survey form',
            created_by=self.owner_user,
            status='active'
        )
        
        # Add form fields
        self.text_field = FormField.objects.create(
            form_template=self.form_template,
            field_name='voter_name',
            field_type='text',
            label='Voter Name',
            is_required=True,
            order=1
        )
        
        self.choice_field = FormField.objects.create(
            form_template=self.form_template,
            field_name='support_level',
            field_type='radio',
            label='Support Level',
            options=[
                {'label': 'Strong Support', 'value': 'strong_support'},
                {'label': 'Lean Support', 'value': 'lean_support'},
                {'label': 'Undecided', 'value': 'undecided'},
                {'label': 'Lean Oppose', 'value': 'lean_oppose'},
                {'label': 'Strong Oppose', 'value': 'strong_oppose'}
            ],
            is_required=True,
            order=2
        )
    
    def test_form_template_creation(self):
        """Test creating form templates with fields."""
        self.assertEqual(self.form_template.name, 'Test Survey')
        self.assertEqual(self.form_template.form_fields.count(), 2)
    
    def test_form_rendering(self):
        """Test rendering form structure."""
        self.client.force_authenticate(user=self.owner_user)
        
        response = self.client.get(f'/api/forms/templates/{self.form_template.id}/render/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        form_data = response.data
        self.assertEqual(form_data['name'], 'Test Survey')
        self.assertEqual(len(form_data['fields']), 2)
    
    def test_form_submission(self):
        """Test submitting form responses."""
        self.client.force_authenticate(user=self.volunteer_user)
        
        submission_data = {
            'voter_name': 'John Doe',
            'support_level': 'strong_support',
            'location': {
                'latitude': 30.2672,
                'longitude': -97.7431,
                'accuracy': 10
            }
        }
        
        response = self.client.post(
            f'/api/forms/templates/{self.form_template.id}/submit/',
            submission_data,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Check response was created
        form_response = FormResponse.objects.filter(
            form_template=self.form_template
        ).first()
        self.assertIsNotNone(form_response)
        self.assertEqual(form_response.response_data['voter_name'], 'John Doe')
    
    def test_form_field_types(self):
        """Test different form field types."""
        self.client.force_authenticate(user=self.owner_user)
        
        response = self.client.get('/api/forms/builder/field-types/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        field_types = response.data['field_types']
        self.assertGreater(len(field_types), 10)
        
        # Check for required field types
        type_values = [ft['value'] for ft in field_types]
        required_types = ['text', 'email', 'select', 'radio', 'checkbox', 'date', 'location']
        for req_type in required_types:
            self.assertIn(req_type, type_values)


class CanvassingTests(BaseTestCase):
    """Test canvassing functionality with GPS verification."""
    
    def setUp(self):
        super().setUp()
        
        # Create territory and walk list
        self.territory = Territory.objects.create(
            name='Canvass Territory',
            territory_type='walklist',
            boundary=Polygon(((
                (-97.750, 30.260), (-97.740, 30.260),
                (-97.740, 30.270), (-97.750, 30.270),
                (-97.750, 30.260)
            ))),
            created_by=self.owner_user
        )
        
        self.walk_list = WalkListTerritory.objects.create(
            name='Test Walk List',
            territory=self.territory,
            volunteer=self.volunteer_user,
            created_by=self.owner_user,
            require_gps_verification=True,
            max_distance_meters=100
        )
        
        # Create questionnaire
        self.questionnaire = FormTemplate.objects.create(
            name='Canvass Survey',
            form_type='survey',
            created_by=self.owner_user,
            status='active'
        )
    
    def test_canvass_session_creation(self):
        """Test creating canvassing sessions."""
        from canvassing.models import CanvassSession
        
        session = CanvassSession.objects.create(
            walk_list=self.walk_list,
            volunteer=self.volunteer_user,
            start_location=Point(-97.7445, 30.2665),
            status='active'
        )
        
        self.assertEqual(session.status, 'active')
        self.assertEqual(session.volunteer, self.volunteer_user)
    
    def test_gps_verification(self):
        """Test GPS distance verification for canvassing."""
        from canvassing.models import CanvassResponse
        
        # Test response within allowed distance
        close_response = CanvassResponse.objects.create(
            questionnaire=self.questionnaire,
            walk_list=self.walk_list,
            voter_id=self.test_voter.id,
            volunteer=self.volunteer_user,
            submission_location=Point(-97.7432, 30.2673),  # Very close to voter
            target_location=self.test_voter.location,
            contact_attempted=True,
            contact_made=True
        )
        
        self.assertTrue(close_response.is_location_verified)
        self.assertLess(close_response.distance_to_target_meters, 100)
        
        # Test response outside allowed distance
        far_response = CanvassResponse.objects.create(
            questionnaire=self.questionnaire,
            walk_list=self.walk_list,
            voter_id=self.test_voter.id,
            volunteer=self.volunteer_user,
            submission_location=Point(-97.7500, 30.2700),  # Far from voter
            target_location=self.test_voter.location,
            contact_attempted=True,
            contact_made=False
        )
        
        self.assertFalse(far_response.is_location_verified)
        self.assertGreater(far_response.distance_to_target_meters, 100)


class AnalyticsTests(BaseTestCase):
    """Test analytics and AI features."""
    
    def test_nlp_query_processing(self):
        """Test natural language query processing."""
        self.client.force_authenticate(user=self.owner_user)
        
        query_data = {
            'query': 'Show me voter turnout by precinct',
            'query_type': 'geographic_analysis'
        }
        
        response = self.client.post('/api/analytics/nlp-query/', query_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check query was processed
        self.assertIn('query_id', response.data)
        self.assertIn('result_data', response.data)
        self.assertIn('insights', response.data)
    
    def test_dashboard_creation(self):
        """Test creating analytics dashboards."""
        self.client.force_authenticate(user=self.owner_user)
        
        dashboard_data = {
            'name': 'Campaign Dashboard',
            'dashboard_type': 'campaign_overview',
            'description': 'Main campaign analytics dashboard'
        }
        
        response = self.client.post('/api/analytics/dashboards/', dashboard_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    
    def test_widget_management(self):
        """Test dashboard widget management."""
        # Create dashboard first
        dashboard = AnalyticsDashboard.objects.create(
            name='Test Dashboard',
            dashboard_type='custom',
            created_by=self.owner_user
        )
        
        self.client.force_authenticate(user=self.owner_user)
        
        widget_data = {
            'dashboard': dashboard.id,
            'title': 'Voter Count',
            'widget_type': 'metric',
            'position_x': 0,
            'position_y': 0,
            'width': 4,
            'height': 3,
            'data_source': 'voters',
            'chart_config': {'type': 'metric', 'valueKey': 'count'}
        }
        
        response = self.client.post('/api/analytics/widgets/', widget_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)


class RedistrictingTests(BaseTestCase):
    """Test redistricting functionality."""
    
    def setUp(self):
        super().setUp()
        
        # Create redistricting plan
        self.plan = RedistrictingPlan.objects.create(
            name='Test Redistricting Plan',
            plan_type='congressional',
            state='TX',
            target_districts=3,
            created_by=self.owner_user,
            status='draft'
        )
        
        # Create test districts
        self.district1 = District.objects.create(
            plan=self.plan,
            district_number=1,
            name='District 1',
            boundary=Polygon(((
                (-97.760, 30.250), (-97.750, 30.250),
                (-97.750, 30.260), (-97.760, 30.260),
                (-97.760, 30.250)
            ))),
            total_population=750000
        )
        
        self.district2 = District.objects.create(
            plan=self.plan,
            district_number=2,
            name='District 2',
            boundary=Polygon(((
                (-97.750, 30.250), (-97.740, 30.250),
                (-97.740, 30.260), (-97.750, 30.260),
                (-97.750, 30.250)
            ))),
            total_population=755000
        )
    
    def test_plan_creation(self):
        """Test creating redistricting plans."""
        self.assertEqual(self.plan.name, 'Test Redistricting Plan')
        self.assertEqual(self.plan.districts.count(), 2)
        self.assertEqual(self.plan.target_districts, 3)
    
    def test_plan_validation(self):
        """Test redistricting plan validation."""
        self.client.force_authenticate(user=self.owner_user)
        
        response = self.client.post(f'/api/redistricting/plans/{self.plan.id}/validate/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        validation_data = response.data
        self.assertIn('is_valid', validation_data)
        self.assertIn('errors', validation_data)
        self.assertIn('warnings', validation_data)
    
    def test_plan_metrics_calculation(self):
        """Test calculating plan metrics."""
        self.client.force_authenticate(user=self.owner_user)
        
        response = self.client.post(f'/api/redistricting/plans/{self.plan.id}/calculate-metrics/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        metrics = response.data['metrics']
        self.assertIn('max_population_deviation', metrics)
        self.assertIn('contiguous_districts', metrics)
        self.assertIn('overall_score', metrics)
    
    def test_plan_export(self):
        """Test exporting redistricting plans."""
        self.client.force_authenticate(user=self.owner_user)
        
        # Test GeoJSON export
        response = self.client.post(f'/api/redistricting/plans/{self.plan.id}/export/geojson/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        export_data = response.data
        self.assertEqual(export_data['format'], 'geojson')
        self.assertIn('data', export_data)
        
        # Validate GeoJSON structure
        geojson = export_data['data']
        self.assertEqual(geojson['type'], 'FeatureCollection')
        self.assertEqual(len(geojson['features']), 2)


class IntegrationTests(BaseTestCase):
    """Test integration between different modules."""
    
    def test_end_to_end_canvassing_workflow(self):
        """Test complete canvassing workflow from territory to response."""
        self.client.force_authenticate(user=self.owner_user)
        
        # 1. Create territory
        territory_data = {
            'name': 'Integration Test Territory',
            'territory_type': 'walklist',
            'boundary': {
                'type': 'Polygon',
                'coordinates': [[
                    [-97.750, 30.260], [-97.740, 30.260],
                    [-97.740, 30.270], [-97.750, 30.270],
                    [-97.750, 30.260]
                ]]
            }
        }
        
        territory_response = self.client.post('/api/territories/territories/', territory_data)
        self.assertEqual(territory_response.status_code, status.HTTP_201_CREATED)
        territory_id = territory_response.data['id']
        
        # 2. Assign voters to territory
        assign_response = self.client.post(f'/api/territories/territories/{territory_id}/assign-voters/')
        self.assertEqual(assign_response.status_code, status.HTTP_200_OK)
        
        # 3. Create walk list
        walk_list_data = {
            'name': 'Integration Walk List',
            'territory': territory_id,
            'volunteer': self.volunteer_user.id,
            'require_gps_verification': True
        }
        
        walk_list_response = self.client.post('/api/territories/walk-lists/', walk_list_data)
        self.assertEqual(walk_list_response.status_code, status.HTTP_201_CREATED)
        walk_list_id = walk_list_response.data['id']
        
        # 4. Create survey form
        form_data = {
            'name': 'Integration Survey',
            'form_type': 'survey',
            'status': 'active'
        }
        
        form_response = self.client.post('/api/forms/templates/', form_data)
        self.assertEqual(form_response.status_code, status.HTTP_201_CREATED)
        form_id = form_response.data['id']
        
        # 5. Submit canvass response
        self.client.force_authenticate(user=self.volunteer_user)
        
        canvass_data = {
            'voter_name': 'John Doe',
            'contact_attempted': True,
            'contact_made': True,
            'walk_list_id': walk_list_id,
            'voter_id': str(self.test_voter.id),
            'location': {
                'latitude': 30.2672,
                'longitude': -97.7431,
                'accuracy': 5
            }
        }
        
        submit_response = self.client.post(f'/api/forms/templates/{form_id}/submit/', canvass_data)
        self.assertEqual(submit_response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(submit_response.data['is_gps_verified'])
    
    def test_analytics_integration(self):
        """Test analytics integration with other modules."""
        self.client.force_authenticate(user=self.owner_user)
        
        # Create some test data first
        for i in range(5):
            VoterRecord.objects.create(
                voter_id=f'ANALYTICS_TEST_{i}',
                name=f'Test Voter {i}',
                party_affiliation='Democratic' if i % 2 == 0 else 'Republican',
                location=Point(-97.7430 + i * 0.001, 30.2670 + i * 0.001),
                account_owner=self.owner_user
            )
        
        # Test NLP query about the data
        query_data = {
            'query': 'Show me the breakdown of voters by party affiliation',
            'query_type': 'demographic_analysis'
        }
        
        response = self.client.post('/api/analytics/nlp-query/', query_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify insights were generated
        self.assertIn('insights', response.data)
        self.assertGreater(len(response.data['insights']), 0)


class PerformanceTests(BaseTestCase):
    """Test system performance with larger datasets."""
    
    def test_bulk_voter_creation(self):
        """Test creating large numbers of voters."""
        self.client.force_authenticate(user=self.owner_user)
        
        # Create 100 test voters
        voters_data = []
        for i in range(100):
            voters_data.append({
                'voter_id': f'BULK_TEST_{i}',
                'name': f'Bulk Voter {i}',
                'latitude': 30.2670 + (i * 0.0001),
                'longitude': -97.7430 + (i * 0.0001)
            })
        
        # Test bulk creation (would need bulk endpoint in real implementation)
        for voter_data in voters_data[:10]:  # Test first 10
            response = self.client.post('/api/voter-data/', voter_data)
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify spatial queries still perform well
        response = self.client.get('/api/voter-data/', {
            'lat': 30.2670,
            'lng': -97.7430,
            'radius': 1000
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_large_territory_operations(self):
        """Test operations on territories with many voters."""
        # Create territory with complex boundary
        complex_boundary = Polygon(((
            (-97.800, 30.200), (-97.700, 30.200), (-97.700, 30.220),
            (-97.750, 30.250), (-97.800, 30.250), (-97.800, 30.200)
        )))
        
        territory = Territory.objects.create(
            name='Large Territory',
            territory_type='district',
            boundary=complex_boundary,
            created_by=self.owner_user
        )
        
        self.client.force_authenticate(user=self.owner_user)
        
        # Test spatial query on large territory
        response = self.client.get(
            f'/api/territories/territories/{territory.id}/spatial-query/',
            {'limit': 100}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)


if __name__ == '__main__':
    pytest.main([__file__])
