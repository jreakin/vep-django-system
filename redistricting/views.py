from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.gis.geos import MultiPolygon, Polygon
from django.db import transaction
from django.utils import timezone
from .models import (
    RedistrictingPlan, District, PlanComparison, PlanMetrics, 
    PlanComment, PlanExport
)
from .serializers import (
    RedistrictingPlanSerializer, DistrictSerializer, PlanComparisonSerializer,
    PlanMetricsSerializer, PlanCommentSerializer, PlanExportSerializer,
    PlanCreateSerializer, DistrictCreateSerializer
)
import json
import logging
from io import BytesIO
import zipfile

logger = logging.getLogger(__name__)


class RedistrictingPlanViewSet(viewsets.ModelViewSet):
    """ViewSet for RedistrictingPlan management."""
    
    queryset = RedistrictingPlan.objects.all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return PlanCreateSerializer
        return RedistrictingPlanSerializer
    
    def get_queryset(self):
        queryset = RedistrictingPlan.objects.all()
        
        # Filter by plan type
        plan_type = self.request.query_params.get('plan_type')
        if plan_type:
            queryset = queryset.filter(plan_type=plan_type)
        
        # Filter by state
        state = self.request.query_params.get('state')
        if state:
            queryset = queryset.filter(state__iexact=state)
        
        # Filter by status
        plan_status = self.request.query_params.get('status')
        if plan_status:
            queryset = queryset.filter(status=plan_status)
        
        # Filter by current version only
        current_only = self.request.query_params.get('current_only')
        if current_only == 'true':
            queryset = queryset.filter(is_current_version=True)
        
        return queryset.select_related('created_by').prefetch_related('districts')


class DistrictViewSet(viewsets.ModelViewSet):
    """ViewSet for District management."""
    
    queryset = District.objects.all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return DistrictCreateSerializer
        return DistrictSerializer
    
    def get_queryset(self):
        queryset = District.objects.all()
        
        # Filter by plan
        plan_id = self.request.query_params.get('plan_id')
        if plan_id:
            queryset = queryset.filter(plan_id=plan_id)
        
        # Filter by population range
        min_population = self.request.query_params.get('min_population')
        max_population = self.request.query_params.get('max_population')
        if min_population:
            queryset = queryset.filter(total_population__gte=min_population)
        if max_population:
            queryset = queryset.filter(total_population__lte=max_population)
        
        return queryset.select_related('plan').order_by('plan', 'district_number')


class PlanComparisonViewSet(viewsets.ModelViewSet):
    """ViewSet for PlanComparison management."""
    
    queryset = PlanComparison.objects.all()
    serializer_class = PlanComparisonSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = PlanComparison.objects.all()
        
        # Filter by plan
        plan_id = self.request.query_params.get('plan_id')
        if plan_id:
            queryset = queryset.filter(plans__id=plan_id)
        
        return queryset.select_related('created_by').prefetch_related('plans')
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class PlanMetricsViewSet(viewsets.ModelViewSet):
    """ViewSet for PlanMetrics management."""
    
    queryset = PlanMetrics.objects.all()
    serializer_class = PlanMetricsSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = PlanMetrics.objects.all()
        
        # Filter by plan
        plan_id = self.request.query_params.get('plan_id')
        if plan_id:
            queryset = queryset.filter(plan_id=plan_id)
        
        return queryset.select_related('plan')


class PlanCommentViewSet(viewsets.ModelViewSet):
    """ViewSet for PlanComment management."""
    
    queryset = PlanComment.objects.all()
    serializer_class = PlanCommentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = PlanComment.objects.all()
        
        # Filter by plan
        plan_id = self.request.query_params.get('plan_id')
        if plan_id:
            queryset = queryset.filter(plan_id=plan_id)
        
        # Filter by district
        district_id = self.request.query_params.get('district_id')
        if district_id:
            queryset = queryset.filter(district_id=district_id)
        
        # Filter by public comments only
        public_only = self.request.query_params.get('public_only')
        if public_only == 'true':
            queryset = queryset.filter(is_public=True)
        
        # Filter by resolved status
        is_resolved = self.request.query_params.get('is_resolved')
        if is_resolved is not None:
            queryset = queryset.filter(is_resolved=is_resolved.lower() == 'true')
        
        return queryset.select_related('plan', 'district', 'author', 'responded_by').order_by('-created_at')
    
    def perform_create(self, serializer):
        serializer.save(author=self.request.user)


