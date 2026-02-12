// Rashiphalalu data file

export const RASHIS = [
  { id: 'mesha', name: 'Mesha', icon: '🐏' },        // Ram for Aries
  { id: 'vrishabha', name: 'Vrishabha', icon: '🐂' },  // Bull for Taurus
  { id: 'mithuna', name: 'Mithuna', icon: '👯' },    // Twins for Gemini
  { id: 'karka', name: 'Karka', icon: '🦀' },        // Crab for Cancer
  { id: 'simha', name: 'Simha', icon: '🦁' },        // Lion for Leo
  { id: 'kanya', name: 'Kanya', icon: '👧' },        // Maiden for Virgo
  { id: 'tula', name: 'Tula', icon: '⚖️' },          // Scales for Libra
  { id: 'vrishchika', name: 'Vrishchika', icon: '🦂' }, // Scorpion for Scorpio
  { id: 'dhanu', name: 'Dhanu', icon: '🏹' },        // Bow and Arrow for Sagittarius
  { id: 'makara', name: 'Makara', icon: '🐐' },      // Goat for Capricorn
  { id: 'kumbha', name: 'Kumbha', icon: '🏺' },      // Water Bearer/Pot for Aquarius
  { id: 'meena', name: 'Meena', icon: '🐟' }         // Fish for Pisces
];

export const RASHI_NAMES = {
  mesha: {
    en: 'Aries',
    te: 'మేషం',
    hi: 'मेष',
    ml: 'മേശം',
    kn: 'ಮೇಷ',
    ta: 'மேஷம்'
  },
  vrishabha: {
    en: 'Taurus',
    te: 'వృషభం',
    hi: 'वृषभ',
    ml: 'വൃഷഭം',
    kn: 'ವೃಷಭ',
    ta: 'ரிஷபம்'
  },
  mithuna: {
    en: 'Gemini',
    te: 'మిధునం',
    hi: 'मिथुन',
    ml: 'മിഥുനം',
    kn: 'ಮಿಥುನ',
    ta: 'மிதுனம்'
  },
  karka: {
    en: 'Cancer',
    te: 'కర్కాటకం',
    hi: 'कर्क',
    ml: 'കര്ക്കടകം',
    kn: 'ಕರ್ಕಾಟಕ',
    ta: 'கடகம்'
  },
  simha: {
    en: 'Leo',
    te: 'సింహం',
    hi: 'सिंह',
    ml: 'സിംഹം',
    kn: 'ಸಿಂಹ',
    ta: 'சிம்மம்'
  },
  kanya: {
    en: 'Virgo',
    te: 'కన్యా',
    hi: 'कन्या',
    ml: 'കന്യ',
    kn: 'ಕನ್ಯಾ',
    ta: 'கன்னி'
  },
  tula: {
    en: 'Libra',
    te: 'తులా',
    hi: 'तुला',
    ml: 'തുല',
    kn: 'ತುಳಾ',
    ta: 'துலாம்'
  },
  vrishchika: {
    en: 'Scorpio',
    te: 'వృశ్చికం',
    hi: 'वृश्चिक',
    ml: 'വൃശ്ചികം',
    kn: 'ವೃಶ್ಚಿಕ',
    ta: 'விருச்சிகம்'
  },
  dhanu: {
    en: 'Sagittarius',
    te: 'ధనస్సు',
    hi: 'धनु',
    ml: 'ധനു',
    kn: 'ಧನು',
    ta: 'தனுசு'
  },
  makara: {
    en: 'Capricorn',
    te: 'మకరం',
    hi: 'मकर',
    ml: 'മകരം',
    kn: 'ಮಕರ',
    ta: 'மகரம்'
  },
  kumbha: {
    en: 'Aquarius',
    te: 'కుంభం',
    hi: 'कुंभ',
    ml: 'കുംഭം',
    kn: 'ಕುಂಭ',
    ta: 'கும்பம்'
  },
  meena: {
    en: 'Pisces',
    te: 'మీనం',
    hi: 'मीन',
    ml: 'മീനം',
    kn: 'ಮೀನ',
    ta: 'மீனம்'
  }
};

// Current rashi calculation based on date
export const getCurrentRashi = (date) => {
  const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
  const rashiIndex = Math.floor((dayOfYear % 360) / 30);
  return RASHIS[rashiIndex].id;
};

