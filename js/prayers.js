'use strict';
/* ═══════════════════════════════════════════════
   WaqtX — Prayer Page  (Phase 1.3 rebuild)

   Hierarchy:
     Level 1 — Primary:   Next prayer name · time · live countdown
     Level 2 — Secondary: 6-prayer schedule · consistency (streak + bars)
     Level 3 — Tertiary:  Weekly tracker · after-prayer reflections · notifications

   Storage contracts:
     WaqtX.keys.tracker(dateKey)  → 'tracker_YYYY-MM-DD'
     WaqtX.storage                → S
   ═══════════════════════════════════════════════ */

var S         = WaqtX.storage;
var PRAYERS_5 = ['Fajr','Dhuhr','Asr','Maghrib','Isha'];
var PRAYERS_6 = ['Fajr','Sunrise','Dhuhr','Asr','Maghrib','Isha'];
var PR_ICONS  = { Fajr:'🌙', Sunrise:'🌅', Dhuhr:'☀️', Asr:'🌤️', Maghrib:'🌇', Isha:'🌃' };

var _ticker = null;

/* ══════════════════════════════════════
   HELPERS
   ══════════════════════════════════════ */
function _esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function _todayKey(){ return getDateKey(0); }

/* ══════════════════════════════════════
   LEVEL 1 — NEXT PRAYER + COUNTDOWN
   ══════════════════════════════════════ */
function renderNextPrayer(timings) {
  var next = WaqtX.prayer.getNext(timings);
  if (!next) return;

  setText('prayer-next-name', next.name + (next.isTomorrow ? ' (tomorrow)' : ''));
  setText('prayer-next-time', (timings[next.name] || '').split(' ')[0]);

  clearInterval(_ticker);
  function tick() {
    var now    = new Date();
    var nowSec = now.getHours()*3600 + now.getMinutes()*60 + now.getSeconds();
    var nextSec = WaqtX.prayer.timeToMin(timings[next.name]) * 60;
    var diff = nextSec - nowSec;
    if (diff < 0) diff += 86400;
    setText('prayer-countdown', WaqtX.prayer.formatCountdown(diff) + ' away');
  }
  tick();
  _ticker = setInterval(tick, 1000);
}

/* ══════════════════════════════════════
   LEVEL 2 — PRAYER SCHEDULE (6 cards)
   ══════════════════════════════════════ */
function renderSchedule(timings) {
  var grid = el('prayer-grid');
  if (!grid) return;

  var now    = new Date();
  var nowMin = now.getHours()*60 + now.getMinutes();
  var next   = WaqtX.prayer.getNext(timings);
  var logged = S.get(WaqtX.keys.tracker(_todayKey())) || {};

  var html = '';
  PRAYERS_6.forEach(function(name) {
    if (!timings[name]) return;
    var clean   = timings[name].split(' ')[0];
    var pMin    = WaqtX.prayer.timeToMin(timings[name]);
    var isSun   = name === 'Sunrise';
    var isNext  = !isSun && next && name === next.name && !next.isTomorrow;
    var isPast  = pMin < nowMin;
    var isDone  = !isSun && isPast && !!logged[name];
    var isMissed = !isSun && isPast && !logged[name];

    var stateClass = isNext  ? ' pr-card-next'
                   : isDone  ? ' pr-card-done'
                   : isMissed ? ' pr-card-missed'
                   : isSun   ? ' pr-card-sunrise'
                   : '';

    var badge = isNext   ? '<span class="pr-badge pr-badge-next">Next</span>'
              : isDone   ? '<span class="pr-badge pr-badge-done">✓</span>'
              : isMissed ? '<span class="pr-badge pr-badge-missed">○</span>'
              : '';

    html +=
      '<div class="pr-card' + stateClass + '" role="listitem" aria-label="' + _esc(name) + ' at ' + _esc(clean) + '">' +
        '<span class="pr-card-icon" aria-hidden="true">' + (PR_ICONS[name]||'🕌') + '</span>' +
        '<span class="pr-card-name">' + _esc(name) + '</span>' +
        '<span class="pr-card-time">' + _esc(clean) + '</span>' +
        badge +
      '</div>';
  });

  grid.innerHTML = html || '<p class="pr-schedule-placeholder">Enable location to see prayer times. <a href="settings.html">Settings →</a></p>';
}

/* ══════════════════════════════════════
   LEVEL 2 — CONSISTENCY
   Streak + weekly + monthly bars
   ══════════════════════════════════════ */
