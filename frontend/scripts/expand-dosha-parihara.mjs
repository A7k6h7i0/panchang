import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(process.cwd(), "frontend");
const DATA_PATH = path.join(ROOT, "public", "data", "dosha-parihara.json");

const RAW_DOSHAS = `
## 1. Major Planetary Doshas
1 Mangala Dosha (Mars Defect/Kuja Dosha)
2 Pitri Dosha (Ancestral Curse/Flaw)
3 Kaalsarp Dosha (Serpentine Curse/Yoke)
4 Rahu Dosha (Flaw caused by North Node)
5 Ketu Dosha (Flaw caused by South Node)
6 Sade Sati (7.5 years transit of Saturn)
7 Ashtama Shani (Saturn in the 8th house)
8 Ardhastama Shani (Saturn in the 4th house)
9 Guru Chandala Dosha (Jupiter Rahu/Ketu conjunction)
10 Grahan Dosha (Eclipse flaw Sun/Moon with Rahu/Ketu)
11 Shrapit Dosha (Cursed flaw Saturn and Rahu conjunction)
12 Visha Dosha (Poison flaw Moon and Saturn conjunction)
13 Angaraka Dosha (Mars and Rahu conjunction)
## 2. Marriage and Compatibility Doshas
14 Kemadruma Dosha (Loneliness/Poverty flaw Moon with no planets nearby)
15 Paapa Kartari Dosha (Hemmed by malefics)
16 Nadi Dosha (Pulse/Physiological incompatibility)
17 Gana Dosha (Temperamental incompatibility)
18 Bhakoot Dosha (Relative Moon sign position flaw)
19 Yoni Dosha (Biological incompatibility)
20 Stri Deergha Dosha (Distance between constellations flaw)
21 Vashya Dosha (Dominance incompatibility)
22 Mahendra Dosha (Longevity/Well-being flaw)
23 Rajju Dosha (Duration of married life flaw)
24 Vedha Dosha (Obstruction flaw)
## 3. Birth Timing and Constellation Doshas
25 Gandamoola Dosha (Birth in critical junction stars)
26 Ashwayuja Gandam (Ashwini star flaw)
27 Aslesha Gandam (Aslesha star flaw)
28 Magha Gandam (Magha star flaw)
29 Jyestha Gandam (Jyestha star flaw)
30 Moola Gandam (Moola star flaw)
31 Revati Gandam (Revati star flaw)
32 Amavasya Janana Dosha (Birth on New Moon day)
33 Krishna Paksha Chaturdashi Dosha (Birth on the 14th lunar day of dark fortnight)
34 Sankranti Janana Dosha (Birth during Sun transit into a new sign)
35 Grahan Janana Dosha (Birth during an Eclipse)
36 Vyatipata Yoga Dosha (Birth in Vyatipata Yoga)
37 Vaidhriti Yoga Dosha (Birth in Vaidhriti Yoga)
## 4. Curses
38 Sarpa Shapa (Curse of the Serpents)
39 Brahma Shapa (Curse of a learned person)
40 Matru Shapa (Curse of the Mother)
41 Bhratru Shapa (Curse of the Brother)
42 Patni Shapa (Curse of the Wife)
43 Preta Shapa (Curse of a departed soul)
## 5. Life Aspect and Kaalsarp Variations
44 Vidya Dosha (Obstacles in Education)
45 Santana Dosha (Obstacles in Children)
46 Ananta Kaalsarp Dosha
47 Kulika Kaalsarp Dosha
48 Vasuki Kaalsarp Dosha
49 Shankhapala Kaalsarp Dosha
50 Padma Kaalsarp Dosha
51 Mahapadma Kaalsarp Dosha
52 Takshaka Kaalsarp Dosha
53 Karkotaka Kaalsarp Dosha
54 Shankhachuda Kaalsarp Dosha
55 Ghataka Kaalsarp Dosha
56 Vishadhara Kaalsarp Dosha
57 Sheshnaga Kaalsarp Dosha
## 6. Planetary Debilitation and State Doshas
58 Sun Neecha Dosha (Sun Debilitation)
59 Moon Neecha Dosha (Moon Debilitation)
60 Mars Neecha Dosha (Mars Debilitation)
61 Mercury Neecha Dosha (Mercury Debilitation)
62 Jupiter Neecha Dosha (Jupiter Debilitation)
63 Venus Neecha Dosha (Venus Debilitation)
64 Saturn Neecha Dosha (Saturn Debilitation)
65 Daridra Dosha (Flaw of Poverty)
66 Shakata Dosha (Unstable fortune)
67 Chandala Dosha (Degraded conduct flaw)
68 Jadatwa Dosha (Mental dullness flaw)
69 Mukkopi Dosha (Short tempered flaw)
70 Dahana Dosha (Combustion flaw)
71 Dagdha Rashi Dosha (Burnt sign flaw)
72 Tithi Shoonya Dosha (Zero power lunar day)
73 Lagna Sandhi Dosha (Birth at the junction of two ascendants)
74 Rashi Sandhi Dosha (Planet at the junction of two signs)
75 Nakshatra Sandhi Dosha (Planet at the junction of two stars)
76 Astangata Graha Dosha (Combust planet flaw)
77 Vakra Graha Dosha (Retrogression flaw)
78 Graha Yuddha Dosha (Planetary war flaw)
79 Shashtashtaka Dosha (6th 8th house relationship)
80 Dwirdwadasha Dosha (2nd 12th house relationship)
81 Ekadasha Dosha (11th house related flaw)
## 7. Timing and Environmental Doshas
82 Gulika Dosha (Influence of Gulika)
83 Yamaganda Dosha (Inauspicious time of Yama)
84 Rahu Kaala Dosha (Inauspicious time of Rahu)
85 Varjya Dosha (Avoidable time period)
86 Durmuhurtha Dosha (Inauspicious moment)
87 Paksha Randhra Dosha (Flaw in the lunar fortnight)
88 Sandhyakala Janana Dosha (Birth during twilight)
89 Ulkapata Dosha (Meteor fall disturbance)
90 Bhukampa Janana Dosha (Birth during an earthquake)
## 8. Specific House Placements and Vastu
91 Ketu in 8th House (Health/Longevity issues)
92 Rahu in 7th House (Marriage/Partnership issues)
93 Saturn in 1st House (Personal struggles)
94 Jupiter in 6th House (Enmity/Health issues)
95 Northeast Vastu Dosha (Defect in North East)
96 Southwest Vastu Dosha (Defect in South West)
97 Southeast Vastu Dosha (Defect in South East)
98 Northwest Vastu Dosha (Defect in North West)
99 Brahmasthana Vastu Dosha (Defect in Center)
100 Dwara Dosha (Main door defect)
101 Veedi Potu Dosha (Road thrust defect)
`;

