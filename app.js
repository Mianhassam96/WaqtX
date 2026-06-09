
'use strict';
/* ═══════════════════════════════════════════════
   WaqtX — App Logic v1
   ═══════════════════════════════════════════════ */

const AVG_LIFESPAN_YEARS = 75;
let _birth = null;
let _name  = '';

/* ── Helpers ── */
function el(id) { return document.getElementById(id); }

/* ══════════════════════════════════════════════
   LANGUAGE ENGINE
   Key-based system — Arabic Quran/Hadith text
   is NEVER translated, only UI strings
   ══════════════════════════════════════════════ */
var _lang = 'en';
var _langData = {};
var _langLoaded = false;

/* Translate key — falls back to key if missing */
function t(key) {
  return (_langData && _langData[key] !== undefined) ? _langData[key] : key;
}

/* Template replace: t('key', {n: 5}) → replaces {n} */
function tr(key, vars) {
  var str = t(key);
  if (vars) {
    Object.keys(vars).forEach(function(k) {
      str = str.replace(new RegExp('\\{' + k + '\\}', 'g'), vars[k]);
    });
  }
  return str;
}

function applyDocumentDir(dir) {
  document.documentElement.setAttribute('dir', dir || 'ltr');
  document.documentElement.setAttribute('lang',
    _lang === 'ur' ? 'ur' : _lang === 'ar' ? 'ar' : 'en');
}

var THEME_STORAGE_KEY = 'waqtx_theme';

function getSavedTheme() {
  try { return localStorage.getItem(THEME_STORAGE_KEY) || 'dark'; } catch(e) { return 'dark'; }
}

function updateThemeButton(theme) {
  var btn = el('btn-theme-toggle');
  if (!btn) return;
  btn.textContent = theme === 'light' ? '🌙' : '☀️';
  btn.setAttribute('aria-label', t('theme_toggle'));
  btn.title = theme === 'light' ? t('theme_switch_dark') : t('theme_switch_light');
}

function applyTheme(theme) {
  if (theme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
  try { localStorage.setItem(THEME_STORAGE_KEY, theme === 'light' ? 'light' : 'dark'); } catch(e) {}
  updateThemeButton(theme);
}

function initThemeToggle() {
  var btn = el('btn-theme-toggle');
  if (!btn) return;
  btn.addEventListener('click', function() {
    var current = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    applyTheme(current === 'light' ? 'dark' : 'light');
  });
  applyTheme(getSavedTheme());
}

function applyLangToDOM() {
  /* Navbar */
  var navLinks = [
    ['a[href="#"].nav-link',              'nav_home'],
    ['a[href="#islamic-section"].nav-link','nav_islamic'],
    ['a[href="#features-section"].nav-link','nav_features']
  ];
  navLinks.forEach(function(pair) {
    var el2 = document.querySelector(pair[0]);
    if (el2) el2.textContent = t(pair[1]);
  });

  var shareNavBtn = el('btn-share-nav');
  if (shareNavBtn) {
    shareNavBtn.innerHTML =
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/></svg> ' +
      t('nav_share');
  }

  var themeBtn = el('btn-theme-toggle');
  if (themeBtn) {
    themeBtn.setAttribute('aria-label', t('theme_toggle'));
    themeBtn.title = document.documentElement.getAttribute('data-theme') === 'light'
      ? t('theme_switch_dark') : t('theme_switch_light');
  }

  /* Section headings */
  var sections = {
    'section_glance':     '.glance-section .sh-text',
    'section_islamic':    '.islamic-section .sh-text',
    'section_world':      '.world-section .sh-text',
    'section_truth':      '.truth-section .sh-text',
    'section_story':      '.story-section .sh-text',
    'section_milestones': '.ms-section .sh-text',
    'section_tracker':    '.tracker-section .sh-text',
    'section_insight':    '.insight-section .sh-text',
    'section_wakeup':     '.hadith-section .sh-text',
    'section_qibla':      '.qibla-section .sh-text',
    'section_liveage':    '.liveage-section .sh-text'
  };
  Object.keys(sections).forEach(function(key) {
    var node = document.querySelector(sections[key]);
    if (node) node.textContent = t(key);
  });

  /* Hero */
  var heroTrans = document.querySelector('.hero-arabic-trans');
  if (heroTrans) heroTrans.textContent = t('hero_arabic_trans');
  var heroSub = document.querySelector('.hero-sub');
  if (heroSub) heroSub.textContent = t('hero_sub');

  /* Input card */
  var inputTitle = document.querySelector('.input-card-title');
  if (inputTitle) inputTitle.textContent = t('input_title');
  var inputSub = document.querySelector('.input-card-sub');
  if (inputSub) inputSub.textContent = t('input_sub');

  var nameLabel = document.querySelector('label.input-label[for="hero-name"], .input-group .input-label:first-of-type');
  var labels = document.querySelectorAll('.input-label');
  if (labels[0]) labels[0].textContent = t('input_name_label');
  if (labels[1]) labels[1].textContent = t('input_dob_label');
  if (labels[2]) labels[2].textContent = t('input_time_label');
  if (labels[3]) labels[3].textContent = t('input_gender_label');

  var namePh = el('hero-name');
  if (namePh) namePh.placeholder = t('input_name_placeholder');

  var genderSel = el('hero-gender');
  if (genderSel && genderSel.options) {
    if (genderSel.options[0]) genderSel.options[0].text = t('input_gender_select');
    if (genderSel.options[1]) genderSel.options[1].text = t('input_gender_male');
    if (genderSel.options[2]) genderSel.options[2].text = t('input_gender_female');
  }

  var revealBtn = el('btn-calculate');
  if (revealBtn) revealBtn.textContent = t('input_btn');

  var trustSpans = document.querySelectorAll('.input-trust span:not(.trust-dot)');
  if (trustSpans[0]) trustSpans[0].textContent = t('input_private');
  if (trustSpans[1]) trustSpans[1].textContent = t('input_no_data');
  if (trustSpans[2]) trustSpans[2].textContent = t('input_control');

  /* Step labels */
  var stepLabels = document.querySelectorAll('.js-label');
  var stepKeys = ['step1_label','step2_label','step3_label','step4_label'];
  stepLabels.forEach(function(lbl, i) {
    if (stepKeys[i]) lbl.textContent = t(stepKeys[i]);
  });

  /* Glance card labels */
  var glanceLabels = document.querySelectorAll('.glance-label');
  var glanceDescs  = document.querySelectorAll('.glance-desc');
  var glanceKeys   = ['glance_days','glance_hours','glance_sleep','glance_hearts','glance_sunsets','glance_seconds'];
  var glanceDescKeys = ['glance_days_desc','glance_hours_desc','glance_sleep_desc','glance_hearts_desc','glance_sunsets_desc','glance_seconds_desc'];
  glanceLabels.forEach(function(lbl, i) { if (glanceKeys[i]) lbl.textContent = t(glanceKeys[i]); });
  glanceDescs.forEach(function(d, i)   { if (glanceDescKeys[i]) d.textContent = t(glanceDescKeys[i]); });

  /* Islamic section */
  var icSubs = document.querySelectorAll('.ic-sub');
  var icSubKeys = ['ih_born_in','ih_birth_day','ih_ramadans','ih_hajj','ih_islamic_years','ih_next_ramadan'];
  icSubs.forEach(function(s, i) { if (icSubKeys[i]) s.textContent = t(icSubKeys[i]); });
  var nextRamVal = document.querySelector('.islamic-card:last-child .ic-value');
  if (nextRamVal) nextRamVal.textContent = t('ih_next_ramadan_val');

  /* World section */
  var worldCountry = el('w-country');
  if (worldCountry) worldCountry.textContent = t('world_pakistan');
  var wfKeys = document.querySelectorAll('.world-pk .wf-key');
  if (wfKeys[0]) wfKeys[0].textContent = t('world_pm');
  if (wfKeys[1]) wfKeys[1].textContent = t('world_president');
  if (wfKeys[2]) wfKeys[2].textContent = t('world_currency');
  var wfGlobeKeys = document.querySelectorAll('.world-globe .wf-key');
  if (wfGlobeKeys[0]) wfGlobeKeys[0].textContent = t('world_population');
  if (wfGlobeKeys[1]) wfGlobeKeys[1].textContent = t('world_event');
  if (wfGlobeKeys[2]) wfGlobeKeys[2].textContent = t('world_tech');
  var momentTitle = document.querySelector('.world-moment-title');
  if (momentTitle) momentTitle.textContent = t('world_moment');
  var momentText = document.querySelector('.world-moment-text');
  if (momentText) momentText.textContent = t('world_moment_text');

  /* Journey */
  var journeyTitle = document.querySelector('.journey-title');
  if (journeyTitle) journeyTitle.textContent = t('journey_title');
  var journeyCta = document.querySelector('.journey-cta');
  if (journeyCta) journeyCta.textContent = t('journey_cta');
  var journeyNote = document.querySelector('.journey-note');
  if (journeyNote) journeyNote.textContent = t('journey_note');
  var reflTitle = document.querySelector('.reflection-title');
  if (reflTitle) reflTitle.textContent = t('section_reflection');
  var reflHeadline = document.querySelector('.reflection-headline');
  if (reflHeadline) reflHeadline.textContent = t('reflection_headline');
  var reflBody = document.querySelector('.reflection-body');
  if (reflBody) reflBody.textContent = t('reflection_body');

  /* Milestones */
  var msLabels = document.querySelectorAll('.ms-label');
  var msLabelKeys = ['ms_jumua','ms_10k','ms_age30','ms_1b'];
  msLabels.forEach(function(lbl, i) { if (msLabelKeys[i]) lbl.textContent = t(msLabelKeys[i]); });
  var msTitle = document.querySelector('.ms-title');
  if (msTitle) msTitle.textContent = t('section_milestones');

  /* Share */
  var shareTitle = document.querySelector('.share-title');
  if (shareTitle) shareTitle.textContent = t('section_share');
  var shareSub = document.querySelector('.share-sub');
  if (shareSub) shareSub.textContent = t('share_sub');
  var dlBtn = el('btn-download');
  if (dlBtn) dlBtn.textContent = t('share_download');
  var copyBtn = el('btn-copy-link');
  if (copyBtn) copyBtn.textContent = t('share_copy');
  var spTagline = document.querySelector('.sp-tagline');
  if (spTagline) spTagline.textContent = t('share_tagline');

  /* Tracker */
  var trackerSub = document.querySelector('.tracker-sub-heading');
  if (trackerSub) trackerSub.textContent = t('tracker_sub');
  var salahTitle = document.querySelector('.tracker-card:nth-child(1) .tracker-card-title');
  if (salahTitle) salahTitle.textContent = t('tracker_salah_title');
  var quranTitle = document.querySelector('.tracker-card:nth-child(2) .tracker-card-title');
  if (quranTitle) quranTitle.textContent = t('tracker_quran_title');
  var weekTitle = document.querySelector('.tracker-card:nth-child(3) .tracker-card-title');
  if (weekTitle) weekTitle.textContent = t('tracker_week_title');
  var resetBtn = el('btn-reset-tracker');
  if (resetBtn) resetBtn.textContent = t('tracker_reset');

  /* Qibla */
  var qiblaTitle = document.querySelector('.qibla-info-title');
  if (qiblaTitle) qiblaTitle.textContent = t('qibla_title');
  var qiblaBody = document.querySelector('.qibla-info-body');
  if (qiblaBody) qiblaBody.innerHTML = t('qibla_body');
  var qiblaAyahTr = document.querySelector('.qibla-ayah-tr');
  if (qiblaAyahTr) qiblaAyahTr.textContent = t('qibla_ayah_tr');
  var qTap = el('qibla-direction-label');
  if (qTap && qTap.textContent === 'Tap to find Qibla') qTap.textContent = t('qibla_tap');
  var qLocLabel = document.querySelector('.qs-row:nth-child(1) .qs-label');
  if (qLocLabel) qLocLabel.textContent = t('qibla_location');
  var qDistLabel = document.querySelector('.qs-row:nth-child(2) .qs-label');
  if (qDistLabel) qDistLabel.textContent = t('qibla_distance');
  var qBearLabel = document.querySelector('.qs-row:nth-child(3) .qs-label');
  if (qBearLabel) qBearLabel.textContent = t('qibla_bearing');
  var qiblaBtn = el('btn-qibla');
  if (qiblaBtn && !qiblaBtn.disabled) qiblaBtn.innerHTML =
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg> ' +
    t('qibla_find_btn');
  var qNote = el('qibla-note');
  if (qNote) qNote.textContent = t('qibla_note');

  /* Live age */
  var laLabels = document.querySelectorAll('.la-label');
  var laKeys = ['la_years','la_months','la_weeks','la_days','la_hours','la_minutes','la_seconds'];
  laLabels.forEach(function(lbl, i) { if (laKeys[i]) lbl.textContent = t(laKeys[i]); });
  var laSub = el('liveage-sub');
  if (laSub) laSub.textContent = _birth ? t('liveage_sub_active') : t('liveage_sub_empty');

  /* Birthday */
  var bdayTitle2 = el('bday-title');
  if (bdayTitle2 && bdayTitle2.textContent === 'Next Birthday') bdayTitle2.textContent = t('bday_title');

  /* Story */
  var storyClosing = document.querySelector('.story-closing');
  if (storyClosing) storyClosing.textContent = t('story_closing');
  var storyShareBtn = el('btn-story-share');
  if (storyShareBtn) storyShareBtn.textContent = t('story_share_btn');

  /* Continue buttons */
  var cont1 = document.querySelector('#continue-1 .step-continue-label');
  if (cont1) cont1.textContent = t('continue_1');
  var cont2 = document.querySelector('#continue-2 .step-continue-label');
  if (cont2) cont2.textContent = t('continue_2');
  var cont3 = document.querySelector('#continue-3 .step-continue-label');
  if (cont3) cont3.textContent = t('continue_3');
  var contBtn1 = document.querySelector('#continue-1 .btn-continue');
  if (contBtn1) contBtn1.textContent = t('continue_btn_1');
  var contBtn2 = document.querySelector('#continue-2 .btn-continue');
  if (contBtn2) contBtn2.textContent = t('continue_btn_2');
  var contBtn3 = document.querySelector('#continue-3 .btn-continue');
  if (contBtn3) contBtn3.textContent = t('continue_btn_3');

  /* Start again */
  var startAgain = el('btn-start-again');
  if (startAgain) startAgain.textContent = t('start_again');

  /* Footer */
  var footerBrandP = document.querySelector('.footer-brand p');
  if (footerBrandP) footerBrandP.innerHTML = t('footer_tagline').replace('. ', '.<br>');
  var footerCenter = document.querySelector('.footer-center');
  if (footerCenter) footerCenter.childNodes[0] && (footerCenter.childNodes[0].textContent = t('footer_made'));
  var footerCopy = document.querySelector('.footer-copy');
  if (footerCopy) footerCopy.textContent = t('footer_copy');

  /* Mirror */
  var mirrorSub = document.querySelector('.lm-sub');
  if (mirrorSub) mirrorSub.textContent = t('mirror_sub');
  var mirrorBtn = el('lm-close');
  if (mirrorBtn) mirrorBtn.textContent = t('mirror_btn');
  var mirrorSkip = el('lm-skip');
  if (mirrorSkip) mirrorSkip.textContent = t('mirror_skip');

  /* Re-render dynamic sections with new language */
  if (typeof renderWakeUpSystem === 'function') renderWakeUpSystem();
  if (_birth) {
    var tots = getTotals(_birth);
    var ageYrs = (tots.day / 365.25);
    renderReflections(tots, (ageYrs * 0.333).toFixed(1), (tots.day * 24 * 60 * 70 / 1e9).toFixed(2), (tots.sec / 1e6).toFixed(1));
    updateLiveAge();
  }
  if (typeof renderInsight === 'function') renderInsight(_insightDaysLived);

  /* Update lang indicator */
  var langCurrent = el('lang-current');
  if (langCurrent) {
    var labels2 = { en: 'EN', ur: 'UR', ar: 'AR', roman: 'RO' };
    langCurrent.textContent = labels2[_lang] || 'EN';
  }
  /* Mark active option */
  document.querySelectorAll('.lang-option').forEach(function(opt) {
    opt.classList.toggle('active', opt.getAttribute('data-lang') === _lang);
  });
}

function loadLanguage(lang, callback) {
  fetch('lang/' + lang + '.json')
    .then(function(r) { return r.json(); })
    .then(function(data) {
      _langData = data;
      _lang = lang;
      _langLoaded = true;
      try { localStorage.setItem('waqtx_lang', lang); } catch(e) {}
      var meta = data._meta || {};
      applyDocumentDir(meta.dir);
      applyLangToDOM();
      if (callback) callback();
    })
    .catch(function() {
      /* Fallback: keep English */
      _langLoaded = true;
      if (callback) callback();
    });
}

/* Language switcher UI */
(function() {
  var btn      = el('lang-btn');
  var dropdown = el('lang-dropdown');
  if (!btn || !dropdown) return;

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
      loadLanguage(lang);
    });
  });
})();

/* Load saved language and theme on startup */
(function() {
  initThemeToggle();
  updateHeroPrayerState();
  setInterval(updateHeroPrayerState, 60000);
  var saved;
  try { saved = localStorage.getItem('waqtx_lang') || 'en'; } catch(e) { saved = 'en'; }
  loadLanguage(saved);
})();

