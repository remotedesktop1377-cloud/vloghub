"""
Metadata API routes for tag and clip metadata management.
"""
import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from src.db.database import get_db
from src.models.metadata import (
    TagCreate, TagResponse, ClipMetadataCreate, ClipMetadataUpdate, 
    ClipMetadataResponse, MetadataSearchFilters, MetadataSearchResult,
    TagType, ConfidenceLevel, MetadataSource
)
from src.services.metadata import (
    TagService, MetadataService, AutomatedTagger, GeoLocationService
)

router = APIRouter(prefix="/api/metadata", tags=["metadata"])
logger = logging.getLogger(__name__)


# Tag Management Endpoints
@router.post("/tags", response_model=TagResponse)
async def create_tag(
    tag_data: TagCreate,
    db: Session = Depends(get_db)
):
    """Create a new tag."""
    try:
        tag_service = TagService(db)
        tag = tag_service.create_tag(
            name=tag_data.name,
            tag_type=tag_data.tag_type,
            category_id=tag_data.category_id,
            description=tag_data.description,
            confidence=tag_data.confidence,
            confidence_level=tag_data.confidence_level,
            source=tag_data.source
        )
        
        return TagResponse.from_orm(tag)
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating tag: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/tags", response_model=List[TagResponse])
async def search_tags(
    query: Optional[str] = Query(None, description="Search query"),
    tag_type: Optional[TagType] = Query(None, description="Filter by tag type"),
    category_id: Optional[str] = Query(None, description="Filter by category"),
    min_confidence: Optional[float] = Query(None, ge=0.0, le=1.0, description="Minimum confidence"),
    source: Optional[MetadataSource] = Query(None, description="Filter by source"),
    limit: int = Query(50, ge=1, le=100, description="Maximum results"),
    offset: int = Query(0, ge=0, description="Results offset"),
    db: Session = Depends(get_db)
):
    """Search tags with filters."""
    try:
        tag_service = TagService(db)
        tags = tag_service.search_tags(
            query=query,
            tag_type=tag_type,
            category_id=category_id,
            min_confidence=min_confidence,
            source=source,
            limit=limit,
            offset=offset
        )
        
        return [TagResponse.from_orm(tag) for tag in tags]
        
    except Exception as e:
        logger.error(f"Error searching tags: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/tags/popular", response_model=List[TagResponse])
async def get_popular_tags(
    tag_type: Optional[TagType] = Query(None, description="Filter by tag type"),
    limit: int = Query(20, ge=1, le=50, description="Maximum results"),
    db: Session = Depends(get_db)
):
    """Get most popular tags by usage count."""
    try:
        tag_service = TagService(db)
        tags = tag_service.get_popular_tags(tag_type=tag_type, limit=limit)
        return [TagResponse.from_orm(tag) for tag in tags]
        
    except Exception as e:
        logger.error(f"Error getting popular tags: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/tags/{tag_id}", response_model=TagResponse)
async def get_tag(
    tag_id: str,
    db: Session = Depends(get_db)
):
    """Get tag by ID."""
    try:
        tag_service = TagService(db)
        tag = tag_service.get_tag_by_id(tag_id)
        
        if not tag:
            raise HTTPException(status_code=404, detail="Tag not found")
        
        return TagResponse.from_orm(tag)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting tag: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.put("/tags/{tag_id}", response_model=TagResponse)
