import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  return NextResponse.json({
    keys: [
      {
        id: 'key_prod_1',
        name: 'Production Website Key',
        keyPrefix: 'pc_live_89a',
        createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
        requestsCount: 1420,
      }
    ]
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = body.name || 'API Key';
    const randomChars = Math.random().toString(36).substring(2, 12);
    const fullKey = `pc_live_${randomChars}`;
    const keyPrefix = `pc_live_${randomChars.substring(0, 4)}`;

    return NextResponse.json({
      success: true,
      key: {
        id: `key_${Date.now()}`,
        name,
        keyPrefix,
        fullKey,
        createdAt: new Date().toISOString(),
        requestsCount: 0,
      }
    });
  } catch {
    return NextResponse.json({ error: 'Failed to create key' }, { status: 400 });
  }
}
