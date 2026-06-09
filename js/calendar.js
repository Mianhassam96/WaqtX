'use strict';
/* ═══════════════════════════════════════════════
   WaqtX — Calendar Page Logic
   Hijri Calendar · Islamic Events · Countdown
   ═══════════════════════════════════════════════ */

var S = WaqtX.storage;

/* ══════════════════════════════════════
   HIJRI CALENDAR GRID
   ══════════════════════════════════════ */
var _viewHijri = null; /* { year, month } currently displayed */

function initCalendarView() {
  _viewHijri = toHijri(new Date());
  renderCalendar(_viewHijri.year, _viewHijri.month);

  var prevBtn = el('cal-prev');
  var nextBtn = el('cal-next');
  if (prevBtn) prevBtn.addEventListener('click', function() {
    _viewHijri.month--;
    if (_viewHijri.month < 1) { _viewHijri.month = 12; _viewHijri.year--; }
    renderCalendar(_viewHijri.year, _viewHijri.month);
  });
  if (nextBtn) nextBtn.addEventListener('click', function() {
    _viewHijri.month++;
    if (_viewHijri.month > 12) { _viewHijri.month = 1; _viewHijri.year++; }
    renderCalendar(_viewHijri.year, _viewHijri.month);
  });
}

function hijriMonthLength(year, month) {
  /* Odd months = 30 days, even = 29. Month 12 = 30 in leap year */
  var LEAP = [2,5,7,10,13,15,18,21,24,26,29];
  var yearInCycle = ((year - 1) % 30) + 1;
  var isLeap = LEAP.indexOf(yearInCycle) !== -1;
  if (month === 12 && isLeap) return 30;
  return month % 2 === 1 ? 30 : 29;
}

function hijriToGregorian(hYear, hMonth, hDay) {
  /* Approximate conversion: JDN from Hijri then to Gregorian */
  var LEAP = [2,5,7,10,13,15,18,21,24,26,29];
  var yearInCycle = ((hYear - 1) % 30) + 1;
  var cycle = Math.floor((hYear - 1) / 30);
  /* Days in cycle */
  var daysInCycle = 0;
  for (var y = 1; y < yearInCycle; y++) {
    var yic = y;
    daysInCycle += (LEAP.indexOf(yic) !== -1) ? 355 : 354;
  }
  /* Days in months of current year */
  var daysInMonths = 0;
  for (var m = 1; m < hMonth; m++) {
    daysInMonths += m % 2 === 1 ? 30 : 29;
  }
  var jdn = 1948440 + cycle * 10631 + daysInCycle + daysInMonths + hDay - 1;
  /* JDN to Gregorian */
  var a = jdn + 32044;
  var b = Math.floor((4*a+3)/146097);
  var c = a - Math.floor(146097*b/4);
  var d = Math.floor((4*c+3)/1461);
  var e = c - Math.floor(1461*d/4);
  var mn = Math.floor((5*e+2)/153);
  var day = e - Math.floor((153*mn+2)/5) + 1;
  var month = mn + 3 - 12*Math.floor(mn/10);
  var year = 100*b + d - 4800 + Math.floor(mn/10);
  return new Date(year, month-1, day);
}

function renderCalendar(hYear, hMonth) {
  var grid = el('cal-grid');
  var title = el('cal-title');
  if (!grid) return;

  if (title) title.textContent = HIJRI_MONTHS[hMonth-1] + ' ' + hYear + ' AH';

  var monthLen = hijriMonthLength(hYear, hMonth);
  /* Find what day of week the 1st falls on */
  var firstGreg = hijriToGregorian(hYear, hMonth, 1);
  var startDow = firstGreg.getDay(); /* 0=Sun */
  /* Convert to Mon-first (Mon=0) */
  startDow = (startDow + 6) % 7;

  var todayH = toHijri(new Date());
  var islamicEvents = getEventsForMonth(hYear, hMonth);

  var html = '';
  /* Day headers */
  var dayLabels = ['Mo','Tu','We','Th','Fr','Sa','Su'];
  dayLabels.forEach(function(d) {
    html += '<div class="cal-day-header">' + d + '</div>';
  });

  /* Empty cells before 1st */
  for (var i = 0; i < startDow; i++) {
    html += '<div class="cal-day cal-empty"></div>';
  }

  /* Day cells */
  for (var d = 1; d <= monthLen; d++) {
    var greg = hijriToGregorian(hYear, hMonth, d);
    var gregStr = greg.toLocaleDateString('en-US', { month:'short', day:'numeric' });
    var isToday = todayH.year === hYear && todayH.month === hMonth && todayH.day === d;
    var event = islamicEvents[d];
    html += '<div class="cal-day' +
      (isToday ? ' cal-today' : '') +
      (event ? ' cal-has-event' : '') + '"' +
      (event ? ' title="' + event + '"' : '') + '>' +
      '<span class="cal-hijri-num">' + d + '</span>' +
      '<span class="cal-greg-date">' + gregStr + '</span>' +
      (event ? '<span class="cal-event-dot" aria-label="' + event + '">●</span>' : '') +
      '</div>';
  }

  /* Fade transition */
  grid.style.opacity = '0';
  grid.innerHTML = html;
  requestAnimationFrame(function() {
    grid.style.transition = 'opacity 0.2s ease';
    grid.style.opacity = '1';
  });
}

