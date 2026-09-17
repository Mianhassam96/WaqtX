'use strict';
/* ═══════════════════════════════════════════════
   WaqtX — Core v2
   Shared across all pages: theme, lang, nav,
   storage, Hijri, prayer helpers, modes
   ═══════════════════════════════════════════════ */

/* ── Tiny DOM helper ── */
window.el = function(id) { return document.getElementById(id); };

/* ══════════════════════════════════════
   STORAGE — namespaced localStorage
   ══════════════════════════════════════ */
window.WaqtX = window.WaqtX || {};

WaqtX.storage = {
  get: function(key) {
    try {
      var raw = localStorage.getItem('waqtx_' + key);
      if (raw === null) return null;
      try { return JSON.parse(raw); } catch(e) { return raw; }
    } catch(e) { return null; }
  },
  set: function(key, val) {
    try {
      localStorage.setItem('waqtx_' + key,
        typeof val === 'string' ? val : JSON.stringify(val));
    } catch(e) {}
  },
  remove: function(key) {
    try { localStorage.removeItem('waqtx_' + key); } catch(e) {}
  },
  clearAll: function() {
    try {
      var keys = Object.keys(localStorage).filter(function(k) {
        return k.startsWith('waqtx_');
      });
      keys.forEach(function(k) { localStorage.removeItem(k); });
    } catch(e) {}
  }
};

var S = WaqtX.storage; /* shorthand */

/* ══════════════════════════════════════
   HELPERS
   ══════════════════════════════════════ */
window.fmt = function(n) { return Number(n).toLocaleString(); };
window.setText = function(id, v) {
  var e = el(id);
  if (!e) return;
  e.textContent = v;
  /* Remove skeleton shimmer once real value is set */
  e.classList.remove('skeleton-val', 'skeleton-sm', 'skeleton-md',
                     'skeleton-lg', 'skeleton-xl', 'skeleton-num', 'skeleton');
};

function getTodayKey() {
  var d = new Date();
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0');
}
window.getTodayKey = getTodayKey;

function getDateKey(offset) {
  var d = new Date();
  d.setDate(d.getDate() + (offset || 0));
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0');
}
window.getDateKey = getDateKey;

/* ══════════════════════════════════════
   HIJRI CONVERSION (Kuwaiti algorithm)
   ══════════════════════════════════════ */
window.HIJRI_MONTHS = [
  'Muharram','Safar',"Rabi' al-Awwal","Rabi' al-Thani",
  'Jumada al-Awwal','Jumada al-Thani','Rajab',"Sha'ban",
  'Ramadan','Shawwal',"Dhu al-Qi'dah",'Dhu al-Hijjah'
];

window.toHijri = function(date) {
  var D = date.getDate(), M = date.getMonth() + 1, Y = date.getFullYear();
  var a = Math.floor((14 - M) / 12);
  var y = Y + 4800 - a;
  var m = M + 12 * a - 3;
  var JDN = D + Math.floor((153*m+2)/5) + 365*y + Math.floor(y/4)
            - Math.floor(y/100) + Math.floor(y/400) - 32045;
  var daysSinceEpoch = JDN - 1948439;
  var cycle30 = Math.floor(daysSinceEpoch / 10631);
  var dayInCycle = daysSinceEpoch - 10631 * cycle30;
  var LEAP = [2,5,7,10,13,15,18,21,24,26,29];
  function isLeap(yi) { return LEAP.indexOf(((yi - 1) % 30) + 1) !== -1; }
  function dInYear(yi) { return isLeap(yi) ? 355 : 354; }
  var yearInCycle = Math.max(1, Math.ceil((dayInCycle + 1) / 354.367));
  if (yearInCycle > 30) yearInCycle = 30;
  var daysAtStart = 0;
  for (var i = 1; i < yearInCycle; i++) daysAtStart += dInYear(i);
  while (daysAtStart + dInYear(yearInCycle) <= dayInCycle && yearInCycle < 30) {
    daysAtStart += dInYear(yearInCycle++);
  }
  while (daysAtStart > dayInCycle && yearInCycle > 1) {
    daysAtStart -= dInYear(--yearInCycle);
  }
  var hYear = 30 * cycle30 + yearInCycle;
  var dayInYear = dayInCycle - daysAtStart;
  var hMonth = 1, hDay = 1, daysAccum = 0;
  for (var mo = 1; mo <= 12; mo++) {
    var mLen = (mo % 2 === 1) ? 30 : 29;
    if (mo === 12 && isLeap(yearInCycle)) mLen = 30;
    if (dayInYear < daysAccum + mLen) { hMonth = mo; hDay = dayInYear - daysAccum + 1; break; }
    daysAccum += mLen;
  }
  return { year: hYear, month: hMonth, day: hDay };
};

