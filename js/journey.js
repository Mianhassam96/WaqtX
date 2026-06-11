'use strict';
/* ═══════════════════════════════════════════════
   WaqtX — Journey Page Logic v2
   Life Overview · Islamic Counters · Milestones · Life Remaining · Capsule
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

  var yy = now.getFullYear() - birth.getFullYear();
  var mo = now.getMonth() - birth.getMonth();
  var dd = now.getDate() - birth.getDate();
  if (dd < 0) { dd += new Date(now.getFullYear(), now.getMonth(), 0).getDate(); mo--; }
  if (mo < 0) { mo += 12; yy--; }

  var hijriBirth = toHijri(birth);
  var hijriNow   = toHijri(now);

  var ramadans     = Math.floor(ageYrs);
  var fridays      = Math.floor(days / 7);
  var eids         = ramadans;
  var prayerMoments = days * 5;
  var fastingDays  = ramadans * 29; /* avg Ramadan ~29.5 days */
  var laylatulQadr = ramadans;      /* one opportunity per Ramadan */

  return { birth: birth, days: days, ageYrs: ageYrs, yy: yy, mo: mo, dd: dd,
           hijriBirth: hijriBirth, hijriNow: hijriNow,
           ramadans: ramadans, fridays: fridays, eids: eids,
           prayerMoments: prayerMoments, fastingDays: fastingDays,
           laylatulQadr: laylatulQadr };
}

/* ══════════════════════════════════════
   LIFE OVERVIEW
   ══════════════════════════════════════ */
function renderLifeOverview(stats) {
  var name = S.get('name') || '';
  var dob  = S.get('dob') || '';

  if (!dob) {
    var section = el('life-overview');
    if (section) {
      section.innerHTML =
        '<div class="journey-prompt">' +
          '<div class="jp-icon">🌙</div>' +
          '<div class="jp-text">Enter your date of birth on the ' +
            '<a href="index.html">Home page</a> to see your personal Islamic journey.</div>' +
        '</div>';
    }
    return;
  }

  setText('journey-name', name ? 'Assalamu Alaikum, ' + name : 'Assalamu Alaikum');
  setText('journey-dob-greg', stats.birth.toLocaleDateString('en-US',
    { day:'numeric', month:'long', year:'numeric' }));
  setText('journey-dob-hijri', hijriStr(stats.hijriBirth));
  setText('journey-age', stats.yy + ' years, ' + stats.mo + ' months, ' + stats.dd + ' days');
  setText('journey-days', stats.days.toLocaleString());
}

/* ══════════════════════════════════════
   ISLAMIC JOURNEY COUNTERS (extended)
   ══════════════════════════════════════ */