/* Smooth scroll to the core capsule section from hero CTA */
(function() {
  var btn = el('btn-prayer-info');
  var target = el('profile-section');
  if (!btn || !target) return;
  btn.addEventListener('click', function() {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
})();

function setText(id, v) { const e = el(id); if (e) e.textContent = v; }
function fmt(n) { return Number(n).toLocaleString(); }

function parseDOB(str) {
  const p = str.split('-');
  return new Date(+p[0], +p[1] - 1, +p[2]);
}

function getTotals(birth) {
  const ms  = Date.now() - birth.getTime();
  const sec = Math.floor(ms / 1000);
  const min = Math.floor(sec / 60);
  const hr  = Math.floor(min / 60);
  const day = Math.floor(hr / 24);
  return { sec, min, hr, day };
}

function getBreakdown(birth) {
  const n  = new Date();
  let yy   = n.getFullYear() - birth.getFullYear();
  let mo   = n.getMonth()    - birth.getMonth();
  let dd   = n.getDate()     - birth.getDate();
  if (dd < 0) { dd += new Date(n.getFullYear(), n.getMonth(), 0).getDate(); mo--; }
  if (mo < 0) { mo += 12; yy--; }
  return { yy, mo, dd };
}

/* ── Gregorian → Hijri ── */
/* Kuwaiti algorithm — accurate ±1 day for 1900–2100 */
function toHijri(date) {
  var D = date.getDate();
  var M = date.getMonth() + 1;
  var Y = date.getFullYear();

  /* Gregorian → Julian Day Number */
  var a = Math.floor((14 - M) / 12);
  var y = Y + 4800 - a;
  var m = M + 12 * a - 3;
  var JDN = D
    + Math.floor((153 * m + 2) / 5)
    + 365 * y
    + Math.floor(y / 4)
    - Math.floor(y / 100)
    + Math.floor(y / 400)
    - 32045;

  /* JDN → Hijri. Islamic epoch = JDN 1948439 */
  var daysSinceEpoch = JDN - 1948439;
  var cycle30 = Math.floor(daysSinceEpoch / 10631);
  var dayInCycle = daysSinceEpoch - 10631 * cycle30;

  /* Leap years in 30-year cycle */
  var LEAP = [2,5,7,10,13,15,18,21,24,26,29];
  function isLeap(yi) { return LEAP.indexOf(yi) !== -1; }
  function daysInHijriYear(yi) { return isLeap(yi) ? 355 : 354; }

  var yearInCycle = Math.max(1, Math.ceil((dayInCycle + 1) / 354.367));
  if (yearInCycle > 30) yearInCycle = 30;

  var daysAtYearStart = 0;
  for (var i = 1; i < yearInCycle; i++) daysAtYearStart += daysInHijriYear(i);
  while (daysAtYearStart + daysInHijriYear(yearInCycle) <= dayInCycle && yearInCycle < 30) {
    daysAtYearStart += daysInHijriYear(yearInCycle++);
  }
  while (daysAtYearStart > dayInCycle && yearInCycle > 1) {
    daysAtYearStart -= daysInHijriYear(--yearInCycle);
  }

  var hYear = 30 * cycle30 + yearInCycle;
  var dayInYear = dayInCycle - daysAtYearStart;

  var hMonth = 1;
  var daysAccum = 0;
  for (var mo = 1; mo <= 12; mo++) {
    var mLen = (mo % 2 === 1) ? 30 : 29;
    if (mo === 12 && isLeap(yearInCycle)) mLen = 30;
    if (dayInYear < daysAccum + mLen) { hMonth = mo; break; }
    daysAccum += mLen;
  }

  return { year: hYear, month: hMonth };
}

const HIJRI_MONTHS = [
  'Muharram', 'Safar', "Rabi' al-Awwal", "Rabi' al-Thani",
  'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', "Sha'ban",
  'Ramadan', 'Shawwal', "Dhu al-Qi'dah", 'Dhu al-Hijjah'
];

/* ── World Data (Pakistan-focused, 1947–2025) ── */
const WORLD_DATA = {
  1947: { pm: 'Liaquat Ali Khan',        president: 'Muhammad Ali Jinnah',    currency: 'Pakistani Rupee (PKR)', pop: '2.3 Billion', event: 'Pakistan Independence',        tech: 'First Transistor Invented' },
  1948: { pm: 'Liaquat Ali Khan',        president: 'Khawaja Nazimuddin',     currency: 'Pakistani Rupee (PKR)', pop: '2.4 Billion', event: 'State of Israel Founded',       tech: 'Long-Playing Record (LP)' },
  1949: { pm: 'Liaquat Ali Khan',        president: 'Khawaja Nazimuddin',     currency: 'Pakistani Rupee (PKR)', pop: '2.5 Billion', event: 'NATO Founded',                  tech: 'First Stored-Program Computer' },
  1950: { pm: 'Liaquat Ali Khan',        president: 'Khawaja Nazimuddin',     currency: 'Pakistani Rupee (PKR)', pop: '2.5 Billion', event: 'Korean War Began',              tech: 'Credit Card Invented' },
  1951: { pm: 'Liaquat Ali Khan',        president: 'Khawaja Nazimuddin',     currency: 'Pakistani Rupee (PKR)', pop: '2.6 Billion', event: 'First Nuclear Power Plant',     tech: 'Color TV Introduced' },
  1952: { pm: 'Khawaja Nazimuddin',      president: 'Ghulam Mohammad',        currency: 'Pakistani Rupee (PKR)', pop: '2.6 Billion', event: 'Queen Elizabeth II Crowned',    tech: 'Polio Vaccine Developed' },
  1953: { pm: 'Mohammad Ali Bogra',      president: 'Ghulam Mohammad',        currency: 'Pakistani Rupee (PKR)', pop: '2.7 Billion', event: 'Korean War Ended',              tech: 'DNA Double Helix Discovered' },
  1954: { pm: 'Mohammad Ali Bogra',      president: 'Ghulam Mohammad',        currency: 'Pakistani Rupee (PKR)', pop: '2.8 Billion', event: 'First Nuclear Submarine',       tech: 'FORTRAN Language Created' },
  1955: { pm: 'Chaudhry Mohammad Ali',   president: 'Iskander Mirza',         currency: 'Pakistani Rupee (PKR)', pop: '2.8 Billion', event: 'Warsaw Pact Signed',            tech: 'Disneyland Opened' },
  1956: { pm: 'Huseyn Shaheed Suhrawardy', president: 'Iskander Mirza',       currency: 'Pakistani Rupee (PKR)', pop: '2.9 Billion', event: 'Suez Crisis',                   tech: 'Hard Disk Drive Invented' },
  1957: { pm: 'Huseyn Shaheed Suhrawardy', president: 'Iskander Mirza',       currency: 'Pakistani Rupee (PKR)', pop: '3.0 Billion', event: 'Sputnik Launched',              tech: 'First Satellite in Space' },
  1958: { pm: 'Feroz Khan Noon',         president: 'Ayub Khan',              currency: 'Pakistani Rupee (PKR)', pop: '3.0 Billion', event: 'NASA Founded',                  tech: 'Integrated Circuit Invented' },
  1959: { pm: 'Ayub Khan',               president: 'Ayub Khan',              currency: 'Pakistani Rupee (PKR)', pop: '3.1 Billion', event: 'Cuban Revolution',              tech: 'Microchip Invented' },
  1960: { pm: 'Ayub Khan',               president: 'Ayub Khan',              currency: 'Pakistani Rupee (PKR)', pop: '3.0 Billion', event: 'Islamabad Became Capital',       tech: 'Laser Invented' },
  1961: { pm: 'Ayub Khan',               president: 'Ayub Khan',              currency: 'Pakistani Rupee (PKR)', pop: '3.1 Billion', event: 'Berlin Wall Built',             tech: 'First Human in Space' },
  1962: { pm: 'Ayub Khan',               president: 'Ayub Khan',              currency: 'Pakistani Rupee (PKR)', pop: '3.2 Billion', event: 'Cuban Missile Crisis',          tech: 'First Communications Satellite' },
  1963: { pm: 'Ayub Khan',               president: 'Ayub Khan',              currency: 'Pakistani Rupee (PKR)', pop: '3.2 Billion', event: 'JFK Assassinated',              tech: 'Cassette Tape Invented' },
  1964: { pm: 'Ayub Khan',               president: 'Ayub Khan',              currency: 'Pakistani Rupee (PKR)', pop: '3.3 Billion', event: 'Civil Rights Act Signed',       tech: 'BASIC Language Created' },
  1965: { pm: 'Ayub Khan',               president: 'Ayub Khan',              currency: 'Pakistani Rupee (PKR)', pop: '3.4 Billion', event: 'Indo-Pak War 1965',             tech: 'Minicomputer Introduced' },
  1966: { pm: 'Ayub Khan',               president: 'Ayub Khan',              currency: 'Pakistani Rupee (PKR)', pop: '3.4 Billion', event: 'Cultural Revolution in China',  tech: 'First Soft Landing on Moon' },
  1967: { pm: 'Ayub Khan',               president: 'Ayub Khan',              currency: 'Pakistani Rupee (PKR)', pop: '3.5 Billion', event: 'Six-Day War',                   tech: 'First Heart Transplant' },
  1968: { pm: 'Ayub Khan',               president: 'Ayub Khan',              currency: 'Pakistani Rupee (PKR)', pop: '3.6 Billion', event: 'Martin Luther King Killed',     tech: 'Intel Founded' },
  1969: { pm: 'Yahya Khan',              president: 'Yahya Khan',             currency: 'Pakistani Rupee (PKR)', pop: '3.7 Billion', event: 'Moon Landing',                  tech: 'ARPANET (Internet) Created' },
  1970: { pm: 'Yahya Khan',              president: 'Yahya Khan',             currency: 'Pakistani Rupee (PKR)', pop: '3.7 Billion', event: 'Bangladesh Liberation War',     tech: 'Floppy Disk Invented' },
  1971: { pm: 'Zulfikar Ali Bhutto',     president: 'Zulfikar Ali Bhutto',    currency: 'Pakistani Rupee (PKR)', pop: '3.8 Billion', event: 'Bangladesh Independence',       tech: 'Email Invented' },
  1972: { pm: 'Zulfikar Ali Bhutto',     president: 'Zulfikar Ali Bhutto',    currency: 'Pakistani Rupee (PKR)', pop: '3.9 Billion', event: 'Nixon Visits China',            tech: 'Pong Video Game Released' },
  1973: { pm: 'Zulfikar Ali Bhutto',     president: 'Fazal Ilahi Chaudhry',   currency: 'Pakistani Rupee (PKR)', pop: '4.0 Billion', event: 'Oil Crisis',                    tech: 'Ethernet Invented' },
  1974: { pm: 'Zulfikar Ali Bhutto',     president: 'Fazal Ilahi Chaudhry',   currency: 'Pakistani Rupee (PKR)', pop: '4.0 Billion', event: 'India Nuclear Test',            tech: 'Barcode Scanner Used' },
  1975: { pm: 'Zulfikar Ali Bhutto',     president: 'Fazal Ilahi Chaudhry',   currency: 'Pakistani Rupee (PKR)', pop: '4.1 Billion', event: 'Vietnam War Ended',             tech: 'Microsoft Founded' },
  1976: { pm: 'Zulfikar Ali Bhutto',     president: 'Fazal Ilahi Chaudhry',   currency: 'Pakistani Rupee (PKR)', pop: '4.2 Billion', event: 'Mao Zedong Died',              tech: 'Apple Computer Founded' },
  1977: { pm: 'Zulfikar Ali Bhutto',     president: 'Zia ul-Haq',             currency: 'Pakistani Rupee (PKR)', pop: '4.2 Billion', event: 'Zia ul-Haq Coup',              tech: 'Apple II Released' },
  1978: { pm: 'Zia ul-Haq',             president: 'Zia ul-Haq',             currency: 'Pakistani Rupee (PKR)', pop: '4.3 Billion', event: 'Camp David Accords',            tech: 'First Test-Tube Baby Born' },
  1979: { pm: 'Zia ul-Haq',             president: 'Zia ul-Haq',             currency: 'Pakistani Rupee (PKR)', pop: '4.4 Billion', event: 'Soviet Invasion of Afghanistan', tech: 'VisiCalc Spreadsheet Released' },
  1980: { pm: 'Zia ul-Haq',             president: 'Zia ul-Haq',             currency: 'Pakistani Rupee (PKR)', pop: '4.4 Billion', event: 'Iran-Iraq War Began',           tech: 'Pac-Man Released' },
  1981: { pm: 'Zia ul-Haq',             president: 'Zia ul-Haq',             currency: 'Pakistani Rupee (PKR)', pop: '4.5 Billion', event: 'Reagan Inaugurated',            tech: 'IBM PC Released' },
  1982: { pm: 'Zia ul-Haq',             president: 'Zia ul-Haq',             currency: 'Pakistani Rupee (PKR)', pop: '4.6 Billion', event: 'Falklands War',                 tech: 'CD Player Released' },
  1983: { pm: 'Zia ul-Haq',             president: 'Zia ul-Haq',             currency: 'Pakistani Rupee (PKR)', pop: '4.7 Billion', event: 'US Embassy Bombing Beirut',     tech: 'Internet Protocols Established' },
  1984: { pm: 'Zia ul-Haq',             president: 'Zia ul-Haq',             currency: 'Pakistani Rupee (PKR)', pop: '4.8 Billion', event: 'Bhopal Gas Tragedy',            tech: 'Apple Macintosh Released' },
  1985: { pm: 'Muhammad Khan Junejo',    president: 'Zia ul-Haq',             currency: 'Pakistani Rupee (PKR)', pop: '4.8 Billion', event: 'Live Aid Concert',              tech: 'Windows 1.0 Released' },
  1986: { pm: 'Muhammad Khan Junejo',    president: 'Zia ul-Haq',             currency: 'Pakistani Rupee (PKR)', pop: '4.9 Billion', event: 'Chernobyl Disaster',            tech: 'Pixar Founded' },
  1987: { pm: 'Muhammad Khan Junejo',    president: 'Zia ul-Haq',             currency: 'Pakistani Rupee (PKR)', pop: '5.0 Billion', event: 'Black Monday Stock Crash',      tech: 'GIF Format Created' },
  1988: { pm: 'Benazir Bhutto',          president: 'Ghulam Ishaq Khan',      currency: 'Pakistani Rupee (PKR)', pop: '5.1 Billion', event: 'Lockerbie Bombing',             tech: 'World Wide Web Proposed' },
  1989: { pm: 'Benazir Bhutto',          president: 'Ghulam Ishaq Khan',      currency: 'Pakistani Rupee (PKR)', pop: '5.2 Billion', event: 'Berlin Wall Fell',              tech: 'WWW Invented' },
  1990: { pm: 'Nawaz Sharif',            president: 'Ghulam Ishaq Khan',      currency: 'Pakistani Rupee (PKR)', pop: '5.3 Billion', event: 'German Reunification',          tech: 'World Wide Web Created' },
  1991: { pm: 'Nawaz Sharif',            president: 'Ghulam Ishaq Khan',      currency: 'Pakistani Rupee (PKR)', pop: '5.4 Billion', event: 'Soviet Union Dissolved',        tech: 'Linux Released' },
  1992: { pm: 'Nawaz Sharif',            president: 'Ghulam Ishaq Khan',      currency: 'Pakistani Rupee (PKR)', pop: '5.5 Billion', event: 'Maastricht Treaty Signed',      tech: 'SMS Text Messaging' },
  1993: { pm: 'Benazir Bhutto',          president: 'Farooq Leghari',         currency: 'Pakistani Rupee (PKR)', pop: '5.6 Billion', event: 'Oslo Accords Signed',           tech: 'Mosaic Browser Released' },
  1994: { pm: 'Benazir Bhutto',          president: 'Farooq Leghari',         currency: 'Pakistani Rupee (PKR)', pop: '5.6 Billion', event: 'Nelson Mandela Elected',        tech: 'Amazon Founded' },
  1995: { pm: 'Benazir Bhutto',          president: 'Farooq Leghari',         currency: 'Pakistani Rupee (PKR)', pop: '5.7 Billion', event: 'Oklahoma City Bombing',         tech: 'Windows 95 Released' },
  1996: { pm: 'Benazir Bhutto',          president: 'Farooq Leghari',         currency: 'Pakistani Rupee (PKR)', pop: '5.8 Billion', event: 'Summer Olympics in Atlanta',    tech: 'DVD Format Introduced' },
  1997: { pm: 'Nawaz Sharif',            president: 'Muhammad Rafiq Tarar',   currency: 'Pakistani Rupee (PKR)', pop: '5.9 Billion', event: 'Hong Kong Handover to China',   tech: 'Deep Blue Beats Kasparov' },
  1998: { pm: 'Nawaz Sharif',            president: 'Muhammad Rafiq Tarar',   currency: 'Pakistani Rupee (PKR)', pop: '5.9 Billion', event: 'Pakistan Nuclear Tests',        tech: 'Google Founded' },
  1999: { pm: 'Pervez Musharraf',        president: 'Muhammad Rafiq Tarar',   currency: 'Pakistani Rupee (PKR)', pop: '6.0 Billion', event: 'NATO Kosovo Campaign',          tech: 'Napster Launched' },
  2000: { pm: 'Pervez Musharraf',        president: 'Pervez Musharraf',       currency: 'Pakistani Rupee (PKR)', pop: '6.1 Billion', event: 'Y2K Fears Unfounded',           tech: 'USB Flash Drive Invented' },
  2001: { pm: 'Pervez Musharraf',        president: 'Pervez Musharraf',       currency: 'Pakistani Rupee (PKR)', pop: '6.2 Billion', event: 'September 11 Attacks',          tech: 'Wikipedia Launched' },
  2002: { pm: 'Zafarullah Khan Jamali',  president: 'Pervez Musharraf',       currency: 'Pakistani Rupee (PKR)', pop: '6.2 Billion', event: 'Euro Coins Introduced',         tech: 'Friendster Launched' },
  2003: { pm: 'Zafarullah Khan Jamali',  president: 'Pervez Musharraf',       currency: 'Pakistani Rupee (PKR)', pop: '6.3 Billion', event: 'Iraq War Began',                tech: 'Skype Launched' },
  2004: { pm: 'Shaukat Aziz',            president: 'Pervez Musharraf',       currency: 'Pakistani Rupee (PKR)', pop: '6.4 Billion', event: 'Indian Ocean Tsunami',          tech: 'Facebook Founded' },
  2005: { pm: 'Shaukat Aziz',            president: 'Pervez Musharraf',       currency: 'Pakistani Rupee (PKR)', pop: '6.5 Billion', event: 'Kashmir Earthquake',            tech: 'YouTube Founded' },
  2006: { pm: 'Shaukat Aziz',            president: 'Pervez Musharraf',       currency: 'Pakistani Rupee (PKR)', pop: '6.6 Billion', event: 'Saddam Hussein Executed',       tech: 'Twitter Launched' },
  2007: { pm: 'Shaukat Aziz',            president: 'Pervez Musharraf',       currency: 'Pakistani Rupee (PKR)', pop: '6.6 Billion', event: 'Benazir Bhutto Assassinated',   tech: 'iPhone Released' },
  2008: { pm: 'Yousaf Raza Gillani',     president: 'Asif Ali Zardari',       currency: 'Pakistani Rupee (PKR)', pop: '6.7 Billion', event: 'Global Financial Crisis',       tech: 'Android OS Released' },
  2009: { pm: 'Yousaf Raza Gillani',     president: 'Asif Ali Zardari',       currency: 'Pakistani Rupee (PKR)', pop: '6.8 Billion', event: 'Obama Inaugurated',             tech: 'WhatsApp Founded' },
  2010: { pm: 'Yousaf Raza Gillani',     president: 'Asif Ali Zardari',       currency: 'Pakistani Rupee (PKR)', pop: '6.9 Billion', event: 'Pakistan Floods',               tech: 'Instagram Launched' },
  2011: { pm: 'Yousaf Raza Gillani',     president: 'Asif Ali Zardari',       currency: 'Pakistani Rupee (PKR)', pop: '7.0 Billion', event: 'Arab Spring',                   tech: 'Siri Launched' },
  2012: { pm: 'Raja Pervaiz Ashraf',     president: 'Asif Ali Zardari',       currency: 'Pakistani Rupee (PKR)', pop: '7.1 Billion', event: 'London Olympics',               tech: 'Raspberry Pi Released' },
  2013: { pm: 'Nawaz Sharif',            president: 'Mamnoon Hussain',        currency: 'Pakistani Rupee (PKR)', pop: '7.2 Billion', event: 'Malala Nobel Prize',            tech: 'Snapchat Launched' },
  2014: { pm: 'Nawaz Sharif',            president: 'Mamnoon Hussain',        currency: 'Pakistani Rupee (PKR)', pop: '7.3 Billion', event: 'ISIS Declared Caliphate',       tech: 'Apple Watch Announced' },
  2015: { pm: 'Nawaz Sharif',            president: 'Mamnoon Hussain',        currency: 'Pakistani Rupee (PKR)', pop: '7.4 Billion', event: 'Paris Climate Agreement',       tech: 'Windows 10 Released' },
  2016: { pm: 'Nawaz Sharif',            president: 'Mamnoon Hussain',        currency: 'Pakistani Rupee (PKR)', pop: '7.4 Billion', event: 'Brexit Vote',                   tech: 'Pokemon Go Released' },
  2017: { pm: 'Shahid Khaqan Abbasi',    president: 'Mamnoon Hussain',        currency: 'Pakistani Rupee (PKR)', pop: '7.5 Billion', event: 'Rohingya Crisis',               tech: 'Bitcoin Surged' },
  2018: { pm: 'Imran Khan',              president: 'Arif Alvi',              currency: 'Pakistani Rupee (PKR)', pop: '7.6 Billion', event: 'Saudi Arabia Reforms',          tech: '5G Networks Launched' },
  2019: { pm: 'Imran Khan',              president: 'Arif Alvi',              currency: 'Pakistani Rupee (PKR)', pop: '7.7 Billion', event: 'Notre Dame Fire',               tech: 'Foldable Phones Released' },
  2020: { pm: 'Imran Khan',              president: 'Arif Alvi',              currency: 'Pakistani Rupee (PKR)', pop: '7.8 Billion', event: 'COVID-19 Pandemic',             tech: 'Zoom Became Essential' },
  2021: { pm: 'Imran Khan',              president: 'Arif Alvi',              currency: 'Pakistani Rupee (PKR)', pop: '7.9 Billion', event: 'Taliban Retook Afghanistan',    tech: 'NFTs Exploded' },
  2022: { pm: 'Shehbaz Sharif',          president: 'Arif Alvi',              currency: 'Pakistani Rupee (PKR)', pop: '8.0 Billion', event: 'Russia-Ukraine War',            tech: 'ChatGPT Launched' },
  2023: { pm: 'Anwaar-ul-Haq Kakar',     president: 'Arif Alvi',              currency: 'Pakistani Rupee (PKR)', pop: '8.1 Billion', event: 'Gaza Conflict',                 tech: 'AI Revolution' },
  2024: { pm: 'Shehbaz Sharif',          president: 'Asif Ali Zardari',       currency: 'Pakistani Rupee (PKR)', pop: '8.2 Billion', event: 'Global Elections Year',         tech: 'AI Everywhere' },
  2025: { pm: 'Shehbaz Sharif',          president: 'Asif Ali Zardari',       currency: 'Pakistani Rupee (PKR)', pop: '8.2 Billion', event: 'AI Reshaping the World',        tech: 'Agentic AI Era' },
  2026: { pm: 'Shehbaz Sharif',          president: 'Asif Ali Zardari',       currency: 'Pakistani Rupee (PKR)', pop: '8.3 Billion', event: 'AI Integration in Daily Life',  tech: 'Multimodal AI & Robotics' }
};

function getWorldData(year) {
  if (WORLD_DATA[year]) return WORLD_DATA[year];
  if (year < 1947) return {
    pm: 'British Colonial Rule', president: 'N/A (Pre-Independence)',
    currency: 'British Indian Rupee', pop: 'Below 2.3 Billion',
    event: 'World War II Era', tech: 'Early Radio & Aviation'
  };
  var years = Object.keys(WORLD_DATA).map(Number);
  var latest = Math.max.apply(null, years);
  return WORLD_DATA[latest];
}

/* ── Islamic Dates ── */
function getNextRamadan() {
  /* Find next 1 Ramadan by scanning forward from today's Hijri year.
     We convert 1 Ramadan of the current and next two Hijri years to
     Gregorian and return the first one still in the future. */
  const today = new Date();
  const hijriNow = toHijri(today);

  /* Approximate Gregorian date of 1 Ramadan for a given Hijri year.
     Uses the inverse: count days from Islamic epoch. */
  function ramadanStart(hYear) {
    /* Days from epoch to 1 Ramadan of hYear:
       Each 30-year cycle = 10631 days.
       Leap years in cycle: 2,5,7,10,13,15,18,21,24,26,29 */
    const LEAP = [2,5,7,10,13,15,18,21,24,26,29];
    function isLeap(y) { return LEAP.indexOf(((y - 1) % 30) + 1) !== -1; }
    function daysInYear(y) { return isLeap(y) ? 355 : 354; }

    /* Days from epoch to start of hYear */
    let days = 0;
    for (let y = 1; y < hYear; y++) days += daysInYear(y);

    /* Add days for months 1–8 (Muharram through Sha'ban) */
    /* Month lengths: odd=30, even=29 */
    for (let mo = 1; mo <= 8; mo++) {
      days += (mo % 2 === 1) ? 30 : 29;
    }

    /* Convert days-since-epoch to Gregorian */
    const JDN = days + 1948439;
    let l = JDN + 68569;
    const n = Math.floor((4 * l) / 146097);
    l = l - Math.floor((146097 * n + 3) / 4);
    const i = Math.floor((4000 * (l + 1)) / 1461001);
    l = l - Math.floor((1461 * i) / 4) + 31;
    const j = Math.floor((80 * l) / 2447);
    const gDay   = l - Math.floor((2447 * j) / 80);
    const gMonth = j + 2 - 12 * Math.floor(j / 11);
    const gYear  = 100 * (n - 49) + i + Math.floor(j / 11);
    return new Date(gYear, gMonth - 1, gDay);
  }

  for (let offset = 0; offset <= 2; offset++) {
    const candidate = ramadanStart(hijriNow.year + offset);
    if (candidate > today) {
      return candidate.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
    }
  }
  /* Fallback */
  return ramadanStart(hijriNow.year + 1)
    .toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
}

function getNextJumua() {
  const today = new Date();
  const day = today.getDay();
  let daysUntil = (5 - day + 7) % 7;
  if (daysUntil === 0) daysUntil = 7;
  const next = new Date(today);
  next.setDate(today.getDate() + daysUntil);
  return next.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

function getMilestoneDate(birth, targetDays) {
  const d = new Date(birth.getTime());
  d.setDate(d.getDate() + targetDays);
  if (d <= new Date()) return 'Achieved \u2713';
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

/* ── Ring Animation ── */
function animateRing(pct) {
  const ring = el('ring-fill');
  if (!ring) return;
  const circumference = 314;
  const offset = circumference - (pct / 100) * circumference;
  setTimeout(function () { ring.style.strokeDashoffset = offset; }, 400);
}

/* ── Counter Animation ── */
function animateCounter(elId, target, duration) {
  const e = el(elId);
  if (!e) return;
  const steps = 60;
  const step = Math.ceil(target / steps);
  let current = 0;
  const interval = Math.floor(duration / steps);
  const timer = setInterval(function () {
    current = Math.min(current + step, target);
    e.textContent = Number(current).toLocaleString();
    if (current >= target) clearInterval(timer);
  }, interval);
}

/* ── Hero Preview Stats (shown before DOB is submitted) ── */
function updateHeroPreview(birth) {
  if (!birth || birth > new Date() || birth.getFullYear() < 1900) return;
  const t = getTotals(birth);
  const b = getBreakdown(birth);
  const ageYears = b.yy + b.mo / 12 + b.dd / 365;
  const ramadans = Math.floor(ageYears);
  const fridays = Math.floor(t.day / 7);
  const prayerMoments = Math.floor(t.day * 5);

  const daysEl = el('hero-days-lived');
  if (daysEl) daysEl.textContent = fmt(t.day) + ' days.';

  const ramEl = el('hsp-ramadans');
  if (ramEl) ramEl.textContent = ramadans;

  const heroRamEl = el('hero-meta-ramadans');
  if (heroRamEl) heroRamEl.textContent = ramadans;

  const pctEl = el('hsp-pct');
  if (pctEl) pctEl.textContent = fmt(fridays);

  const fajrEl = el('hsp-fajr');
  if (fajrEl) fajrEl.textContent = fmt(prayerMoments);

  const preview = el('hero-stats-preview');
  if (preview) preview.classList.add('hsp-visible');
}

function getPrayerPeriod(date) {
  const minutes = date.getHours() * 60 + date.getMinutes();
  if (minutes >= 330 && minutes < 390) return 'fajr';
  if (minutes >= 390 && minutes < 720) return 'dhuhr';
  if (minutes >= 720 && minutes < 1020) return 'asr';
  if (minutes >= 1020 && minutes < 1140) return 'maghrib';
  return 'isha';
}

function formatIslamicDate(date) {
  try {
    return new Intl.DateTimeFormat('en-u-ca-islamic', {
      day: 'numeric', month: 'long', year: 'numeric'
    }).format(date);
  } catch (e) {
    return date.toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
    });
  }
}

function formatCountdownSeconds(seconds) {
  const hrs = String(Math.floor(seconds / 3600)).padStart(2, '0');
  const mins = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
  const secs = String(seconds % 60).padStart(2, '0');
  return hrs + ':' + mins + ':' + secs;
}

function updateHeroPrayerState() {
  const hero = el('hero');
  if (!hero) return;
  const now = new Date();
  const period = getPrayerPeriod(now);
  hero.setAttribute('data-prayer', period);

  const labels = {
    fajr: 'Fajr time',
    dhuhr: 'Dhuhr focus',
    asr: 'Asr reflection',
    maghrib: 'Maghrib peace',
    isha: 'Isha calm'
  };

  const nextPrayer = el('hero-next-prayer');
  const nextCountdown = el('hero-next-countdown');

  if (_prayerTimes) {
    const next = getNextPrayer(_prayerTimes);
    if (nextPrayer) nextPrayer.textContent = next.name + (next.isTomorrow ? ' (tomorrow)' : '');
    const nowSec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    let nextSec = next.minutes * 60;
    let diff = nextSec - nowSec;
    if (diff < 0) diff += 86400;
    if (nextCountdown) nextCountdown.textContent = formatCountdownSeconds(diff);
  } else {
    if (nextPrayer) nextPrayer.textContent = labels[period] || 'Prayer time';
    if (nextCountdown) nextCountdown.textContent = 'Loading…';
  }

  const hijriEl = el('hero-hijri-date');
  if (hijriEl) hijriEl.textContent = formatIslamicDate(now);

  const dayRank = el('hero-day-rank');
  if (dayRank) {
    const days = _birth ? fmt(getTotals(_birth).day) : String(Math.floor((now - new Date(now.getFullYear(), 0, 1)) / 86400000) + 1);
    dayRank.textContent = days + ' days';
  }

  const greetingName = el('hero-greeting-name');
  if (greetingName) {
    greetingName.textContent = _name ? _name + ', your journey begins here.' : 'Every day is a page in your story.';
  }
}

/* Update hero preview live as user types DOB */
(function() {
  const dobInput = el('hero-dob');
  if (!dobInput) return;
  dobInput.addEventListener('change', function() {
    if (dobInput.value) {
      try { updateHeroPreview(parseDOB(dobInput.value)); } catch(e) {}
    }
  });
})();

/* ── Daily Return Hook ── */
/* Shows a personalised message to returning users based on their streak + last visit */
(function() {
  try {
    var today = new Date().toISOString().split('T')[0];
    var lastVisit = localStorage.getItem('waqtx_last_visit');
    var streak = 0;
    try {
      var data = JSON.parse(localStorage.getItem('waqtx_tracker') || '{}');
      var d = new Date();
      var consecutive = 0;
      for (var i = 0; i < 30; i++) {
        var dk = new Date(d); dk.setDate(d.getDate() - i);
        var k = dk.toISOString().split('T')[0];
        var dd = data[k];
        if (dd && (dd.salah || []).length >= 5) { consecutive++; }
        else if (i > 0) { break; }
      }
      streak = consecutive;
    } catch(e2) {}

    /* Save today as last visit */
    localStorage.setItem('waqtx_last_visit', today);

    if (!lastVisit || lastVisit === today) return; /* First visit or already shown today */

    var yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    var yesterdayKey = yesterday.toISOString().split('T')[0];
    var missedYesterday = lastVisit < yesterdayKey;

    var savedDob = localStorage.getItem('waqtx_dob');
    var savedName = localStorage.getItem('waqtx_name');
    var greeting = savedName ? savedName : 'You';

    var msg = '';
    if (streak >= 7) {
      msg = '🔥 ' + streak + '-day streak. ' + greeting + ', you\'re building something real. Don\'t stop now.';
    } else if (streak >= 3) {
      msg = '✦ ' + streak + ' days in a row. Keep going — consistency is what separates intention from change.';
    } else if (missedYesterday) {
      msg = '↩ You were away for a bit. Every day you return is a day that counts. Welcome back.';
    } else if (savedDob) {
      var birth = parseDOB(savedDob);
      var tots = getTotals(birth);
      msg = '⏳ Another day has passed — you\'ve now counted ' + fmt(tots.day) + ' days. Make today count.';
    }

    if (!msg) return;

    /* Inject return hook banner */
    var banner = document.createElement('div');
    banner.className = 'return-hook-banner';
    banner.setAttribute('role', 'status');
    banner.innerHTML = '<span class="rhb-text">' + msg + '</span>' +
      '<button class="rhb-close" aria-label="Dismiss">✕</button>';
    document.body.insertBefore(banner, document.body.firstChild);

    banner.querySelector('.rhb-close').addEventListener('click', function() {
      banner.classList.add('rhb-hiding');
      setTimeout(function() { banner.remove(); }, 300);
    });

    /* Auto-dismiss after 8 seconds */
    setTimeout(function() {
      if (banner.parentNode) {
        banner.classList.add('rhb-hiding');
        setTimeout(function() { banner.remove(); }, 300);
      }
    }, 8000);
  } catch(e) {}
})();

/* ── Main Render ── */
function renderAll(birth) {
  _birth = birth;
  const t = getTotals(birth);
  const b = getBreakdown(birth);
  const ageYears = b.yy + b.mo / 12 + b.dd / 365;
  const pct = Math.min(100, (ageYears / AVG_LIFESPAN_YEARS) * 100);
  const pctRound = Math.round(pct * 10) / 10;
  const pctInt = Math.round(pct);

  const hijriBirth = toHijri(birth);
  const hijriNow   = toHijri(new Date());
  const islamicYears = hijriNow.year - hijriBirth.year;
  const ramadans = Math.floor(ageYears);

  const worldData = getWorldData(birth.getFullYear());
  const sleepYears = (ageYears * 0.333).toFixed(1);
  const heartBillions = (t.day * 24 * 60 * 70 / 1e9).toFixed(2);
  const secondsMillion = (t.sec / 1e6).toFixed(1);

  const dayName = birth.toLocaleDateString('en-US', { weekday: 'long' });
  const daySubMap = {
    Friday:    "Jumu'ah \u2013 the best day of the week.",
    Monday:    'A blessed day of the week.',
    Thursday:  'A day of fasting for many.',
    Wednesday: 'A day of remembrance.',
    Saturday:  'A day of rest.',
    Sunday:    'A new beginning.',
    Tuesday:   'A day of strength.'
  };

  /* Show results */
  el('results-section').classList.remove('hidden');
  el('hero').style.minHeight = 'auto';

  /* Personalise heading if name given */
  const nameEl = el('results-name');
  if (nameEl) nameEl.textContent = _name ? _name : 'Your Dashboard';

  /* Glance */
  setText('g-days',    fmt(t.day));
  setText('g-hours',   fmt(t.hr));
  setText('g-sleep',   sleepYears);
  setText('g-hearts',  heartBillions);
  setText('g-sunsets', fmt(t.day));
  setText('g-seconds', secondsMillion);

  /* Islamic */
  setText('ih-hijri-year',    hijriBirth.year + ' AH');
  setText('ih-hijri-month',   HIJRI_MONTHS[(hijriBirth.month - 1) || 0]);
  setText('ih-day',           dayName);
  setText('ih-day-sub',       daySubMap[dayName] || 'A blessed day.');
  setText('ih-ramadans',      ramadans);
  setText('ih-ramadans2',     ramadans);
  setText('ih-hajj',          ramadans);
  setText('ih-hajj2',         ramadans);
  setText('ih-islamic-years', islamicYears);
  setText('ih-hijri-range',   hijriBirth.year + ' AH \u2013 ' + hijriNow.year + ' AH');
  setText('ih-next-ramadan',  getNextRamadan());

  /* World */
  setText('w-pm',         worldData.pm);
  setText('w-president',  worldData.president);
  setText('w-currency',   worldData.currency);
  setText('w-population', worldData.pop);
  setText('w-event',      worldData.event);
  setText('w-tech',       worldData.tech);

  /* Journey ring */
  setText('journey-pct',  pctInt + '%');
  setText('journey-pct2', pctRound + '%');
  animateRing(pctInt);

  /* Milestones */
  setText('ms-jumua',  getNextJumua());
  setText('ms-10k',    getMilestoneDate(birth, 10000));
  const age30 = new Date(birth.getFullYear() + 30, birth.getMonth(), birth.getDate());
  setText('ms-age30',  age30 <= new Date() ? 'Achieved \u2713' : age30.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }));
  setText('ms-1b',     getMilestoneDate(birth, Math.floor(1e9 / 86400)));

  /* Share preview */
  setText('sp-days',  fmt(t.day));
  setText('sp-hijri', hijriBirth.year + ' AH \u2013 ' + hijriNow.year + ' AH');
  const spLogo = el('sp-logo');
  if (spLogo) spLogo.textContent = _name ? '\u2736 ' + _name : '\u2736 WaqtX';

  /* Modal card */
  setText('scdl-pct',   pctInt + '%');
  setText('scdl-days',  fmt(t.day) + ' Days Counted');
  setText('scdl-hijri', hijriBirth.year + ' AH \u2013 ' + hijriNow.year + ' AH');
  const scdlLogo = el('scdl-logo');
  if (scdlLogo) scdlLogo.textContent = _name ? '\u2736 ' + _name + ' \u2014 WaqtX' : '\u2736 WaqtX';

  /* ── New Features (require birth) ── */
  renderLifeStory(birth, ageYears, hijriBirth, hijriNow, ramadans, t);
  renderTimeTruth(ageYears, t);
  renderInsight(t.day); /* update day count in insight */
  renderReflections(t, sleepYears, heartBillions, secondsMillion);
  /* Re-apply language to newly rendered DOM */
  if (_langLoaded) applyLangToDOM();

  /* Progressive reveal — start at step 1 */
  revealStep(1);

  /* Animate day counter */
  setTimeout(function () { animateCounter('g-days', t.day, 1200); }, 500);

  /* Live tick every second — unified ticker */
  startUnifiedTicker();
  /* Call once immediately */
  updateLiveAge();

  /* Save DOB + name */
  try {
    localStorage.setItem('waqtx_dob', birth.toISOString().split('T')[0]);
    if (_name) localStorage.setItem('waqtx_name', _name);
  } catch(e) {}

  /* Scroll to results */
  setTimeout(function () {
    const gs = el('results-section');
    if (gs) gs.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 200);
}

/* ── Progressive Step Reveal ── */
function revealStep(step) {
  document.querySelectorAll('.journey-step').forEach(function(s) {
    const n = parseInt(s.getAttribute('data-step'));
    s.classList.toggle('active', n <= step);
    s.classList.toggle('done', n < step);
  });
  const block = el('step-' + step);
  if (!block) return;
  block.classList.remove('hidden');
  block.classList.add('step-entering');
  setTimeout(function() { block.classList.remove('step-entering'); }, 600);
  setTimeout(function() { block.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 100);
}

/* ── Story Share Modal ── */
function openStoryModal() {
  const modal = el('story-modal');
  if (!modal || !_birth) return;
  const t = getTotals(_birth);
  const b = getBreakdown(_birth);
  const hijriBirth = toHijri(_birth);
  const hijriNow = toHijri(new Date());
  const ramadans = Math.floor(b.yy + b.mo / 12);
  setText('story-sc-days', fmt(t.day));
  setText('story-sc-ramadans', ramadans + ' Ramadans witnessed');
  setText('story-sc-hijri', hijriBirth.year + ' AH \u2013 ' + hijriNow.year + ' AH');
  const storyLogo = el('story-card-dl') && el('story-card-dl').querySelector('.scdl-logo');
  if (storyLogo) storyLogo.textContent = _name ? '\u25C6 ' + _name + ' \u2014 WaqtX' : '\u25C6 WaqtX';
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

/* ── Loading Sequence ── */
function showLoading(cb) {
  const overlay = el('loading-overlay');
  const textEl  = el('loading-text');
  const barFill = el('loading-bar-fill');

  overlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  if (barFill) {
    barFill.style.transition = 'none';
    barFill.style.width = '0%';
    setTimeout(function () {
      barFill.style.transition = 'width 2.7s ease';
      barFill.style.width = '100%';
    }, 30);
  }

  const msgs = [
    'Analyzing your time\u2026',
    'Calculating your Islamic history\u2026',
    'Building your dashboard\u2026'
  ];
  let i = 0;
  textEl.textContent = msgs[0];
  textEl.style.opacity = '1';

  const seq = setInterval(function () {
    i++;
    if (i < msgs.length) {
      textEl.style.opacity = '0';
      setTimeout(function () {
        textEl.textContent = msgs[i];
        textEl.style.opacity = '1';
      }, 300);
    } else {
      clearInterval(seq);
      setTimeout(function () {
        overlay.classList.add('hidden');
        document.body.style.overflow = '';
        if (barFill) { barFill.style.transition = 'none'; barFill.style.width = '0%'; }
        cb();
      }, 600);
    }
  }, 900);
}

/* ── Event Listeners ── */
el('btn-calculate').addEventListener('click', function () {
  const dob   = el('hero-dob').value;
  const errEl = el('hero-error');
  errEl.classList.add('hidden');
  _name = (el('hero-name').value || '').trim();

  if (!dob) {
    errEl.textContent = 'Please select your date of birth.';
    errEl.classList.remove('hidden');
    return;
  }
  const birth = parseDOB(dob);
  if (birth > new Date()) {
    errEl.textContent = 'Date of birth cannot be in the future.';
    errEl.classList.remove('hidden');
    return;
  }
  const minYear = 1900;
  if (birth.getFullYear() < minYear) {
    errEl.textContent = 'Please enter a year after ' + minYear + '.';
    errEl.classList.remove('hidden');
    return;
  }
  showLoading(function () { renderAll(birth); });
});

el('hero-dob').addEventListener('keydown', function (e) {
  if (e.key === 'Enter') el('btn-calculate').click();
});

el('btn-start-again').addEventListener('click', function () {
  el('results-section').classList.add('hidden');
  el('hero').style.minHeight = '';
  el('hero-dob').value = '';
  const nameInp = el('hero-name'); if (nameInp) nameInp.value = '';
  _birth = null; _name = '';
  clearInterval(window._ticker);
  [1,2,3,4].forEach(function(n) {
    const b = el('step-' + n);
    if (b && n > 1) b.classList.add('hidden');
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

/* ══════════════════════════════════════════════
   VIRAL SHARE MODAL 2.0
   ══════════════════════════════════════════════ */

/* ── Caption sets per mode ── */
var SHARE_CAPTIONS = {
  reality: [
    { label: '💭 Deep', text: 'I just counted how many days I\'ve tracked. I wasn\'t ready for the number. Try it yourself.' },
    { label: '🌙 Islamic', text: 'وَمَا تَدْرِي نَفْسٌ مَّاذَا تَكْسِبُ غَدًا\n\nNo soul knows what it will earn tomorrow. This app made me think.' },
    { label: '🔗 Curious', text: 'This tool shows your life in days, heartbeats and Islamic history. Genuinely hit different.' }
  ],
  ibadah: [
    { label: '💪 Flex', text: 'Tracking my salah changed how I think about my day. Day {streak} streak.', template: 'Tracking my salah changed how I think about my day. Day {streak} streak.' },
    { label: '🤲 Invite', text: 'Started tracking my ibadah daily. If you want accountability, try this.' },
    { label: '🌱 Honest', text: 'Not perfect. But consistent. That\'s the goal.' }
  ],
  reflection: [
    { label: '🖤 Quiet', text: 'One day my name will just be a memory. This made me think about what I\'m building.' },
    { label: '📖 Quran', text: 'إِنَّا لِلَّهِ وَإِنَّا إِلَيْهِ رَاجِعُونَ\n\nWe belong to Allah and to Him we return. A reminder I needed today.' },
    { label: '🤍 Gentle', text: 'Sometimes you just need a quiet moment to remember what actually matters.' }
  ]
};

/* ── Open share modal and populate all 3 cards ── */
function openShareModalV2() {
  var modal = el('share-modal');
  if (!modal) return;

  /* Populate data if birth is known */
  if (_birth) {
    var t2 = getTotals(_birth);
    var b2 = getBreakdown(_birth);
    var ageYears = b2.yy + b2.mo / 12 + b2.dd / 365;
    var pct = Math.min(100, (ageYears / AVG_LIFESPAN_YEARS) * 100);
    var hijriBirth = toHijri(_birth);
    var hijriNow   = toHijri(new Date());
    var ramadans   = Math.floor(ageYears);
    var islamicYrs = hijriNow.year - hijriBirth.year;
    var nameStr    = _name || '';

    /* Reality card */
    setText('v2r-days',    fmt(t2.day));
    setText('v2r-pct',     Math.round(pct) + '%');
    setText('v2r-ramadans', ramadans);
    setText('v2r-hijri',   islamicYrs);
    var v2rName = el('v2r-name');
    if (v2rName) v2rName.textContent = nameStr;

    /* Ibadah card */
    var streak = getStreakCount();
    var trackerData = loadTrackerData();
    var todayKey = getTodayKey();
    var todayData = trackerData[todayKey] || { salah: [], dhikr: [] };
    var salahDone = (todayData.salah || []).length;
    var dhikrDone = (todayData.dhikr || []).length;

    /* Full days this week */
    var fullDays = 0;
    for (var i = 0; i < 7; i++) {
      var d = new Date(); d.setDate(d.getDate() - i);
      var k = d.toISOString().split('T')[0];
      var dd = trackerData[k] || { salah: [] };
      if ((dd.salah || []).length >= 5) fullDays++;
    }

    setText('v2i-streak', streak);
    setText('v2i-salah',  salahDone + '/5');
    setText('v2i-week',   fullDays + '/7');
    setText('v2i-dhikr',  dhikrDone + '/5');
    var v2iName = el('v2i-name');
    if (v2iName) v2iName.textContent = nameStr;

    /* Reflection card */
    var reflLines = [
      'I have counted ' + fmt(t2.day) + ' days.',
      'I have witnessed ' + ramadans + ' Ramadans.',
      'Only Allah knows how many remain.'
    ];
    setText('v2ref-body', reflLines[0] + ' ' + reflLines[1]);
    setText('v2ref-stat', reflLines[2]);
    var v2refName = el('v2ref-name');
    if (v2refName) v2refName.textContent = nameStr;

    /* Streak unlock hint */
    var hintEl = el('v2-unlock-hint');
    if (hintEl) {
      if (streak >= 7) {
        hintEl.textContent = '🔥 ' + streak + '-day streak unlocked. Your Ibadah card is premium.';
        hintEl.className = 'v2-unlock-hint has-hint';
      } else if (streak > 0) {
        hintEl.textContent = streak + ' day streak. Reach 7 days to unlock the premium Ibadah card style.';
        hintEl.className = 'v2-unlock-hint';
      } else {
        hintEl.textContent = 'Start tracking your salah to unlock the Ibadah Flex card.';
        hintEl.className = 'v2-unlock-hint';
      }
    }

  }

  /* Render captions for active mode */
  renderV2Captions('reality');

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

/* ── Render caption buttons for a given mode ── */
function renderV2Captions(mode) {
  var container = el('v2-caption-btns');
  if (!container) return;
  var captions = SHARE_CAPTIONS[mode] || [];
  container.innerHTML = captions.map(function(c, i) {
    var captionText = c.template ? c.template.replace('{streak}', getStreakCount()) : c.text;
    return '<button class="v2-caption-btn" data-idx="' + i + '" data-mode="' + mode + '">' +
      '<span class="v2-caption-text">' + captionText.replace(/\n/g, '<br>') + '</span>' +
      '<span class="v2-caption-copy">Copy ' + c.label + '</span>' +
    '</button>';
  }).join('');

  container.querySelectorAll('.v2-caption-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var idx  = parseInt(btn.getAttribute('data-idx'));
      var mode2 = btn.getAttribute('data-mode');
      var caption = SHARE_CAPTIONS[mode2][idx] || {};
      var text = caption.template ? caption.template.replace('{streak}', getStreakCount()) : caption.text || '';
      /* Append link */
      var url = 'https://mianhassam96.github.io/WaqtX/';
      if (_birth) {
        url += '?dob=' + _birth.toISOString().split('T')[0];
        if (_name) url += '&name=' + encodeURIComponent(_name);
      }
      var full = text + '\n\n' + url;
      copyText(full, btn.querySelector('.v2-caption-copy'), 'Copied!', btn.querySelector('.v2-caption-copy').textContent);
      btn.classList.add('copied');
      setTimeout(function() { btn.classList.remove('copied'); }, 2500);
    });
  });
}

/* ── Utility: copy text ── */
function copyText(text, el2, successMsg, originalMsg) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(function() {
      if (el2) { el2.textContent = successMsg; setTimeout(function() { el2.textContent = originalMsg; }, 2500); }
    }).catch(function() {});
  } else {
    var ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); if (el2) { el2.textContent = successMsg; setTimeout(function() { el2.textContent = originalMsg; }, 2500); } } catch(e) {}
    document.body.removeChild(ta);
  }
}

/* ── Wire modal tabs ── */
(function() {
  var modal = el('share-modal');
  if (!modal) return;

  /* Tab switching */
  modal.querySelectorAll('.v2-tab').forEach(function(tab) {
    tab.addEventListener('click', function() {
      var mode = tab.getAttribute('data-mode');
      /* Update tabs */
      modal.querySelectorAll('.v2-tab').forEach(function(t) {
        t.classList.toggle('active', t === tab);
        t.setAttribute('aria-selected', t === tab ? 'true' : 'false');
      });
      /* Show correct card */
      modal.querySelectorAll('.v2-card').forEach(function(c) { c.classList.add('hidden'); });
      var activeCard = el('v2-card-' + mode);
      if (activeCard) activeCard.classList.remove('hidden');
      /* Update captions */
      renderV2Captions(mode);
    });
  });

  /* Close */
  var closeBtn = el('share-close');
  if (closeBtn) closeBtn.addEventListener('click', function() {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  });
  modal.addEventListener('click', function(e) {
    if (e.target === modal) { modal.classList.add('hidden'); document.body.style.overflow = ''; }
  });

  /* Download — renders the currently visible card */
  var dlBtn = el('v2-btn-dl');
  if (dlBtn) dlBtn.addEventListener('click', function() {
    if (typeof html2canvas === 'undefined') { alert('Please take a screenshot to save your card.'); return; }
    /* Find active card */
    var activeCard = modal.querySelector('.v2-card:not(.hidden)');
    if (!activeCard) return;
    var origText = dlBtn.textContent;
    dlBtn.textContent = 'Generating…';
    dlBtn.disabled = true;
    /* Temporarily expand card for clean render */
    var origOverflow = activeCard.style.overflow;
    activeCard.style.overflow = 'visible';
    html2canvas(activeCard, { backgroundColor: null, scale: 3, useCORS: true, logging: false }).then(function(canvas) {
      activeCard.style.overflow = origOverflow;
      var a = document.createElement('a');
      a.download = 'waqtx-' + (activeCard.id || 'card') + '.png';
      a.href = canvas.toDataURL('image/png');
      a.click();
      dlBtn.textContent = '✓ Downloaded!';
      setTimeout(function() { dlBtn.textContent = origText; dlBtn.disabled = false; }, 2000);
    }).catch(function() {
      activeCard.style.overflow = origOverflow;
      dlBtn.textContent = origText; dlBtn.disabled = false;
    });
  });

  /* Copy link */
  var linkBtn = el('v2-btn-link');
  if (linkBtn) linkBtn.addEventListener('click', function() {
    var url = 'https://mianhassam96.github.io/WaqtX/';
    if (_birth) {
      url += '?dob=' + _birth.toISOString().split('T')[0];
      if (_name) url += '&name=' + encodeURIComponent(_name);
    }
    copyText(url, linkBtn, '✓ Copied!', '🔗 Copy Link');
  });
})();

/* Share nav button */
el('btn-share-nav').addEventListener('click', function () {
  if (!_birth) { el('hero-dob').focus(); return; }
  openShareModalV2();
});

/* Download image button (in results section) */
el('btn-download').addEventListener('click', function () {
  if (!_birth) return;
  openShareModalV2();
});

/* Copy link button (in results section) */
el('btn-copy-link').addEventListener('click', function () {
  var btn = this;
  var url = 'https://mianhassam96.github.io/WaqtX/';
  if (_birth) {
    url += '?dob=' + _birth.toISOString().split('T')[0];
    if (_name) url += '&name=' + encodeURIComponent(_name);
  }
  copyText(url, btn, '✓ Copied!', '🔗 Copy Link');
});

/* Hamburger */
el('hamburger').addEventListener('click', function () {
  const links = el('nav-links');
  if (links) links.classList.toggle('open');
});

document.querySelectorAll('.nav-link').forEach(function (link) {
  link.addEventListener('click', function () {
    const links = el('nav-links');
    if (links) links.classList.remove('open');
  });
});

/* Navbar scroll effect */
window.addEventListener('scroll', function () {
  const nav = el('navbar');
  if (nav) {
    if (window.scrollY > 20) {
      nav.style.borderBottomColor = 'rgba(201,168,76,0.2)';
    } else {
      nav.style.borderBottomColor = 'rgba(201,168,76,0.12)';
    }
  }
  updateScrollNavState();
});

function updateScrollNavState() {
  const sectionIds = ['hero', 'todays-story-section', 'profile-section', 'insight-section', 'reflect-gen-section'];
  const offset = window.innerHeight * 0.35;
  let activeId = 'hero';
  sectionIds.forEach(function(id) {
    const section = document.getElementById(id);
    if (!section) return;
    const top = section.getBoundingClientRect().top;
    if (top <= offset) activeId = id;
  });

  document.querySelectorAll('.nav-link').forEach(function(link) {
    const href = link.getAttribute('href');
    link.classList.toggle('active', href === '#' + activeId);
  });
  document.querySelectorAll('.bottom-nav-item').forEach(function(link) {
    const href = link.getAttribute('href');
    link.classList.toggle('active', href === '#' + activeId);
  });
}
updateScrollNavState();

/* Story Share Modal */
(function() {
  const btn = el('btn-story-share');
  if (btn) btn.addEventListener('click', openStoryModal);
  const closeBtn = el('story-modal-close');
  if (closeBtn) closeBtn.addEventListener('click', function() {
    el('story-modal').classList.add('hidden');
    document.body.style.overflow = '';
  });
  const storyModal = el('story-modal');
  if (storyModal) storyModal.addEventListener('click', function(e) {
    if (e.target === this) { this.classList.add('hidden'); document.body.style.overflow = ''; }
  });
  const dlBtn = el('btn-story-dl');
  if (dlBtn) dlBtn.addEventListener('click', function() {
    const card = el('story-card-dl');
    if (typeof html2canvas === 'undefined') { alert('Please screenshot to save.'); return; }
    const dlBtnRef = this; dlBtnRef.textContent = 'Generating\u2026'; dlBtnRef.disabled = true;
    html2canvas(card, { backgroundColor: '#061008', scale: 2 }).then(function(canvas) {
      const a = document.createElement('a');
      a.download = 'waqtx-story.png';
      a.href = canvas.toDataURL('image/png');
      a.click();
      dlBtnRef.textContent = 'Downloaded!';
      setTimeout(function() { dlBtnRef.textContent = '\u2B07 Download Story Card'; dlBtnRef.disabled = false; }, 2000);
    }).catch(function() { dlBtnRef.textContent = '\u2B07 Download Story Card'; dlBtnRef.disabled = false; });
  });
})();

/* PWA Install */
let _deferredInstall = null;
window.addEventListener('beforeinstallprompt', function (e) {
  e.preventDefault();
  _deferredInstall = e;
  setTimeout(function () {
    const p = el('pwa-prompt');
    if (p) p.classList.remove('hidden');
  }, 10000);
});

const pwaInstall = el('pwa-install');
const pwaDismiss = el('pwa-dismiss');
const btnInstallApp = el('btn-install-app');
function triggerPwaInstall() {
  if (!_deferredInstall) return;
  _deferredInstall.prompt();
  _deferredInstall.userChoice.then(function () {
    _deferredInstall = null;
    const p = el('pwa-prompt');
    if (p) p.classList.add('hidden');
  });
}
if (pwaInstall) pwaInstall.addEventListener('click', triggerPwaInstall);
if (btnInstallApp) btnInstallApp.addEventListener('click', triggerPwaInstall);
if (pwaDismiss) pwaDismiss.addEventListener('click', function () {
  const p = el('pwa-prompt');
  if (p) p.classList.add('hidden');
  try { localStorage.setItem('pwa_dismissed', Date.now()); } catch(e) {}
});

/* Restore last DOB + name */
(function () {
  try {
    /* Check URL params first — shareable link takes priority */
    const params = new URLSearchParams(window.location.search);
    const urlDob  = params.get('dob');
    const urlName = params.get('name');

    if (urlDob) {
      const inp = el('hero-dob'); if (inp) inp.value = urlDob;
      if (urlName) {
        const nameInp = el('hero-name'); if (nameInp) nameInp.value = decodeURIComponent(urlName);
        _name = decodeURIComponent(urlName);
      }
      /* Auto-calculate when arriving via shared link */
      const birth = parseDOB(urlDob);
      if (birth && birth <= new Date() && birth.getFullYear() >= 1900) {
        showLoading(function () { renderAll(birth); });
      }
    } else {
      /* Restore from localStorage */
      const saved = localStorage.getItem('waqtx_dob');
      if (saved) {
        const inp = el('hero-dob'); if (inp) inp.value = saved;
        /* Update hero preview stats from saved DOB */
        try { updateHeroPreview(parseDOB(saved)); } catch(e2) {}
      }
      const savedName = localStorage.getItem('waqtx_name');
      if (savedName) { const nameInp = el('hero-name'); if (nameInp) nameInp.value = savedName; }
    }
  } catch(e) {}
})();

/* Init tracker on page load — works without DOB */
initTracker();
/* Render daily insight on page load */
renderInsight(0);

/* ── Scroll-reveal animation ── */
(function() {
  const targets = document.querySelectorAll(
    '#results-section .glance-card, #results-section .islamic-card, ' +
    '#results-section .world-card, #results-section .journey-card, ' +
    '#results-section .reflection-card, #results-section .milestones-card, ' +
    '#results-section .share-card, #results-section .story-card, ' +
    '#results-section .truth-card'
  );
  targets.forEach(function(t) { t.classList.add('reveal'); });

  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });
    targets.forEach(function(t) { obs.observe(t); });
  } else {
    targets.forEach(function(t) { t.classList.add('visible'); });
  }
})();


