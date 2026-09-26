import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST() {
  try {
    // 1. Delete all team_tasks
    const { error: err1 } = await supabase.from('team_tasks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (err1) throw err1;

    // 2. Delete all teams
    const { error: err2 } = await supabase.from('teams').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (err2) throw err2;

    // 3. Reset event state
    const { error: err3 } = await supabase.from('event_state').update({ is_active: false, timer_running: false, elapsed_seconds: 0 }).neq('id', '00000000-0000-0000-0000-000000000000');
    if (err3) throw err3;

    return NextResponse.json({ success: true, message: 'Event and database fully reset' });
  } catch (error) {
    console.error('Reset Event Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