/* ══════════════════════════════════════
   ISLAMIC EVENTS
   ══════════════════════════════════════ */
var ISLAMIC_EVENTS_DEF = [
  { month: 1,  day: 1,  name: 'Islamic New Year (1 Muharram)',   icon: '🌙' },
  { month: 1,  day: 10, name: 'Ashura (10 Muharram)',            icon: '🤲' },
  { month: 3,  day: 12, name: "Mawlid an-Nabi (12 Rabi' al-Awwal)", icon: '⭐' },
  { month: 7,  day: 27, name: "Laylat al-Mi'raj (27 Rajab)",    icon: '🌟' },
  { month: 8,  day: 15, name: "Laylat al-Bara'ah (15 Sha'ban)", icon: '✨' },
  { month: 9,  day: 1,  name: 'First Day of Ramadan',            icon: '🌙' },
  { month: 9,  day: 27, name: "Laylat al-Qadr (27 Ramadan)",    icon: '💫' },
  { month: 10, day: 1,  name: 'Eid ul-Fitr (1 Shawwal)',         icon: '🎉' },
  { month: 12, day: 9,  name: "Yawm al-Arafah (9 Dhu al-Hijjah)", icon: '🕋' },
  { month: 12, day: 10, name: "Eid ul-Adha (10 Dhu al-Hijjah)", icon: '🐑' }
];

function getEventsForMonth(hYear, hMonth) {
  var result = {};
  ISLAMIC_EVENTS_DEF.forEach(function(ev) {
    if (ev.month === hMonth) result[ev.day] = ev.name;
  });
  return result;
}

function renderEventsList() {
  var container = el('events-list');
  if (!container) return;

  var todayH = toHijri(new Date());
  var upcoming = [];

  /* Look for next 12 months of events */
  for (var offset = 0; offset <= 12; offset++) {
    var checkMonth = ((todayH.month - 1 + offset) % 12) + 1;
    var checkYear = todayH.year + Math.floor((todayH.month - 1 + offset) / 12);
    ISLAMIC_EVENTS_DEF.forEach(function(ev) {
      if (ev.month === checkMonth) {
        var greg = hijriToGregorian(checkYear, ev.month, ev.day);
        var diffDays = Math.ceil((greg - new Date()) / 86400000);
        if (diffDays >= -1) {
          upcoming.push({
            name: ev.name, icon: ev.icon,
            hijri: ev.day + ' ' + HIJRI_MONTHS[ev.month-1] + ' ' + checkYear,
            greg: greg.toLocaleDateString('en-US',{day:'numeric',month:'long',year:'numeric'}),
            days: diffDays
          });
        }
      }
    });
  }

  /* Sort by days */
  upcoming.sort(function(a,b) { return a.days - b.days; });
  /* Remove duplicates */
  var seen = {};
  upcoming = upcoming.filter(function(ev) {
    if (seen[ev.name]) return false;
    seen[ev.name] = true;
    return true;
  });

  var html = upcoming.slice(0, 10).map(function(ev) {
    var daysText = ev.days === 0 ? 'Today!'
      : ev.days === 1 ? 'Tomorrow'
      : 'In ' + ev.days + ' days';
    return '<div class="event-item">' +
      '<div class="event-icon">' + ev.icon + '</div>' +
      '<div class="event-info">' +
        '<div class="event-name">' + ev.name + '</div>' +
        '<div class="event-dates">' + ev.hijri + ' · ' + ev.greg + '</div>' +
      '</div>' +
      '<div class="event-countdown">' + daysText + '</div>' +
      '</div>';
  }).join('');

  container.innerHTML = html || '<div class="event-empty">No upcoming events found.</div>';
}

/* ══════════════════════════════════════
   NEXT EVENT COUNTDOWN (featured)
   ══════════════════════════════════════ */
function renderNextEventCountdown() {
  var container = el('event-countdown-card');
  if (!container) return;

  /* Prioritise Ramadan */
  var daysToRam = daysToNextRamadan();
  if (daysToRam !== null) {
    var pct = Math.round(((365 - daysToRam) / 365) * 100);
    container.innerHTML =
      '<div class="ec-icon">🌙</div>' +
      '<div class="ec-event">Ramadan</div>' +
      '<div class="ec-days">' + daysToRam + '</div>' +
      '<div class="ec-label">Days Remaining</div>' +
      '<div class="ec-arc-wrap">' +
        '<svg viewBox="0 0 100 100" class="ec-arc-svg">' +
          '<circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="6"/>' +
          '<circle cx="50" cy="50" r="40" fill="none" stroke="var(--gold)" stroke-width="6"' +
            ' stroke-linecap="round"' +
            ' stroke-dasharray="251.3" stroke-dashoffset="' + (251.3 * (1 - pct/100)) + '"' +
            ' transform="rotate(-90,50,50)" opacity="0.8"/>' +
        '</svg>' +
        '<div class="ec-arc-pct">' + pct + '%<br><span>of year</span></div>' +
      '</div>';
  }
}

/* ══════════════════════════════════════
   BOOT
   ══════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function() {
  initCalendarView();
  renderEventsList();
  renderNextEventCountdown();
});
