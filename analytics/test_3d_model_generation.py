from django.test import TestCase
from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
import json


class Generate3DModelViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)
        self.url = reverse('generate-3d-model')

    def test_generate_3d_model_requires_authentication(self):
        """Test that the endpoint requires authentication"""
        client = APIClient()  # Unauthenticated client
        response = client.post(self.url, {'campaign_id': 'test-campaign'})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_generate_3d_model_requires_campaign_id(self):
        """Test that campaign_id is required"""
        response = self.client.post(self.url, {})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('campaign_id is required', response.data['error'])

    def test_generate_3d_model_geographic_type(self):
        """Test generating geographic 3D model"""
        data = {
            'campaign_id': 'test-campaign-123',
            'data_type': 'geographic',
            'zip_codes': ['10001', '10002']
        }
        
        response = self.client.post(self.url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'model/vnd.usdz+zip')
        self.assertIn('campaign_test-campaign-123_geographic_3d_model.usdz', 
                      response['Content-Disposition'])
        self.assertEqual(response['X-Model-Type'], 'geographic')
        self.assertEqual(response['X-Campaign-ID'], 'test-campaign-123')

    def test_generate_3d_model_demographic_type(self):
        """Test generating demographic 3D model"""
        data = {
            'campaign_id': 'test-campaign-456',
            'data_type': 'demographic'
        }
        
        response = self.client.post(self.url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'model/vnd.usdz+zip')
        self.assertEqual(response['X-Model-Type'], 'demographic')

    def test_generate_3d_model_turnout_type(self):
        """Test generating turnout prediction 3D model"""
        data = {
            'campaign_id': 'test-campaign-789',
            'data_type': 'turnout'
        }
        
        response = self.client.post(self.url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'model/vnd.usdz+zip')
        self.assertEqual(response['X-Model-Type'], 'turnout')

    def test_generate_3d_model_default_data_type(self):
        """Test that default data type is geographic"""
        data = {
            'campaign_id': 'test-campaign-default'
        }
        
        response = self.client.post(self.url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['X-Model-Type'], 'geographic')

    def test_generate_3d_model_content_contains_usd(self):
        """Test that the generated file contains USD content"""
        data = {
            'campaign_id': 'test-campaign-content',
            'data_type': 'geographic'
        }
        
        response = self.client.post(self.url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Read the response content
        content = b''.join(response.streaming_content)
        content_str = content.decode('utf-8')
        
        # Check for USD file structure
        self.assertIn('#usda 1.0', content_str)
        self.assertIn('CampaignVisualization', content_str)
        self.assertIn('defaultPrim', content_str)


class Generate3DModelHelperFunctionTests(TestCase):
    def test_generate_campaign_3d_data_geographic(self):
        """Test geographic data generation"""
        from analytics.views import generate_campaign_3d_data
        
        result = generate_campaign_3d_data('test-campaign', 'geographic', [])
        
        self.assertEqual(result['type'], 'geographic_heatmap')
        self.assertIn('regions', result)
        self.assertIn('scale_factor', result)
        self.assertIn('center', result)
        self.assertTrue(len(result['regions']) > 0)

    def test_generate_campaign_3d_data_demographic(self):
        """Test demographic data generation"""
        from analytics.views import generate_campaign_3d_data
        
        result = generate_campaign_3d_data('test-campaign', 'demographic', [])
        
        self.assertEqual(result['type'], 'demographic_bars')
        self.assertIn('categories', result)
        self.assertIn('scale_factor', result)
        self.assertTrue(len(result['categories']) > 0)

    def test_generate_campaign_3d_data_turnout(self):
        """Test turnout data generation"""
        from analytics.views import generate_campaign_3d_data
        
        result = generate_campaign_3d_data('test-campaign', 'turnout', [])
        
        self.assertEqual(result['type'], 'turnout_prediction')
        self.assertIn('precincts', result)
        self.assertIn('scale_factor', result)
        self.assertTrue(len(result['precincts']) > 0)

    def test_create_usdz_file_geographic(self):
        """Test USDZ file creation for geographic data"""
        from analytics.views import create_usdz_file, generate_campaign_3d_data
        
        model_data = generate_campaign_3d_data('test', 'geographic', [])
        usdz_content = create_usdz_file(model_data)
        
        self.assertIsInstance(usdz_content, bytes)
        content_str = usdz_content.decode('utf-8')
        self.assertIn('#usda 1.0', content_str)
        self.assertIn('Region_', content_str)
        self.assertIn('RegionMaterial_', content_str)

    def test_create_usdz_file_demographic(self):
        """Test USDZ file creation for demographic data"""
        from analytics.views import create_usdz_file, generate_campaign_3d_data
        
        model_data = generate_campaign_3d_data('test', 'demographic', [])
        usdz_content = create_usdz_file(model_data)
        
        self.assertIsInstance(usdz_content, bytes)
        content_str = usdz_content.decode('utf-8')
        self.assertIn('#usda 1.0', content_str)
        self.assertIn('Category_', content_str)
        self.assertIn('CategoryMaterial_', content_str)

    def test_create_usdz_file_turnout(self):
        """Test USDZ file creation for turnout data"""
        from analytics.views import create_usdz_file, generate_campaign_3d_data
        
        model_data = generate_campaign_3d_data('test', 'turnout', [])
        usdz_content = create_usdz_file(model_data)
        
        self.assertIsInstance(usdz_content, bytes)
        content_str = usdz_content.decode('utf-8')
        self.assertIn('#usda 1.0', content_str)
        self.assertIn('Precinct_', content_str)
        self.assertIn('PrecinctMaterial_', content_str)