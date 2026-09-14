# WaqtX V2 — Your Time. Your Faith. Your History.

> *"By time — indeed, mankind is in loss. Except for those who have believed and done righteous deeds."*
> — Quran 103:1–3

An **immersive Islamic knowledge and personal reflection experience** built as a privacy-first, offline-capable PWA. No frameworks. No backend. No accounts. Everything lives on your device.

🔗 **Live:** [mianhassam96.github.io/WaqtX](https://mianhassam96.github.io/WaqtX/)
📦 **Repo:** [github.com/Mianhassam96/WaqtX](https://github.com/Mianhassam96/WaqtX)
🏢 **Built by:** [MultiMian](https://multimian.com)

---

## Vision

Rather than competing with apps that provide every Islamic utility, WaqtX owns a specific, distinctive identity:

> **Islamic Time & History** — connecting your personal journey through time with the larger story of Islamic civilization.

---
 
## The 3 Pillars

| Pillar | Description |
|--------|-------------|
| 🕰️ **Your Time** | Personal timeline, prayer rhythm, Hijri calendar, life milestones |
| 📚 **Islamic History** | Interactive exploration of 1400 years of Islamic civilization |
| 🌙 **Daily Reflection** | Ayah → Hadith → Story → Lesson → Action → Muhasabah |

---
 
## Pages

| Page | Description |
|------|-------------|
| `index.html` | Homepage — hero, prayer rhythm, guidance, This Day in History, civilization strip, journey, muhasabah |
| `explore.html` | **NEW** — Islamic History Explorer with interactive timeline, search, filter, and detail modal |
| `prayers.html` | Prayer orbit, schedule, weekly tracker, streak, notifications |
| `journey.html` | Islamic milestones, counters, Life Remaining ring, Time Capsule |
| `reflection.html` | Daily verse + audio, Muhasabah (3 questions), gratitude journal, personal notes |
| `profile.html` | Spiritual Growth Dashboard, statistics, achievements |
| `calendar.html` | Hijri/Gregorian calendar, Islamic events |
| `qibla.html` | Qibla compass (device geolocation) |
| `settings.html` | Prayer method, theme, language, location, notifications, accessibility |
| `stories.html` | Stories of Prophets, Companions, Women — with "When You Feel…" entry |
| `privacy.html` | Privacy policy |

---

## What's New in V2

### Navigation
- 3-pillar top nav: **Your Time** · **Islamic History** · **Reflection**
- Mobile hamburger with slide-down drawer
- Unified bottom nav (5 items + More menu with 6 links)
- Active page highlighting across all pages

### Design System
- Full CSS redesign with 30 component sections
- Islamic gold (`#C9A84C`) + teal accent system
- Dark / Light / Ramadan / Friday themes
- Evidence badge components: 🟢 Quran · 🔵 Hadith · 🟣 Classical · 🟡 Academic · ⚠️ Disputed
- Timeline component, era band labels, history cards

### Islamic History Explorer (`explore.html`)
- Interactive timeline filtered by era (Seerah / Rashidun / Umayyad / Abbasid / Ottoman)
- Grid of all history entries: Events · People · Dynasties · Places
- Full-text search across titles, summaries, and tags
- Detail modal with sources panel, key people, related events, and certainty level
- URL params: `explore.html?filter=seerah` etc.

### History Knowledge Base (`js/history-data.js`)
Structured schema with full source attribution:

```js
{
  id, type, era, title, subtitle,
  date: { hijri, gregorian },
  location,
  summary, details,
  people[], relatedEvents[], relatedPlaces[],
  sources: [{ type, ref, note }],
  certainty,   // established | probable | disputed
  tags[]
}
```

**Current entries:** 10 events · 7 people · 5 dynasties · 4 places

---

## Source & Evidence System

WaqtX distinguishes clearly between:
- **Quran** — direct verse references
- **Hadith** — collection + chapter + number + grading
- **Classical** — traditional Muslim scholarly sources (Ibn Hisham, al-Tabari, Ibn Sa'd…)
- **Academic** — modern historical scholarship
- **Disputed** — where different accounts exist, we say so

This makes WaqtX more credible, not less.

---

## Tech Stack

- **Vanilla HTML / CSS / JavaScript** — zero dependencies, no build step
- **localStorage** — all personal data stored privately on device (`waqtx_*`)
- **AlAdhan API** — prayer times (free, no key required)
- **PWA** — installable, service worker v20, offline support
- **4 languages** — runtime JSON-based i18n (EN / UR / AR / Roman Urdu)
- **4 themes** — CSS variable switching

---

## Project Structure

```
WaqtX/
├── index.html          # Homepage
├── explore.html        # Islamic History Explorer (NEW V2)
├── prayers.html
├── journey.html
├── reflection.html
├── profile.html
├── calendar.html
├── qibla.html
├── settings.html
├── stories.html
├── privacy.html
├── style.css           # Full V2 design system (30 sections)
├── style-pages.css     # Legacy sub-page styles
├── app.js              # Legacy home logic
├── daily-islam.js      # Ayah / Dua / Action data
├── stories-data.js     # Story content
├── stories.js          # Stories page logic
├── sw.js               # Service worker (cache v20)
├── sw-register.js      # SW registration
├── manifest.json       # PWA manifest (V2)
├── favicon.svg
├── lang/               # i18n (en, ur, ar, roman)
└── js/
    ├── core.js         # Shared: theme, lang, nav, Hijri, prayer
    ├── home.js         # Homepage logic
    ├── explore.js      # History Explorer logic (NEW V2)
    ├── history-data.js # Structured history knowledge base (NEW V2)
    ├── prayers.js
    ├── journey.js
    ├── reflection.js
    ├── profile.js
    ├── settings.js
    └── calendar.js
```

---

## Phase Roadmap

| Phase | Status | Description |
|-------|--------|-------------|
| Phase 1 — Foundation | ✅ **Complete** | Design system, navigation, homepage, history data, explore page |
| Phase 2 — Today Experience | 🔜 | Unified "Today" page |
| Phase 3 — History Engine | 🔜 | Full data: all prophets, caliphates, scholars, events |
| Phase 4 — Interactive Timeline | 🔜 | Visual, scrollable, zoomable timeline |
| Phase 5 — Knowledge Explorer | 🔜 | Search + related items network |
| Phase 6 — Daily History | 🔜 | Every day surfaces a relevant historical event |
| Phase 7 — Reflection V2 | 🔜 | History connected to personal growth |
| Phase 8 — AI Layer | 🔜 | Ask WaqtX — from verified knowledge base only |
| Phase 9 — PWA Hardening | 🔜 | Full offline, background sync |

---

## Privacy

All personal data (prayers, journal, streak, preferences) is stored exclusively in your browser's `localStorage`. Nothing is sent to any server. No accounts, no tracking, no ads.

---

## License

MIT © 2026 [MultiMian](https://multimian.com)