/* ── Celebration Toast ── */
function showCelebration() {
  const cel = el('celebration');
  if (!cel) return;
  setText('cel-streak', getStreakCount());
  cel.classList.remove('hidden');
  cel.classList.add('cel-show');
  setTimeout(function() {
    cel.classList.remove('cel-show');
    setTimeout(function() { cel.classList.add('hidden'); }, 400);
  }, 3500);
}

/* ══════════════════════════════════════════════
   FEATURE 1 — LIFE STORY (Narrative)
   ══════════════════════════════════════════════ */
function renderLifeStory(birth, ageYears, hijriBirth, hijriNow, ramadans, t) {
  const container = el('story-body');
  if (!container) return;

  const b = getBreakdown(birth);
  const birthYear = birth.getFullYear();
  const birthMonth = birth.toLocaleDateString('en-US', { month: 'long' });
  const birthDay = birth.toLocaleDateString('en-US', { weekday: 'long' });
  const fajrOpportunities = Math.floor(t.day);
  const fridaysPassed = Math.floor(t.day / 7);
  const sleepYears = (ageYears * 0.333).toFixed(1);

  const greeting = _name ? _name + ', you were born' : 'You were born';
  const lines = [
    greeting + ' on a <strong>' + birthDay + '</strong> in <em>' + birthMonth + ' ' + birthYear + '</em> — a day chosen by Allah, not by chance.',
    'In the Islamic calendar, that was the year <strong>' + hijriBirth.year + ' AH</strong>, in the month of <em>' + (HIJRI_MONTHS[(hijriBirth.month - 1) || 0]) + '</em>.',
    'Since that day, you have counted <strong>' + fmt(t.day) + ' days</strong> — each one a gift, each one a test.',
    'You have witnessed <strong>' + ramadans + ' Ramadans</strong> — ' + ramadans + ' months of mercy, forgiveness, and renewal.',
    'The Fajr prayer was called <strong>' + fmt(fajrOpportunities) + ' times</strong> since you were born. Each one was a chance to stand before Allah.',
    'You have seen <strong>' + fmt(fridaysPassed) + ' Fridays</strong> — the best day of the week, repeated ' + fmt(fridaysPassed) + ' times in your life.',
    'You have slept for approximately <strong>' + sleepYears + ' years</strong> — your body resting while your soul continued its journey.',
    'The world has changed around you — from <em>' + (birthYear < 2000 ? 'the pre-internet era' : 'the digital age') + '</em> to today. You experienced all of it.',
    'You are now <strong>' + b.yy + ' years, ' + b.mo + ' months, and ' + b.dd + ' days</strong> old. Your story is still unfolding.',
    'From <strong>' + hijriBirth.year + ' AH</strong> to <strong>' + hijriNow.year + ' AH</strong> — that is your Islamic journey. ' + (hijriNow.year - hijriBirth.year) + ' Islamic years of life.'
  ];

  container.innerHTML = lines.map(function(line) {
    return '<div class="story-line">' + line + '</div>';
  }).join('');
}

