"""
Tag management service for creating, organizing, and managing tags.
"""
import logging
from typing import List, Optional, Dict, Any
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func

from src.models.metadata import (
    Tag, TagCategory, TagType, ConfidenceLevel, MetadataSource,
    TagCreate, TagResponse
)

logger = logging.getLogger(__name__)


class TagService:
    """Service for managing tags and tag categories."""
    
    def __init__(self, db: Session):
        """
        Initialize tag service.
        
        Args:
            db: Database session.
        """
        self.db = db
    
    def create_tag_category(
        self, 
        name: str, 
        description: Optional[str] = None,
        color: Optional[str] = None,
        icon: Optional[str] = None,
        parent_id: Optional[str] = None
    ) -> TagCategory:
        """
        Create a new tag category.
        
        Args:
            name: Category name.
            description: Category description.
            color: Hex color code.
            icon: Icon identifier.
            parent_id: Parent category ID for hierarchical organization.
            
        Returns:
            Created tag category.
        """
        # Check if category already exists
        existing = self.db.query(TagCategory).filter(TagCategory.name == name).first()
        if existing:
            raise ValueError(f"Tag category '{name}' already exists")
        
        category = TagCategory(
            name=name,
            description=description,
            color=color,
            icon=icon,
            parent_id=parent_id
        )
        
        self.db.add(category)
        self.db.commit()
        self.db.refresh(category)
        
        logger.info(f"Created tag category: {name}")
        return category
    
    def get_tag_categories(self, include_children: bool = True) -> List[TagCategory]:
        """
        Get all tag categories.
        
        Args:
            include_children: Whether to include child categories.
            
        Returns:
            List of tag categories.
        """
        query = self.db.query(TagCategory)
        
        if not include_children:
            query = query.filter(TagCategory.parent_id.is_(None))
        
        return query.order_by(TagCategory.name).all()
    
    def create_tag(
        self,
        name: str,
        tag_type: TagType,
        category_id: Optional[str] = None,
        description: Optional[str] = None,
        confidence: float = 1.0,
        confidence_level: ConfidenceLevel = ConfidenceLevel.MANUAL,
        source: MetadataSource = MetadataSource.USER_INPUT
    ) -> Tag:
        """
        Create a new tag.
        
        Args:
            name: Tag name.
            tag_type: Type of tag.
            category_id: Optional category ID.
            description: Tag description.
            confidence: Confidence score.
            confidence_level: Confidence level.
            source: Source of the tag.
            
        Returns:
            Created tag.
        """
        # Check if tag already exists
        existing = self.db.query(Tag).filter(
            and_(Tag.name == name, Tag.tag_type == tag_type.value)
        ).first()
        
        if existing:
            if not existing.is_active:
                # Reactivate existing inactive tag
                existing.is_active = True
                existing.updated_at = datetime.utcnow()
                self.db.commit()
                return existing
            else:
                raise ValueError(f"Tag '{name}' of type '{tag_type}' already exists")
        
        tag = Tag(
            name=name,
            tag_type=tag_type.value,
            category_id=category_id,
            description=description,
            confidence=confidence,
            confidence_level=confidence_level.value,
            source=source.value
        )
        
        self.db.add(tag)
        self.db.commit()
        self.db.refresh(tag)
        
        logger.info(f"Created tag: {name} ({tag_type})")
        return tag
    
    def get_tag_by_id(self, tag_id: str) -> Optional[Tag]:
        """Get tag by ID."""
        return self.db.query(Tag).filter(Tag.id == tag_id).first()
    
    def get_tag_by_name(self, name: str, tag_type: Optional[TagType] = None) -> Optional[Tag]:
        """
        Get tag by name and optionally type.
        
        Args:
            name: Tag name.
            tag_type: Optional tag type filter.
            
        Returns:
            Tag if found.
        """
        query = self.db.query(Tag).filter(Tag.name == name, Tag.is_active == True)
        
        if tag_type:
            query = query.filter(Tag.tag_type == tag_type.value)
        
        return query.first()
    
    def search_tags(
        self,
        query: Optional[str] = None,
        tag_type: Optional[TagType] = None,
        category_id: Optional[str] = None,
        min_confidence: Optional[float] = None,
        source: Optional[MetadataSource] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[Tag]:
        """
        Search tags with filters.
        
        Args:
            query: Text search query.
            tag_type: Filter by tag type.
            category_id: Filter by category.
            min_confidence: Minimum confidence threshold.
            source: Filter by source.
            limit: Maximum results.
            offset: Results offset.
            
        Returns:
            List of matching tags.
        """
        db_query = self.db.query(Tag).filter(Tag.is_active == True)
        
        if query:
            search_term = f"%{query}%"
            db_query = db_query.filter(
                or_(
                    Tag.name.ilike(search_term),
                    Tag.description.ilike(search_term)
                )
            )
        
        if tag_type:
            db_query = db_query.filter(Tag.tag_type == tag_type.value)
        
        if category_id:
            db_query = db_query.filter(Tag.category_id == category_id)
        
        if min_confidence is not None:
            db_query = db_query.filter(Tag.confidence >= min_confidence)
        
        if source:
            db_query = db_query.filter(Tag.source == source.value)
        
        return (db_query
                .order_by(Tag.usage_count.desc(), Tag.name)
                .offset(offset)
                .limit(limit)
                .all())
    
    def get_popular_tags(
        self,
        tag_type: Optional[TagType] = None,
        limit: int = 20
    ) -> List[Tag]:
        """
        Get most popular tags by usage count.
        
        Args:
            tag_type: Optional tag type filter.
            limit: Maximum results.
            
        Returns:
            List of popular tags.
        """
        query = self.db.query(Tag).filter(
            and_(Tag.is_active == True, Tag.usage_count > 0)
        )
        
        if tag_type:
            query = query.filter(Tag.tag_type == tag_type.value)
        
        return query.order_by(Tag.usage_count.desc()).limit(limit).all()
    
    def get_related_tags(self, tag_id: str, limit: int = 10) -> List[Tag]:
        """
        Get tags related to the given tag (simplified approach).
        
        Args:
            tag_id: Source tag ID.
            limit: Maximum results.
            
        Returns:
            List of related tags.
        """
        tag = self.get_tag_by_id(tag_id)
        if not tag:
            return []
        
        # Simple approach: find tags of same type or category
        query = self.db.query(Tag).filter(
            and_(
                Tag.is_active == True,
                Tag.id != tag_id,
                or_(
                    Tag.tag_type == tag.tag_type,
                    Tag.category_id == tag.category_id
                )
            )
        )
        
        return query.order_by(Tag.usage_count.desc()).limit(limit).all()
    
    def update_tag(
        self,
        tag_id: str,
        name: Optional[str] = None,
        description: Optional[str] = None,
        category_id: Optional[str] = None,
        is_active: Optional[bool] = None
    ) -> Optional[Tag]:
        """
        Update tag information.
        
        Args:
            tag_id: Tag ID to update.
            name: New name.
            description: New description.
            category_id: New category ID.
            is_active: Active status.
            
        Returns:
            Updated tag or None if not found.
        """
        tag = self.get_tag_by_id(tag_id)
        if not tag:
            return None
        
        if name is not None:
            # Check for conflicts
            existing = self.db.query(Tag).filter(
                and_(
                    Tag.name == name,
                    Tag.tag_type == tag.tag_type,
                    Tag.id != tag_id
                )
            ).first()
            
            if existing:
                raise ValueError(f"Tag '{name}' already exists")
            
            tag.name = name
        
        if description is not None:
            tag.description = description
        
        if category_id is not None:
            tag.category_id = category_id
        
        if is_active is not None:
            tag.is_active = is_active
        
        tag.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(tag)
        
        logger.info(f"Updated tag: {tag.name}")
        return tag
    
    def delete_tag(self, tag_id: str) -> bool:
        """
        Soft delete a tag (mark as inactive).
        
        Args:
            tag_id: Tag ID to delete.
            
        Returns:
            True if deleted successfully.
        """
        tag = self.get_tag_by_id(tag_id)
        if not tag:
            return False
        
        tag.is_active = False
        tag.updated_at = datetime.utcnow()
        self.db.commit()
        
        logger.info(f"Deleted tag: {tag.name}")
        return True
    
    def increment_tag_usage(self, tag_id: str) -> None:
        """
        Increment tag usage count.
        
        Args:
            tag_id: Tag ID.
        """
        tag = self.get_tag_by_id(tag_id)
        if tag:
            tag.usage_count += 1
            tag.updated_at = datetime.utcnow()
            self.db.commit()
    
    def get_tag_statistics(self) -> Dict[str, Any]:
        """
        Get tag usage statistics.
        
        Returns:
            Dictionary with statistics.
        """
        total_tags = self.db.query(func.count(Tag.id)).filter(Tag.is_active == True).scalar()
        
        # Tags by type
        type_stats = (self.db.query(Tag.tag_type, func.count(Tag.id))
                     .filter(Tag.is_active == True)
                     .group_by(Tag.tag_type)
                     .all())
        
        # Tags by source
        source_stats = (self.db.query(Tag.source, func.count(Tag.id))
                       .filter(Tag.is_active == True)
                       .group_by(Tag.source)
                       .all())
        
        # Most used tags
        top_tags = (self.db.query(Tag.name, Tag.usage_count)
                   .filter(and_(Tag.is_active == True, Tag.usage_count > 0))
                   .order_by(Tag.usage_count.desc())
                   .limit(10)
                   .all())
        
        return {
            "total_tags": total_tags,
            "by_type": dict(type_stats),
            "by_source": dict(source_stats),
            "top_used": [{"name": name, "count": count} for name, count in top_tags]
        }
    
    def suggest_tags_for_text(
        self,
        text: str,
        tag_type: Optional[TagType] = None,
        limit: int = 10
    ) -> List[Tag]:
        """
        Suggest existing tags based on text content.
        
        Args:
            text: Text to analyze.
            tag_type: Optional tag type filter.
            limit: Maximum suggestions.
            
        Returns:
            List of suggested tags.
        """
        # Simple text matching approach
        words = text.lower().split()
        
        query = self.db.query(Tag).filter(Tag.is_active == True)
        
        if tag_type:
            query = query.filter(Tag.tag_type == tag_type.value)
        
        # Find tags that match words in the text
        matches = []
        for tag in query.all():
            tag_words = tag.name.lower().split()
            if any(word in words for word in tag_words):
                matches.append(tag)
        
        # Sort by usage count and relevance
        matches.sort(key=lambda t: t.usage_count, reverse=True)
        
        return matches[:limit]
    
    def merge_tags(self, source_tag_id: str, target_tag_id: str) -> bool:
        """
        Merge one tag into another.
        
        Args:
            source_tag_id: Tag to merge from.
            target_tag_id: Tag to merge into.
            
        Returns:
            True if merged successfully.
        """
        source_tag = self.get_tag_by_id(source_tag_id)
        target_tag = self.get_tag_by_id(target_tag_id)
        
        if not source_tag or not target_tag:
            return False
        
        if source_tag.tag_type != target_tag.tag_type:
            raise ValueError("Cannot merge tags of different types")
        
        # Update target tag usage count
        target_tag.usage_count += source_tag.usage_count
        
        # Move all clip associations from source to target
        # This would require updating the clip_tags association table
        # For now, just mark source as inactive
        source_tag.is_active = False
        source_tag.updated_at = datetime.utcnow()
        target_tag.updated_at = datetime.utcnow()
        
        self.db.commit()
        
        logger.info(f"Merged tag '{source_tag.name}' into '{target_tag.name}'")
        return True 