// Daily horoscope statements for each rashi (15 statements that rotate)
const DAILY_STATEMENTS = {
  mesha: {
    en: [
      "Today brings fresh energy and enthusiasm to Aries natives. Your proactive approach will lead to success.",
      "Your leadership qualities shine bright today. Take initiative in important matters.",
      "Financial gains are indicated. Small investments may yield good returns.",
      "Family relationships strengthen. Mutual understanding grows.",
      "Friends offer valuable support. Their advice will benefit you.",
      "New opportunities emerge at work. Time to showcase your talents.",
      "Business expansion is favorable. Implement new ideas confidently.",
      "Health remains excellent. Physical vitality continues strong.",
      "Travels prove fruitful. Journeys bring beneficial outcomes.",
      "Students achieve good results. Focus in studies increases.",
      "Avoid conflicts. Peaceful behavior reduces problems.",
      "Self-confidence grows. Trust in your decisions strengthens.",
      "Old bonds become stronger. Reunion with old friends happens.",
      "Savings increase. Plans for the future take shape.",
      "Good news arrives. Day ends on a positive note."
    ],
    te: [
      "ఈ రోజు మేష రాశివారికి కొత్త ఉత్సాహం మరియు శక్తి వస్తాయి. మీ ముందడుగు ధోరణి విజయానికి దారి తీస్తుంది.",
      "ఈ రోజు మీ నాయకత్వ లక్షణాలు ప్రకాశిస్తాయి. ముఖ్యమైన విషయాల్లో ముందడుగు వేయండి.",
      "ఆర్థిక లాభ సూచనలు ఉన్నాయి. చిన్న పెట్టుబడులు మంచి ఫలితం ఇవ్వొచ్చు.",
      "కుటుంబ సంబంధాలు బలపడతాయి. పరస్పర అవగాహన పెరుగుతుంది.",
      "మిత్రులు విలువైన మద్దతు ఇస్తారు. వారి సలహా మీకు లాభం చేస్తుంది.",
      "పనిలో కొత్త అవకాశాలు వస్తాయి. మీ ప్రతిభ చూపించే సమయం ఇది.",
      "వ్యాపార విస్తరణకు అనుకూలం. కొత్త ఆలోచనలను ధైర్యంగా అమలు చేయండి.",
      "ఆరోగ్యం చక్కగా ఉంటుంది. శారీరక శక్తి స్థిరంగా ఉంటుంది.",
      "ప్రయాణాలు ఫలప్రదం అవుతాయి. ప్రయాణాల వల్ల మంచి ఫలితాలు వస్తాయి.",
      "విద్యార్థులకు మంచి ఫలితాలు వస్తాయి. చదువుపై ఏకాగ్రత పెరుగుతుంది.",
      "వివాదాలను నివారించండి. శాంతపూర్వక ప్రవర్తన సమస్యలను తగ్గిస్తుంది.",
      "ఆత్మవిశ్వాసం పెరుగుతుంది. మీ నిర్ణయాలపై నమ్మకం బలపడుతుంది.",
      "పాత సంబంధాలు బలపడతాయి. పాత మిత్రులతో మళ్లీ కలుసుకునే అవకాశం ఉంటుంది.",
      "పొదుపు పెరుగుతుంది. భవిష్యత్తు ప్రణాళికలు రూపుదిద్దుకుంటాయి.",
      "సుభవార్త వస్తుంది. రోజు సానుకూలంగా ముగుస్తుంది."
    ]
  },
  vrishabha: {
    en: [
      "Today Taurus natives experience stability and peace. Your patience pays off well.",
      "Work progresses smoothly. Steady efforts show results.",
      "Financial stability improves. Income sources expand gradually.",
      "Family harmony prevails. Loving atmosphere at home.",
      "Social connections strengthen. New friendships form.",
      "Career advancement is possible. Recognition for your work comes.",
      "Business deals finalize successfully. Profitable ventures ahead.",
      "Health stays robust. Energy levels remain high.",
      "Short trips are beneficial. Local travels bring gains.",
      "Academic achievements are likely. Learning becomes enjoyable.",
      "Disputes get resolved. Calm approach works best.",
      "Inner strength increases. Determination becomes unwavering.",
      "Relationships deepen. Emotional bonds grow stronger.",
      "Financial planning improves. Security for future assured.",
      "Pleasant surprises await. Day brings contentment."
    ],
    te: [
      "ఈ రోజు వృషభ రాశివారికి స్థిరత్వం, ప్రశాంతత అనుభవంలోకి వస్తాయి. మీ సహనం మంచి ఫలితం ఇస్తుంది.",
      "పని సాఫీగా ముందుకు సాగుతుంది. స్థిరమైన ప్రయత్నాలు ఫలితాలను ఇస్తాయి.",
      "ఆర్థిక స్థిరత్వం మెరుగుపడుతుంది. ఆదాయ మార్గాలు క్రమంగా పెరుగుతాయి.",
      "కుటుంబంలో సౌహార్దం ఉంటుంది. ఇంట్లో ఆప్యాయ వాతావరణం ఉంటుంది.",
      "సామాజిక సంబంధాలు బలపడతాయి. కొత్త స్నేహాలు ఏర్పడుతాయి.",
      "వృత్తిలో పురోగతి సాధ్యమవుతుంది. మీ పనికి గుర్తింపు వస్తుంది.",
      "వ్యాపార ఒప్పందాలు విజయవంతంగా పూర్తవుతాయి. లాభదాయక అవకాశాలు ముందుంటాయి.",
      "ఆరోగ్యం బలంగా ఉంటుంది. శక్తి స్థాయి ఎక్కువగా ఉంటుంది.",
      "చిన్న ప్రయాణాలు లాభదాయకం. స్థానిక ప్రయాణాలు ప్రయోజనం ఇస్తాయి.",
      "విద్యలో విజయాలు సాధ్యమవుతాయి. నేర్చుకోవడం ఆనందకరంగా ఉంటుంది.",
      "వివాదాలు పరిష్కారమవుతాయి. ప్రశాంతమైన దృక్పథం ఉత్తమం.",
      "అంతర్గత బలం పెరుగుతుంది. సంకల్పం దృఢమవుతుంది.",
      "సంబంధాలు గాఢమవుతాయి. భావోద్వేగ బంధాలు బలపడతాయి.",
      "ఆర్థిక ప్రణాళిక మెరుగవుతుంది. భవిష్య భద్రత బలపడుతుంది.",
      "సంతోషకర ఆశ్చర్యాలు ఎదురవుతాయి. రోజు సంతృప్తిని ఇస్తుంది."
    ]
  },
  mithuna: {
    en: [
      "Today Gemini natives feel mentally sharp and communicative. Ideas flow freely.",
      "Creative projects flourish. Your versatility impresses others.",
      "Money matters look promising. Multiple income opportunities arise.",
      "Home life becomes harmonious. Understanding family members support you.",
      "Networking brings advantages. Professional contacts prove helpful.",
      "Job opportunities knock. Your skills get recognized widely.",
      "Business communications succeed. Negotiations favor you strongly.",
      "Physical wellness maintained. Mental alertness peaks today.",
      "Travel plans work out. Connections during journeys benefit you.",
      "Students excel in exams. Concentration power enhances significantly.",
      "Avoid arguments gracefully. Diplomacy solves all issues.",
      "Confidence level rises. Belief in abilities strengthens.",
      "Friendships revive beautifully. Past connections resurface.",
      "Saving habits develop. Future security gets prioritized.",
      "Positive developments occur. Day concludes successfully."
    ],
    te: [
      "ఈ రోజు మిథున రాశివారికి మానసిక చురుకుదనం, సంభాషణ సామర్థ్యం పెరుగుతుంది. ఆలోచనలు సులభంగా ప్రవహిస్తాయి.",
      "సృజనాత్మక పనులు వికసిస్తాయి. మీ బహుముఖ ప్రతిభ ఇతరులను ఆకట్టుకుంటుంది.",
      "ధన విషయాలు అనుకూలంగా ఉంటాయి. అనేక ఆదాయ అవకాశాలు వస్తాయి.",
      "ఇంటి జీవితం సౌహార్దంగా ఉంటుంది. కుటుంబ సభ్యుల సహకారం లభిస్తుంది.",
      "నెట్‌వర్కింగ్ లాభాన్ని ఇస్తుంది. వృత్తి సంబంధిత పరిచయాలు ఉపయోగపడతాయి.",
      "ఉద్యోగ అవకాశాలు వస్తాయి. మీ నైపుణ్యాలకు విస్తృత గుర్తింపు లభిస్తుంది.",
      "వ్యాపార కమ్యూనికేషన్ విజయవంతమవుతుంది. చర్చలు మీకు అనుకూలంగా ఉంటాయి.",
      "శారీరక ఆరోగ్యం నిలకడగా ఉంటుంది. మానసిక చురుకుదనం గరిష్టంగా ఉంటుంది.",
      "ప్రయాణ ప్రణాళికలు సఫలమవుతాయి. ప్రయాణాల్లో ఏర్పడే పరిచయాలు మేలు చేస్తాయి.",
      "విద్యార్థులు పరీక్షల్లో మెరుగ్గా నిలుస్తారు. ఏకాగ్రత శక్తి గణనీయంగా పెరుగుతుంది.",
      "వాదనలను సొగసుగా నివారించండి. రాజనీతీగా వ్యవహరించడం సమస్యలను పరిష్కరిస్తుంది.",
      "ఆత్మవిశ్వాసం పెరుగుతుంది. మీ సామర్థ్యాలపై నమ్మకం బలపడుతుంది.",
      "స్నేహాలు చక్కగా పునరుజ్జీవిస్తాయి. పాత పరిచయాలు మళ్లీ కలుగుతాయి.",
      "పొదుపు అలవాట్లు పెరుగుతాయి. భవిష్య భద్రతకు ప్రాధాన్యం ఇస్తారు.",
      "సానుకూల పరిణామాలు జరుగుతాయి. రోజు విజయవంతంగా ముగుస్తుంది."
    ]
  },
  karka: {
    en: [
      "Today Cancer natives feel emotionally balanced and nurturing. Intuition guides you well.",
      "Home-based activities prosper. Domestic happiness increases.",
      "Financial security strengthens. Wise investments pay dividends.",
      "Family bonds tighten. Caring gestures appreciated deeply.",
      "Close friends provide comfort. Their presence brings joy.",
      "Career stability assured. Long-term projects move forward.",
      "Business partnerships thrive. Collaborative efforts succeed.",
      "Health improves steadily. Emotional well-being enhances physical health.",
      "Visits to relatives planned. Family trips bring closeness.",
      "Academic focus sharpens. Memory retention becomes better.",
      "Conflicts diminish naturally. Compassionate attitude helps.",
      "Self-assurance builds. Trust in instincts grows.",
      "Old relationships mend. Forgiveness brings peace.",
      "Financial cushion grows. Emergency funds accumulate.",
      "Comforting news arrives. Day ends warmly."
    ],
    te: [
      "ఈ రోజు కర్కాటక రాశివారు భావోద్వేగంగా సమతుల్యంగా ఉంటారు, పరిరక్షణ భావం పెరుగుతుంది. అంతఃప్రజ్ఞ మీకు మార్గనిర్దేశం చేస్తుంది.",
      "ఇంటి సంబంధిత పనులు బాగా సాగుతాయి. గృహసుఖం పెరుగుతుంది.",
      "ఆర్థిక భద్రత బలపడుతుంది. వివేకమైన పెట్టుబడులు లాభాలు ఇస్తాయి.",
      "కుటుంబ బంధాలు గట్టిపడతాయి. మీ శ్రద్ధను కుటుంబం మన్నిస్తుంది.",
      "అతి సన్నిహిత మిత్రులు సాంత్వన ఇస్తారు. వారి సాన్నిధ్యం ఆనందాన్ని ఇస్తుంది.",
      "వృత్తి స్థిరత్వం ఉంటుంది. దీర్ఘకాల ప్రాజెక్టులు ముందుకు సాగుతాయి.",
      "వ్యాపార భాగస్వామ్యాలు వికసిస్తాయి. సహకార ప్రయత్నాలు విజయవంతమవుతాయి.",
      "ఆరోగ్యం క్రమంగా మెరుగుపడుతుంది. భావోద్వేగ శ్రేయస్సు శారీరక ఆరోగ్యాన్ని మెరుగుపరుస్తుంది.",
      "బంధువులను కలిసే యోచనలు ఉంటాయి. కుటుంబ ప్రయాణాలు సాన్నిహిత్యాన్ని పెంచుతాయి.",
      "చదువుపై దృష్టి పెరుగుతుంది. జ్ఞాపకశక్తి మెరుగవుతుంది.",
      "వివాదాలు సహజంగా తగ్గుతాయి. అనుకంపతో వ్యవహరించడం సహాయపడుతుంది.",
      "ఆత్మవిశ్వాసం పెరుగుతుంది. అంతఃప్రజ్ఞపై నమ్మకం బలపడుతుంది.",
      "పాత సంబంధాలు సరిదిద్దబడతాయి. క్షమాభావం శాంతిని ఇస్తుంది.",
      "ఆర్థిక నిల్వ పెరుగుతుంది. అత్యవసర నిధులు కూడగడతారు.",
      "ఆత్మస్థైర్యాన్నిచ్చే వార్తలు వస్తాయి. రోజు ఆత్మీయంగా ముగుస్తుంది."
    ]
  },
  simha: [
    "Today Leo natives radiate confidence and charisma. Natural leadership emerges strongly.",
    "Creative expressions succeed. Your talents receive applause.",
    "Financial prospects brighten. Lucrative opportunities present themselves.",
    "Family pride increases. Achievements make loved ones happy.",
    "Social status elevates. Respect from peers grows.",
    "Professional recognition comes. Promotions or rewards possible.",
    "Business ventures flourish. Bold decisions bring profits.",
    "Vitality remains high. Physical strength and stamina excellent.",
    "Exciting travels ahead. Adventures bring memorable experiences.",
    "Students shine academically. Competitive exams favor you.",
    "Ego clashes avoided. Humble approach wins hearts.",
    "Self-belief strengthens. Inner power becomes evident.",
    "Loyal friendships deepen. True companions stand by you.",
    "Wealth accumulation accelerates. Prosperity mindset develops.",
    "Celebratory moments occur. Day brings joy and pride."
  ],
  kanya: [
    "Today Virgo natives display analytical precision and practicality. Attention to detail impresses.",
    "Organizational skills shine. Efficiency at work increases.",
    "Financial management improves. Budgeting brings better results.",
    "Family health matters. Your care makes difference.",
    "Helpful nature appreciated. Service to others brings satisfaction.",
    "Work perfection recognized. Quality standards you set admired.",
    "Business systems optimize. Streamlined processes increase profits.",
    "Health consciousness pays. Dietary discipline shows benefits.",
    "Planned trips execute smoothly. Methodical travel preparations help.",
    "Study techniques improve. Systematic learning yields success.",
    "Critical nature softens. Acceptance brings peace.",
    "Self-improvement continues. Skill development progresses well.",
    "Practical friendships form. Reliable people enter life.",
    "Savings strategy works. Financial goals approach realization.",
    "Productive outcomes achieved. Day ends with accomplishment."
  ],
  tula: [
    "Today Libra natives seek harmony and balance. Diplomatic skills prove valuable.",
    "Partnerships strengthen beautifully. Cooperation brings mutual benefits.",
    "Financial balance achieved. Income and expenses align well.",
    "Family peace maintained. Fair treatment keeps everyone happy.",
    "Social grace shines. Pleasant interactions increase popularity.",
    "Career collaborations succeed. Teamwork yields excellent results.",
    "Business negotiations favorable. Win-win deals get finalized.",
    "Health equilibrium maintained. Mind-body balance feels good.",
    "Companionable travels planned. Journeys with partners enjoyable.",
    "Group study benefits. Learning with others proves effective.",
    "Disagreements mediated successfully. Peacemaking skills utilized.",
    "Inner harmony found. Confidence in choices develops.",
    "Relationships flourish romantically. Love life becomes sweeter.",
    "Financial partnerships work. Joint ventures prove profitable.",
    "Beautiful moments created. Day brings aesthetic pleasure."
  ],
  vrishchika: [
    "Today Scorpio natives feel intense and transformative. Deep insights emerge clearly.",
    "Investigative work succeeds. Hidden truths come to light.",
    "Financial windfalls possible. Unexpected gains surprise you.",
    "Family mysteries resolved. Deeper understanding of loved ones.",
    "Trusted allies support. Loyal friends prove invaluable.",
    "Career breakthroughs happen. Your determination overcomes obstacles.",
    "Business strategies work. Calculated risks pay off handsomely.",
    "Regenerative health practices. Healing processes accelerate naturally.",
    "Transformative journeys ahead. Travels change perspectives.",
    "Deep research pays. Thorough study brings mastery.",
    "Confrontations handled wisely. Strategic approach wins.",
    "Personal power realized. Inner strength becomes formidable.",
    "Profound connections form. Soul-level friendships develop.",
    "Resource management sharpens. Hidden assets discovered.",
    "Powerful revelations occur. Day brings significant insights."
  ],
  dhanu: [
    "Today Sagittarius natives display optimistic outlook. Clarity in thinking increases and courage to move forward builds.",
    "Work enthusiasm visible. Tasks started progress rapidly.",
    "Financial gains indicated. Small investments yield good results.",
    "Family time joyful. Mutual understanding grows stronger.",
    "Friend cooperation received. Their suggestions prove useful.",
    "Job opportunities emerge. Right time to showcase talents.",
    "Business expansion favorable. New ideas can be implemented.",
    "Health remains good. Physical enthusiasm continues strong.",
    "Travels become successful. Journeys bring profitable outcomes.",
    "Students see good results. Study concentration increases significantly.",
    "Conflicts should be avoided. Peaceful conduct reduces problems.",
    "Self-confidence increases. Trust in decisions strengthens.",
    "Old bonds strengthen. Reunion with old friends happens.",
    "Savings grow steadily. Future planning takes shape.",
    "Good news arrives. Day ends positively overall."
  ],
  makara: [
    "Today Capricorn natives display discipline and ambition. Hard work brings recognition.",
    "Career advancement likely. Professional goals come closer.",
    "Financial stability strengthens. Long-term investments mature.",
    "Family responsibilities managed. Your dedication appreciated.",
    "Mentor relationships valuable. Guidance from elders helps.",
    "Leadership roles assigned. Authority positions suit you.",
    "Business foundations solid. Sustainable growth continues.",
    "Health discipline maintained. Consistent routines pay off.",
    "Business travels productive. Professional trips bring contracts.",
    "Academic perseverance rewarded. Difficult subjects mastered.",
    "Patience resolves issues. Time-tested approach works.",
    "Self-discipline strengthens. Willpower becomes impressive.",
    "Respectful relationships form. Professional friendships develop.",
    "Wealth building continues. Assets accumulate steadily.",
    "Achievements recognized. Day brings professional satisfaction."
  ],
  kumbha: [
    "Today Aquarius natives think innovatively and independently. Original ideas impress others.",
    "Humanitarian projects succeed. Social causes advance well.",
    "Financial technology helps. Modern methods increase income.",
    "Family freedom respected. Individual space maintained.",
    "Friendship networks expand. Like-minded people gather.",
    "Career innovation rewarded. Unconventional approaches appreciated.",
    "Business modernization works. Technology adoption increases profits.",
    "Health awareness grows. Alternative therapies explored.",
    "Group travels planned. Social journeys bring connections.",
    "Collaborative learning effective. Study groups prove beneficial.",
    "Detachment helps conflicts. Objective view resolves issues.",
    "Unique identity embraced. Individuality becomes strength.",
    "Progressive friendships form. Future-oriented people connect.",
    "Investment diversity grows. Portfolio spreads wisely.",
    "Innovative breakthroughs occur. Day brings fresh perspectives."
  ],
  meena: [
    "Today Pisces natives feel intuitive and compassionate. Creative imagination flows freely.",
    "Artistic projects flourish. Your creativity inspires others.",
    "Financial intuition strong. Instincts guide good decisions.",
    "Family empathy deepens. Emotional support flows naturally.",
    "Spiritual friends connect. Soulful conversations nourish.",
    "Career creativity valued. Imaginative solutions appreciated.",
    "Business adaptability helps. Flexible approaches succeed.",
    "Holistic health improves. Mind-body-spirit integration happens.",
    "Spiritual travels beckoned. Pilgrimages or retreats planned.",
    "Intuitive learning effective. Abstract concepts understood easily.",
    "Forgiveness dissolves conflicts. Compassion heals wounds.",
    "Inner wisdom accessed. Trust in universal guidance.",
    "Empathetic bonds form. Understanding friendships deepen.",
    "Spiritual wealth grows. Material needs met effortlessly.",
    "Mystical experiences occur. Day brings transcendent moments."
  ]
};

