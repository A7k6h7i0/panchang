// Rashi names in all 6 languages
export const RASHI_NAMES = {
  mesha: { en: "Mesha", te: "మేష", hi: "मेष", ml: "മേഷ", kn: "ಮೇಷ", ta: "மேஷ" },
  vrishabha: { en: "Vrishabha", te: "వృషభ", hi: "वृषभ", ml: "വൃഷഭ", kn: "ವೃಷಭ", ta: "விருஷப" },
  mithuna: { en: "Mithuna", te: "మితున", hi: "मिथुन", ml: "മിഥുന", kn: "ಮಿಥುನ", ta: "மிதுன" },
  karka: { en: "Karka", te: "కర్క", hi: "कर्क", ml: "കർക്കട", kn: "ಕರ್ಕ", ta: "கர்க्" },
  simha: { en: "Simha", te: "సిమ్హ", hi: "सिंह", ml: "സിംഹ", kn: "ಸಿಂಹ", ta: "சிம்ம" },
  kanya: { en: "Kanya", te: "కన్య", hi: "कन्या", ml: "കന്യ", kn: "ಕನ್ಯಾ", ta: "கன்யா" },
  tula: { en: "Tula", te: "తుల", hi: "तुला", ml: "തുല", kn: "ತುಲಾ", ta: "துலா" },
  vrishchika: { en: "Vrishchika", te: "వృశ్చిక", hi: "वृश्चिक", ml: "വൃശ്ചിക", kn: "ವೃಶ್ಚಿಕ", ta: "விருச்சிக" },
  dhanu: { en: "Dhanu", te: "ధను", hi: "धनु", ml: "ധനു", kn: "ಧನು", ta: "தனு" },
  makara: { en: "Makara", te: "మకర", hi: "मकर", ml: "മകര", kn: "ಮಕರ", ta: "மகர" },
  kumbha: { en: "Kumbha", te: "కుంభ", hi: "कुंभ", ml: "കുംഭ", kn: "ಕುಂಭ", ta: "கும்ப" },
  meena: { en: "Meena", te: "మీన", hi: "मीन", ml: "മീന", kn: "ಮೀನ", ta: "மீன" },
};

// Rashi list for dropdown/grid selection
export const RASHIS = [
  { id: 'mesha', name: 'Mesha', icon: '🐏' },
  { id: 'vrishabha', name: 'Vrishabha', icon: '🐂' },
  { id: 'mithuna', name: 'Mithuna', icon: '👥' },
  { id: 'karka', name: 'Karka', icon: '🦀' },
  { id: 'simha', name: 'Simha', icon: '🦁' },
  { id: 'kanya', name: 'Kanya', icon: '👩' },
  { id: 'tula', name: 'Tula', icon: '⚖️' },
  { id: 'vrishchika', name: 'Vrishchika', icon: '🦂' },
  { id: 'dhanu', name: 'Dhanu', icon: '🏹' },
  { id: 'makara', name: 'Makara', icon: '🐐' },
  { id: 'kumbha', name: 'Kumbha', icon: '🏺' },
  { id: 'meena', name: 'Meena', icon: '🐟' },
];

// Rashi icons for SVG display (kept for backward compatibility)
export const RASHI_ICONS = {
  mesha: '🐏',
  vrishabha: '🐂',
  mithuna: '👥',
  karka: '🦀',
  simha: '🦁',
  kanya: '👩',
  tula: '⚖️',
  vrishchika: '🦂',
  dhanu: '🏹',
  makara: '🐐',
  kumbha: '🏺',
  meena: '🐟',
};