/* Format Hijri date as string */
window.hijriStr = function(h) {
  return h.day + ' ' + HIJRI_MONTHS[h.month - 1] + ' ' + h.year + ' AH';
};

/* ── Is it Ramadan? ── */
window.isRamadan = function() {
  return toHijri(new Date()).month === 9;
};

/* ── Current Ramadan day (1–30) ── */
window.getRamadanDay = function() {
  return toHijri(new Date()).day;
};

/* ── Is it Friday? ── */
window.isFriday = function() {
  return new Date().getDay() === 5;
};

/* ── Next Ramadan countdown (days) ── */
window.daysToNextRamadan = function() {
  var today = new Date();
  var h = toHijri(today);
  /* Find next Ramadan 1 */
  var targetYear = h.month < 9 ? h.year : h.year + 1;
  /* Approximate: 1 Ramadan ≈ JDN 1948440 + (targetYear-1)*354.367 + cumulative months */
  /* Simpler: iterate forward max 370 days */
  for (var i = 1; i <= 370; i++) {
    var d = new Date(today); d.setDate(today.getDate() + i);
    var hd = toHijri(d);
    if (hd.month === 9 && hd.day === 1) return i;
  }
  return null;
};

/* ══════════════════════════════════════
   THEME
   ══════════════════════════════════════ */
WaqtX.theme = {
  apply: function(theme) {
    try {
      /* V3: :root is light. dark needs data-theme="dark". */
      if (!theme || theme === 'light') {
        document.documentElement.removeAttribute('data-theme');
      } else {
        document.documentElement.setAttribute('data-theme', theme);
      }
      S.set('theme', theme || 'light');
      /* Update theme-color meta for mobile browser chrome */
      var meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', theme === 'dark' ? '#08110D' : '#F7F8F5');
    } catch(e) {}
    this._updateButton(theme || 'light');
  },
  _updateButton: function(theme) {
    /* Support both #theme-icon span (V3) and legacy btn textContent */
    var icon = el('theme-icon');
    var btn  = el('btn-theme-toggle');
    /* Only light/dark — icon shows what clicking will switch TO */
    var next = (theme === 'dark') ? '☀️' : '🌙';
    if (icon) { icon.textContent = next; }
    else if (btn) { btn.textContent = next; }
    if (btn) btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
  },
  init: function() {
    /* Only light/dark. Ramadan/Friday affect content, not visual theme. */
    var saved = S.get('theme') || 'light';
    /* Sanitise: if stored value is ramadan/friday (legacy), reset to light */
    if (saved !== 'light' && saved !== 'dark') { saved = 'light'; S.set('theme', 'light'); }
    this.apply(saved);
    var self = this;
    var btn = el('btn-theme-toggle');
    if (btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var current = S.get('theme') || 'light';
        /* Only toggle between light and dark */
        self.apply(current === 'dark' ? 'light' : 'dark');
      });
    }
    /* Settings page theme option buttons */
    var dropdown = el('theme-dropdown');
    if (dropdown) {
      dropdown.querySelectorAll('.theme-option').forEach(function(opt) {
        opt.addEventListener('click', function() {
          var t = opt.getAttribute('data-theme');
          S.set('theme_user_set', true);
          self.apply(t);
          dropdown.classList.add('hidden');
        });
      });
    }
    /* Settings page preview buttons */
    document.querySelectorAll('.theme-preview-btn').forEach(function(btn2) {
      btn2.addEventListener('click', function() {
        var t = btn2.getAttribute('data-theme');
        /* Only allow light/dark */
        if (t !== 'light' && t !== 'dark') return;
        self.apply(t);
        document.querySelectorAll('.theme-preview-btn').forEach(function(b) { b.classList.remove('active'); });
        btn2.classList.add('active');
      });
    });
  }
};

/* ══════════════════════════════════════
   LANGUAGE ENGINE
   ══════════════════════════════════════ */
var _lang = 'en';
var _langData = {};
window._lang = _lang;
window._langData = _langData;

window.t = function(key) {
  return (_langData && _langData[key] !== undefined) ? _langData[key] : key;
};
window.tr = function(key, vars) {
  var str = window.t(key);
  if (vars) {
    Object.keys(vars).forEach(function(k) {
      str = str.replace(new RegExp('\\{' + k + '\\}', 'g'), vars[k]);
    });
  }
  return str;
};