/* ══════════════════════════════════════════════
   FEATURE 2 — TIME TRUTH
   ══════════════════════════════════════════════ */
function renderTimeTruth(ageYears, t) {
  const introEl   = el('truth-intro');
  const gridEl    = el('truth-grid');
  const verdictEl = el('truth-verdict');
  if (!gridEl) return;

  const sleepYears   = +(ageYears * 0.333).toFixed(1);
  const screenYears  = +(ageYears * 0.17).toFixed(1);
  const workYears    = +(ageYears * 0.13).toFixed(1);
  const eatYears     = +(ageYears * 0.04).toFixed(1);
  const commYears    = +(ageYears * 0.05).toFixed(1);
  let meaningYears   = +(ageYears - sleepYears - screenYears - workYears - eatYears - commYears).toFixed(1);
  if (meaningYears < 0) meaningYears = 0;

  const meaningPct = Math.round((meaningYears / ageYears) * 100);

  if (introEl) {
    introEl.innerHTML = 'You have spent <strong>' + ageYears.toFixed(1) + ' years</strong>. Here is where that time actually went — based on global averages.';
  }

  const cards = [
    { icon: '😴', label: 'Sleeping',       value: sleepYears,   unit: 'Years', sub: '~8 hrs/day — your body needed rest.', cls: '' },
    { icon: '📱', label: 'Screen Time',    value: screenYears,  unit: 'Years', sub: '~4 hrs/day on phones, TV, social media.', cls: 'truth-bad' },
    { icon: '💼', label: 'Work / Study',   value: workYears,    unit: 'Years', sub: 'Building your dunya, day by day.', cls: '' },
    { icon: '🍽️', label: 'Eating',         value: eatYears,     unit: 'Years', sub: '~1 hr/day — nourishing the body.', cls: '' },
    { icon: '🚗', label: 'Commuting',      value: commYears,    unit: 'Years', sub: '~1.2 hrs/day in transit.', cls: '' },
    { icon: '✨', label: 'Meaningful Time', value: meaningYears, unit: 'Years', sub: 'Growth, ibadah, family, purpose.', cls: 'truth-good' }
  ];

  gridEl.innerHTML = cards.map(function(c) {
    return '<div class="truth-card ' + c.cls + '">' +
      '<div class="truth-card-icon">' + c.icon + '</div>' +
      '<div class="truth-card-label">' + c.label + '</div>' +
      '<div class="truth-card-value">' + c.value + '</div>' +
      '<div class="truth-card-unit">' + c.unit + '</div>' +
      '<div class="truth-card-sub">' + c.sub + '</div>' +
    '</div>';
  }).join('');

  if (verdictEl) {
    const msg = meaningPct < 10
      ? 'Based on these averages, a relatively small portion — around <strong>' + meaningPct + '%</strong> — may have gone toward intentional growth. That is not a judgment. It is simply a starting point. The rest of your life can look different.'
      : meaningPct < 20
      ? 'Around <strong>' + meaningPct + '%</strong> of your time has likely gone toward meaningful activities. There is still a great deal of room to grow — and every day is a fresh opportunity to shift that balance.'
      : 'Roughly <strong>' + meaningPct + '%</strong> of your time appears to have been spent meaningfully. You are building something. Keep going — consistency compounds over time.';

    verdictEl.innerHTML = '<div class="truth-verdict-headline">A Gentle Reality Check</div>' +
      '<div class="truth-verdict-text">' + msg + '<br><br>The Prophet \uFDFA said: <em>"Take advantage of five before five: your youth before your old age, your health before your sickness, your wealth before your poverty, your free time before your busyness, and your life before your death."</em></div>';
  }
}

/* ══════════════════════════════════════════════
   FEATURE 3 — SALAH & IBADAH TRACKER
   ══════════════════════════════════════════════ */
const TRACKER_KEY = 'waqtx_tracker';
const STREAK_KEY  = 'waqtx_streak';

function getTodayKey() {
  return new Date().toISOString().split('T')[0];
}

