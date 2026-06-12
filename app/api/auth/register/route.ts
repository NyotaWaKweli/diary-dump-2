import { NextRequest } from 'next/server';
import { supabaseServer, errorResponse, checkRateLimit } from '@/lib/supabase-server';
import { usernameSchema, passwordSchema, recoveryPinSchema, validateInput } from '@/lib/validation';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 3 attempts per 5 minutes per IP
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(`register:${ip}`, 3, 300000)) {
      return errorResponse('Too many attempts. Please try again later.', 429);
    }

    const body = await request.json();

    // Validate username (Instagram-style: lowercase, numbers, underscores, dots)
    const usernameCheck = validateInput(usernameSchema, body.username);
    if (!usernameCheck.success) {
      return errorResponse(usernameCheck.error, 400);
    }
    const username = usernameCheck.data;

    // Validate password
    const passwordCheck = validateInput(passwordSchema, body.password);
    if (!passwordCheck.success) {
      return errorResponse(passwordCheck.error, 400);
    }

    // Validate recovery PIN
    const pinCheck = validateInput(recoveryPinSchema, body.recoveryPin);
    if (!pinCheck.success) {
      return errorResponse(pinCheck.error, 400);
    }

    // Check if username already exists
    const { data: existing } = await supabaseServer
      .from('profiles')
      .select('username')
      .eq('username', username)
      .single();

    if (existing) {
      return errorResponse('Username is already taken', 409);
    }

    // Create user with Supabase Auth (using username as email prefix for uniqueness)
    const email = `${username}@diarydump.local`;
    const { data: authData, error: authError } = await supabaseServer.auth.admin.createUser({
      email: email,
      password: body.password,
      user_metadata: {
        username: username,
        recovery_pin: body.recoveryPin,
      },
      email_confirm: true,
    });

    if (authError || !authData.user) {
      console.error('Auth creation error:', authError);
      return errorResponse('Registration failed', 500);
    }

    // Update profile with username and PIN (trigger already created basic row)
    const { error: profileError } = await supabaseServer
      .from('profiles')
      .update({
        username: username,
        recovery_pin: body.recoveryPin,
      })
      .eq('id', authData.user.id);

    if (profileError) {
      console.error('Profile update error:', profileError);
      return errorResponse('Registration failed', 500);
    }

    return Response.json({ 
      success: true, 
      message: 'Account created successfully',
      userId: authData.user.id 
    }, { status: 201 });

  } catch (err) {
    console.error('Registration error:', err);
    return errorResponse('Registration failed', 500);
  }
}