// Weekly horoscope statements (7 statements that rotate per week)
const WEEKLY_STATEMENTS = {
  mesha: [
    "This week brings opportunities for Aries natives. Growth and expansion favor you significantly.",
    "Professional advancement is highlighted. Your efforts receive due recognition this week.",
    "Financial improvements are likely. Income sources multiply bringing prosperity.",
    "Family celebrations occur. Joyous occasions bring everyone together happily.",
    "Social connections expand. Networking opens new doors for success.",
    "Business deals materialize. Partnerships formed this week prove beneficial.",
    "Energy levels peak. Physical and mental vitality help achieve goals."
  ],
  vrishabha: [
    "This week Taurus natives experience steady progress. Patience brings rewarding outcomes.",
    "Work projects complete successfully. Quality efforts yield excellent results.",
    "Financial growth continues. Savings and investments show positive trends.",
    "Home improvements planned. Domestic comfort and beauty increase.",
    "Relationships deepen meaningfully. Trust and loyalty strengthen bonds.",
    "Career stability maintained. Long-term security looks promising.",
    "Health routines benefit. Consistent self-care shows visible improvements."
  ],
  mithuna: [
    "This week Gemini natives enjoy mental stimulation. Communication skills shine brightly.",
    "Multiple opportunities arise. Versatility helps you manage everything well.",
    "Income streams diversify. Financial flexibility improves significantly.",
    "Family interactions increase. Sharing ideas brings closer connections.",
    "Social activities flourish. Your charm attracts positive people.",
    "Career versatility valued. Adaptability opens new career paths.",
    "Learning accelerates rapidly. New skills acquired with ease."
  ],
  karka: [
    "This week Cancer natives feel emotionally secure. Home and family priorities align well.",
    "Nurturing activities succeed. Your care makes significant difference.",
    "Financial security strengthens. Wise decisions protect future interests.",
    "Family harmony prevails. Peaceful atmosphere brings contentment.",
    "Friendship circles expand. Caring people enter your life.",
    "Career stability assured. Emotional intelligence aids professional success.",
    "Health improves naturally. Self-care routines prove highly effective."
  ],
  simha: [
    "This week Leo natives command attention. Leadership opportunities multiply significantly.",
    "Creative projects succeed. Your artistic talents receive recognition.",
    "Financial opportunities abundant. Bold moves bring substantial gains.",
    "Family pride grows. Your achievements inspire loved ones.",
    "Social recognition increases. Respect and admiration come naturally.",
    "Career breakthroughs happen. Promotions or new positions offered.",
    "Confidence peaks high. Inner strength manifests in tangible success."
  ],
  kanya: [
    "This week Virgo natives excel through precision. Organizational skills bring rewards.",
    "Work efficiency increases. Systematic approach yields superior results.",
    "Financial planning succeeds. Budgets and strategies work perfectly.",
    "Family health improves. Your attentive care makes difference.",
    "Service brings satisfaction. Helping others brings deep fulfillment.",
    "Career perfectionism valued. High standards earn respect.",
    "Wellness routines effective. Healthy habits show clear benefits."
  ],
  tula: [
    "This week Libra natives create balance. Harmony in all areas increases.",
    "Partnerships flourish beautifully. Collaborations bring mutual success.",
    "Financial equilibrium achieved. Income and spending balance well.",
    "Family peace maintained. Diplomatic skills resolve all issues.",
    "Social life thrives. Pleasant interactions bring joy.",
    "Career teamwork succeeds. Cooperative efforts yield results.",
    "Relationships deepen romantically. Love life becomes more fulfilling."
  ],
  vrishchika: [
    "This week Scorpio natives experience transformation. Deep changes bring positive growth.",
    "Investigative skills shine. Hidden opportunities discovered successfully.",
    "Financial breakthroughs occur. Unexpected resources become available.",
    "Family understanding deepens. Emotional bonds strengthen significantly.",
    "Loyal allies emerge. Trustworthy people support your goals.",
    "Career intensity pays. Focused determination overcomes obstacles.",
    "Personal power increases. Inner strength becomes evident to all."
  ],
  dhanu: [
    "This week Sagittarius natives find favorable outcomes. Decisions made prove beneficial.",
    "Career progress visible. Growth opportunities multiply rapidly.",
    "Financial gains realized. Earnings increase and stabilize.",
    "Family joy experienced. Happy events bring celebration.",
    "Friendships strengthen meaningfully. Support systems prove reliable.",
    "Business expansion succeeds. New ventures show promise.",
    "Overall positivity prevails. Week unfolds advantageously for you."
  ],
  makara: [
    "This week Capricorn natives advance professionally. Hard work receives recognition.",
    "Career goals approached. Ambitions move closer to reality.",
    "Financial foundation solidifies. Long-term security strengthens.",
    "Family responsibilities fulfilled. Dedication earns appreciation.",
    "Mentorship opportunities arise. Wisdom shared benefits all.",
    "Leadership positions offered. Authority suits you naturally.",
    "Achievements accumulate steadily. Success becomes tangible and real."
  ],
  kumbha: [
    "This week Aquarius natives innovate successfully. Original thinking brings breakthroughs.",
    "Social causes advance. Humanitarian efforts show results.",
    "Financial innovation works. Modern approaches increase income.",
    "Family independence respected. Personal space maintained harmoniously.",
    "Friendships networks grow. Like-minded connections form.",
    "Career uniqueness valued. Unconventional methods appreciated.",
    "Progressive ideas manifest. Future-oriented plans take shape."
  ],
  meena: [
    "This week Pisces natives tap intuition. Creative inspiration flows abundantly.",
    "Artistic endeavors succeed. Imagination produces beautiful results.",
    "Financial instincts guide. Intuitive choices prove profitable.",
    "Family compassion deepens. Emotional support given and received.",
    "Spiritual connections form. Soulful relationships develop naturally.",
    "Career creativity valued. Imaginative solutions gain recognition.",
    "Holistic wellness improves. Mind-body-spirit integration happens."
  ]
};