function applyDocumentDir(dir) {
  document.documentElement.setAttribute('dir', dir || 'ltr');
  document.documentElement.setAttribute('lang',
    _lang === 'ur' ? 'ur' : _lang === 'ar' ? 'ar' : 'en');
}

function applyLangToNav() {
  /* Update lang indicator (old dropdown style) */
  var langCurrent = el('lang-current');
  if (langCurrent) {
    var labels = { en: 'EN', ur: 'اردو', ar: 'ع', roman: 'RO' };
    langCurrent.textContent = labels[_lang] || 'EN';
  }
  /* Old dropdown options */
  document.querySelectorAll('.lang-option').forEach(function(opt) {
    opt.classList.toggle('active', opt.getAttribute('data-lang') === _lang);
  });
  /* V3 pill buttons */
  document.querySelectorAll('.lang-pill').forEach(function(pill) {
    pill.classList.toggle('active', pill.getAttribute('data-lang') === _lang);
    pill.setAttribute('aria-pressed', pill.getAttribute('data-lang') === _lang ? 'true' : 'false');
  });
}

WaqtX.lang = {
  load: function(lang, callback) {
    /* Determine correct path prefix based on current page depth */
    var prefix = '';
    var path = window.location.pathname;
    if (path.indexOf('/WaqtX/') !== -1 && path.split('/').length > 3) {
      prefix = '../';
    }
    fetch(prefix + 'lang/' + lang + '.json')
      .then(function(r) { return r.json(); })
      .then(function(data) {
        _langData = data;
        window._langData = data;
        _lang = lang;
        window._lang = lang;
        try { S.set('lang', lang); S.set('lang', lang); /* also as waqtx_lang for flash script */
          localStorage.setItem('waqtx_lang', lang);
        } catch(e) {}
        var meta = data._meta || {};
        applyDocumentDir(meta.dir);
        applyLangToNav();
        if (typeof applyLangToDOM === 'function') applyLangToDOM();
        if (callback) callback();
      })
      .catch(function() {
        if (callback) callback();
      });
  },
  init: function() {
    var saved;
    try { saved = S.get('lang') || 'en'; } catch(e) { saved = 'en'; }
    var self = this;
    this.load(saved);
    /* V3: wire .lang-pill buttons (EN / اردو toggle) */
    document.querySelectorAll('.lang-pill').forEach(function(pill) {
      pill.addEventListener('click', function(e) {
        e.stopPropagation();
        var lang = pill.getAttribute('data-lang');
        if (lang) self.load(lang);
      });
    });
    /* Legacy dropdown switcher (still used in settings.html) */
    var btn = el('lang-btn');
    var dropdown = el('lang-dropdown');
    if (btn && dropdown) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        dropdown.classList.toggle('hidden');
      });
      document.addEventListener('click', function() {
        dropdown.classList.add('hidden');
      });
      dropdown.querySelectorAll('.lang-option').forEach(function(opt) {
        opt.addEventListener('click', function(e) {
          e.stopPropagation();
          var lang = opt.getAttribute('data-lang');
          dropdown.classList.add('hidden');
          self.load(lang);
        });
      });
    }
  }
};

/* ══════════════════════════════════════
   NAVIGATION — active state + modes
   ══════════════════════════════════════ */
