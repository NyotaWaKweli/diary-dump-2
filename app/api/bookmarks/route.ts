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

// GET: User's bookmarks
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return errorResponse('Authentication required', 401);
    }

    const { data, error } = await supabaseServer
      .from('bookmarks')
      .select('*, diaries(*, profiles(username, avatar_url))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch bookmarks error:', error);
      return errorResponse('Failed to fetch bookmarks', 500);
    }

    return Response.json({ success: true, data });

  } catch (err) {
    console.error('Bookmarks GET error:', err);
    return errorResponse('Failed to fetch bookmarks', 500);
  }
}

// POST: Toggle bookmark
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return errorResponse('Authentication required', 401);
    }

    const body = await request.json();
    const diaryId = body.diaryId;

    if (!diaryId) return errorResponse('Diary ID required', 400);

    // Check if already bookmarked
    const { data: existing } = await supabaseServer
      .from('bookmarks')
      .select('id')
      .eq('user_id', user.id)
      .eq('diary_id', diaryId)
      .single();

    if (existing) {
      // Remove bookmark
      const { error } = await supabaseServer
        .from('bookmarks')
        .delete()
        .eq('id', existing.id);

      if (error) {
        console.error('Remove bookmark error:', error);
        return errorResponse('Failed to remove bookmark', 500);
      }

      // Decrement saves count
      await supabaseServer.rpc('increment_views', { diary_ids: [diaryId] }); // Using views function for atomic update
      await supabaseServer.from('diaries').update({ saves: supabaseServer.raw('saves - 1') }).eq('id', diaryId);

      return Response.json({ success: true, bookmarked: false });
    } else {
      // Add bookmark
      const { data, error } = await supabaseServer
        .from('bookmarks')
        .insert({ user_id: user.id, diary_id: diaryId })
        .select()
        .single();

      if (error || !data) {
        console.error('Add bookmark error:', error);
        return errorResponse('Failed to add bookmark', 500);
      }

      // Increment saves count
      await supabaseServer.from('diaries').update({ saves: supabaseServer.raw('saves + 1') }).eq('id', diaryId);

      // Notify diary owner
      const { data: diary } = await supabaseServer
        .from('diaries')
        .select('author_id')
        .eq('id', diaryId)
        .single();

      if (diary && diary.author_id !== user.id) {
        await supabaseServer.from('notifications').insert({
          user_id: diary.author_id,
          type: 'bookmark',
          from_user_id: user.id,
          diary_id: diaryId,
          message: 'Someone saved your diary',
        });
      }

      return Response.json({ success: true, bookmarked: true, data }, { status: 201 });
    }

  } catch (err) {
    console.error('Bookmarks POST error:', err);
    return errorResponse('Failed to toggle bookmark', 500);
  }
}
