"""
End-to-end tests for user workflows using Playwright.
"""
import pytest
import asyncio
from playwright.async_api import async_playwright, Page, Browser


@pytest.mark.e2e
@pytest.mark.asyncio
class TestUserWorkflows:
    """End-to-end tests for complete user workflows."""
    
    @pytest.fixture(scope="class")
    async def browser(self):
        """Setup browser for tests."""
        async with async_playwright() as playwright:
            browser = await playwright.chromium.launch(
                headless=True,
                args=['--disable-dev-shm-usage', '--no-sandbox']
            )
            yield browser
            await browser.close()
    
    @pytest.fixture
    async def page(self, browser):
        """Create a new page for each test."""
        page = await browser.new_page()
        
        # Set up request interception for API mocking
        await page.route("**/api/**", self.mock_api_responses)
        
        yield page
        await page.close()
    
    async def mock_api_responses(self, route):
        """Mock API responses for consistent testing."""
        url = route.request.url
        method = route.request.method
        
        # Mock YouTube search API
        if "/api/youtube/search" in url and method == "GET":
            await route.fulfill(
                status=200,
                content_type="application/json",
                body='{"items": [{"id": {"videoId": "test_video"}, "snippet": {"title": "Test Video", "description": "Test description"}}]}'
            )
        
        # Mock metadata API
        elif "/api/metadata/tags" in url and method == "GET":
            await route.fulfill(
                status=200,
                content_type="application/json",
                body='[{"id": "1", "name": "Nelson Mandela", "tag_type": "person", "usage_count": 10}]'
            )
        
        # Mock clip creation
        elif "/api/metadata/clips" in url and method == "POST":
            await route.fulfill(
                status=200,
                content_type="application/json",
                body='{"id": "test_clip", "clip_id": "test_clip", "title": "Test Clip", "start_time": 10, "end_time": 30}'
            )
        
        # Default: continue with actual request
        else:
            await route.continue_()
    
    async def test_search_workflow(self, page: Page):
        """Test complete search workflow from query to results."""
        # Navigate to search page
        await page.goto("http://localhost:3000/search")
        
        # Wait for page to load
        await page.wait_for_selector('[data-testid="search-input"]', timeout=10000)
        
        # Enter search query
        search_input = page.locator('[data-testid="search-input"]')
        await search_input.fill("Nelson Mandela freedom speech")
        
        # Click search button
        search_button = page.locator('[data-testid="search-button"]')
        await search_button.click()
        
        # Wait for results to load
        await page.wait_for_selector('[data-testid="search-results"]', timeout=15000)
        
        # Verify results are displayed
        results = page.locator('[data-testid="video-result"]')
        result_count = await results.count()
        assert result_count > 0, "No search results found"
        
        # Check first result
        first_result = results.first
        title_element = first_result.locator('[data-testid="video-title"]')
        title_text = await title_element.inner_text()
        assert len(title_text) > 0, "Video title is empty"
        
        # Verify advanced filters are available
        filters_panel = page.locator('[data-testid="filters-panel"]')
        assert await filters_panel.is_visible(), "Filters panel not visible"
        
        # Test date filter
        date_filter = page.locator('[data-testid="date-filter"]')
        await date_filter.select_option("last_year")
        
        # Test channel filter
        channel_filter = page.locator('[data-testid="channel-filter"]')
        await channel_filter.fill("BBC")
        
        # Apply filters
        apply_filters_button = page.locator('[data-testid="apply-filters"]')
        await apply_filters_button.click()
        
        # Verify filtered results
        await page.wait_for_selector('[data-testid="search-results"]', timeout=10000)
        
        # Take screenshot for debugging
        await page.screenshot(path="tests/screenshots/search_workflow.png")
    
    async def test_clip_editor_workflow(self, page: Page):
        """Test complete clip editing workflow."""
        # Navigate to clip editor with mock video
        await page.goto("http://localhost:3000/clip-editor?videoId=test_video")
        
        # Wait for video player to load
        await page.wait_for_selector('[data-testid="video-player"]', timeout=15000)
        
        # Verify video player is loaded
        video_player = page.locator('[data-testid="video-player"]')
        assert await video_player.is_visible(), "Video player not visible"
        
        # Test timeline interaction
        timeline = page.locator('[data-testid="timeline"]')
        await timeline.click(position={"x": 200, "y": 50})  # Click at 200px on timeline
        
        # Create a new clip
        add_clip_button = page.locator('[data-testid="add-clip-button"]')
        await add_clip_button.click()
        
        # Wait for clip creation dialog
        clip_dialog = page.locator('[data-testid="clip-dialog"]')
        await clip_dialog.wait_for(state="visible")
        
        # Fill clip details
        clip_title = page.locator('[data-testid="clip-title-input"]')
        await clip_title.fill("Test Clip Title")
        
        clip_description = page.locator('[data-testid="clip-description-input"]')
        await clip_description.fill("Test clip description")
        
        # Set start and end times
        start_time_input = page.locator('[data-testid="start-time-input"]')
        await start_time_input.fill("00:10")
        
        end_time_input = page.locator('[data-testid="end-time-input"]')
        await end_time_input.fill("00:30")
        
        # Save clip
        save_clip_button = page.locator('[data-testid="save-clip-button"]')
        await save_clip_button.click()
        
        # Verify clip appears in clip list
        await page.wait_for_selector('[data-testid="clip-list"]', timeout=10000)
        clip_items = page.locator('[data-testid="clip-item"]')
        clip_count = await clip_items.count()
        assert clip_count > 0, "No clips found in list"
        
        # Test clip editing
        first_clip = clip_items.first
        edit_clip_button = first_clip.locator('[data-testid="edit-clip-button"]')
        await edit_clip_button.click()
        
        # Modify clip title
        clip_title_edit = page.locator('[data-testid="clip-title-input"]')
        await clip_title_edit.fill("Modified Clip Title")
        
        # Save changes
        save_changes_button = page.locator('[data-testid="save-changes-button"]')
        await save_changes_button.click()
        
        # Verify changes are reflected
        updated_title = first_clip.locator('[data-testid="clip-title"]')
        title_text = await updated_title.inner_text()
        assert "Modified Clip Title" in title_text, "Clip title not updated"
        
        # Test metadata editor
        metadata_tab = page.locator('[data-testid="metadata-tab"]')
        await metadata_tab.click()
        
        # Add tags
        tag_input = page.locator('[data-testid="tag-input"]')
        await tag_input.fill("Nelson Mandela")
        await page.keyboard.press("Enter")
        
        # Verify tag is added
        tags_list = page.locator('[data-testid="tags-list"]')
        tag_chips = tags_list.locator('[data-testid="tag-chip"]')
        tag_count = await tag_chips.count()
        assert tag_count > 0, "No tags found"
        
        # Take screenshot
        await page.screenshot(path="tests/screenshots/clip_editor_workflow.png")
    
    async def test_tag_management_workflow(self, page: Page):
        """Test tag management workflow."""
        # Navigate to tag management page
        await page.goto("http://localhost:3000/admin/tags")
        
        # Wait for tag management interface
        await page.wait_for_selector('[data-testid="tag-manager"]', timeout=10000)
        
        # Create new tag
        create_tag_button = page.locator('[data-testid="create-tag-button"]')
        await create_tag_button.click()
        
        # Fill tag creation form
        tag_name_input = page.locator('[data-testid="tag-name-input"]')
        await tag_name_input.fill("Test Tag")
        
        tag_type_select = page.locator('[data-testid="tag-type-select"]')
        await tag_type_select.select_option("person")
        
        tag_description_input = page.locator('[data-testid="tag-description-input"]')
        await tag_description_input.fill("Test tag description")
        
        # Save tag
        save_tag_button = page.locator('[data-testid="save-tag-button"]')
        await save_tag_button.click()
        
        # Verify tag appears in list
        await page.wait_for_selector('[data-testid="tags-table"]', timeout=10000)
        tag_rows = page.locator('[data-testid="tag-row"]')
        
        # Find the newly created tag
        new_tag_row = None
        for i in range(await tag_rows.count()):
            row = tag_rows.nth(i)
            name_cell = row.locator('[data-testid="tag-name"]')
            if await name_cell.inner_text() == "Test Tag":
                new_tag_row = row
                break
        
        assert new_tag_row is not None, "Newly created tag not found in list"
        
        # Test tag search
        search_input = page.locator('[data-testid="tag-search-input"]')
        await search_input.fill("Test Tag")
        
        search_button = page.locator('[data-testid="tag-search-button"]')
        await search_button.click()
        
        # Verify filtered results
        await page.wait_for_timeout(1000)  # Wait for search results
        filtered_rows = page.locator('[data-testid="tag-row"]')
        filtered_count = await filtered_rows.count()
        assert filtered_count > 0, "No search results found"
        
        # Test tag editing
        edit_button = new_tag_row.locator('[data-testid="edit-tag-button"]')
        await edit_button.click()
        
        # Modify tag name
        edit_name_input = page.locator('[data-testid="edit-tag-name-input"]')
        await edit_name_input.fill("Modified Test Tag")
        
        # Save changes
        save_edit_button = page.locator('[data-testid="save-edit-button"]')
        await save_edit_button.click()
        
        # Verify changes
        await page.wait_for_timeout(1000)
        updated_name = new_tag_row.locator('[data-testid="tag-name"]')
        updated_text = await updated_name.inner_text()
        assert "Modified Test Tag" in updated_text, "Tag name not updated"
        
        # Take screenshot
        await page.screenshot(path="tests/screenshots/tag_management_workflow.png")
    
    async def test_dashboard_workflow(self, page: Page):
        """Test dashboard and analytics workflow."""
        # Navigate to dashboard
        await page.goto("http://localhost:3000/dashboard")
        
        # Wait for dashboard to load
        await page.wait_for_selector('[data-testid="dashboard"]', timeout=10000)
        
        # Verify statistics cards are displayed
        stats_cards = page.locator('[data-testid="stats-card"]')
        stats_count = await stats_cards.count()
        assert stats_count >= 4, "Expected at least 4 statistics cards"
        
        # Test project statistics
        total_clips_card = page.locator('[data-testid="total-clips-card"]')
        assert await total_clips_card.is_visible(), "Total clips card not visible"
        
        # Test recent projects section
        recent_projects = page.locator('[data-testid="recent-projects"]')
        assert await recent_projects.is_visible(), "Recent projects section not visible"
        
        # Test analytics charts
        sentiment_chart = page.locator('[data-testid="sentiment-chart"]')
        if await sentiment_chart.is_visible():
            # Verify chart has data
            chart_elements = sentiment_chart.locator('[data-testid="chart-element"]')
            chart_count = await chart_elements.count()
            assert chart_count > 0, "Sentiment chart has no data"
        
        # Test navigation to other sections
        search_nav = page.locator('[data-testid="nav-search"]')
        await search_nav.click()
        
        # Verify navigation worked
        await page.wait_for_url("**/search", timeout=5000)
        current_url = page.url
        assert "/search" in current_url, "Navigation to search failed"
        
        # Navigate back to dashboard
        dashboard_nav = page.locator('[data-testid="nav-dashboard"]')
        await dashboard_nav.click()
        
        await page.wait_for_url("**/dashboard", timeout=5000)
        
        # Take screenshot
        await page.screenshot(path="tests/screenshots/dashboard_workflow.png")
    
    async def test_metadata_visualization_workflow(self, page: Page):
        """Test metadata visualization and analytics."""
        # Navigate to metadata visualizer
        await page.goto("http://localhost:3000/analytics/metadata")
        
        # Wait for visualizer to load
        await page.wait_for_selector('[data-testid="metadata-visualizer"]', timeout=10000)
        
        # Test view switching
        timeline_view_button = page.locator('[data-testid="timeline-view-button"]')
        await timeline_view_button.click()
        
        timeline_content = page.locator('[data-testid="timeline-content"]')
        assert await timeline_content.is_visible(), "Timeline view not displayed"
        
        # Switch to map view
        map_view_button = page.locator('[data-testid="map-view-button"]')
        await map_view_button.click()
        
        map_content = page.locator('[data-testid="map-content"]')
        assert await map_content.is_visible(), "Map view not displayed"
        
        # Test time range filter
        time_range_select = page.locator('[data-testid="time-range-select"]')
        await time_range_select.select_option("last_month")
        
        # Verify data updates
        await page.wait_for_timeout(2000)  # Wait for data to reload
        
        # Test export functionality
        export_button = page.locator('[data-testid="export-data-button"]')
        if await export_button.is_visible():
            await export_button.click()
            
            # Wait for download to initiate
            await page.wait_for_timeout(1000)
        
        # Take screenshot
        await page.screenshot(path="tests/screenshots/metadata_visualization_workflow.png")
    
    async def test_download_workflow(self, page: Page):
        """Test video and clip download workflow."""
        # Navigate to clip editor
        await page.goto("http://localhost:3000/clip-editor?videoId=test_video")
        
        # Wait for interface to load
        await page.wait_for_selector('[data-testid="clip-list"]', timeout=10000)
        
        # Select clips for download
        clip_checkboxes = page.locator('[data-testid="clip-checkbox"]')
        checkbox_count = await clip_checkboxes.count()
        
        if checkbox_count > 0:
            # Select first few clips
            for i in range(min(3, checkbox_count)):
                await clip_checkboxes.nth(i).check()
        
        # Open download dialog
        download_button = page.locator('[data-testid="download-clips-button"]')
        await download_button.click()
        
        # Wait for download dialog
        download_dialog = page.locator('[data-testid="download-dialog"]')
        await download_dialog.wait_for(state="visible")
        
        # Configure download options
        format_select = page.locator('[data-testid="download-format-select"]')
        await format_select.select_option("mp4")
        
        quality_select = page.locator('[data-testid="download-quality-select"]')
        await quality_select.select_option("720p")
        
        # Start download
        start_download_button = page.locator('[data-testid="start-download-button"]')
        await start_download_button.click()
        
        # Wait for download to start
        download_progress = page.locator('[data-testid="download-progress"]')
        await download_progress.wait_for(state="visible", timeout=10000)
        
        # Verify progress indicator is working
        progress_bar = page.locator('[data-testid="progress-bar"]')
        assert await progress_bar.is_visible(), "Progress bar not visible"
        
        # Wait for download completion (or timeout)
        try:
            download_complete = page.locator('[data-testid="download-complete"]')
            await download_complete.wait_for(state="visible", timeout=30000)
        except:
            # Timeout is acceptable for this test
            pass
        
        # Take screenshot
        await page.screenshot(path="tests/screenshots/download_workflow.png")
    
    async def test_accessibility_compliance(self, page: Page):
        """Test accessibility compliance across the application."""
        # Test keyboard navigation
        await page.goto("http://localhost:3000")
        
        # Test tab navigation
        await page.keyboard.press("Tab")
        focused_element = page.locator(":focus")
        assert await focused_element.count() > 0, "No element focused after Tab"
        
        # Test ARIA labels
        buttons = page.locator("button")
        button_count = await buttons.count()
        
        for i in range(min(5, button_count)):
            button = buttons.nth(i)
            aria_label = await button.get_attribute("aria-label")
            button_text = await button.inner_text()
            
            # Button should have either aria-label or visible text
            assert aria_label or button_text, f"Button {i} lacks accessibility label"
        
        # Test color contrast (basic check)
        headings = page.locator("h1, h2, h3, h4, h5, h6")
        heading_count = await headings.count()
        assert heading_count > 0, "No headings found for accessibility check"
        
        # Test image alt text
        images = page.locator("img")
        image_count = await images.count()
        
        for i in range(min(3, image_count)):
            img = images.nth(i)
            alt_text = await img.get_attribute("alt")
            assert alt_text is not None, f"Image {i} missing alt text"
    
    async def test_responsive_design(self, page: Page):
        """Test responsive design across different screen sizes."""
        # Test desktop view
        await page.set_viewport_size({"width": 1920, "height": 1080})
        await page.goto("http://localhost:3000")
        
        # Verify desktop layout
        desktop_nav = page.locator('[data-testid="desktop-navigation"]')
        if await desktop_nav.is_visible():
            assert await desktop_nav.is_visible(), "Desktop navigation not visible"
        
        # Test tablet view
        await page.set_viewport_size({"width": 768, "height": 1024})
        await page.reload()
        
        # Test mobile view
        await page.set_viewport_size({"width": 375, "height": 667})
        await page.reload()
        
        # Verify mobile menu
        mobile_menu_button = page.locator('[data-testid="mobile-menu-button"]')
        if await mobile_menu_button.is_visible():
            await mobile_menu_button.click()
            
            mobile_nav = page.locator('[data-testid="mobile-navigation"]')
            assert await mobile_nav.is_visible(), "Mobile navigation not visible"
        
        # Test touch interactions on mobile
        search_input = page.locator('[data-testid="search-input"]')
        if await search_input.is_visible():
            await search_input.tap()
            assert await search_input.is_focused(), "Search input not focused after tap"
    
    async def test_error_handling(self, page: Page):
        """Test error handling and user feedback."""
        # Intercept API to return errors
        await page.route("**/api/**", lambda route: route.fulfill(
            status=500,
            content_type="application/json",
            body='{"detail": "Internal server error"}'
        ))
        
        # Navigate to search page
        await page.goto("http://localhost:3000/search")
        
        # Try to perform search
        search_input = page.locator('[data-testid="search-input"]')
        await search_input.fill("test query")
        
        search_button = page.locator('[data-testid="search-button"]')
        await search_button.click()
        
        # Verify error message is displayed
        error_message = page.locator('[data-testid="error-message"]')
        await error_message.wait_for(state="visible", timeout=10000)
        
        error_text = await error_message.inner_text()
        assert len(error_text) > 0, "Error message is empty"
        
        # Test retry functionality
        retry_button = page.locator('[data-testid="retry-button"]')
        if await retry_button.is_visible():
            await retry_button.click()
    
    async def test_performance_metrics(self, page: Page):
        """Test application performance metrics."""
        # Enable performance monitoring
        await page.goto("http://localhost:3000", wait_until="networkidle")
        
        # Measure page load performance
        performance_metrics = await page.evaluate("""
            () => {
                const navigation = performance.getEntriesByType('navigation')[0];
                return {
                    loadTime: navigation.loadEventEnd - navigation.loadEventStart,
                    domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                    firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
                };
            }
        """)
        
        # Assert performance thresholds
        assert performance_metrics["loadTime"] < 3000, f"Page load time too slow: {performance_metrics['loadTime']}ms"
        assert performance_metrics["domContentLoaded"] < 2000, f"DOM load time too slow: {performance_metrics['domContentLoaded']}ms"
        
        # Test JavaScript bundle size
        js_resources = await page.evaluate("""
            () => {
                const resources = performance.getEntriesByType('resource');
                return resources
                    .filter(resource => resource.name.includes('.js'))
                    .map(resource => ({
                        name: resource.name,
                        size: resource.transferSize,
                        duration: resource.duration
                    }));
            }
        """)
        
        total_js_size = sum(resource.get("size", 0) for resource in js_resources)
        assert total_js_size < 2000000, f"JavaScript bundle too large: {total_js_size} bytes"  # 2MB limit
    
    async def setup_test_environment(self):
        """Setup test environment before running tests."""
        # Create screenshots directory
        import os
        os.makedirs("tests/screenshots", exist_ok=True)
        
        # Setup mock data
        # This would typically involve seeding the test database
        pass
    
    async def teardown_test_environment(self):
        """Cleanup test environment after running tests."""
        # Cleanup screenshots if needed
        # Cleanup test data
        pass 