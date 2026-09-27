import { NextResponse } from 'next/server';

const stage1Responses = [
  "I just... I can't even look at these messages right now. It hurts too much.",
  "Do you have any idea how much you broke my heart? A simple text isn't going to fix this.",
  "I'm crying while reading this. Please, just give me some space.",
  "It's so unfair that you think you can just message me after everything that happened.",
  "My heart sank when I saw your name pop up. I don't know if I can do this right now."
];

const stage2Responses = [
  "I want to believe you, I really do, but every time I trust you I end up in tears...",
  "Reading that makes me feel a little better, but the pain doesn't just vanish overnight.",
  "I'm still so incredibly hurt. It feels like my chest is heavy just thinking about it.",
  "You say that, but I'm terrified of letting my guard down again. It took so much out of me.",
  "Part of me misses you so much it physically hurts, but the other part is just so angry."
];

const stage3Responses = [
  "I've been looking at our old photos and just crying... I want things to be how they used to be.",
  "I'm trying so hard to keep my walls up, but you're making it really difficult right now...",
  "I miss your voice. I miss us. But I need to know you're actually serious this time, please.",
  "If I let you back in, you have to promise me you won't break my heart again. I can't survive it a second time.",
  "My hands are literally shaking typing this. I want to forgive you, but I'm just so scared."
];

const stage4Responses = [
  "Oh my god, I'm literally in tears right now... Do you really mean all of that?",
  "I've missed you so, so much. Just hearing you say those things makes my heart ache in a good way.",
  "I want to take you back... I really do. I just need you to hold me and tell me it's going to be okay.",
  "You're making me cry again... but this time I think it's because I still love you so much.",
  "Okay... my heart is completely melting. I want us to work. I want you."
];

const badWordResponses = [
  "Wow. You haven't changed at all. You're still the same toxic person who broke my heart. Goodbye.",
  "I am literally crying right now and you talk to me like THAT?! We are done. For real this time.",
  "That was incredibly cruel. Please delete my number. I don't deserve to be treated this way.",
  "You know exactly how to hurt me, don't you? Please don't ever contact me again."
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
        reply: "Okay... I'm crying but I forgive you. Let's patch things up. I love you so much. Come back to me. Here is the keyword to prove we patched up: PATCHED_UP", 
        success: true 
      });
    }

    return NextResponse.json({ reply, success: false });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
