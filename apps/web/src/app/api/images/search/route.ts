import { NextRequest, NextResponse } from 'next/server';
import { imageService, ImageSearchParams } from '@/lib/imageService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const params: ImageSearchParams = {
      query: searchParams.get('query') || '',
      count: searchParams.get('count') ? parseInt(searchParams.get('count')!) : 10,
      source: (searchParams.get('source') as 'nih' | 'unsplash' | 'pexels' | 'all') || 'all',
    };

    if (!params.query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    const results = await imageService.searchImages(params);

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error in image search API:', error);
    return NextResponse.json(
      { error: 'Failed to search images' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { searchType, topic } = body;

    let result;

    switch (searchType) {
      case 'banner':
        result = await imageService.searchForBanner(topic);
        return NextResponse.json({ banner: result });

      case 'diagram':
        result = await imageService.searchForDiagram(topic);
        return NextResponse.json({ diagrams: result });

      default:
        result = await imageService.searchImages({
          query: topic,
          count: 10
        });
        return NextResponse.json(result);
    }
  } catch (error) {
    console.error('Error in image search API:', error);
    return NextResponse.json(
      { error: 'Failed to search images' },
      { status: 500 }
    );
  }
}
