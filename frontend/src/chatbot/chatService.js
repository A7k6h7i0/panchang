import { getPanchangData, checkTimeAuspiciousness } from './panchangService';

export async function sendChatMessage(message, settings) {
  const lowerMsg = message.toLowerCase();
  const replyLanguage = detectMessageLanguage(message) || settings.language;
  const effectiveSettings = { ...settings, language: replyLanguage };
  const intent = detectIntent(lowerMsg);

  try {
    switch (intent.type) {
      case 'daily_panchang':
        return await handleDailyPanchang(effectiveSettings);
      case 'time_check':
        return await handleTimeCheck(intent, effectiveSettings);
      case 'greeting':
        return handleGreeting(effectiveSettings);
      case 'help':
        return handleHelp(effectiveSettings);
      default:
        return handleGeneral(effectiveSettings);
    }
  } catch (error) {
    console.error('Chat error:', error);
    return getErrorMessage(replyLanguage);
  }
}

function detectMessageLanguage(message) {
  const text = String(message || '').trim();
  if (!text) return null;

  const hasTeluguScript = /[\u0C00-\u0C7F]/.test(text);
  if (hasTeluguScript) return 'te';

  const hasDevanagariScript = /[\u0900-\u097F]/.test(text);
  if (hasDevanagariScript) return 'hi';

  const lower = text.toLowerCase();
  const teluguHints = ['namaskaram', 'panchangam', 'rahukalam', 'yamagandam'];
  if (teluguHints.some((hint) => lower.includes(hint))) return 'te';

  const hindiHints = ['namaste', 'aaj', 'samay', 'madad', 'achha', 'bura'];
  if (hindiHints.some((hint) => lower.includes(hint))) return 'hi';

  if (/[a-z]/i.test(text)) return 'en';
  return null;
}

function detectIntent(message) {
  if (
    message.includes('today') ||
    message.includes('panchang') ||
    message.includes('panchangam') ||
    message.includes('ఈరోజు') ||
    message.includes('పంచాంగం') ||
    message.includes('आज') ||
    message.includes('tithi') ||
    message.includes('తిథి') ||
    message.includes('rahukalam') ||
    message.includes('రాహుకాలం') ||
    message.includes('yamagandam') ||
    message.includes('యమగండం')
  ) {
    return { type: 'daily_panchang' };
  }

  if (
    (message.includes('good') ||
      message.includes('bad') ||
      message.includes('time') ||
      message.includes('should') ||
      message.includes('can i') ||
      message.includes('మంచిది') ||
      message.includes('చెడ్డది') ||
      message.includes('సమయం') ||
      message.includes('अच्छा') ||
      message.includes('बुरा')) &&
    (message.match(/\d+/) || message.includes('now') || message.includes('ఇప్పుడు') || message.includes('अभी'))
  ) {
    return { type: 'time_check', message };
  }

  if (
    message.includes('hello') ||
    message.includes('hi') ||
    message.includes('hey') ||
    message.includes('నమస్కారం') ||
    message.includes('హలో') ||
    message.includes('नमस्ते')
  ) {
    return { type: 'greeting' };
  }

  if (
    message.includes('help') ||
    message.includes('how') ||
    message.includes('what can') ||
    message.includes('సహాయం') ||
    message.includes('मदद')
  ) {
    return { type: 'help' };
  }

  return { type: 'general' };
}

async function handleDailyPanchang(settings) {
  const today = new Date();
  const panchang = await getPanchangData(settings.city, today);
  return formatPanchangResponse(panchang, settings);
}

async function handleTimeCheck(intent, settings) {
  const now = new Date();
  const result = await checkTimeAuspiciousness(settings.city, now, intent.message);
  return formatTimeCheckResponse(result, settings);
}

function handleGreeting(settings) {
  const greetings = {
    te: settings.friendMode
      ? 'ఏమిటి బ్రో! నేను మీ పంచాంగ ఫ్రెండ్. ఏదైనా అడగండి! 😊'
      : 'నమస్కారం! నేను మీ పంచాంగ సహాయకుడిని. ఏదైనా అడగండి! 🙏',
    en: settings.friendMode
      ? "Hey bro! I'm your Panchang Friend. Ask me anything! 😊"
      : "Hello! I'm your Panchang assistant. How can I help? 🙏",
    hi: settings.friendMode
      ? 'क्या हाल भाई! मैं तुम्हारा पंचांग फ्रेंड हूं। कुछ भी पूछो! 😊'
      : 'नमस्ते! मैं आपका पंचांग सहायक हूं। कैसे मदद करूं? 🙏',
  };
  return greetings[settings.language] || greetings.en;
}

