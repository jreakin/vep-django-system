from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.gis.geos import Point
from django.contrib.gis.db.models.functions import Distance
from django.db import transaction
from .models import Territory, WalkListTerritory, TerritoryAssignment, CanvassRoute, TerritoryAnalytics
from .serializers import (
    TerritorySerializer, 
    WalkListTerritorySerializer, 
    TerritoryAssignmentSerializer,
    CanvassRouteSerializer, 
    TerritoryAnalyticsSerializer,
    TerritoryCreateSerializer
)
from voter_data.models import VoterRecord
import logging

logger = logging.getLogger(__name__)


class TerritoryViewSet(viewsets.ModelViewSet):
    """ViewSet for Territory management."""
    
    queryset = Territory.objects.all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return TerritoryCreateSerializer
        return TerritorySerializer
    
    def get_queryset(self):
        queryset = Territory.objects.all()
        
        # Filter by campaign if specified
        campaign_id = self.request.query_params.get('campaign_id')
        if campaign_id:
            queryset = queryset.filter(campaign_id=campaign_id)
        
        # Filter by territory type
        territory_type = self.request.query_params.get('territory_type')
        if territory_type:
            queryset = queryset.filter(territory_type=territory_type)
        
        # Filter by status
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)
        
        return queryset.select_related('created_by', 'assigned_to')


class WalkListTerritoryViewSet(viewsets.ModelViewSet):
    """ViewSet for WalkListTerritory management."""
    
    queryset = WalkListTerritory.objects.all()
    serializer_class = WalkListTerritorySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = WalkListTerritory.objects.all()
        
        # Filter by volunteer
        volunteer_id = self.request.query_params.get('volunteer_id')
        if volunteer_id:
            queryset = queryset.filter(volunteer_id=volunteer_id)
        
        # Filter by territory
        territory_id = self.request.query_params.get('territory_id')
        if territory_id:
            queryset = queryset.filter(territory_id=territory_id)
        
        # Filter by status
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)
        
        return queryset.select_related('territory', 'volunteer', 'created_by')


class TerritoryAssignmentViewSet(viewsets.ModelViewSet):
    """ViewSet for TerritoryAssignment management."""
    
    queryset = TerritoryAssignment.objects.all()
    serializer_class = TerritoryAssignmentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = TerritoryAssignment.objects.all()
        
        # Filter by territory
        territory_id = self.request.query_params.get('territory_id')
        if territory_id:
            queryset = queryset.filter(territory_id=territory_id)
        
        # Filter by active status
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        return queryset.select_related('territory', 'assigned_by')


class CanvassRouteViewSet(viewsets.ModelViewSet):
    """ViewSet for CanvassRoute management."""
    
    queryset = CanvassRoute.objects.all()
    serializer_class = CanvassRouteSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = CanvassRoute.objects.all()
        
        # Filter by walk list
        walk_list_id = self.request.query_params.get('walk_list_id')
        if walk_list_id:
            queryset = queryset.filter(walk_list_id=walk_list_id)
        
        # Filter by current routes only
        is_current = self.request.query_params.get('is_current')
        if is_current is not None:
            queryset = queryset.filter(is_current=is_current.lower() == 'true')
        
        return queryset.select_related('walk_list', 'generated_by')


