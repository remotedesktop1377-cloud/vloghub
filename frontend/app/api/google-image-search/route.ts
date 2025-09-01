import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { query, page = 1 } = await request.json();

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query parameter is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    if (page < 1 || page > 10) { // Google API limit is 10 pages
      return NextResponse.json(
        { error: 'Page must be between 1 and 10' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY;
    const searchEngineId = process.env.GOOGLE_CUSTOM_SEARCH_CX;

    if (!apiKey || !searchEngineId) {
      return NextResponse.json(
        { error: 'Google Custom Search API not configured' },
        { status: 500 }
      );
    }

    // Google API limit is 10 images per request
    const requestedImagesPerPage = parseInt(process.env.IMAGES_PER_PAGE || '10');
    const imagesPerPage = Math.min(requestedImagesPerPage, 10);
    const startIndex = Math.max(1, Math.min(101, (page - 1) * imagesPerPage + 1)); // Must be between 1-101

    // Build the search URL with proper parameters
    const searchUrl = new URL('https://www.googleapis.com/customsearch/v1');
    searchUrl.searchParams.set('key', apiKey);
    searchUrl.searchParams.set('cx', searchEngineId);
    searchUrl.searchParams.set('q', query);
    searchUrl.searchParams.set('searchType', 'image');
    searchUrl.searchParams.set('start', startIndex.toString());
    searchUrl.searchParams.set('num', imagesPerPage.toString());
    searchUrl.searchParams.set('safe', 'active');

    console.log('Searching with URL:', searchUrl.toString());
    console.log('Requested images per page:', requestedImagesPerPage, 'Actual images per page:', imagesPerPage);

    const response = await fetch(searchUrl.toString());
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Google Custom Search API error:', {
        status: response.status,
        statusText: response.statusText,
        data: errorData
      });
      
      return NextResponse.json(
        { 
          error: 'Failed to search images',
          details: errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    // console.log('Google API response:', data);

    // Check if we have items in the response
    if (!data.items || !Array.isArray(data.items)) {
      console.log('No items found in response, returning empty results');
      return NextResponse.json({
        success: true,
        images: [],
        totalResults: 0,
        currentPage: page,
        hasMore: false
      });
    }

    // Extract and format image results
    const images = data.items.map((item: any) => ({
      id: item.link || `img-${Date.now()}-${Math.random()}`,
      url: item.link,
      thumbnail: item.image?.thumbnailLink || item.link,
      title: item.title || 'Untitled Image',
      context: item.image?.contextLink || '',
      width: item.image?.width || 0,
      height: item.image?.height || 0,
      size: item.image?.byteSize || 'Unknown',
      mime: item.image?.mime || 'image/jpeg'
    }));

    const totalResults = parseInt(data.searchInformation?.totalResults || '0');
    const hasMore = images.length === imagesPerPage && (startIndex + images.length) < totalResults;

    // console.log(`Found ${images.length} images, total: ${totalResults}, hasMore: ${hasMore}`);

    return NextResponse.json({
      success: true,
      images,
      totalResults,
      currentPage: page,
      hasMore,
      note: requestedImagesPerPage > 10 ? `Note: Google API limit is 10 images per request. Requested ${requestedImagesPerPage}, returned ${imagesPerPage}.` : undefined
    });

  } catch (error) {
    console.error('Google image search error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