function renderConsistency() {
  /* Streak */
  var streak = recalcStreak();
  setText('streak-count', streak);
  var labelEl = el('streak-label');
  if (labelEl) labelEl.textContent = streak === 1 ? 'Day streak' : 'Day streak';

  /* Bar helper */
  function calcPct(days) {
    var done = 0;
    for (var i = 0; i < days; i++) {
      var data = S.get(WaqtX.keys.tracker(getDateKey(-i))) || {};
      PRAYERS_5.forEach(function(p){ if(data[p]) done++; });
    }
    return Math.round((done / (days*5)) * 100);
  }

  var weekly  = calcPct(7);
  var monthly = calcPct(30);

  /* Weekly */
  setText('cons-weekly', weekly + '%');
  var wBar = el('cons-weekly-bar');
  var wWrap = el('cons-weekly-bar-wrap');
  if (wBar) { wBar.style.width = weekly + '%'; _setBarClass(wBar, weekly); }
  if (wWrap) wWrap.setAttribute('aria-valuenow', weekly);
  var wDone = Math.round((weekly/100)*35);
  setText('cons-weekly-sub', wDone + ' of 35 prayers this week');

  /* Monthly */
  setText('cons-monthly', monthly + '%');
  var mBar = el('cons-monthly-bar');
  var mWrap = el('cons-monthly-bar-wrap');
  if (mBar) { mBar.style.width = monthly + '%'; _setBarClass(mBar, monthly); }
  if (mWrap) mWrap.setAttribute('aria-valuenow', monthly);
  var mDone = Math.round((monthly/100)*150);
  setText('cons-monthly-sub', mDone + ' of 150 prayers this month');
}

function _setBarClass(bar, pct) {
  bar.classList.remove('pr-bar-good','pr-bar-mid','pr-bar-low');
  if      (pct >= 80) bar.classList.add('pr-bar-good');
  else if (pct >= 50) bar.classList.add('pr-bar-mid');
  else                bar.classList.add('pr-bar-low');
}

/* ══════════════════════════════════════
   LEVEL 3 — WEEKLY TRACKER
   Uses WaqtX.keys.tracker contract
   ══════════════════════════════════════ */
function renderTracker() {
  var grid = el('tracker-grid');
  if (!grid) return;

  /* Build 7-day column headers */
  var days = [];
  for (var i = 6; i >= 0; i--) {
    var d = new Date(); d.setDate(d.getDate() - i);
    days.push({
      key:     getDateKey(-i),
      short:   d.toLocaleDateString('en-US', { weekday: 'short' }),
      dateNum: d.getDate(),
      isToday: i === 0
    });
  }

  var html = '';

  /* Header row */
  html += '<div class="tr-row tr-header"><div class="tr-cell tr-prayer-col"></div>';
  days.forEach(function(d) {
    html += '<div class="tr-cell tr-day-col' + (d.isToday ? ' tr-today-col' : '') + '">' +
            '<span class="tr-day-name">' + d.short + '</span>' +
            '<span class="tr-day-num">'  + d.dateNum + '</span>' +
            '</div>';
  });
  html += '</div>';

  /* Prayer rows */
  PRAYERS_5.forEach(function(prayer) {
    html += '<div class="tr-row"><div class="tr-cell tr-prayer-col">' + prayer + '</div>';
    days.forEach(function(d) {
      var data = S.get(WaqtX.keys.tracker(d.key)) || {};
      var done = !!data[prayer];
      html += '<div class="tr-cell tr-day-col' + (d.isToday ? ' tr-today-col' : '') + '">' +
              '<button class="tr-btn' + (done ? ' tr-done' : '') + '"' +
              ' data-date="' + d.key + '" data-prayer="' + prayer + '"' +
              ' aria-label="' + prayer + ' on ' + d.key + (done ? ' — completed' : '') + '"' +
              ' aria-pressed="' + done + '">' +
              (done ? '✓' : '') +
              '</button></div>';
    });
    html += '</div>';
  });

  grid.innerHTML = html;

  /* Toggle on click */
  grid.querySelectorAll('.tr-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var key    = btn.getAttribute('data-date');
      var prayer = btn.getAttribute('data-prayer');
      var data   = S.get(WaqtX.keys.tracker(key)) || {};
      data[prayer] = !data[prayer];
      S.set(WaqtX.keys.tracker(key), data);
      renderTracker();
      renderConsistency();
    });
  });
}

/* ══════════════════════════════════════
   LEVEL 3 — AFTER-PRAYER REFLECTIONS
   ══════════════════════════════════════ */
function renderPrayerReflections() {
  var grid = el('prayer-reflect-grid');
  if (!grid) return;
  var today = _todayKey();

  var html = PRAYERS_5.map(function(prayer) {
    var saved = S.get('prayer_note_' + prayer + '_' + today) || '';
    return '<div class="pr-reflect-item">' +
      '<label class="pr-reflect-label" for="pr-note-' + prayer + '">' +
        '<span class="pr-reflect-icon" aria-hidden="true">' + (PR_ICONS[prayer]||'🕌') + '</span>' +
        prayer +
      '</label>' +
      '<textarea class="pr-reflect-textarea" id="pr-note-' + prayer + '"' +
        ' placeholder="What did this prayer remind you of?" rows="2"' +
        ' aria-label="' + prayer + ' reflection note">' + _esc(saved) + '</textarea>' +
    '</div>';
  }).join('');

  grid.innerHTML = html;

  /* Autosave */
  PRAYERS_5.forEach(function(prayer) {
    var ta = el('pr-note-' + prayer);
    if (!ta) return;
    ta.addEventListener('input', function() {
      S.set('prayer_note_' + prayer + '_' + today, ta.value);
    });
  });
}

