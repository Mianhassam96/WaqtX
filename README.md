# ✦ WaqtX — Your Time is a Trust

> *"By time — indeed, mankind is in loss. Except for those who have believed and done righteous deeds."*
> — Quran 103:1-3

A **Muslim personal growth dashboard** built with vanilla HTML, CSS, and JavaScript. No frameworks. No backend. 100% private — everything lives on your device.

🔗 **Live:** [mianhassam96.github.io/WaqtX](https://mianhassam96.github.io/WaqtX/)
📦 **Repo:** [github.com/Mianhassam96/WaqtX](https://github.com/Mianhassam96/WaqtX)

---

## Pages

| Page | Description |
|------|-------------|
| `index.html` | Home — hero, prayer rhythm, Today's Guidance, Journey Snapshot, This Day in Islam |
| `prayers.html` | Prayer orbit, schedule, weekly tracker, consistency scores, post-prayer reflection |
| `journey.html` | Islamic milestones, counters (Ramadans, Jumu'ahs, Laylat al-Qadr), Life Remaining, Time Capsule |
| `reflection.html` | Daily verse, Daily Muhasabah (3 nightly questions), gratitude journal, personal notes |
| `profile.html` | Spiritual Growth Dashboard, statistics, achievements |
| `calendar.html` | Hijri / Gregorian calendar |
| `qibla.html` | Qibla compass (device geolocation) |
| `settings.html` | Prayer method, theme, language, location, notifications, accessibility |
| `stories.html` | Stories of Prophets, Companions, Women — with emotional "When You Feel…" entry |
| `privacy.html` | Privacy policy |

---

## Features

### 🏠 Home
- Premium hero: *"Your time is a trust. See how you are spending it."*
- DOB input → reveals personal Islamic dashboard (Ramadans, Hajj seasons, Hijri birthday, world events at birth)
- Prayer Rhythm — live timeline + today's prayer status cards
- Today's Guidance — Ayah of the Day + Dua of the Day + One Action Today (merged, single premium section)
- Journey Snapshot — streak, journal days, Ramadans witnessed, next Jumu'ah
- This Day in Islam — daily hadith/wakeup system

### 🕌 Prayers
- SVG Prayer Orbit — unique visual showing all 6 prayer times on a radial arc
- Weekly prayer tracker (tap to mark)
- Salah Consistency scores — weekly % + monthly % with colour-coded bars
- After Prayer Reflection — one optional note per prayer per day
- Prayer notifications (Adhan / Reminder / Silent)

### 🌙 Journey (My Amanah)
- Islamic Journey Milestones — replaces generic life stages with spiritually meaningful markers
- Extended counters: Ramadans, Eids, Jumu'ahs, Laylat al-Qadr opportunities, fasting days, prayer moments
- Life Remaining — reflection-focused ring showing % of journey with estimated remaining Ramadans/Jumu'ahs
- Islamic Time Capsule — downloadable/shareable card

### 🪔 Reflection
- Daily verse with Quran audio playback
- **Daily Muhasabah** — 3 nightly questions (gratitude / mistake to correct / good deed), saved per day
- Reflection streak tracker
- Gratitude journal (3 blessings daily)
- Personal notes (persistent)

### 👤 Profile
- **Spiritual Growth Dashboard** — 4 consistency scores: Prayer, Muhasabah, Gratitude, Journey Completion
- Statistics — prayers logged, muhasabah days, gratitude days, streak, next Jumu'ah
- Achievements — 8 unlockable badges

### 📖 Stories
- Stories of Prophets, Companions, Women of Islam, Hard Moments
- **When You Feel…** — 10 emotional entry points (Lost, Alone, Guilty, Angry, Afraid, Heartbroken, Overwhelmed, Grieving, Misunderstood, Unmotivated) → each recommends a relevant story
- Full story modal: The Moment → What Happened → The Decision → Your Reflection → One Action Today
- Search by name or feeling

### ⚙️ Settings
- Prayer calculation method (7 methods)
- Theme: Dark / Light / Ramadan / Friday (auto Ramadan detection)
- Language: English / اردو / العربية / Roman Urdu
- Location: auto GPS or manual city lookup
- Prayer notifications, font size, high contrast
- Clear all data

---

## Tech Stack

- **Vanilla HTML / CSS / JavaScript** — zero dependencies, no build step
- **localStorage** — all data stored privately on device, namespaced `waqtx_*`
- **AlAdhan API** — prayer times (free, no key required)
- **Kuwaiti algorithm** — built-in Hijri date conversion (accurate ±1 day)
- **PWA** — installable, service worker, offline support
- **4 languages** — runtime JSON-based i18n
- **4 themes** — CSS variable switching

---

## Project Structure

```
WaqtX/
├── index.html          # Home
├── prayers.html        # Prayers
├── journey.html        # Journey
├── reflection.html     # Reflection
├── profile.html        # Profile
├── calendar.html       # Calendar
├── qibla.html          # Qibla
├── settings.html       # Settings
├── stories.html        # Stories
├── privacy.html        # Privacy
├── app.js              # Home page logic (DOB calculator, tracker, share)
├── daily-islam.js      # Ayah / Dua / Action daily content
├── stories-data.js     # All story content
├── stories.js          # Stories page logic
├── style.css           # Global styles + themes + variables
├── style-pages.css     # Sub-page styles
├── manifest.json       # PWA manifest
├── sw.js               # Service worker
├── favicon.svg         # Favicon
├── lang/               # Translation files (en, ur, ar, roman)
└── js/
    ├── core.js         # Shared: theme, lang, nav, Hijri, prayer helpers
    ├── prayers.js      # Prayers page
    ├── journey.js      # Journey page
    ├── reflection.js   # Reflection page
    ├── profile.js      # Profile page
    ├── settings.js     # Settings page
    └── calendar.js     # Calendar page
```

---

## Privacy

All data is stored exclusively in your browser's `localStorage`. Nothing is sent to any server. No accounts, no tracking, no ads.

---

## License

MIT © 2026 [MultiMian](https://multimian.com)