const SECTION_CATEGORY = {
  "1": "graha-dosha",
  "2": "marriage",
  "3": "family",
  "4": "family",
  "5": "family",
  "6": "graha-dosha",
  "7": "general",
  "8": "general",
};

const FAMILY_RECORDS = {
  mars: ["mangalnath-mangal-dosha-parihara"],
  pitri: ["trimbakeshwar-pitru-kalsarpa-parihara", "vishnupad-temple-gaya-pitru-parihara"],
  rahu: ["srikalahasti-rahu-ketu-parihara", "mopidevi-temple-rahu-ketu-parihara"],
  shani: ["shani-shingnapur-shani-dosha-parihara", "thirunallar-shani-parihara", "shani-bhagawan-devalayam-munganoor", "ujjain-shani-dosha-starter", "kharsali-shani-temple-uttarkashi", "ramgarh-shani-temple-rajasthan"],
  marriage: ["mangadu-marriage-delay-parihara", "madurai-marriage-finance-parihara", "kanchipuram-education-block-parihara"],
  birth: ["vaitheeswaran-koil-health-parihara", "srikalahasti-rahu-ketu-parihara"],
  navagraha: ["navagraha-temple-guwahati", "navagraha-general-parihara", "konark-navagraha-reference", "ujjain-shani-dosha-starter"],
  guru: ["alangudi-guru-education-parihara"],
  health: ["vaitheeswaran-koil-health-parihara"],
  family: ["trivandrum-family-health-parihara", "palani-family-obstacle-parihara"],
  career: ["tiruchendur-career-obstacle-parihara", "tirupati-education-career-parihara"],
  vastu: ["tirupati-education-career-parihara", "tiruchendur-career-obstacle-parihara"],
  sun: ["konark-navagraha-reference", "sun-temple-ranchi-bundu"],
};

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseDoshas(raw) {
  const rows = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => /^\d+\s/.test(line));

  return rows.map((line) => {
    const match = line.match(/^(\d+)\s+(.*?)(?:\s+\((.*)\))?$/);
    if (!match) {
      return { number: Number(line.match(/^(\d+)/)?.[1] || 0), name: line, description: "" };
    }
    return {
      number: Number(match[1]),
      name: match[2].trim(),
      description: String(match[3] || "").trim(),
    };
  });
}

