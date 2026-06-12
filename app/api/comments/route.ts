import { NextRequest } from 'next/server';
import { supabaseServer, errorResponse, checkRateLimit } from '@/lib/supabase-server';
import { commentSchema, validateInput } from '@/lib/validation';

async function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabaseServer.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

// GET: Comments for a diary
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const diaryId = searchParams.get('diaryId');

    if (!diaryId) return errorResponse('Diary ID required', 400);

    const { data, error } = await supabaseServer
      .from('comments')
      .select('*, profiles(username, avatar_url)')
      .eq('diary_id', diaryId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Fetch comments error:', error);
      return errorResponse('Failed to fetch comments', 500);
    }

    return Response.json({ success: true, data });

  } catch (err) {
    console.error('Comments GET error:', err);
    return errorResponse('Failed to fetch comments', 500);
  }
}

// POST: Create comment
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return errorResponse('Authentication required', 401);
    }

    // Rate limit: 20 comments per hour
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(`comment:${user.id}:${ip}`, 20, 3600000)) {
      return errorResponse('Too many comments. Please slow down.', 429);
    }

    const body = await request.json();

    const contentCheck = validateInput(commentSchema, body.content);
    if (!contentCheck.success) return errorResponse(contentCheck.error, 400);

    if (!body.diaryId) return errorResponse('Diary ID required', 400);

    const commentData = {
      diary_id: body.diaryId,
      author_id: user.id,
      content: contentCheck.data,
      parent_id: body.parentId || null,
    };

    const { data, error } = await supabaseServer
      .from('comments')
      .insert(commentData)
      .select()
      .single();

    if (error || !data) {
      console.error('Create comment error:', error);
      return errorResponse('Failed to post comment', 500);
    }

    // Create notification for diary owner (if not self)
    const { data: diary } = await supabaseServer
      .from('diaries')
      .select('author_id')
      .eq('id', body.diaryId)
      .single();

    if (diary && diary.author_id !== user.id) {
      await supabaseServer.from('notifications').insert({
        user_id: diary.author_id,
        type: body.parentId ? 'reply' : 'comment',
        from_user_id: user.id,
        diary_id: body.diaryId,
        message: body.parentId ? 'Someone replied to your comment' : 'Someone commented on your diary',
      });
    }

    return Response.json({ success: true, data }, { status: 201 });

  } catch (err) {
    console.error('Comments POST error:', err);
    return errorResponse('Failed to post comment', 500);
  }
}

// DELETE: Delete comment
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return errorResponse('Authentication required', 401);
    }

    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('id');

    if (!commentId) return errorResponse('Comment ID required', 400);

    // Check if user is comment author or diary owner
    const { data: comment } = await supabaseServer
      .from('comments')
      .select('author_id, diary_id')
      .eq('id', commentId)
      .single();

    if (!comment) return errorResponse('Comment not found', 404);

    const { data: diary } = await supabaseServer
      .from('diaries')
      .select('author_id')
      .eq('id', comment.diary_id)
      .single();

    const isAuthorized = comment.author_id === user.id || diary?.author_id === user.id;
    if (!isAuthorized) {
      return errorResponse('Not authorized', 403);
    }

    const { error } = await supabaseServer
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      console.error('Delete comment error:', error);
      return errorResponse('Failed to delete comment', 500);
    }

    return Response.json({ success: true, message: 'Comment deleted' });

  } catch (err) {
    console.error('Comments DELETE error:', err);
    return errorResponse('Failed to delete comment', 500);
  }
}
