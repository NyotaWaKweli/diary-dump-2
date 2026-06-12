import { NextRequest } from 'next/server';
import { supabaseServer, errorResponse, checkRateLimit } from '@/lib/supabase-server';
import { usernameSchema, recoveryPinSchema, passwordSchema, validateInput } from '@/lib/validation';

// Step 1: Verify username + PIN
export async function PUT(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(`recovery:${ip}`, 5, 300000)) {
      return errorResponse('Too many attempts', 429);
    }

    const body = await request.json();

    const usernameCheck = validateInput(usernameSchema, body.username);
    if (!usernameCheck.success) return errorResponse(usernameCheck.error, 400);

    const pinCheck = validateInput(recoveryPinSchema, body.recoveryPin);
    if (!pinCheck.success) return errorResponse(pinCheck.error, 400);

    // Verify username + PIN match
    const { data: profile } = await supabaseServer
      .from('profiles')
      .select('id, recovery_pin')
      .eq('username', body.username)
      .single();

    if (!profile || profile.recovery_pin !== body.recoveryPin) {
      return errorResponse('Invalid username or recovery PIN', 401);
    }

    return Response.json({ 
      success: true, 
      userId: profile.id,
      message: 'PIN verified. Proceed to reset password.'
    });

  } catch (err) {
    console.error('Recovery verification error:', err);
    return errorResponse('Verification failed', 500);
  }
}

// Step 2: Reset password with verified userId
export async function PATCH(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(`reset:${ip}`, 3, 300000)) {
      return errorResponse('Too many attempts', 429);
    }

    const body = await request.json();

    const passwordCheck = validateInput(passwordSchema, body.newPassword);
    if (!passwordCheck.success) return errorResponse(passwordCheck.error, 400);

    if (!body.userId) {
      return errorResponse('Invalid request', 400);
    }

    // Update password via admin API
    const { error } = await supabaseServer.auth.admin.updateUserById(body.userId, {
      password: body.newPassword,
    });

    if (error) {
      console.error('Password reset error:', error);
      return errorResponse('Password reset failed', 500);
    }

    return Response.json({ 
      success: true, 
      message: 'Password updated successfully' 
    });

  } catch (err) {
    console.error('Password reset error:', err);
    return errorResponse('Password reset failed', 500);
  }
}