function handleHelp(settings) {
  const help = {
    te: `నేను మీకు ఇలా సహాయం చేయగలను:

📅 "ఈరోజు పంచాంగం చెప్పు"
⏰ "4 PMకి ప్రయాణం మంచిదా?"
🛍️ "ఇప్పుడు షాపింగ్ కి వెళ్లవచ్చా?"
💼 "ఈ సాయంత్రం ఇంటర్వ్యూ మంచిదా?"
✈️ "రేపు ప్రయాణం మంచి సమయం ఏది?"

రాహుకాలం, యమగండం, శుభ ముహూర్తాలు అన్నీ చెబుతాను! 🙏`,
    en: `I can help you with:

📅 "Tell me today's panchang"
⏰ "Is 4 PM good for travel?"
🛍️ "Can I go shopping now?"
💼 "Is evening good for interview?"
✈️ "What's the best time to travel tomorrow?"

I'll tell you Rahukalam, Yamagandam, and auspicious times! 🙏`,
    hi: `मैं आपकी मदद कर सकता हूं:

📅 "आज का पंचांग बताओ"
⏰ "4 PM यात्रा के लिए अच्छा है?"
🛍️ "अभी शॉपिंग जा सकते हैं?"
💼 "शाम को इंटरव्यू अच्छा है?"
✈️ "कल यात्रा का सबसे अच्छा समय क्या है?"

मैं राहुकाल, यमगंडम और शुभ मुहूर्त बताऊंगा! 🙏`,
  };
  return help[settings.language] || help.en;
}

function handleGeneral(settings) {
  const responses = {
    te: 'నాకు అర్థం కాలేదు బ్రో. "సహాయం" అని టైప్ చేయండి! 🤔',
    en: `I didn't understand that bro. Type "help" to see what I can do! 🤔`,
    hi: 'मुझे समझ नहीं आया भाई। "मदद" टाइप करें! 🤔',
  };
  return responses[settings.language] || responses.en;
}

function formatPanchangResponse(panchang, settings) {
  const { language, friendMode } = settings;

  if (language === 'te') {
    const intro = friendMode
      ? `బ్రో, ఈరోజు పంచాంగం ఇదిగో! 📅\n\n📍 ${panchang.city} - ${panchang.date}\n`
      : `ఈరోజు పంచాంగం:\n\n📍 ${panchang.city} - ${panchang.date}\n`;

    return `${intro}
🌙 తిథి: ${panchang.tithi}
📅 వారం: ${panchang.vara}
⭐ నక్షత్రం: ${panchang.nakshatra}
🔆 యోగం: ${panchang.yoga}
⚡ కరణం: ${panchang.karana}

⏰ ముఖ్య సమయాలు:
🌅 సూర్యోదయం: ${panchang.sunrise}
🌇 సూర్యాస్తమయం: ${panchang.sunset}

❌ తప్పించాల్సిన సమయాలు:
🔴 రాహుకాలం: ${panchang.rahukalam}
🔴 యమగండం: ${panchang.yamagandam}
🔴 గులిక కాలం: ${panchang.gulikaKalam}

✅ శుభ ముహూర్తం:
💚 అభిజిత్ ముహూర్తం: ${panchang.abhijitMuhurtam}

${friendMode ? '💡 టిప్: ముఖ్యమైన పనులు రాహుకాలం, యమగండం సమయంలో చేయకు బ్రో!' : '💡 ముఖ్యమైన పనులు శుభ ముహూర్తాల్లో చేయండి.'}`;
  }

  if (language === 'hi') {
    const intro = friendMode
      ? `भाई, आज का पंचांग यह रहा! 📅\n\n📍 ${panchang.city} - ${panchang.date}\n`
      : `आज का पंचांग:\n\n📍 ${panchang.city} - ${panchang.date}\n`;

    return `${intro}
🌙 तिथि: ${panchang.tithi}
📅 वार: ${panchang.vara}
⭐ नक्षत्र: ${panchang.nakshatra}
🔆 योग: ${panchang.yoga}
⚡ करण: ${panchang.karana}

⏰ महत्वपूर्ण समय:
🌅 सूर्योदय: ${panchang.sunrise}
🌇 सूर्यास्त: ${panchang.sunset}

❌ बचने योग्य समय:
🔴 राहुकाल: ${panchang.rahukalam}
🔴 यमगंडम: ${panchang.yamagandam}
🔴 गुलिक काल: ${panchang.gulikaKalam}

✅ शुभ मुहूर्त:
💚 अभिजित मुहूर्त: ${panchang.abhijitMuhurtam}

${friendMode ? '💡 टिप: राहुकाल और यमगंडम में महत्वपूर्ण काम मत करो भाई!' : '💡 महत्वपूर्ण कार्य शुभ मुहूर्त में करें।'}`;
  }

  const intro = friendMode
    ? `Bro, here's today's panchang! 📅\n\n📍 ${panchang.city} - ${panchang.date}\n`
    : `Today's Panchang:\n\n📍 ${panchang.city} - ${panchang.date}\n`;

  return `${intro}
🌙 Tithi: ${panchang.tithi}
📅 Vara: ${panchang.vara}
⭐ Nakshatra: ${panchang.nakshatra}
🔆 Yoga: ${panchang.yoga}
⚡ Karana: ${panchang.karana}

⏰ Key Times:
🌅 Sunrise: ${panchang.sunrise}
🌇 Sunset: ${panchang.sunset}

❌ Avoid These Times:
🔴 Rahukalam: ${panchang.rahukalam}
🔴 Yamagandam: ${panchang.yamagandam}
🔴 Gulika Kalam: ${panchang.gulikaKalam}

✅ Auspicious Time:
💚 Abhijit Muhurtam: ${panchang.abhijitMuhurtam}

${friendMode ? "💡 Tip: Don't do important work during Rahukalam & Yamagandam bro!" : '💡 Do important tasks during auspicious times.'}`;
}

