'use strict';
/* ═══════════════════════════════════════════════
   WaqtX — Profile Page Logic
   Dashboard · Statistics · Achievements
   ═══════════════════════════════════════════════ */

var S = WaqtX.storage;

/* ══════════════════════════════════════
   PERSONAL DASHBOARD
   ══════════════════════════════════════ */
function renderProfileDashboard() {
  var name = S.get('name') || '';
  var dob  = S.get('dob')  || '';
  var h    = toHijri(new Date());
  var streak = getStreakCount();

  setText('profile-greeting', name
    ? 'Assalamu Alaikum, ' + name + ' ✦'
    : 'Assalamu Alaikum ✦');
  setText('profile-hijri', hijriStr(h));
  setText('profile-streak', streak);
  setText('profile-streak-label', streak === 1 ? 'Day Streak' : 'Day Streak');

  if (dob) {
    var birth = new Date(dob.replace(/-/g, '/'));
    var days = Math.floor((Date.now() - birth) / 86400000);
    setText('profile-days', days.toLocaleString());
    var ageYrs = (days / 365.25).toFixed(1);
    setText('profile-age', ageYrs + ' years');
  } else {
    setText('profile-days', '—');
    setText('profile-age', '—');
  }
}

/* ══════════════════════════════════════
   STATISTICS
   ══════════════════════════════════════ */
function renderStatistics() {
  var prayersLogged = getTotalPrayersLogged();

  /* Count journal entries */
  var journalCount = 0;
  try {
    Object.keys(localStorage).forEach(function(k) {
      if (k.startsWith('waqtx_journal_') && localStorage.getItem(k)) journalCount++;
    });
  } catch(e) {}

  /* Count gratitude entries */
  var gratCount = 0;
  try {
    Object.keys(localStorage).forEach(function(k) {
      if (k.startsWith('waqtx_gratitude_')) gratCount++;
    });
  } catch(e) {}

  /* Next Friday countdown */
  var today = new Date();
  var dow = today.getDay();
  var daysToFri = dow === 5 ? 0 : (5 - dow + 7) % 7;

  setText('stat-prayers', prayersLogged.toLocaleString());
  setText('stat-journal', journalCount);
  setText('stat-gratitude', gratCount);
  setText('stat-streak', getStreakCount());
  setText('stat-next-friday', daysToFri === 0 ? 'Today' : 'In ' + daysToFri + ' days');
}

/* ══════════════════════════════════════
   ACHIEVEMENTS
   ══════════════════════════════════════ */
var ACHIEVEMENTS = [
  {
    id: 'first_reflection',
    label: 'First Reflection',
    desc: 'Wrote your first journal entry.',
    icon: '🪔',
    check: function() {
      var k = getTodayKey();
      /* Any journal entry at all */
      try {
        return Object.keys(localStorage).some(function(key) {
          return key.startsWith('waqtx_journal_') && localStorage.getItem(key);
        });
      } catch(e) { return false; }
    }
  },
  {
    id: 'streak_7',
    label: '7 Day Streak',
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
      '<div class="ach-desc">' + ach.desc + '</div>' +
      (unlocked ? '<div class="ach-check">✓ Earned</div>' : '<div class="ach-locked-label">Locked</div>') +
      '</div>';
  }).join('');

  grid.innerHTML = html;

  /* Summary */
  var earned = ACHIEVEMENTS.filter(function(a) { return a.check(); }).length;
  setText('ach-summary', earned + ' / ' + ACHIEVEMENTS.length + ' earned');
}

/* ══════════════════════════════════════
   BOOT
   ══════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function() {
  renderProfileDashboard();
  renderStatistics();
  renderAchievements();
});
