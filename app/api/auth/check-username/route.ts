import { NextRequest } from 'next/server';
import { supabaseServer, errorResponse } from '@/lib/supabase-server';
import { usernameSchema, validateInput } from '@/lib/validation';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) {
      return errorResponse('Username required', 400);
    }

    // Validate format
    const check = validateInput(usernameSchema, username);
    if (!check.success) {
      return Response.json({ available: false, error: check.error }, { status: 200 });
    }

    // Check availability
    const { data: existing } = await supabaseServer
      .from('profiles')
      .select('username')
      .eq('username', username)
      .single();

    if (existing) {
      return Response.json({ available: false, error: 'Username is taken' }, { status: 200 });
    }

    return Response.json({ available: true }, { status: 200 });

  } catch (err) {
    console.error('Check username error:', err);
    return errorResponse('Check failed', 500);
  }
}
