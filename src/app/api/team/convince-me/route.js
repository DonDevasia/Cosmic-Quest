import { NextResponse } from 'next/server';

const stage1Responses = [
  "I don't think we should get back together.",
  "You had your chance.",
  "I've already started moving on.",
  "Can we just stay friends?",
  "I've made my decision.",
  "Give me some space, please."
];

const stage2Responses = [
  "I need some time to think.",
  "I'm scared we'll end up hurting each other again.",
  "I don't trust you like I used to.",
  "Saying sorry isn't enough this time.",
  "I don't want to go through the same pain again."
];

const stage3Responses = [
  "I still care about you, but things have changed.",
  "I miss you too, but I don't know if this is right.",
  "I need actions, not promises.",
  "Why do you want me back now?",
  "What will be different this time?",
  "I'm not ready for a relationship right now.",
  "I still love you, but I need to protect myself."
];

const stage4Responses = [
  "Maybe we can talk and see where it goes.",
  "Okay, we can try again, but slowly."
];

const badWordResponses = [
  "I don't think we should get back together.",
  "You had your chance.",
  "I've made my decision."
];

export async function POST(req) {
  try {
    const { message, history = [] } = await req.json();

    if (!message) {
      return NextResponse.json({ reply: "Giving me the silent treatment now? Typical.", success: false });
    }

    const userHistory = [...history, message];

    let score = 0;
    let hasApology = false;
    let hasAffection = false;
    let hasCommitment = false;
    let hasPleading = false;
    let hasCompliment = false;
    let hasBadWords = false;

    const apologyWords = ['sorry', 'apologize', 'forgive', 'fault', 'mistake', 'wrong', 'regret'];
    const affectionWords = ['love', 'miss', 'care', 'heart', 'baby', 'babe', 'sweetheart'];
    const commitmentWords = ['promise', 'change', 'never again', 'forever', 'marry', 'better', 'future'];
    const pleadingWords = ['please', 'beg', 'chance', 'back together', 'one more', 'try again'];
    const complimentWords = ['beautiful', 'gorgeous', 'perfect', 'amazing', 'special', 'pretty'];
    const badWords = ['bitch', 'shut up', 'hate', 'stupid', 'dumb', 'ugly', 'fuck', 'shit', 'idiot'];

    for (const msg of userHistory) {
      const lower = msg.toLowerCase();
      
      if (apologyWords.some(w => lower.includes(w))) hasApology = true;
      if (affectionWords.some(w => lower.includes(w))) hasAffection = true;
      if (commitmentWords.some(w => lower.includes(w))) hasCommitment = true;
      if (pleadingWords.some(w => lower.includes(w))) hasPleading = true;
      if (complimentWords.some(w => lower.includes(w))) hasCompliment = true;
      if (badWords.some(w => lower.includes(w))) hasBadWords = true;
    }

    if (hasApology) score += 25;
    if (hasAffection) score += 25;
    if (hasCommitment) score += 25;
    if (hasPleading) score += 25;
    if (hasCompliment) score += 10;
    if (hasBadWords) score -= 100;

    let reply = "";
    
    if (score < 0) {
      reply = badWordResponses[Math.floor(Math.random() * badWordResponses.length)];
    } else if (score < 25) {
      reply = stage1Responses[Math.floor(Math.random() * stage1Responses.length)];
    } else if (score < 50) {
      reply = stage2Responses[Math.floor(Math.random() * stage2Responses.length)];
    } else if (score < 75) {
      reply = stage3Responses[Math.floor(Math.random() * stage3Responses.length)];
    } else if (score < 100) {
      reply = stage4Responses[Math.floor(Math.random() * stage4Responses.length)];
    } else {
      return NextResponse.json({ 
        reply: "i'm crying so much right now 😭 i forgive you. i love you so much and i just want you back. here's the code to prove we patched up: ONE", 
        success: true 
      });
    }

    return NextResponse.json({ reply, success: false });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
