import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function DELETE(request) {
  try {
    const { teamId } = await request.json();

    if (!teamId) {
      return NextResponse.json({ success: false, message: 'Team ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('teams')
      .delete()
      .eq('id', teamId);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Team deleted successfully' });

  } catch (error) {
    console.error('Delete Team Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
