'use strict';
/* ═══════════════════════════════════════════════
   WaqtX — Reflection Page  (Phase 1 rebuild)

   Flow:
     1. Arrive   — streak + calm entry
     2. Receive  — today's Ayah + consider prompt
     3. Muhasabah— 3 canonical fields, autosave
     4. Write    — free personal note, autosave
     5. History  — past reflections, last 7 days

   Storage contract (from core.js WaqtX.keys):
     muhasabah_YYYY-MM-DD → { gratitude, mistake, deed }
     notes                → string (permanent notepad)

   All fields use canonical IDs shared with index.html:
     mq-gratitude / mq-mistake / mq-deed
   ═══════════════════════════════════════════════ */

var S = WaqtX.storage;

/* ══════════════════════════════════════
   UTILITIES
   ══════════════════════════════════════ */
function _dateKey(offset) {
  return getDateKey(offset || 0);
}

function _dayLabel(dateKey) {
  var d     = new Date(dateKey + 'T00:00:00');
  var today = _dateKey(0);
  var yest  = _dateKey(-1);
  if (dateKey === today) return 'Today';
  if (dateKey === yest)  return 'Yesterday';
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

function _hasContent(obj) {
  if (!obj) return false;
  return ['gratitude', 'mistake', 'deed'].some(function(k) {
    return (obj[k] || '').trim().length > 0;
  });
}

function _preview(obj) {
  /* Return first non-empty field as a short preview string */
  var keys = ['gratitude', 'mistake', 'deed'];
  for (var i = 0; i < keys.length; i++) {
    var v = (obj[keys[i]] || '').trim();
    if (v) return v.length > 80 ? v.substring(0, 80) + '…' : v;
  }
  return '';
}

/* ══════════════════════════════════════
   ZONE 1 — STREAK
   ══════════════════════════════════════ */
function renderStreak() {
  var streak = calcReflectionStreak();
  var textEl = el('rl-streak-text');
  var wrapEl = el('rl-streak');
  if (!textEl || !wrapEl) return;

  if (streak === 0) {
    textEl.textContent = 'Begin today\'s reflection';
    wrapEl.setAttribute('data-streak', '0');
  } else if (streak === 1) {
    textEl.textContent = 'Reflected today — start a streak tomorrow';
    wrapEl.setAttribute('data-streak', '1');
  } else {
    textEl.textContent = streak + ' day reflection streak';
    wrapEl.setAttribute('data-streak', streak >= 7 ? '7plus' : String(streak));
  }

  /* Store for profile page */
  S.set('reflection_streak', streak);
}

function calcReflectionStreak() {
  var streak = 0;
  for (var i = 0; i < 365; i++) {
    var key  = _dateKey(-i);
    var data = WaqtX.getMuhasabah(key);
    var hasNote = !!(S.get('notes') || '').trim() && i === 0; /* notes only count for today */
    if (_hasContent(data) || hasNote) {
      streak++;
    } else if (i === 0) {
      /* Haven't written today yet — don't break existing streak */
    } else {
      break;
    }
  }
  return streak;
}

/* ══════════════════════════════════════
   ZONE 2 — TODAY'S GUIDANCE
   ══════════════════════════════════════ */
function renderGuidance() {
  if (!window.DAILY_AYAHS || !DAILY_AYAHS.length) return;

  var doy  = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  var ayah = DAILY_AYAHS[doy % DAILY_AYAHS.length];

  /* Arabic */
  var arabicEl = el('verse-arabic');
  if (arabicEl) {
    arabicEl.innerHTML = '';
    arabicEl.textContent = ayah.arabic;
  }

  setText('verse-translation', ayah.translation);
  setText('verse-source',      ayah.source);
  setText('verse-reflection',  ayah.reflection || '');

  /* Show consider block only if reflection text exists */
  var considerEl = el('rl-consider');
  if (considerEl) {
    considerEl.style.display = ayah.reflection ? '' : 'none';
  }

  /* Audio button */
  var audioBtn = el('btn-verse-audio');
  if (audioBtn) {
    var _audio = null;
    audioBtn.addEventListener('click', function() {
      /* Stop if already playing */
      if (_audio && !_audio.paused) {
        _audio.pause();
        _audio.currentTime = 0;
        audioBtn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polygon points="5 3 19 12 5 21 5 3"/></svg> Play';
        return;
      }
      var surahM = ayah.source.match(/(\d+):\d+/);
      var verseM = ayah.source.match(/\d+:(\d+)/);
      if (!surahM || !verseM) { audioBtn.textContent = 'Unavailable'; return; }
      var verseNum = parseInt(surahM[1]) * 1000 + parseInt(verseM[1]);
      var url = 'https://cdn.islamic.network/quran/audio/128/ar.alafasy/' + verseNum + '.mp3';
      _audio = new Audio(url);
      _audio.play().catch(function() {
        audioBtn.innerHTML = 'Audio unavailable';
      });
      audioBtn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> Pause';
      _audio.onended = function() {
        audioBtn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polygon points="5 3 19 12 5 21 5 3"/></svg> Play';
      };
      _audio.onerror = function() {
        audioBtn.textContent = 'Audio unavailable';
      };
    });
  }
}

/* ══════════════════════════════════════
   ZONE 3 — MUHASABAH
   Uses canonical keys from WaqtX.MUHASABAH_FIELDS
   ══════════════════════════════════════ */
var _saveTimer = null;

function renderMuhasabah() {
  var today = _dateKey(0);
  var saved = WaqtX.getMuhasabah(today);

  WaqtX.MUHASABAH_FIELDS.forEach(function(f) {
    var ta = el(f.id);
    if (!ta) return;
    ta.value = saved[f.key] || '';
    ta.addEventListener('input', function() {
      WaqtX.saveMuhasabahField(f.key, ta.value, today);
      _scheduleStatusUpdate();
    });
  });

  _updateMuhasabahStatus();
}

function _scheduleStatusUpdate() {
  clearTimeout(_saveTimer);
  _saveTimer = setTimeout(function() {
    _updateMuhasabahStatus();
    renderStreak();
    renderHistory();
  }, 600);
}

function _updateMuhasabahStatus() {
  var today  = _dateKey(0);
  var saved  = WaqtX.getMuhasabah(today);
  var filled = WaqtX.MUHASABAH_FIELDS.filter(function(f) {
    return (saved[f.key] || '').trim().length > 0;
  }).length;

  var statusEl = el('mq-status');
  if (!statusEl) return;

  if (filled === 0) {
    statusEl.textContent = '';
    statusEl.className = 'rl-save-status';
  } else if (filled < 3) {
    statusEl.textContent = filled + ' of 3 saved';
    statusEl.className = 'rl-save-status rl-save-partial';
  } else {
    statusEl.textContent = 'Saved — Alhamdulillah';
    statusEl.className = 'rl-save-status rl-save-complete';
  }
}

/* ══════════════════════════════════════
   ZONE 4 — FREE NOTE (permanent notepad)
   ══════════════════════════════════════ */
function renderNote() {
  var ta = el('personal-notes');
  if (!ta) return;
  ta.value = S.get('notes') || '';

  var _noteTimer = null;
  ta.addEventListener('input', function() {
    S.set('notes', ta.value);
    clearTimeout(_noteTimer);
    var statusEl = el('notes-status');
    if (statusEl) {
      statusEl.textContent = '';
      statusEl.className = 'rl-save-status';
    }
    _noteTimer = setTimeout(function() {
      if (statusEl) {
        statusEl.textContent = 'Saved';
        statusEl.className = 'rl-save-status rl-save-complete';
        setTimeout(function() {
          statusEl.textContent = '';
        }, 2500);
      }
    }, 700);
  });
}

/* ══════════════════════════════════════
   ZONE 5 — REFLECTION HISTORY
   Last 14 days with content. Today shown first.
   ══════════════════════════════════════ */
var _historyShowing = 5;

function renderHistory() {
  var listEl  = el('rl-history-list');
  var emptyEl = el('rl-history-empty');
  var footerEl = el('rl-history-footer');
  if (!listEl) return;

  /* Build pool — last 30 days that have content */
  var pool = [];
  for (var i = 0; i < 30; i++) {
    var key  = _dateKey(-i);
    var data = WaqtX.getMuhasabah(key);
    if (_hasContent(data)) {
      pool.push({ key: key, data: data });
    }
  }

  if (!pool.length) {
    if (emptyEl) emptyEl.style.display = '';
    if (footerEl) footerEl.style.display = 'none';
    return;
  }

  if (emptyEl) emptyEl.style.display = 'none';

  var showing = pool.slice(0, _historyShowing);
  var html = '';

  showing.forEach(function(entry) {
    var label   = _dayLabel(entry.key);
    var preview = _preview(entry.data);
    var fields  = WaqtX.MUHASABAH_FIELDS.filter(function(f) {
      return (entry.data[f.key] || '').trim().length > 0;
    }).length;
    var isToday = entry.key === _dateKey(0);

    html += '<div class="rl-history-item' + (isToday ? ' rl-history-today' : '') + '">';
    html += '<div class="rl-history-meta">';
    html += '<span class="rl-history-date">' + _esc(label) + '</span>';
    html += '<span class="rl-history-count">' + fields + '/3</span>';
    html += '</div>';
    if (preview) {
      html += '<p class="rl-history-preview">' + _esc(preview) + '</p>';
    }
    html += '</div>';
  });

  listEl.innerHTML = html;

  /* Show More button */
  if (footerEl) {
    if (pool.length > _historyShowing) {
      footerEl.style.display = '';
    } else {
      footerEl.style.display = 'none';
    }
  }
}

function _esc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

/* ══════════════════════════════════════
   BOOT
   ══════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function() {
  renderStreak();
  renderGuidance();
  renderMuhasabah();
  renderNote();
  renderHistory();

  /* Show More */
  var moreBtn = el('btn-history-more');
  if (moreBtn) {
    moreBtn.addEventListener('click', function() {
      _historyShowing += 7;
      renderHistory();
    });
  }
});