function loadTrackerData() {
  try {
    const raw = localStorage.getItem(TRACKER_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch(e) { return {}; }
}

function saveTrackerData(data) {
  try { localStorage.setItem(TRACKER_KEY, JSON.stringify(data)); } catch(e) {}
}

function getStreakCount() {
  try {
    const data = loadTrackerData();
    const today = getTodayKey();
    let streak = 0;
    const d = new Date();
    for (let i = 0; i < 365; i++) {
      const key = d.toISOString().split('T')[0];
      const dayData = data[key];
      if (!dayData) break;
      const salahDone = (dayData.salah || []).length;
      if (salahDone >= 5) { streak++; d.setDate(d.getDate() - 1); }
      else if (key === today) { d.setDate(d.getDate() - 1); }
      else break;
    }
    return streak;
  } catch(e) { return 0; }
}

function updateSalahUI() {
  const data = loadTrackerData();
  const today = getTodayKey();
  const todayData = data[today] || { salah: [], dhikr: [] };
  const salahDone = todayData.salah || [];
  const dhikrDone = todayData.dhikr || [];

  document.querySelectorAll('.salah-item').forEach(function(item) {
    const name = item.querySelector('input').getAttribute('data-salah');
    item.classList.toggle('checked', salahDone.indexOf(name) > -1);
  });

  document.querySelectorAll('.dhikr-item').forEach(function(item) {
    const name = item.querySelector('input').getAttribute('data-dhikr');
    item.classList.toggle('checked', dhikrDone.indexOf(name) > -1);
  });

  const pct = (salahDone.length / 5) * 100;
  const barFill = el('salah-bar-fill');
  if (barFill) barFill.style.width = pct + '%';
  setText('salah-done', salahDone.length);
  setText('salah-streak', getStreakCount());

  const wasFull = barFill && barFill.getAttribute('data-was-full') === '1';
  if (salahDone.length === 5 && !wasFull) {
    if (barFill) barFill.setAttribute('data-was-full', '1');
    showCelebration();
  } else if (salahDone.length < 5) {
    if (barFill) barFill.setAttribute('data-was-full', '0');
  }

  setText('dhikr-done', dhikrDone.length);

  const msgs = [
    'Start your day with remembrance.',
    'One step closer to Allah. Keep going.',
    'Halfway there. Your heart is being polished.',
    'Almost complete. SubhanAllah.',
    'Four done. One more — finish strong.',
    'All completed. \u0627\u0644\u062D\u0645\u062F \u0644\u0644\u0647 — Alhamdulillah!'
  ];
  const dhikrMsg = el('dhikr-msg');
  if (dhikrMsg) dhikrMsg.textContent = msgs[Math.min(dhikrDone.length, 5)];

  renderWeekGrid(data);
}

function renderWeekGrid(data) {
  const weekGrid = el('week-grid');
  const weekSummary = el('week-summary');
  if (!weekGrid) return;

  const dayLabels = ['Su','Mo','Tu','We','Th','Fr','Sa'];
  const today = new Date();
  const todayKey = getTodayKey();
  let totalFull = 0;
  let html = '';

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().split('T')[0];
    const dayData = data[key] || { salah: [] };
    const count = (dayData.salah || []).length;
    const isToday = (key === todayKey);
    const cls = count >= 5 ? 'full' : count > 0 ? 'partial' : isToday ? 'today' : '';
    if (count >= 5) totalFull++;
    html += '<div class="week-day">' +
      '<div class="week-day-label">' + dayLabels[d.getDay()] + '</div>' +
      '<div class="week-day-dot ' + cls + '">' + (count > 0 ? count : (isToday ? '\u00B7' : '')) + '</div>' +
    '</div>';
  }
  weekGrid.innerHTML = html;

  if (weekSummary) {
    weekSummary.innerHTML = '<strong>' + totalFull + '/7</strong> days with all 5 prayers this week.' +
      (totalFull === 7 ? ' \uD83C\uDF1F Perfect week!' : totalFull >= 5 ? ' Keep it up!' : ' Every prayer counts.');
  }
}

function initTracker() {
  // Salah click handlers
  document.querySelectorAll('.salah-item').forEach(function(item) {
    item.addEventListener('click', function() {
      const name = item.querySelector('input').getAttribute('data-salah');
      const data = loadTrackerData();
      const today = getTodayKey();
      if (!data[today]) data[today] = { salah: [], dhikr: [] };
      const idx = data[today].salah.indexOf(name);
      if (idx > -1) data[today].salah.splice(idx, 1);
      else data[today].salah.push(name);
      saveTrackerData(data);
      updateSalahUI();
    });
  });

  document.querySelectorAll('.dhikr-item').forEach(function(item) {
    item.addEventListener('click', function() {
      const name = item.querySelector('input').getAttribute('data-dhikr');
      const data = loadTrackerData();
      const today = getTodayKey();
      if (!data[today]) data[today] = { salah: [], dhikr: [] };
      const idx = data[today].dhikr.indexOf(name);
      if (idx > -1) data[today].dhikr.splice(idx, 1);
      else data[today].dhikr.push(name);
      saveTrackerData(data);
      updateSalahUI();
    });
  });

  const resetBtn = el('btn-reset-tracker');
  if (resetBtn) {
    resetBtn.addEventListener('click', function() {
      const data = loadTrackerData();
      const today = getTodayKey();
      data[today] = { salah: [], dhikr: [] };
      saveTrackerData(data);
      updateSalahUI();
    });
  }

  updateSalahUI();
}

/* ══════════════════════════════════════════════
   FEATURE 4 — DAILY INSIGHT
   ══════════════════════════════════════════════ */
const DAILY_INSIGHTS = [
  {
    icon: '⏳', headline: 'Every second is a step closer.',
    body: 'Right now, as you read this, your life is moving forward. Not backward. Not paused. Forward. The question is not how much time you have — it is what you are doing with the time that is passing right now.',
    ayah: '"And He is with you wherever you are." — (Quran 57:4)',
    focus: 'Today\'s Focus: Presence', action: 'Before each task today, pause for 3 seconds and set an intention. Just 3 seconds.'
  },
  {
    icon: '🌙', headline: 'Fajr changes everything.',
    body: 'The person who wakes for Fajr starts their day with Allah. That one act — 10 minutes before sunrise — sets the tone for the entire day. It is not just a prayer. It is a declaration: "My day belongs to You."',
    ayah: '"Establish prayer at the decline of the sun until the darkness of the night and the Quran of dawn." — (Quran 17:78)',
    focus: 'Today\'s Focus: Fajr', action: 'Set your alarm 15 minutes earlier tomorrow. Sit in silence after Fajr — even for 2 minutes.'
  },
  {
    icon: '📖', headline: 'One page a day. One life changed.',
    body: 'If you read just one page of the Quran every day, you will complete it in about 3 years. But the real change is not finishing — it is the daily habit of sitting with the words of Allah.',
    ayah: '"Indeed, this Quran guides to that which is most suitable." — (Quran 17:9)',
    focus: 'Today\'s Focus: Quran', action: 'Open the Quran right now. Read just one page — slowly, with meaning. That is enough.'
  },
  {
    icon: '🤲', headline: 'Istighfar opens closed doors.',
    body: 'The Prophet \uFDFA made istighfar more than 70 times a day — and he was already forgiven. Saying "Astaghfirullah" is not just asking forgiveness. It is resetting your connection with Allah.',
    ayah: '"Ask forgiveness of your Lord. Indeed, He is ever a Perpetual Forgiver." — (Quran 71:10)',
    focus: 'Today\'s Focus: Istighfar', action: 'Say Astaghfirullah 100 times today — in the car, while walking, before sleep. Count on your fingers.'
  },
  {
    icon: '🌅', headline: 'This morning will never come again.',
    body: 'The morning you woke up today — this exact morning — will never exist again. Every sunrise is unique. Every day is a new page. What will you write on today\'s page before it closes tonight?',
    ayah: '"By the dawn. And by the ten nights." — (Quran 89:1-2)',
    focus: 'Today\'s Focus: Gratitude', action: 'Write down 3 things you are grateful for right now. Not tomorrow — right now.'
  },
  {
    icon: '💭', headline: 'Your thoughts become your life.',
    body: 'What you think about most becomes what you do. What you do becomes who you are. Guard your thoughts. Fill your mind with what is good, true, and purposeful.',
    ayah: '"Allah does not change the condition of a people until they change what is in themselves." — (Quran 13:11)',
    focus: 'Today\'s Focus: Mind Guard', action: 'When a negative or wasteful thought comes today, replace it with "SubhanAllah" and redirect.'
  },
  {
    icon: '🕌', headline: 'The masjid is waiting for you.',
    body: 'There is a masjid near you right now. The call to prayer has gone out five times today. Each time was an invitation — personal, direct, from Allah to you.',
    ayah: '"In houses which Allah has ordered to be raised and that His name be mentioned therein." — (Quran 24:36)',
    focus: 'Today\'s Focus: Congregation', action: 'Pray at least one prayer in the masjid today. If not possible, pray on time at home with full focus.'
  },
  {
    icon: '❤️', headline: 'Your parents\' du\'a is your shield.',
    body: 'The du\'a of a parent for their child is never rejected. If your parents are alive, their happiness with you is a door to Jannah. If they have passed, your du\'a for them reaches them.',
    ayah: '"Your Lord has decreed that you worship none but Him, and that you be kind to parents." — (Quran 17:23)',
    focus: 'Today\'s Focus: Parents', action: 'Call or message a parent today. If they have passed, make du\'a for them right now.'
  },
  {
    icon: '🎯', headline: 'Small consistent beats big occasional.',
    body: 'The Prophet \uFDFA said the most beloved deeds to Allah are those done consistently, even if small. You do not need to pray all night. You need to pray every night.',
    ayah: '"The most beloved of deeds to Allah are those that are most consistent, even if they are small." — (Hadith, Bukhari)',
    focus: 'Today\'s Focus: One Habit', action: 'Pick one small act of worship. Do it today. Then do it again tomorrow. That is how habits form.'
  },
  {
    icon: '🌍', headline: 'You are part of something bigger.',
    body: 'Right now, over 1.8 billion Muslims around the world are praying, fasting, making du\'a, and striving. You are not alone in this journey.',
    ayah: '"And hold firmly to the rope of Allah all together and do not become divided." — (Quran 3:103)',
    focus: 'Today\'s Focus: Ummah', action: 'Make du\'a for the Muslim Ummah today — for those suffering, for those striving, for all of us.'
  },
  {
    icon: '⚖️', headline: 'Every deed will be weighed.',
    body: 'On the Day of Judgment, every deed will be weighed. Not just the big ones — every word, every glance, every moment of patience, every act of kindness. Nothing is too small to count.',
    ayah: '"So whoever does an atom\'s weight of good will see it." — (Quran 99:7)',
    focus: 'Today\'s Focus: Intention', action: 'Before your next action, say "Bismillah" and set a clear intention. Turn the ordinary into worship.'
  },
  {
    icon: '🔑', headline: 'Gratitude is the key that opens more.',
    body: 'You woke up today. Your heart is beating. You can read these words. You have been given another chance. Gratitude is not just a feeling — it is a practice.',
    ayah: '"If you are grateful, I will surely increase you in favor." — (Quran 14:7)',
    focus: 'Today\'s Focus: Alhamdulillah', action: 'Say Alhamdulillah 33 times right now — slowly, meaning each one. Feel the weight of what you have.'
  },
  {
    icon: '🌿', headline: 'Sadaqah protects you.',
    body: 'Give something today — even a smile, a kind word, a small amount of money. The Prophet \uFDFA said sadaqah extinguishes sins like water extinguishes fire.',
    ayah: '"The example of those who spend their wealth in the way of Allah is like a seed which grows seven spikes." — (Quran 2:261)',
    focus: 'Today\'s Focus: Give', action: 'Give something today — money, time, a kind word, or a smile. Even the smallest sadaqah counts.'
  },
  {
    icon: '🕐', headline: 'Time is the only thing you cannot get back.',
    body: 'Money lost can be earned again. Health lost can sometimes be restored. But time lost is gone forever. Be intentional today.',
    ayah: '"By time, indeed, mankind is in loss." — (Quran 103:1-2)',
    focus: 'Today\'s Focus: Time Audit', action: 'At the end of today, ask yourself: "Did I use this day well?" That question alone changes behavior.'
  }
];

let _insightIndex = 0;
let _insightDaysLived = 0;

function renderInsight(daysLived) {
  const container = el('insight-card');
  if (!container) return;
  if (daysLived) _insightDaysLived = daysLived;
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  _insightIndex = dayOfYear % DAILY_INSIGHTS.length;
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  renderInsightCard(container, _insightIndex, dateStr, _insightDaysLived);
}

function renderInsightCard(container, idx, dateStr, daysLived) {
  const insight = DAILY_INSIGHTS[idx];
  /* Only show day count if DOB has been entered */
  const dayLabel = (daysLived && daysLived > 0)
    ? ' &nbsp;\u00b7&nbsp; Day ' + fmt(daysLived) + ' of your journey'
    : '';
  container.innerHTML =
    '<div class="insight-date">' + dateStr + dayLabel + '</div>' +
    '<span class="insight-icon">' + insight.icon + '</span>' +
    '<div class="insight-headline">' + insight.headline + '</div>' +
    '<div class="insight-body">' + insight.body + '</div>' +
    '<div class="insight-ayah">' + insight.ayah + '</div>' +
    '<div class="insight-action-box">' +
      '<div class="insight-focus">' + insight.focus + '</div>' +
      '<div class="insight-action">' + insight.action + '</div>' +
    '</div>' +
    '<div class="insight-nav">' +
      '<button class="insight-nav-btn" id="insight-prev">\u2190 Previous</button>' +
      '<button class="insight-nav-btn" id="insight-next">Next \u2192</button>' +
    '</div>';

  /* Re-attach listeners every render */
  const prevBtn = el('insight-prev');
  const nextBtn = el('insight-next');
  if (prevBtn) prevBtn.addEventListener('click', function() {
    _insightIndex = (_insightIndex - 1 + DAILY_INSIGHTS.length) % DAILY_INSIGHTS.length;
    renderInsightCard(container, _insightIndex, dateStr, _insightDaysLived);
  });
  if (nextBtn) nextBtn.addEventListener('click', function() {
    _insightIndex = (_insightIndex + 1) % DAILY_INSIGHTS.length;
    renderInsightCard(container, _insightIndex, dateStr, _insightDaysLived);
  });
}

/* ══════════════════════════════════════════════
   LAYER 2 — DAILY WAKE-UP SYSTEM
   Ayah/Hadith + Meaning + Reality Check + Action
   ══════════════════════════════════════════════ */
var WAKEUP_MESSAGES = [
  {
    badge: '📖 Ayah of the Day',
    arabic: 'إِنَّ الصَّلَاةَ تَنْهَىٰ عَنِ الْفَحْشَاءِ وَالْمُنكَرِ',
    source: 'Surah Al-\'Ankabut 29:45',
    meaning: 'Prayer is not just worship — it is protection. Every Salah is a shield between you and what destroys you.',
    realityCheck: 'If your prayer is not changing your behavior outside the prayer mat, ask yourself: am I praying with my body only, or with my heart too?',
    action: 'Do not delay a single Salah today. Pray it on time, with full presence. Just today.'
  },
  {
    badge: '🕌 Hadith of the Day',
    arabic: 'اسْتَغِلَّ خَمْسًا قَبْلَ خَمْسٍ',
    source: 'Al-Bayhaqi — Sahih chain',
    meaning: 'Take advantage of five before five: your youth before old age, your health before sickness, your wealth before poverty, your free time before busyness, and your life before death.',
    realityCheck: 'You are reading this right now — which means you still have time. But time is the only thing you cannot earn back. Every hour you waste is gone permanently.',
    action: 'Write down one thing you have been delaying. Do the first step of it today — not tomorrow.'
  },
  {
    badge: '📖 Ayah of the Day',
    arabic: 'وَمَا الْحَيَاةُ الدُّنْيَا إِلَّا مَتَاعُ الْغُرُورِ',
    source: 'Surah Ali \'Imran 3:185',
    meaning: 'The life of this world is nothing but the enjoyment of delusion. What you are chasing is temporary. What you build for the akhirah is permanent.',
    realityCheck: 'How much of your day is spent building your dunya vs. your akhirah? Be honest. The answer is uncomfortable for most of us.',
    action: 'Spend 10 minutes today doing something purely for your akhirah — Quran, du\'a, helping someone, or making istighfar.'
  },
  {
    badge: '🕌 Hadith of the Day',
    arabic: 'أَحَبُّ الأَعْمَالِ إِلَى اللَّهِ أَدْوَمُهَا وَإِنْ قَلَّ',
    source: 'Sahih Al-Bukhari 6464',
    meaning: 'The most beloved deeds to Allah are those done consistently, even if they are small. Allah does not want perfection — He wants consistency.',
    realityCheck: 'You don\'t need to pray all night. You need to pray every night. You don\'t need to read 10 pages. You need to read one page — every day.',
    action: 'Pick one small act of worship. Do it today. Then do it again tomorrow. That is how transformation happens.'
  },
  {
    badge: '📖 Ayah of the Day',
    arabic: 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ',
    source: 'Surah Ar-Ra\'d 13:28',
    meaning: 'Verily, in the remembrance of Allah do hearts find rest. The anxiety, the emptiness, the restlessness — it has one cure.',
    realityCheck: 'You have tried everything else. Scrolling. Distracting. Achieving. But the heart only settles when it returns to its Creator.',
    action: 'Say SubhanAllah 33 times, Alhamdulillah 33 times, Allahu Akbar 34 times — right now, before you do anything else.'
  },
  {
    badge: '🕌 Hadith of the Day',
    arabic: 'الْكَيِّسُ مَنْ دَانَ نَفْسَهُ وَعَمِلَ لِمَا بَعْدَ الْمَوْتِ',
    source: 'Sunan At-Tirmidhi 2459',
    meaning: 'The wise person is one who holds himself accountable and works for what comes after death. Wisdom is not intelligence — it is awareness of what truly matters.',
    realityCheck: 'When did you last sit alone and ask: "Am I the person I want to meet Allah as?" That question is not meant to create fear — it is meant to create direction.',
    action: 'Spend 5 minutes tonight before sleep doing muhasabah — reviewing your day. What was good? What needs to change?'
  },
  {
    badge: '📖 Ayah of the Day',
    arabic: 'فَمَن يَعْمَلْ مِثْقَالَ ذَرَّةٍ خَيْرًا يَرَهُ',
    source: 'Surah Az-Zalzalah 99:7',
    meaning: 'Whoever does an atom\'s weight of good will see it. Nothing is too small. No act of kindness is wasted. No moment of patience goes unrecorded.',
    realityCheck: 'We often wait for the "big moment" to do good. But the akhirah is built from atoms — small consistent acts that we think don\'t matter.',
    action: 'Do one small act of kindness today that no one will see or know about. That is the purest form of sincerity.'
  },
  {
    badge: '🕌 Hadith of the Day',
    arabic: 'تَبَسُّمُكَ فِي وَجْهِ أَخِيكَ صَدَقَةٌ',
    source: 'Sunan At-Tirmidhi 1956',
    meaning: 'Your smile in the face of your brother is charity. Sadaqah is not only money. It is presence, warmth, and making someone feel seen.',
    realityCheck: 'When did you last make someone feel genuinely valued? Not with a gift — but with your full attention and a sincere smile?',
    action: 'Today, give someone your full attention. Put your phone down. Look them in the eyes. Listen. That is sadaqah.'
  },
  {
    badge: '📖 Ayah of the Day',
    arabic: 'وَلَا تَقُولَنَّ لِشَيْءٍ إِنِّي فَاعِلٌ ذَٰلِكَ غَدًا',
    source: 'Surah Al-Kahf 18:23',
    meaning: 'Do not say about anything: I will do that tomorrow. Tomorrow is not guaranteed. The only moment you own is now.',
    realityCheck: 'How many times have you said "I\'ll start after Ramadan", "I\'ll pray more when I\'m older"? That day may never come.',
    action: 'Identify one thing you have been postponing for your deen. Start it today — even if it is just 5 minutes.'
  },
  {
    badge: '🕌 Hadith of the Day',
    arabic: 'مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا سَهَّلَ اللَّهُ لَهُ طَرِيقًا إِلَى الْجَنَّةِ',
    source: 'Sahih Muslim 2699',
    meaning: 'Whoever takes a path in search of knowledge, Allah will ease for him a path to Paradise. Knowledge is the light that guides every decision.',
    realityCheck: 'You spend hours consuming content every day. How much of it brings you closer to Allah? How much of it is just noise?',
    action: 'Listen to or read one Islamic reminder today — a short lecture, a tafsir, or even one page of a book. Feed your soul.'
  },
  {
    badge: '📖 Ayah of the Day',
    arabic: 'وَبَشِّرِ الصَّابِرِينَ',
    source: 'Surah Al-Baqarah 2:155',
    meaning: 'And give good tidings to the patient. Whatever you are going through — the difficulty, the waiting, the uncertainty — Allah has already promised the patient a reward.',
    realityCheck: 'Sabr is not passive. It is active trust in Allah while continuing to move forward. It is not giving up — it is giving it to Allah.',
    action: 'Whatever is weighing on you today — say "Alhamdulillah \'ala kulli hal" three times and mean it.'
  },
  {
    badge: '🕌 Hadith of the Day',
    arabic: 'إِنَّ اللَّهَ يُحِبُّ إِذَا عَمِلَ أَحَدُكُمْ عَمَلًا أَنْ يُتْقِنَهُ',
    source: 'Al-Tabarani — Sahih chain',
    meaning: 'Allah loves that when one of you does a deed, he does it with excellence. Itqan — doing things properly — is itself an act of worship.',
    realityCheck: 'Are you doing your work, your worship, your relationships with excellence? Or are you just going through the motions?',
    action: 'Choose one thing you do today and do it with full excellence — your Salah, your work, a conversation. Do it as if Allah is watching. Because He is.'
  },
  {
    badge: '📖 Ayah of the Day',
    arabic: 'وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا وَيَرْزُقْهُ مِنْ حَيْثُ لَا يَحْتَسِبُ',
    source: 'Surah At-Talaq 65:2-3',
    meaning: 'Whoever fears Allah — He will make for him a way out, and provide for him from where he does not expect. Taqwa is the key that opens doors you cannot see.',
    realityCheck: 'The rizq you are worried about, the problem you cannot solve — have you truly handed it to Allah? Or are you still trying to control everything yourself?',
    action: 'Make du\'a today with full conviction that Allah will answer. Not "maybe" — with certainty. That is tawakkul.'
  },
  {
    badge: '🕌 Hadith of the Day',
    arabic: 'الرَّاحِمُونَ يَرْحَمُهُمُ الرَّحْمَنُ',
    source: 'Sunan Abu Dawud 4941',
    meaning: 'The merciful will be shown mercy by the Most Merciful. The mercy you show others is the mercy that returns to you — from Allah Himself.',
    realityCheck: 'Who in your life needs your mercy right now? A parent you have been impatient with? A sibling you have not spoken to? A person you have judged?',
    action: 'Reach out to one person today with kindness — not because they deserve it, but because you want Allah\'s mercy on yourself.'
  }
];

var _wakeupIndex = 0;

function renderWakeUpSystem() {
  var container = el('wakeup-card');
  if (!container) return;
  var dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  _wakeupIndex = dayOfYear % WAKEUP_MESSAGES.length;
  renderWakeUpCard(container, _wakeupIndex);
}

function renderWakeUpCard(container, idx) {
  _wakeupIndex = idx;
  var msg = WAKEUP_MESSAGES[idx];
  var today = new Date();
  var dateStr = today.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });
  container.innerHTML =
    '<div class="wu-date">' + dateStr + '</div>' +
    '<div class="wu-badge">' + msg.badge + '</div>' +
    '<div class="wu-arabic">' + msg.arabic + '</div>' +
    '<div class="wu-source">\u2014 ' + msg.source + '</div>' +
    '<div class="wu-sections">' +
      '<div class="wu-block wu-meaning">' +
        '<div class="wu-block-label">' + (t('wu_meaning_label') !== 'wu_meaning_label' ? t('wu_meaning_label') : '💡 Meaning') + '</div>' +
        '<div class="wu-block-text">' + msg.meaning + '</div>' +
      '</div>' +
      '<div class="wu-block wu-reality">' +
        '<div class="wu-block-label">' + (t('wu_reality_label') !== 'wu_reality_label' ? t('wu_reality_label') : '💔 Reality Check') + '</div>' +
        '<div class="wu-block-text">' + msg.realityCheck + '</div>' +
      '</div>' +
      '<div class="wu-block wu-action">' +
        '<div class="wu-block-label">' + (t('wu_action_label') !== 'wu_action_label' ? t('wu_action_label') : '⚡ One Action Today') + '</div>' +
        '<div class="wu-block-text">' + msg.action + '</div>' +
      '</div>' +
    '</div>' +
    '<div class="wu-nav">' +
      '<button class="wu-nav-btn" id="wu-prev">' + (t('wu_prev') !== 'wu_prev' ? t('wu_prev') : '\u2190 Previous') + '</button>' +
      '<button class="wu-nav-btn" id="wu-next">' + (t('wu_next') !== 'wu_next' ? t('wu_next') : 'Next \u2192') + '</button>' +
    '</div>';

  /* Re-attach listeners — innerHTML wipes old ones */
  var prevBtn = el('wu-prev');
  var nextBtn = el('wu-next');
  if (prevBtn) prevBtn.addEventListener('click', function() {
    renderWakeUpCard(container, (_wakeupIndex - 1 + WAKEUP_MESSAGES.length) % WAKEUP_MESSAGES.length);
  });
  if (nextBtn) nextBtn.addEventListener('click', function() {
    renderWakeUpCard(container, (_wakeupIndex + 1) % WAKEUP_MESSAGES.length);
  });
}

renderWakeUpSystem();

/* ══════════════════════════════════════════════
   LAYER 1 — REFLECTION PROMPT ENGINE
   Injected under each stat after renderAll
   ══════════════════════════════════════════════ */
function renderReflections(t2, sleepYears, heartBillions, secondsMillion) {
  var rDays    = el('gr-days');
  var rHours   = el('gr-hours');
  var rSleep   = el('gr-sleep');
  var rHearts  = el('gr-hearts');
  var rSunsets = el('gr-sunsets');
  var rSeconds = el('gr-seconds');
  var tots = _birth ? getTotals(_birth) : null;

  if (rDays)    rDays.innerHTML    = tr('reflect_days',    { days:    tots ? fmt(tots.day) : '—' });
  if (rHours)   rHours.innerHTML   = tr('reflect_hours',   { hours:   tots ? fmt(tots.hr)  : '—' });
  if (rSleep)   rSleep.innerHTML   = tr('reflect_sleep',   { sleep:   sleepYears || '—' });
  if (rHearts)  rHearts.innerHTML  = tr('reflect_hearts',  { hearts:  heartBillions || '—' });
  if (rSunsets) rSunsets.innerHTML = tr('reflect_sunsets', { sunsets: tots ? fmt(tots.day) : '—' });
  if (rSeconds) rSeconds.innerHTML = tr('reflect_seconds', { seconds: secondsMillion || '—' });
}

/* ══════════════════════════════════════════════
   LAYER 3 — LIFE MIRROR MODE
   Shows once per day on app open
   ══════════════════════════════════════════════ */
