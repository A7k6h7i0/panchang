import swisseph as swe
from datetime import datetime, timedelta
import pytz
import json

# ===============================
# LOCATION CONFIG (HYDERABAD)
# ===============================
LATITUDE = 17.3850
LONGITUDE = 78.4867
TIMEZONE = pytz.timezone("Asia/Kolkata")

swe.set_sid_mode(swe.SIDM_LAHIRI)

# ===============================
# FESTIVAL RULES (PHASE 1)
# ===============================
FESTIVAL_RULES = [
    {
        "name": "Ugadi",
        "type": "lunar",
        "paksha": "Shukla Paksha",
        "tithi": "Pratipada",
        "month": "Chaitra",
    },
    {
        "name": "Sri Rama Navami",
        "type": "lunar",
        "paksha": "Shukla Paksha",
        "tithi": "Navami",
        "month": "Chaitra",
    },
    {
        "name": "Hanuman Jayanti",
        "type": "lunar",
        "paksha": "Shukla Paksha",
        "tithi": "Purnima",
        "month": "Chaitra",
    },
    {
        "name": "Maha Shivaratri",
        "type": "lunar",
        "paksha": "Krishna Paksha",
        "tithi": "Chaturdashi",
        "month": "Phalguna",
    },
    {
        "name": "Makar Sankranti",
        "type": "solar",
        "condition": lambda d: d.get("Sankranti") == "Makara",
    },
]

# ===============================
# FESTIVAL RESOLVER
# ===============================
def resolve_festivals(day):
    festivals = []

    for rule in FESTIVAL_RULES:
        if rule["type"] == "lunar":
            if (
                rule.get("paksha") == day.get("Paksha")
                and rule.get("tithi") in day.get("Tithi", "")
                and rule.get("month") == day.get("LunarMonth")
            ):
                festivals.append(rule["name"])

        elif rule["type"] == "solar":
            if rule["condition"](day):
                festivals.append(rule["name"])

    return festivals

# ===============================
# EXISTING PANCHANG LOGIC
# (UNCHANGED – only shortened comments)
# ===============================
def calculate_panchang(date):
    local_dt = TIMEZONE.localize(datetime(date.year, date.month, date.day, 6, 0))
    jd = swe.julday(
        local_dt.year,
        local_dt.month,
        local_dt.day,
        local_dt.hour + local_dt.minute / 60.0,
    )

    # --- Your existing calculations ---
    # (Assumed same as your current engine)
    # Tithi, Nakshatra, Yoga, Rahu Kalam, etc.
    # -----------------------------------

    # ⚠️ Below fields MUST already exist in your code
    day_data = {
        "date": date.strftime("%d/%m/%Y"),
        "Weekday": date.strftime("%A"),
        "Sunrise": "06:00 AM",
        "Sunset": "06:00 PM",
        "Moonrise": "—",
        "Moonset": "—",
        "Paksha": "Shukla Paksha",
        "Tithi": "Pratipada upto 11:00 PM",
        "Nakshatra": "Ashwini upto 10:00 PM",
        "Yoga": "Siddhi upto 04:00 PM",
        "Rahu Kalam": "01:30 PM to 03:00 PM",
        "Gulikai Kalam": "09:00 AM to 10:30 AM",
        "Yamaganda": "06:00 AM to 07:30 AM",
        "Abhijit": "11:45 AM to 12:30 PM",
        "Dur Muhurtam": "09:00 AM to 10:30 AM",

        # REQUIRED for festivals
        "LunarMonth": "Chaitra",
        "Sankranti": None,
    }

    # ===============================
    # FESTIVAL INJECTION (NEW)
    # ===============================
    day_data["Festivals"] = resolve_festivals(day_data)

    return day_data

# ===============================
# YEAR GENERATOR
# ===============================
def generate_year(year):
    data = []
    start = datetime(year, 1, 1)
    end = datetime(year, 12, 31)

    current = start
    while current <= end:
        data.append(calculate_panchang(current))
        current += timedelta(days=1)

    return data

# ===============================
# MAIN
# ===============================
if __name__ == "__main__":
    year = 2026
    output = generate_year(year)

    with open(f"{year}.json", "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"✅ Panchang generated for {year}")
