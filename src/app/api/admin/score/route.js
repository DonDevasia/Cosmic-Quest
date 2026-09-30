import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request) {
  try {
    const { teamId, taskId, pointsChange, reason } = await request.json();

    // 1. Insert Score History
    const { data: history, error: historyError } = await supabase
      .from('score_history')
      .insert([{ team_id: teamId, task_id: taskId, points_change: pointsChange, reason }]);

    if (historyError) throw historyError;

    // 2. Fetch current total score
    const { data: teamData, error: teamFetchErr } = await supabase
      .from('teams')
      .select('total_score')
      .eq('id', teamId)
      .single();

    if (teamFetchErr) throw teamFetchErr;

    // 3. Update Team Total Score
    const newScore = (teamData.total_score || 0) + pointsChange;
    const { error: updateErr } = await supabase
      .from('teams')
      .update({ total_score: newScore })
      .eq('id', teamId);

    if (updateErr) throw updateErr;
    
    return NextResponse.json({ success: true, message: `Added ${pointsChange} points`, newScore });
  } catch (error) {
    console.error('Score Update Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
