import { NextRequest } from 'next/server';
import { supabaseServer, errorResponse, checkRateLimit } from '@/lib/supabase-server';

async function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabaseServer.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return errorResponse('Authentication required', 401);
    }

    // Rate limit: 5 uploads per hour
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(`upload:${user.id}:${ip}`, 5, 3600000)) {
      return errorResponse('Too many uploads', 429);
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return errorResponse('No file provided', 400);
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return errorResponse('Invalid file type. Only JPEG, PNG, GIF, WebP allowed', 400);
    }

    // Validate file size (2MB max)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      return errorResponse('File too large. Maximum 2MB', 400);
    }

    // Upload to Supabase Storage
    const filePath = `${user.id}/avatar.jpg`;
    const { data: uploadData, error: uploadError } = await supabaseServer.storage
      .from('avatars')
      .upload(filePath, file, {
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return errorResponse('Upload failed', 500);
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseServer.storage
      .from('avatars')
      .getPublicUrl(filePath);

    // Update profile
    const { error: updateError } = await supabaseServer
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', user.id);

    if (updateError) {
      console.error('Profile update error:', updateError);
      return errorResponse('Failed to update profile', 500);
    }

    return Response.json({ 
      success: true, 
      avatarUrl: publicUrl 
    });

  } catch (err) {
    console.error('Upload error:', err);
    return errorResponse('Upload failed', 500);
  }
}
