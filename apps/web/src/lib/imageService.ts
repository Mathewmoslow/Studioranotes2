/**
 * Image Service for fetching images from various sources
 * Supports NIH Open Access, Unsplash, and Pexels APIs
 */

export interface ImageSearchParams {
  query: string;
  start?: number;
  count?: number;
  source?: 'nih' | 'unsplash' | 'pexels' | 'all';
}

export interface ImageResult {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  thumbnailUrl?: string;
  source: string;
  license?: string;
  attribution?: string;
  width?: number;
  height?: number;
}

export interface ImageSearchResponse {
  results: ImageResult[];
  totalCount: number;
  hasMore: boolean;
}

// NIH Open Access Image Service
class NIHImageService {
  private readonly baseUrl = 'https://openaccess-api.nih.gov/api/search';

  async searchImages(query: string, count: number = 10): Promise<ImageResult[]> {
    try {
      const params = new URLSearchParams({
        query,
        n: count.toString(),
        coll: 'pmc',
        favor: 'r'
      });

      const response = await fetch(`${this.baseUrl}?${params}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Studiora-Notes/1.0'
        }
      });

      if (!response.ok) {
        console.warn('NIH API error:', response.status);
        return [];
      }

      const data = await response.json();
      const results: ImageResult[] = [];

      if (data.results && Array.isArray(data.results)) {
        for (const item of data.results) {
          if (item.images && item.images.length > 0) {
            for (const image of item.images) {
              results.push({
                id: `nih-${item.pmcid}-${results.length}`,
                title: item.title || 'Untitled',
                description: item.abstract || item.description,
                imageUrl: image.fullUrl || image.url,
                thumbnailUrl: image.thumbnailUrl || image.smallUrl,
                source: 'NIH Open Access',
                license: item.license || 'Open Access',
                attribution: item.authors?.join(', ') || undefined
              });
            }
          }
        }
      }

      return results;
    } catch (error) {
      console.error('Error searching NIH images:', error);
      return [];
    }
  }
}

// Unsplash Image Service (requires API key)
class UnsplashImageService {
  private readonly baseUrl = 'https://api.unsplash.com/search/photos';
  private readonly accessKey: string | undefined;

  constructor() {
    this.accessKey = process.env.UNSPLASH_ACCESS_KEY;
  }

  async searchImages(query: string, count: number = 10): Promise<ImageResult[]> {
    if (!this.accessKey) {
      console.warn('Unsplash API key not configured');
      return [];
    }

    try {
      const params = new URLSearchParams({
        query,
        per_page: count.toString(),
        orientation: 'landscape'
      });

      const response = await fetch(`${this.baseUrl}?${params}`, {
        headers: {
          'Authorization': `Client-ID ${this.accessKey}`
        }
      });

      if (!response.ok) {
        console.warn('Unsplash API error:', response.status);
        return [];
      }

      const data = await response.json();
      return (data.results || []).map((photo: any) => ({
        id: `unsplash-${photo.id}`,
        title: photo.alt_description || photo.description || 'Untitled',
        description: photo.description,
        imageUrl: photo.urls.regular,
        thumbnailUrl: photo.urls.small,
        source: 'Unsplash',
        license: 'Unsplash License',
        attribution: `Photo by ${photo.user.name} on Unsplash`,
        width: photo.width,
        height: photo.height
      }));
    } catch (error) {
      console.error('Error searching Unsplash images:', error);
      return [];
    }
  }
}

// Pexels Image Service (requires API key)
class PexelsImageService {
  private readonly baseUrl = 'https://api.pexels.com/v1/search';
  private readonly apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.PEXELS_API_KEY;
  }

  async searchImages(query: string, count: number = 10): Promise<ImageResult[]> {
    if (!this.apiKey) {
      console.warn('Pexels API key not configured');
      return [];
    }

    try {
      const params = new URLSearchParams({
        query,
        per_page: count.toString(),
        orientation: 'landscape'
      });

      const response = await fetch(`${this.baseUrl}?${params}`, {
        headers: {
          'Authorization': this.apiKey
        }
      });

      if (!response.ok) {
        console.warn('Pexels API error:', response.status);
        return [];
      }

      const data = await response.json();
      return (data.photos || []).map((photo: any) => ({
        id: `pexels-${photo.id}`,
        title: photo.alt || 'Untitled',
        description: photo.alt,
        imageUrl: photo.src.large,
        thumbnailUrl: photo.src.medium,
        source: 'Pexels',
        license: 'Pexels License',
        attribution: `Photo by ${photo.photographer} on Pexels`,
        width: photo.width,
        height: photo.height
      }));
    } catch (error) {
      console.error('Error searching Pexels images:', error);
      return [];
    }
  }
}

// Combined Image Service
class ImageService {
  private nihService = new NIHImageService();
  private unsplashService = new UnsplashImageService();
  private pexelsService = new PexelsImageService();

  async searchImages(params: ImageSearchParams): Promise<ImageSearchResponse> {
    const { query, count = 10, source = 'all' } = params;
    let results: ImageResult[] = [];

    try {
      switch (source) {
        case 'nih':
          results = await this.nihService.searchImages(query, count);
          break;
        case 'unsplash':
          results = await this.unsplashService.searchImages(query, count);
          break;
        case 'pexels':
          results = await this.pexelsService.searchImages(query, count);
          break;
        case 'all':
        default:
          // Search all sources in parallel
          const [nihResults, unsplashResults, pexelsResults] = await Promise.all([
            this.nihService.searchImages(query, Math.ceil(count / 3)),
            this.unsplashService.searchImages(query, Math.ceil(count / 3)),
            this.pexelsService.searchImages(query, Math.ceil(count / 3))
          ]);
          results = [...nihResults, ...unsplashResults, ...pexelsResults];
          break;
      }

      return {
        results: results.slice(0, count),
        totalCount: results.length,
        hasMore: results.length >= count
      };
    } catch (error) {
      console.error('Error in image search:', error);
      return {
        results: [],
        totalCount: 0,
        hasMore: false
      };
    }
  }

  // Search for banner-suitable images (landscape orientation preferred)
  async searchForBanner(topic: string): Promise<ImageResult | null> {
    const response = await this.searchImages({
      query: `${topic} banner abstract`,
      count: 5,
      source: 'unsplash' // Unsplash tends to have better banner-quality images
    });

    // Fallback to Pexels if Unsplash returns nothing
    if (response.results.length === 0) {
      const pexelsResponse = await this.searchImages({
        query: `${topic} abstract`,
        count: 5,
        source: 'pexels'
      });
      return pexelsResponse.results[0] || null;
    }

    return response.results[0] || null;
  }

  // Search for educational/diagram images
  async searchForDiagram(topic: string): Promise<ImageResult[]> {
    const response = await this.searchImages({
      query: `${topic} diagram infographic`,
      count: 5,
      source: 'nih'
    });
    return response.results;
  }
}

export const imageService = new ImageService();
export default imageService;