function categoryFor(number) {
  if (number >= 1 && number <= 13) return SECTION_CATEGORY[1];
  if (number >= 14 && number <= 24) return SECTION_CATEGORY[2];
  if (number >= 25 && number <= 37) return SECTION_CATEGORY[3];
  if (number >= 38 && number <= 43) return SECTION_CATEGORY[4];
  if (number >= 44 && number <= 57) return SECTION_CATEGORY[5];
  if (number >= 58 && number <= 81) return SECTION_CATEGORY[6];
  if (number >= 82 && number <= 90) return SECTION_CATEGORY[7];
  return SECTION_CATEGORY[8];
}

function anchorsFor(name) {
  const n = String(name || "");
  if (/(Mangala|Kuja|Angaraka|Mars)/i.test(n)) return FAMILY_RECORDS.mars;
  if (/(Pitri|Pitru|Preta|Brahma Shapa|Matru Shapa|Bhratru Shapa|Patni Shapa|Sarpa Shapa|Kaalsarp|Kalsarp)/i.test(n)) return FAMILY_RECORDS.pitri;
  if (/(Rahu|Ketu|Grahan|Gulika|Yamaganda|Rahu Kaala|Varjya|Durmuhurtha|Paksha Randhra|Sandhyakala|Ulkapata|Bhukampa)/i.test(n)) return FAMILY_RECORDS.rahu;
  if (/(Sade Sati|Ashtama Shani|Ardhastama Shani|Shani|Shrapit|Visha|Shakata|Daridra|Chandala|Jadatwa|Mukkopi|Dahana|Dagdha|Tithi Shoonya|Lagna Sandhi|Rashi Sandhi|Nakshatra Sandhi|Astangata|Vakra|Graha Yuddha|Shashtashtaka|Dwirdwadasha|Ekadasha|Saturn Neecha|Moon Neecha|Mercury Neecha|Jupiter Neecha|Venus Neecha|Sun Neecha)/i.test(n)) return FAMILY_RECORDS.shani;
  if (/(Nadi|Gana|Bhakoot|Yoni|Stri Deergha|Vashya|Mahendra|Rajju|Vedha|Vivaha|Marriage)/i.test(n)) return FAMILY_RECORDS.marriage;
  if (/(Gandamoola|Ashwayuja|Aslesha|Magha|Jyestha|Moola|Revati|Amavasya|Krishna Paksha Chaturdashi|Sankranti|Grahan Janana|Vyatipata|Vaidhriti)/i.test(n)) return FAMILY_RECORDS.birth;
  if (/(Guru Chandala|Guru Dosha|Budha|Mercury|Jupiter|Venus|Surya|Chandra|Navagraha|Neecha|Rahu Dosha|Ketu Dosha|Grahan Dosha)/i.test(n)) return FAMILY_RECORDS.navagraha;
  if (/(Vidya Dosha|Santana Dosha)/i.test(n)) return FAMILY_RECORDS.family;
  if (/(North|South|East|West|Vastu|Dwara|Veedi Potu|Brahmasthana|House|Lagna Sandhi|Rashi Sandhi|Nakshatra Sandhi)/i.test(n)) return FAMILY_RECORDS.vastu;
  if (/(Health|Dahana|Dagdha|Shakata|Daridra|Chandala)/i.test(n)) return FAMILY_RECORDS.health;
  return FAMILY_RECORDS.navagraha;
}

