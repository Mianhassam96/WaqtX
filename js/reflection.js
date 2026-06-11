'use strict';
/* ═══════════════════════════════════════════════
   WaqtX — Reflection Page Logic
   Daily Verse · Journal · Gratitude · Notes
   ═══════════════════════════════════════════════ */

var S = WaqtX.storage;

/* ══════════════════════════════════════
   DAILY VERSE (same rotation as Home)
   ══════════════════════════════════════ */
function renderDailyVerse() {
  if (!window.DAILY_AYAHS || !DAILY_AYAHS.length) return;
  var dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  var ayah = DAILY_AYAHS[dayOfYear % DAILY_AYAHS.length];

  setText('verse-arabic', ayah.arabic);
  setText('verse-translation', ayah.translation);
  setText('verse-source', ayah.source);
  setText('verse-reflection', ayah.reflection || '');

  /* Audio play button */
  var playBtn = el('btn-verse-audio');
  if (playBtn) {
    playBtn.addEventListener('click', function() {
      /* Quran audio via verse number — use Al-Afasy recitation */
      var surah = ayah.source.match(/(\d+):\d+/);
      var verse = ayah.source.match(/\d+:(\d+)/);
      if (surah && verse) {
        var url = 'https://cdn.islamic.network/quran/audio/128/ar.alafasy/' +
          (parseInt(surah[1]) * 1000 + parseInt(verse[1])) + '.mp3';
        var audio = new Audio(url);
        audio.play().catch(function() {
          playBtn.textContent = '🔇 Audio unavailable';
        });
        playBtn.textContent = '⏸ Playing…';
        audio.onended = function() { playBtn.textContent = '▶ Play'; };
        audio.onerror = function() { playBtn.textContent = '🔇 Audio unavailable'; };
      }
    });
  }
}

/* ══════════════════════════════════════
   DAILY MUHASABAH — 3 guided questions
   Replaces random reflection generator
   ══════════════════════════════════════ */
function renderMuhasabah() {
  var today  = getTodayKey();
  var saved  = S.get('muhasabah_' + today) || {};

  var fields = [
    { id: 'mq-gratitude', key: 'gratitude' },
    { id: 'mq-mistake',   key: 'mistake'   },
    { id: 'mq-deed',      key: 'deed'      }
  ];

  fields.forEach(function(f) {
    var el2 = el(f.id);
    if (!el2) return;
    el2.value = saved[f.key] || '';
    el2.addEventListener('input', function() {
      var data = S.get('muhasabah_' + today) || {};
      data[f.key] = el2.value;
      S.set('muhasabah_' + today, data);
      updateMuhasabahStatus();
      updateReflectionStreak();
    });
  });

  updateMuhasabahStatus();
  updateReflectionStreak();
}

function updateMuhasabahStatus() {
  var today  = getTodayKey();
  var saved  = S.get('muhasabah_' + today) || {};
  var filled = ['gratitude','mistake','deed'].filter(function(k) {
    return (saved[k] || '').trim().length > 0;
  }).length;
  var status = el('mq-status');
  if (!status) return;
  if (filled === 0) {
    status.textContent = 'Start writing — your answers are saved as you type.';
  } else if (filled < 3) {
    status.textContent = filled + ' of 3 answered. Take your time.';
  } else {
    status.textContent = '✓ Muhasabah complete for today. Alhamdulillah.';
  }
}

function updateReflectionStreak() {
  /* Count consecutive days with at least one muhasabah answer */
  var streak = 0;
  var d = new Date();
  for (var i = 0; i < 365; i++) {
    var key  = d.getFullYear() + '-' +
               String(d.getMonth() + 1).padStart(2,'0') + '-' +
               String(d.getDate()).padStart(2,'0');
    var data = S.get('muhasabah_' + key) || {};
    var hasAny = ['gratitude','mistake','deed'].some(function(k) {
      return (data[k] || '').trim().length > 0;
    });
    /* Also count old journal entries for backward compat */
    var hasJournal = !!(S.get('journal_' + key) || '').trim();
    if (hasAny || hasJournal) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else if (i === 0) {
      /* Haven't reflected today yet — don't break streak */
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }

  var bar  = el('reflection-streak-bar');
  var text = el('rsb-text');
  if (!bar || !text) return;

  if (streak === 0) {
    text.textContent = 'Reflect today to begin your streak.';
    bar.className = 'reflection-streak-bar';
  } else if (streak === 1) {
    text.textContent = 'Reflected today ✓  —  Start your streak tomorrow.';
    bar.className = 'reflection-streak-bar rsb-active';
  } else {
    text.textContent = streak + ' day reflection streak 🔥  —  Keep going.';
    bar.className = 'reflection-streak-bar rsb-active rsb-streak';
  }

  /* Store streak for profile page */
  S.set('reflection_streak', streak);
}

/* ══════════════════════════════════════
   GRATITUDE JOURNAL
   ══════════════════════════════════════ */
function renderGratitude() {
  var today = getTodayKey();
  var saved = S.get('gratitude_' + today) || {};

  for (var i = 1; i <= 3; i++) {
    var input = el('gratitude-' + i);
    if (!input) continue;
    input.value = saved['b' + i] || '';
    (function(idx, inp) {
      inp.addEventListener('input', function() {
        var data = S.get('gratitude_' + today) || {};
        data['b' + idx] = inp.value;
        S.set('gratitude_' + today, data);
      });
    })(i, input);
  }
}

/* ══════════════════════════════════════
   PERSONAL NOTES
   ══════════════════════════════════════ */
function renderNotes() {
  var textarea = el('personal-notes');
  if (!textarea) return;
  textarea.value = S.get('notes') || '';
  textarea.addEventListener('input', function() {
    S.set('notes', textarea.value);
    var status = el('notes-status');
    if (status) status.textContent = '✓ Saved';
  });
}

/* ══════════════════════════════════════
   BOOT
   ══════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function() {
  renderDailyVerse();
  renderMuhasabah();
  renderGratitude();
  renderNotes();
});