// Monthly horoscope statements (12 statements that rotate per month)
const MONTHLY_STATEMENTS = {
  mesha: [
    "This month brings dynamic growth for Aries natives. Professional achievements and personal development align perfectly.",
    "Career advancement opportunities abound. Your leadership skills receive recognition leading to promotions or new responsibilities.",
    "Financial prosperity increases significantly. Multiple income sources and wise investments yield excellent returns throughout the month.",
    "Family relationships flourish beautifully. Harmony at home provides strong foundation for all other activities and achievements.",
    "Social status elevates noticeably. Your reputation grows and influential people take notice of your capabilities and character.",
    "Business ventures prove lucrative. New partnerships and expansion plans materialize bringing substantial profits and growth.",
    "Health and vitality remain strong. Physical energy and mental clarity support ambitious goals and busy schedule.",
    "Travel opportunities arise frequently. Journeys undertaken this month bring valuable connections and profitable business outcomes.",
    "Learning and skill development accelerate. Educational pursuits and training programs enhance your professional expertise significantly.",
    "Relationships deepen meaningfully. Both personal and professional connections grow stronger providing lasting support and joy.",
    "Creative projects succeed remarkably. Innovative ideas receive appreciation and practical implementation in your work.",
    "Month concludes with satisfaction. Goals achieved and progress made set positive tone for upcoming period."
  ],
  vrishabha: [
    "This month Taurus natives enjoy stability and gradual growth. Financial security and personal contentment increase steadily.",
    "Professional recognition comes naturally. Quality work and consistent efforts bring appreciation from superiors and colleagues alike.",
    "Income sources strengthen reliably. Salary increases or business profits provide enhanced financial comfort and security.",
    "Home life becomes harmonious. Family bonds deepen and domestic environment brings peace and happiness to all.",
    "Investments mature favorably. Long-term financial planning shows positive results encouraging continued wise money management.",
    "Career stability maintained well. Job security and professional reputation remain solid supporting future advancement opportunities.",
    "Health improves through discipline. Regular routines and healthy habits show visible benefits in physical appearance and energy.",
    "Relationships grow more meaningful. Loyalty and trust characterize interactions with loved ones and close friends.",
    "Practical projects complete successfully. Home improvements or work initiatives finish on time and within budget.",
    "Social connections expand gradually. Quality friendships form with people who share similar values and interests.",
    "Financial planning succeeds admirably. Budgets maintained and savings grow providing peace of mind and future security.",
    "Month ends with contentment. Steady progress and peaceful atmosphere create foundation for continued success."
  ],
  mithuna: [
    "This month Gemini natives experience intellectual stimulation and diverse opportunities. Communication skills open many doors.",
    "Multiple projects advance simultaneously. Your versatility and adaptability help manage various responsibilities successfully.",
    "Financial flexibility increases noticeably. Different income streams provide enhanced security and spending power.",
    "Family communication improves significantly. Open dialogue resolves misunderstandings and strengthens emotional bonds beautifully.",
    "Networking yields excellent results. Professional contacts made this month lead to valuable opportunities and collaborations.",
    "Career versatility proves advantageous. Ability to handle different tasks makes you invaluable to organization.",
    "Learning opportunities abound richly. New skills acquired quickly enhance both professional capabilities and personal interests.",
    "Travel plans work out perfectly. Journeys undertaken bring enjoyment and also serve practical professional purposes.",
    "Social life becomes vibrant. Interesting conversations and diverse social interactions keep life exciting and enriching.",
    "Creative expression flourishes freely. Writing, speaking, or artistic pursuits receive positive feedback and recognition.",
    "Mental agility increases remarkably. Quick thinking and problem-solving abilities help navigate challenges effectively.",
    "Month concludes with variety. Diverse experiences and achievements bring satisfaction and anticipation for what comes next."
  ],
  karka: [
    "This month Cancer natives find emotional fulfillment and domestic happiness. Home and family matters receive positive attention.",
    "Nurturing activities bring joy. Caring for loved ones and creating comfortable environment provide deep satisfaction.",
    "Financial security strengthens reliably. Wise investments and careful spending ensure stable financial foundation.",
    "Family celebrations occur naturally. Happy occasions bring loved ones together creating beautiful memories.",
    "Home improvements undertaken successfully. Living space becomes more comfortable and aesthetically pleasing.",
    "Career emotional intelligence valued. Your ability to understand people helps advance professional goals effectively.",
    "Health improves through self-care. Attention to emotional and physical needs shows positive results.",
    "Relationships deepen significantly. Trust and mutual support characterize interactions with family and friends.",
    "Intuition guides decisions wisely. Following inner voice leads to beneficial outcomes in various situations.",
    "Domestic peace prevails harmoniously. Home becomes sanctuary providing rest and rejuvenation from outside demands.",
    "Financial cushion grows steadily. Emergency funds and savings increase providing enhanced security and peace of mind.",
    "Month ends with warmth. Emotional connections and domestic comfort create satisfying conclusion to period."
  ],
  simha: [
    "This month Leo natives shine brilliantly in all areas. Leadership and creativity bring remarkable success and recognition.",
    "Professional achievements multiply significantly. Promotions, awards, or new opportunities elevate career to new heights.",
    "Financial prosperity increases dramatically. Bold investments and confident decisions yield substantial monetary gains.",
    "Family pride and joy abound. Your accomplishments make loved ones happy and inspire younger family members.",
    "Social recognition reaches new levels. Respect and admiration from peers enhance personal and professional reputation.",
    "Creative projects receive acclaim. Artistic endeavors or innovative ideas gain appreciation and practical implementation.",
    "Health and vitality peak high. Physical strength and mental confidence support ambitious goals and busy schedule.",
    "Leadership roles multiply naturally. People look to you for guidance and direction in various situations.",
    "Romantic life flourishes beautifully. Love relationships deepen or new romantic connections bring joy and excitement.",
    "Business ventures prove highly profitable. Entrepreneurial efforts and risk-taking yield excellent returns and growth.",
    "Personal charisma attracts opportunities. Your magnetic personality draws positive people and situations into life.",
    "Month concludes with celebration. Achievements and recognition provide satisfaction and motivation for future success."
  ],
  kanya: [
    "This month Virgo natives excel through precision and practicality. Organizational skills bring professional advancement and personal satisfaction.",
    "Work efficiency reaches new heights. Systematic approaches and attention to detail yield superior results and recognition.",
    "Financial management proves excellent. Careful budgeting and wise investments ensure growing prosperity and security.",
    "Family health improves notably. Your attentive care and practical health advice benefit loved ones significantly.",
    "Service activities bring fulfillment. Helping others and contributing to community provide deep sense of purpose.",
    "Career perfectionism earns respect. High standards and quality work make you invaluable to organization.",
    "Health consciousness pays dividends. Disciplined diet and exercise routines show visible improvements in well-being.",
    "Analytical skills solve problems. Logical thinking and practical solutions help overcome challenges effectively.",
    "Organization systems implemented successfully. Efficient processes improve both work productivity and home management.",
    "Learning technical skills succeeds. Educational pursuits enhance professional expertise and career prospects significantly.",
    "Practical friendships develop meaningfully. Reliable people who share values become important part of support network.",
    "Month ends with accomplishment. Goals achieved through diligent effort provide satisfaction and confidence for future."
  ],
  tula: [
    "This month Libra natives create beautiful balance in all life areas. Harmony and cooperation bring success and happiness.",
    "Partnerships flourish remarkably. Both personal and professional relationships deepen bringing mutual benefits and joy.",
    "Financial equilibrium achieved perfectly. Income and expenses align well creating comfortable and stable financial situation.",
    "Family peace maintained consistently. Diplomatic skills resolve conflicts and create harmonious home environment.",
    "Social life becomes fulfilling. Pleasant interactions and cultural activities enrich personal life significantly.",
    "Career collaborations yield results. Teamwork and cooperative efforts lead to successful project completions.",
    "Aesthetic pursuits bring pleasure. Involvement in arts, beauty, or design activities provides creative satisfaction.",
    "Relationships deepen romantically. Love life becomes more satisfying through balanced give-and-take.",
    "Negotiation skills prove valuable. Ability to find win-win solutions benefits both professional and personal situations.",
    "Justice and fairness prevail. Your commitment to equality creates positive outcomes in various situations.",
    "Financial partnerships succeed admirably. Joint ventures or shared investments prove mutually profitable.",
    "Month concludes with harmony. Balanced approach to life creates satisfying and beautiful conclusion to period."
  ],
  vrishchika: [
    "This month Scorpio natives experience profound transformation. Deep changes in various life areas bring positive growth.",
    "Investigative abilities yield discoveries. Hidden opportunities and resources become revealed through persistent effort.",
    "Financial breakthroughs occur unexpectedly. Windfalls or investment gains significantly improve monetary situation.",
    "Family understanding reaches new depths. Emotional honesty and vulnerability strengthen bonds with loved ones.",
    "Loyal allies provide invaluable support. Trustworthy friends prove their worth during challenging situations.",
    "Career intensity brings breakthroughs. Focused determination and strategic thinking overcome obstacles to success.",
    "Personal power increases dramatically. Inner strength becomes evident and attracts respect from others.",
    "Research projects succeed remarkably. Thorough investigation and analysis lead to important discoveries or solutions.",
    "Transformative experiences occur naturally. Life-changing insights or events shift perspective in positive ways.",
    "Resource management skills sharpen. Ability to maximize available assets improves financial and material situation.",
    "Profound connections form deeply. Soul-level friendships or relationships develop bringing lasting fulfillment.",
    "Month ends with empowerment. Personal transformation and achievements provide strength and confidence for future."
  ],
  dhanu: [
    "This month Sagittarius natives experience growth and expansion. Career advancement and personal development progress excellently.",
    "Professional opportunities multiply rapidly. New projects and responsibilities showcase your capabilities and potential.",
    "Financial situation improves substantially. Income increases and stabilizes providing enhanced comfort and security.",
    "Family celebrations bring joy. Happy events and gatherings create wonderful memories and strengthen bonds.",
    "Friendships provide valuable support. Loyal companions offer advice and assistance when needed most.",
    "Business expansion proves successful. New ventures and market growth yield profitable results.",
    "Travel opportunities arise frequently. Journeys undertaken bring both enjoyment and beneficial professional contacts.",
    "Learning accelerates significantly. Educational pursuits and skill development enhance expertise and career prospects.",
    "Optimism attracts positive outcomes. Enthusiastic attitude creates favorable circumstances and opportunities.",
    "Physical health remains excellent. Energy levels stay high supporting active lifestyle and ambitious goals.",
    "Long-term planning succeeds admirably. Future-oriented decisions and preparations set stage for continued success.",
    "Month concludes with satisfaction. Progress achieved and opportunities grasped create positive outlook for future."
  ],
  makara: [
    "This month Capricorn natives achieve professional milestones. Hard work and discipline bring deserved recognition and advancement.",
    "Career goals come significantly closer. Promotions, raises, or new opportunities align with long-term ambitions.",
    "Financial foundation solidifies strongly. Investments mature and income stability increases providing enhanced security.",
    "Family responsibilities fulfilled admirably. Your dedication and reliability earn deep appreciation from loved ones.",
    "Leadership positions offered naturally. Authority roles suit your capabilities and management style perfectly.",
    "Business foundations strengthen substantially. Sustainable practices and strategic planning ensure continued growth.",
    "Health discipline maintained consistently. Regular routines and healthy habits show cumulative positive effects.",
    "Professional relationships develop valuably. Mentors and colleagues provide guidance and opportunities for advancement.",
    "Long-term projects progress steadily. Patient, persistent effort moves important initiatives closer to completion.",
    "Social standing improves notably. Professional achievements and ethical behavior earn respect from community.",
    "Wealth accumulation continues reliably. Assets grow through wise management and strategic investments.",
    "Month ends with achievement. Professional success and personal satisfaction provide confidence for continued progress."
  ],
  kumbha: [
    "This month Aquarius natives innovate successfully. Original thinking and unconventional approaches bring breakthrough results.",
    "Humanitarian projects advance significantly. Social causes and community initiatives show tangible positive results.",
    "Financial innovation proves profitable. Technology-based or modern financial methods increase income substantially.",
    "Family independence maintained harmoniously. Mutual respect for personal space strengthens relationships paradoxically.",
    "Friendship networks expand meaningfully. Like-minded people gather creating valuable support and collaboration system.",
    "Career uniqueness gets recognized. Unconventional methods and innovative solutions receive appreciation and implementation.",
    "Progressive ideas materialize successfully. Future-oriented plans and projects begin taking concrete form.",
    "Technological skills enhance opportunities. Digital literacy and modern tools increase professional effectiveness.",
    "Social consciousness grows deeper. Awareness of global issues inspires action and contribution.",
    "Intellectual pursuits prove stimulating. Learning and sharing knowledge bring satisfaction and recognition.",
    "Investment diversity increases wisely. Portfolio spreads across different assets reducing risk and increasing potential.",
    "Month concludes with innovation. Breakthroughs achieved and connections made create excitement for future possibilities."
  ],
  meena: [
    "This month Pisces natives tap deep intuition. Creative and spiritual insights guide beneficial decisions and actions.",
    "Artistic projects flourish beautifully. Creative endeavors receive recognition and appreciation from others.",
    "Financial intuition proves accurate. Instinctive choices about money matters lead to profitable outcomes.",
    "Family compassion deepens significantly. Emotional support flows freely creating warm and nurturing home environment.",
    "Spiritual connections develop naturally. Meaningful relationships with kindred spirits enrich personal life profoundly.",
    "Career creativity gets valued highly. Imaginative solutions and artistic approaches advance professional goals.",
    "Holistic health improves noticeably. Mind-body-spirit integration practices show comprehensive wellness benefits.",
    "Empathy strengthens relationships deeply. Understanding and compassion create powerful bonds with others.",
    "Intuitive abilities increase remarkably. Psychic insights and gut feelings prove accurate and helpful.",
    "Adaptability serves well professionally. Flexible approaches help navigate changing work situations successfully.",
    "Spiritual wealth grows abundantly. Material needs met while inner peace and wisdom deepen.",
    "Month ends with transcendence. Mystical experiences and creative achievements bring deep fulfillment and peace."
  ]
};

