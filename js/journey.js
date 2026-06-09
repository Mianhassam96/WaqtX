'use strict';
/* ═══════════════════════════════════════════════
   WaqtX — Journey Page Logic
   Life Overview · Islamic Counters · Chapters · Time Capsule
   ═══════════════════════════════════════════════ */

var S = WaqtX.storage;

/* ══════════════════════════════════════
   CALCULATE STATS FROM DOB
   ══════════════════════════════════════ */
function calcStats(dob) {
  var birth = typeof dob === 'string'
    ? (function(s){ var p=s.split('-'); return new Date(+p[0],+p[1]-1,+p[2]); })(dob)
    : dob;
  var now = new Date();
  var ms = now - birth;
  var days = Math.floor(ms / 86400000);
  var ageYrs = days / 365.25;

  /* Age breakdown */
  var yy = now.getFullYear() - birth.getFullYear();
  var mo = now.getMonth() - birth.getMonth();
  var dd = now.getDate() - birth.getDate();
  if (dd < 0) { dd += new Date(now.getFullYear(), now.getMonth(), 0).getDate(); mo--; }
  if (mo < 0) { mo += 12; yy--; }

  var hijriBirth = toHijri(birth);
  var hijriNow   = toHijri(now);

  var ramadans = Math.floor(ageYrs);
  var fridays  = Math.floor(days / 7);
  var eids     = ramadans; /* ~1 Eid per year */
  var prayerMoments = days * 5;

  return { birth, days, ageYrs, yy, mo, dd, hijriBirth, hijriNow,
           ramadans, fridays, eids, prayerMoments };
}

/* ══════════════════════════════════════
   LIFE OVERVIEW
   ══════════════════════════════════════ */
function renderLifeOverview(stats) {
  var name = S.get('name') || '';
  var dob = S.get('dob') || '';
  if (!dob) {
    var section = el('life-overview');
    if (section) {
      section.innerHTML = '<div class="journey-prompt">' +
        '<div class="jp-icon">🌙</div>' +
        '<div class="jp-text">Enter your date of birth on the <a href="index.html">Home page</a> to see your personal Islamic journey.</div>' +
        '</div>';
    }
    return;
  }

  setText('journey-name', name ? 'Assalamu Alaikum, ' + name : 'Assalamu Alaikum');
  setText('journey-dob-greg', stats.birth.toLocaleDateString('en-US', { day:'numeric', month:'long', year:'numeric' }));
  setText('journey-dob-hijri', hijriStr(stats.hijriBirth));
  setText('journey-age', stats.yy + ' years, ' + stats.mo + ' months, ' + stats.dd + ' days');
  setText('journey-days', stats.days.toLocaleString());
}

/* ══════════════════════════════════════
   ISLAMIC JOURNEY COUNTERS
   ══════════════════════════════════════ */
function renderIslamicCounters(stats) {
  var counters = [
    { id: 'counter-ramadans', val: stats.ramadans, label: 'Ramadans Experienced', icon: '🌙' },
    { id: 'counter-eids-fitr', val: stats.eids,  label: 'Eids ul-Fitr', icon: '🎉' },
    { id: 'counter-eids-adha', val: stats.eids,  label: 'Eids ul-Adha', icon: '🕋' },
    { id: 'counter-jumuahs',   val: stats.fridays, label: "Jumu'ahs Lived", icon: '🕌' }
  ];
  counters.forEach(function(c) {
    var el2 = el(c.id);
    if (el2) el2.setAttribute('data-counter', c.val);
  });
  observeCounters();
}

/* ══════════════════════════════════════
   PRAYER OPPORTUNITIES
   ══════════════════════════════════════ */
function renderPrayerMoments(stats) {
  var el2 = el('prayer-moments-count');
  if (el2) {
    el2.setAttribute('data-counter', stats.prayerMoments);
    observeCounters();
  }
}

/* ══════════════════════════════════════
   LIFE CHAPTERS TIMELINE
   ══════════════════════════════════════ */
var CHAPTERS = [
  { id: 'birth',     label: 'Birth',     range: [0, 0],  reflection: 'A soul entrusted to this world by Allah.',                                  icon: '🌱' },
  { id: 'childhood', label: 'Childhood', range: [1, 12], reflection: 'Years of discovery — every day a new ayah of life.',                        icon: '🌿' },
  { id: 'youth',     label: 'Youth',     range: [13,24], reflection: 'The Prophet ﷺ said: "Take advantage of your youth before your old age."',   icon: '⭐' },
  { id: 'adulthood', label: 'Adulthood', range: [25,59], reflection: 'Building your legacy — each deed written by the angels.',                   icon: '🕌' },
  { id: 'wisdom',    label: 'Wisdom',    range: [60,99], reflection: 'Age is a gift — the elders who worship Allah are honoured before Him.',      icon: '🌙' }
];