class PlanExportViewSet(viewsets.ModelViewSet):
    """ViewSet for PlanExport management."""
    
    queryset = PlanExport.objects.all()
    serializer_class = PlanExportSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = PlanExport.objects.all()
        
        # Filter by plan
        plan_id = self.request.query_params.get('plan_id')
        if plan_id:
            queryset = queryset.filter(plan_id=plan_id)
        
        # Filter by format
        export_format = self.request.query_params.get('format')
        if export_format:
            queryset = queryset.filter(format=export_format)
        
        # Filter by status
        export_status = self.request.query_params.get('status')
        if export_status:
            queryset = queryset.filter(status=export_status)
        
        return queryset.select_related('plan', 'requested_by').order_by('-requested_at')
    
    def perform_create(self, serializer):
        serializer.save(requested_by=self.request.user)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def validate_plan(request, plan_id):
    """Validate redistricting plan for compliance."""
    
    try:
        plan = RedistrictingPlan.objects.prefetch_related('districts').get(id=plan_id)
    except RedistrictingPlan.DoesNotExist:
        return Response(
            {'error': 'Plan not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    validation_results = {
        'plan_id': plan_id,
        'is_valid': True,
        'warnings': [],
        'errors': [],
        'metrics': {}
    }
    
    districts = plan.districts.all()
    
    # Basic validation checks
    if not districts.exists():
        validation_results['errors'].append('Plan has no districts')
        validation_results['is_valid'] = False
    
    if districts.count() != plan.target_districts:
        validation_results['errors'].append(
            f'Plan has {districts.count()} districts, expected {plan.target_districts}'
        )
        validation_results['is_valid'] = False
    
    # Population validation
    if plan.target_population_per_district:
        population_deviations = []
        for district in districts:
            if district.total_population:
                deviation = abs(district.total_population - plan.target_population_per_district)
                deviation_percent = (deviation / plan.target_population_per_district) * 100
                population_deviations.append(deviation_percent)
                
                if deviation_percent > 10:  # 10% threshold
                    validation_results['warnings'].append(
                        f'District {district.district_number} population deviation: {deviation_percent:.1f}%'
                    )
        
        if population_deviations:
            validation_results['metrics']['max_population_deviation'] = max(population_deviations)
            validation_results['metrics']['avg_population_deviation'] = sum(population_deviations) / len(population_deviations)
    
    # Contiguity validation (simplified)
    non_contiguous_districts = []
    for district in districts:
        if district.boundary:
            # Simple check - in real implementation, use proper topology validation
            if district.boundary.geom_type == 'MultiPolygon' and len(district.boundary) > 1:
                # Check if parts are actually connected
                non_contiguous_districts.append(district.district_number)
    
    if non_contiguous_districts:
        validation_results['warnings'].append(
            f'Potentially non-contiguous districts: {", ".join(map(str, non_contiguous_districts))}'
        )
    
    # Compactness validation (simplified Polsby-Popper score)
    compactness_scores = []
    for district in districts:
        if district.boundary and district.area_sq_meters and district.perimeter_meters:
            # Polsby-Popper: 4π * Area / Perimeter²
            pp_score = (4 * 3.14159 * district.area_sq_meters) / (district.perimeter_meters ** 2)
            compactness_scores.append(pp_score)
            
            if pp_score < 0.1:  # Low compactness threshold
                validation_results['warnings'].append(
                    f'District {district.district_number} has low compactness score: {pp_score:.3f}'
                )
    
    if compactness_scores:
        validation_results['metrics']['avg_compactness'] = sum(compactness_scores) / len(compactness_scores)
        validation_results['metrics']['min_compactness'] = min(compactness_scores)
    
    # Equal protection / VRA considerations
    if any(district.demographic_breakdown for district in districts):
        # Analyze minority representation
        total_minority_districts = 0
        for district in districts:
            if district.demographic_breakdown:
                # Simple check for majority-minority districts
                total_pop = district.total_population or 0
                if total_pop > 0:
                    minority_pop = 0
                    for group, count in district.demographic_breakdown.items():
                        if group.lower() not in ['white', 'caucasian']:
                            minority_pop += count
                    
                    if minority_pop > total_pop * 0.5:
                        total_minority_districts += 1
        
        validation_results['metrics']['majority_minority_districts'] = total_minority_districts
    
    return Response(validation_results)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def calculate_plan_metrics(request, plan_id):
    """Calculate comprehensive metrics for redistricting plan."""
    
    try:
        plan = RedistrictingPlan.objects.prefetch_related('districts').get(id=plan_id)
    except RedistrictingPlan.DoesNotExist:
        return Response(
            {'error': 'Plan not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    districts = plan.districts.all()
    
    # Calculate metrics
    metrics_data = {
        'ideal_population': 0,
        'max_population_deviation': 0.0,
        'population_range': {'min': 0, 'max': 0},
        'polsby_popper_scores': [],
        'reock_scores': [],
        'contiguous_districts': 0,
        'non_contiguous_districts': [],
        'county_splits': 0,
        'municipality_splits': 0,
        'majority_minority_districts': 0,
        'overall_score': 0.0,
        'compliance_score': 0.0,
    }
    
    if districts.exists():
        populations = [d.total_population for d in districts if d.total_population]
        if populations:
            total_pop = sum(populations)
            metrics_data['ideal_population'] = total_pop // len(districts)
            metrics_data['population_range'] = {'min': min(populations), 'max': max(populations)}
            
            # Population deviation
            ideal = metrics_data['ideal_population']
            deviations = [abs(pop - ideal) / ideal * 100 for pop in populations]
            metrics_data['max_population_deviation'] = max(deviations) if deviations else 0
    
    # Compactness calculations
    for district in districts:
        if district.boundary and district.area_sq_meters and district.perimeter_meters:
            # Polsby-Popper score
            pp_score = (4 * 3.14159 * district.area_sq_meters) / (district.perimeter_meters ** 2)
            metrics_data['polsby_popper_scores'].append(pp_score)
            
            # Reock score (simplified - would need minimum bounding circle)
            # For now, use a placeholder calculation
            reock_score = min(1.0, pp_score * 1.5)
            metrics_data['reock_scores'].append(reock_score)
            
            # Contiguity check (simplified)
            if district.boundary.geom_type == 'Polygon' or (
                district.boundary.geom_type == 'MultiPolygon' and len(district.boundary) == 1
            ):
                metrics_data['contiguous_districts'] += 1
            else:
                metrics_data['non_contiguous_districts'].append(district.district_number)
    
    # County/municipality splits (simplified count)
    all_counties = set()
    all_municipalities = set()
    for district in districts:
        all_counties.update(district.counties or [])
        all_municipalities.update(district.municipalities or [])
    
    # Simple heuristic for splits
    metrics_data['county_splits'] = max(0, len(all_counties) - len(districts))
    metrics_data['municipality_splits'] = max(0, len(all_municipalities) - len(districts))
    
    # Demographic analysis
    for district in districts:
        if district.demographic_breakdown and district.total_population:
            total_pop = district.total_population
            minority_pop = 0
            for group, count in district.demographic_breakdown.items():
                if group.lower() not in ['white', 'caucasian', 'non-hispanic white']:
                    minority_pop += count
            
            if minority_pop > total_pop * 0.5:
                metrics_data['majority_minority_districts'] += 1
    
    # Calculate overall scores
    compliance_factors = [
        1.0 if metrics_data['max_population_deviation'] <= 5.0 else 0.5,  # Population equality
        1.0 if not metrics_data['non_contiguous_districts'] else 0.7,  # Contiguity
        min(1.0, (metrics_data['polsby_popper_scores'] and 
                 sum(metrics_data['polsby_popper_scores']) / len(metrics_data['polsby_popper_scores'])) or 0),  # Compactness
    ]
    metrics_data['compliance_score'] = sum(compliance_factors) / len(compliance_factors)
    
    # Overall score considering additional factors
    overall_factors = compliance_factors + [
        max(0, 1.0 - metrics_data['county_splits'] / 10),  # Minimize county splits
        max(0, 1.0 - metrics_data['municipality_splits'] / 20),  # Minimize municipal splits
    ]
    metrics_data['overall_score'] = sum(overall_factors) / len(overall_factors)
    
    # Create or update metrics record
    plan_metrics, created = PlanMetrics.objects.update_or_create(
        plan=plan,
        defaults={
            'ideal_population': metrics_data['ideal_population'],
            'max_population_deviation': metrics_data['max_population_deviation'],
            'population_range': metrics_data['population_range'],
            'polsby_popper_scores': metrics_data['polsby_popper_scores'],
            'reock_scores': metrics_data['reock_scores'],
            'contiguous_districts': metrics_data['contiguous_districts'],
            'non_contiguous_districts': metrics_data['non_contiguous_districts'],
            'county_splits': metrics_data['county_splits'],
            'municipality_splits': metrics_data['municipality_splits'],
            'majority_minority_districts': metrics_data['majority_minority_districts'],
            'overall_score': metrics_data['overall_score'],
            'compliance_score': metrics_data['compliance_score'],
            'calculation_version': '1.0',
        }
    )
    
    return Response({
        'plan_id': plan_id,
        'metrics': metrics_data,
        'created': created,
        'calculated_at': plan_metrics.calculated_at,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def compare_plans(request, plan_id):
    """Compare multiple redistricting plans."""
    
    try:
        primary_plan = RedistrictingPlan.objects.get(id=plan_id)
    except RedistrictingPlan.DoesNotExist:
        return Response(
            {'error': 'Primary plan not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    comparison_plan_ids = request.data.get('comparison_plan_ids', [])
    comparison_name = request.data.get('name', f'Comparison of {primary_plan.name}')
    
    if not comparison_plan_ids:
        return Response(
            {'error': 'At least one comparison plan ID is required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    comparison_plans = RedistrictingPlan.objects.filter(id__in=comparison_plan_ids)
    all_plans = [primary_plan] + list(comparison_plans)
    
    # Comparison criteria
    criteria = {
        'population_equality': 0.3,
        'compactness': 0.25,
        'contiguity': 0.2,
        'county_integrity': 0.15,
        'vra_compliance': 0.1,
    }
    
    # Calculate scores for each plan
    plan_scores = {}
    
    for plan in all_plans:
        metrics = plan.metrics if hasattr(plan, 'metrics') else None
        if not metrics:
            # Calculate metrics if not available
            metrics_response = calculate_plan_metrics(request, plan.id)
            metrics_data = metrics_response.data.get('metrics', {})
        else:
            metrics_data = {
                'max_population_deviation': metrics.max_population_deviation,
                'polsby_popper_scores': metrics.polsby_popper_scores,
                'non_contiguous_districts': metrics.non_contiguous_districts,
                'county_splits': metrics.county_splits,
                'majority_minority_districts': metrics.majority_minority_districts,
                'overall_score': metrics.overall_score,
            }
        
        # Score each criterion (0-1 scale)
        scores = {
            'population_equality': max(0, 1 - (metrics_data.get('max_population_deviation', 100) / 10)),
            'compactness': (sum(metrics_data.get('polsby_popper_scores', [0])) / 
                          max(1, len(metrics_data.get('polsby_popper_scores', [0])))),
            'contiguity': 1.0 if not metrics_data.get('non_contiguous_districts') else 0.7,
            'county_integrity': max(0, 1 - (metrics_data.get('county_splits', 0) / 10)),
            'vra_compliance': min(1.0, metrics_data.get('majority_minority_districts', 0) / 2),
        }
        
        # Calculate weighted overall score
        overall_score = sum(scores[criterion] * weight for criterion, weight in criteria.items())
        
        plan_scores[str(plan.id)] = {
            'plan_name': plan.name,
            'scores': scores,
            'overall_score': overall_score,
            'rank': 0,  # Will be calculated after all scores
        }
    
    # Rank plans by overall score
    sorted_plans = sorted(plan_scores.items(), key=lambda x: x[1]['overall_score'], reverse=True)
    for rank, (plan_id, score_data) in enumerate(sorted_plans, 1):
        plan_scores[plan_id]['rank'] = rank
    
    # Create comparison record
    comparison = PlanComparison.objects.create(
        name=comparison_name,
        created_by=request.user,
        criteria=criteria,
        comparison_results=plan_scores,
        ranking=[plan_id for plan_id, _ in sorted_plans],
    )
    
    comparison.plans.set(all_plans)
    
    return Response({
        'comparison_id': comparison.id,
        'name': comparison_name,
        'criteria': criteria,
        'plan_scores': plan_scores,
        'ranking': sorted_plans,
        'winner': sorted_plans[0][1]['plan_name'] if sorted_plans else None,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def export_plan(request, plan_id, format):
    """Export redistricting plan in specified format."""
    
    try:
        plan = RedistrictingPlan.objects.prefetch_related('districts').get(id=plan_id)
    except RedistrictingPlan.DoesNotExist:
        return Response(
            {'error': 'Plan not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    supported_formats = ['shapefile', 'geojson', 'kml', 'csv', 'pdf', 'json']
    if format not in supported_formats:
        return Response(
            {'error': f'Unsupported format. Supported formats: {", ".join(supported_formats)}'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    export_options = request.data.get('options', {})
    
    # Create export record
    export_record = PlanExport.objects.create(
        plan=plan,
        format=format,
        file_name=f"{plan.name}_{format}_{timezone.now().strftime('%Y%m%d_%H%M%S')}",
        requested_by=request.user,
        export_options=export_options,
        status='processing'
    )
    
    try:
        # Export generation (simplified)
        if format == 'geojson':
            export_data = generate_geojson_export(plan)
        elif format == 'csv':
            export_data = generate_csv_export(plan)
        elif format == 'json':
            export_data = generate_json_export(plan)
        else:
            # For other formats, return placeholder
            export_data = f"Export for format {format} would be generated here"
        
        # Update export record
        export_record.status = 'completed'
        export_record.completed_at = timezone.now()
        export_record.file_size_bytes = len(str(export_data).encode('utf-8'))
        export_record.save()
        
        return Response({
            'export_id': export_record.id,
            'status': 'completed',
            'format': format,
            'file_name': export_record.file_name,
            'file_size_bytes': export_record.file_size_bytes,
            'download_url': f'/api/redistricting/exports/{export_record.id}/download/',
            'data': export_data if format in ['geojson', 'json'] else None,
        })
        
    except Exception as e:
        logger.error(f"Export generation failed: {str(e)}")
        export_record.status = 'failed'
        export_record.save()
        
        return Response({
            'export_id': export_record.id,
            'status': 'failed',
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def generate_geojson_export(plan):
    """Generate GeoJSON export for redistricting plan."""
    features = []
    
    for district in plan.districts.all():
        if district.boundary:
            feature = {
                'type': 'Feature',
                'geometry': json.loads(district.boundary.geojson),
                'properties': {
                    'district_number': district.district_number,
                    'name': district.name,
                    'total_population': district.total_population,
                    'voting_age_population': district.voting_age_population,
                    'area_sq_meters': district.area_sq_meters,
                    'demographic_breakdown': district.demographic_breakdown,
                }
            }
            features.append(feature)
    
    return {
        'type': 'FeatureCollection',
        'features': features,
        'properties': {
            'plan_name': plan.name,
            'plan_type': plan.plan_type,
            'state': plan.state,
            'total_districts': len(features),
            'created_at': plan.created_at.isoformat(),
        }
    }


def generate_csv_export(plan):
    """Generate CSV export for redistricting plan."""
    import csv
    from io import StringIO
    
    output = StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow([
        'district_number', 'name', 'total_population', 'voting_age_population',
        'area_sq_meters', 'counties', 'municipalities'
    ])
    
    # Write district data
    for district in plan.districts.all():
        writer.writerow([
            district.district_number,
            district.name or '',
            district.total_population or 0,
            district.voting_age_population or 0,
            district.area_sq_meters or 0,
            ';'.join(district.counties or []),
            ';'.join(district.municipalities or []),
        ])
    
    return output.getvalue()


def generate_json_export(plan):
    """Generate JSON export for redistricting plan."""
    return {
        'plan': {
            'id': str(plan.id),
            'name': plan.name,
            'plan_type': plan.plan_type,
            'description': plan.description,
            'state': plan.state,
            'jurisdiction': plan.jurisdiction,
            'target_districts': plan.target_districts,
            'status': plan.status,
            'created_at': plan.created_at.isoformat(),
        },
        'districts': [
            {
                'district_number': district.district_number,
                'name': district.name,
                'total_population': district.total_population,
                'voting_age_population': district.voting_age_population,
                'demographic_breakdown': district.demographic_breakdown,
                'counties': district.counties,
                'municipalities': district.municipalities,
                'precincts': district.precincts,
            }
            for district in plan.districts.all()
        ],
        'export_metadata': {
            'exported_at': timezone.now().isoformat(),
            'format': 'json',
            'version': '1.0',
        }
    }


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_district_demographics(request, district_id):
    """Get detailed demographics for a specific district."""
    
    try:
        district = District.objects.get(id=district_id)
    except District.DoesNotExist:
        return Response(
            {'error': 'District not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    # In a real implementation, this would query Census data or voter records
    demographics = district.demographic_breakdown or {}
    
    # Enhanced demographic analysis
    analysis = {
        'district_id': district_id,
        'district_number': district.district_number,
        'total_population': district.total_population,
        'voting_age_population': district.voting_age_population,
        'demographic_breakdown': demographics,
        'analysis': {}
    }
    
    if district.total_population and demographics:
        total_pop = district.total_population
        
        # Calculate percentages
        analysis['demographic_percentages'] = {
            group: (count / total_pop) * 100
            for group, count in demographics.items()
        }
        
        # Determine majority status
        majority_group = max(demographics, key=demographics.get) if demographics else None
        majority_percentage = (demographics.get(majority_group, 0) / total_pop) * 100 if majority_group else 0
        
        analysis['analysis'] = {
            'majority_group': majority_group,
            'majority_percentage': majority_percentage,
            'is_majority_minority': majority_percentage < 50,
            'diversity_index': calculate_diversity_index(demographics, total_pop),
        }
    
    return Response(analysis)


def calculate_diversity_index(demographics, total_population):
    """Calculate Simpson's Diversity Index."""
    if not demographics or total_population == 0:
        return 0
    
    # Simpson's Index: D = Σ(n/N)²
    simpson_index = sum((count / total_population) ** 2 for count in demographics.values())
    
    # Simpson's Diversity Index: 1 - D (higher = more diverse)
    return 1 - simpson_index


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_shapefile(request):
    """Upload and import shapefile for redistricting."""
    
    if 'file' not in request.FILES:
        return Response(
            {'error': 'No file provided'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    uploaded_file = request.FILES['file']
    plan_name = request.data.get('plan_name', 'Imported Plan')
    plan_type = request.data.get('plan_type', 'custom')
    state = request.data.get('state', '')
    
    # Validate file type
    if not uploaded_file.name.endswith('.zip'):
        return Response(
            {'error': 'Please upload a ZIP file containing shapefile components'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Create plan record
        plan = RedistrictingPlan.objects.create(
            name=plan_name,
            plan_type=plan_type,
            state=state,
            created_by=request.user,
            source_format='shapefile',
            source_file_name=uploaded_file.name,
            status='draft'
        )
        
        # In a real implementation, this would:
        # 1. Extract and validate shapefile components
        # 2. Use GDAL/OGR to read geometries
        # 3. Create District objects with proper geometries
        # 4. Validate topology and attributes
        
        # Placeholder response
        return Response({
            'plan_id': plan.id,
            'message': 'Shapefile upload initiated. Processing in background.',
            'status': 'processing',
            'districts_created': 0,  # Would be actual count after processing
        }, status=status.HTTP_202_ACCEPTED)
        
    except Exception as e:
        logger.error(f"Shapefile upload failed: {str(e)}")
        return Response(
            {'error': f'Upload failed: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def import_plan(request):
    """Import redistricting plan from various formats."""
    
    file_format = request.data.get('format')
    plan_data = request.data.get('plan_data')
    plan_name = request.data.get('plan_name', 'Imported Plan')
    
    if not file_format or not plan_data:
        return Response(
            {'error': 'Format and plan_data are required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    supported_formats = ['geojson', 'json', 'csv']
    if file_format not in supported_formats:
        return Response(
            {'error': f'Unsupported format. Supported: {", ".join(supported_formats)}'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        with transaction.atomic():
            # Create plan
            plan = RedistrictingPlan.objects.create(
                name=plan_name,
                plan_type=request.data.get('plan_type', 'custom'),
                state=request.data.get('state', ''),
                created_by=request.user,
                source_format=file_format,
                status='draft'
            )
            
            districts_created = 0
            
            if file_format == 'geojson':
                districts_created = import_from_geojson(plan, plan_data)
            elif file_format == 'json':
                districts_created = import_from_json(plan, plan_data)
            elif file_format == 'csv':
                districts_created = import_from_csv(plan, plan_data)
            
            # Update plan with actual district count
            plan.target_districts = districts_created
            plan.save()
            
            return Response({
                'plan_id': plan.id,
                'plan_name': plan.name,
                'districts_created': districts_created,
                'status': 'completed',
                'message': f'Successfully imported {districts_created} districts'
            }, status=status.HTTP_201_CREATED)
            
    except Exception as e:
        logger.error(f"Plan import failed: {str(e)}")
        return Response(
            {'error': f'Import failed: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


def import_from_geojson(plan, geojson_data):
    """Import districts from GeoJSON data."""
    districts_created = 0
    
    if isinstance(geojson_data, str):
        geojson_data = json.loads(geojson_data)
    
    features = geojson_data.get('features', [])
    
    for feature in features:
        geometry = feature.get('geometry')
        properties = feature.get('properties', {})
        
        if geometry:
            # Convert geometry to Django geometry
            from django.contrib.gis.geos import GEOSGeometry
            boundary = GEOSGeometry(json.dumps(geometry))
            
            District.objects.create(
                plan=plan,
                district_number=properties.get('district_number', districts_created + 1),
                name=properties.get('name', f'District {districts_created + 1}'),
                boundary=boundary,
                total_population=properties.get('total_population', 0),
                voting_age_population=properties.get('voting_age_population', 0),
                demographic_breakdown=properties.get('demographic_breakdown', {}),
            )
            districts_created += 1
    
    return districts_created


def import_from_json(plan, json_data):
    """Import districts from JSON data."""
    if isinstance(json_data, str):
        json_data = json.loads(json_data)
    
    districts_data = json_data.get('districts', [])
    districts_created = 0
    
    for district_data in districts_data:
        District.objects.create(
            plan=plan,
            district_number=district_data.get('district_number', districts_created + 1),
            name=district_data.get('name', f'District {districts_created + 1}'),
            total_population=district_data.get('total_population', 0),
            voting_age_population=district_data.get('voting_age_population', 0),
            demographic_breakdown=district_data.get('demographic_breakdown', {}),
            counties=district_data.get('counties', []),
            municipalities=district_data.get('municipalities', []),
            precincts=district_data.get('precincts', []),
        )
        districts_created += 1
    
    return districts_created


def import_from_csv(plan, csv_data):
    """Import districts from CSV data."""
    import csv
    from io import StringIO
    
    if isinstance(csv_data, str):
        csv_file = StringIO(csv_data)
    else:
        csv_file = csv_data
    
    reader = csv.DictReader(csv_file)
    districts_created = 0
    
    for row in reader:
        District.objects.create(
            plan=plan,
            district_number=int(row.get('district_number', districts_created + 1)),
            name=row.get('name', f'District {districts_created + 1}'),
            total_population=int(row.get('total_population', 0)) if row.get('total_population') else 0,
            voting_age_population=int(row.get('voting_age_population', 0)) if row.get('voting_age_population') else 0,
            counties=row.get('counties', '').split(';') if row.get('counties') else [],
            municipalities=row.get('municipalities', '').split(';') if row.get('municipalities') else [],
        )
        districts_created += 1
    
    return districts_created