var MIRROR_QUESTIONS = [
  'What did you do yesterday that will matter in your akhirah?',
  'If your life ended today — are you ready to meet Allah?',
  'You have time right now. But not unlimited time. What will you do with today?',
  'When did you last cry out of fear or love of Allah?',
  'Is the person you are today the person you want to be remembered as?',
  'How many of your daily habits are building your akhirah — and how many are only building your dunya?',
  'If Allah showed you a recording of your last 7 days — would you be at peace with what you see?',
  'Who in your life needs your kindness right now — and are you giving it to them?',
  'Are you closer to Allah today than you were one year ago?',
  'What is the one thing you keep delaying for your deen — and why?',
  'Your parents will not be here forever. Have you honored them today?',
  'The Quran is the word of Allah. When did you last sit with it — not to finish it, but to feel it?',
  'You will stand before Allah alone. No one will speak for you. Are you preparing for that moment?',
  'What would you change about your life if you knew you had only 30 days left?',
  'Is your heart at peace right now? If not — what is standing between you and Allah?'
];

(function () {
  var mirror   = el('life-mirror');
  var closeBtn = el('lm-close');
  var skipBtn  = el('lm-skip');
  var qEl      = el('lm-question');
  if (!mirror) return;

  var today = new Date().toISOString().split('T')[0];
  var lastShown;
  try { lastShown = localStorage.getItem('waqtx_mirror_date'); } catch(e) {}

  if (lastShown !== today) {
    var dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
    /* Use language file questions if available, else fallback array */
    var questions = (_langData && Array.isArray(_langData.mirror_questions))
      ? _langData.mirror_questions
      : MIRROR_QUESTIONS;
    if (qEl) qEl.textContent = questions[dayOfYear % questions.length];
    setTimeout(function () {
      mirror.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    }, 3000);
  }

  function closeMirror() {
    mirror.classList.add('hidden');
    document.body.style.overflow = '';
    try { localStorage.setItem('waqtx_mirror_date', today); } catch(e) {}
  }

  if (closeBtn) closeBtn.addEventListener('click', closeMirror);
  if (skipBtn)  skipBtn.addEventListener('click', closeMirror);
  mirror.addEventListener('click', function(e) { if (e.target === mirror) closeMirror(); });
})();

/* ══════════════════════════════════════════════
   QIBLA DIRECTION
   Kaaba coords: 21.4225° N, 39.8262° E
   ══════════════════════════════════════════════ */
var KAABA_LAT = 21.4225;
var KAABA_LNG = 39.8262;

function calcQibla(lat, lng) {
  var dLng = (KAABA_LNG - lng) * Math.PI / 180;
  var lat1 = lat * Math.PI / 180;
  var lat2 = KAABA_LAT * Math.PI / 180;
  var y = Math.sin(dLng) * Math.cos(lat2);
  var x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  var bearing = Math.atan2(y, x) * 180 / Math.PI;
  return (bearing + 360) % 360;
}

function calcDistance(lat1, lng1, lat2, lng2) {
  var R = 6371;
  var dLat = (lat2 - lat1) * Math.PI / 180;
  var dLng = (lng2 - lng1) * Math.PI / 180;
  var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
          Math.sin(dLng/2) * Math.sin(dLng/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function bearingToCompass(deg) {
  var dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  return dirs[Math.round(deg / 22.5) % 16];
}

function setQiblaCompass(bearing) {
  var needle = document.getElementById('qibla-needle-group');
  if (needle) needle.setAttribute('transform', 'rotate(' + bearing + ',110,110)');
  setText('qibla-degree', Math.round(bearing) + '\u00b0');
  var compassDir = bearingToCompass(bearing);
  var label = compassDir + ' \u2014 ' + (t('qibla_note_found') !== 'qibla_note_found'
    ? t('qibla_note_found').replace('Face the direction shown. Allahu Akbar.', '').trim() || 'Face this direction for Qibla'
    : 'Face this direction for Qibla');
  setText('qibla-direction-label', compassDir + ' \u2014 Face this direction for Qibla');
  setText('q-bearing', Math.round(bearing) + '\u00b0 ' + compassDir);
}

(function () {
  var btn = el('btn-qibla');
  if (!btn) return;

  btn.addEventListener('click', function () {
    var noteEl = el('qibla-note');
    if (!navigator.geolocation) {
      if (noteEl) noteEl.textContent = 'Geolocation is not supported by your browser.';
      return;
    }
    btn.textContent = 'Locating…';
    btn.disabled = true;
    if (noteEl) noteEl.textContent = 'Getting your location…';

    navigator.geolocation.getCurrentPosition(
      function (pos) {
        var lat = pos.coords.latitude;
        var lng = pos.coords.longitude;
        var bearing = calcQibla(lat, lng);
        var dist = calcDistance(lat, lng, KAABA_LAT, KAABA_LNG);

        setQiblaCompass(bearing);
        setText('q-location', lat.toFixed(3) + '\u00b0, ' + lng.toFixed(3) + '\u00b0');
        setText('q-distance', t('qibla_km') !== 'qibla_km'
          ? tr('qibla_km', { dist: Math.round(dist).toLocaleString() })
          : Math.round(dist).toLocaleString() + ' km from Kaaba');

        btn.textContent = t('qibla_found') !== 'qibla_found' ? t('qibla_found') : '✓ Qibla Found';
        btn.style.background = 'rgba(22,163,74,0.15)';
        btn.style.borderColor = 'rgba(22,163,74,0.4)';
        btn.style.color = '#86efac';
        if (noteEl) noteEl.textContent = t('qibla_note_found') !== 'qibla_note_found'
          ? t('qibla_note_found') : 'Face the direction shown. Allahu Akbar.';

        /* Save for next visit */
        try {
          localStorage.setItem('waqtx_qibla_lat', lat);
          localStorage.setItem('waqtx_qibla_lng', lng);
          localStorage.setItem('waqtx_qibla_bearing', bearing);
          localStorage.setItem('waqtx_qibla_dist', Math.round(dist));
        } catch(e) {}
      },
      function (err) {
        btn.textContent = 'Find My Qibla';
        btn.disabled = false;
        var msgs = {
          1: 'Location access denied. Please allow location in your browser settings.',
          2: 'Location unavailable. Try again.',
          3: 'Location request timed out. Try again.'
        };
        if (noteEl) noteEl.textContent = msgs[err.code] || 'Could not get location.';
      },
      { timeout: 10000, maximumAge: 300000 }
    );
  });

  /* Restore saved Qibla on load */
  try {
    var savedBearing = localStorage.getItem('waqtx_qibla_bearing');
    var savedDist    = localStorage.getItem('waqtx_qibla_dist');
    var savedLat     = localStorage.getItem('waqtx_qibla_lat');
    var savedLng     = localStorage.getItem('waqtx_qibla_lng');
    if (savedBearing) {
      setQiblaCompass(parseFloat(savedBearing));
      if (savedLat && savedLng) setText('q-location', parseFloat(savedLat).toFixed(3) + '°, ' + parseFloat(savedLng).toFixed(3) + '°');
      if (savedDist) setText('q-distance', t('qibla_km') !== 'qibla_km'
        ? tr('qibla_km', { dist: parseInt(savedDist).toLocaleString() })
        : parseInt(savedDist).toLocaleString() + ' km from Kaaba');
      var noteEl = el('qibla-note');
      if (noteEl) noteEl.textContent = t('qibla_note_saved') !== 'qibla_note_saved'
        ? t('qibla_note_saved') : 'Showing your last saved Qibla direction.';
      btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg> ' +
        (t('qibla_refresh') !== 'qibla_refresh' ? t('qibla_refresh') : '↺ Refresh Qibla');
      btn.disabled = false;
    }
  } catch(e) {}
})();

/* ══════════════════════════════════════════════
   LIVE AGE BREAKDOWN + BIRTHDAY COUNTDOWN
   Updates every second when DOB is set
   ══════════════════════════════════════════════ */
function updateLiveAge() {
  if (!_birth) return;

  /* Show grid, hide empty state on first call */
  var emptyEl = el('liveage-empty');
  var gridEl  = el('liveage-grid');
  var bdayCard = el('birthday-card');
  if (emptyEl) emptyEl.classList.add('hidden');
  if (gridEl)  gridEl.classList.remove('hidden');
  if (bdayCard) bdayCard.classList.remove('hidden');

  var now = new Date();
  var ms  = now - _birth;

  var totalSec   = Math.floor(ms / 1000);
  var totalMin   = Math.floor(ms / 60000);
  var totalHr    = Math.floor(ms / 3600000);
  var totalDays  = Math.floor(ms / 86400000);
  var totalWeeks = Math.floor(totalDays / 7);

  var yy = now.getFullYear() - _birth.getFullYear();
  var mo = now.getMonth()    - _birth.getMonth();
  var dd = now.getDate()     - _birth.getDate();
  if (dd < 0) { mo--; }
  if (mo < 0) { mo += 12; yy--; }
  var totalMonths = yy * 12 + mo;

  setText('la-years',   fmt(yy));
  setText('la-months',  fmt(totalMonths));
  setText('la-weeks',   fmt(totalWeeks));
  setText('la-days',    fmt(totalDays));
  setText('la-hours',   fmt(totalHr));
  setText('la-minutes', fmt(totalMin));
  setText('la-seconds', fmt(totalSec));

  var subEl = el('liveage-sub');
  if (subEl) subEl.textContent = t('liveage_sub_active') !== 'liveage_sub_active'
    ? t('liveage_sub_active') : 'Every second counts. Your age, live.';

  /* ── Birthday countdown ── */
  var bdayIcon  = el('bday-icon');
  var bdayTitle = el('bday-title');
  var bdayVal   = el('bday-val');
  var bdaySub   = el('bday-sub');
  /* bdayCard already declared above */

  /* Check if today IS the birthday first */
  var isToday = (now.getMonth() === _birth.getMonth() && now.getDate() === _birth.getDate());

  /* Next birthday: if today is birthday, show today's age; otherwise next occurrence */
  var nextBday = new Date(now.getFullYear(), _birth.getMonth(), _birth.getDate());
  if (!isToday && nextBday < now) nextBday.setFullYear(now.getFullYear() + 1);

  var daysUntil = isToday ? 0 : Math.ceil((nextBday - now) / 86400000);
  var currentAge = now.getFullYear() - _birth.getFullYear() -
    (now.getMonth() < _birth.getMonth() || (now.getMonth() === _birth.getMonth() && now.getDate() < _birth.getDate()) ? 1 : 0);
  var nextAge = isToday ? currentAge : currentAge + 1;
  var suffix = nextAge === 1 ? 'st' : nextAge === 2 ? 'nd' : nextAge === 3 ? 'rd' : 'th';

  if (isToday) {
    if (bdayIcon)  bdayIcon.textContent  = '🎉';
    if (bdayTitle) bdayTitle.textContent = t('bday_today_title') !== 'bday_today_title'
      ? t('bday_today_title') : 'Happy Birthday!';
    if (bdayVal)   bdayVal.textContent   = t('bday_today_val') !== 'bday_today_val'
      ? tr('bday_today_val', { age: nextAge, suffix: suffix })
      : 'Today is your ' + nextAge + suffix + ' birthday!';
    if (bdaySub)   bdaySub.textContent   = t('bday_today_sub') !== 'bday_today_sub'
      ? t('bday_today_sub') : 'Alhamdulillah — may Allah bless your year ahead. 🤲';
    if (bdayCard)  bdayCard.classList.add('birthday-today');
  } else {
    if (bdayIcon)  bdayIcon.textContent  = '🎂';
    if (bdayTitle) bdayTitle.textContent = t('bday_title') !== 'bday_title'
      ? t('bday_title') : 'Next Birthday';
    if (bdayVal)   bdayVal.textContent   = daysUntil === 1
      ? (t('bday_day_away') !== 'bday_day_away' ? t('bday_day_away') : '1 day away')
      : (t('bday_days_away') !== 'bday_days_away' ? tr('bday_days_away', { n: daysUntil }) : daysUntil + ' days away');
    var bdayDateStr = nextBday.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
    if (bdaySub)   bdaySub.textContent   = t('bday_date_age') !== 'bday_date_age'
      ? tr('bday_date_age', { date: bdayDateStr, age: nextAge })
      : bdayDateStr + ' — you will turn ' + nextAge;
    if (bdayCard)  bdayCard.classList.remove('birthday-today');
  }
}

/* ── Single unified ticker — runs every second ── */
function startUnifiedTicker() {
  clearInterval(window._ticker);
  window._ticker = setInterval(function () {
    if (!_birth) return; /* no-op until DOB entered */
    var t2 = getTotals(_birth);
    /* Glance live updates */
    setText('g-hours',   fmt(t2.hr));
    setText('g-seconds', (t2.sec / 1e6).toFixed(1));
    /* Full live age breakdown */
    updateLiveAge();
  }, 1000);
}

/* Start ticker only — it self-guards with _birth check */
startUnifiedTicker();

/* ══════════════════════════════════════════════
   STEP A — SHAREABLE LIFE MIRROR CARDS
   Beautiful downloadable card with question +
   user stats + name. Works in all 4 languages.
   ══════════════════════════════════════════════ */
var _currentMirrorQuestion = '';

function buildMirrorCard() {
  var container = document.getElementById('mirror-card-dl');
  if (!container) return;

  var name    = _name || 'A Believer';
  var days    = _birth ? fmt(getTotals(_birth).day) : '—';
  var hijri   = _birth ? (function() {
    var h = toHijri(_birth); var hn = toHijri(new Date());
    return h.year + ' AH – ' + hn.year + ' AH';
  })() : '— AH';
  var pct     = _birth ? (function() {
    var b = getBreakdown(_birth);
    var age = b.yy + b.mo/12 + b.dd/365;
    return Math.round(Math.min(100, (age / AVG_LIFESPAN_YEARS) * 100));
  })() : '—';
  var today   = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  var q       = _currentMirrorQuestion || 'What did you do today that will matter in your akhirah?';

  container.innerHTML =
    '<div class="mc-header">' +
      '<div class="mc-logo">✦ WaqtX</div>' +
      '<div class="mc-date">' + today + '</div>' +
    '</div>' +
    '<div class="mc-crescent">☽</div>' +
    '<div class="mc-question">' + q + '</div>' +
    '<div class="mc-divider"></div>' +
    '<div class="mc-name">' + name + '</div>' +
    (days !== '—' ? (
      '<div class="mc-stats">' +
        '<div class="mc-stat"><div class="mc-stat-val">' + days + '</div><div class="mc-stat-lbl">Days Counted</div></div>' +
        '<div class="mc-stat-sep">·</div>' +
        '<div class="mc-stat"><div class="mc-stat-val">' + pct + '%</div><div class="mc-stat-lbl">Life Used</div></div>' +
        '<div class="mc-stat-sep">·</div>' +
        '<div class="mc-stat"><div class="mc-stat-val mc-stat-hijri">' + hijri + '</div><div class="mc-stat-lbl">Islamic Journey</div></div>' +
      '</div>'
    ) : '') +
    '<div class="mc-ayah">وَمَا تَدْرِي نَفْسٌ مَّاذَا تَكْسِبُ غَدًا</div>' +
    '<div class="mc-ayah-tr">No soul knows what it will earn tomorrow — (Quran 31:34)</div>' +
    '<div class="mc-footer">mianhassam96.github.io/WaqtX</div>';
}

function openMirrorShareModal(question) {
  _currentMirrorQuestion = question || _currentMirrorQuestion;
  buildMirrorCard();
  var modal = document.getElementById('mirror-share-modal');
  if (modal) {
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }
}

/* Wire up mirror share button */
(function() {
  var shareBtn = document.getElementById('lm-share-btn');
  if (shareBtn) {
    shareBtn.addEventListener('click', function() {
      var q = document.getElementById('lm-question');
      openMirrorShareModal(q ? q.textContent : '');
    });
  }

  var closeBtn = document.getElementById('mirror-share-close');
  if (closeBtn) closeBtn.addEventListener('click', function() {
    document.getElementById('mirror-share-modal').classList.add('hidden');
    document.body.style.overflow = '';
  });

  var modal = document.getElementById('mirror-share-modal');
  if (modal) modal.addEventListener('click', function(e) {
    if (e.target === modal) { modal.classList.add('hidden'); document.body.style.overflow = ''; }
  });

  /* Download card */
  var dlBtn = document.getElementById('btn-mirror-dl');
  if (dlBtn) dlBtn.addEventListener('click', function() {
    var card = document.getElementById('mirror-card-dl');
    if (!card) return;
    if (typeof html2canvas === 'undefined') { alert('Please take a screenshot to save.'); return; }
    dlBtn.textContent = 'Generating…';
    dlBtn.disabled = true;
    html2canvas(card, { backgroundColor: '#061008', scale: 2, useCORS: true }).then(function(canvas) {
      var a = document.createElement('a');
      a.download = 'waqtx-mirror-' + new Date().toISOString().split('T')[0] + '.png';
      a.href = canvas.toDataURL('image/png');
      a.click();
      dlBtn.textContent = '✓ Downloaded!';
      setTimeout(function() { dlBtn.textContent = '⬇ Download Card'; dlBtn.disabled = false; }, 2000);
    }).catch(function() { dlBtn.textContent = '⬇ Download Card'; dlBtn.disabled = false; });
  });

  /* Copy link with question encoded */
  var copyBtn = document.getElementById('btn-mirror-copy');
  if (copyBtn) copyBtn.addEventListener('click', function() {
    var base = 'https://mianhassam96.github.io/WaqtX/';
    var url  = _birth
      ? base + '?dob=' + _birth.toISOString().split('T')[0] + (_name ? '&name=' + encodeURIComponent(_name) : '')
      : base;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(function() {
        copyBtn.textContent = '✓ Copied!';
        setTimeout(function() { copyBtn.textContent = '🔗 Copy Link'; }, 2000);
      });
    } else {
      var ta = document.createElement('textarea');
      ta.value = url; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); copyBtn.textContent = '✓ Copied!'; } catch(e) {}
      document.body.removeChild(ta);
      setTimeout(function() { copyBtn.textContent = '🔗 Copy Link'; }, 2000);
    }
  });
})();

/* ══════════════════════════════════════════════
   STEP B — PRAYER TIMES
   Uses Aladhan API (free, no key needed)
   Endpoint: https://api.aladhan.com/v1/timings
   Method: 2 (ISNA) — widely accepted
   ══════════════════════════════════════════════ */
var _prayerTimes = null;
var _prayerTicker = null;
var PRAYER_NAMES = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
var PRAYER_ICONS = { Fajr: '🌙', Sunrise: '🌅', Dhuhr: '☀️', Asr: '🌤', Maghrib: '🌇', Isha: '🌃' };

function fetchPrayerTimes(lat, lng) {
  var today = new Date();
  var dd = String(today.getDate()).padStart(2, '0');
  var mm = String(today.getMonth() + 1).padStart(2, '0');
  var yyyy = today.getFullYear();
  var dateStr = dd + '-' + mm + '-' + yyyy;

  var url = 'https://api.aladhan.com/v1/timings/' + dateStr +
    '?latitude=' + lat + '&longitude=' + lng + '&method=2';

  var statusEl = document.getElementById('prayer-status');
  if (statusEl) statusEl.textContent = 'Fetching prayer times…';

  fetch(url)
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.code === 200 && data.data && data.data.timings) {
        _prayerTimes = data.data.timings;
        renderPrayerTimes(_prayerTimes, data.data.meta);
        startPrayerCountdown(_prayerTimes);
        /* Save for offline use */
        try {
          localStorage.setItem('waqtx_prayer_times', JSON.stringify(_prayerTimes));
          localStorage.setItem('waqtx_prayer_date', dateStr);
          localStorage.setItem('waqtx_prayer_meta', JSON.stringify(data.data.meta));
        } catch(e) {}
      } else {
        if (statusEl) statusEl.textContent = 'Could not load prayer times. Try again.';
      }
    })
    .catch(function() {
      if (statusEl) statusEl.textContent = 'Network error. Check your connection.';
      /* Try cached */
      try {
        var cached = localStorage.getItem('waqtx_prayer_times');
        var cachedDate = localStorage.getItem('waqtx_prayer_date');
        var cachedMeta = localStorage.getItem('waqtx_prayer_meta');
        if (cached) {
          _prayerTimes = JSON.parse(cached);
          renderPrayerTimes(_prayerTimes, cachedMeta ? JSON.parse(cachedMeta) : null, true);
          startPrayerCountdown(_prayerTimes);
        }
      } catch(e2) {}
    });
}

function timeStrToMinutes(timeStr) {
  /* timeStr format: "05:23" or "05:23 (PKT)" */
  var clean = timeStr.split(' ')[0];
  var parts = clean.split(':');
  return parseInt(parts[0]) * 60 + parseInt(parts[1]);
}

function getNextPrayer(timings) {
  var now = new Date();
  var nowMin = now.getHours() * 60 + now.getMinutes();
  var prayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
  for (var i = 0; i < prayers.length; i++) {
    var pMin = timeStrToMinutes(timings[prayers[i]]);
    if (pMin > nowMin) return { name: prayers[i], time: timings[prayers[i]], minutes: pMin };
  }
  /* After Isha — next is Fajr tomorrow */
  return { name: 'Fajr', time: timings['Fajr'], minutes: timeStrToMinutes(timings['Fajr']) + 1440, isTomorrow: true };
}

function formatCountdown(totalSeconds) {
  if (totalSeconds < 0) totalSeconds = 0;
  var h = Math.floor(totalSeconds / 3600);
  var m = Math.floor((totalSeconds % 3600) / 60);
  var s = totalSeconds % 60;
  return (h > 0 ? h + 'h ' : '') + m + 'm ' + s + 's';
}

function renderPrayerTimes(timings, meta, fromCache) {
  var grid = document.getElementById('prayer-grid');
  var statusEl = document.getElementById('prayer-status');
  var metaEl = document.getElementById('prayer-meta');
  if (!grid) return;

  var now = new Date();
  var nowMin = now.getHours() * 60 + now.getMinutes();
  var next = getNextPrayer(timings);

  var html = '';
  PRAYER_NAMES.forEach(function(name) {
    if (!timings[name]) return;
    var timeClean = timings[name].split(' ')[0];
    var pMin = timeStrToMinutes(timings[name]);
    var isPast = pMin < nowMin && name !== 'Isha';
    var isNext = name === next.name && !next.isTomorrow;
    var isSunrise = name === 'Sunrise';

    html += '<div class="prayer-card' + (isNext ? ' prayer-next' : '') + (isPast ? ' prayer-past' : '') + (isSunrise ? ' prayer-sunrise' : '') + '">' +
      '<div class="prayer-icon">' + (PRAYER_ICONS[name] || '🕌') + '</div>' +
      '<div class="prayer-name">' + name + '</div>' +
      '<div class="prayer-time">' + timeClean + '</div>' +
      (isNext ? '<div class="prayer-next-badge">Next</div>' : '') +
      (isPast && !isSunrise ? '<div class="prayer-done-badge">✓</div>' : '') +
    '</div>';
  });

  grid.innerHTML = html;

  if (statusEl) statusEl.textContent = fromCache ? '⚠ Showing cached times — connect to refresh' : '';
  if (metaEl && meta) {
    metaEl.textContent = 'Method: ' + (meta.method ? meta.method.name : 'ISNA') +
      (meta.timezone ? ' · ' + meta.timezone : '');
  }
}

