import json
import pathlib
import re


ROOT = pathlib.Path(__file__).resolve().parents[1]
FESTIVAL_FILE = ROOT / "public" / "data" / "festivals" / "2026.json"


VOWELS = ["au", "ai", "aa", "ee", "ii", "oo", "uu", "ri", "a", "i", "u", "e", "o"]
CONSONANTS = [
    "ksh", "shr", "jn", "tr", "dr", "pr", "br", "kr", "gr", "vr", "mr", "sr",
    "kh", "gh", "chh", "ch", "jh", "th", "dh", "ph", "bh", "sh", "ng", "ny",
    "k", "g", "c", "j", "t", "d", "n", "p", "b", "m", "y", "r", "l", "v", "s", "h", "f", "z", "q", "x",
]


LANGS = {
    "te": {
        "indep_vowels": {
            "a": "అ", "aa": "ఆ", "i": "ఇ", "ii": "ఈ", "u": "ఉ", "uu": "ఊ", "e": "ఎ", "ee": "ఏ", "o": "ఒ", "oo": "ఓ", "ai": "ఐ", "au": "ఔ", "ri": "ఋ",
        },
        "dep_vowels": {
            "a": "", "aa": "ా", "i": "ి", "ii": "ీ", "u": "ు", "uu": "ూ", "e": "ె", "ee": "ే", "o": "ొ", "oo": "ో", "ai": "ై", "au": "ౌ", "ri": "ృ",
        },
        "consonants": {
            "ksh": "క్ష", "shr": "శ్ర", "jn": "జ్ఞ", "tr": "త్ర", "dr": "ద్ర", "pr": "ప్ర", "br": "బ్ర", "kr": "క్ర", "gr": "గ్ర", "vr": "వ్ర", "mr": "మ్ర", "sr": "స్ర",
            "kh": "ఖ", "gh": "ఘ", "chh": "ఛ", "ch": "చ", "jh": "ఝ", "th": "థ", "dh": "ధ", "ph": "ఫ", "bh": "భ", "sh": "శ", "ng": "ఙ", "ny": "ఞ",
            "k": "క", "g": "గ", "c": "క", "j": "జ", "t": "త", "d": "ద", "n": "న", "p": "ప", "b": "బ", "m": "మ", "y": "య", "r": "ర", "l": "ల", "v": "వ", "s": "స", "h": "హ", "f": "ఫ", "z": "జ", "q": "క్వ", "x": "క్ష",
        },
    },
    "hi": {
        "indep_vowels": {
            "a": "अ", "aa": "आ", "i": "इ", "ii": "ई", "u": "उ", "uu": "ऊ", "e": "ए", "ee": "ऐ", "o": "ओ", "oo": "औ", "ai": "ऐ", "au": "औ", "ri": "ऋ",
        },
        "dep_vowels": {
            "a": "", "aa": "ा", "i": "ि", "ii": "ी", "u": "ु", "uu": "ू", "e": "े", "ee": "ै", "o": "ो", "oo": "ौ", "ai": "ै", "au": "ौ", "ri": "ृ",
        },
        "consonants": {
            "ksh": "क्ष", "shr": "श्र", "jn": "ज्ञ", "tr": "त्र", "dr": "द्र", "pr": "प्र", "br": "ब्र", "kr": "क्र", "gr": "ग्र", "vr": "व्र", "mr": "म्र", "sr": "स्र",
            "kh": "ख", "gh": "घ", "chh": "छ", "ch": "च", "jh": "झ", "th": "थ", "dh": "ध", "ph": "फ", "bh": "भ", "sh": "श", "ng": "ङ", "ny": "ञ",
            "k": "क", "g": "ग", "c": "क", "j": "ज", "t": "त", "d": "द", "n": "न", "p": "प", "b": "ब", "m": "म", "y": "य", "r": "र", "l": "ल", "v": "व", "s": "स", "h": "ह", "f": "फ", "z": "ज", "q": "क्व", "x": "क्ष",
        },
    },
    "ml": {
        "indep_vowels": {
            "a": "അ", "aa": "ആ", "i": "ഇ", "ii": "ഈ", "u": "ഉ", "uu": "ഊ", "e": "എ", "ee": "ഏ", "o": "ഒ", "oo": "ഓ", "ai": "ഐ", "au": "ഔ", "ri": "ഋ",
        },
        "dep_vowels": {
            "a": "", "aa": "ാ", "i": "ി", "ii": "ീ", "u": "ു", "uu": "ൂ", "e": "െ", "ee": "േ", "o": "ൊ", "oo": "ോ", "ai": "ൈ", "au": "ൗ", "ri": "ൃ",
        },
        "consonants": {
            "ksh": "ക്ഷ", "shr": "ശ്ര", "jn": "ജ്ഞ", "tr": "ത്ര", "dr": "ദ്ര", "pr": "പ്ര", "br": "ബ്ര", "kr": "ക്ര", "gr": "ഗ്ര", "vr": "വ്ര", "mr": "മ്ര", "sr": "സ്ര",
            "kh": "ഖ", "gh": "ഘ", "chh": "ഛ", "ch": "ച", "jh": "ഝ", "th": "ഥ", "dh": "ധ", "ph": "ഫ", "bh": "ഭ", "sh": "ശ", "ng": "ങ", "ny": "ഞ",
            "k": "ക", "g": "ഗ", "c": "ക", "j": "ജ", "t": "ത", "d": "ദ", "n": "ന", "p": "പ", "b": "ബ", "m": "മ", "y": "യ", "r": "ര", "l": "ല", "v": "വ", "s": "സ", "h": "ഹ", "f": "ഫ", "z": "ജ", "q": "ക്വ", "x": "ക്ഷ",
        },
    },
    "kn": {
        "indep_vowels": {
            "a": "ಅ", "aa": "ಆ", "i": "ಇ", "ii": "ಈ", "u": "ಉ", "uu": "ಊ", "e": "ಎ", "ee": "ಏ", "o": "ಒ", "oo": "ಓ", "ai": "ಐ", "au": "ಔ", "ri": "ಋ",
        },
        "dep_vowels": {
            "a": "", "aa": "ಾ", "i": "ಿ", "ii": "ೀ", "u": "ು", "uu": "ೂ", "e": "ೆ", "ee": "ೇ", "o": "ೊ", "oo": "ೋ", "ai": "ೈ", "au": "ೌ", "ri": "ೃ",
        },
        "consonants": {
            "ksh": "ಕ್ಷ", "shr": "ಶ್ರ", "jn": "ಜ್ಞ", "tr": "ತ್ರ", "dr": "ದ್ರ", "pr": "ಪ್ರ", "br": "ಬ್ರ", "kr": "ಕ್ರ", "gr": "ಗ್ರ", "vr": "ವ್ರ", "mr": "ಮ್ರ", "sr": "ಸ್ರ",
            "kh": "ಖ", "gh": "ಘ", "chh": "ಛ", "ch": "ಚ", "jh": "ಝ", "th": "ಥ", "dh": "ಧ", "ph": "ಫ", "bh": "ಭ", "sh": "ಶ", "ng": "ಙ", "ny": "ಞ",
            "k": "ಕ", "g": "ಗ", "c": "ಕ", "j": "ಜ", "t": "ತ", "d": "ದ", "n": "ನ", "p": "ಪ", "b": "ಬ", "m": "ಮ", "y": "ಯ", "r": "ರ", "l": "ಲ", "v": "ವ", "s": "ಸ", "h": "ಹ", "f": "ಫ", "z": "ಜ", "q": "ಕ್ವ", "x": "ಕ್ಷ",
        },
    },
    "ta": {
        "indep_vowels": {
            "a": "அ", "aa": "ஆ", "i": "இ", "ii": "ஈ", "u": "உ", "uu": "ஊ", "e": "எ", "ee": "ஏ", "o": "ஒ", "oo": "ஓ", "ai": "ஐ", "au": "ஔ", "ri": "஋",
        },
        "dep_vowels": {
            "a": "", "aa": "ா", "i": "ி", "ii": "ீ", "u": "ு", "uu": "ூ", "e": "ெ", "ee": "ே", "o": "ொ", "oo": "ோ", "ai": "ை", "au": "ௌ", "ri": "்ரு",
        },
        "consonants": {
            "ksh": "க்ஷ", "shr": "ஷ்ர", "jn": "ஜ்ஞ", "tr": "த்ர", "dr": "த்ர", "pr": "ப்ர", "br": "ப்ர", "kr": "க்ர", "gr": "க்ர", "vr": "வ்ர", "mr": "ம்ர", "sr": "ஸ்ர",
            "kh": "க", "gh": "க", "chh": "ச", "ch": "ச", "jh": "ஜ", "th": "த", "dh": "த", "ph": "ப", "bh": "ப", "sh": "ஷ", "ng": "ங", "ny": "ஞ",
            "k": "க", "g": "க", "c": "க", "j": "ஜ", "t": "த", "d": "த", "n": "ந", "p": "ப", "b": "ப", "m": "ம", "y": "ய", "r": "ர", "l": "ல", "v": "வ", "s": "ஸ", "h": "ஹ", "f": "ஃப", "z": "ஜ", "q": "க்வ", "x": "க்ஷ",
        },
    },
}


