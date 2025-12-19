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

        if (page < 1 || page > 50) { // Envato API allows more pages than Google
            return NextResponse.json(
                { error: 'Page must be between 1 and 50' },
                { status: 400 }
            );
        }

        const apiKey = process.env.ENVATO_API_KEY;

        if (!apiKey) {
            return NextResponse.json(
                { error: 'Envato API not configured. Please set ENVATO_API_KEY in environment variables.' },
                { status: 500 }
            );
        }

        // Envato API parameters - default to photos only
        const itemsPerPage = parseInt(process.env.ENVATO_ITEMS_PER_PAGE || '10');
        const envatoSite = 'photodune.net'; // Default to photos only

        // Build the search URL for Envato API
        const searchUrl = new URL('https://api.envato.com/v1/discovery/search/search/item');
        searchUrl.searchParams.set('term', query);
        searchUrl.searchParams.set('site', envatoSite);
        searchUrl.searchParams.set('page', page.toString());
        searchUrl.searchParams.set('page_size', Math.min(itemsPerPage, 100).toString()); // Max 100 per page
        searchUrl.searchParams.set('sort_by', 'relevance');

        console.log('Searching Envato with URL:', searchUrl.toString());
        // console.log('Items per page:', itemsPerPage, 'Site:', envatoSite);

        const response = await fetch(searchUrl.toString(), {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'User-Agent': 'YouTube Clip Searcher/1.0',
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.log('Envato API error:', {
                status: response.status,
                statusText: response.statusText,
                data: errorData
            });

            return NextResponse.json(
                {
                    error: 'Failed to search Envato images',
                    details: errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`
                },
                { status: response.status }
            );
        }

        const data = await response.json();
        //          console.log('Envato API response structure:', {
        //      total_hits: data.total_hits,
        //      matches_count: data.matches?.length || 0,
        //      first_item_keys: data.matches?.[0] ? Object.keys(data.matches[0]) : []
        //  });

        // Check if we have items in the response - the structure might be different
        let items = [];
        if (data.matches && Array.isArray(data.matches)) {
            items = data.matches;
        } else if (data.items && Array.isArray(data.items)) {
            items = data.items;
        } else if (Array.isArray(data)) {
            items = data;
        }

        if (items.length === 0) {
            console.log('No items found in Envato response, returning empty results');
            return NextResponse.json({
                success: true,
                images: [],
                totalResults: 0,
                currentPage: page,
                hasMore: false,
                source: 'envato'
            });
        }

        // Extract and format image results from Envato
        const images = items.map((item: any) => {
            // Get the best available preview image
            let imageUrl = '';
            let thumbnailUrl = '';

            // Extract image URLs from Envato API response structure
            if (item.previews && item.previews.thumbnail_preview && item.previews.thumbnail_preview.large_url) {
                imageUrl = item.previews.thumbnail_preview.large_url;
                thumbnailUrl = item.previews.thumbnail_preview.small_url || item.previews.thumbnail_preview.large_url;
            } else if (item.previews && item.previews.icon_with_thumbnail_preview && item.previews.icon_with_thumbnail_preview.thumbnail_url) {
                imageUrl = item.previews.icon_with_thumbnail_preview.thumbnail_url;
                thumbnailUrl = item.previews.icon_with_thumbnail_preview.icon_url || item.previews.icon_with_thumbnail_preview.thumbnail_url;
            } else if (item.image_urls && item.image_urls.length > 0) {
                // Use the largest available image from image_urls array
                const largestImage = item.image_urls[item.image_urls.length - 1];
                imageUrl = largestImage.url;
                thumbnailUrl = item.image_urls[0].url; // Use smallest as thumbnail
            }

            return {
                id: item.id?.toString() || `envato-${Date.now()}-${Math.random()}`,
                url: imageUrl,
                thumbnail: thumbnailUrl,
                title: item.name || 'Untitled Envato Asset',
                context: item.url || '',
                width: item.previews?.thumbnail_preview?.large_width || 800,
                height: item.previews?.thumbnail_preview?.large_height || 600,
                size: item.photo_attributes?.find((attr: any) => attr.name === 'full_resolution_in_megapixels')?.value + ' MP' || 'Unknown',
                mime: 'image/jpeg',
                // Envato-specific fields
                author: item.author_username || 'Unknown',
                authorUrl: item.author_url || '',
                tags: item.tags || [],
                category: item.classification || 'photos',
                price: item.price_cents ? `$${(item.price_cents / 100).toFixed(2)}` : 'Free with subscription',
                downloadUrl: item.url || '',
                source: 'envato'
            };
        }).filter((img: any) => img.url); // Filter out items without valid image URLs

        const totalResults = data.total_hits || data.total_items || data.total || items.length || 0;
        const hasMore = images.length === Math.min(itemsPerPage, 100) && (page * Math.min(itemsPerPage, 100)) < totalResults;

        console.log(`Found ${images.length} Envato images, total: ${totalResults}, hasMore: ${hasMore}`);

        return NextResponse.json({
            success: true,
            images,
            totalResults,
            currentPage: page,
            hasMore,
            source: 'envato',
            category: 'photos',
            note: itemsPerPage > 100 ? `Note: Envato API limit is 100 items per request. Requested ${itemsPerPage}, returned ${Math.min(itemsPerPage, 100)}.` : undefined
        });

    } catch (error) {
        console.log('Envato image search error:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
