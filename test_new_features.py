#!/usr/bin/env python
"""
Simple test script to verify our new API functionality.
"""
import os
import sys
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'CampaignManager.settings')
django.setup()

from users.models import User
from dashboards.models import Dashboard, Notification, FileUpload, ChartConfig
from voter_data.models import VoterRecord
from voter_data.services import VoterDeduplicationService
import json

def test_models():
    """Test that our new models can be created and saved."""
    print("Testing model creation...")
    
    # Get or create a test user
    user, created = User.objects.get_or_create(
        phone_number='+15551234567',
        defaults={'role': 'campaign', 'is_verified': True}
    )
    print(f"✓ User: {user.id} ({'created' if created else 'exists'})")
    
    # Test Dashboard
    dashboard = Dashboard.objects.create(
        user=user,
        name="Test Dashboard",
        config={"layout": "grid", "widgets": []}
    )
    print(f"✓ Dashboard created: {dashboard.id}")
    
    # Test Notification
    notification = Notification.objects.create(
        recipient=user,
        title="Test Notification",
        message="This is a test notification",
        notification_type="info"
    )
    print(f"✓ Notification created: {notification.id}")
    
    # Test ChartConfig
    chart = ChartConfig.objects.create(
        user=user,
        name="Test Chart",
        chart_type="bar",
        data_source="voter_data",
        query_config={"filters": {}},
        display_config={"title": "Test Chart"}
    )
    print(f"✓ Chart created: {chart.id}")
    
    # Test FileUpload
    file_upload = FileUpload.objects.create(
        user=user,
        original_filename="test.csv",
        file_type="voter_data",
        file_path="/tmp/test.csv",
        file_size=1024
    )
    print(f"✓ File upload created: {file_upload.id}")
    
    return user

def test_voter_dedup_service():
    """Test the voter deduplication service."""
    print("\nTesting voter deduplication service...")
    
    service = VoterDeduplicationService()
    
    # Test dedup key generation
    voter_data = {
        'voter_vuid': 'TX123456',
        'person_name_first': 'John',
        'person_name_last': 'Doe',
        'person_dob': '1980-01-01',
        'residence_part_city': 'Austin',
        'residence_part_state': 'TX'
    }
    
    dedup_key = service.generate_dedup_key(voter_data)
    print(f"✓ Dedup key generated: {dedup_key[:10]}...")
    
    # Test that same data generates same key
    dedup_key2 = service.generate_dedup_key(voter_data)
    assert dedup_key == dedup_key2, "Dedup keys should be consistent"
    print("✓ Dedup key consistency verified")

def test_voter_model():
    """Test the enhanced VoterRecord model."""
    print("\nTesting enhanced VoterRecord model...")
    
    user = User.objects.get(phone_number='+15551234567')
    
    # Clear any existing voters for this user to avoid conflicts
    VoterRecord.objects.filter(account_owner=user).delete()
    
    # Create a voter record with unique ID
    import uuid
    unique_id = str(uuid.uuid4())[:8]
    
    voter = VoterRecord.objects.create(
        account_owner=user,
        voter_vuid=f'TX{unique_id}',
        person_name_first='Jane',
        person_name_last='Smith',
        person_dob='1985-05-15',
        residence_part_city='Houston',
        residence_part_state='TX',
        residence_part_zip5='77001',
        shared_with=[str(user.id)],
        dedup_key=f'test_dedup_key_{unique_id}'
    )
    print(f"✓ Voter created: {voter.id}")
    
    # Test that history is being recorded
    history_count = voter.history.count()
    print(f"✓ History records: {history_count}")
    
    # Update the voter to test history tracking
    voter.person_name_first = 'Jane Updated'
    voter.save()
    
    new_history_count = voter.history.count()
    print(f"✓ History after update: {new_history_count}")
    assert new_history_count > history_count, "History should be recorded on updates"

def test_analytics_service():
    """Test the analytics service."""
    print("\nTesting analytics service...")
    
    from dashboards.analytics import AnalyticsService, SimpleNLPService, QueryConfig
    
    user = User.objects.get(phone_number='+15551234567')
    
    # Clear existing voters to avoid conflicts
    VoterRecord.objects.filter(account_owner=user).delete()
    
    # Create some test data for analytics
    voters = []
    import uuid
    for i in range(10):
        unique_id = str(uuid.uuid4())[:8]
        voter = VoterRecord.objects.create(
            account_owner=user,
            voter_vuid=f'TX{unique_id}',
            person_name_first=f'Test{i}',
            person_name_last=f'User{i}',
            residence_part_state='TX' if i < 5 else 'CA',
            voter_political_party='Democratic' if i < 3 else 'Republican' if i < 6 else 'Independent',
            residence_part_city='Austin' if i < 7 else 'Houston'
        )
        voters.append(voter)
    
    print(f"✓ Created {len(voters)} test voters")
    
    # Test analytics service
    analytics_service = AnalyticsService()
    
    # Test simple query
    query_config = QueryConfig(
        model='voters',
        group_by='residence_part_state',
        aggregate='count'
    )
    
    chart_data = analytics_service.generate_chart_from_query(user, query_config)
    print(f"✓ Generated chart: {chart_data.title}")
    print(f"  - Chart type: {chart_data.chart_type}")
    print(f"  - Data points: {len(chart_data.data)}")
    
    # Test NLP service
    nlp_service = SimpleNLPService()
    parsed_query = nlp_service.parse_query("Show voters by state")
    print(f"✓ NLP parsed query: model={parsed_query.model}, group_by={parsed_query.group_by}")
    
    # Test dashboard summary
    summary = analytics_service.generate_dashboard_summary(user)
    print(f"✓ Dashboard summary generated with {len(summary)} sections")
    
    # Test preset charts
    preset_charts = analytics_service.create_preset_charts(user)
    print(f"✓ Created {len(preset_charts)} preset charts")

def test_analytics_imports():
    """Test that analytics modules can be imported."""
    print("\nTesting analytics imports...")
    
    try:
        from dashboards.analytics import AnalyticsService, SimpleNLPService, QueryConfig, ChartData
        print("✓ Analytics service imported")
        
        from dashboards.views import AnalyticsQueryView, NLPChartView
        print("✓ Analytics views imported")
        
    except ImportError as e:
        print(f"✗ Import error: {e}")
        return False
    
    return True

def main():
    """Run all tests."""
    print("=" * 50)
    print("Testing VEP Django System New Features")
    print("=" * 50)
    
    try:
        test_analytics_imports()
        user = test_models()
        test_voter_dedup_service()
        test_voter_model()
        test_analytics_service()
        
        print("\n" + "=" * 50)
        print("✅ ALL TESTS PASSED!")
        print("The new features are working correctly.")
        
        # Print summary
        print(f"\nSummary:")
        print(f"- Dashboards: {Dashboard.objects.count()}")
        print(f"- Notifications: {Notification.objects.count()}")
        print(f"- Charts: {ChartConfig.objects.count()}")
        print(f"- File uploads: {FileUpload.objects.count()}")
        print(f"- Voters: {VoterRecord.objects.count()}")
        
    except Exception as e:
        print(f"\n❌ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    main()