PHRASE_OVERRIDES = {
    "te": {
        "New Year": "నూతన సంవత్సరం",
        "Republic Day (India)": "గణతంత్ర దినోత్సవం (భారతదేశం)",
        "Indian Army Day": "భారత సేన దినం",
        "National Youth Day (Swami Vivekananda Jayanti)": "జాతీయ యువజన దినం (స్వామి వివేకానంద జయంతి)",
        "Martyrs' Day (Mahatma Gandhi)": "శహీదుల దినం (మహాత్మా గాంధీ)",
        "National Science Day": "జాతీయ విజ్ఞాన దినం",
        "International Women's Day": "అంతర్జాతీయ మహిళా దినోత్సవం",
        "Children’s Day (Jawaharlal Nehru Jayanti)": "బాలల దినోత్సవం (జవహర్‌లాల్ నెహ్రూ జయంతి)",
        "Independence Day (India)": "స్వాతంత్ర్య దినోత్సవం (భారతదేశం)",
        "Teachers’ Day (Dr. Sarvepalli Radhakrishnan Jayanti)": "ఉపాధ్యాయుల దినోత్సవం (డా. సర్వేపల్లి రాధాకృష్ణన్ జయంతి)",
        "International Day of Non-Violence": "అంతర్జాతీయ అహింసా దినం",
        "International Yoga Day": "అంతర్జాతీయ యోగా దినోత్సవం",
        "Christmas": "క్రిస్మస్",
        "Solar New Year": "సౌర నూతన సంవత్సరం",
    },
    "hi": {
        "New Year": "नव वर्ष",
        "Republic Day (India)": "गणतंत्र दिवस (भारत)",
        "Indian Army Day": "भारतीय सेना दिवस",
        "National Youth Day (Swami Vivekananda Jayanti)": "राष्ट्रीय युवा दिवस (स्वामी विवेकानंद जयंती)",
        "Martyrs' Day (Mahatma Gandhi)": "शहीद दिवस (महात्मा गांधी)",
        "National Science Day": "राष्ट्रीय विज्ञान दिवस",
        "International Women's Day": "अंतरराष्ट्रीय महिला दिवस",
        "Children’s Day (Jawaharlal Nehru Jayanti)": "बाल दिवस (जवाहरलाल नेहरू जयंती)",
        "Independence Day (India)": "स्वतंत्रता दिवस (भारत)",
        "Teachers’ Day (Dr. Sarvepalli Radhakrishnan Jayanti)": "शिक्षक दिवस (डॉ. सर्वपल्ली राधाकृष्णन जयंती)",
        "International Day of Non-Violence": "अंतरराष्ट्रीय अहिंसा दिवस",
        "International Yoga Day": "अंतरराष्ट्रीय योग दिवस",
        "Christmas": "क्रिसमस",
        "Solar New Year": "सौर नव वर्ष",
    },
    "ml": {
        "New Year": "പുതുവത്സരം",
        "Republic Day (India)": "ഗണതന്ത്ര ദിനം (ഇന്ത്യ)",
        "Indian Army Day": "ഇന്ത്യൻ സേനാ ദിനം",
        "National Youth Day (Swami Vivekananda Jayanti)": "ദേശീയ യുവജന ദിനം (സ്വാമി വിവേകാനന്ദ ജയന്തി)",
        "Martyrs' Day (Mahatma Gandhi)": "ശഹീദ ദിനം (മഹാത്മാ ഗാന്ധി)",
        "National Science Day": "ദേശീയ ശാസ്ത്ര ദിനം",
        "International Women's Day": "അന്താരാഷ്ട്ര വനിതാ ദിനം",
        "Children’s Day (Jawaharlal Nehru Jayanti)": "ബാലദിനം (ജവഹർലാൽ നെഹ്റു ജയന്തി)",
        "Independence Day (India)": "സ്വാതന്ത്ര്യ ദിനം (ഇന്ത്യ)",
        "Teachers’ Day (Dr. Sarvepalli Radhakrishnan Jayanti)": "അധ്യാപക ദിനം (ഡോ. സർവേപ്പള്ളി രാധാകൃഷ്ണൻ ജയന്തി)",
        "International Day of Non-Violence": "അന്താരാഷ്ട്ര അഹിംസ ദിനം",
        "International Yoga Day": "അന്താരാഷ്ട്ര യോഗ ദിനം",
        "Christmas": "ക്രിസ്മസ്",
        "Solar New Year": "സൗര പുതുവത്സരം",
    },
    "kn": {
        "New Year": "ಹೊಸ ವರ್ಷ",
        "Republic Day (India)": "ಗಣರಾಜ್ಯೋತ್ಸವ (ಭಾರತ)",
        "Indian Army Day": "ಭಾರತೀಯ ಸೇನಾ ದಿನ",
        "National Youth Day (Swami Vivekananda Jayanti)": "ರಾಷ್ಟ್ರೀಯ ಯುವಜನ ದಿನ (ಸ್ವಾಮಿ ವಿವೇಕಾನಂದ ಜಯಂತಿ)",
        "Martyrs' Day (Mahatma Gandhi)": "ಶಹೀದ್ ದಿನ (ಮಹಾತ್ಮಾ ಗಾಂಧೀಜಿ)",
        "National Science Day": "ರಾಷ್ಟ್ರೀಯ ವಿಜ್ಞಾನ ದಿನ",
        "International Women's Day": "ಅಂತರರಾಷ್ಟ್ರೀಯ ಮಹಿಳಾ ದಿನ",
        "Children’s Day (Jawaharlal Nehru Jayanti)": "ಮಕ್ಕಳ ದಿನ (ಜವಹರ್ಲಾಲ್ ನೆಹರೂ ಜಯಂತಿ)",
        "Independence Day (India)": "ಸ್ವಾತಂತ್ರ್ಯ ದಿನ (ಭಾರತ)",
        "Teachers’ Day (Dr. Sarvepalli Radhakrishnan Jayanti)": "ಶಿಕ್ಷಕರ ದಿನ (ಡಾ. ಸರ್ವಪಲ್ಲಿ ರಾಧಾಕೃಷ್ಣನ್ ಜಯಂತಿ)",
        "International Day of Non-Violence": "ಅಂತರರಾಷ್ಟ್ರೀಯ ಅಹಿಂಸೆ ದಿನ",
        "International Yoga Day": "ಅಂತರರಾಷ್ಟ್ರೀಯ ಯೋಗ ದಿನ",
        "Christmas": "ಕ್ರಿಸ್ಮಸ್",
        "Solar New Year": "ಸೌರ ಹೊಸ ವರ್ಷ",
    },
    "ta": {
        "New Year": "புத்தாண்டு",
        "Republic Day (India)": "குடியரசு தினம் (இந்தியா)",
        "Indian Army Day": "இந்திய ராணுவ தினம்",
        "National Youth Day (Swami Vivekananda Jayanti)": "தேசிய இளைஞர் தினம் (சுவாமி விவேகானந்தர் ஜயந்தி)",
        "Martyrs' Day (Mahatma Gandhi)": "தியாகிகள் தினம் (மகாத்மா காந்தி)",
        "National Science Day": "தேசிய அறிவியல் தினம்",
        "International Women's Day": "சர்வதேச மகளிர் தினம்",
        "Children’s Day (Jawaharlal Nehru Jayanti)": "குழந்தைகள் தினம் (ஜவஹர்லால் நேரு ஜயந்தி)",
        "Independence Day (India)": "சுதந்திர தினம் (இந்தியா)",
        "Teachers’ Day (Dr. Sarvepalli Radhakrishnan Jayanti)": "ஆசிரியர் தினம் (டாக்டர். சர்வபள்ளி ராதாகிருஷ்ணன் ஜயந்தி)",
        "International Day of Non-Violence": "சர்வதேச அஹிம்சை தினம்",
        "International Yoga Day": "சர்வதேச யோகா தினம்",
        "Christmas": "கிறிஸ்துமஸ்",
        "Solar New Year": "சூரிய புத்தாண்டு",
    },
}