function renderLifeChapters(stats) {
  var container = el('life-chapters');
  if (!container) return;
  var ageYrs = stats.ageYrs;
  var html = '';
  CHAPTERS.forEach(function(ch, idx) {
    var isActive = ageYrs >= ch.range[0] && ageYrs <= ch.range[1];
    var isPast   = ageYrs > ch.range[1];
    html += '<div class="chapter-item' +
      (isActive ? ' chapter-current' : '') +
      (isPast   ? ' chapter-past' : '') + '">' +
      '<div class="chapter-dot">' + ch.icon + '</div>' +
      '<div class="chapter-content">' +
        '<div class="chapter-label">' + ch.label +
          (ch.range[0] > 0 ? '<span class="chapter-range"> (' + ch.range[0] + '–' + ch.range[1] + ')</span>' : '') +
        '</div>' +
        '<div class="chapter-reflection">' + ch.reflection + '</div>' +
        (isActive ? '<div class="chapter-current-badge">You are here ✦</div>' : '') +
      '</div>' +
      '<div class="chapter-line' + (idx === CHAPTERS.length - 1 ? ' hidden' : '') + '"></div>' +
      '</div>';
  });
  container.innerHTML = html;
}

/* ══════════════════════════════════════
   ISLAMIC TIME CAPSULE
   ══════════════════════════════════════ */
function renderCapsule(stats) {
  var card = el('capsule-card');
  if (!card) return;
  var name = S.get('name') || 'A Muslim';
  var dob = S.get('dob') || '';
  var dobFmt = dob
    ? new Date(dob.replace(/-/g,'/')).toLocaleDateString('en-US',{day:'numeric',month:'long',year:'numeric'})
    : '—';

  card.innerHTML =
    '<div class="cap-logo">WaqtX ✦</div>' +
    '<div class="cap-name">' + name + '</div>' +
    '<div class="cap-dob">Born ' + dobFmt + '</div>' +
    '<div class="cap-hijri">Islamic Birthday: ' + hijriStr(stats.hijriBirth) + '</div>' +
    '<div class="cap-divider"></div>' +
    '<div class="cap-stats">' +
      '<div class="cap-stat"><span class="cap-stat-icon">🌙</span><span class="cap-stat-val">' + stats.ramadans + '</span><span class="cap-stat-lbl">Ramadans</span></div>' +
      '<div class="cap-stat"><span class="cap-stat-icon">🕌</span><span class="cap-stat-val">' + stats.fridays.toLocaleString() + '</span><span class="cap-stat-lbl">Jumu\'ahs</span></div>' +
      '<div class="cap-stat"><span class="cap-stat-icon">📿</span><span class="cap-stat-val">' + stats.prayerMoments.toLocaleString() + '</span><span class="cap-stat-lbl">Prayer Moments</span></div>' +
    '</div>' +
    '<div class="cap-verse">"By time, indeed mankind is in loss — except those who have believed." — 103:1-2</div>' +
    '<div class="cap-url">mianhassam96.github.io/WaqtX</div>';
}

function initCapsuleShare() {
  var btnDownload = el('btn-capsule-download');
  var btnShare = el('btn-capsule-share');
  var card = el('capsule-card');

  if (btnDownload && card) {
    btnDownload.addEventListener('click', function() {
      /* Use html2canvas if available */
      if (typeof html2canvas !== 'undefined') {
        html2canvas(card, { scale: 2, useCORS: true, backgroundColor: '#07121F' })
          .then(function(canvas) {
            var link = document.createElement('a');
            link.download = 'my-waqtx-journey.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
            S.set('capsule_generated', true);
          });
      } else {
        alert('Download: Copy the link below to share your journey.');
      }
    });
  }

  if (btnShare) {
    btnShare.addEventListener('click', function() {
      var url = 'https://mianhassam96.github.io/WaqtX/journey.html';
      var text = 'My personal Islamic journey — powered by WaqtX ✦';
      if (navigator.share) {
        navigator.share({ title: 'My WaqtX Journey', text: text, url: url });
      } else {
        navigator.clipboard.writeText(url).then(function() {
          btnShare.textContent = '✓ Link Copied!';
          setTimeout(function() { btnShare.textContent = '🔗 Copy Link'; }, 2000);
        });
      }
      S.set('capsule_generated', true);
    });
  }
}

/* ══════════════════════════════════════
   DOB INPUT (if not set)
   ══════════════════════════════════════ */
function initDOBInput() {
  var form = el('journey-dob-form');
  if (!form) return;
  var input = el('journey-dob-input');
  var nameInput = el('journey-name-input');
  if (!input) return;

  /* Pre-fill if saved */
  var savedDob = S.get('dob');
  var savedName = S.get('name');
  if (savedDob && input) input.value = savedDob;
  if (savedName && nameInput) nameInput.value = savedName;

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    var dob = input.value;
    if (!dob) return;
    if (nameInput && nameInput.value.trim()) S.set('name', nameInput.value.trim());
    S.set('dob', dob);
    initJourneyPage();
  });
}

/* ══════════════════════════════════════
   BOOT
   ══════════════════════════════════════ */
function initJourneyPage() {
  var dob = S.get('dob');
  if (!dob) {
    initDOBInput();
    /* Show placeholder counters */
    ['counter-ramadans','counter-eids-fitr','counter-eids-adha','counter-jumuahs','prayer-moments-count'].forEach(function(id) {
      setText(id, '—');
    });
    return;
  }

  var stats = calcStats(dob);
  renderLifeOverview(stats);
  renderIslamicCounters(stats);
  renderPrayerMoments(stats);
  renderLifeChapters(stats);
  renderCapsule(stats);
  initCapsuleShare();
  initDOBInput(); /* still init so user can update */
}

document.addEventListener('DOMContentLoaded', initJourneyPage);
