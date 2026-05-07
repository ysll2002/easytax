import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : req.headers.get('x-real-ip') ?? '';
  // x-forwarded-port is set by some proxies; fall back to standard HTTPS port 443
  const port = req.headers.get('x-forwarded-port') ?? '443';
  return NextResponse.json({ ip, port });
}
