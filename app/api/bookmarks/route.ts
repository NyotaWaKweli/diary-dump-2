import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function POST(req: Request) {
  try {
    const { diaryId } = await req.json();

    // Fetch current saves count
    const { data, error } = await supabaseServer
      .from('diaries')
      .select('saves')
      .eq('id', diaryId)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const newSaves = (data?.saves || 0) - 1;

    // Update with decremented value
    const { error: updateError } = await supabaseServer
      .from('diaries')
      .update({ saves: newSaves })
      .eq('id', diaryId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, saves: newSaves });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