function startPrayerCountdown(timings) {
  clearInterval(_prayerTicker);
  var countdownEl = document.getElementById('prayer-countdown');
  var nextNameEl  = document.getElementById('prayer-next-name');
  if (!countdownEl) return;

  function tick() {
    var now = new Date();
    var nowSec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    var next = getNextPrayer(timings);
    var nextSec = next.minutes * 60;
    if (next.isTomorrow) nextSec = next.minutes * 60;
    var diff = nextSec - nowSec;
    if (diff < 0) diff += 86400;

    var heroCountdownEl = el('hero-next-countdown');
    var heroPrayerNameEl = el('hero-next-prayer');
    if (nextNameEl) nextNameEl.textContent = next.name + (next.isTomorrow ? ' (tomorrow)' : '');
    if (heroPrayerNameEl) heroPrayerNameEl.textContent = next.name + (next.isTomorrow ? ' (tomorrow)' : '');
    if (heroCountdownEl) heroCountdownEl.textContent = formatCountdown(diff);
    countdownEl.textContent = formatCountdown(diff);

    /* Re-render grid every minute to update past/next state */
    if (now.getSeconds() === 0) renderPrayerTimes(timings, null);
  }

  tick();
  _prayerTicker = setInterval(tick, 1000);
}

/* Prayer times section init */
(function() {
  var btn = document.getElementById('btn-prayer-times');
  if (!btn) return;

  /* Try to restore cached times first */
  try {
    var cached = localStorage.getItem('waqtx_prayer_times');
    var cachedDate = localStorage.getItem('waqtx_prayer_date');
    var today = (function() {
      var d = new Date();
      return String(d.getDate()).padStart(2,'0') + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + d.getFullYear();
    })();
    if (cached && cachedDate === today) {
      _prayerTimes = JSON.parse(cached);
      var cachedMeta = localStorage.getItem('waqtx_prayer_meta');
      renderPrayerTimes(_prayerTimes, cachedMeta ? JSON.parse(cachedMeta) : null);
      startPrayerCountdown(_prayerTimes);
      btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg> ↺ Refresh';
      var statusEl = document.getElementById('prayer-status');
      if (statusEl) statusEl.textContent = '';
    }
  } catch(e) {}

  btn.addEventListener('click', function() {
    if (!navigator.geolocation) {
      var s = document.getElementById('prayer-status');
      if (s) s.textContent = 'Geolocation not supported by your browser.';
      return;
    }
    btn.textContent = 'Locating…';
    btn.disabled = true;
    navigator.geolocation.getCurrentPosition(
      function(pos) {
        btn.textContent = '↺ Refresh';
        btn.disabled = false;
        fetchPrayerTimes(pos.coords.latitude, pos.coords.longitude);
        /* Save location for Qibla too */
        try {
          localStorage.setItem('waqtx_qibla_lat', pos.coords.latitude);
          localStorage.setItem('waqtx_qibla_lng', pos.coords.longitude);
        } catch(e) {}
      },
      function(err) {
        btn.textContent = 'Get Prayer Times';
        btn.disabled = false;
        var msgs = { 1: 'Location access denied.', 2: 'Location unavailable.', 3: 'Request timed out.' };
        var s = document.getElementById('prayer-status');
        if (s) s.textContent = msgs[err.code] || 'Could not get location.';
      },
      { timeout: 10000, maximumAge: 300000 }
    );
  });
})();

/* ══════════════════════════════════════════════
   STEP D — FAQ ACCORDION
   ══════════════════════════════════════════════ */
(function() {
  document.querySelectorAll('.faq-q').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var isOpen = btn.getAttribute('aria-expanded') === 'true';
      /* Close all */
      document.querySelectorAll('.faq-q').forEach(function(b) {
        b.setAttribute('aria-expanded', 'false');
        var a = b.nextElementSibling;
        if (a) a.classList.remove('open');
      });
      /* Open clicked if it was closed */
      if (!isOpen) {
        btn.setAttribute('aria-expanded', 'true');
        var answer = btn.nextElementSibling;
        if (answer) answer.classList.add('open');
      }
    });
  });
})();

/* ══════════════════════════════════════════════
   TODAY'S STORY — Homepage card
   Pulls from stories-data.js if loaded
   ══════════════════════════════════════════════ */
(function() {
  var container = el('todays-story-card');
  if (!container) return;

  /* stories-data.js loads after app.js — wait for it */
  function tryRender() {
    var stories = window.STORIES;
    if (!stories || !stories.length) return;

    var dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
    var story = stories[dayOfYear % stories.length];

    var catMap = {
      prophet: { cls: 'sc-cat-prophet', label: '🌟 Prophet' },
      sahabi:  { cls: 'sc-cat-sahabi',  label: '🛡 Companion' },
      woman:   { cls: 'sc-cat-woman',   label: '💎 Woman of Islam' },
      moment:  { cls: 'sc-cat-moment',  label: '⚡ Hard Moment' }
    };
    var cat = catMap[story.category] || { cls: 'sc-cat-prophet', label: story.category };

    container.innerHTML =
      '<div class="tsc-inner">' +
        '<div class="tsc-left">' +
          '<span class="sc-category ' + cat.cls + '">' + cat.label + '</span>' +
          '<div class="tsc-name">' + story.name + '</div>' +
          '<div class="tsc-title">' + story.title + '</div>' +
          '<div class="tsc-pain">' + story.pain + '</div>' +
          '<div class="tsc-reflection">' + story.reflection + '</div>' +
        '</div>' +
        '<div class="tsc-right">' +
          '<div class="tsc-ayah">' + story.ayah + '</div>' +
          '<div class="tsc-ayah-tr">' + story.ayahTr + '</div>' +
          '<div class="tsc-action-label">🎯 One Action Today</div>' +
          '<div class="tsc-action">' + story.action + '</div>' +
          '<a href="stories.html#' + story.id + '" class="tsc-read-btn">Read Full Story →</a>' +
        '</div>' +
      '</div>';
  }

  /* Try immediately, then after a short delay for async script load */
  tryRender();
  setTimeout(tryRender, 300);
})();

/* ══════════════════════════════════════════════
   VIRAL SHARING SYSTEM
   ══════════════════════════════════════════════ */

/* ── Emotional copy variants for Life Snapshot ── */
var SNAPSHOT_HOOKS = [
  'How many of them truly mattered?',
  'What did I do with all that time?',
  'Am I using what remains wisely?',
  'Every second was a gift. Was I present?',
  'The question is not how long — but how well.'
];

/* ── Update share preview with emotional copy ── */
function updateSharePreview() {
  if (!_birth) return;
  var t2 = getTotals(_birth);
  var days = fmt(t2.day);
  var hijriBirth = toHijri(_birth);
  var hijriNow   = toHijri(new Date());
  var hijriStr   = hijriBirth.year + ' AH \u2013 ' + hijriNow.year + ' AH';

  /* Emotional text */
  var spEl = el('sp-emotional');
  if (spEl) spEl.innerHTML = 'I\u2019ve counted <span id="sp-days">' + days + '</span> days.';
  var spQ = el('sp-question');
  var dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  if (spQ) spQ.textContent = SNAPSHOT_HOOKS[dayOfYear % SNAPSHOT_HOOKS.length];
  var spH = el('sp-hijri');
  if (spH) spH.textContent = hijriStr;
}

/* ── Copy Caption button ── */
(function() {
  var btn = el('btn-copy-caption');
  if (!btn) return;
  btn.addEventListener('click', function() {
    if (!_birth) { el('hero-dob').focus(); return; }
    /* Open the new share modal instead — it has better captions */
    openShareModalV2();
  });
})();

/* ── Viral Share Modal — Story card ── */
var _viralStory = null;

function buildViralCard(story) {
  var container = el('viral-card-dl');
  if (!container || !story) return;

  var catMap = {
    prophet: '🌟 Prophet',
    sahabi:  '🛡 Companion',
    woman:   '💎 Woman of Islam',
    moment:  '⚡ Hard Moment'
  };

  container.innerHTML =
    '<div class="vc-header">' +
      '<div class="vc-logo">✦ WaqtX</div>' +
      '<div class="vc-cat">' + (catMap[story.category] || '') + '</div>' +
    '</div>' +
    '<div class="vc-name">' + story.name + '</div>' +
    '<div class="vc-pain">\u201C' + story.pain + '\u201D</div>' +
    '<div class="vc-divider"></div>' +
    '<div class="vc-reflection">' + story.reflection + '</div>' +
    '<div class="vc-ayah">' + story.ayah + '</div>' +
    '<div class="vc-ayah-tr">' + story.ayahTr + '</div>' +
    '<div class="vc-footer">mianhassam96.github.io/WaqtX/stories.html</div>';

  /* WhatsApp caption */
  var captionEl = el('viral-whatsapp-caption');
  var url = 'https://mianhassam96.github.io/WaqtX/stories.html';
  var caption = story.pain + '\n\n' +
    story.reflection + '\n\n' +
    '\u2014 ' + story.name + ' | WaqtX\n' +
    'Read the full story: ' + url;
  if (captionEl) captionEl.textContent = caption;
}

function openViralModal(story) {
  _viralStory = story;
  buildViralCard(story);
  var modal = el('story-viral-modal');
  if (modal) { modal.classList.remove('hidden'); document.body.style.overflow = 'hidden'; }
}

/* Wire viral modal buttons */
(function() {
  var closeBtn = el('story-viral-close');
  var modal    = el('story-viral-modal');
  var dlBtn    = el('btn-viral-dl');
  var capBtn   = el('btn-viral-caption');
  var linkBtn  = el('btn-viral-link');

  if (closeBtn) closeBtn.addEventListener('click', function() {
    if (modal) { modal.classList.add('hidden'); document.body.style.overflow = ''; }
  });
  if (modal) modal.addEventListener('click', function(e) {
    if (e.target === modal) { modal.classList.add('hidden'); document.body.style.overflow = ''; }
  });

  if (dlBtn) dlBtn.addEventListener('click', function() {
    var card = el('viral-card-dl');
    if (!card) return;
    if (typeof html2canvas === 'undefined') { alert('Please take a screenshot to save.'); return; }
    dlBtn.textContent = 'Generating\u2026';
    dlBtn.disabled = true;
    html2canvas(card, { backgroundColor: '#061008', scale: 2, useCORS: true }).then(function(canvas) {
      var a = document.createElement('a');
      var name = _viralStory ? _viralStory.name.replace(/[^a-z0-9]/gi, '-').toLowerCase() : 'story';
      a.download = 'waqtx-' + name + '.png';
      a.href = canvas.toDataURL('image/png');
      a.click();
      dlBtn.textContent = '\u2713 Downloaded!';
      setTimeout(function() { dlBtn.textContent = '\u2B07 Download Image'; dlBtn.disabled = false; }, 2000);
    }).catch(function() { dlBtn.textContent = '\u2B07 Download Image'; dlBtn.disabled = false; });
  });

  if (capBtn) capBtn.addEventListener('click', function() {
    var captionEl = el('viral-whatsapp-caption');
    var text = captionEl ? captionEl.textContent : '';
    if (!text) return;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(function() {
        capBtn.textContent = '\u2713 Copied!';
        setTimeout(function() { capBtn.textContent = '\uD83D\uDCCB Copy Caption'; }, 2000);
      });
    } else {
      var ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); capBtn.textContent = '\u2713 Copied!'; } catch(e) {}
      document.body.removeChild(ta);
      setTimeout(function() { capBtn.textContent = '\uD83D\uDCCB Copy Caption'; }, 2000);
    }
  });

  if (linkBtn) linkBtn.addEventListener('click', function() {
    var url = 'https://mianhassam96.github.io/WaqtX/stories.html' +
      (_viralStory ? '#' + _viralStory.id : '');
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(function() {
        linkBtn.textContent = '\u2713 Copied!';
        setTimeout(function() { linkBtn.textContent = '\uD83D\uDD17 Copy Link'; }, 2000);
      });
    }
  });
})();

/* ── Random Reflection Generator ── */
(function() {
  var btn       = el('btn-reflect-gen');
  var shareBtn  = el('btn-share-reflection');
  var container = el('reflect-gen-card');
  var _lastStory = null;

  if (!btn || !container) return;

  btn.addEventListener('click', function() {
    var stories = window.STORIES;
    if (!stories || !stories.length) {
      container.innerHTML = '<div class="rg-placeholder"><div class="rg-placeholder-text">Stories loading\u2026 try again in a moment.</div></div>';
      return;
    }

    /* Pick a random story different from last */
    var idx;
    do { idx = Math.floor(Math.random() * stories.length); }
    while (stories.length > 1 && _lastStory && stories[idx].id === _lastStory.id);
    var story = stories[idx];
    _lastStory = story;

    var catMap = {
      prophet: { cls: 'sc-cat-prophet', label: '🌟 Prophet' },
      sahabi:  { cls: 'sc-cat-sahabi',  label: '🛡 Companion' },
      woman:   { cls: 'sc-cat-woman',   label: '💎 Woman of Islam' },
      moment:  { cls: 'sc-cat-moment',  label: '⚡ Hard Moment' }
    };
    var cat = catMap[story.category] || { cls: 'sc-cat-prophet', label: story.category };

    container.innerHTML =
      '<div class="rg-result">' +
        '<div class="rg-top">' +
          '<span class="sc-category ' + cat.cls + '">' + cat.label + '</span>' +
          '<div class="rg-name">' + story.name + '</div>' +
          '<div class="rg-title">' + story.title + '</div>' +
        '</div>' +
        '<div class="rg-pain">' + story.pain + '</div>' +
        '<div class="rg-ayah">' + story.ayah + '</div>' +
        '<div class="rg-ayah-tr">' + story.ayahTr + '</div>' +
        '<div class="rg-reflection">' + story.reflection + '</div>' +
        '<div class="rg-action-wrap">' +
          '<div class="rg-action-label">\uD83C\uDFAF One Action Today</div>' +
          '<div class="rg-action">' + story.action + '</div>' +
        '</div>' +
        '<a href="stories.html#' + story.id + '" class="rg-read-link">Read Full Story \u2192</a>' +
      '</div>';

    /* Animate in */
    container.style.opacity = '0';
    container.style.transform = 'translateY(12px)';
    setTimeout(function() {
      container.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
      container.style.opacity = '1';
      container.style.transform = 'translateY(0)';
    }, 20);

    if (shareBtn) shareBtn.classList.remove('hidden');

    /* Wire share button */
    shareBtn.onclick = function() { openViralModal(story); };
  });
})();

/* ── Hook updateSharePreview into renderAll ── */
var _origRenderAllShare = renderAll;
renderAll = function(birth) {
  _origRenderAllShare(birth);
  updateSharePreview();
};

/* ── Add "Share This Story" button to stories page Today's Story card ── */
/* This is handled in stories.js — openViralModal is global */
window.openViralModal = openViralModal;

/* ══════════════════════════════════════════════
   GUIDED ISLAMIC GROWTH SYSTEM
   ══════════════════════════════════════════════ */

/* ── Level definitions ── */
var GROWTH_LEVELS = [
  {
    level: 1, name: 'Awareness',
    desc: 'You are beginning to notice your time.',
    minScore: 0, maxScore: 25,
    color: '#c9a84c'
  },
  {
    level: 2, name: 'Action',
    desc: 'You are turning awareness into daily deeds.',
    minScore: 25, maxScore: 50,
    color: '#22c55e'
  },
  {
    level: 3, name: 'Consistency',
    desc: 'Your habits are becoming part of who you are.',
    minScore: 50, maxScore: 75,
    color: '#60a5fa'
  },
  {
    level: 4, name: 'Discipline',
    desc: 'You are building a life that reflects your deen.',
    minScore: 75, maxScore: 100,
    color: '#e8c96a'
  }
];

/* ── Calculate growth score (0–100) ── */
function calcGrowthScore() {
  var data = loadTrackerData();
  var today = new Date();
  var totalScore = 0;
  var maxPossible = 0;

  /* Look at last 30 days */
  for (var i = 0; i < 30; i++) {
    var d = new Date(today);
    d.setDate(today.getDate() - i);
    var key = d.toISOString().split('T')[0];
    var dayData = data[key];
    maxPossible += 10; /* 5 salah + 5 dhikr = 10 max per day */
    if (dayData) {
      totalScore += Math.min((dayData.salah || []).length, 5);
      totalScore += Math.min((dayData.dhikr || []).length, 5);
    }
  }

  if (maxPossible === 0) return 0;
  return Math.round((totalScore / maxPossible) * 100);
}

/* ── Get current level ── */
function getGrowthLevel(score) {
  for (var i = GROWTH_LEVELS.length - 1; i >= 0; i--) {
    if (score >= GROWTH_LEVELS[i].minScore) return GROWTH_LEVELS[i];
  }
  return GROWTH_LEVELS[0];
}

/* ── Render growth level card ── */
function renderGrowthLevel() {
  var score = calcGrowthScore();
  var level = getGrowthLevel(score);
  var nextLevel = GROWTH_LEVELS[level.level] || null; /* level.level is 1-indexed */

  var glLevel    = el('gl-level');
  var glName     = el('gl-level-name');
  var glDesc     = el('gl-desc');
  var glPct      = el('gl-pct');
  var glRingFill = el('gl-ring-fill');
  var glNext     = el('gl-next');

  if (glLevel)    glLevel.textContent = 'Level ' + level.level;
  if (glName)     glName.textContent  = level.name;
  if (glDesc)     glDesc.textContent  = level.desc;

  /* Progress within current level */
  var levelRange = level.maxScore - level.minScore;
  var levelProgress = Math.min(100, ((score - level.minScore) / levelRange) * 100);
  if (glPct) glPct.textContent = Math.round(levelProgress) + '%';

  /* Animate ring */
  if (glRingFill) {
    var circumference = 201;
    var offset = circumference - (levelProgress / 100) * circumference;
    setTimeout(function() {
      glRingFill.style.strokeDashoffset = offset;
      glRingFill.style.stroke = level.color;
    }, 400);
  }

  if (glNext) {
    if (nextLevel) {
      glNext.textContent = 'to Level ' + nextLevel.level + ': ' + nextLevel.name;
    } else {
      glNext.textContent = 'Maximum level reached. MashaAllah.';
    }
  }

  /* Color the level name */
  if (glName) glName.style.color = level.color;
}

/* ── Weekly comparison engine ── */
function renderWeeklyComparison() {
  var data = loadTrackerData();
  var today = new Date();
  var gcIcon = el('gc-icon');
  var gcText = el('gc-text');
  if (!gcText) return;

  /* This week: last 7 days */
  var thisWeekScore = 0;
  var lastWeekScore = 0;

  for (var i = 0; i < 7; i++) {
    var d = new Date(today); d.setDate(today.getDate() - i);
    var key = d.toISOString().split('T')[0];
    var dd = data[key] || { salah: [], dhikr: [] };
    thisWeekScore += (dd.salah || []).length + (dd.dhikr || []).length;
  }
  for (var j = 7; j < 14; j++) {
    var d2 = new Date(today); d2.setDate(today.getDate() - j);
    var key2 = d2.toISOString().split('T')[0];
    var dd2 = data[key2] || { salah: [], dhikr: [] };
    lastWeekScore += (dd2.salah || []).length + (dd2.dhikr || []).length;
  }

  var streak = getStreakCount();
  var bestStreak = getBestStreak();

  if (lastWeekScore === 0 && thisWeekScore === 0) {
    if (gcIcon) gcIcon.textContent = '🌱';
    gcText.innerHTML = 'Complete your first week to see your progress comparison. Every day counts.';
    return;
  }

  if (lastWeekScore === 0) {
    if (gcIcon) gcIcon.textContent = '🌟';
    gcText.innerHTML = 'This is your first week tracking. You scored <strong>' + thisWeekScore + ' points</strong>. Keep going — next week will show your growth.';
    return;
  }

  var diff = thisWeekScore - lastWeekScore;
  var pct = Math.round(Math.abs(diff / lastWeekScore) * 100);

  if (diff > 0) {
    if (gcIcon) gcIcon.textContent = '📈';
    gcText.innerHTML = 'This week you were <strong>' + pct + '% more consistent</strong> than last week. Your streak: <strong>' + streak + ' days</strong>. Best ever: <strong>' + bestStreak + ' days</strong>. Keep going.';
  } else if (diff < 0) {
    if (gcIcon) gcIcon.textContent = '⚠️';
    gcText.innerHTML = 'This week was <strong>' + pct + '% lower</strong> than last week. What happened? Your streak: <strong>' + streak + ' days</strong>. Tomorrow is a fresh start.';
  } else {
    if (gcIcon) gcIcon.textContent = '➡️';
    gcText.innerHTML = 'Same consistency as last week. Streak: <strong>' + streak + ' days</strong>. Push for improvement — even one more prayer makes a difference.';
  }
}

/* ── Best streak calculation ── */
function getBestStreak() {
  try {
    var data = loadTrackerData();
    var keys = Object.keys(data).sort();
    var best = 0;
    var current = 0;
    var prevDate = null;

    keys.forEach(function(key) {
      var dd = data[key];
      if ((dd.salah || []).length >= 5) {
        if (prevDate) {
          var prev = new Date(prevDate);
          var curr = new Date(key);
          var diff = (curr - prev) / 86400000;
          if (diff === 1) { current++; }
          else { current = 1; }
        } else { current = 1; }
        if (current > best) best = current;
        prevDate = key;
      } else {
        current = 0;
        prevDate = null;
      }
    });
    return best;
  } catch(e) { return 0; }
}