function aliasesFor(name) {
  const n = String(name || "");
  const map = {
    "Mangala Dosha": ["Kuja Dosha", "Mangal Dosha"],
    "Pitri Dosha": ["Pitru Dosha", "Pitra Dosha"],
    "Kaalsarp Dosha": ["Kalasarpa Dosha", "Kalsarpa Dosha", "Kala Sarpa Dosha"],
    "Rahu Dosha": ["North Node Dosha"],
    "Ketu Dosha": ["South Node Dosha"],
    "Sade Sati": ["Saturn Sade Sati"],
    "Ashtama Shani": ["Saturn in 8th House"],
    "Ardhastama Shani": ["Saturn in 4th House"],
    "Guru Chandala Dosha": ["Jupiter Rahu/Ketu Conjunction"],
    "Grahan Dosha": ["Eclipse Dosha"],
    "Shrapit Dosha": ["Saturn and Rahu Conjunction"],
    "Visha Dosha": ["Poison Dosha"],
    "Angaraka Dosha": ["Mars and Rahu Conjunction"],
    "Kemadruma Dosha": ["Moon with no nearby planets"],
    "Paapa Kartari Dosha": ["Hemmed by Malefics"],
    "Nadi Dosha": ["Pulse Dosha"],
    "Gana Dosha": ["Temperamental Incompatibility"],
    "Bhakoot Dosha": ["Moon Sign Compatibility"],
    "Yoni Dosha": ["Biological Compatibility"],
    "Stri Deergha Dosha": ["Constellation Distance Dosha"],
    "Vashya Dosha": ["Dominance Incompatibility"],
    "Mahendra Dosha": ["Longevity Dosha"],
    "Rajju Dosha": ["Marriage Lifespan Dosha"],
    "Vedha Dosha": ["Obstruction Dosha"],
    "Gandamoola Dosha": ["Gand Mool Dosha"],
    "Grahan Janana Dosha": ["Eclipse Birth Dosha"],
    "Vyatipata Yoga Dosha": ["Vyatipata Dosha"],
    "Vaidhriti Yoga Dosha": ["Vaidhriti Dosha"],
    "Sarpa Shapa": ["Serpent Curse"],
    "Brahma Shapa": ["Brahmin Curse"],
    "Preta Shapa": ["Spirit Curse"],
    "Vidya Dosha": ["Education Block"],
    "Santana Dosha": ["Child Delay"],
    "Sun Neecha Dosha": ["Sun Debilitation"],
    "Moon Neecha Dosha": ["Moon Debilitation"],
    "Mars Neecha Dosha": ["Mars Debilitation"],
    "Mercury Neecha Dosha": ["Mercury Debilitation"],
    "Jupiter Neecha Dosha": ["Jupiter Debilitation"],
    "Venus Neecha Dosha": ["Venus Debilitation"],
    "Saturn Neecha Dosha": ["Saturn Debilitation"],
    "Rahu Kaala Dosha": ["Rahu Kalam Dosha"],
    "Durmuhurtha Dosha": ["Dur Muhurta Dosha"],
    "Northeast Vastu Dosha": ["Ishanya Vastu Dosha"],
    "Southwest Vastu Dosha": ["Nairuthi Vastu Dosha"],
    "Southeast Vastu Dosha": ["Agneya Vastu Dosha"],
    "Northwest Vastu Dosha": ["Vayavya Vastu Dosha"],
    "Brahmasthana Vastu Dosha": ["Center Vastu Dosha"],
    "Dwara Dosha": ["Main Door Defect"],
    "Veedi Potu Dosha": ["Road Thrust Dosha"],
  };
  return map[n] || [];
}

const existing = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
const parsed = parseDoshas(RAW_DOSHAS);

const mergedDoshas = new Map();
for (const entry of existing.doshaTypes || []) {
  mergedDoshas.set(slugify(entry.label), { ...entry });
}

for (const item of parsed) {
  const id = slugify(item.name);
  const current = mergedDoshas.get(id);
  const next = {
    id,
    label: item.name,
    categoryId: categoryFor(item.number),
    aliases: aliasesFor(item.name),
    description: item.description,
    problemKeywords: [],
  };
  mergedDoshas.set(id, current ? { ...current, ...next, aliases: Array.from(new Set([...(current.aliases || []), ...next.aliases])) } : next);
}

const recordLookup = new Map((existing.records || []).map((record) => [record.id, record]));

function addDoshaToRecord(recordId, label) {
  const record = recordLookup.get(recordId);
  if (!record) return;
  const list = Array.isArray(record.doshaTypes) ? record.doshaTypes : [];
  if (!list.includes(label)) list.push(label);
  record.doshaTypes = list;
}

for (const item of parsed) {
  const targets = anchorsFor(item.name);
  for (const recordId of targets) {
    addDoshaToRecord(recordId, item.name);
  }
}

existing.doshaTypes = Array.from(mergedDoshas.values()).sort((a, b) => a.label.localeCompare(b.label));
existing.records = Array.from(recordLookup.values());
existing.updatedAt = "2026-05-08";

fs.writeFileSync(DATA_PATH, `${JSON.stringify(existing, null, 2)}\n`, "utf8");
console.log(`Expanded dosha-parihara dataset: ${existing.doshaTypes.length} dosha types, ${existing.records.length} records.`);
