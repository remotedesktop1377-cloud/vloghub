/**
 * Asset interface for media library items
 */
export interface Asset {
  id: string;
  url: string;
  type: 'video' | 'image' | 'audio';
  name: string;
  duration?: number; // Duration in seconds
  thumbnailUrl?: string; // Cached thumbnail URL
  metadata?: {
    width?: number;
    height?: number;
    fps?: number; // For video assets
    bitrate?: number;
    codec?: string;
  };
  createdAt?: string; // ISO timestamp
  updatedAt?: string; // ISO timestamp
}

/**
 * Asset library state
 */
export interface AssetLibrary {
  assets: Asset[];
  categories?: string[];
  tags?: string[];
}

/**
 * Create an asset from a media item
 */
export function createAsset(
  id: string,
  url: string,
  type: 'video' | 'image' | 'audio',
  name: string,
  options?: {
    duration?: number;
    thumbnailUrl?: string;
    metadata?: Asset['metadata'];
  }
): Asset {
  return {
    id,
    url,
    type,
    name,
    duration: options?.duration,
    thumbnailUrl: options?.thumbnailUrl,
    metadata: options?.metadata,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Update asset metadata
 */
export function updateAssetMetadata(
  asset: Asset,
  metadata: Partial<Asset['metadata']>
): Asset {
  return {
    ...asset,
    metadata: {
      ...asset.metadata,
      ...metadata,
    },
    updatedAt: new Date().toISOString(),
  };
}

