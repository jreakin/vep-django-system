import os
import django
from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.urls import reverse
from campaigns.models import Campaign, Audience
import json

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'CampaignManager.settings')
django.setup()

User = get_user_model()


class PoliticalCampaignJSIntegrationTest(TestCase):
    """Test Django Political Campaigns JS integration"""
    
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(
            phone_number='+1234567890',
            role='campaign',
            email='test@example.com'
        )
        self.client.force_login(self.user)
        
        # Create test audience
        self.audience = Audience.objects.create(
            name='Test Audience',
            platform='email',
            account=self.user,
            filters={'age_min': 18},
            status='active',
            estimated_size=100
        )

    def test_campaign_management_view_loads(self):
        """Test that the campaign management view loads successfully"""
        response = self.client.get(reverse('campaign_management'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'Campaign Dashboard')
        self.assertContains(response, 'django-political-campaigns.js')

    def test_audiences_api_endpoint(self):
        """Test the audiences API endpoint"""
        response = self.client.get('/api/campaigns/api/audiences/')
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        # DRF returns paginated results
        if 'results' in data:
            results = data['results']
            self.assertIsInstance(results, list)
            if results:  # If audiences exist
                self.assertIn('id', results[0])
                self.assertIn('name', results[0])
                self.assertIn('platform', results[0])
        else:
            # Fallback for simple list response
            self.assertIsInstance(data, list)

    def test_campaigns_api_endpoint(self):
        """Test the campaigns API endpoint"""
        response = self.client.get('/api/campaigns/api/campaigns/')
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        # DRF returns paginated results
        if 'results' in data:
            results = data['results']
            self.assertIsInstance(results, list)
        else:
            # Fallback for simple list response
            self.assertIsInstance(data, list)

    def test_create_campaign_via_api(self):
        """Test creating a campaign via the API"""
        campaign_data = {
            'name': 'Test Campaign',
            'campaign_type': 'awareness',
            'audience': str(self.audience.id),
            'message_template': 'Hello {first_name}, please vote!'
        }
        
        response = self.client.post(
            '/api/campaigns/api/campaigns/',
            data=json.dumps(campaign_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertIn('name', data)
        self.assertEqual(data['name'], 'Test Campaign')

    def test_javascript_file_exists(self):
        """Test that the JavaScript file exists and is accessible"""
        import os
        js_path = os.path.join(
            os.path.dirname(__file__),
            'static', 'js', 'django-political-campaigns.js'
        )
        self.assertTrue(os.path.exists(js_path), f"JavaScript file not found at {js_path}")
        
        # Check that it contains key class
        with open(js_path, 'r') as f:
            content = f.read()
            self.assertIn('class PoliticalCampaignManager', content)
            self.assertIn('loadCampaigns', content)
            self.assertIn('loadAudiences', content)

    def test_campaign_start_functionality(self):
        """Test starting a campaign"""
        # Create a campaign first
        campaign = Campaign.objects.create(
            name='Test Campaign',
            campaign_type='awareness',
            account=self.user,
            audience=self.audience,
            message_template='Test message',
            status='draft'
        )
        
        # Try to start it
        response = self.client.post(f'/api/campaigns/api/campaigns/{campaign.id}/start/')
        self.assertEqual(response.status_code, 200)
        
        # Check that status changed
        campaign.refresh_from_db()
        self.assertEqual(campaign.status, 'running')

    def test_campaign_pause_functionality(self):
        """Test pausing a campaign"""
        # Create a running campaign
        campaign = Campaign.objects.create(
            name='Test Campaign',
            campaign_type='awareness',
            account=self.user,
            audience=self.audience,
            message_template='Test message',
            status='running'
        )
        
        # Try to pause it
        response = self.client.post(f'/api/campaigns/api/campaigns/{campaign.id}/pause/')
        self.assertEqual(response.status_code, 200)
        
        # Check that status changed
        campaign.refresh_from_db()
        self.assertEqual(campaign.status, 'paused')

    def test_csrf_token_handling(self):
        """Test that CSRF tokens are properly handled"""
        response = self.client.get('/api/campaigns/')
        self.assertEqual(response.status_code, 200)
        
        # Check that CSRF token is available in the response
        self.assertContains(response, 'csrftoken')


if __name__ == '__main__':
    import unittest
    unittest.main()