'use strict';
/* ═══════════════════════════════════════════════
   WaqtX — Prayers Page Logic
   Prayer Orbit · Schedule · Tracker · Streak · Notifications
   ═══════════════════════════════════════════════ */

var S = WaqtX.storage;
var PRAYERS_5 = ['Fajr','Dhuhr','Asr','Maghrib','Isha'];
var PRAYERS_6 = ['Fajr','Sunrise','Dhuhr','Asr','Maghrib','Isha'];
var PRAYER_ICONS = { Fajr:'🌙', Sunrise:'🌅', Dhuhr:'☀️', Asr:'🌤', Maghrib:'🌇', Isha:'🌃' };

/* ══════════════════════════════════════
   PRAYER ORBIT (SVG)
   ══════════════════════════════════════ */
function renderOrbit(timings) {
  var svg = el('orbit-svg');
  if (!svg) return;

  var size = svg.parentElement.clientWidth || 400;
  size = Math.min(Math.max(size, 260), 480);
  var cx = size / 2, cy = size / 2, r = size * 0.42;
  svg.setAttribute('viewBox', '0 0 ' + size + ' ' + size);
  svg.setAttribute('width', size);
  svg.setAttribute('height', size);

  var now = new Date();
  var nowMin = now.getHours() * 60 + now.getMinutes();
  var next = timings ? WaqtX.prayer.getNext(timings) : null;

  /* Background ring */
  var circ = 2 * Math.PI * r;
  var bgCircle = '<circle cx="' + cx + '" cy="' + cy + '" r="' + r +
    '" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="3"/>';

  /* Progress arc */
  var elapsed = nowMin / 1440;
  var progressOffset = circ * (1 - elapsed);
  var progressArc = '<circle cx="' + cx + '" cy="' + cy + '" r="' + r +
    '" fill="none" stroke="var(--gold)" stroke-width="3" stroke-linecap="round"' +
    ' stroke-dasharray="' + circ + '" stroke-dashoffset="' + progressOffset + '"' +
    ' transform="rotate(-90,' + cx + ',' + cy + ')" opacity="0.7"/>';

  /* Nodes */
  var nodes = '';
  var labels = '';
  PRAYERS_6.forEach(function(name) {
    if (!timings || !timings[name]) return;
    var pMin = WaqtX.prayer.timeToMin(timings[name]);
    var angle = (pMin / 1440) * 360 - 90;
    var rad = angle * Math.PI / 180;
    var nx = cx + r * Math.cos(rad);
    var ny = cy + r * Math.sin(rad);

    var isPast = pMin < nowMin;
    var isNext = next && name === next.name && !next.isTomorrow;
    var nodeR = isNext ? 10 : 7;
    var fill = isNext ? 'var(--gold)' : isPast ? 'var(--green)' : 'rgba(255,255,255,0.2)';
    var glow = isNext ? ' filter="url(#nodeGlow)"' : '';

    nodes += '<circle cx="' + nx + '" cy="' + ny + '" r="' + nodeR + '" fill="' + fill + '"' + glow + '/>';

    /* Label position — push outward */
    var lr = r + 26;
    var lx = cx + lr * Math.cos(rad);
    var ly = cy + lr * Math.sin(rad);
    var anchor = lx < cx - 5 ? 'end' : lx > cx + 5 ? 'start' : 'middle';
    var timeClean = timings[name].split(' ')[0];
    labels += '<text x="' + lx + '" y="' + (ly - 4) + '" text-anchor="' + anchor +
      '" font-size="10" fill="' + (isNext ? 'var(--gold)' : 'rgba(248,250,252,0.6)') +
      '" font-family="Inter,sans-serif">' + name + '</text>';
    labels += '<text x="' + lx + '" y="' + (ly + 9) + '" text-anchor="' + anchor +
      '" font-size="9" fill="rgba(248,250,252,0.4)" font-family="Inter,sans-serif">' + timeClean + '</text>';
  });

  /* Center text */
  var centerText = next ?
    '<text x="' + cx + '" y="' + (cy - 8) + '" text-anchor="middle" font-size="12" fill="rgba(248,250,252,0.5)" font-family="Inter,sans-serif">Next</text>' +
    '<text x="' + cx + '" y="' + (cy + 10) + '" text-anchor="middle" font-size="18" font-weight="700" fill="var(--gold)" font-family="Outfit,sans-serif">' + (next.name) + '</text>' : '';

  svg.innerHTML =
    '<defs>' +
      '<filter id="nodeGlow" x="-50%" y="-50%" width="200%" height="200%">' +
        '<feGaussianBlur stdDeviation="3" result="coloredBlur"/>' +
        '<feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>' +
      '</filter>' +
    '</defs>' +
    bgCircle + progressArc + nodes + labels + centerText;
}

/* ══════════════════════════════════════
   PRAYER SCHEDULE CARDS
   ══════════════════════════════════════ */
