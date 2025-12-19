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

    const apiKey = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY;
    const searchEngineId = process.env.GOOGLE_CUSTOM_SEARCH_CX;

    if (!apiKey || !searchEngineId) {
      return NextResponse.json(
        { error: 'Google Custom Search API not configured' },
        { status: 500 }
      );
    }

    // Google Custom Search API supports max 10 results per request
    // To get 50 results per page, we need to make multiple requests (5 requests of 10 each)
    const imagesPerPage = 10; // Google API limit per request
    const requestedResultsPerPage = 15; // Total results we want to return per page
    const startIndex = Math.max(1, Math.min(91, (page - 1) * requestedResultsPerPage + 1)); // Max 100 results total from Google API

    const searchUrl = new URL('https://www.googleapis.com/customsearch/v1');
    searchUrl.searchParams.set('key', apiKey);
    searchUrl.searchParams.set('cx', searchEngineId);
    searchUrl.searchParams.set('q', query);
    searchUrl.searchParams.set('searchType', 'image');
    searchUrl.searchParams.set('imgSize', 'large');  // "huge" | "icon" | "large" | "medium" | "small" | "xlarge" | "xxlarge"
    searchUrl.searchParams.set('imgType', 'photo');  // "lineart" | "face" | "clipart" | "stock" | "photo" | "animated"
    searchUrl.searchParams.set('fileType', 'jpg,png');
    
    // Set pagination parameters
    searchUrl.searchParams.set('start', startIndex.toString());
    searchUrl.searchParams.set('num', imagesPerPage.toString());
    // searchUrl.searchParams.set('exactTerms', keywords);
    // searchUrl.searchParams.set('orTerms', keywords);
    // searchUrl.searchParams.set('lowRange', '2000'); // Best Range to Use for AI Video Creation 2000...8000
    // searchUrl.searchParams.set('highRange', '8000');

    // console.log('Searching with URL:', searchUrl.toString());
    // console.log('Requested images per page:', requestedImagesPerPage, 'Actual images per page:', imagesPerPage);

    const response = await fetch(searchUrl.toString());

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.log('Google Custom Search API error:', {
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

    // Extract and format image results from first request
    let allImages = data.items.map((item: any) => ({
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
    
    // If we got 10 results and want 50, make additional requests
    if (allImages.length === imagesPerPage && allImages.length < requestedResultsPerPage) {
      const numAdditionalRequests = Math.min(4, Math.floor((requestedResultsPerPage - allImages.length) / imagesPerPage));
      
      // Make additional requests in parallel to get up to 50 results
      const additionalPromises = [];
      for (let i = 1; i <= numAdditionalRequests; i++) {
        const nextStartIndex = startIndex + (i * imagesPerPage);
        if (nextStartIndex > 100) break; // Google API limit is 100 results total
        
        const nextSearchUrl = new URL('https://www.googleapis.com/customsearch/v1');
        nextSearchUrl.searchParams.set('key', apiKey);
        nextSearchUrl.searchParams.set('cx', searchEngineId);
        nextSearchUrl.searchParams.set('q', query);
        nextSearchUrl.searchParams.set('searchType', 'image');
        nextSearchUrl.searchParams.set('imgSize', 'large');
        nextSearchUrl.searchParams.set('imgType', 'photo');
        nextSearchUrl.searchParams.set('fileType', 'jpg,png');
        nextSearchUrl.searchParams.set('start', nextStartIndex.toString());
        nextSearchUrl.searchParams.set('num', imagesPerPage.toString());
        
        additionalPromises.push(
          fetch(nextSearchUrl.toString())
            .then(res => res.json())
            .then(data => {
              if (data.items && Array.isArray(data.items)) {
                return data.items.map((item: any) => ({
                  id: item.link || `img-${Date.now()}-${Math.random()}-${i}`,
                  url: item.link,
                  thumbnail: item.image?.thumbnailLink || item.link,
                  title: item.title || 'Untitled Image',
                  context: item.image?.contextLink || '',
                  width: item.image?.width || 0,
                  height: item.image?.height || 0,
                  size: item.image?.byteSize || 'Unknown',
                  mime: item.image?.mime || 'image/jpeg'
                }));
              }
              return [];
            })
            .catch(err => {
              console.log(`Error fetching additional page ${i + 1}:`, err);
              return [];
            })
        );
      }
      
      // Wait for all additional requests and combine results
      const additionalResults = await Promise.all(additionalPromises);
      additionalResults.forEach(results => {
        allImages = [...allImages, ...results];
      });
      
      // Limit to requestedResultsPerPage
      allImages = allImages.slice(0, requestedResultsPerPage);
    }

    const currentEndIndex = startIndex + allImages.length - 1;
    const hasMore = allImages.length > 0 && currentEndIndex < totalResults && currentEndIndex < 100; // Google API limit is 100 results

    // console.log(`Found ${allImages.length} images, total: ${totalResults}, hasMore: ${hasMore}`);

    return NextResponse.json({
      success: true,
      images: allImages,
      totalResults,
      currentPage: page,
      hasMore,
    });

  } catch (error) {
    console.log('Google image search error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