WaqtX.nav = {
  init: function() {
    /* Set active link by matching current filename */
    var path = window.location.pathname;
    var filename = path.split('/').pop() || 'index.html';
    if (filename === '' || filename === 'WaqtX') filename = 'index.html';

    document.querySelectorAll('.nav-link, .bottom-nav-item, .bnav-item').forEach(function(link) {
      var href = link.getAttribute('href') || '';
      var linkFile = href.split('/').pop();
      link.classList.remove('active');
      /* Remove aria-current */
      if (link.hasAttribute('aria-current')) link.removeAttribute('aria-current');
      var match = linkFile === filename ||
        (filename === 'index.html' && (href === '#' || linkFile === 'index.html'));
      if (match) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      }
    });

    /* Hamburger toggle — Phase 3: uses .open class on nav-drawer */
    var ham = el('hamburger');
    var drawer = el('nav-drawer');
    if (ham && drawer) {
      /* Ensure drawer starts closed */
      drawer.classList.remove('open');
      drawer.setAttribute('aria-hidden', 'true');

      function openDrawer() {
        drawer.classList.add('open');
        drawer.setAttribute('aria-hidden', 'false');
        ham.classList.add('open');
        ham.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
      }
      function closeDrawer() {
        drawer.classList.remove('open');
        drawer.setAttribute('aria-hidden', 'true');
        ham.classList.remove('open');
        ham.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }

      ham.addEventListener('click', function(e) {
        e.stopPropagation();
        drawer.classList.contains('open') ? closeDrawer() : openDrawer();
      });
      /* Close on outside click */
      document.addEventListener('click', function(e) {
        if (!drawer.classList.contains('open')) return;
        var navbar = el('navbar');
        if (navbar && navbar.contains(e.target)) return;
        closeDrawer();
      });
      /* Close on Escape */
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && drawer.classList.contains('open')) closeDrawer();
      });
        ham.setAttribute('aria-expanded', 'false');
      });
    }

    /* Phase 3: scroll-hide navbar and bottom nav on mobile */
    this.initScrollBehaviour();

    /* V3 More sheet (new bottom nav) */
    this.initMoreSheet();

    /* Legacy more menu fallback */
    this.initMoreMenu();
  },

  initScrollBehaviour: function() {
    /* Auto-hide bottom nav on scroll down, show on scroll up */
    var lastY = 0;
    var ticking = false;
    var bnav = el('bottom-nav');

    window.addEventListener('scroll', function() {
      if (ticking) return;
      window.requestAnimationFrame(function() {
        var y = window.scrollY;
        if (bnav) {
          if (y > lastY && y > 80) {
            bnav.classList.add('bnav-hidden');
          } else {
            bnav.classList.remove('bnav-hidden');
          }
        }
        lastY = y;
        ticking = false;
      });
      ticking = true;
    }, { passive: true });
  },

  initMoreSheet: function() {
    var moreBtn  = el('btn-more');
    var sheet    = el('more-sheet');
    var overlay  = el('more-overlay');
    var closeBtn = el('more-close');
    if (!moreBtn || !sheet) return;

    function openSheet() {
      sheet.classList.add('open');
      if (overlay) overlay.classList.add('open');
      sheet.setAttribute('aria-hidden', 'false');
      if (overlay) overlay.setAttribute('aria-hidden', 'false');
      moreBtn.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    }
    function closeSheet() {
      sheet.classList.remove('open');
      if (overlay) overlay.classList.remove('open');
      sheet.setAttribute('aria-hidden', 'true');
      if (overlay) overlay.setAttribute('aria-hidden', 'true');
      moreBtn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }

    moreBtn.addEventListener('click', function() {
      sheet.classList.contains('open') ? closeSheet() : openSheet();
    });
    if (overlay) overlay.addEventListener('click', closeSheet);
    if (closeBtn) closeBtn.addEventListener('click', closeSheet);
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && sheet.classList.contains('open')) closeSheet();
    });

    /* Mark active item in more sheet */
    var path = window.location.pathname;
    var filename = path.split('/').pop() || 'index.html';
    sheet.querySelectorAll('.more-item').forEach(function(a) {
      var href = (a.getAttribute('href') || '').split('/').pop();
      if (href === filename) a.style.color = 'var(--primary)';
    });
  },

  initMoreMenu: function() {
    var moreBtn  = el('btn-bottom-more');
    var moreMenu = el('bottom-more-menu');
    var backdrop = el('bmm-backdrop');
    var closeBtn = el('bmm-close');
    if (!moreBtn || !moreMenu) return;

    /* Mark active item inside more menu too */
    var path = window.location.pathname;
    var filename = path.split('/').pop() || 'index.html';
    moreMenu.querySelectorAll('.bmm-item').forEach(function(a) {
      var href = (a.getAttribute('href') || '').split('/').pop();
      a.classList.toggle('active', href === filename);
    });

    function openMenu() {
      moreMenu.classList.remove('hidden');
      moreBtn.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    }
    function closeMenu() {
      moreMenu.classList.add('hidden');
      moreBtn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }

    moreBtn.addEventListener('click', function() {
      moreMenu.classList.contains('hidden') ? openMenu() : closeMenu();
    });
    if (backdrop) backdrop.addEventListener('click', closeMenu);
    if (closeBtn) closeBtn.addEventListener('click', closeMenu);

    /* Close on Escape */
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && !moreMenu.classList.contains('hidden')) closeMenu();
    });
  }
};

