import { NextRequest } from 'next/server';
import { supabaseServer, errorResponse } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const diaryIds = body.diaryIds;

    if (!Array.isArray(diaryIds) || diaryIds.length === 0) {
      return errorResponse('Invalid diary IDs', 400);
    }

    // Limit batch size
    if (diaryIds.length > 50) {
      return errorResponse('Too many IDs in batch', 400);
    }

    // Use RPC function for atomic batch update
    const { error } = await supabaseServer.rpc('increment_views', {
      diary_ids: diaryIds,
    });

    if (error) {
      console.error('Batch views error:', error);
      return errorResponse('Failed to update views', 500);
    }

    return Response.json({ success: true });

  } catch (err) {
    console.error('Views POST error:', err);
    return errorResponse('Failed to update views', 500);
  }
}