// Yearly horoscope for 2026
const YEARLY_HOROSCOPES = {
  mesha: {
    text: "2026 is a transformative year for Aries natives bringing remarkable growth and achievement. Career advancement reaches new heights with multiple opportunities for promotion and professional recognition. Financial prosperity increases substantially through wise investments and new income sources. Leadership roles multiply as your natural abilities receive widespread acknowledgment. Health remains excellent supporting ambitious goals and active lifestyle. Family relationships strengthen through shared success and mutual support. Business ventures prove highly profitable with expansion opportunities materializing successfully. Travel brings valuable connections and memorable experiences. Personal development accelerates through learning and skill acquisition. Overall this year marks significant progress across all life areas.",
    colors: { en: ['Red', 'Gold', 'Orange'] },
    stats: { health: 90, wealth: 92, family: 88, love: 85, career: 95 }
  },
  vrishabha: {
    text: "2026 brings steady growth and enhanced security for Taurus natives. Financial stability reaches impressive levels through consistent effort and wise money management. Career advancement occurs gradually but reliably with recognition for quality work. Home and family life become increasingly harmonious providing strong emotional foundation. Investments mature favorably yielding excellent returns. Relationships deepen meaningfully with loyalty and trust characterizing interactions. Health improves through disciplined self-care routines. Property matters work out favorably including purchases or improvements. Business ventures prove steadily profitable with sustainable growth patterns. Overall this year provides solid progress and lasting achievements.",
    colors: { en: ['Green', 'Blue', 'Gold'] },
    stats: { health: 88, wealth: 90, family: 92, love: 90, career: 87 }
  },
  mithuna: {
    text: "2026 is an intellectually stimulating and diverse year for Gemini natives. Multiple opportunities arise requiring your versatility and adaptability. Communication skills open numerous doors professionally and personally. Income streams diversify providing enhanced financial flexibility. Career advancement occurs through showcasing multiple talents and skills. Learning accelerates rapidly with new knowledge easily acquired and applied. Social connections expand significantly bringing valuable contacts and friendships. Travel frequently for both business and pleasure. Creative projects succeed through innovative thinking. Relationships benefit from improved communication. Business ventures profit from diverse approaches. Overall this year brings variety, growth, and numerous achievements.",
    colors: { en: ['Yellow', 'Blue', 'Orange'] },
    stats: { health: 86, wealth: 88, family: 85, love: 87, career: 90 }
  },
  karka: {
    text: "2026 brings emotional fulfillment and domestic happiness for Cancer natives. Family bonds strengthen significantly through shared experiences and mutual support. Home becomes sanctuary providing peace and rejuvenation. Financial security increases through wise investments and careful planning. Career success comes through emotional intelligence and people skills. Nurturing activities bring deep satisfaction and purpose. Relationships deepen with trust and vulnerability strengthening connections. Health improves through attention to emotional well-being. Property matters work favorably including home improvements or purchases. Intuition guides beneficial decisions throughout year. Business partnerships thrive through caring approach. Overall this year provides warmth, security, and meaningful connections.",
    colors: { en: ['White', 'Silver', 'Blue'] },
    stats: { health: 87, wealth: 89, family: 95, love: 92, career: 86 }
  },
  simha: {
    text: "2026 is a spectacular year for Leo natives filled with recognition and achievement. Leadership opportunities multiply across professional and personal spheres. Career advancement reaches impressive heights with promotions and prestigious positions. Financial prosperity increases dramatically through bold moves and confident decisions. Creative projects receive widespread acclaim and practical implementation. Social status elevates significantly with respect and admiration from peers. Romantic life flourishes bringing joy and excitement. Health and vitality remain excellent supporting ambitious goals. Business ventures prove highly profitable through entrepreneurial spirit. Personal charisma attracts opportunities and positive people. Overall this year marks period of outstanding success and fulfillment.",
    colors: { en: ['Gold', 'Orange', 'Red'] },
    stats: { health: 92, wealth: 94, family: 90, love: 93, career: 96 }
  },
  kanya: {
    text: "2026 brings professional excellence and personal satisfaction for Virgo natives. Organizational skills receive recognition leading to career advancement. Financial management proves highly successful with growing prosperity. Work efficiency reaches new heights yielding superior results. Health improves significantly through disciplined wellness routines. Service activities provide deep sense of purpose and fulfillment. Analytical abilities solve important problems bringing respect. Career perfectionism earns advancement and increased responsibility. Practical projects complete successfully on time and within budget. Relationships with reliable people strengthen meaningfully. Learning technical skills enhances professional expertise. Overall this year rewards diligence, precision, and practical approach to life.",
    colors: { en: ['Green', 'Brown', 'Gold'] },
    stats: { health: 91, wealth: 90, family: 88, love: 86, career: 93 }
  },
  tula: {
    text: "2026 is a harmonious year for Libra natives bringing balance and beauty to all life areas. Partnerships flourish remarkably in both personal and professional contexts. Career collaborations yield excellent results through teamwork. Financial equilibrium achieved with income and expenses aligning perfectly. Relationships deepen romantically bringing enhanced satisfaction and joy. Social life becomes rich and fulfilling with cultural activities. Diplomatic skills prove invaluable in resolving conflicts and creating opportunities. Aesthetic pursuits bring pleasure and sometimes profit. Business partnerships prove mutually beneficial and profitable. Justice and fairness prevail in various situations. Overall this year provides harmony, cooperation, and beautiful experiences.",
    colors: { en: ['Pink', 'Blue', 'Gold'] },
    stats: { health: 88, wealth: 89, family: 90, love: 94, career: 89 }
  },
  vrishchika: {
    text: "2026 brings profound transformation and empowerment for Scorpio natives. Career breakthroughs occur through focused determination and strategic thinking. Financial windfalls and investment gains significantly improve prosperity. Personal power increases dramatically attracting respect and opportunities. Deep research and investigative work yield important discoveries. Relationships reach new depths through emotional honesty and vulnerability. Health improves through regenerative practices and holistic approaches. Business strategies prove highly successful with calculated risks paying off. Hidden resources and opportunities become revealed through persistence. Transformative experiences shift perspective in positive ways. Overall this year marks period of intense growth and powerful achievements.",
    colors: { en: ['Red', 'Black', 'Gold'] },
    stats: { health: 89, wealth: 93, family: 87, love: 90, career: 94 }
  },
  dhanu: {
    text: "2026 is a year of growth and expansion for Sagittarius natives. Career advancement and personal development progress excellently. Professional opportunities multiply with new projects showcasing capabilities. Financial situation improves substantially with increased income and stability. Travel opportunities abound bringing both enjoyment and beneficial contacts. Learning accelerates with educational pursuits enhancing expertise. Business expansion proves successful with ventures yielding profits. Optimistic attitude attracts positive outcomes and opportunities. Physical health remains excellent supporting active lifestyle. Long-term planning succeeds with future-oriented decisions bearing fruit. Friendships provide valuable support and encouragement. Overall this year brings progress, adventure, and numerous achievements.",
    colors: { en: ['Yellow', 'Blue', 'Green'] },
    stats: { health: 90, wealth: 91, family: 88, love: 89, career: 93 }
  },
  makara: {
    text: "2026 is a year of professional achievement for Capricorn natives. Career goals materialize through persistent hard work and discipline. Financial foundation solidifies with investments maturing and income stabilizing. Leadership positions come naturally suiting capabilities perfectly. Business foundations strengthen ensuring sustainable growth. Professional recognition increases with ethical behavior earning respect. Wealth accumulation continues through wise management and strategic planning. Health discipline maintains excellent physical condition. Long-term projects progress steadily toward completion. Family responsibilities fulfilled earning appreciation from loved ones. Social standing improves through achievements and integrity. Overall this year rewards patience, persistence, and professional excellence.",
    colors: { en: ['Brown', 'Gray', 'Gold'] },
    stats: { health: 88, wealth: 95, family: 90, love: 85, career: 97 }
  },
  kumbha: {
    text: "2026 is an innovative year for Aquarius natives bringing breakthrough results. Original thinking and unconventional approaches gain recognition and implementation. Humanitarian projects advance with social causes showing tangible results. Financial innovation proves profitable through modern methods and technology. Career uniqueness gets appreciated with innovative solutions valued highly. Friendship networks expand meaningfully with like-minded connections forming. Progressive ideas materialize taking concrete form. Technological skills enhance professional opportunities significantly. Social consciousness inspires positive action and contribution. Intellectual pursuits prove stimulating and rewarding. Investment portfolio diversifies wisely spreading risk and increasing potential. Overall this year brings innovation, connection, and forward progress.",
    colors: { en: ['Blue', 'White', 'Silver'] },
    stats: { health: 87, wealth: 90, family: 86, love: 88, career: 92 }
  },
  meena: {
    text: "2026 is a spiritually enriching year for Pisces natives. Intuition reaches new heights guiding beneficial decisions and actions. Creative projects flourish receiving recognition and appreciation. Financial intuition proves accurate with instinctive choices yielding profits. Compassion deepens family relationships creating warm nurturing environment. Spiritual connections develop with meaningful relationships enriching life profoundly. Career creativity gets valued with imaginative approaches advancing goals. Holistic health improves through mind-body-spirit integration practices. Empathy strengthens relationships creating powerful bonds with others. Adaptability serves professionally helping navigate changing situations. Mystical experiences bring deep fulfillment and inner peace. Overall this year provides transcendence, creativity, and spiritual growth.",
    colors: { en: ['Purple', 'Blue', 'Silver'] },
    stats: { health: 89, wealth: 88, family: 91, love: 93, career: 87 }
  }
};