/* ══════════════════════════════════════
   PRAYER TIME HELPERS
   ══════════════════════════════════════ */
WaqtX.prayer = {
  NAMES: ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'],
  ICONS: { Fajr: '🌙', Sunrise: '🌅', Dhuhr: '☀️', Asr: '🌤', Maghrib: '🌇', Isha: '🌃' },

  timeToMin: function(timeStr) {
    var clean = (timeStr || '').split(' ')[0];
    var parts = clean.split(':');
    if (parts.length < 2) return 0;
    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
  },

  getNext: function(timings) {
    var now = new Date();
    var nowMin = now.getHours() * 60 + now.getMinutes();
    var prayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    for (var i = 0; i < prayers.length; i++) {
      var pMin = this.timeToMin(timings[prayers[i]]);
      if (pMin > nowMin) return { name: prayers[i], time: timings[prayers[i]], minutes: pMin };
    }
    return { name: 'Fajr', time: timings['Fajr'],
      minutes: this.timeToMin(timings['Fajr']) + 1440, isTomorrow: true };
  },

  formatCountdown: function(totalSec) {
    if (totalSec < 0) totalSec = 0;
    var h = Math.floor(totalSec / 3600);
    var m = Math.floor((totalSec % 3600) / 60);
    var s = totalSec % 60;
    return String(h).padStart(2,'0') + ':' +
           String(m).padStart(2,'0') + ':' +
           String(s).padStart(2,'0');
  },

  getCurrentPeriod: function(timings) {
    if (!timings) return 'isha';
    var now = new Date();
    var nowMin = now.getHours() * 60 + now.getMinutes();
    var periods = [
      { name: 'fajr',    start: this.timeToMin(timings.Fajr) },
      { name: 'sunrise', start: this.timeToMin(timings.Sunrise) },
      { name: 'dhuhr',   start: this.timeToMin(timings.Dhuhr) },
      { name: 'asr',     start: this.timeToMin(timings.Asr) },
      { name: 'maghrib', start: this.timeToMin(timings.Maghrib) },
      { name: 'isha',    start: this.timeToMin(timings.Isha) }
    ];
    var current = 'isha';
    for (var i = 0; i < periods.length; i++) {
      if (nowMin >= periods[i].start) current = periods[i].name;
    }
    return current;
  },

  buildUrl: function(lat, lng) {
    var method = S.get('prayer_method') || 2;
    var today = new Date();
    var dd = String(today.getDate()).padStart(2,'0');
    var mm = String(today.getMonth()+1).padStart(2,'0');
    var yyyy = today.getFullYear();
    return 'https://api.aladhan.com/v1/timings/' + dd + '-' + mm + '-' + yyyy +
           '?latitude=' + lat + '&longitude=' + lng + '&method=' + method;
  },

  fetch: function(lat, lng, onSuccess, onError) {
    var self = this;
    fetch(this.buildUrl(lat, lng))
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.code === 200 && data.data && data.data.timings) {
          var timings = data.data.timings;
          var today = new Date();
          var dd = String(today.getDate()).padStart(2,'0');
          var mm = String(today.getMonth()+1).padStart(2,'0');
          var yyyy = today.getFullYear();
          S.set('prayer_times', timings);
          S.set('prayer_date', dd + '-' + mm + '-' + yyyy);
          S.set('prayer_meta', data.data.meta);
          if (onSuccess) onSuccess(timings, data.data.meta);
        } else {
          if (onError) onError('API error');
        }
      })
      .catch(function(e) {
        /* Try cache */
        var cached = S.get('prayer_times');
        if (cached && onSuccess) onSuccess(cached, S.get('prayer_meta'), true);
        else if (onError) onError(e);
      });
  },

  getCached: function() {
    return S.get('prayer_times');
  }
};

/* ══════════════════════════════════════
   HERO PRAYER PERIOD BACKGROUND
   ══════════════════════════════════════ */
function updateHeroPrayerState() {
  var heroEl = document.querySelector('.hero');
  if (!heroEl) return;
  var timings = WaqtX.prayer.getCached();
  var period = timings ? WaqtX.prayer.getCurrentPeriod(timings) : _getApproxPeriod();
  heroEl.setAttribute('data-prayer', period);

  /* Update hero next prayer */
  if (timings) {
    var next = WaqtX.prayer.getNext(timings);
    setText('hero-next-prayer', next.name + (next.isTomorrow ? ' (tomorrow)' : ''));
    /* Countdown updated by ticker if available */
  }

  /* Update Hijri date in hero */
  var h = toHijri(new Date());
  setText('hero-hijri-date', h.day + ' ' + HIJRI_MONTHS[h.month-1] + ' ' + h.year + ' AH');
}