def normalize_text(value: str) -> str:
    return (
        value.replace("’", "'")
        .replace("“", '"')
        .replace("”", '"')
        .replace("–", "-")
        .replace("—", "-")
    )


def transliterate_word(word: str, lang: str) -> str:
    spec = LANGS[lang]
    lower = normalize_text(word.lower())
    i = 0
    out = []

    def match(seq_list, pos):
        for seq in seq_list:
            if lower.startswith(seq, pos):
                return seq
        return ""

    while i < len(lower):
        ch = lower[i]
        if not ch.isalpha():
            out.append(word[i])
            i += 1
            continue

        consonant = match(CONSONANTS, i)
        if consonant:
            i += len(consonant)
            vowel = match(VOWELS, i)
            if vowel:
                i += len(vowel)
            else:
                vowel = "a"
            base = spec["consonants"].get(consonant, consonant)
            sign = spec["dep_vowels"].get(vowel, "")
            out.append(base + sign)
            continue

        vowel = match(VOWELS, i)
        if vowel:
            out.append(spec["indep_vowels"].get(vowel, vowel))
            i += len(vowel)
            continue

        out.append(word[i])
        i += 1

    return "".join(out)


def transliterate_phrase(text: str, lang: str) -> str:
    text = normalize_text(text)
    parts = re.split(r"(\s+|[()&,'\"-])", text)
    out = []
    for part in parts:
        if not part:
            continue
        if part.strip() == "":
            out.append(part)
            continue
        if re.fullmatch(r"[()&,'\"-]", part):
            out.append(part)
            continue
        out.append(transliterate_word(part, lang))
    return "".join(out)


def translate_name(name: str, lang: str) -> str:
    if name in PHRASE_OVERRIDES.get(lang, {}):
        return PHRASE_OVERRIDES[lang][name]
    return transliterate_phrase(name, lang)


def main() -> None:
    raw = FESTIVAL_FILE.read_text(encoding="utf-8-sig")
    data = json.loads(raw)

    names = sorted(
        {
            str(name)
            for value in data.values()
            if isinstance(value, list)
            for name in value
            if isinstance(name, str) and name.strip()
        }
    )

    festival_translations = {
        lang: {name: translate_name(name, lang) for name in names}
        for lang in LANGS
    }

    data["festivalTranslations"] = festival_translations
    FESTIVAL_FILE.write_text(
        json.dumps(data, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
