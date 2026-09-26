import { NextResponse } from 'next/server';

const stage1Responses = [
  "Don't talk to me. We are done.",
  "You really think this fixes things? Try again.",
  "I don't want to hear it.",
  "Whatever.",
  "Are you kidding me right now?"
];

const stage2Responses = [
  "That's a start, but I'm still really hurt.",
  "I don't know if I can trust you.",
  "You say that now, but what about last time?",
  "Words are just words...",
  "I'm still so mad at you."
];

const stage3Responses = [
  "I miss us too, but it's hard...",
  "You're making this difficult. I want to believe you...",
  "Are you really going to change?",
  "I don't want to get hurt again.",
  "Prove it to me."
];

const stage4Responses = [
  "I'm tearing up... do you really mean everything you're saying?",
  "I want to take you back... just promise me.",
  "Okay... you're almost there.",
  "I want us to work, I really do...",
  "My heart is melting a little bit..."
];

const badWordResponses = [
  "Excuse me?! Do NOT talk to me like that. We are definitely done.",
  "Wow. You haven't changed at all. Goodbye.",
  "Are you serious right now? Don't ever speak to me again.",
  "That's exactly why I broke up with you."
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
        reply: "Okay... I forgive you. Let's patch things up. I love you too. Here is the keyword to prove we patched up: PATCHED_UP", 
        success: true 
      });
    }

    return NextResponse.json({ reply, success: false });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