/* ══════════════════════════════════════
   NOTIFICATIONS
   ══════════════════════════════════════ */
function initNotifications() {
  var map = {
    'notif-adhan':    'notif_adhan',
    'notif-reminder': 'notif_reminder',
    'notif-silent':   'notif_silent'
  };
  Object.keys(map).forEach(function(id) {
    var toggle = el(id);
    if (!toggle) return;
    toggle.checked = !!S.get(map[id]);
    toggle.addEventListener('change', function() {
      if (!toggle.checked) { S.set(map[id], false); return; }
      if (!('Notification' in window)) { toggle.checked = false; return; }
      if (Notification.permission === 'granted') { S.set(map[id], true); return; }
      if (Notification.permission === 'denied') {
        toggle.checked = false;
        var msg = el('notif-denied-msg');
        if (msg) msg.classList.remove('hidden');
        return;
      }
      Notification.requestPermission().then(function(p) {
        if (p === 'granted') { S.set(map[id], true); }
        else {
          toggle.checked = false;
          var msg = el('notif-denied-msg');
          if (msg) msg.classList.remove('hidden');
        }
      });
    });
  });
}

/* ══════════════════════════════════════
   LOCATION + FETCH
   ══════════════════════════════════════ */
function _showNoLocation() {
  var noLoc = el('prayer-no-location');
  if (noLoc) noLoc.classList.remove('hidden');
  setText('prayer-next-name', 'No location set');
  setText('prayer-next-time', '');
  setText('prayer-countdown', '');
}
function _hideNoLocation() {
  var noLoc = el('prayer-no-location');
  if (noLoc) noLoc.classList.add('hidden');
}
function _showStatus(msg, isErr) {
  var s = el('prayer-status');
  if (!s) return;
  s.textContent = msg;
  s.style.color = isErr ? 'var(--danger, #dc2626)' : 'var(--text-3)';
}

function initPrayerPage() {
  var cached = WaqtX.prayer.getCached();
  if (cached) {
    _hideNoLocation();
    renderNextPrayer(cached);
    renderSchedule(cached);
    setInterval(function() {
      var t = WaqtX.prayer.getCached();
      if (t) { renderNextPrayer(t); renderSchedule(t); }
    }, 60000);
  }

  var btn = el('btn-prayer-times');
  if (btn) {
    /* Auto-fetch if location saved but no cached times */
    var lat = S.get('location_lat');
    var lng = S.get('location_lng');
    if (lat && lng && !cached) {
      btn.textContent = 'Refreshing…';
      btn.disabled = true;
      WaqtX.prayer.fetch(lat, lng, function(timings) {
        btn.textContent = '↺ Refresh';
        btn.disabled = false;
        _hideNoLocation();
        renderNextPrayer(timings);
        renderSchedule(timings);
        setInterval(function() {
          var t = WaqtX.prayer.getCached();
          if (t) { renderNextPrayer(t); renderSchedule(t); }
        }, 60000);
      }, function() {
        btn.textContent = 'Get Prayer Times';
        btn.disabled = false;
        _showStatus('Could not load prayer times. Check your connection.', true);
      });
    } else if (!lat && !lng && !cached) {
      _showNoLocation();
    }

    /* Manual tap */
    btn.addEventListener('click', function() {
      if (!navigator.geolocation) {
        _showStatus('Geolocation not supported by your browser.', true);
        return;
      }
      btn.textContent = 'Locating…';
      btn.disabled = true;
      navigator.geolocation.getCurrentPosition(
        function(pos) {
          var lat = pos.coords.latitude, lng = pos.coords.longitude;
          S.set('location_lat', lat); S.set('location_lng', lng);
          S.set('location_mode', 'auto');
          btn.textContent = '↺ Refresh';
          btn.disabled = false;
          _hideNoLocation();
          WaqtX.prayer.fetch(lat, lng, function(timings) {
            renderNextPrayer(timings);
            renderSchedule(timings);
          }, function() {
            _showStatus('Could not load prayer times. Try again.', true);
          });
        },
        function(err) {
          btn.textContent = 'Get Prayer Times';
          btn.disabled = false;
          var msgs = {1:'Location access denied.',2:'Location unavailable.',3:'Request timed out.'};
          _showStatus(msgs[err.code] || 'Could not get location.', true);
          _showNoLocation();
        },
        { timeout: 10000, maximumAge: 300000 }
      );
    });
  }

  renderTracker();
  renderConsistency();
  renderPrayerReflections();
  initNotifications();
}

/* ══════════════════════════════════════
   BOOT
   ══════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', initPrayerPage);
