"""
Unit tests for TagService.
"""
import pytest
from unittest.mock import Mock, patch
from sqlalchemy.exc import SQLAlchemyError

from src.services.metadata.tag_service import TagService
from src.models.metadata import Tag, TagCategory, TagType, ConfidenceLevel, MetadataSource


@pytest.mark.unit
@pytest.mark.db
class TestTagService:
    """Test cases for TagService."""
    
    def test_create_tag_category_success(self, tag_service, test_session):
        """Test successful tag category creation."""
        category = tag_service.create_tag_category(
            name="Test Category",
            description="Test description",
            color="#FF0000",
            icon="test_icon"
        )
        
        assert category.name == "Test Category"
        assert category.description == "Test description"
        assert category.color == "#FF0000"
        assert category.icon == "test_icon"
        assert category.id is not None
        
        # Verify it's in the database
        db_category = test_session.query(TagCategory).filter(
            TagCategory.name == "Test Category"
        ).first()
        assert db_category is not None
        assert db_category.name == "Test Category"
    
    def test_create_tag_category_duplicate_name(self, tag_service, sample_tag_category):
        """Test creating tag category with duplicate name raises error."""
        with pytest.raises(ValueError, match="Tag category .* already exists"):
            tag_service.create_tag_category(
                name=sample_tag_category.name,
                description="Different description"
            )
    
    def test_get_tag_categories(self, tag_service, test_session):
        """Test retrieving tag categories."""
        # Create test categories
        category1 = TagCategory(name="Category 1", description="First category")
        category2 = TagCategory(name="Category 2", description="Second category", parent_id=None)
        category3 = TagCategory(name="Category 3", description="Child category")
        
        test_session.add_all([category1, category2, category3])
        test_session.commit()
        
        # Test getting all categories
        categories = tag_service.get_tag_categories(include_children=True)
        assert len(categories) >= 3
        
        category_names = [cat.name for cat in categories]
        assert "Category 1" in category_names
        assert "Category 2" in category_names
        assert "Category 3" in category_names
    
    def test_create_tag_success(self, tag_service, sample_tag_category):
        """Test successful tag creation."""
        tag = tag_service.create_tag(
            name="Nelson Mandela",
            tag_type=TagType.PERSON,
            category_id=str(sample_tag_category.id),
            description="Former President of South Africa",
            confidence=0.95,
            confidence_level=ConfidenceLevel.HIGH,
            source=MetadataSource.AI_ANALYSIS
        )
        
        assert tag.name == "Nelson Mandela"
        assert tag.tag_type == TagType.PERSON.value
        assert tag.category_id == sample_tag_category.id
        assert tag.description == "Former President of South Africa"
        assert tag.confidence == 0.95
        assert tag.confidence_level == ConfidenceLevel.HIGH.value
        assert tag.source == MetadataSource.AI_ANALYSIS.value
        assert tag.is_active is True
        assert tag.usage_count == 0
    
    def test_create_tag_duplicate(self, tag_service, sample_tag):
        """Test creating duplicate tag raises error."""
        with pytest.raises(ValueError, match="Tag .* already exists"):
            tag_service.create_tag(
                name=sample_tag.name,
                tag_type=TagType(sample_tag.tag_type),
                description="Different description"
            )
    
    def test_create_tag_reactivate_inactive(self, tag_service, test_session):
        """Test reactivating an inactive tag."""
        # Create inactive tag
        inactive_tag = Tag(
            name="Inactive Tag",
            tag_type=TagType.TOPIC.value,
            is_active=False
        )
        test_session.add(inactive_tag)
        test_session.commit()
        
        # Try to create the same tag again
        reactivated_tag = tag_service.create_tag(
            name="Inactive Tag",
            tag_type=TagType.TOPIC
        )
        
        assert reactivated_tag.id == inactive_tag.id
        assert reactivated_tag.is_active is True
    
    def test_get_tag_by_id(self, tag_service, sample_tag):
        """Test retrieving tag by ID."""
        tag = tag_service.get_tag_by_id(str(sample_tag.id))
        
        assert tag is not None
        assert tag.id == sample_tag.id
        assert tag.name == sample_tag.name
        
        # Test non-existent ID
        non_existent_tag = tag_service.get_tag_by_id("non-existent-id")
        assert non_existent_tag is None
    
    def test_get_tag_by_name(self, tag_service, sample_tag):
        """Test retrieving tag by name."""
        tag = tag_service.get_tag_by_name(sample_tag.name)
        
        assert tag is not None
        assert tag.name == sample_tag.name
        
        # Test with type filter
        tag_with_type = tag_service.get_tag_by_name(
            sample_tag.name, 
            TagType(sample_tag.tag_type)
        )
        assert tag_with_type is not None
        
        # Test with wrong type
        tag_wrong_type = tag_service.get_tag_by_name(
            sample_tag.name,
            TagType.LOCATION
        )
        assert tag_wrong_type is None
        
        # Test non-existent name
        non_existent_tag = tag_service.get_tag_by_name("Non-existent Tag")
        assert non_existent_tag is None
    
    def test_search_tags(self, tag_service, test_session, sample_tag_category):
        """Test searching tags with various filters."""
        # Create test tags
        tag1 = Tag(
            name="Nelson Mandela",
            tag_type=TagType.PERSON.value,
            category_id=sample_tag_category.id,
            confidence=0.9,
            source=MetadataSource.AI_ANALYSIS.value,
            usage_count=5
        )
        tag2 = Tag(
            name="South Africa",
            tag_type=TagType.LOCATION.value,
            confidence=0.8,
            source=MetadataSource.USER_INPUT.value,
            usage_count=3
        )
        tag3 = Tag(
            name="Freedom",
            tag_type=TagType.TOPIC.value,
            confidence=0.7,
            source=MetadataSource.AI_ANALYSIS.value,
            usage_count=10
        )
        
        test_session.add_all([tag1, tag2, tag3])
        test_session.commit()
        
        # Test text search
        mandela_tags = tag_service.search_tags(query="Mandela")
        assert len(mandela_tags) >= 1
        assert any(tag.name == "Nelson Mandela" for tag in mandela_tags)
        
        # Test type filter
        person_tags = tag_service.search_tags(tag_type=TagType.PERSON)
        assert len(person_tags) >= 1
        assert all(tag.tag_type == TagType.PERSON.value for tag in person_tags)
        
        # Test category filter
        category_tags = tag_service.search_tags(category_id=str(sample_tag_category.id))
        assert len(category_tags) >= 1
        assert all(tag.category_id == sample_tag_category.id for tag in category_tags)
        
        # Test confidence filter
        high_confidence_tags = tag_service.search_tags(min_confidence=0.85)
        assert all(tag.confidence >= 0.85 for tag in high_confidence_tags)
        
        # Test source filter
        ai_tags = tag_service.search_tags(source=MetadataSource.AI_ANALYSIS)
        assert all(tag.source == MetadataSource.AI_ANALYSIS.value for tag in ai_tags)
        
        # Test limit
        limited_tags = tag_service.search_tags(limit=2)
        assert len(limited_tags) <= 2
    
    def test_get_popular_tags(self, tag_service, test_session):
        """Test retrieving popular tags by usage count."""
        # Create tags with different usage counts
        tag1 = Tag(name="Popular Tag", tag_type=TagType.TOPIC.value, usage_count=100)
        tag2 = Tag(name="Medium Tag", tag_type=TagType.PERSON.value, usage_count=50)
        tag3 = Tag(name="Unpopular Tag", tag_type=TagType.LOCATION.value, usage_count=1)
        
        test_session.add_all([tag1, tag2, tag3])
        test_session.commit()
        
        popular_tags = tag_service.get_popular_tags(limit=2)
        
        assert len(popular_tags) <= 2
        # Should be ordered by usage count descending
        if len(popular_tags) >= 2:
            assert popular_tags[0].usage_count >= popular_tags[1].usage_count
        
        # Test with type filter
        person_popular = tag_service.get_popular_tags(tag_type=TagType.PERSON, limit=5)
        assert all(tag.tag_type == TagType.PERSON.value for tag in person_popular)
    
    def test_get_related_tags(self, tag_service, test_session, sample_tag_category):
        """Test retrieving related tags."""
        # Create main tag
        main_tag = Tag(
            name="Main Tag",
            tag_type=TagType.PERSON.value,
            category_id=sample_tag_category.id
        )
        test_session.add(main_tag)
        test_session.commit()
        test_session.refresh(main_tag)
        
        # Create related tags (same type or category)
        related_tag1 = Tag(
            name="Related Person",
            tag_type=TagType.PERSON.value,
            usage_count=10
        )
        related_tag2 = Tag(
            name="Related Category Tag",
            tag_type=TagType.TOPIC.value,
            category_id=sample_tag_category.id,
            usage_count=5
        )
        unrelated_tag = Tag(
            name="Unrelated Tag",
            tag_type=TagType.LOCATION.value,
            usage_count=1
        )
        
        test_session.add_all([related_tag1, related_tag2, unrelated_tag])
        test_session.commit()
        
        related_tags = tag_service.get_related_tags(str(main_tag.id), limit=5)
        
        # Should exclude the main tag itself
        assert not any(tag.id == main_tag.id for tag in related_tags)
        
        # Should include related tags
        related_names = [tag.name for tag in related_tags]
        assert "Related Person" in related_names or "Related Category Tag" in related_names
    
    def test_update_tag(self, tag_service, sample_tag):
        """Test updating tag information."""
        updated_tag = tag_service.update_tag(
            tag_id=str(sample_tag.id),
            name="Updated Tag Name",
            description="Updated description",
            is_active=False
        )
        
        assert updated_tag is not None
        assert updated_tag.name == "Updated Tag Name"
        assert updated_tag.description == "Updated description"
        assert updated_tag.is_active is False
        
        # Test updating non-existent tag
        non_existent_update = tag_service.update_tag(
            tag_id="non-existent-id",
            name="New Name"
        )
        assert non_existent_update is None
    
    def test_update_tag_duplicate_name(self, tag_service, test_session, sample_tag):
        """Test updating tag with duplicate name raises error."""
        # Create another tag
        other_tag = Tag(
            name="Other Tag",
            tag_type=TagType.PERSON.value
        )
        test_session.add(other_tag)
        test_session.commit()
        
        # Try to update sample_tag to have the same name as other_tag
        with pytest.raises(ValueError, match="Tag .* already exists"):
            tag_service.update_tag(
                tag_id=str(sample_tag.id),
                name="Other Tag"
            )
    
    def test_delete_tag(self, tag_service, sample_tag):
        """Test soft deleting a tag."""
        success = tag_service.delete_tag(str(sample_tag.id))
        
        assert success is True
        
        # Verify tag is marked as inactive
        updated_tag = tag_service.get_tag_by_id(str(sample_tag.id))
        assert updated_tag.is_active is False
        
        # Test deleting non-existent tag
        non_existent_delete = tag_service.delete_tag("non-existent-id")
        assert non_existent_delete is False
    
    def test_increment_tag_usage(self, tag_service, sample_tag):
        """Test incrementing tag usage count."""
        original_count = sample_tag.usage_count
        
        tag_service.increment_tag_usage(str(sample_tag.id))
        
        updated_tag = tag_service.get_tag_by_id(str(sample_tag.id))
        assert updated_tag.usage_count == original_count + 1
        
        # Test incrementing non-existent tag (should not raise error)
        tag_service.increment_tag_usage("non-existent-id")
    
    def test_get_tag_statistics(self, tag_service, test_session):
        """Test retrieving tag statistics."""
        # Create test tags with various properties
        tag1 = Tag(
            name="Tag 1",
            tag_type=TagType.PERSON.value,
            source=MetadataSource.AI_ANALYSIS.value,
            usage_count=10
        )
        tag2 = Tag(
            name="Tag 2",
            tag_type=TagType.LOCATION.value,
            source=MetadataSource.USER_INPUT.value,
            usage_count=5
        )
        tag3 = Tag(
            name="Tag 3",
            tag_type=TagType.PERSON.value,
            source=MetadataSource.AI_ANALYSIS.value,
            usage_count=15,
            is_active=False  # Inactive tag
        )
        
        test_session.add_all([tag1, tag2, tag3])
        test_session.commit()
        
        stats = tag_service.get_tag_statistics()
        
        assert "total_tags" in stats
        assert "by_type" in stats
        assert "by_source" in stats
        assert "top_used" in stats
        
        # Should only count active tags
        assert stats["total_tags"] >= 2  # At least tag1 and tag2
        
        # Check type distribution
        assert TagType.PERSON.value in stats["by_type"]
        assert TagType.LOCATION.value in stats["by_type"]
        
        # Check source distribution
        assert MetadataSource.AI_ANALYSIS.value in stats["by_source"]
        assert MetadataSource.USER_INPUT.value in stats["by_source"]
        
        # Check top used tags (should only include active tags with usage > 0)
        top_used_names = [item["name"] for item in stats["top_used"]]
        assert "Tag 1" in top_used_names or "Tag 2" in top_used_names
        assert "Tag 3" not in top_used_names  # Inactive tag
    
    def test_suggest_tags_for_text(self, tag_service, test_session):
        """Test suggesting tags based on text content."""
        # Create test tags
        mandela_tag = Tag(name="Nelson Mandela", tag_type=TagType.PERSON.value, usage_count=10)
        freedom_tag = Tag(name="Freedom", tag_type=TagType.TOPIC.value, usage_count=8)
        africa_tag = Tag(name="South Africa", tag_type=TagType.LOCATION.value, usage_count=5)
        
        test_session.add_all([mandela_tag, freedom_tag, africa_tag])
        test_session.commit()
        
        # Test text that should match tags
        text = "Nelson Mandela fought for freedom in South Africa"
        suggestions = tag_service.suggest_tags_for_text(text, limit=5)
        
        suggested_names = [tag.name for tag in suggestions]
        assert "Nelson Mandela" in suggested_names
        assert "Freedom" in suggested_names
        assert "South Africa" in suggested_names
        
        # Test with type filter
        person_suggestions = tag_service.suggest_tags_for_text(
            text, 
            tag_type=TagType.PERSON,
            limit=5
        )
        assert all(tag.tag_type == TagType.PERSON.value for tag in person_suggestions)
    
    def test_merge_tags(self, tag_service, test_session):
        """Test merging tags."""
        # Create source and target tags
        source_tag = Tag(
            name="Source Tag",
            tag_type=TagType.PERSON.value,
            usage_count=5
        )
        target_tag = Tag(
            name="Target Tag",
            tag_type=TagType.PERSON.value,
            usage_count=10
        )
        
        test_session.add_all([source_tag, target_tag])
        test_session.commit()
        test_session.refresh(source_tag)
        test_session.refresh(target_tag)
        
        original_target_usage = target_tag.usage_count
        
        success = tag_service.merge_tags(str(source_tag.id), str(target_tag.id))
        
        assert success is True
        
        # Check that source tag is deactivated
        updated_source = tag_service.get_tag_by_id(str(source_tag.id))
        assert updated_source.is_active is False
        
        # Check that target tag usage is updated
        updated_target = tag_service.get_tag_by_id(str(target_tag.id))
        assert updated_target.usage_count == original_target_usage + source_tag.usage_count
    
    def test_merge_tags_different_types(self, tag_service, test_session):
        """Test merging tags of different types raises error."""
        source_tag = Tag(name="Source", tag_type=TagType.PERSON.value)
        target_tag = Tag(name="Target", tag_type=TagType.LOCATION.value)
        
        test_session.add_all([source_tag, target_tag])
        test_session.commit()
        test_session.refresh(source_tag)
        test_session.refresh(target_tag)
        
        with pytest.raises(ValueError, match="Cannot merge tags of different types"):
            tag_service.merge_tags(str(source_tag.id), str(target_tag.id))
    
    def test_merge_tags_nonexistent(self, tag_service):
        """Test merging non-existent tags."""
        success = tag_service.merge_tags("non-existent-1", "non-existent-2")
        assert success is False
    
    @patch('src.services.metadata.tag_service.logger')
    def test_database_error_handling(self, mock_logger, tag_service, test_session):
        """Test proper error handling for database errors."""
        # Mock database session to raise an error
        with patch.object(test_session, 'add', side_effect=SQLAlchemyError("DB Error")):
            with pytest.raises(SQLAlchemyError):
                tag_service.create_tag_category(name="Test Category")
        
        # Verify error was logged (in a real implementation)
        # mock_logger.error.assert_called_once()
    
    def test_tag_service_with_empty_database(self, tag_service):
        """Test tag service operations with empty database."""
        tags = tag_service.search_tags()
        assert len(tags) == 0
        
        categories = tag_service.get_tag_categories()
        assert len(categories) == 0
        
        popular_tags = tag_service.get_popular_tags()
        assert len(popular_tags) == 0
        
        stats = tag_service.get_tag_statistics()
        assert stats["total_tags"] == 0
        assert len(stats["by_type"]) == 0
        assert len(stats["by_source"]) == 0
        assert len(stats["top_used"]) == 0 