function renderIslamicCounters(stats) {
  var counters = [
    { id: 'counter-ramadans',      val: stats.ramadans      },
    { id: 'counter-eids-fitr',     val: stats.eids          },
    { id: 'counter-eids-adha',     val: stats.eids          },
    { id: 'counter-jumuahs',       val: stats.fridays       },
    { id: 'counter-laylatul-qadr', val: stats.laylatulQadr  },
    { id: 'counter-fasting-days',  val: stats.fastingDays   }
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
   ISLAMIC JOURNEY MILESTONES
   (replaces generic Birth/Childhood/etc.)
   ══════════════════════════════════════ */
var ISLAMIC_MILESTONES = [
  {
    id: 'birth',
    icon: '🌱',
    label: 'Your Arrival',
    getActive: function(s) { return s.ageYrs >= 0; },
    getReflection: function(s) {
      return 'Born in <strong>' + s.hijriBirth.year + ' AH</strong> — ' +
        s.birth.toLocaleDateString('en-US', { month:'long', year:'numeric' }) +
        '. A soul sent into this world by Allah\'s will, not by chance.';
    }
  },
  {
    id: 'accountability',
    icon: '📖',
    label: 'Age of Accountability',
    getActive: function(s) { return s.ageYrs >= 15; },
    getReflection: function(s) {
      if (s.ageYrs < 15) {
        return 'You are approaching the age of maturity — when your deeds begin to be recorded.';
      }
      var accYear = s.birth.getFullYear() + 15;
      return 'You reached the age of accountability around <strong>' + accYear + '</strong>. ' +
        'Since then, every deed — small and large — has been written by your angels.';
    }
  },
  {
    id: 'first-ramadan',
    icon: '🌙',
    label: 'First Ramadans',
    getActive: function(s) { return s.ramadans >= 1; },
    getReflection: function(s) {
      if (s.ramadans < 1) return 'Your first Ramadan is ahead of you — In Sha Allah.';
      return 'You have witnessed <strong>' + s.ramadans + ' Ramadans</strong> — ' +
        s.ramadans + ' full months of mercy, forgiveness, and nearness to Allah. ' +
        'Each one was a gift you cannot buy back.';
    }
  },
  {
    id: 'first-jumuah',
    icon: '🕌',
    label: "Jumu'ah Journey",
    getActive: function(s) { return s.fridays >= 1; },
    getReflection: function(s) {
      return 'You have lived through <strong>' + s.fridays.toLocaleString() + " Jumu'ahs</strong> — " +
        'the best day of the week, offered to you ' + s.fridays.toLocaleString() + ' times. ' +
        '"The best day on which the sun rises is Friday." — Muslim';
    }
  },
  {
    id: 'prayer-journey',
    icon: '📿',
    label: 'Prayer Opportunities',
    getActive: function(s) { return s.days >= 1; },
    getReflection: function(s) {
      var k = s.prayerMoments.toLocaleString();
      return 'Allah has called you to prayer <strong>' + k + ' times</strong> since you were born — ' +
        'five times every single day. Each call was personal, direct, and from Him to you.';
    }
  },
  {
    id: 'current-chapter',
    icon: '✦',
    label: 'Your Chapter Right Now',
    getActive: function(s) { return true; },
    isCurrent: true,
    getReflection: function(s) {
      var chapterMap = [
        { max: 12,  label: 'The Years of Discovery',  hadith: '"Every child is born in a state of fitrah." — Bukhari' },
        { max: 17,  label: 'The Age of Awakening',    hadith: '"Take advantage of your youth before your old age." — Al-Bayhaqi' },
        { max: 29,  label: 'The Age of Building',     hadith: '"The strong believer is better than the weak believer." — Muslim' },
        { max: 39,  label: 'The Prime of Purpose',    hadith: '"When a man reaches forty, Allah spares him from three things..." — Hadith' },
        { max: 59,  label: 'The Years of Wisdom',     hadith: '"Allah does not look at your forms but at your hearts and deeds." — Muslim' },
        { max: 999, label: 'The Chapter of Gratitude',hadith: '"The prayer of the old is answered." — Ibn Abi Shaybah' }
      ];
      var ch = chapterMap[chapterMap.length - 1];
      for (var i = 0; i < chapterMap.length; i++) {
        if (s.ageYrs <= chapterMap[i].max) { ch = chapterMap[i]; break; }
      }
      return 'You are in <strong>' + ch.label + '</strong> — ' +
        'aged ' + s.yy + ' years. ' + ch.hadith;
    }
  }
];

function renderLifeChapters(stats) {
  var container = el('life-chapters');
  if (!container) return;
  var html = '';

  ISLAMIC_MILESTONES.forEach(function(m, idx) {
    var isActive  = m.getActive(stats);
    var isCurrent = !!m.isCurrent;
    var reflection = m.getReflection(stats);

    html +=
      '<div class="chapter-item' +
        (isCurrent ? ' chapter-current' : '') +
        (!isActive  ? ' chapter-locked'  : '') + '">' +
        '<div class="chapter-dot">' + m.icon + '</div>' +
        '<div class="chapter-content">' +
          '<div class="chapter-label">' + m.label + '</div>' +
          '<div class="chapter-reflection">' + reflection + '</div>' +
          (isCurrent ? '<div class="chapter-current-badge">You are here ✦</div>' : '') +
          (!isActive  ? '<div class="chapter-locked-badge">Ahead of you</div>' : '') +
        '</div>' +
        (idx < ISLAMIC_MILESTONES.length - 1
          ? '<div class="chapter-line"></div>'
          : '<div class="chapter-line hidden"></div>') +
      '</div>';
  });

  container.innerHTML = html;
}

/* ══════════════════════════════════════
   LIFE REMAINING — reflection-focused
   ══════════════════════════════════════ */
function renderLifeRemaining(stats) {
  var card = el('life-remaining-card');
  if (!card) return;

  var AVG_LIFESPAN = 70;
  var pct = Math.min(100, (stats.ageYrs / AVG_LIFESPAN) * 100);
  var pctRound = Math.round(pct);
  var approxRemaining = Math.max(0, AVG_LIFESPAN - stats.ageYrs);
  var remainingRamadans = Math.round(approxRemaining);
  var remainingJumuahs  = Math.round(approxRemaining * 52);

  var message = '';
  if (pctRound < 25) {
    message = 'Your journey is still in its early pages. Use this time — it is the most valuable you will ever have.';
  } else if (pctRound < 50) {
    message = 'You are building your story. Every choice now shapes the person you will be remembered as.';
  } else if (pctRound < 75) {
    message = 'More than half the journey has passed. What you do with what remains will define your legacy.';
  } else {
    message = 'Allah has given you long years. The deeds of the elders carry great weight before Him.';
  }

  card.innerHTML =
    '<div class="lr-ring-wrap">' +
      '<svg class="lr-ring" viewBox="0 0 120 120" aria-hidden="true">' +
        '<circle class="ring-bg" cx="60" cy="60" r="50"/>' +
        '<circle class="lr-ring-fill" cx="60" cy="60" r="50"' +
          ' stroke-dasharray="314"' +
          ' stroke-dashoffset="' + (314 - (pctRound / 100) * 314) + '"' +
          ' transform="rotate(-90 60 60)"/>' +
      '</svg>' +
      '<div class="lr-pct">' + pctRound + '%</div>' +
    '</div>' +
    '<div class="lr-content">' +
      '<div class="lr-headline">You have witnessed ' +
        '<strong>' + stats.ramadans + ' Ramadans</strong> and ' +
        '<strong>' + stats.fridays.toLocaleString() + " Jumu'ahs</strong>." +
      '</div>' +
      '<div class="lr-body">' + message + '</div>' +
      '<div class="lr-stats">' +
        '<div class="lr-stat">' +
          '<span class="lr-stat-val">~' + remainingRamadans + '</span>' +
          '<span class="lr-stat-lbl">Ramadans ahead<br><small>if Allah grants 70 years</small></span>' +
        '</div>' +
        '<div class="lr-stat">' +
          '<span class="lr-stat-val">~' + remainingJumuahs.toLocaleString() + '</span>' +
          '<span class="lr-stat-lbl">Jumu\'ahs ahead<br><small>In Sha Allah</small></span>' +
        '</div>' +
      '</div>' +
      '<div class="lr-ayah">' +
        '"By time — indeed, mankind is in loss. Except for those who have believed and done righteous deeds."' +
        '<span class="lr-ayah-ref"> — Quran 103:1-3</span>' +
      '</div>' +
    '</div>';
}

/* ══════════════════════════════════════
   ISLAMIC TIME CAPSULE
   ══════════════════════════════════════ */
function renderCapsule(stats) {
  var card = el('capsule-card');
  if (!card) return;
  var name = S.get('name') || 'A Muslim';
  var dob  = S.get('dob') || '';
  var dobFmt = dob
    ? new Date(dob.replace(/-/g,'/')).toLocaleDateString('en-US',
        { day:'numeric', month:'long', year:'numeric' })
    : '—';

  card.innerHTML =
    '<div class="cap-logo">WaqtX ✦</div>' +
    '<div class="cap-name">' + name + '</div>' +
    '<div class="cap-dob">Born ' + dobFmt + '</div>' +
    '<div class="cap-hijri">Islamic Birthday: ' + hijriStr(stats.hijriBirth) + '</div>' +
    '<div class="cap-divider"></div>' +
    '<div class="cap-stats">' +
      '<div class="cap-stat"><span class="cap-stat-icon">🌙</span>' +
        '<span class="cap-stat-val">' + stats.ramadans + '</span>' +
        '<span class="cap-stat-lbl">Ramadans</span></div>' +
      '<div class="cap-stat"><span class="cap-stat-icon">🕌</span>' +
        '<span class="cap-stat-val">' + stats.fridays.toLocaleString() + '</span>' +
        "<span class=\"cap-stat-lbl\">Jumu'ahs</span></div>" +
      '<div class="cap-stat"><span class="cap-stat-icon">📿</span>' +
        '<span class="cap-stat-val">' + stats.prayerMoments.toLocaleString() + '</span>' +
        '<span class="cap-stat-lbl">Prayer Moments</span></div>' +
    '</div>' +
    '<div class="cap-verse">"By time, indeed mankind is in loss — except those who have believed." — 103:1-2</div>' +
    '<div class="cap-url">mianhassam96.github.io/WaqtX</div>';
}

function initCapsuleShare() {
  var btnDownload = el('btn-capsule-download');
  var btnShare    = el('btn-capsule-share');
  var card        = el('capsule-card');

  if (btnDownload && card) {
    btnDownload.addEventListener('click', function() {
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
      var url  = 'https://mianhassam96.github.io/WaqtX/journey.html';
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
  var form      = el('journey-dob-form');
  if (!form) return;
  var input     = el('journey-dob-input');
  var nameInput = el('journey-name-input');
  if (!input) return;

  var savedDob  = S.get('dob');
  var savedName = S.get('name');
  if (savedDob  && input)     input.value     = savedDob;
  if (savedName && nameInput) nameInput.value  = savedName;

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
    ['counter-ramadans','counter-eids-fitr','counter-eids-adha','counter-jumuahs',
     'counter-laylatul-qadr','counter-fasting-days','prayer-moments-count'].forEach(function(id) {
      setText(id, '—');
    });
    return;
  }

  var stats = calcStats(dob);
  renderLifeOverview(stats);
  renderIslamicCounters(stats);
  renderPrayerMoments(stats);
  renderLifeChapters(stats);
  renderLifeRemaining(stats);
  renderCapsule(stats);
  initCapsuleShare();
  initDOBInput();
}

document.addEventListener('DOMContentLoaded', initJourneyPage);
