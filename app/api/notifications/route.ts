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

// GET: User notifications
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return errorResponse('Authentication required', 401);
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unread') === 'true';

    let query = supabaseServer
      .from('notifications')
      .select('*, profiles:from_user_id(username, avatar_url)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (unreadOnly) query = query.eq('is_read', false);

    const { data, error } = await query.limit(50);

    if (error) {
      console.error('Fetch notifications error:', error);
      return errorResponse('Failed to fetch notifications', 500);
    }

    return Response.json({ success: true, data });

  } catch (err) {
    console.error('Notifications GET error:', err);
    return errorResponse('Failed to fetch notifications', 500);
  }
}

// PATCH: Mark as read
export async function PATCH(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return errorResponse('Authentication required', 401);
    }

    const body = await request.json();

    if (body.id) {
      // Mark single notification as read
      const { error } = await supabaseServer
        .from('notifications')
        .update({ is_read: true })
        .eq('id', body.id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Mark read error:', error);
        return errorResponse('Failed to update notification', 500);
      }
    } else {
      // Mark all as read
      const { error } = await supabaseServer
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) {
        console.error('Mark all read error:', error);
        return errorResponse('Failed to update notifications', 500);
      }
    }

    return Response.json({ success: true });

  } catch (err) {
    console.error('Notifications PATCH error:', err);
    return errorResponse('Failed to update notifications', 500);
  }
}

// DELETE: Clear notifications
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return errorResponse('Authentication required', 401);
    }

    const { error } = await supabaseServer
      .from('notifications')
      .delete()
      .eq('user_id', user.id);

    if (error) {
      console.error('Clear notifications error:', error);
      return errorResponse('Failed to clear notifications', 500);
    }

    return Response.json({ success: true, message: 'Notifications cleared' });

  } catch (err) {
    console.error('Notifications DELETE error:', err);
    return errorResponse('Failed to clear notifications', 500);
  }
}
