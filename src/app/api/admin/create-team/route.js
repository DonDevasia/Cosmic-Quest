import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request) {
  try {
    const { teamName, teamNumber, teamCode, memberA, memberB, memberC, memberD } = await request.json();

    if (!teamName || !teamCode) {
      return NextResponse.json({ success: false, message: 'Team Name and Team Code are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('teams')
      .insert([
        { 
          team_name: teamName, 
          team_number: teamNumber, 
          team_code: teamCode,
          member_a: memberA,
          member_b: memberB,
          member_c: memberC,
          member_d: memberD
        }
      ])
      .select();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation (likely team_number)
        return NextResponse.json({ success: false, message: 'Team Number already exists or Team Code collision' }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json({ 
      success: true, 
      team: data[0]
    });

  } catch (error) {
    console.error('Create Team Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