// Main data structure
export const RASHIPHALALU_DATA = {};

// Populate data for all rashis
Object.keys(RASHI_NAMES).forEach(rashiId => {
  RASHIPHALALU_DATA[rashiId] = {
    daily: {
      statements: DAILY_STATEMENTS[rashiId],
      colors: {
        en: rashiId === 'mesha' ? ['Red', 'Orange'] :
          rashiId === 'vrishabha' ? ['Green', 'Blue'] :
          rashiId === 'mithuna' ? ['Yellow', 'Orange'] :
          rashiId === 'karka' ? ['White', 'Silver'] :
          rashiId === 'simha' ? ['Gold', 'Yellow'] :
          rashiId === 'kanya' ? ['Green', 'Brown'] :
          rashiId === 'tula' ? ['Pink', 'Blue'] :
          rashiId === 'vrishchika' ? ['Red', 'Black'] :
          rashiId === 'dhanu' ? ['Yellow', 'Blue', 'Green'] :
          rashiId === 'makara' ? ['Brown', 'Gray'] :
          rashiId === 'kumbha' ? ['Blue', 'White'] :
          ['Purple', 'Blue']
      },
      stats: { health: 80 + Math.floor(Math.random() * 10), wealth: 75 + Math.floor(Math.random() * 15), family: 78 + Math.floor(Math.random() * 12), love: 75 + Math.floor(Math.random() * 15), career: 85 + Math.floor(Math.random() * 10) }
    },
    weekly: {
      statements: WEEKLY_STATEMENTS[rashiId],
      colors: {
        en: rashiId === 'mesha' ? ['Red', 'Yellow'] :
          rashiId === 'vrishabha' ? ['Green', 'Gold'] :
          rashiId === 'mithuna' ? ['Yellow', 'Blue'] :
          rashiId === 'karka' ? ['Silver', 'Blue'] :
          rashiId === 'simha' ? ['Gold', 'Orange'] :
          rashiId === 'kanya' ? ['Brown', 'Green'] :
          rashiId === 'tula' ? ['Pink', 'Gold'] :
          rashiId === 'vrishchika' ? ['Black', 'Red'] :
          rashiId === 'dhanu' ? ['Blue', 'Indigo'] :
          rashiId === 'makara' ? ['Gray', 'Gold'] :
          rashiId === 'kumbha' ? ['Blue', 'Silver'] :
          ['Purple', 'Silver']
      },
      stats: { health: 82 + Math.floor(Math.random() * 8), wealth: 80 + Math.floor(Math.random() * 12), family: 80 + Math.floor(Math.random() * 12), love: 78 + Math.floor(Math.random() * 14), career: 88 + Math.floor(Math.random() * 8) }
    },
    monthly: {
      statements: MONTHLY_STATEMENTS[rashiId],
      colors: {
        en: rashiId === 'mesha' ? ['Orange', 'Gold'] :
          rashiId === 'vrishabha' ? ['Green', 'Gold'] :
          rashiId === 'mithuna' ? ['Yellow', 'Orange'] :
          rashiId === 'karka' ? ['White', 'Blue'] :
          rashiId === 'simha' ? ['Gold', 'Red'] :
          rashiId === 'kanya' ? ['Green', 'Gold'] :
          rashiId === 'tula' ? ['Pink', 'Gold'] :
          rashiId === 'vrishchika' ? ['Red', 'Gold'] :
          rashiId === 'dhanu' ? ['Purple', 'Gold'] :
          rashiId === 'makara' ? ['Brown', 'Gold'] :
          rashiId === 'kumbha' ? ['Blue', 'Gold'] :
          ['Purple', 'Gold']
      },
      stats: { health: 84 + Math.floor(Math.random() * 8), wealth: 85 + Math.floor(Math.random() * 10), family: 82 + Math.floor(Math.random() * 10), love: 84 + Math.floor(Math.random() * 10), career: 90 + Math.floor(Math.random() * 6) }
    },
    yearly: YEARLY_HOROSCOPES[rashiId]
  };
});