class TerritoryAnalyticsViewSet(viewsets.ModelViewSet):
    """ViewSet for TerritoryAnalytics management."""
    
    queryset = TerritoryAnalytics.objects.all()
    serializer_class = TerritoryAnalyticsSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = TerritoryAnalytics.objects.all()
        
        # Filter by territory
        territory_id = self.request.query_params.get('territory_id')
        if territory_id:
            queryset = queryset.filter(territory_id=territory_id)
        
        return queryset.select_related('territory')


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def assign_voters_to_territory(request, territory_id):
    """Assign voters to a territory based on spatial containment."""
    
    try:
        territory = Territory.objects.get(id=territory_id)
    except Territory.DoesNotExist:
        return Response(
            {'error': 'Territory not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Get voters within the territory boundary
    voters_in_territory = VoterRecord.objects.filter(
        location__within=territory.boundary
    ).exclude(
        # Exclude voters already assigned to this territory
        id__in=TerritoryAssignment.objects.filter(
            territory=territory, 
            is_active=True
        ).values_list('voter_id', flat=True)
    )
    
    assignments_created = 0
    
    with transaction.atomic():
        for voter in voters_in_territory:
            # Create assignment
            assignment = TerritoryAssignment.objects.create(
                territory=territory,
                voter_id=voter.id,
                assigned_by=request.user,
                is_within_boundary=True,
                distance_to_boundary_meters=0.0
            )
            assignments_created += 1
    
    return Response({
        'assignments_created': assignments_created,
        'total_voters_in_territory': voters_in_territory.count()
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def spatial_query_voters(request, territory_id):
    """Query voters within or near a territory."""
    
    try:
        territory = Territory.objects.get(id=territory_id)
    except Territory.DoesNotExist:
        return Response(
            {'error': 'Territory not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Get query parameters
    buffer_meters = float(request.GET.get('buffer_meters', 0))
    party_filter = request.GET.get('party')
    limit = int(request.GET.get('limit', 1000))
    
    # Base query - voters within territory
    queryset = VoterRecord.objects.filter(location__isnull=False)
    
    if buffer_meters > 0:
        # Include voters within buffer distance
        queryset = queryset.filter(
            location__distance_lte=(territory.boundary, buffer_meters)
        )
    else:
        # Only voters within territory
        queryset = queryset.filter(location__within=territory.boundary)
    
    # Apply party filter
    if party_filter:
        queryset = queryset.filter(party_affiliation__icontains=party_filter)
    
    # Add distance annotation
    if territory.center_point:
        queryset = queryset.annotate(
            distance_to_center=Distance('location', territory.center_point)
        ).order_by('distance_to_center')
    
    # Limit results
    queryset = queryset[:limit]
    
    # Serialize results
    voters_data = []
    for voter in queryset:
        data = {
            'id': str(voter.id),
            'name': voter.name,
            'address': voter.residential_address or voter.address,
            'party_affiliation': voter.party_affiliation,
            'location': [voter.location.y, voter.location.x] if voter.location else None,
        }
        
        if hasattr(voter, 'distance_to_center'):
            data['distance_to_center'] = voter.distance_to_center.m
        
        voters_data.append(data)
    
    return Response({
        'territory_id': territory_id,
        'voters': voters_data,
        'count': len(voters_data),
        'query_params': {
            'buffer_meters': buffer_meters,
            'party_filter': party_filter,
            'limit': limit
        }
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_canvass_route(request, walk_list_id):
    """Generate optimized route for canvassing."""
    
    try:
        walk_list = WalkListTerritory.objects.get(id=walk_list_id)
    except WalkListTerritory.DoesNotExist:
        return Response(
            {'error': 'Walk list not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    optimization_type = request.data.get('optimization_type', 'balanced')
    start_address = request.data.get('start_address', '')
    
    # Get voters for this walk list (from route_order or territory assignments)
    if walk_list.route_order:
        voter_ids = walk_list.route_order
    else:
        # Get voters from territory assignments
        voter_ids = list(
            TerritoryAssignment.objects.filter(
                territory=walk_list.territory,
                is_active=True
            ).values_list('voter_id', flat=True)
        )
    
    # Get voter locations
    voters = VoterRecord.objects.filter(
        id__in=voter_ids,
        location__isnull=False
    ).order_by('id')
    
    if not voters.exists():
        return Response(
            {'error': 'No voters with locations found for this walk list'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Simple route optimization (in real implementation, use proper routing algorithm)
    waypoints = []
    total_distance = 0.0
    
    # Start from walk list start location or first voter
    if walk_list.start_location:
        current_point = walk_list.start_location
    else:
        current_point = voters.first().location
    
    # Create waypoints for each voter
    for voter in voters:
        if voter.location:
            # Calculate distance from current point
            if current_point:
                distance = current_point.distance(voter.location) * 111319.9  # rough meters conversion
                total_distance += distance
            
            waypoint = {
                'voter_id': str(voter.id),
                'lat': voter.location.y,
                'lng': voter.location.x,
                'address': voter.residential_address or voter.address,
                'name': voter.name,
            }
            waypoints.append(waypoint)
            current_point = voter.location
    
    # Estimate duration (assume 5 minutes per address + travel time)
    estimated_duration = len(waypoints) * 5 + (total_distance / 83.33)  # 5 km/h walking speed
    
    # Create or update route
    route, created = CanvassRoute.objects.update_or_create(
        walk_list=walk_list,
        defaults={
            'optimization_type': optimization_type,
            'start_address': start_address,
            'waypoints': waypoints,
            'total_distance_meters': total_distance,
            'estimated_duration_minutes': int(estimated_duration),
            'generated_by': request.user,
            'is_current': True,
        }
    )
    
    return Response({
        'route_id': route.id,
        'waypoints': waypoints,
        'total_distance_meters': total_distance,
        'estimated_duration_minutes': int(estimated_duration),
        'optimization_type': optimization_type,
        'created': created
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def optimize_canvass_route(request, walk_list_id):
    """Optimize existing canvass route using advanced algorithms."""
    
    try:
        walk_list = WalkListTerritory.objects.get(id=walk_list_id)
        route = walk_list.route
    except (WalkListTerritory.DoesNotExist, CanvassRoute.DoesNotExist):
        return Response(
            {'error': 'Walk list or route not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    optimization_type = request.data.get('optimization_type', route.optimization_type)
    
    # In a real implementation, this would use algorithms like:
    # - Traveling Salesman Problem (TSP) solvers
    # - Google Maps Directions API
    # - OSRM (Open Source Routing Machine)
    # - Or-tools by Google
    
    # For now, simple nearest neighbor optimization
    waypoints = route.waypoints.copy() if route.waypoints else []
    
    if len(waypoints) > 2:
        # Simple nearest neighbor starting from first point
        optimized_waypoints = [waypoints[0]]
        remaining_waypoints = waypoints[1:]
        
        current_point = waypoints[0]
        total_distance = 0.0
        
        while remaining_waypoints:
            # Find nearest waypoint
            nearest_idx = 0
            min_distance = float('inf')
            
            for i, waypoint in enumerate(remaining_waypoints):
                distance = ((current_point['lat'] - waypoint['lat']) ** 2 + 
                           (current_point['lng'] - waypoint['lng']) ** 2) ** 0.5
                if distance < min_distance:
                    min_distance = distance
                    nearest_idx = i
            
            # Add nearest waypoint to optimized route
            nearest_waypoint = remaining_waypoints.pop(nearest_idx)
            optimized_waypoints.append(nearest_waypoint)
            total_distance += min_distance * 111319.9  # rough conversion to meters
            current_point = nearest_waypoint
        
        # Update route with optimized waypoints
        route.waypoints = optimized_waypoints
        route.optimization_type = optimization_type
        route.total_distance_meters = total_distance
        route.estimated_duration_minutes = int(len(optimized_waypoints) * 5 + total_distance / 83.33)
        route.save()
    
    return Response({
        'route_id': route.id,
        'optimized_waypoints': route.waypoints,
        'total_distance_meters': route.total_distance_meters,
        'estimated_duration_minutes': route.estimated_duration_minutes,
        'optimization_type': route.optimization_type,
        'improvement': 'Route optimized using nearest neighbor algorithm'
    })
