import { NextRequest, NextResponse } from 'next/server';
import { getOutputVideos } from '@/services/dashboardServer';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const jobIdParam = searchParams.get('jobId') || '';
    const refresh = searchParams.get('refresh') === 'true';
    if (jobIdParam) {
      const data = await getOutputVideos(jobIdParam, refresh);
      return NextResponse.json(data);
    }
    const data = await getOutputVideos(undefined, refresh);
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 });
  }
}


