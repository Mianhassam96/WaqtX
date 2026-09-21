'use strict';
/* ═══════════════════════════════════════════════
   WaqtX — Today Page  (Phase 1.2 rebuild)

   Hierarchy:
     Level 1 — Primary:    Where am I in time? What's next?
     Level 2 — Secondary:  Prayer rhythm, guidance, one action
     Level 3 — Discovery:  Muhasabah, history, journey

   Storage contracts (core.js):
     WaqtX.getMuhasabah(dateKey)
     WaqtX.saveMuhasabahField(key, value, dateKey)
     WaqtX.MUHASABAH_FIELDS
     WaqtX.keys.tracker(dateKey)
     WaqtX.profile.getDob()
   ═══════════════════════════════════════════════ */

var S           = WaqtX.storage;
var PRAYERS_5   = ['Fajr','Dhuhr','Asr','Maghrib','Isha'];
var PRAYER_ICONS = { Fajr:'🌙', Dhuhr:'☀️', Asr:'🌤️', Maghrib:'🌇', Isha:'🌃' };
var _ticker     = null;

/* ══════════════════════════════════════
   HELPERS
   ══════════════════════════════════════ */
function _todayKey() { return getDateKey(0); }

function _esc(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

/* ══════════════════════════════════════
   LEVEL 1 — HERO: dates
   ══════════════════════════════════════ */
function initHeroDates() {
  var now  = new Date();
  var DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  var MONS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  setText('hero-day-name',  DAYS[now.getDay()]);
  setText('hero-greg-date', now.getDate() + ' ' + MONS[now.getMonth()] + ' ' + now.getFullYear());

  var h = toHijri(now);
  setText('hero-hijri-date', h.day + ' ' + HIJRI_MONTHS[h.month - 1] + ' ' + h.year + ' AH');
}

/* ══════════════════════════════════════
   LEVEL 1 — NEXT PRAYER + COUNTDOWN
   ══════════════════════════════════════ */
function renderNextPrayer(timings) {
  var next = WaqtX.prayer.getNext(timings);
  if (!next) return;

  var rawTime  = timings[next.name] || '';
  var cleanTime = rawTime.split(' ')[0];

  setText('nps-name', next.name + (next.isTomorrow ? ' (tomorrow)' : ''));
  setText('nps-time', cleanTime);

  /* Live countdown */
  clearInterval(_ticker);
  function tick() {
    var now    = new Date();
    var nowSec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    var nextSec = WaqtX.prayer.timeToMin(timings[next.name]) * 60;
    var diff = nextSec - nowSec;
    if (diff < 0) diff += 86400;
    setText('nps-countdown', WaqtX.prayer.formatCountdown(diff) + ' away');
  }
  tick();
  _ticker = setInterval(tick, 1000);
}

/* ══════════════════════════════════════
   LEVEL 2 — PRAYER RHYTHM (5 pills)
   ══════════════════════════════════════ */
function renderPrayerRhythm(timings) {
  var now    = new Date();
  var nowMin = now.getHours() * 60 + now.getMinutes();
  var next   = timings ? WaqtX.prayer.getNext(timings) : null;
  var logged = S.get(WaqtX.keys.tracker(_todayKey())) || {};

  PRAYERS_5.forEach(function(p) {
    var item   = document.querySelector('.td-pr-item[data-prayer="' + p + '"]');
    var dotEl  = el('pr-dot-' + p);
    var timeEl = el('pr-time-' + p);

    if (!item) return;

    /* Time */
    if (timings && timings[p]) {
      var clean = timings[p].split(' ')[0];
      if (timeEl) { timeEl.textContent = clean; timeEl.classList.remove('skeleton','skeleton-sm'); }
    } else {
      if (timeEl) { timeEl.textContent = '--:--'; timeEl.classList.remove('skeleton','skeleton-sm'); }
    }

    /* State classes */
    item.classList.remove('td-pr-next','td-pr-done','td-pr-missed');

    if (!timings) return;

    var pMin = WaqtX.prayer.timeToMin(timings[p] || '');
    var isNext = next && p === next.name && !next.isTomorrow;

    if (isNext) {
      item.classList.add('td-pr-next');
      if (dotEl) dotEl.textContent = PRAYER_ICONS[p] || '●';
    } else if (pMin < nowMin) {
      item.classList.add(logged[p] ? 'td-pr-done' : 'td-pr-missed');
      if (dotEl) dotEl.textContent = logged[p] ? '✓' : PRAYER_ICONS[p] || '●';
    } else {
      if (dotEl) dotEl.textContent = PRAYER_ICONS[p] || '●';
    }
  });
}

/* ══════════════════════════════════════
   LEVEL 2 — DAILY GUIDANCE (Ayah + action)
   Gracefully degrades if DAILY_ACTIONS missing
   ══════════════════════════════════════ */
function initGuidance() {
  if (!window.DAILY_AYAHS || !DAILY_AYAHS.length) return;

  var doy  = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  var ayah = DAILY_AYAHS[doy % DAILY_AYAHS.length];

  /* Ayah */
  var arabicEl = el('gc-arabic');
  if (arabicEl) { arabicEl.innerHTML = ''; arabicEl.textContent = ayah.arabic; }
  setText('gc-translation', ayah.translation);
  setText('gc-source',      ayah.source);
  setText('gc-reflection',  ayah.reflection || '');

  /* Action — optional, degrades gracefully */
  var actionCard = el('action-card');
  if (window.DAILY_ACTIONS && DAILY_ACTIONS.length) {
    var action = DAILY_ACTIONS[doy % DAILY_ACTIONS.length];
    setText('action-text', action.action || '');
    setText('action-why',  action.why    || '');

    var doneKey = 'action_done_' + _todayKey();
    var doneBtn = el('btn-action-done');
    var doneMsg = el('action-done-msg');

    if (S.get(doneKey)) {
      if (doneBtn) doneBtn.classList.add('hidden');
      if (doneMsg) doneMsg.classList.remove('hidden');
    }
    if (doneBtn) {
      doneBtn.addEventListener('click', function() {
        S.set(doneKey, true);
        doneBtn.classList.add('hidden');
        if (doneMsg) doneMsg.classList.remove('hidden');
      });
    }

    var shareBtn = el('btn-action-share');
    if (shareBtn) {
      shareBtn.addEventListener('click', function() {
        var text = (action.action || '') + '\n\n— WaqtX · mianhassam96.github.io/WaqtX/';
        if (navigator.share) {
          navigator.share({ title: 'WaqtX — One Action Today', text: text });
        } else if (navigator.clipboard) {
          navigator.clipboard.writeText(text).then(function() {
            var orig = shareBtn.textContent;
            shareBtn.textContent = '✓ Copied';
            setTimeout(function() { shareBtn.textContent = orig; }, 2000);
          });
        }
      });
    }
  } else {
    /* No action data — hide action card cleanly */
    if (actionCard) actionCard.style.display = 'none';
  }
}

/* ══════════════════════════════════════
   LEVEL 3 — MUHASABAH (quick entry)
   Uses canonical WaqtX storage contracts
   ══════════════════════════════════════ */
var _mqTimer = null;

function initMuhasabah() {
  var today = _todayKey();
  var saved = WaqtX.getMuhasabah(today);

  WaqtX.MUHASABAH_FIELDS.forEach(function(f) {
    var ta = el(f.id);
    if (!ta) return;
    ta.value = saved[f.key] || '';
    ta.addEventListener('input', function() {
      WaqtX.saveMuhasabahField(f.key, ta.value, today);
      clearTimeout(_mqTimer);
      _mqTimer = setTimeout(_updateMqStatus, 500);
    });
  });

  _updateMqStatus();
}

function _updateMqStatus() {
  var saved  = WaqtX.getMuhasabah(_todayKey());
  var filled = WaqtX.MUHASABAH_FIELDS.filter(function(f) {
    return (saved[f.key] || '').trim().length > 0;
  }).length;
  var statusEl = el('mq-save-status');
  if (!statusEl) return;
  if      (filled === 0) { statusEl.textContent = ''; statusEl.className = 'td-mq-status'; }
  else if (filled <  3)  { statusEl.textContent = filled + ' of 3 saved'; statusEl.className = 'td-mq-status td-mq-partial'; }
  else                   { statusEl.textContent = 'Saved — Alhamdulillah'; statusEl.className = 'td-mq-status td-mq-complete'; }
}

/* ══════════════════════════════════════
   LEVEL 3 — THIS DAY IN HISTORY
   ══════════════════════════════════════ */
function initThisDay() {
  var now  = new Date();
  var MONS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  setText('td-day',   now.getDate());
  setText('td-month', MONS[now.getMonth()]);

  if (!window.WAQTX_HISTORY || !WAQTX_HISTORY.getTodayEntry) {
    setText('td-title', 'History data loading…');
    return;
  }

  var entry  = WAQTX_HISTORY.getTodayEntry();
  var linkEl = el('td-link');

  if (!entry) {
    setText('td-era',     '');
    setText('td-year',    '');
    setText('td-title',   'No major event recorded for this date yet.');
    setText('td-summary', 'History entries are added regularly.');
    if (linkEl) linkEl.classList.add('hidden');
    return;
  }

  var H = WAQTX_HISTORY;
  setText('td-year',    entry.date ? (entry.date.gregorian || '') : '');
  setText('td-era',     H.ERA_LABELS ? (H.ERA_LABELS[entry.era] || entry.era) : entry.era);
  setText('td-title',   entry.title   || '');
  setText('td-summary', entry.summary || '');

  var badgesEl = el('td-sources');
  if (badgesEl && entry.sources && entry.sources.length) {
    badgesEl.innerHTML = entry.sources.slice(0, 3).map(function(src) {
      var label = H.sourceTypeLabel ? H.sourceTypeLabel(src.type) : src.type;
      var cls   = H.evClass ? H.evClass(src.type) : 'ev-academic';
      return '<span class="ev-badge ' + cls + '">' +
             '<span class="ev-badge-dot" aria-hidden="true"></span>' +
             _esc(label) +
             (src.ref ? ': ' + _esc(src.ref.substring(0, 28)) + (src.ref.length > 28 ? '…' : '') : '') +
             '</span>';
    }).join('');
  }

  if (linkEl) {
    var q = encodeURIComponent((entry.title || '').replace(/\s*[—–\-].*$/, '').trim());
    linkEl.href = 'search.html?q=' + q;
    linkEl.classList.remove('hidden');
  }
}

/* ══════════════════════════════════════
   LEVEL 3 — JOURNEY SNAPSHOT
   ══════════════════════════════════════ */
function initJourneySnapshot() {
  var dob     = WaqtX.profile.getDob();
  var noDobEl = el('js-no-dob');
  var gridEl  = el('journey-stats');

  if (!dob) {
    if (noDobEl) noDobEl.classList.remove('hidden');
    if (gridEl)  gridEl.style.display = 'none';
    return;
  }

  if (noDobEl) noDobEl.classList.add('hidden');
  if (gridEl)  gridEl.style.display = '';

  try {
    var parts = dob.split('-');
    var birth = new Date(+parts[0], +parts[1] - 1, +parts[2]);
    var days  = Math.floor((Date.now() - birth.getTime()) / 86400000);
    var ageYrs = days / 365.25;

    setText('js-ramadans', Math.floor(ageYrs).toLocaleString());
    setText('js-jumuahs',  Math.floor(days / 7).toLocaleString());
    setText('js-prayers',  (days * 5).toLocaleString());
    setText('js-laylatul', Math.floor(ageYrs).toLocaleString());
  } catch(e) {}
}

/* ══════════════════════════════════════
   PRAYER LOAD + NO-LOCATION STATE
   ══════════════════════════════════════ */
function _showNoLocation() {
  var noLoc = el('prayer-no-location');
  if (noLoc) noLoc.classList.remove('hidden');
  var nameEl = el('nps-name');
  if (nameEl) { nameEl.innerHTML = ''; nameEl.textContent = 'No location set'; }
  var timeEl = el('nps-time');
  if (timeEl) timeEl.innerHTML = '';
  var cdEl = el('nps-countdown');
  if (cdEl) cdEl.textContent = '';
  renderPrayerRhythm(null);
}

function _hideNoLocation() {
  var noLoc = el('prayer-no-location');
  if (noLoc) noLoc.classList.add('hidden');
}

function initPrayer() {
  var cached = WaqtX.prayer.getCached();

  if (cached) {
    _hideNoLocation();
    renderNextPrayer(cached);
    renderPrayerRhythm(cached);
  } else {
    var lat = S.get('location_lat');
    var lng = S.get('location_lng');
    if (lat && lng) {
      /* Show placeholders while fetching */
      renderPrayerRhythm(null);
      WaqtX.prayer.fetch(lat, lng, function(timings) {
        _hideNoLocation();
        renderNextPrayer(timings);
        renderPrayerRhythm(timings);
      }, function() {
        _showNoLocation();
      });
    } else {
      _showNoLocation();
    }
  }
}

/* ══════════════════════════════════════
   BOOT
   ══════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function() {
  initHeroDates();
  initPrayer();
  initGuidance();
  initMuhasabah();
  initThisDay();
  initJourneySnapshot();

  /* Refresh prayer rhythm every minute */
  setInterval(function() {
    var t = WaqtX.prayer.getCached();
    if (t) {
      renderPrayerRhythm(t);
      renderNextPrayer(t);
    }
  }, 60000);
});
