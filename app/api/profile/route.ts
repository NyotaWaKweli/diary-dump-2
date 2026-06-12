import { NextRequest } from 'next/server';
import { supabaseServer, errorResponse, checkRateLimit } from '@/lib/supabase-server';
import { usernameSchema, passwordSchema, recoveryPinSchema, validateInput } from '@/lib/validation';

async function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabaseServer.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

// GET: Current user profile
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return errorResponse('Authentication required', 401);
    }

    const { data, error } = await supabaseServer
      .from('profiles')
      .select('*, notification_settings(*)')
      .eq('id', user.id)
      .single();

    if (error || !data) {
      console.error('Fetch profile error:', error);
      return errorResponse('Failed to fetch profile', 500);
    }

    return Response.json({ success: true, data });

  } catch (err) {
    console.error('Profile GET error:', err);
    return errorResponse('Failed to fetch profile', 500);
  }
}

// PATCH: Update profile
export async function PATCH(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return errorResponse('Authentication required', 401);
    }

    const body = await request.json();
    const updates: any = {};

    // Update username
    if (body.username) {
      const usernameCheck = validateInput(usernameSchema, body.username);
      if (!usernameCheck.success) return errorResponse(usernameCheck.error, 400);

      // Check uniqueness (excluding self)
      const { data: existing } = await supabaseServer
        .from('profiles')
        .select('id')
        .eq('username', body.username)
        .neq('id', user.id)
        .single();

      if (existing) {
        return errorResponse('Username is already taken', 409);
      }

      updates.username = usernameCheck.data;
    }

    // Update recovery PIN
    if (body.recoveryPin) {
      const pinCheck = validateInput(recoveryPinSchema, body.recoveryPin);
      if (!pinCheck.success) return errorResponse(pinCheck.error, 400);
      updates.recovery_pin = pinCheck.data;
    }

    // Update avatar URL
    if (body.avatarUrl !== undefined) {
      updates.avatar_url = body.avatarUrl;
    }

    if (Object.keys(updates).length === 0) {
      return errorResponse('No valid fields to update', 400);
    }

    const { data, error } = await supabaseServer
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Update profile error:', error);
      return errorResponse('Failed to update profile', 500);
    }

    return Response.json({ success: true, data });

  } catch (err) {
    console.error('Profile PATCH error:', err);
    return errorResponse('Failed to update profile', 500);
  }
}

// PUT: Update password
export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return errorResponse('Authentication required', 401);
    }

    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(`password:${user.id}:${ip}`, 3, 300000)) {
      return errorResponse('Too many attempts', 429);
    }

    const body = await request.json();

    const passwordCheck = validateInput(passwordSchema, body.newPassword);
    if (!passwordCheck.success) return errorResponse(passwordCheck.error, 400);

    const { error } = await supabaseServer.auth.admin.updateUserById(user.id, {
      password: body.newPassword,
    });

    if (error) {
      console.error('Password update error:', error);
      return errorResponse('Failed to update password', 500);
    }

    return Response.json({ success: true, message: 'Password updated' });

  } catch (err) {
    console.error('Profile PUT error:', err);
    return errorResponse('Failed to update password', 500);
  }
}

// DELETE: Delete account
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return errorResponse('Authentication required', 401);
    }

    const { error } = await supabaseServer.auth.admin.deleteUser(user.id);

    if (error) {
      console.error('Delete account error:', error);
      return errorResponse('Failed to delete account', 500);
    }

    return Response.json({ success: true, message: 'Account deleted permanently' });

  } catch (err) {
    console.error('Profile DELETE error:', err);
    return errorResponse('Failed to delete account', 500);
  }
}
