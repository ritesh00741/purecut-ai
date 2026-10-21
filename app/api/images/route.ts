import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  // Returns demo list or synced Supabase images
  return NextResponse.json({
    images: [],
    total: 0
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    return NextResponse.json({
      success: true,
      image: {
        id: `img_${Date.now()}`,
        ...body,
        createdAt: new Date().toISOString()
      }
    });
  } catch {
    return NextResponse.json({ error: 'Failed to save image record' }, { status: 400 });
  }
}