// Daily, weekly, monthly, yearly rashiphalalu data for each rashi
export const RASHIPHALALU_DATA = {
  mesha: {
    daily: {
      text: [
        "Today brings new opportunities. Your leadership qualities will help you succeed.",
        "A favorable day for starting new projects. Your energy is high.",
        "Financial gains are indicated. Trust your instincts today.",
        "Family time will bring happiness. Resolve conflicts peacefully.",
        "Your communication skills will shine today.",
        "A good day for travel. New experiences await you.",
        "Career advancements are on the horizon. Stay focused.",
        "Health improves. Maintain your workout routine.",
        "Social gatherings will be beneficial. Network wisely.",
        "Your creativity peaks today. Express yourself boldly."
      ],
      colors: ["Red", "Orange", "Maroon"],
      stats: { health: 85, wealth: 80, family: 75, love: 78, career: 82 }
    },
    weekly: {
      text: [
        "This week favors new beginnings. Take initiative in all matters.",
        "Career growth is highlighted. Professional opportunities arise.",
        "Financial stability improves. Focus on savings and investments.",
        "Family bonds strengthen. Spend quality time together.",
        "Romance flourishes. Express love openly.",
        "Health needs attention. Maintain balanced diet.",
        "Social life becomes active. New connections form.",
        "This week brings overall progress and success."
      ],
      colors: ["Red", "Orange"],
      stats: { health: 82, wealth: 84, family: 80, love: 83, career: 86 }
    },
    monthly: {
      text: [
        "This month brings transformation. Embrace changes positively.",
        "Major career shifts are possible. Stay prepared.",
        "Financial situation improves significantly.",
        "Family harmony increases. Home improvements likely.",
        "Romantic relationships deepen. Committed partnerships form.",
        "Health improves with proper care. Exercise regularly.",
        "Travel brings luck. Consider short trips.",
        "This month overall is favorable for growth."
      ],
      colors: ["Red", "Orange", "Maroon"],
      stats: { health: 84, wealth: 88, family: 82, love: 85, career: 88 }
    },
    yearly: {
      text: "2026 is a year of significant growth for Mesha. Career advancements, financial gains, and relationship developments are highlighted. Embrace new opportunities and stay focused on your goals.",
      colors: ["Red", "Orange", "Maroon"],
      stats: { health: 86, wealth: 90, family: 84, love: 86, career: 90 }
    }
  },
  dhanu: {
    daily: {
      text: [
        "Your optimism will guide you to success today. New adventures await.",
        "Learning new skills will be fruitful. Embrace knowledge.",
        "Financial opportunities arise through unexpected sources.",
        "Travel brings unexpected luck and new connections.",
        "Your philosophical nature helps solve complex problems.",
        "Career opportunities for growth and advancement appear.",
        "Social interactions bring joy and new friendships.",
        "Health remains stable. Maintain your adventurous spirit.",
        "Romantic relationships deepen with understanding.",
        "Creative pursuits bring recognition and praise."
      ],
      colors: ["Orange", "Yellow", "Gold"],
      stats: { health: 82, wealth: 78, family: 80, love: 84, career: 80 }
    },
    weekly: {
      text: [
        "This week favors exploration and new experiences.",
        "Learning opportunities abound. Stay curious.",
        "Financial gains through knowledge-based work.",
        "Travel plans may materialize successfully.",
        "Career growth through teaching or consulting.",
        "Social gatherings bring joy and connections.",
        "Romance flourishes with shared adventures.",
        "This week brings overall optimism and growth."
      ],
      colors: ["Orange", "Yellow"],
      stats: { health: 84, wealth: 82, family: 82, love: 86, career: 84 }
    },
    monthly: {
      text: [
        "This month expands your horizons significantly.",
        "Higher education or spiritual pursuits are favored.",
        "Career advancements through knowledge and wisdom.",
        "Financial improvements through diverse sources.",
        "Long-distance travel brings luck and opportunities.",
        "Philosophy and spirituality deepen understanding.",
        "Romantic relationships become more meaningful.",
        "This month overall is highly favorable for Dhanu."
      ],
      colors: ["Orange", "Yellow", "Gold"],
      stats: { health: 86, wealth: 86, family: 84, love: 88, career: 88 }
    },
    yearly: {
      text: "2026 is a year of expansion and wisdom for Dhanu. Travel, learning, and spiritual growth are emphasized. Your optimistic nature will lead you to success in all endeavors.",
      colors: ["Orange", "Yellow", "Gold"],
      stats: { health: 88, wealth: 90, family: 86, love: 90, career: 90 }
    }
  },
  vrishabha: {
    daily: {
      text: [
        "Your persistence pays off today. Stay determined.",
        "Financial stability is highlighted. Good day for investments.",
        "Comfort and luxury are favored. Enjoy life's pleasures.",
        "Family bonds strengthen through shared meals and time.",
        "Health improves with proper rest and nutrition.",
        "Career progress through steady efforts.",
        "Romantic relationships deepen with commitment.",
        "Artistic pursuits bring joy and recognition.",
        "Property-related matters are favorable.",
        "Your patience leads to success in long-term goals."
      ],
      colors: ["Green", "Earth", "Brown"],
      stats: { health: 84, wealth: 88, family: 82, love: 80, career: 78 }
    },
    weekly: {
      text: [
        "This week emphasizes stability and security.",
        "Financial planning brings long-term benefits.",
        "Family harmony increases significantly.",
        "Career steady with gradual progress.",
        "Romantic relationships deepen.",
        "This week brings overall groundedness."
      ],
      colors: ["Green", "Earth"],
      stats: { health: 86, wealth: 90, family: 84, love: 82, career: 80 }
    },
    monthly: {
      text: [
        "This month brings financial growth and stability.",
        "Property and asset acquisitions are favored.",
        "Family life becomes more harmonious.",
        "Career advances through perseverance.",
        "Romantic relationships mature beautifully.",
        "This month overall brings security and prosperity."
      ],
      colors: ["Green", "Earth", "Brown"],
      stats: { health: 88, wealth: 92, family: 86, love: 84, career: 82 }
    },
    yearly: {
      text: "2026 brings stability and prosperity for Vrishabha. Financial growth, family harmony, and career advancement are highlighted.",
      colors: ["Green", "Earth", "Brown"],
      stats: { health: 88, wealth: 94, family: 88, love: 86, career: 84 }
    }
  },
  mithuna: {
    daily: {
      text: [
        "Communication is key today. Express yourself clearly.",
        "New connections form easily. Network wisely.",
        "Learning new skills will be effortless today.",
        "Mental agility helps solve complex problems.",
        "Short travels bring unexpected opportunities.",
        "Your wit and charm win people over.",
        "Financial gains through multiple sources.",
        "Health remains good with mental stimulation.",
        "Romantic relationships have playful moments.",
        "Avoid spreading yourself too thin today."
      ],
      colors: ["Yellow", "Light Green", "Grey"],
      stats: { health: 80, wealth: 78, family: 76, love: 82, career: 84 }
    },
    weekly: {
      text: [
        "This week favors communication and networking.",
        "Learning and intellectual growth are highlighted.",
        "Multiple income sources may emerge.",
        "Social life becomes vibrant and busy.",
        "Travel and exploration bring joy.",
        "This week is intellectually stimulating."
      ],
      colors: ["Yellow", "Grey"],
      stats: { health: 82, wealth: 80, family: 78, love: 84, career: 86 }
    },
    monthly: {
      text: [
        "This month expands your mental horizons.",
        "Career through communication and media.",
        "Financial gains through diverse channels.",
        "Learning new skills or languages favored.",
        "Social circle expands significantly.",
        "Romance has playful and exciting moments.",
        "This month is intellectually vibrant."
      ],
      colors: ["Yellow", "Light Green", "Grey"],
      stats: { health: 84, wealth: 84, family: 80, love: 86, career: 88 }
    },
    yearly: {
      text: "2026 brings intellectual growth and communication success for Mithuna. Networking, learning, and social connections are emphasized.",
      colors: ["Yellow", "Light Green", "Grey"],
      stats: { health: 84, wealth: 86, family: 82, love: 88, career: 90 }
    }
  },
  karka: {
    daily: {
      text: [
        "Family time brings emotional fulfillment today.",
        "Your intuition is strong. Trust your feelings.",
        "Nurturing others brings joy and satisfaction.",
        "Home-related matters are favored today.",
        "Emotional intelligence helps in all dealings.",
        "Health needs attention to digestive system.",
        "Career advances through supportive relationships.",
        "Romantic relationships have deep emotional connection.",
        "Your creativity flows naturally today.",
        "Past memories bring nostalgia and wisdom."
      ],
      colors: ["Silver", "White", "Pale Blue"],
      stats: { health: 78, wealth: 76, family: 88, love: 86, career: 74 }
    },
    weekly: {
      text: [
        "This week focuses on family and emotional well-being.",
        "Home improvements or moves may occur.",
        "Career through nurturing and caring roles.",
        "Family bonds strengthen significantly.",
        "Romance has deep emotional connection.",
        "This week is emotionally fulfilling."
      ],
      colors: ["Silver", "White"],
      stats: { health: 80, wealth: 78, family: 90, love: 88, career: 76 }
    },
    monthly: {
      text: [
        "This month deepens family connections.",
        "Real estate or home matters are prominent.",
        "Emotional intelligence reaches new heights.",
        "Career in nurturing or caring professions.",
        "Romantic relationships become more committed.",
        "This month is emotionally rich and fulfilling."
      ],
      colors: ["Silver", "White", "Pale Blue"],
      stats: { health: 82, wealth: 80, family: 92, love: 90, career: 78 }
    },
    yearly: {
      text: "2026 brings emotional growth and family harmony for Karka. Home, family, and emotional wellness are the main themes.",
      colors: ["Silver", "White", "Pale Blue"],
      stats: { health: 84, wealth: 82, family: 94, love: 92, career: 80 }
    }
  },
  simha: {
    daily: {
      text: [
        "Your leadership qualities shine today naturally.",
        "Recognition and praise come your way.",
        "Creative expression brings joy and success.",
        "Self-confidence is at its peak today.",
        "Career advancements through bold actions.",
        "Romantic relationships have passionate moments.",
        "Health improves with exercise and confidence.",
        "Your generosity inspires others today.",
        "Authority and power are favored today.",
        "Avoid ego conflicts. Stay humble."
      ],
      colors: ["Gold", "Orange", "Yellow"],
      stats: { health: 86, wealth: 82, family: 78, love: 84, career: 88 }
    },
    weekly: {
      text: [
        "This week highlights leadership and creativity.",
        "Career recognition and advancement likely.",
        "Romance has passionate and exciting moments.",
        "Creative projects flourish.",
        "This week brings glory and success."
      ],
      colors: ["Gold", "Orange"],
      stats: { health: 88, wealth: 84, family: 80, love: 86, career: 90 }
    },
    monthly: {
      text: [
        "This month brings fame and recognition.",
        "Career reaches new heights of success.",
        "Creative pursuits bring major achievements.",
        "Romantic relationships are passionate.",
        "Leadership roles may be offered.",
        "This month is glorious and successful."
      ],
      colors: ["Gold", "Orange", "Yellow"],
      stats: { health: 90, wealth: 88, family: 82, love: 88, career: 94 }
    },
    yearly: {
      text: "2026 is a year of glory and achievement for Simha. Career success, recognition, and creative accomplishments are highlighted.",
      colors: ["Gold", "Orange", "Yellow"],
      stats: { health: 90, wealth: 90, family: 84, love: 90, career: 96 }
    }
  },
  kanya: {
    daily: {
      text: [
        "Analytical skills help solve problems today.",
        "Attention to detail leads to success.",
        "Health needs proper diet and hygiene.",
        "Career through service and analysis.",
        "Family matters need your organized approach.",
        "Romantic relationships have meaningful moments.",
        "Intellectual pursuits bring satisfaction.",
        "Practical solutions emerge for complex issues.",
        "Avoid criticism. Be constructive.",
        "Your precision is valued today."
      ],
      colors: ["Green", "Earth", "White"],
      stats: { health: 76, wealth: 78, family: 80, love: 74, career: 82 }
    },
    weekly: {
      text: [
        "This week emphasizes organization and analysis.",
        "Health improvements through routine.",
        "Career through service and helping others.",
        "Family harmony through organization.",
        "Romance develops slowly but surely.",
        "This week is productive and practical."
      ],
      colors: ["Green", "Earth"],
      stats: { health: 78, wealth: 80, family: 82, love: 76, career: 84 }
    },
    monthly: {
      text: [
        "This month improves health and work efficiency.",
        "Career advancements through expertise.",
        "Financial planning brings stability.",
        "Family life becomes more organized.",
        "Romantic relationships mature beautifully.",
        "This month is efficient and productive."
      ],
      colors: ["Green", "Earth", "White"],
      stats: { health: 82, wealth: 84, family: 84, love: 78, career: 86 }
    },
    yearly: {
      text: "2026 brings efficiency and improvement for Kanya. Health, career, and practical matters are emphasized.",
      colors: ["Green", "Earth", "White"],
      stats: { health: 84, wealth: 86, family: 86, love: 80, career: 88 }
    }
  },
  tula: {
    daily: {
      text: [
        "Balance and harmony are key today.",
        "Partnerships and relationships are favored.",
        "Your diplomatic skills help resolve conflicts.",
        "Artistic pursuits bring joy and appreciation.",
        "Financial decisions need careful consideration.",
        "Career in partnership or artistic fields.",
        "Romantic relationships have romantic moments.",
        "Social gatherings bring joy and connections.",
        "Avoid extremes. Seek balance in all things.",
        "Your charm and grace attract positive attention."
      ],
      colors: ["Pink", "Light Blue", "Green"],
      stats: { health: 80, wealth: 78, family: 82, love: 88, career: 80 }
    },
    weekly: {
      text: [
        "This week emphasizes balance and harmony.",
        "Partnerships and relationships are highlighted.",
        "Career in artistic or diplomatic fields.",
        "Financial stability through partnerships.",
        "Romance flourishes beautifully.",
        "This week is romantic and harmonious."
      ],
      colors: ["Pink", "Light Blue"],
      stats: { health: 82, wealth: 80, family: 84, love: 90, career: 82 }
    },
    monthly: {
      text: [
        "This month brings harmony in all areas.",
        "Partnerships bring success and happiness.",
        "Career through balance and diplomacy.",
        "Financial gains through legal or partnership matters.",
        "Romantic relationships reach new milestones.",
        "This month is romantic and successful."
      ],
      colors: ["Pink", "Light Blue", "Green"],
      stats: { health: 84, wealth: 84, family: 86, love: 92, career: 84 }
    },
    yearly: {
      text: "2026 is a year of relationships and harmony for Tula. Partnerships, artistic pursuits, and balance are emphasized.",
      colors: ["Pink", "Light Blue", "Green"],
      stats: { health: 86, wealth: 86, family: 88, love: 94, career: 86 }
    }
  },
  vrishchika: {
    daily: {
      text: [
        "Your intuition and depth are powerful today.",
        "Transformation and renewal are in the air.",
        "Financial gains through research or investigation.",
        "Career in research, psychology, or transformation.",
        "Romantic relationships have intense connections.",
        "Health needs attention to reproductive system.",
        "Your mysterious charm attracts attention.",
        "Avoid jealousy and possessiveness today.",
        "Deep conversations bring understanding.",
        "Your resilience helps overcome challenges."
      ],
      colors: ["Dark Red", "Brown", "Black"],
      stats: { health: 78, wealth: 82, family: 76, love: 86, career: 80 }
    },
    weekly: {
      text: [
        "This week emphasizes transformation and depth.",
        "Financial gains through research or investigation.",
        "Career in transformative fields.",
        "Romantic relationships deepen significantly.",
        "This week is transformative and powerful."
      ],
      colors: ["Dark Red", "Brown"],
      stats: { health: 80, wealth: 84, family: 78, love: 88, career: 82 }
    },
    monthly: {
      text: [
        "This month brings major transformations.",
        "Financial gains through transformative ventures.",
        "Career breakthroughs through persistence.",
        "Romantic relationships become deeply committed.",
        "This month is transformative and powerful."
      ],
      colors: ["Dark Red", "Brown", "Black"],
      stats: { health: 82, wealth: 88, family: 80, love: 90, career: 84 }
    },
    yearly: {
      text: "2026 is a year of transformation and power for Vrishchika. Deep changes, financial gains, and transformative experiences are highlighted.",
      colors: ["Dark Red", "Brown", "Black"],
      stats: { health: 84, wealth: 90, family: 82, love: 92, career: 86 }
    }
  },
  makara: {
    daily: {
      text: [
        "Discipline and structure bring success today.",
        "Career advancements through hard work.",
        "Financial stability through careful planning.",
        "Family responsibilities need attention.",
        "Health improves with proper routine.",
        "Your perseverance pays off handsomely.",
        "Romantic relationships have steady growth.",
        "Authority and recognition come your way.",
        "Avoid being too rigid. Stay flexible.",
        "Long-term planning yields great results."
      ],
      colors: ["Brown", "Dark Green", "Grey"],
      stats: { health: 82, wealth: 86, family: 80, love: 76, career: 88 }
    },
    weekly: {
      text: [
        "This week emphasizes discipline and hard work.",
        "Career recognition and advancement likely.",
        "Financial stability through careful planning.",
        "Family responsibilities are fulfilled.",
        "Romance grows steadily and surely.",
        "This week is productive and successful."
      ],
      colors: ["Brown", "Dark Green"],
      stats: { health: 84, wealth: 88, family: 82, love: 78, career: 90 }
    },
    monthly: {
      text: [
        "This month brings career advancement.",
        "Financial stability and growth are indicated.",
        "Family life becomes more harmonious.",
        "Romantic relationships develop commitment.",
        "This month is successful and rewarding."
      ],
      colors: ["Brown", "Dark Green", "Grey"],
      stats: { health: 86, wealth: 92, family: 84, love: 80, career: 94 }
    },
    yearly: {
      text: "2026 is a year of achievement and recognition for Makara. Career success, financial stability, and family harmony are emphasized.",
      colors: ["Brown", "Dark Green", "Grey"],
      stats: { health: 88, wealth: 94, family: 86, love: 82, career: 96 }
    }
  },
  kumbha: {
    daily: {
      text: [
        "Innovation and originality lead to success today.",
        "Friends and groups bring unexpected opportunities.",
        "Your humanitarian side shines brightly.",
        "Career in technology, science, or social causes.",
        "Financial gains through innovative ideas.",
        "Health needs attention to circulatory system.",
        "Romantic relationships have intellectual connection.",
        "Your eccentricity attracts admiration.",
        "Avoid being too detached emotionally.",
        "Your vision helps others see the future."
      ],
      colors: ["Blue", "Purple", "Sky Blue"],
      stats: { health: 80, wealth: 82, family: 74, love: 78, career: 86 }
    },
    weekly: {
      text: [
        "This week emphasizes innovation and friendship.",
        "Career through technology and innovation.",
        "Financial gains through group projects.",
        "Social life becomes vibrant and exciting.",
        "Romance has intellectual and unique qualities.",
        "This week is innovative and social."
      ],
      colors: ["Blue", "Purple"],
      stats: { health: 82, wealth: 84, family: 76, love: 80, career: 88 }
    },
    monthly: {
      text: [
        "This month brings innovation and progress.",
        "Career breakthroughs through technology.",
        "Financial gains through innovative ventures.",
        "Social circle expands significantly.",
        "Romantic relationships are unique and exciting.",
        "This month is innovative and successful."
      ],
      colors: ["Blue", "Purple", "Sky Blue"],
      stats: { health: 84, wealth: 88, family: 78, love: 82, career: 90 }
    },
    yearly: {
      text: "2026 is a year of innovation and social connection for Kumbha. Technology, friendships, and humanitarian pursuits are emphasized.",
      colors: ["Blue", "Purple", "Sky Blue"],
      stats: { health: 86, wealth: 90, family: 80, love: 84, career: 92 }
    }
  },
  meena: {
    daily: {
      text: [
        "Spirituality and intuition guide you today.",
        "Your compassionate nature touches others deeply.",
        "Financial gains through spiritual or creative pursuits.",
        "Career in healing, art, or spiritual fields.",
        "Health improves through spiritual practices.",
        "Romantic relationships have dreamy quality.",
        "Your imagination runs wild creatively.",
        "Avoid escapism. Stay grounded.",
        "Meditation and reflection bring clarity.",
        "Your empathy helps others find peace."
      ],
      colors: ["Purple", "Light Blue", "White"],
      stats: { health: 80, wealth: 76, family: 82, love: 86, career: 74 }
    },
    weekly: {
      text: [
        "This week emphasizes spirituality and creativity.",
        "Financial gains through creative or spiritual work.",
        "Career in healing or artistic fields.",
        "Romance has dreamy and romantic qualities.",
        "This week is spiritual and creative."
      ],
      colors: ["Purple", "Light Blue"],
      stats: { health: 82, wealth: 78, family: 84, love: 88, career: 76 }
    },
    monthly: {
      text: [
        "This month deepens spiritual understanding.",
        "Creative pursuits bring recognition and success.",
        "Financial gains through artistic endeavors.",
        "Romantic relationships become more spiritual.",
        "This month is spiritual and fulfilling."
      ],
      colors: ["Purple", "Light Blue", "White"],
      stats: { health: 84, wealth: 80, family: 86, love: 90, career: 78 }
    },
    yearly: {
      text: "2026 is a year of spiritual growth and creativity for Meena. Inner peace, artistic pursuits, and spiritual development are emphasized.",
      colors: ["Purple", "Light Blue", "White"],
      stats: { health: 86, wealth: 82, family: 88, love: 92, career: 80 }
    }
  }
};

