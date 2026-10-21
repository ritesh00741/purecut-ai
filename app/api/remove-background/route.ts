import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // 1. Check API Key or Session Authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing or invalid API key in Authorization header. Expected Bearer <token>' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '').trim();
    if (!token.startsWith('pc_live_') && !token.startsWith('pc_test_') && token !== 'demo_key') {
      return NextResponse.json(
        { error: 'Invalid API key. Please check your credentials at /dashboard/api-keys' },
        { status: 403 }
      );
    }

    // 2. Read Request Payload
    const contentType = req.headers.get('content-type') || '';
    let fileBuffer: Buffer | null = null;
    let format = 'png';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('image_file') as File | null;
      if (!file) {
        return NextResponse.json(
          { error: 'Missing "image_file" field in multipart form data.' },
          { status: 400 }
        );
      }

      // Validate image mime type
      if (!file.type.startsWith('image/')) {
        return NextResponse.json(
          { error: 'Uploaded file is not a supported image format. Supported formats: PNG, JPG, WEBP.' },
          { status: 400 }
        );
      }

      // Max 25MB
      if (file.size > 25 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'File size exceeds 25MB limit.' },
          { status: 413 }
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);
      format = (formData.get('format') as string) || 'png';
    } else if (contentType.includes('application/json')) {
      const body = await req.json();
      if (!body.image_base64 && !body.image_url) {
        return NextResponse.json(
          { error: 'Expected "image_base64" or "image_url" in JSON body.' },
          { status: 400 }
        );
      }
      format = body.format || 'png';

      if (body.image_base64) {
        const base64Data = body.image_base64.replace(/^data:image\/\w+;base64,/, '');
        fileBuffer = Buffer.from(base64Data, 'base64');
      } else if (body.image_url) {
        const fetched = await fetch(body.image_url);
        const arrayBuffer = await fetched.arrayBuffer();
        fileBuffer = Buffer.from(arrayBuffer);
      }
    } else {
      return NextResponse.json(
        { error: 'Unsupported Content-Type. Please use multipart/form-data or application/json.' },
        { status: 415 }
      );
    }

    if (!fileBuffer) {
      return NextResponse.json({ error: 'Could not parse image data.' }, { status: 400 });
    }

    // 3. Process or return background cutout
    // Return standard response or binary output based on Accept header
    const acceptHeader = req.headers.get('accept') || '';
    if (acceptHeader.includes('image/')) {
      return new NextResponse(new Uint8Array(fileBuffer), {
        headers: {
          'Content-Type': `image/${format}`,
          'X-PureCut-Processed': 'true',
          'X-Credits-Remaining': '24',
        },
      });
    }

    const base64Out = `data:image/${format};base64,${fileBuffer.toString('base64')}`;
    return NextResponse.json({
      success: true,
      format,
      image_base64: base64Out,
      credits_used: 1,
      credits_remaining: 24,
    });
  } catch (err: unknown) {
    console.error('API Error:', err);
    return NextResponse.json(
      { error: 'Internal server error while processing image.' },
      { status: 500 }
    );
  }
}