/* ── Return Hook — "Yesterday you saw this…" ── */
function renderReturnHook() {
  var card = el('return-hook-card');
  var text = el('rh-text');
  if (!card || !text) return;

  var GROWTH_KEY = 'waqtx_growth';
  var stored;
  try { stored = JSON.parse(localStorage.getItem(GROWTH_KEY) || '{}'); } catch(e) { stored = {}; }

  var today = new Date().toISOString().split('T')[0];
  var yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  var yesterdayKey = yesterday.toISOString().split('T')[0];

  /* Check if user answered "not yet" yesterday */
  if (stored.lastActionDate === yesterdayKey && stored.lastActionStatus === 'later') {
    var storyName = stored.lastStoryName || 'a story';
    text.innerHTML = 'Yesterday you read about <strong>' + storyName + '</strong> and said "not yet." Today is a new chance. Did you act on it?';
    card.classList.remove('hidden');
    return;
  }

  /* Check streak at risk */
  var streak = getStreakCount();
  var data = loadTrackerData();
  var todayData = data[today] || { salah: [], dhikr: [] };
  var todaySalah = (todayData.salah || []).length;

  if (streak >= 3 && todaySalah === 0) {
    var hour = new Date().getHours();
    if (hour >= 14) { /* After Dhuhr time */
      text.innerHTML = '🔥 Your streak is <strong>' + streak + ' days</strong>. You haven\'t logged any prayers today — don\'t break it now.';
      card.classList.remove('hidden');
    }
  }
}

/* ── End Your Day ── */
(function() {
  var yesBtn = el('ed-yes');
  var noBtn  = el('ed-no');
  var resp   = el('ed-response');
  var btns   = el('ed-buttons');
  if (!yesBtn || !noBtn) return;

  var GROWTH_KEY = 'waqtx_growth';
  var today = new Date().toISOString().split('T')[0];

  /* Check if already answered today */
  try {
    var stored = JSON.parse(localStorage.getItem(GROWTH_KEY) || '{}');
    if (stored.endDayDate === today) {
      if (btns) btns.classList.add('hidden');
      if (resp) {
        resp.classList.remove('hidden');
        resp.textContent = stored.endDayAnswer === 'yes'
          ? 'Alhamdulillah. See you tomorrow. ✦'
          : 'Tomorrow is a fresh start. In Sha Allah. ✦';
      }
    }
  } catch(e) {}

  function saveEndDay(answer) {
    try {
      var stored2 = JSON.parse(localStorage.getItem(GROWTH_KEY) || '{}');
      stored2.endDayDate = today;
      stored2.endDayAnswer = answer;
      localStorage.setItem(GROWTH_KEY, JSON.stringify(stored2));
    } catch(e) {}
  }

  yesBtn.addEventListener('click', function() {
    saveEndDay('yes');
    if (btns) btns.classList.add('hidden');
    if (resp) {
      resp.classList.remove('hidden');
      resp.innerHTML = 'Alhamdulillah. Every day you choose Allah is a day that counts. See you tomorrow. ✦';
    }
    renderGrowthLevel(); /* Refresh level */
  });

  noBtn.addEventListener('click', function() {
    saveEndDay('no');
    if (btns) btns.classList.add('hidden');
    if (resp) {
      resp.classList.remove('hidden');
      resp.innerHTML = 'Tomorrow is a fresh start. The Prophet \uFDFA said: "Every son of Adam sins, and the best of sinners are those who repent." In Sha Allah. ✦';
    }
  });
})();

/* ── Story follow-up accountability (stories.html) ── */
window.initStoryFollowUp = function(storyName, storyId) {
  var yesBtn = document.getElementById('smd-fu-yes');
  var laterBtn = document.getElementById('smd-fu-later');
  var resp = document.getElementById('smd-followup-response');
  if (!yesBtn || !laterBtn) return;

  /* Reset state */
  if (resp) resp.classList.add('hidden');
  yesBtn.classList.remove('hidden');
  laterBtn.classList.remove('hidden');

  var GROWTH_KEY = 'waqtx_growth';

  yesBtn.onclick = function() {
    yesBtn.classList.add('hidden');
    laterBtn.classList.add('hidden');
    if (resp) {
      resp.classList.remove('hidden');
      resp.innerHTML = '\u2705 MashaAllah. That action is recorded with Allah. \u201CAnd whoever does an atom\'s weight of good will see it.\u201D \u2014 (Quran 99:7)';
    }
    try {
      var s = JSON.parse(localStorage.getItem(GROWTH_KEY) || '{}');
      s.lastActionDate = new Date().toISOString().split('T')[0];
      s.lastActionStatus = 'done';
      s.lastStoryName = storyName;
      s.lastStoryId = storyId;
      localStorage.setItem(GROWTH_KEY, JSON.stringify(s));
    } catch(e) {}
  };

  laterBtn.onclick = function() {
    yesBtn.classList.add('hidden');
    laterBtn.classList.add('hidden');
    if (resp) {
      resp.classList.remove('hidden');
      resp.innerHTML = '\u23F3 In Sha Allah. We\u2019ll remind you tomorrow. The intention is already a good deed.';
    }
    try {
      var s = JSON.parse(localStorage.getItem(GROWTH_KEY) || '{}');
      s.lastActionDate = new Date().toISOString().split('T')[0];
      s.lastActionStatus = 'later';
      s.lastStoryName = storyName;
      s.lastStoryId = storyId;
      localStorage.setItem(GROWTH_KEY, JSON.stringify(s));
    } catch(e) {}
  };
};

/* ── Init all growth components ── */
renderGrowthLevel();
renderWeeklyComparison();
renderReturnHook();

/* ══════════════════════════════════════════════
   PERSONAL PATH SYSTEM
   "Your Current State" + "Your Focus This Week"
   ══════════════════════════════════════════════ */

var WEEKLY_GOALS = {
  1: [ /* Level 1 — Awareness */
    { id: 'read_reflection', label: 'Read 3 daily reflections', target: 3, unit: 'reflections' },
    { id: 'salah_3days',     label: 'Pray all 5 Salah on 3 days', target: 3, unit: 'days' },
    { id: 'end_day_3',       label: 'Complete End-of-Day check 3 times', target: 3, unit: 'times' }
  ],
  2: [ /* Level 2 — Action */
    { id: 'salah_5days',     label: 'Pray all 5 Salah on 5 days', target: 5, unit: 'days' },
    { id: 'dhikr_4days',     label: 'Complete Dhikr on 4 days', target: 4, unit: 'days' },
    { id: 'story_action',    label: 'Act on 2 story reflections', target: 2, unit: 'actions' }
  ],
  3: [ /* Level 3 — Consistency */
    { id: 'salah_7days',     label: 'Pray all 5 Salah every day this week', target: 7, unit: 'days' },
    { id: 'dhikr_6days',     label: 'Complete Dhikr on 6 days', target: 6, unit: 'days' },
    { id: 'streak_7',        label: 'Maintain a 7-day streak', target: 7, unit: 'days' }
  ],
  4: [ /* Level 4 — Discipline */
    { id: 'salah_7days',     label: 'Perfect Salah — all 5 every day', target: 7, unit: 'days' },
    { id: 'dhikr_7days',     label: 'Complete all Dhikr every day', target: 7, unit: 'days' },
    { id: 'streak_14',       label: 'Reach a 14-day streak', target: 14, unit: 'days' }
  ]
};

function calcWeeklyGoalProgress(goalId, level) {
  var data = loadTrackerData();
  var today = new Date();
  var streak = getStreakCount();
  var bestStreak = getBestStreak();

  /* Count this week's data */
  var salahFullDays = 0;
  var dhikrFullDays = 0;
  var dhikr4Days = 0;
  var dhikr6Days = 0;

  for (var i = 0; i < 7; i++) {
    var d = new Date(today); d.setDate(today.getDate() - i);
    var key = d.toISOString().split('T')[0];
    var dd = data[key] || { salah: [], dhikr: [] };
    if ((dd.salah || []).length >= 5) salahFullDays++;
    if ((dd.dhikr || []).length >= 5) dhikrFullDays++;
    if ((dd.dhikr || []).length >= 4) dhikr4Days++;
    if ((dd.dhikr || []).length >= 6) dhikr6Days++;
  }

  /* Growth data */
  var growthData = {};
  try { growthData = JSON.parse(localStorage.getItem('waqtx_growth') || '{}'); } catch(e) {}
  var endDayCount = 0;
  /* Count end-of-day completions this week */
  for (var j = 0; j < 7; j++) {
    var d2 = new Date(today); d2.setDate(today.getDate() - j);
    var k = d2.toISOString().split('T')[0];
    if (growthData['endDay_' + k]) endDayCount++;
  }

  var storyActions = parseInt(growthData.storyActionsThisWeek || 0);

  switch (goalId) {
    case 'salah_3days': return Math.min(3, salahFullDays);
    case 'salah_5days': return Math.min(5, salahFullDays);
    case 'salah_7days': return Math.min(7, salahFullDays);
    case 'dhikr_4days': return Math.min(4, dhikr4Days);
    case 'dhikr_6days': return Math.min(6, dhikr6Days);
    case 'dhikr_7days': return Math.min(7, dhikrFullDays);
    case 'end_day_3':   return Math.min(3, endDayCount);
    case 'story_action':return Math.min(2, storyActions);
    case 'streak_7':    return Math.min(7, streak);
    case 'streak_14':   return Math.min(14, Math.max(streak, bestStreak));
    case 'read_reflection': return Math.min(3, parseInt(growthData.reflectionsThisWeek || 0));
    default: return 0;
  }
}

function renderPersonalPath() {
  var score = calcGrowthScore();
  var level = getGrowthLevel(score);
  var streak = getStreakCount();
  var data = loadTrackerData();
  var today = getTodayKey();
  var todayData = data[today] || { salah: [], dhikr: [] };
  var todaySalah = (todayData.salah || []).length;

  /* ── Current State ── */
  var csState = el('cs-state');
  var csSub   = el('cs-sub');

  if (csState) {
    var stateMsg = '';
    var subMsg   = '';

    if (streak === 0 && todaySalah === 0) {
      stateMsg = 'You are at the beginning of your journey.';
      subMsg   = 'Every great journey starts with one step. Log your first prayer today.';
    } else if (streak >= 7) {
      stateMsg = 'You are building real consistency — ' + streak + ' days strong.';
      subMsg   = 'MashaAllah. You are at Level ' + level.level + ': ' + level.name + '. Keep this momentum.';
    } else if (streak >= 3) {
      stateMsg = 'You are building a habit — ' + streak + ' days in a row.';
      subMsg   = 'You are at Level ' + level.level + ': ' + level.name + '. Three more days and it becomes a pattern.';
    } else if (todaySalah >= 3) {
      stateMsg = 'You are showing up today — ' + todaySalah + ' of 5 prayers done.';
      subMsg   = 'Finish the remaining ' + (5 - todaySalah) + ' prayers to complete today.';
    } else if (score >= 50) {
      stateMsg = 'You are consistent but not yet at your peak.';
      subMsg   = 'Level ' + level.level + ': ' + level.name + '. Your last 30 days show ' + score + '% consistency.';
    } else {
      stateMsg = 'You are struggling with consistency right now.';
      subMsg   = 'That is okay. Start with one prayer today. Just one.';
    }

    csState.textContent = stateMsg;
    if (csSub) csSub.textContent = subMsg;
  }

  /* ── Weekly Focus Goals ── */
  var goalsContainer = el('wf-goals');
  var progressBar    = el('wf-progress-bar');
  var progressText   = el('wf-progress-text');
  if (!goalsContainer) return;

  var goals = WEEKLY_GOALS[level.level] || WEEKLY_GOALS[1];
  var totalProgress = 0;
  var totalTarget   = 0;
  var html = '';

  goals.forEach(function(goal) {
    var progress = calcWeeklyGoalProgress(goal.id, level.level);
    var pct = Math.min(100, Math.round((progress / goal.target) * 100));
    var done = progress >= goal.target;
    totalProgress += Math.min(progress, goal.target);
    totalTarget   += goal.target;

    html +=
      '<div class="wf-goal' + (done ? ' wf-goal-done' : '') + '">' +
        '<div class="wf-goal-check">' + (done ? '✓' : '') + '</div>' +
        '<div class="wf-goal-info">' +
          '<div class="wf-goal-label">' + goal.label + '</div>' +
          '<div class="wf-goal-bar-wrap">' +
            '<div class="wf-goal-bar" style="width:' + pct + '%"></div>' +
          '</div>' +
        '</div>' +
        '<div class="wf-goal-count">' + progress + '/' + goal.target + '</div>' +
      '</div>';
  });

  goalsContainer.innerHTML = html;

  var overallPct = totalTarget > 0 ? Math.round((totalProgress / totalTarget) * 100) : 0;
  if (progressBar) progressBar.style.width = overallPct + '%';
  if (progressText) {
    var doneGoals = goals.filter(function(g) {
      return calcWeeklyGoalProgress(g.id, level.level) >= g.target;
    }).length;
    progressText.textContent = doneGoals + '/' + goals.length + ' goals complete this week — ' + overallPct + '%';
  }
}

/* Track story actions for weekly goals */
var _origInitStoryFollowUp = window.initStoryFollowUp;
window.initStoryFollowUp = function(storyName, storyId) {
  if (_origInitStoryFollowUp) _origInitStoryFollowUp(storyName, storyId);
  /* Override yes button to also count weekly story actions */
  var yesBtn = document.getElementById('smd-fu-yes');
  if (yesBtn) {
    var origOnClick = yesBtn.onclick;
    yesBtn.onclick = function() {
      if (origOnClick) origOnClick.call(this);
      try {
        var s = JSON.parse(localStorage.getItem('waqtx_growth') || '{}');
        var weekKey = 'storyActionsThisWeek';
        /* Reset weekly count on Monday */
        var today = new Date();
        var weekStart = new Date(today); weekStart.setDate(today.getDate() - today.getDay() + 1);
        var weekStartKey = weekStart.toISOString().split('T')[0];
        if (s.storyActionsWeekStart !== weekStartKey) {
          s.storyActionsThisWeek = 0;
          s.storyActionsWeekStart = weekStartKey;
        }
        s.storyActionsThisWeek = (parseInt(s.storyActionsThisWeek) || 0) + 1;
        localStorage.setItem('waqtx_growth', JSON.stringify(s));
      } catch(e) {}
      renderPersonalPath();
    };
  }
};

/* Track end-of-day per date */
var _origEndDayYes = document.getElementById('ed-yes');
if (_origEndDayYes) {
  var _origYesClick = _origEndDayYes.onclick;
  _origEndDayYes.addEventListener('click', function() {
    try {
      var s = JSON.parse(localStorage.getItem('waqtx_growth') || '{}');
      var today2 = new Date().toISOString().split('T')[0];
      s['endDay_' + today2] = true;
      localStorage.setItem('waqtx_growth', JSON.stringify(s));
    } catch(e) {}
    renderPersonalPath();
  });
}

/* Init */
renderPersonalPath();

/* ══════════════════════════════════════════════
   DAILY ISLAM DASHBOARD
   Renders Ayah, Dua, Action from daily-islam.js
   ══════════════════════════════════════════════ */
(function() {
  var dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);

  /* ── Today's Ayah ── */
  var ayahs = window.DAILY_AYAHS;
  if (ayahs && ayahs.length) {
    var ayah = ayahs[dayOfYear % ayahs.length];
    var ddAr  = el('dd-ayah-arabic');
    var ddTr  = el('dd-ayah-translation');
    var ddSrc = el('dd-ayah-source');
    var ddRef = el('dd-ayah-reflection');
    if (ddAr)  ddAr.textContent  = ayah.arabic;
    if (ddTr)  ddTr.textContent  = '\u201C' + ayah.translation + '\u201D';
    if (ddSrc) ddSrc.textContent = '\u2014 ' + ayah.source;
    if (ddRef) ddRef.textContent = ayah.reflection;
  }

  /* ── Today's Dua ── */
  var duas = window.DAILY_DUAS;
  if (duas && duas.length) {
    var dua = duas[dayOfYear % duas.length];
    var ddDA   = el('dd-dua-arabic');
    var ddDTl  = el('dd-dua-transliteration');
    var ddDTr  = el('dd-dua-translation');
    var ddDS   = el('dd-dua-source');
    var ddDSit = el('dd-dua-situation');
    if (ddDSit) ddDSit.textContent = dua.situation;
    if (ddDA)   ddDA.textContent   = dua.arabic;
    if (ddDTl)  ddDTl.textContent  = dua.transliteration;
    if (ddDTr)  ddDTr.textContent  = '\u201C' + dua.translation + '\u201D';
    if (ddDS)   ddDS.textContent   = '\u2014 ' + dua.source;
  }

  /* ── Today's Action ── */
  var actions = window.DAILY_ACTIONS;
  if (actions && actions.length) {
    var action = actions[dayOfYear % actions.length];
    var ddAT = el('dd-action-text');
    var ddAW = el('dd-action-why');
    if (ddAT) ddAT.textContent = action.action;
    if (ddAW) ddAW.textContent = action.why + ' \u2014 ' + action.source;
  }

  /* ── Done button ── */
  var doneBtn = el('dd-done-btn');
  var doneMsg = el('dd-done-msg');
  var DASH_KEY = 'waqtx_dashboard';
  var today = new Date().toISOString().split('T')[0];

  try {
    var stored = JSON.parse(localStorage.getItem(DASH_KEY) || '{}');
    if (stored.actionDate === today) {
      if (doneBtn) doneBtn.classList.add('hidden');
      if (doneMsg) doneMsg.classList.remove('hidden');
    }
  } catch(e) {}

  if (doneBtn) doneBtn.addEventListener('click', function() {
    try {
      var s = JSON.parse(localStorage.getItem(DASH_KEY) || '{}');
      s.actionDate = today;
      localStorage.setItem(DASH_KEY, JSON.stringify(s));
    } catch(e) {}
    doneBtn.classList.add('hidden');
    if (doneMsg) doneMsg.classList.remove('hidden');
    try {
      var g = JSON.parse(localStorage.getItem('waqtx_growth') || '{}');
      var weekStart = new Date(); weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
      var wsk = weekStart.toISOString().split('T')[0];
      if (g.reflectionsWeekStart !== wsk) { g.reflectionsThisWeek = 0; g.reflectionsWeekStart = wsk; }
      g.reflectionsThisWeek = (parseInt(g.reflectionsThisWeek) || 0) + 1;
      localStorage.setItem('waqtx_growth', JSON.stringify(g));
    } catch(e) {}
    if (typeof renderPersonalPath === 'function') renderPersonalPath();
  });

  /* ── Share action button ── */
  var shareActionBtn = el('dd-share-action-btn');
  if (shareActionBtn && actions && actions.length) {
    shareActionBtn.addEventListener('click', function() {
      var act = actions[dayOfYear % actions.length];
      var url = 'https://mianhassam96.github.io/WaqtX/';
      var text = 'Today\'s Islamic action:\n\n' + act.action + '\n\n' + act.why + '\n\u2014 ' + act.source + '\n\nWaqtX: ' + url;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(function() {
          shareActionBtn.textContent = '\u2713 Copied!';
          setTimeout(function() { shareActionBtn.textContent = '\uD83D\uDCE4 Share'; }, 2000);
        });
      }
    });
  }
})();

/* ══════════════════════════════════════════════
   SITUATION-BASED ISLAM — "If You Feel..."
   ══════════════════════════════════════════════ */
(function() {
  var grid = el('situation-grid');
  if (!grid) return;
  var situations = window.SITUATIONS;
  if (!situations || !situations.length) return;

  var html = '';
  situations.forEach(function(sit, idx) {
    html +=
      '<div class="sit-card" data-idx="' + idx + '" style="--sit-color:' + sit.color + '">' +
        '<div class="sit-emoji">' + sit.emoji + '</div>' +
        '<div class="sit-emotion">' + sit.emotion + '</div>' +
        '<div class="sit-preview">' + sit.ayah.translation.substring(0, 55) + '\u2026</div>' +
      '</div>';
  });
  grid.innerHTML = html;

  grid.querySelectorAll('.sit-card').forEach(function(card) {
    card.addEventListener('click', function() {
      openSituationModal(situations[parseInt(card.getAttribute('data-idx'))]);
    });
  });
})();

function openSituationModal(sit) {
  var modal = el('situation-modal');
  var body  = el('sit-modal-body');
  if (!modal || !body) return;

  body.innerHTML =
    '<div class="sit-modal-header" style="--sit-color:' + sit.color + '">' +
      '<div class="sit-modal-emoji">' + sit.emoji + '</div>' +
      '<div class="sit-modal-title">When You Feel ' + sit.emotion + '</div>' +
    '</div>' +
    '<div class="sit-modal-section">' +
      '<div class="sit-modal-label sit-label-ayah">\uD83D\uDCD6 What Allah Says</div>' +
      '<div class="sit-modal-arabic">' + sit.ayah.arabic + '</div>' +
      '<div class="sit-modal-translation">\u201C' + sit.ayah.translation + '\u201D</div>' +
      '<div class="sit-modal-source">\u2014 ' + sit.ayah.source + '</div>' +
    '</div>' +
    '<div class="sit-modal-section">' +
      '<div class="sit-modal-label sit-label-dua">\uD83E\uDD32 Dua for This Moment</div>' +
      '<div class="sit-modal-arabic">' + sit.dua.arabic + '</div>' +
      '<div class="sit-modal-translit">' + sit.dua.transliteration + '</div>' +
      '<div class="sit-modal-translation">\u201C' + sit.dua.translation + '\u201D</div>' +
      '<div class="sit-modal-source">\u2014 ' + sit.dua.source + '</div>' +
    '</div>' +
    '<div class="sit-modal-section">' +
      '<div class="sit-modal-label sit-label-story">\uD83C\uDF1F Their Story</div>' +
      '<div class="sit-modal-story-name">' + sit.story.name + '</div>' +
      '<div class="sit-modal-story-pain">' + sit.story.pain + '</div>' +
      '<div class="sit-modal-story-decision">\u26A1 ' + sit.story.decision + '</div>' +
    '</div>' +
    '<div class="sit-modal-action-box">' +
      '<div class="sit-modal-action-label">\uD83C\uDFAF Do This Right Now</div>' +
      '<div class="sit-modal-action">' + sit.action + '</div>' +
    '</div>' +
    '<div class="sit-modal-reflection">' + sit.reflection + '</div>';

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

(function() {
  var closeBtn = el('situation-modal-close');
  var modal    = el('situation-modal');
  if (closeBtn) closeBtn.addEventListener('click', function() {
    if (modal) { modal.classList.add('hidden'); document.body.style.overflow = ''; }
  });
  if (modal) modal.addEventListener('click', function(e) {
    if (e.target === modal) { modal.classList.add('hidden'); document.body.style.overflow = ''; }
  });
})();