// Get the appropriate text based on date (rotates through the array)
export const getRashiText = (rashiId, type, date = new Date()) => {
  const rashi = RASHIPHALALU_DATA[rashiId];
  if (!rashi) return "";
  
  const data = rashi[type];
  if (!data) return "";
  
  const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
  const weekOfYear = Math.floor(dayOfYear / 7);
  const monthOfYear = date.getMonth();
  
  let index;
  switch (type) {
    case 'daily':
      index = dayOfYear % data.text.length;
      break;
    case 'weekly':
      index = weekOfYear % data.text.length;
      break;
    case 'monthly':
      index = monthOfYear % data.text.length;
      break;
    default:
      index = 0;
  }
  
  return data.text[index];
};

// Get current rashi based on date (Moon sign calculation simplified)
export const getCurrentRashi = (date = new Date()) => {
  const month = date.getMonth();
  
  // Simplified Moon sign calculation based on typical transit dates
  const rashiOrder = [
    'mesha',      // Aries - ~Apr 15 - May 15
    'vrishabha',  // Taurus - May 15 - Jun 15
    'mithuna',    // Gemini - Jun 15 - Jul 15
    'karka',      // Cancer - Jul 15 - Aug 15
    'simha',      // Leo - Aug 15 - Sep 15
    'kanya',      // Virgo - Sep 15 - Oct 15
    'tula',       // Libra - Oct 15 - Nov 15
    'vrishchika', // Scorpio - Nov 15 - Dec 15
    'dhanu',      // Sagittarius - Dec 15 - Jan 15
    'makara',     // Capricorn - Jan 15 - Feb 15
    'kumbha',     // Aquarius - Feb 15 - Mar 15
    'meena',      // Pisces - Mar 15 - Apr 15
  ];
  
  // Simplified offset based on typical dates
  const offsets = [3, 4, 5, 6, 7, 8, 9, 10, 11, 0, 1, 2];
  const rashiIndex = offsets[month];
  
  return rashiOrder[rashiIndex];
};

export default RASHIPHALALU_DATA;
