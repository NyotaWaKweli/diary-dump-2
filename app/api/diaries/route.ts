import { NextRequest } from 'next/server';
import { supabaseServer, errorResponse, checkRateLimit } from '@/lib/supabase-server';
import { diaryContentSchema, tagsSchema, moodSchema, fontSchema, colorSchema, validateInput } from '@/lib/validation';

// Helper: Verify auth token and get user
async function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabaseServer.auth.getUser(token);

  if (error || !user) return null;
  return user;
}

// GET: Fetch diaries with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    let query = supabaseServer
      .from('diaries')
      .select('*, profiles(username, avatar_url), comments(count)')
      .eq('is_private', false);

    // Apply filters
    const timeRange = searchParams.get('timeRange');
    if (timeRange && timeRange !== 'all') {
      const now = new Date();
      let startDate = new Date();
      switch(timeRange) {
        case 'hour': startDate.setHours(now.getHours() - 1); break;
        case 'day': startDate.setDate(now.getDate() - 1); break;
        case 'week': startDate.setDate(now.getDate() - 7); break;
        case 'month': startDate.setMonth(now.getMonth() - 1); break;
      }
      query = query.gte('created_at', startDate.toISOString());
    }

    const mood = searchParams.get('mood');
    if (mood) query = query.eq('mood', mood);

    const tag = searchParams.get('tag');
    if (tag) query = query.contains('tags', [tag]);

    const author = searchParams.get('author');
    if (author) {
      const { data: profile } = await supabaseServer
        .from('profiles')
        .select('id')
        .eq('username', author)
        .single();
      if (profile) query = query.eq('author_id', profile.id);
    }

    const sortBy = searchParams.get('sortBy') || 'newest';
    switch(sortBy) {
      case 'newest': query = query.order('created_at', { ascending: false }); break;
      case 'oldest': query = query.order('created_at', { ascending: true }); break;
      case 'most_viewed': query = query.order('views', { ascending: false }); break;
      case 'most_commented': query = query.order('comments(count)', { ascending: false }); break;
      case 'random': query = query.order('id'); break; // Approximate random
    }

    const limit = Math.min(parseInt(searchParams.get('limit') || '8'), 50);
    const offset = parseInt(searchParams.get('offset') || '0');
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      console.error('Fetch diaries error:', error);
      return errorResponse('Failed to fetch diaries', 500);
    }

    return Response.json({ success: true, data });

  } catch (err) {
    console.error('Diaries GET error:', err);
    return errorResponse('Failed to fetch diaries', 500);
  }
}

// POST: Create new diary
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return errorResponse('Authentication required', 401);
    }

    // Rate limit: 10 diaries per hour
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(`diary_create:${user.id}:${ip}`, 10, 3600000)) {
      return errorResponse('Too many diaries. Please slow down.', 429);
    }

    const body = await request.json();

    // Validate content
    const contentCheck = validateInput(diaryContentSchema, body.content);
    if (!contentCheck.success) return errorResponse(contentCheck.error, 400);

    // Validate mood
    const moodCheck = validateInput(moodSchema, body.mood || 'Heavy');
    if (!moodCheck.success) return errorResponse(moodCheck.error, 400);

    // Validate font
    const fontCheck = validateInput(fontSchema, body.font || 'Caveat');
    if (!fontCheck.success) return errorResponse(fontCheck.error, 400);

    // Validate color
    const colorCheck = validateInput(colorSchema, body.color || '#ffffff');
    if (!colorCheck.success) return errorResponse(colorCheck.error, 400);

    // Validate tags
    const tags = body.tags?.split(',').map((t: string) => t.trim()).filter(Boolean) || [];
    const tagsCheck = validateInput(tagsSchema, tags);
    if (!tagsCheck.success) return errorResponse(tagsCheck.error, 400);

    const diaryData = {
      author_id: user.id,
      content: contentCheck.data,
      mood: moodCheck.data,
      font: fontCheck.data,
      color: colorCheck.data,
      rotation: (Math.random() - 0.5) * 4,
      tags: tagsCheck.data,
      is_private: !!body.isPrivate,
      repost_of: body.repostOf || null,
    };

    const { data, error } = await supabaseServer
      .from('diaries')
      .insert(diaryData)
      .select()
      .single();

    if (error || !data) {
      console.error('Create diary error:', error);
      return errorResponse('Failed to create diary', 500);
    }

    // If repost, add to chain
    if (body.repostOf && body.chainContent) {
      await supabaseServer.from('repost_chain').insert({
        diary_id: data.id,
        content: body.chainContent,
        author_id: user.id,
        color: colorCheck.data,
        font: fontCheck.data,
        position: 0,
      });
    }

    return Response.json({ success: true, data }, { status: 201 });

  } catch (err) {
    console.error('Diaries POST error:', err);
    return errorResponse('Failed to create diary', 500);
  }
}

// PATCH: Update diary
export async function PATCH(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return errorResponse('Authentication required', 401);
    }

    const body = await request.json();
    const diaryId = body.id;

    if (!diaryId) return errorResponse('Diary ID required', 400);

    // Verify ownership
    const { data: existing } = await supabaseServer
      .from('diaries')
      .select('author_id')
      .eq('id', diaryId)
      .single();

    if (!existing || existing.author_id !== user.id) {
      return errorResponse('Not authorized', 403);
    }

    const updates: any = {};

    if (body.content) {
      const check = validateInput(diaryContentSchema, body.content);
      if (!check.success) return errorResponse(check.error, 400);
      updates.content = check.data;
    }

    if (body.mood) {
      const check = validateInput(moodSchema, body.mood);
      if (!check.success) return errorResponse(check.error, 400);
      updates.mood = check.data;
    }

    if (body.font) {
      const check = validateInput(fontSchema, body.font);
      if (!check.success) return errorResponse(check.error, 400);
      updates.font = check.data;
    }

    if (body.tags) {
      const tags = body.tags.split(',').map((t: string) => t.trim()).filter(Boolean);
      const check = validateInput(tagsSchema, tags);
      if (!check.success) return errorResponse(check.error, 400);
      updates.tags = check.data;
    }

    if (body.isPrivate !== undefined) updates.is_private = !!body.isPrivate;

    const { data, error } = await supabaseServer
      .from('diaries')
      .update(updates)
      .eq('id', diaryId)
      .select()
      .single();

    if (error) {
      console.error('Update diary error:', error);
      return errorResponse('Failed to update diary', 500);
    }

    return Response.json({ success: true, data });

  } catch (err) {
    console.error('Diaries PATCH error:', err);
    return errorResponse('Failed to update diary', 500);
  }
}

// DELETE: Delete diary
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return errorResponse('Authentication required', 401);
    }

    const { searchParams } = new URL(request.url);
    const diaryId = searchParams.get('id');

    if (!diaryId) return errorResponse('Diary ID required', 400);

    // Verify ownership
    const { data: existing } = await supabaseServer
      .from('diaries')
      .select('author_id')
      .eq('id', diaryId)
      .single();

    if (!existing || existing.author_id !== user.id) {
      return errorResponse('Not authorized', 403);
    }

    const { error } = await supabaseServer
      .from('diaries')
      .delete()
      .eq('id', diaryId);

    if (error) {
      console.error('Delete diary error:', error);
      return errorResponse('Failed to delete diary', 500);
    }

    return Response.json({ success: true, message: 'Diary deleted' });

  } catch (err) {
    console.error('Diaries DELETE error:', err);
    return errorResponse('Failed to delete diary', 500);
  }
}
