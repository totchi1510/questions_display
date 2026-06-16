import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Same-origin proxy for the QR image. Serving it from our own domain keeps the
 * signage <canvas> export (html-to-image) from being tainted by a cross-origin
 * image, which would otherwise block the PNG download.
 */
export async function GET(req: NextRequest) {
  const data = req.nextUrl.searchParams.get('data');
  if (!data) {
    return new NextResponse('missing data', { status: 400 });
  }

  const upstream = `https://api.qrserver.com/v1/create-qr-code/?size=480x480&margin=0&data=${encodeURIComponent(
    data
  )}`;

  try {
    const r = await fetch(upstream, { cache: 'no-store' });
    if (!r.ok) {
      return new NextResponse('qr fetch failed', { status: 502 });
    }
    const buf = await r.arrayBuffer();
    return new NextResponse(buf, {
      headers: {
        'Content-Type': r.headers.get('content-type') ?? 'image/png',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch {
    return new NextResponse('qr fetch error', { status: 502 });
  }
}