// Function to get rotating daily text based on day of year
export const getRashiText = (rashiId, period, date, language = 'en') => {
  const data = RASHIPHALALU_DATA[rashiId];
  if (!data) return 'No data available for this rashi';

  const periodData = data[period];
  if (!periodData) return 'No data available for this period';

  if (period === 'yearly') {
    return periodData.text;
  }

  // For daily, weekly, monthly - rotate through statements
  const statements = periodData.statements;
  const localizedStatements = Array.isArray(statements)
    ? statements
    : (statements?.[language] || statements?.en || Object.values(statements || {})[0]);
  if (!localizedStatements || localizedStatements.length === 0) {
    return periodData.text || 'No text available';
  }

  let index = 0;
  if (period === 'daily') {
    // Rotate daily based on day of year
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const dayOfYear = Math.floor((date - startOfYear) / (1000 * 60 * 60 * 24));
    index = dayOfYear % localizedStatements.length;
  } else if (period === 'weekly') {
    // Rotate weekly based on week of year
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const dayOfYear = Math.floor((date - startOfYear) / (1000 * 60 * 60 * 24));
    const weekOfYear = Math.floor(dayOfYear / 7);
    index = weekOfYear % localizedStatements.length;
  } else if (period === 'monthly') {
    // Rotate monthly based on month
    index = date.getMonth() % localizedStatements.length;
  }

  return localizedStatements[index];
};
