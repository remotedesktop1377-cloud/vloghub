"""
Main metadata service that orchestrates all metadata operations.
"""
import logging
from typing import List, Optional, Dict, Any
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func

from src.models.metadata import (
    ClipMetadata, VideoMetadata, Tag, GeoLocation, MetadataVersion,
    ClipMetadataCreate, ClipMetadataUpdate, ClipMetadataResponse,
    MetadataSearchFilters, MetadataSearchResult, SentimentData, EntityData,
    ConfidenceLevel, MetadataSource
)
from src.services.metadata.tag_service import TagService
from src.services.metadata.automated_tagger import AutomatedTagger
from src.services.metadata.geo_service import GeoLocationService

logger = logging.getLogger(__name__)


class MetadataService:
    """Main service for metadata operations."""
    
    def __init__(self, db: Session):
        """
        Initialize metadata service.
        
        Args:
            db: Database session.
        """
        self.db = db
        self.tag_service = TagService(db)
        self.automated_tagger = AutomatedTagger(db)
        self.geo_service = GeoLocationService(db)
    
    async def create_clip_metadata(
        self,
        clip_data: ClipMetadataCreate,
        auto_tag: bool = True
    ) -> ClipMetadataResponse:
        """
        Create metadata for a new clip.
        
        Args:
            clip_data: Clip metadata creation data.
            auto_tag: Whether to apply automated tagging.
            
        Returns:
            Created clip metadata.
        """
        # Check if clip already exists
        existing = self.db.query(ClipMetadata).filter(
            ClipMetadata.clip_id == clip_data.clip_id
        ).first()
        
        if existing:
            raise ValueError(f"Clip metadata already exists for {clip_data.clip_id}")
        
        # Calculate duration
        duration = clip_data.end_time - clip_data.start_time
        
        # Create clip metadata
        clip_metadata = ClipMetadata(
            clip_id=clip_data.clip_id,
            video_id=clip_data.video_id,
            title=clip_data.title,
            description=clip_data.description,
            start_time=clip_data.start_time,
            end_time=clip_data.end_time,
            duration=duration,
            transcript_text=clip_data.transcript_text
        )
        
        # Process sentiment data
        if clip_data.sentiment_data:
            clip_metadata.sentiment_score = clip_data.sentiment_data.score
            clip_metadata.sentiment_label = clip_data.sentiment_data.label
            clip_metadata.emotion_scores = clip_data.sentiment_data.emotions
        
        # Process content analysis
        if clip_data.topic_labels:
            clip_metadata.topic_labels = clip_data.topic_labels
        
        if clip_data.named_entities:
            clip_metadata.named_entities = [entity.dict() for entity in clip_data.named_entities]
        
        if clip_data.keywords:
            clip_metadata.keywords = clip_data.keywords
        
        # Process speaker information
        if clip_data.speaker_name:
            clip_metadata.speaker_name = clip_data.speaker_name
        
        # Process geographic location
        if clip_data.geo_location:
            geo_location = await self.geo_service.create_or_get_location(clip_data.geo_location)
            clip_metadata.geo_location_id = geo_location.id
        
        # Set event date
        if clip_data.event_date:
            clip_metadata.event_date = clip_data.event_date
        
        # Save to database
        self.db.add(clip_metadata)
        self.db.commit()
        self.db.refresh(clip_metadata)
        
        # Process tags
        if clip_data.tag_ids:
            await self._assign_tags_to_clip(str(clip_metadata.id), clip_data.tag_ids)
        
        # Apply automated tagging if requested
        if auto_tag and clip_data.transcript_text:
            try:
                analysis_result = await self.automated_tagger.analyze_and_tag_clip(
                    clip_data.clip_id,
                    text=clip_data.transcript_text
                )
                
                # Auto-apply high-confidence tags
                auto_tag_ids = await self.automated_tagger.auto_apply_tags(
                    clip_data.clip_id,
                    analysis_result.suggested_tags,
                    min_confidence=0.8
                )
                
                if auto_tag_ids:
                    await self._assign_tags_to_clip(str(clip_metadata.id), auto_tag_ids)
                
            except Exception as e:
                logger.error(f"Automated tagging failed for clip {clip_data.clip_id}: {e}")
        
        # Create initial version record
        await self._create_version_record(
            str(clip_metadata.id),
            1,
            {"action": "created"},
            "system",
            "Initial metadata creation"
        )
        
        logger.info(f"Created metadata for clip {clip_data.clip_id}")
        return await self._convert_to_response(clip_metadata)
    
    async def get_clip_metadata(self, clip_id: str) -> Optional[ClipMetadataResponse]:
        """
        Get clip metadata by clip ID.
        
        Args:
            clip_id: Clip identifier.
            
        Returns:
            Clip metadata or None if not found.
        """
        clip_metadata = self.db.query(ClipMetadata).filter(
            ClipMetadata.clip_id == clip_id
        ).first()
        
        if not clip_metadata:
            return None
        
        return await self._convert_to_response(clip_metadata)
    
    async def update_clip_metadata(
        self,
        clip_id: str,
        update_data: ClipMetadataUpdate,
        changed_by: str = "user"
    ) -> Optional[ClipMetadataResponse]:
        """
        Update clip metadata.
        
        Args:
            clip_id: Clip identifier.
            update_data: Update data.
            changed_by: Who made the changes.
            
        Returns:
            Updated clip metadata or None if not found.
        """
        clip_metadata = self.db.query(ClipMetadata).filter(
            ClipMetadata.clip_id == clip_id
        ).first()
        
        if not clip_metadata:
            return None
        
        # Track changes for versioning
        changes = {}
        
        # Update fields
        if update_data.title is not None:
            changes["title"] = {"old": clip_metadata.title, "new": update_data.title}
            clip_metadata.title = update_data.title
        
        if update_data.description is not None:
            changes["description"] = {"old": clip_metadata.description, "new": update_data.description}
            clip_metadata.description = update_data.description
        
        if update_data.sentiment_data is not None:
            changes["sentiment"] = {
                "old": {
                    "score": clip_metadata.sentiment_score,
                    "label": clip_metadata.sentiment_label
                },
                "new": {
                    "score": update_data.sentiment_data.score,
                    "label": update_data.sentiment_data.label
                }
            }
            clip_metadata.sentiment_score = update_data.sentiment_data.score
            clip_metadata.sentiment_label = update_data.sentiment_data.label
            clip_metadata.emotion_scores = update_data.sentiment_data.emotions
        
        if update_data.topic_labels is not None:
            changes["topics"] = {"old": clip_metadata.topic_labels, "new": update_data.topic_labels}
            clip_metadata.topic_labels = update_data.topic_labels
        
        if update_data.named_entities is not None:
            changes["entities"] = {
                "old": clip_metadata.named_entities,
                "new": [entity.dict() for entity in update_data.named_entities]
            }
            clip_metadata.named_entities = [entity.dict() for entity in update_data.named_entities]
        
        if update_data.keywords is not None:
            changes["keywords"] = {"old": clip_metadata.keywords, "new": update_data.keywords}
            clip_metadata.keywords = update_data.keywords
        
        if update_data.speaker_name is not None:
            changes["speaker"] = {"old": clip_metadata.speaker_name, "new": update_data.speaker_name}
            clip_metadata.speaker_name = update_data.speaker_name
        
        if update_data.geo_location is not None:
            geo_location = await self.geo_service.create_or_get_location(update_data.geo_location)
            changes["geo_location"] = {"old": clip_metadata.geo_location_id, "new": geo_location.id}
            clip_metadata.geo_location_id = geo_location.id
        
        if update_data.event_date is not None:
            changes["event_date"] = {"old": clip_metadata.event_date, "new": update_data.event_date}
            clip_metadata.event_date = update_data.event_date
        
        if update_data.user_rating is not None:
            changes["rating"] = {"old": clip_metadata.user_rating, "new": update_data.user_rating}
            clip_metadata.user_rating = update_data.user_rating
        
        if update_data.user_notes is not None:
            changes["notes"] = {"old": clip_metadata.user_notes, "new": update_data.user_notes}
            clip_metadata.user_notes = update_data.user_notes
        
        if update_data.is_favorite is not None:
            changes["favorite"] = {"old": clip_metadata.is_favorite, "new": update_data.is_favorite}
            clip_metadata.is_favorite = update_data.is_favorite
        
        # Update tags if provided
        if update_data.tag_ids is not None:
            # Remove existing tags
            clip_metadata.tags.clear()
            # Add new tags
            if update_data.tag_ids:
                await self._assign_tags_to_clip(str(clip_metadata.id), update_data.tag_ids)
            changes["tags"] = {"updated": True}
        
        # Update metadata
        clip_metadata.version += 1
        clip_metadata.updated_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(clip_metadata)
        
        # Create version record if there were changes
        if changes:
            await self._create_version_record(
                str(clip_metadata.id),
                clip_metadata.version,
                changes,
                changed_by,
                "Metadata updated"
            )
        
        logger.info(f"Updated metadata for clip {clip_id}")
        return await self._convert_to_response(clip_metadata)
    
    async def search_clips(
        self,
        filters: MetadataSearchFilters,
        page: int = 1,
        page_size: int = 20
    ) -> MetadataSearchResult:
        """
        Search clips by metadata filters.
        
        Args:
            filters: Search filters.
            page: Page number (1-based).
            page_size: Results per page.
            
        Returns:
            Search results.
        """
        query = self.db.query(ClipMetadata)
        
        # Apply filters
        if filters.tags:
            # Filter by tags
            query = query.join(ClipMetadata.tags).filter(
                Tag.name.in_(filters.tags)
            )
        
        if filters.sentiment:
            query = query.filter(ClipMetadata.sentiment_label == filters.sentiment)
        
        if filters.date_from:
            query = query.filter(ClipMetadata.event_date >= filters.date_from)
        
        if filters.date_to:
            query = query.filter(ClipMetadata.event_date <= filters.date_to)
        
        if filters.speaker:
            query = query.filter(ClipMetadata.speaker_name.ilike(f"%{filters.speaker}%"))
        
        if filters.location:
            query = query.join(ClipMetadata.geo_location).filter(
                or_(
                    GeoLocation.name.ilike(f"%{filters.location}%"),
                    GeoLocation.city.ilike(f"%{filters.location}%"),
                    GeoLocation.country.ilike(f"%{filters.location}%")
                )
            )
        
        if filters.topic:
            query = query.filter(
                ClipMetadata.topic_labels.contains([filters.topic])
            )
        
        if filters.min_duration:
            query = query.filter(ClipMetadata.duration >= filters.min_duration)
        
        if filters.max_duration:
            query = query.filter(ClipMetadata.duration <= filters.max_duration)
        
        if filters.min_relevance:
            query = query.filter(ClipMetadata.relevance_score >= filters.min_relevance)
        
        if filters.is_favorite is not None:
            query = query.filter(ClipMetadata.is_favorite == filters.is_favorite)
        
        if filters.language:
            # This would require language detection integration
            pass
        
        # Get total count
        total_count = query.count()
        
        # Apply pagination
        offset = (page - 1) * page_size
        clips = query.offset(offset).limit(page_size).all()
        
        # Convert to responses
        clip_responses = []
        for clip in clips:
            response = await self._convert_to_response(clip)
            clip_responses.append(response)
        
        # Calculate aggregations
        aggregations = await self._calculate_aggregations(query)
        
        return MetadataSearchResult(
            clips=clip_responses,
            total_count=total_count,
            page=page,
            page_size=page_size,
            filters_applied=filters,
            aggregations=aggregations
        )
    
    async def get_metadata_statistics(self) -> Dict[str, Any]:
        """Get comprehensive metadata statistics."""
        # Basic counts
        total_clips = self.db.query(func.count(ClipMetadata.id)).scalar()
        total_videos = self.db.query(func.count(VideoMetadata.id)).scalar()
        
        # Sentiment distribution
        sentiment_stats = (self.db.query(ClipMetadata.sentiment_label, func.count(ClipMetadata.id))
                         .filter(ClipMetadata.sentiment_label.isnot(None))
                         .group_by(ClipMetadata.sentiment_label)
                         .all())
        
        # Duration statistics
        duration_stats = self.db.query(
            func.avg(ClipMetadata.duration),
            func.min(ClipMetadata.duration),
            func.max(ClipMetadata.duration)
        ).first()
        
        # Top speakers
        speaker_stats = (self.db.query(ClipMetadata.speaker_name, func.count(ClipMetadata.id))
                        .filter(ClipMetadata.speaker_name.isnot(None))
                        .group_by(ClipMetadata.speaker_name)
                        .order_by(func.count(ClipMetadata.id).desc())
                        .limit(10)
                        .all())
        
        # Geographic distribution
        geo_stats = (self.db.query(GeoLocation.country, func.count(ClipMetadata.id))
                    .join(ClipMetadata.geo_location)
                    .filter(GeoLocation.country.isnot(None))
                    .group_by(GeoLocation.country)
                    .order_by(func.count(ClipMetadata.id).desc())
                    .limit(10)
                    .all())
        
        # Get tag statistics
        tag_stats = self.tag_service.get_tag_statistics()
        
        return {
            "total_clips": total_clips,
            "total_videos": total_videos,
            "sentiment_distribution": dict(sentiment_stats),
            "duration": {
                "average": float(duration_stats[0]) if duration_stats[0] else 0.0,
                "minimum": float(duration_stats[1]) if duration_stats[1] else 0.0,
                "maximum": float(duration_stats[2]) if duration_stats[2] else 0.0
            },
            "top_speakers": [{"name": name, "count": count} for name, count in speaker_stats],
            "geographic_distribution": [{"country": country, "count": count} for country, count in geo_stats],
            "tags": tag_stats
        }
    
    async def get_related_clips(
        self,
        clip_id: str,
        limit: int = 10
    ) -> List[ClipMetadataResponse]:
        """
        Find clips related to the given clip.
        
        Args:
            clip_id: Source clip ID.
            limit: Maximum results.
            
        Returns:
            List of related clips.
        """
        clip = self.db.query(ClipMetadata).filter(
            ClipMetadata.clip_id == clip_id
        ).first()
        
        if not clip:
            return []
        
        # Find clips with similar characteristics
        query = self.db.query(ClipMetadata).filter(
            ClipMetadata.clip_id != clip_id
        )
        
        # Similar sentiment
        if clip.sentiment_label:
            query = query.filter(ClipMetadata.sentiment_label == clip.sentiment_label)
        
        # Similar speaker
        if clip.speaker_name:
            query = query.filter(ClipMetadata.speaker_name == clip.speaker_name)
        
        # Similar tags (simplified - would need more complex logic for proper similarity)
        related_clips = query.order_by(ClipMetadata.relevance_score.desc()).limit(limit).all()
        
        # Convert to responses
        responses = []
        for related_clip in related_clips:
            response = await self._convert_to_response(related_clip)
            responses.append(response)
        
        return responses
    
    async def _assign_tags_to_clip(self, clip_metadata_id: str, tag_ids: List[str]) -> None:
        """Assign tags to a clip."""
        clip_metadata = self.db.query(ClipMetadata).filter(
            ClipMetadata.id == clip_metadata_id
        ).first()
        
        if not clip_metadata:
            return
        
        for tag_id in tag_ids:
            tag = self.tag_service.get_tag_by_id(tag_id)
            if tag and tag not in clip_metadata.tags:
                clip_metadata.tags.append(tag)
                self.tag_service.increment_tag_usage(tag_id)
        
        self.db.commit()
    
    async def _create_version_record(
        self,
        clip_metadata_id: str,
        version: int,
        changes: Dict[str, Any],
        changed_by: str,
        reason: str
    ) -> MetadataVersion:
        """Create a version record for metadata changes."""
        version_record = MetadataVersion(
            clip_metadata_id=clip_metadata_id,
            version_number=version,
            changes=changes,
            changed_by=changed_by,
            change_reason=reason
        )
        
        self.db.add(version_record)
        self.db.commit()
        return version_record
    
    async def _convert_to_response(self, clip_metadata: ClipMetadata) -> ClipMetadataResponse:
        """Convert ClipMetadata to response model."""
        # Convert named entities
        named_entities = []
        if clip_metadata.named_entities:
            for entity_dict in clip_metadata.named_entities:
                entity = EntityData(**entity_dict)
                named_entities.append(entity)
        
        # Convert geo location
        geo_location = None
        if clip_metadata.geo_location:
            geo_location = {
                "name": clip_metadata.geo_location.name,
                "latitude": clip_metadata.geo_location.latitude,
                "longitude": clip_metadata.geo_location.longitude,
                "country": clip_metadata.geo_location.country,
                "city": clip_metadata.geo_location.city
            }
        
        # Convert tags
        tags = []
        for tag in clip_metadata.tags:
            tag_response = {
                "id": str(tag.id),
                "name": tag.name,
                "tag_type": tag.tag_type,
                "confidence": tag.confidence,
                "confidence_level": tag.confidence_level,
                "source": tag.source,
                "usage_count": tag.usage_count,
                "is_active": tag.is_active,
                "created_at": tag.created_at,
                "updated_at": tag.updated_at
            }
            tags.append(tag_response)
        
        return ClipMetadataResponse(
            id=str(clip_metadata.id),
            clip_id=clip_metadata.clip_id,
            video_id=str(clip_metadata.video_id),
            title=clip_metadata.title,
            description=clip_metadata.description,
            start_time=clip_metadata.start_time,
            end_time=clip_metadata.end_time,
            duration=clip_metadata.duration,
            transcript_text=clip_metadata.transcript_text,
            sentiment_score=clip_metadata.sentiment_score,
            sentiment_label=clip_metadata.sentiment_label,
            topic_labels=clip_metadata.topic_labels,
            named_entities=named_entities,
            keywords=clip_metadata.keywords,
            speaker_name=clip_metadata.speaker_name,
            geo_location=geo_location,
            event_date=clip_metadata.event_date,
            relevance_score=clip_metadata.relevance_score,
            user_rating=clip_metadata.user_rating,
            user_notes=clip_metadata.user_notes,
            is_favorite=clip_metadata.is_favorite,
            tags=tags,
            created_at=clip_metadata.created_at,
            updated_at=clip_metadata.updated_at
        )
    
    async def _calculate_aggregations(self, query) -> Dict[str, Any]:
        """Calculate aggregations for search results."""
        # This is a simplified implementation
        # In practice, you'd calculate various aggregations based on the query
        return {
            "sentiment_counts": {},
            "speaker_counts": {},
            "topic_counts": {},
            "duration_ranges": {}
        } 