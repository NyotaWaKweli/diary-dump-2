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

// GET: Blocked users list
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return errorResponse('Authentication required', 401);
    }

    const { data, error } = await supabaseServer
      .from('blocked_users')
      .select('*, blocked:blocked_user_id(username, avatar_url)')
      .eq('user_id', user.id);

    if (error) {
      console.error('Fetch blocked users error:', error);
      return errorResponse('Failed to fetch blocked users', 500);
    }

    return Response.json({ success: true, data });

  } catch (err) {
    console.error('Blocked GET error:', err);
    return errorResponse('Failed to fetch blocked users', 500);
  }
}

// POST: Block a user
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return errorResponse('Authentication required', 401);
    }

    const body = await request.json();
    const blockedUsername = body.username;

    if (!blockedUsername) return errorResponse('Username required', 400);

    // Find user to block
    const { data: targetUser } = await supabaseServer
      .from('profiles')
      .select('id')
      .eq('username', blockedUsername)
      .single();

    if (!targetUser) {
      return errorResponse('User not found', 404);
    }

    if (targetUser.id === user.id) {
      return errorResponse('Cannot block yourself', 400);
    }

    const { data, error } = await supabaseServer
      .from('blocked_users')
      .insert({ user_id: user.id, blocked_user_id: targetUser.id })
      .select()
      .single();

    if (error) {
      console.error('Block user error:', error);
      return errorResponse('Failed to block user', 500);
    }

    return Response.json({ success: true, data }, { status: 201 });

  } catch (err) {
    console.error('Blocked POST error:', err);
    return errorResponse('Failed to block user', 500);
  }
}

// DELETE: Unblock a user
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return errorResponse('Authentication required', 401);
    }

    const { searchParams } = new URL(request.url);
    const blockedUserId = searchParams.get('id');

    if (!blockedUserId) return errorResponse('User ID required', 400);

    const { error } = await supabaseServer
      .from('blocked_users')
      .delete()
      .eq('user_id', user.id)
      .eq('blocked_user_id', blockedUserId);

    if (error) {
      console.error('Unblock user error:', error);
      return errorResponse('Failed to unblock user', 500);
    }

    return Response.json({ success: true, message: 'User unblocked' });

  } catch (err) {
    console.error('Blocked DELETE error:', err);
    return errorResponse('Failed to unblock user', 500);
  }
}
