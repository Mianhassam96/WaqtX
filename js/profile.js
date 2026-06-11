'use strict';
/* ═══════════════════════════════════════════════
   WaqtX — Profile Page Logic v2
   Dashboard · Spiritual Growth · Statistics · Achievements
   ═══════════════════════════════════════════════ */

var S = WaqtX.storage;

/* ══════════════════════════════════════
   PERSONAL DASHBOARD
   ══════════════════════════════════════ */
function renderProfileDashboard() {
  var name   = S.get('name') || '';
  var dob    = S.get('dob')  || '';
  var h      = toHijri(new Date());
  var streak = getStreakCount();

  setText('profile-greeting', name
    ? 'Assalamu Alaikum, ' + name + ' ✦'
    : 'Assalamu Alaikum ✦');
  setText('profile-hijri', hijriStr(h));
  setText('profile-streak', streak);
  setText('profile-streak-label', streak === 1 ? 'Day Streak' : 'Day Streak');

  if (dob) {
    var birth = new Date(dob.replace(/-/g, '/'));
    var days  = Math.floor((Date.now() - birth) / 86400000);
    setText('profile-days', days.toLocaleString());
    var ageYrs = (days / 365.25).toFixed(1);
    setText('profile-age', ageYrs + ' years');
  } else {
    setText('profile-days', '—');
    setText('profile-age', '—');
  }
}

/* ══════════════════════════════════════
   SPIRITUAL GROWTH DASHBOARD
   ══════════════════════════════════════ */
function renderSpiritualDashboard() {
  var grid = el('spiritual-grid');
  if (!grid) return;

  var PRAYERS_5 = ['Fajr','Dhuhr','Asr','Maghrib','Isha'];

  function dayKey(offsetDays) {
    var d = new Date();
    d.setDate(d.getDate() - offsetDays);
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }

  /* Prayer consistency — last 30 days */
  function prayerPct(days) {
    var done = 0;
    for (var i = 0; i < days; i++) {
      var data = S.get('tracker_' + dayKey(i)) || {};
      PRAYERS_5.forEach(function(p) { if (data[p]) done++; });
    }
    return Math.round((done / (days * 5)) * 100);
  }

  /* Muhasabah / reflection consistency — last 30 days */
  function reflectionPct(days) {
    var reflected = 0;
    for (var i = 0; i < days; i++) {
      var key  = dayKey(i);
      var data = S.get('muhasabah_' + key) || {};
      var old  = (S.get('journal_' + key) || '').trim();
      var hasAny = ['gratitude', 'mistake', 'deed'].some(function(k) {
        return (data[k] || '').trim().length > 0;
      }) || old.length > 0;
      if (hasAny) reflected++;
    }
    return Math.round((reflected / days) * 100);
  }

  /* Gratitude consistency — last 30 days */
  function gratitudePct(days) {
    var count = 0;
    for (var i = 0; i < days; i++) {
      var data = S.get('gratitude_' + dayKey(i)) || {};
      if (data.b1 || data.b2 || data.b3) count++;
    }
    return Math.round((count / days) * 100);
  }

  var pPct = prayerPct(30);
  var rPct = reflectionPct(30);
  var gPct = gratitudePct(30);

  /* Journey completion — how much of WaqtX the user has engaged with */
  var featuresDone = [
    !!S.get('dob'),
    !!S.get('prayer_times'),
    getTotalPrayersLogged() > 0,
    (function() {
      try {
        return Object.keys(localStorage).some(function(k) {
          return k.startsWith('waqtx_muhasabah_') || k.startsWith('waqtx_journal_');
        });
      } catch(e) { return false; }
    })(),
    (function() {
      try {
        return Object.keys(localStorage).some(function(k) {
          return k.startsWith('waqtx_gratitude_');
        });
      } catch(e) { return false; }
    })()
  ].filter(Boolean).length;
  var journeyPct = Math.round((featuresDone / 5) * 100);

  function scoreBar(pct) {
    var cls = pct >= 80 ? 'sp-good' : pct >= 50 ? 'sp-mid' : 'sp-low';
    return '<div class="sp-bar-wrap">' +
      '<div class="sp-bar">' +
        '<div class="sp-bar-fill ' + cls + '" style="width:' + pct + '%"></div>' +
      '</div>' +
      '<span class="sp-bar-pct">' + pct + '%</span>' +
    '</div>';
  }

  var metrics = [
    {
      icon: '🕌',
      label: 'Prayer Consistency',
      sub: 'Last 30 days',
      pct: pPct,
      tip: pPct >= 80
        ? 'Excellent. Keep this rhythm.'
        : pPct >= 50
        ? 'Good progress — push for 80%.'
        : 'Start with one consistent prayer daily.'
    },
    {
      icon: '🪔',
      label: 'Daily Muhasabah',
      sub: 'Reflection days',
      pct: rPct,
      tip: rPct >= 80
        ? 'You are building real self-awareness.'
        : rPct >= 30
        ? 'Good habit forming — aim for daily.'
        : 'Open Reflection tonight — just 2 minutes.'
    },
    {
      icon: '🤲',
      label: 'Gratitude Practice',
      sub: 'Last 30 days',
      pct: gPct,
      tip: gPct >= 80
        ? 'A grateful heart is a protected heart.'
        : 'Name 3 blessings today on the Reflection page.'
    },
    {
      icon: '🌙',
      label: 'Journey Completion',
      sub: 'Features engaged',
      pct: journeyPct,
      tip: journeyPct < 100
        ? 'Set your DOB, load prayer times, and start reflecting.'
        : 'You are using WaqtX fully. Alhamdulillah.'
    }
  ];

  grid.innerHTML = metrics.map(function(m) {
    return '<div class="sp-card">' +
      '<div class="sp-card-top">' +
        '<span class="sp-icon">' + m.icon + '</span>' +
        '<div class="sp-info">' +
          '<div class="sp-label">' + m.label + '</div>' +
          '<div class="sp-sub">' + m.sub + '</div>' +
        '</div>' +
      '</div>' +
      scoreBar(m.pct) +
      '<div class="sp-tip">' + m.tip + '</div>' +
    '</div>';
  }).join('');
}

