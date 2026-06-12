import { NextRequest } from 'next/server';
import { supabaseServer, errorResponse } from '@/lib/supabase-server';

async function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabaseServer.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

// GET: Notification settings
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return errorResponse('Authentication required', 401);
    }

    const { data, error } = await supabaseServer
      .from('notification_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Fetch settings error:', error);
      return errorResponse('Failed to fetch settings', 500);
    }

    return Response.json({ success: true, data });

  } catch (err) {
    console.error('Settings GET error:', err);
    return errorResponse('Failed to fetch settings', 500);
  }
}

// PATCH: Update notification settings
export async function PATCH(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return errorResponse('Authentication required', 401);
    }

    const body = await request.json();
    const updates: any = {};

    if (body.replies !== undefined) updates.replies = !!body.replies;
    if (body.commentReplies !== undefined) updates.comment_replies = !!body.commentReplies;
    if (body.bookmarks !== undefined) updates.bookmarks = !!body.bookmarks;
    if (body.views !== undefined) updates.views = !!body.views;

    const { data, error } = await supabaseServer
      .from('notification_settings')
      .update(updates)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Update settings error:', error);
      return errorResponse('Failed to update settings', 500);
    }

    return Response.json({ success: true, data });

  } catch (err) {
    console.error('Settings PATCH error:', err);
    return errorResponse('Failed to update settings', 500);
  }
}
