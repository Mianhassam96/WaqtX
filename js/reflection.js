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
   REFLECTION PROMPTS (daily rotation)
   ══════════════════════════════════════ */
var PROMPTS = [
  'What lesson stood out to me today from the Quran or Sunnah?',
  'How did I feel during my salah today? What was on my mind?',
  'What am I struggling with, and how can I bring Allah into that?',
  'What is one habit I want to build this week for my deen?',
  'Who in my life needs my dua right now, and why?',
  'What did Allah protect me from today that I may not even know about?',
  'How did I use my time today? Would I be pleased to show it to Allah?',
  'What is one thing I can do tomorrow that my future self will thank me for?',
  'When did I feel closest to Allah today?',
  'What would I do differently if I truly believed this day might be my last?',
  'What blessing am I most taking for granted right now?',
  'If I could have one conversation with the Prophet ﷺ, what would I ask?',
  'What sin am I holding onto that I need to seek forgiveness for?',
  'How can I be of more service to others this week?',
  'What does "trusting Allah" actually look like in my current situation?'
];

function renderReflectionPrompt() {
  var dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  var prompt = PROMPTS[dayOfYear % PROMPTS.length];
  setText('reflection-prompt-text', prompt);

  var today = getTodayKey();
  var saved = S.get('journal_' + today) || '';
  var textarea = el('reflection-journal');
  if (textarea) {
    textarea.value = saved;
    textarea.addEventListener('input', function() {
      S.set('journal_' + today, textarea.value);
      updateJournalStatus();
    });
  }
  updateJournalStatus();
}

function updateJournalStatus() {
  var today = getTodayKey();
  var val = S.get('journal_' + today) || '';
  var status = el('journal-status');
  if (status) {
    status.textContent = val.length > 0
      ? '✓ Saved (' + val.length + ' chars)'
      : 'Start writing — only you can see this.';
  }
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
  renderReflectionPrompt();
  renderGratitude();
  renderNotes();
});