/* ══════════════════════════════════════
   STATISTICS
   ══════════════════════════════════════ */
function renderStatistics() {
  var prayersLogged = getTotalPrayersLogged();

  /* Count muhasabah days (+ legacy journal entries) */
  var muhasabahCount = 0;
  try {
    Object.keys(localStorage).forEach(function(k) {
      if (k.startsWith('waqtx_muhasabah_') && localStorage.getItem(k)) muhasabahCount++;
      else if (k.startsWith('waqtx_journal_')  && localStorage.getItem(k)) muhasabahCount++;
    });
  } catch(e) {}

  /* Count gratitude days */
  var gratCount = 0;
  try {
    Object.keys(localStorage).forEach(function(k) {
      if (k.startsWith('waqtx_gratitude_')) gratCount++;
    });
  } catch(e) {}

  /* Days to next Friday */
  var dow       = new Date().getDay();
  var daysToFri = dow === 5 ? 0 : (5 - dow + 7) % 7;

  setText('stat-prayers',      prayersLogged.toLocaleString());
  setText('stat-journal',      muhasabahCount);
  setText('stat-gratitude',    gratCount);
  setText('stat-streak',       getStreakCount());
  setText('stat-next-friday',  daysToFri === 0 ? 'Today' : 'In ' + daysToFri + ' days');
}

/* ══════════════════════════════════════
   ACHIEVEMENTS
   ══════════════════════════════════════ */
var ACHIEVEMENTS = [
  {
    id: 'first_reflection',
    label: 'First Muhasabah',
    desc: 'Completed your first daily reflection.',
    icon: '🪔',
    check: function() {
      try {
        return Object.keys(localStorage).some(function(k) {
          return (k.startsWith('waqtx_muhasabah_') || k.startsWith('waqtx_journal_'))
            && localStorage.getItem(k);
        });
      } catch(e) { return false; }
    }
  },
  {
    id: 'streak_7',
    label: '7 Day Prayer Streak',
    desc: 'Prayed all 5 prayers for 7 days straight.',
    icon: '⭐',
    check: function() { return getStreakCount() >= 7; }
  },
  {
    id: 'streak_30',
    label: '30 Day Streak',
    desc: 'A full month of consistent prayer.',
    icon: '🏅',
    check: function() { return getStreakCount() >= 30; }
  },
  {
    id: 'prayers_100',
    label: '100 Prayers Logged',
    desc: 'Logged over 100 prayers in WaqtX.',
    icon: '🕌',
    check: function() { return getTotalPrayersLogged() >= 100; }
  },
  {
    id: 'capsule_generated',
    label: 'Time Capsule',
    desc: 'Created your Islamic Time Capsule.',
    icon: '📜',
    check: function() { return !!S.get('capsule_generated'); }
  },
  {
    id: 'gratitude_7',
    label: '7 Days Grateful',
    desc: 'Completed the gratitude journal 7 times.',
    icon: '🤲',
    check: function() {
      var count = 0;
      try {
        Object.keys(localStorage).forEach(function(k) {
          if (k.startsWith('waqtx_gratitude_')) count++;
        });
      } catch(e) {}
      return count >= 7;
    }
  },
  {
    id: 'dob_set',
    label: 'Journey Begun',
    desc: 'Set your date of birth to begin your journey.',
    icon: '🌱',
    check: function() { return !!S.get('dob'); }
  },
  {
    id: 'prayer_times_loaded',
    label: 'Prayer Rhythm',
    desc: 'Loaded your personal prayer times.',
    icon: '🕐',
    check: function() { return !!S.get('prayer_times'); }
  }
];

function renderAchievements() {
  var grid = el('achievements-grid');
  if (!grid) return;

  var html = ACHIEVEMENTS.map(function(ach) {
    var unlocked = ach.check();
    return '<div class="ach-card' + (unlocked ? ' ach-unlocked' : ' ach-locked') + '">' +
      '<div class="ach-icon">' + ach.icon + '</div>' +
      '<div class="ach-label">' + ach.label + '</div>' +
      '<div class="ach-desc">'  + ach.desc  + '</div>' +
      (unlocked
        ? '<div class="ach-check">✓ Earned</div>'
        : '<div class="ach-locked-label">Locked</div>') +
    '</div>';
  }).join('');

  grid.innerHTML = html;

  var earned = ACHIEVEMENTS.filter(function(a) { return a.check(); }).length;
  setText('ach-summary', earned + ' / ' + ACHIEVEMENTS.length + ' earned');
}

/* ══════════════════════════════════════
   BOOT
   ══════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function() {
  renderProfileDashboard();
  renderSpiritualDashboard();
  renderStatistics();
  renderAchievements();
});