function renderSchedule(timings) {
  var grid = el('prayer-grid');
  if (!grid) return;

  var now = new Date();
  var nowMin = now.getHours() * 60 + now.getMinutes();
  var next = WaqtX.prayer.getNext(timings);
  var html = '';

  PRAYERS_6.forEach(function(name) {
    if (!timings[name]) return;
    var timeClean = timings[name].split(' ')[0];
    var pMin = WaqtX.prayer.timeToMin(timings[name]);
    var isPast = pMin < nowMin && !next.isTomorrow;
    var isNext = name === next.name && !next.isTomorrow;
    var isSunrise = name === 'Sunrise';
    var statusBadge = isNext
      ? '<span class="prayer-badge prayer-badge-next">Next</span>'
      : isPast && !isSunrise
        ? '<span class="prayer-badge prayer-badge-done">✓ Done</span>'
        : '<span class="prayer-badge prayer-badge-upcoming">Upcoming</span>';
    html += '<div class="prayer-card' + (isNext ? ' prayer-next' : '') +
      (isPast && !isSunrise ? ' prayer-past' : '') +
      (isSunrise ? ' prayer-sunrise' : '') + '">' +
      '<div class="prayer-card-icon">' + (PRAYER_ICONS[name] || '🕌') + '</div>' +
      '<div class="prayer-card-name">' + name + '</div>' +
      '<div class="prayer-card-time">' + timeClean + '</div>' +
      statusBadge +
      '</div>';
  });

  grid.innerHTML = html;
}

/* ══════════════════════════════════════
   COUNTDOWN TICKER
   ══════════════════════════════════════ */
var _ticker = null;
function startCountdown(timings) {
  clearInterval(_ticker);
  function tick() {
    var now = new Date();
    var nowSec = now.getHours()*3600 + now.getMinutes()*60 + now.getSeconds();
    var next = WaqtX.prayer.getNext(timings);
    var nextSec = next.minutes * 60;
    var diff = nextSec - nowSec;
    if (diff < 0) diff += 86400;
    setText('prayer-countdown', WaqtX.prayer.formatCountdown(diff));
    setText('prayer-next-name', next.name + (next.isTomorrow ? ' (tomorrow)' : ''));
    /* Also update hero */
    setText('hero-next-countdown', WaqtX.prayer.formatCountdown(diff));
    setText('hero-next-prayer', next.name + (next.isTomorrow ? ' (tomorrow)' : ''));
  }
  tick();
  _ticker = setInterval(tick, 1000);
}

/* ══════════════════════════════════════
   WEEKLY TRACKER
   ══════════════════════════════════════ */
function renderTracker() {
  var grid = el('tracker-grid');
  if (!grid) return;

  var today = getTodayKey();
  var days = [];
  for (var i = 6; i >= 0; i--) {
    var d = new Date(); d.setDate(d.getDate() - i);
    days.push({
      key: getDateKey(-i),
      label: d.toLocaleDateString('en-US', { weekday: 'short' }),
      isToday: i === 0
    });
  }

  var html = '<div class="tracker-header"><div class="tracker-day-label"></div>';
  days.forEach(function(d) {
    html += '<div class="tracker-day-label' + (d.isToday ? ' tracker-today-col' : '') + '">' +
      d.label + '<span class="tracker-date-num">' +
      new Date(d.key).getDate() + '</span></div>';
  });
  html += '</div>';

  PRAYERS_5.forEach(function(prayer) {
    html += '<div class="tracker-row">';
    html += '<div class="tracker-prayer-label">' + prayer + '</div>';
    days.forEach(function(d) {
      var data = S.get('tracker_' + d.key) || {};
      var done = !!data[prayer];
      html += '<button class="tracker-cell' +
        (done ? ' tracker-done' : '') +
        (d.isToday ? ' tracker-today-col' : '') + '"' +
        ' data-date="' + d.key + '" data-prayer="' + prayer + '"' +
        ' aria-label="' + prayer + ' on ' + d.key + (done ? ' - completed' : '') + '"' +
        ' title="' + prayer + ' · ' + d.key + '">' +
        (done ? '✓' : '') +
        '</button>';
    });
    html += '</div>';
  });

  grid.innerHTML = html;

  /* Click to toggle */
  grid.querySelectorAll('.tracker-cell').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var date = btn.getAttribute('data-date');
      var prayer = btn.getAttribute('data-prayer');
      var data = S.get('tracker_' + date) || {};
      data[prayer] = !data[prayer];
      S.set('tracker_' + date, data);
      renderTracker();
      updateStreakDisplay();
    });
  });
}

function updateStreakDisplay() {
  var streak = recalcStreak();
  setText('streak-count', streak);
  setText('streak-label', streak === 1 ? 'Day Streak' : 'Day Streak');
}

/* ══════════════════════════════════════
   NOTIFICATIONS
   ══════════════════════════════════════ */