function _getApproxPeriod() {
  var h = new Date().getHours();
  if (h >= 5 && h < 7)   return 'fajr';
  if (h >= 7 && h < 12)  return 'sunrise';
  if (h >= 12 && h < 15) return 'dhuhr';
  if (h >= 15 && h < 18) return 'asr';
  if (h >= 18 && h < 20) return 'maghrib';
  return 'isha';
}
window.updateHeroPrayerState = updateHeroPrayerState;

/* ══════════════════════════════════════
   STREAK CALCULATION
   ══════════════════════════════════════ */
var PRAYERS_5 = ['Fajr','Dhuhr','Asr','Maghrib','Isha'];

window.getTotalPrayersLogged = function() {
  var total = 0;
  try {
    Object.keys(localStorage).forEach(function(k) {
      if (k.startsWith('waqtx_tracker_')) {
        var data = JSON.parse(localStorage.getItem(k)) || {};
        PRAYERS_5.forEach(function(p) { if (data[p]) total++; });
      }
    });
  } catch(e) {}
  return total;
};

window.getStreakCount = function() {
  return S.get('streak') || 0;
};

window.recalcStreak = function() {
  var today = getTodayKey();
  var last = S.get('streak_last');
  var streak = parseInt(S.get('streak')) || 0;
  var yesterday = getDateKey(-1);
  var todayData = S.get('tracker_' + today) || {};
  var allPrayed = PRAYERS_5.every(function(p) { return todayData[p] === true; });
  if (last === today) return streak;
  if (last === yesterday) {
    if (allPrayed) { streak++; S.set('streak', streak); }
  } else {
    streak = allPrayed ? 1 : 0;
    S.set('streak', streak);
  }
  S.set('streak_last', today);
  return streak;
};

/* ══════════════════════════════════════
   COUNTER ANIMATION
   ══════════════════════════════════════ */
window.animateCounter = function(el, targetValue, duration) {
  duration = duration || 1500;
  var start = performance.now();
  function step(now) {
    var elapsed = now - start;
    var progress = Math.min(elapsed / duration, 1);
    var eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.floor(targetValue * eased).toLocaleString();
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = targetValue.toLocaleString();
  }
  requestAnimationFrame(step);
};

/* Trigger counter when element enters viewport */
window.observeCounters = function() {
  if (!window.IntersectionObserver) return;
  document.querySelectorAll('[data-counter]').forEach(function(el) {
    var target = parseInt(el.getAttribute('data-counter'));
    if (!target) return;
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          animateCounter(el, target);
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.3 });
    observer.observe(el);
  });
};

/* ══════════════════════════════════════
   PWA INSTALL PROMPT
   ══════════════════════════════════════ */
var _deferredPrompt = null;
window.addEventListener('beforeinstallprompt', function(e) {
  e.preventDefault();
  _deferredPrompt = e;
  var btn = el('btn-install-app');
  if (btn) btn.classList.remove('hidden');
});
(function() {
  var btn = el('btn-install-app');
  if (!btn) return;
  btn.addEventListener('click', function() {
    if (_deferredPrompt) {
      _deferredPrompt.prompt();
      _deferredPrompt.userChoice.then(function() { _deferredPrompt = null; });
    }
  });
})();

/* ══════════════════════════════════════
   ACCESSIBILITY — font size & contrast
   ══════════════════════════════════════ */
(function() {
  var fs = S.get('font_size') || 'default';
  document.documentElement.classList.remove('font-small','font-default','font-large');
  document.documentElement.classList.add('font-' + fs);
  var contrast = S.get('contrast');
  if (contrast === 'high') document.documentElement.setAttribute('data-contrast','high');
})();

/* ══════════════════════════════════════
   BOOT — runs on every page
   ══════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function() {
  WaqtX.theme.init();
  WaqtX.nav.init();
  WaqtX.lang.init();
  recalcStreak();
  updateHeroPrayerState();
  setInterval(updateHeroPrayerState, 60000);
  observeCounters();

  /* Auto-fetch prayer times if location saved */
  var lat = S.get('location_lat');
  var lng = S.get('location_lng');
  if (lat && lng && !WaqtX.prayer.getCached()) {
    WaqtX.prayer.fetch(lat, lng, function(timings) {
      updateHeroPrayerState();
    });
  }
});
