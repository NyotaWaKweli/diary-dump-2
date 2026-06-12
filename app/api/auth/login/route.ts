import { NextRequest } from 'next/server';
import { supabaseServer, errorResponse, checkRateLimit } from '@/lib/supabase-server';
import { usernameSchema, passwordSchema, validateInput } from '@/lib/validation';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 5 attempts per 5 minutes per IP
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(`login:${ip}`, 5, 300000)) {
      return errorResponse('Too many attempts. Please try again later.', 429);
    }

    const body = await request.json();

    // Validate inputs
    const usernameCheck = validateInput(usernameSchema, body.username);
    if (!usernameCheck.success) {
      return errorResponse(usernameCheck.error, 400);
    }

    const passwordCheck = validateInput(passwordSchema, body.password);
    if (!passwordCheck.success) {
      return errorResponse(passwordCheck.error, 400);
    }

    // Find user by username
    const { data: profile } = await supabaseServer
      .from('profiles')
      .select('id, username')
      .eq('username', body.username)
      .single();

    if (!profile) {
      return errorResponse('Invalid username or password', 401);
    }

    // Get user's email from auth.users
    const { data: userData, error: userError } = await supabaseServer.auth.admin.getUserById(profile.id);

    if (userError || !userData.user?.email) {
      return errorResponse('Invalid username or password', 401);
    }

    // Sign in with email + password
    const { data: signInData, error: signInError } = await supabaseServer.auth.signInWithPassword({
      email: userData.user.email,
      password: body.password,
    });

    if (signInError || !signInData.session) {
      return errorResponse('Invalid username or password', 401);
    }

    // Return session data
    return Response.json({
      success: true,
      access_token: signInData.session.access_token,
      refresh_token: signInData.session.refresh_token,
      expires_at: signInData.session.expires_at,
      user: {
        id: signInData.user.id,
        username: profile.username,
      }
    }, { status: 200 });

  } catch (err) {
    console.error('Login error:', err);
    return errorResponse('Login failed', 500);
  }
}