async def update_tag(
    tag_id: str,
    name: Optional[str] = None,
    description: Optional[str] = None,
    category_id: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    """Update tag information."""
    try:
        tag_service = TagService(db)
        tag = tag_service.update_tag(
            tag_id=tag_id,
            name=name,
            description=description,
            category_id=category_id,
            is_active=is_active
        )
        
        if not tag:
            raise HTTPException(status_code=404, detail="Tag not found")
        
        return TagResponse.from_orm(tag)
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating tag: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.delete("/tags/{tag_id}")
async def delete_tag(
    tag_id: str,
    db: Session = Depends(get_db)
):
    """Delete (deactivate) a tag."""
    try:
        tag_service = TagService(db)
        success = tag_service.delete_tag(tag_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="Tag not found")
        
        return {"message": "Tag deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting tag: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/tags/{tag_id}/related", response_model=List[TagResponse])
async def get_related_tags(
    tag_id: str,
    limit: int = Query(10, ge=1, le=20, description="Maximum results"),
    db: Session = Depends(get_db)
):
    """Get tags related to the given tag."""
    try:
        tag_service = TagService(db)
        related_tags = tag_service.get_related_tags(tag_id, limit=limit)
        return [TagResponse.from_orm(tag) for tag in related_tags]
        
    except Exception as e:
        logger.error(f"Error getting related tags: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/tags/statistics")
async def get_tag_statistics(db: Session = Depends(get_db)):
    """Get tag usage statistics."""
    try:
        tag_service = TagService(db)
        stats = tag_service.get_tag_statistics()
        return stats
        
    except Exception as e:
        logger.error(f"Error getting tag statistics: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# Clip Metadata Endpoints
@router.post("/clips", response_model=ClipMetadataResponse)
async def create_clip_metadata(
    clip_data: ClipMetadataCreate,
    auto_tag: bool = Query(True, description="Apply automated tagging"),
    db: Session = Depends(get_db)
):
    """Create metadata for a new clip."""
    try:
        metadata_service = MetadataService(db)
        clip_metadata = await metadata_service.create_clip_metadata(
            clip_data=clip_data,
            auto_tag=auto_tag
        )
        
        return clip_metadata
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating clip metadata: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/clips/{clip_id}", response_model=ClipMetadataResponse)
async def get_clip_metadata(
    clip_id: str,
    db: Session = Depends(get_db)
):
    """Get clip metadata by clip ID."""
    try:
        metadata_service = MetadataService(db)
        clip_metadata = await metadata_service.get_clip_metadata(clip_id)
        
        if not clip_metadata:
            raise HTTPException(status_code=404, detail="Clip metadata not found")
        
        return clip_metadata
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting clip metadata: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.put("/clips/{clip_id}", response_model=ClipMetadataResponse)
async def update_clip_metadata(
    clip_id: str,
    update_data: ClipMetadataUpdate,
    changed_by: str = Query("user", description="Who made the changes"),
    db: Session = Depends(get_db)
):
    """Update clip metadata."""
    try:
        metadata_service = MetadataService(db)
        clip_metadata = await metadata_service.update_clip_metadata(
            clip_id=clip_id,
            update_data=update_data,
            changed_by=changed_by
        )
        
        if not clip_metadata:
            raise HTTPException(status_code=404, detail="Clip metadata not found")
        
        return clip_metadata
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating clip metadata: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/clips/search", response_model=MetadataSearchResult)
async def search_clips(
    filters: MetadataSearchFilters,
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Results per page"),
    db: Session = Depends(get_db)
):
    """Search clips by metadata filters."""
    try:
        metadata_service = MetadataService(db)
        results = await metadata_service.search_clips(
            filters=filters,
            page=page,
            page_size=page_size
        )
        
        return results
        
    except Exception as e:
        logger.error(f"Error searching clips: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/clips/{clip_id}/related", response_model=List[ClipMetadataResponse])
async def get_related_clips(
    clip_id: str,
    limit: int = Query(10, ge=1, le=20, description="Maximum results"),
    db: Session = Depends(get_db)
):
    """Get clips related to the given clip."""
    try:
        metadata_service = MetadataService(db)
        related_clips = await metadata_service.get_related_clips(clip_id, limit=limit)
        return related_clips
        
    except Exception as e:
        logger.error(f"Error getting related clips: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# Automated Tagging Endpoints
@router.post("/clips/{clip_id}/analyze")
async def analyze_clip_content(
    clip_id: str,
    text: Optional[str] = None,
    auto_apply: bool = Query(False, description="Automatically apply high-confidence tags"),
    min_confidence: float = Query(0.8, ge=0.0, le=1.0, description="Minimum confidence for auto-apply"),
    db: Session = Depends(get_db)
):
    """Analyze clip content and generate tag suggestions."""
    try:
        automated_tagger = AutomatedTagger(db)
        
        # Analyze the clip
        analysis_result = await automated_tagger.analyze_and_tag_clip(
            clip_id=clip_id,
            text=text
        )
        
        # Auto-apply tags if requested
        applied_tag_ids = []
        if auto_apply:
            applied_tag_ids = await automated_tagger.auto_apply_tags(
                clip_id=clip_id,
                suggestions=analysis_result.suggested_tags,
                min_confidence=min_confidence
            )
        
        return {
            "clip_id": clip_id,
            "analysis_result": analysis_result.dict(),
            "auto_applied_tags": applied_tag_ids
        }
        
    except Exception as e:
        logger.error(f"Error analyzing clip content: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/tags/suggest")
async def suggest_tags_for_text(
    text: str,
    tag_type: Optional[TagType] = Query(None, description="Filter by tag type"),
    limit: int = Query(10, ge=1, le=20, description="Maximum suggestions"),
    db: Session = Depends(get_db)
):
    """Suggest existing tags based on text content."""
    try:
        tag_service = TagService(db)
        suggested_tags = tag_service.suggest_tags_for_text(
            text=text,
            tag_type=tag_type,
            limit=limit
        )
        
        return [TagResponse.from_orm(tag) for tag in suggested_tags]
        
    except Exception as e:
        logger.error(f"Error suggesting tags: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# Location Endpoints
@router.get("/locations/search")
async def search_locations(
    query: Optional[str] = Query(None, description="Search query"),
    country: Optional[str] = Query(None, description="Filter by country"),
    region: Optional[str] = Query(None, description="Filter by region"),
    city: Optional[str] = Query(None, description="Filter by city"),
    limit: int = Query(20, ge=1, le=50, description="Maximum results"),
    db: Session = Depends(get_db)
):
    """Search geographic locations."""
    try:
        geo_service = GeoLocationService(db)
        locations = geo_service.search_locations(
            query=query,
            country=country,
            region=region,
            city=city,
            limit=limit
        )
        
        return [
            {
                "id": str(location.id),
                "name": location.name,
                "latitude": location.latitude,
                "longitude": location.longitude,
                "country": location.country,
                "region": location.region,
                "city": location.city,
                "confidence": location.confidence
            }
            for location in locations
        ]
        
    except Exception as e:
        logger.error(f"Error searching locations: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/locations/near")
async def get_locations_near(
    latitude: float = Query(..., description="Latitude"),
    longitude: float = Query(..., description="Longitude"),
    radius_km: float = Query(50.0, ge=0.1, le=1000.0, description="Radius in kilometers"),
    limit: int = Query(10, ge=1, le=20, description="Maximum results"),
    db: Session = Depends(get_db)
):
    """Get locations near the given coordinates."""
    try:
        geo_service = GeoLocationService(db)
        locations = geo_service.get_locations_near(
            latitude=latitude,
            longitude=longitude,
            radius_km=radius_km,
            limit=limit
        )
        
        return [
            {
                "id": str(location.id),
                "name": location.name,
                "latitude": location.latitude,
                "longitude": location.longitude,
                "country": location.country,
                "region": location.region,
                "city": location.city
            }
            for location in locations
        ]
        
    except Exception as e:
        logger.error(f"Error getting nearby locations: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/locations/extract")
async def extract_locations_from_text(
    text: str,
    db: Session = Depends(get_db)
):
    """Extract location mentions from text."""
    try:
        geo_service = GeoLocationService(db)
        locations = geo_service.extract_locations_from_text(text)
        
        return [location.dict() for location in locations]
        
    except Exception as e:
        logger.error(f"Error extracting locations: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# Statistics and Analytics Endpoints
@router.get("/statistics")
async def get_metadata_statistics(db: Session = Depends(get_db)):
    """Get comprehensive metadata statistics."""
    try:
        metadata_service = MetadataService(db)
        stats = await metadata_service.get_metadata_statistics()
        return stats
        
    except Exception as e:
        logger.error(f"Error getting metadata statistics: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/locations/statistics")
async def get_location_statistics(db: Session = Depends(get_db)):
    """Get location usage statistics."""
    try:
        geo_service = GeoLocationService(db)
        stats = geo_service.get_location_statistics()
        return stats
        
    except Exception as e:
        logger.error(f"Error getting location statistics: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# Utility Endpoints
@router.post("/geocode")
async def geocode_address(
    address: str,
    db: Session = Depends(get_db)
):
    """Geocode an address to coordinates."""
    try:
        geo_service = GeoLocationService(db)
        coordinates = await geo_service.geocode_address(address)
        
        if not coordinates:
            raise HTTPException(status_code=404, detail="Address not found")
        
        return {
            "address": address,
            "latitude": coordinates[0],
            "longitude": coordinates[1]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error geocoding address: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/reverse-geocode")
async def reverse_geocode(
    latitude: float,
    longitude: float,
    db: Session = Depends(get_db)
):
    """Reverse geocode coordinates to location information."""
    try:
        geo_service = GeoLocationService(db)
        location_data = await geo_service.reverse_geocode(latitude, longitude)
        
        if not location_data:
            raise HTTPException(status_code=404, detail="Location not found")
        
        return location_data.dict()
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error reverse geocoding: {e}")
        raise HTTPException(status_code=500, detail="Internal server error") 