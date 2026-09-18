'use strict';
/* ═══════════════════════════════════════════════
   WaqtX V3 — Home (Today) Page Logic
   Targets V3 index.html IDs.

   Sections:
   ─ Today hero: date badges, next prayer strip
   ─ Prayer rhythm: 5-pill component
   ─ Daily guidance: Ayah + action card
   ─ This Day in Islamic History
   ─ Daily Muhasabah: 3-question widget
   ─ Journey snapshot: 4-stat grid
   ═══════════════════════════════════════════════ */

var S = WaqtX.storage;
var PRAYERS_5 = ['Fajr','Dhuhr','Asr','Maghrib','Isha'];
var PRAYER_ICONS = { Fajr:'🌙', Sunrise:'🌅', Dhuhr:'☀️', Asr:'🌤️', Maghrib:'🌇', Isha:'🌃' };
var _prayerTicker = null;

/* ══════════════════════════════════════
   1. TODAY HERO — dates
   ══════════════════════════════════════ */
function initTodayHero() {
  var now  = new Date();
  var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  var mons = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  setText('hero-day-name',  days[now.getDay()]);
  setText('hero-greg-date', now.getDate() + ' ' + mons[now.getMonth()] + ' ' + now.getFullYear());

  /* Hijri */
  if (typeof toHijri === 'function' && typeof HIJRI_MONTHS !== 'undefined') {
    var h = toHijri(now);
    setText('hero-hijri-date', h.day + ' ' + HIJRI_MONTHS[h.month - 1] + ' ' + h.year + ' AH');
  }
}

/* ══════════════════════════════════════
   2. NEXT PRAYER STRIP (hero)
   ══════════════════════════════════════ */
function initNextPrayerStrip(timings) {
  if (!timings) return;
  var next = WaqtX.prayer.getNext(timings);
  if (!next) return;

  var nameEl = el('nps-name');
  if (nameEl) {
    nameEl.innerHTML = '';
    nameEl.textContent = next.name + (next.isTomorrow ? ' (tomorrow)' : '');
  }

  /* Time display */
  var rawTime = timings[next.name] || '';
  var cleanTime = rawTime.split(' ')[0];
  var timeEl = el('nps-time');
  if (timeEl) {
    timeEl.innerHTML = '';
    timeEl.textContent = cleanTime;
  }

  /* Start live countdown */
  _startNextPrayerCountdown(next, timings);
}

function _startNextPrayerCountdown(next, timings) {
  clearInterval(_prayerTicker);

  function tick() {
    var now    = new Date();
    var nowSec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    var nextSec = WaqtX.prayer.timeToMin(timings[next.name]) * 60;
    var diff = nextSec - nowSec;
    if (diff < 0) diff += 86400;
    setText('nps-countdown', WaqtX.prayer.formatCountdown(diff) + ' away');
  }

  tick();
  _prayerTicker = setInterval(tick, 1000);
}

/* ══════════════════════════════════════
   3. PRAYER RHYTHM (5 pills)
   ══════════════════════════════════════ */
function initPrayerRhythm(timings) {
  if (!timings) {
    PRAYERS_5.forEach(function(p) { setText('pr-time-' + p, '--:--'); });
    return;
  }

  var now    = new Date();
  var nowMin = now.getHours() * 60 + now.getMinutes();
  var next   = WaqtX.prayer.getNext(timings);

  PRAYERS_5.forEach(function(p) {
    var raw   = timings[p] || '';
    var clean = raw.split(' ')[0];
    var pMin  = WaqtX.prayer.timeToMin(raw);
    var item  = document.querySelector('.pr-item[data-prayer="' + p + '"]');

    var timeEl = el('pr-time-' + p);
    if (timeEl) { timeEl.textContent = clean; timeEl.classList.remove('skeleton','skeleton-sm'); }

    var dot = el('pr-dot-' + p);
    if (!item) return;

    item.classList.remove('done','next','missed');

    if (next && p === next.name && !next.isTomorrow) {
      item.classList.add('next');
      if (dot) dot.textContent = PRAYER_ICONS[p] || '⬤';
    } else if (pMin < nowMin) {
      /* Check if user logged this prayer */
      var logged = (S.get('tracker_' + _getTodayKey()) || {})[p];
      item.classList.add(logged ? 'done' : 'missed');
      if (dot) dot.textContent = logged ? '✓' : PRAYER_ICONS[p] || '⬤';
    } else {
      if (dot) dot.textContent = PRAYER_ICONS[p] || '⬤';
    }
  });
}