function initNotifications() {
  var toggles = {
    'notif-adhan':    'notif_adhan',
    'notif-reminder': 'notif_reminder',
    'notif-silent':   'notif_silent'
  };
  Object.keys(toggles).forEach(function(id) {
    var toggle = el(id);
    if (!toggle) return;
    toggle.checked = !!S.get(toggles[id]);
    toggle.addEventListener('change', function() {
      if (toggle.checked) {
        requestNotifPermission(function(granted) {
          if (!granted) {
            toggle.checked = false;
            var msg = el('notif-denied-msg');
            if (msg) msg.classList.remove('hidden');
          } else {
            S.set(toggles[id], true);
            scheduleNotifications();
          }
        });
      } else {
        S.set(toggles[id], false);
      }
    });
  });
}

function requestNotifPermission(callback) {
  if (!('Notification' in window)) { callback(false); return; }
  if (Notification.permission === 'granted') { callback(true); return; }
  if (Notification.permission === 'denied') { callback(false); return; }
  Notification.requestPermission().then(function(p) { callback(p === 'granted'); });
}

function scheduleNotifications() {
  var timings = WaqtX.prayer.getCached();
  if (!timings || !navigator.serviceWorker || !navigator.serviceWorker.controller) return;
  var adhan    = !!S.get('notif_adhan');
  var reminder = !!S.get('notif_reminder');
  var silent   = !!S.get('notif_silent');
  if (!adhan && !reminder && !silent) return;

  PRAYERS_5.forEach(function(name) {
    var timeStr = timings[name];
    if (!timeStr) return;
    var parts = timeStr.split(' ')[0].split(':');
    var today = new Date();
    var fireAt = new Date(today.getFullYear(), today.getMonth(), today.getDate(),
                          parseInt(parts[0]), parseInt(parts[1]), 0).getTime();
    if (fireAt <= Date.now()) return;

    var mode = adhan ? 'adhan' : reminder ? 'reminder' : 'silent';
    var msgFireAt = reminder ? fireAt - 15*60*1000 : fireAt;

    navigator.serviceWorker.controller.postMessage({
      type: 'SCHEDULE_NOTIFICATION',
      prayer: name,
      fireAt: msgFireAt,
      mode: mode
    });
  });
}

/* ══════════════════════════════════════
   LOCATION & FETCH
   ══════════════════════════════════════ */
function initPrayerPage() {
  /* Try cached first */
  var cached = WaqtX.prayer.getCached();
  if (cached) {
    renderOrbit(cached);
    renderSchedule(cached);
    startCountdown(cached);
    /* re-render orbit every minute */
    setInterval(function() {
      renderOrbit(WaqtX.prayer.getCached());
      renderSchedule(WaqtX.prayer.getCached());
    }, 60000);
  }

  /* Get prayer times button */
  var btn = el('btn-prayer-times');
  if (btn) {
    /* If location already saved, auto-fetch */
    var lat = S.get('location_lat');
    var lng = S.get('location_lng');
    if (lat && lng && !cached) {
      btn.textContent = '↺ Refreshing…';
      WaqtX.prayer.fetch(lat, lng, function(timings) {
        btn.textContent = '↺ Refresh';
        renderOrbit(timings);
        renderSchedule(timings);
        startCountdown(timings);
        scheduleNotifications();
        setInterval(function() {
          renderOrbit(WaqtX.prayer.getCached());
          renderSchedule(WaqtX.prayer.getCached());
        }, 60000);
      }, function(e) {
        btn.textContent = 'Get Prayer Times';
        setText('prayer-status', 'Could not load prayer times.');
      });
    }

    btn.addEventListener('click', function() {
      if (!navigator.geolocation) {
        setText('prayer-status', 'Geolocation not supported by your browser.');
        return;
      }
      btn.textContent = 'Locating…';
      btn.disabled = true;
      navigator.geolocation.getCurrentPosition(
        function(pos) {
          var lat = pos.coords.latitude, lng = pos.coords.longitude;
          S.set('location_lat', lat);
          S.set('location_lng', lng);
          S.set('location_mode', 'auto');
          btn.textContent = '↺ Refresh';
          btn.disabled = false;
          WaqtX.prayer.fetch(lat, lng, function(timings) {
            renderOrbit(timings);
            renderSchedule(timings);
            startCountdown(timings);
            scheduleNotifications();
          }, function() {
            setText('prayer-status', 'Could not load prayer times.');
          });
        },
        function(err) {
          btn.textContent = 'Get Prayer Times';
          btn.disabled = false;
          var msgs = {1:'Location access denied.',2:'Location unavailable.',3:'Request timed out.'};
          setText('prayer-status', msgs[err.code] || 'Could not get location.');
        },
        { timeout: 10000, maximumAge: 300000 }
      );
    });
  }

  renderTracker();
  updateStreakDisplay();
  initNotifications();
}

document.addEventListener('DOMContentLoaded', initPrayerPage);