function formatTimeCheckResponse(result, settings) {
  const { language, friendMode } = settings;
  const emoji = result.verdict === 'good' ? '✅' : result.verdict === 'avoid' ? '❌' : '⚠️';

  if (language === 'te') {
    const verdict = result.verdict === 'good' ? 'మంచి సమయం' : result.verdict === 'avoid' ? 'తప్పించుకోండి' : 'సామాన్యం';
    const intro = friendMode ? `${emoji} బ్రో, ${verdict}!\n\n` : `${emoji} ${verdict}\n\n`;
    let response = `${intro}కారణం: ${result.reason}\n`;
    if (result.alternatives.length > 0) {
      response += `\n✨ మంచి సమయాలు:\n${result.alternatives.map((time) => `• ${time}`).join('\n')}`;
    }
    return response;
  }

  if (language === 'hi') {
    const verdict = result.verdict === 'good' ? 'अच्छा समय' : result.verdict === 'avoid' ? 'बचें' : 'सामान्य';
    const intro = friendMode ? `${emoji} भाई, ${verdict}!\n\n` : `${emoji} ${verdict}\n\n`;
    let response = `${intro}कारण: ${result.reason}\n`;
    if (result.alternatives.length > 0) {
      response += `\n✨ अच्छे समय:\n${result.alternatives.map((time) => `• ${time}`).join('\n')}`;
    }
    return response;
  }

  const verdict = result.verdict === 'good' ? 'Good Time' : result.verdict === 'avoid' ? 'Avoid' : 'Neutral';
  const intro = friendMode ? `${emoji} Bro, ${verdict}!\n\n` : `${emoji} ${verdict}\n\n`;
  let response = `${intro}Reason: ${result.reason}\n`;
  if (result.alternatives.length > 0) {
    response += `\n✨ Better Times:\n${result.alternatives.map((time) => `• ${time}`).join('\n')}`;
  }
  return response;
}

function getErrorMessage(language) {
  const errors = {
    te: 'క్షమించండి, ఏదో తప్పు జరిగింది. మళ్లీ ప్రయత్నించండి! 🙏',
    en: 'Sorry, something went wrong. Please try again! 🙏',
    hi: 'क्षमा करें, कुछ गलत हो गया। फिर से प्रयास करें! 🙏',
  };
  return errors[language] || errors.en;
}