function _getTodayKey() {
  var d = new Date();
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2,'0') + '-' +
    String(d.getDate()).padStart(2,'0');
}

/* ══════════════════════════════════════
   4. DAILY GUIDANCE (Ayah + Action)
   ══════════════════════════════════════ */
function initDailyGuidance() {
  if (!window.DAILY_AYAHS || !window.DAILY_DUAS || !window.DAILY_ACTIONS) return;

  var doy = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000
  );

  var ayah   = DAILY_AYAHS[doy % DAILY_AYAHS.length];
  var action = DAILY_ACTIONS[doy % DAILY_ACTIONS.length];

  /* Guidance card */
  setText('gc-arabic',      ayah.arabic);
  setText('gc-translation', ayah.translation);
  setText('gc-source',      ayah.source);
  setText('gc-reflection',  ayah.reflection || '');

  /* Action card */
  setText('action-text', action.action);
  setText('action-why',  action.why || '');

  /* Done button */
  var doneKey = 'action_done_' + _getTodayKey();
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

  /* Share button */
  var shareBtn = el('btn-action-share');
  if (shareBtn) {
    shareBtn.addEventListener('click', function() {
      var text = action.action + '\n\n— WaqtX · mianhassam96.github.io/WaqtX/';
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
}

/* ══════════════════════════════════════
   5. THIS DAY IN ISLAMIC HISTORY
   ══════════════════════════════════════ */
function initThisDaySection() {
  var now = new Date();
  var mons = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  setText('td-day',   now.getDate());
  setText('td-month', mons[now.getMonth()]);

  /* Pull from history-data.js if available */
  if (window.WAQTX_HISTORY && WAQTX_HISTORY.getTodayEntry) {
    var entry = WAQTX_HISTORY.getTodayEntry();
    if (entry) {
      var H = WAQTX_HISTORY;
      var dateStr = entry.date.gregorian || '';
      setText('td-year',    dateStr.substring(0, 8));
      setText('td-era',     H.ERA_LABELS ? (H.ERA_LABELS[entry.era] || entry.era) : entry.era);
      setText('td-title',   entry.title);
      setText('td-summary', entry.summary);

      /* Source badges */
      var badgesEl = el('td-sources');
      if (badgesEl && entry.sources && entry.sources.length) {
        var html = '';
        entry.sources.slice(0, 3).forEach(function(src) {
          html += '<span class="ev-badge ev-' + src.type + '">' +
                  '<span class="ev-badge-dot"></span>' +
                  _esc(H.sourceTypeLabel ? H.sourceTypeLabel(src.type) : src.type) +
                  (src.ref ? ': ' + _esc(src.ref.substring(0, 32)) + (src.ref.length > 32 ? '…' : '') : '') +
                  '</span>';
        });
        badgesEl.innerHTML = html;
      }

      /* CTA link */
      var linkEl = el('td-link');
      if (linkEl && entry.title) {
        var q = encodeURIComponent(entry.title.replace(/\s*[—–-].*$/, '').trim());
        linkEl.href = 'search.html?q=' + q;
      }
    }
  }
}

function _esc(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

/* ══════════════════════════════════════
   6. DAILY MUHASABAH (3 textareas)
   ══════════════════════════════════════ */
function initMuhasabah() {
  var today  = _getTodayKey();
  var saved  = S.get('muhasabah_' + today) || {};

  var fields = [
    { id: 'mq-1', key: 'gratitude' },
    { id: 'mq-2', key: 'mistake'   },
    { id: 'mq-3', key: 'deed'      }
  ];

  fields.forEach(function(f) {
    var ta = el(f.id);
    if (!ta) return;
    ta.value = saved[f.key] || '';
    ta.addEventListener('input', function() {
      var data = S.get('muhasabah_' + today) || {};
      data[f.key] = ta.value;
      S.set('muhasabah_' + today, data);
      _updateMuhasabahStatus();
    });
  });

  _updateMuhasabahStatus();
}

function _updateMuhasabahStatus() {
  var today  = _getTodayKey();
  var saved  = S.get('muhasabah_' + today) || {};
  var filled = ['gratitude','mistake','deed'].filter(function(k) {
    return (saved[k] || '').trim().length > 0;
  }).length;

  var status = el('mq-save-status');
  if (!status) return;
  if (filled === 0)      status.textContent = '';
  else if (filled < 3)   status.textContent = '✓ ' + filled + '/3 saved';
  else                   status.textContent = '✓ All saved — Alhamdulillah';
}

/* ══════════════════════════════════════
   7. JOURNEY SNAPSHOT
   ══════════════════════════════════════ */
function initJourneySnapshot() {
  var dob = S.get('dob');
  var noDobEl = el('js-no-dob');

  if (!dob) {
    if (noDobEl) noDobEl.classList.remove('hidden');
    return;
  }

  if (noDobEl) noDobEl.classList.add('hidden');

  try {
    var p = dob.split('-');
    var birth = new Date(+p[0], +p[1] - 1, +p[2]);
    var ms  = Date.now() - birth.getTime();
    var days = Math.floor(ms / 86400000);
    var ageYrs = days / 365.25;
    var ramadans = Math.floor(ageYrs);
    var jumuahs  = Math.floor(days / 7);
    var prayers  = days * 5;
    var laylatul = ramadans;

    setText('js-ramadans', ramadans.toLocaleString());
    setText('js-jumuahs',  jumuahs.toLocaleString());
    setText('js-prayers',  prayers.toLocaleString());
    setText('js-laylatul', laylatul.toLocaleString());
  } catch(e) {}
}

/* ══════════════════════════════════════
   8. PRAYER SECTION — load & render
   ══════════════════════════════════════ */
function initPrayerSection() {
  var cached = WaqtX.prayer.getCached();

  if (cached) {
    initNextPrayerStrip(cached);
    initPrayerRhythm(cached);
    hideNoLocation();
  } else {
    /* Show placeholder times */
    PRAYERS_5.forEach(function(p) {
      var el2 = el('pr-time-' + p);
      if (el2) { el2.textContent = '--:--'; el2.classList.remove('skeleton','skeleton-sm'); }
    });

    /* Auto-fetch if location saved */
    var lat = S.get('location_lat');
    var lng = S.get('location_lng');
    if (lat && lng) {
      WaqtX.prayer.fetch(lat, lng, function(timings) {
        initNextPrayerStrip(timings);
        initPrayerRhythm(timings);
        hideNoLocation();
      }, function() {
        showNoLocation();
      });
    } else {
      showNoLocation();
    }
  }
}

function hideNoLocation() {
  var noLoc = el('prayer-no-location');
  if (noLoc) noLoc.classList.add('hidden');
}
function showNoLocation() {
  var noLoc = el('prayer-no-location');
  if (noLoc) noLoc.classList.remove('hidden');
  var npsName = el('nps-name');
  if (npsName) { npsName.innerHTML = '<span style="font-size:var(--text-base);font-weight:500;color:rgba(255,255,255,0.55)">Enable location for times</span>'; }
  var npsTime = el('nps-time');
  if (npsTime) { npsTime.innerHTML = ''; }
}

/* ══════════════════════════════════════
   BOOT
   ══════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function() {
  initTodayHero();
  initPrayerSection();
  initDailyGuidance();
  initThisDaySection();
  initMuhasabah();
  initJourneySnapshot();

  /* Refresh prayer state every minute */
  setInterval(function() {
    var t = WaqtX.prayer.getCached();
    if (t) initPrayerRhythm(t);
  }, 60000);
});
