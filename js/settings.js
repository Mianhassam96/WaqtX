'use strict';
/* ═══════════════════════════════════════════════
   WaqtX — Settings Page Logic
   Prayer Method · Theme · Language · Location ·
   Notifications · Accessibility · Data
   ═══════════════════════════════════════════════ */

var S = WaqtX.storage;

/* ── Generic toggle helper ── */
function initToggle(id, storageKey, onChange) {
  var el2 = el(id);
  if (!el2) return;
  el2.checked = !!S.get(storageKey);
  el2.addEventListener('change', function() {
    S.set(storageKey, el2.checked);
    if (onChange) onChange(el2.checked);
  });
}

/* ── Generic select helper ── */
function initSelect(id, storageKey, defaultVal, onChange) {
  var el2 = el(id);
  if (!el2) return;
  el2.value = S.get(storageKey) || defaultVal;
  el2.addEventListener('change', function() {
    S.set(storageKey, el2.value);
    if (onChange) onChange(el2.value);
  });
}

/* ══════════════════════════════════════
   PRAYER CALCULATION METHOD
   ══════════════════════════════════════ */
function initPrayerMethod() {
  initSelect('setting-prayer-method', 'prayer_method', '2', function(val) {
    /* Clear cached prayer times so they are re-fetched with new method */
    S.remove('prayer_times');
    S.remove('prayer_date');
    showSavedToast('Prayer method updated — refresh prayer times.');
  });
}

/* ══════════════════════════════════════
   THEME
   ══════════════════════════════════════ */
function initThemeSettings() {
  var btns = document.querySelectorAll('.theme-preview-btn');
  var saved = S.get('theme') || 'dark';
  btns.forEach(function(btn) {
    var theme = btn.getAttribute('data-theme');
    if (theme === saved || (theme === 'dark' && !saved)) btn.classList.add('active');
    btn.addEventListener('click', function() {
      btns.forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      S.set('theme_user_set', true);
      WaqtX.theme.apply(theme);
    });
  });
}

/* ══════════════════════════════════════
   LANGUAGE
   ══════════════════════════════════════ */
function initLanguageSettings() {
  initSelect('setting-language', 'lang', 'en', function(lang) {
    WaqtX.lang.load(lang);
    showSavedToast('Language updated.');
  });
}

/* ══════════════════════════════════════
   LOCATION
   ══════════════════════════════════════ */
function initLocationSettings() {
  var modeAuto   = el('location-auto');
  var modeManual = el('location-manual');
  var cityInput  = el('setting-city');
  var cityBtn    = el('btn-city-lookup');
  var cityStatus = el('city-status');
  var savedMode  = S.get('location_mode') || 'auto';
  var savedCity  = S.get('location_city') || '';
  var savedLat   = S.get('location_lat');
  var savedLng   = S.get('location_lng');

  if (savedCity && cityInput) cityInput.value = savedCity;
  if (savedLat && savedLng) {
    setText('location-current', savedCity
      ? savedCity + ' (' + parseFloat(savedLat).toFixed(2) + ', ' + parseFloat(savedLng).toFixed(2) + ')'
      : parseFloat(savedLat).toFixed(4) + ', ' + parseFloat(savedLng).toFixed(4));
  }

  if (modeAuto) {
    modeAuto.checked = savedMode === 'auto';
    modeAuto.addEventListener('change', function() {
      if (modeAuto.checked) {
        S.set('location_mode', 'auto');
        if (cityInput) cityInput.disabled = true;
        if (cityBtn) cityBtn.disabled = true;
        /* Re-detect */
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(function(pos) {
            S.set('location_lat', pos.coords.latitude);
            S.set('location_lng', pos.coords.longitude);
            S.remove('prayer_times');
            setText('location-current', pos.coords.latitude.toFixed(4) + ', ' + pos.coords.longitude.toFixed(4));
            showSavedToast('Location auto-detected.');
          });
        }
      }
    });
  }

  if (modeManual) {
    modeManual.checked = savedMode === 'manual';
    modeManual.addEventListener('change', function() {
      if (modeManual.checked) {
        S.set('location_mode', 'manual');
        if (cityInput) cityInput.disabled = false;
        if (cityBtn) cityBtn.disabled = false;
      }
    });
  }

  if (cityBtn && cityInput && cityStatus) {
    cityBtn.addEventListener('click', function() {
      var city = cityInput.value.trim();
      if (!city) return;
      cityStatus.textContent = 'Looking up…';
      /* AlAdhan city lookup */
      fetch('https://api.aladhan.com/v1/cityInfo?city=' + encodeURIComponent(city) + '&country=')
        .then(function(r) { return r.json(); })
        .then(function(data) {
          if (data.code === 200 && data.data) {
            var lat = parseFloat(data.data.latitude);
            var lng = parseFloat(data.data.longitude);
            S.set('location_lat', lat);
            S.set('location_lng', lng);
            S.set('location_city', city);
            S.set('location_mode', 'manual');
            S.remove('prayer_times');
            cityStatus.textContent = '✓ Location set: ' + city;
            setText('location-current', city + ' (' + lat.toFixed(2) + ', ' + lng.toFixed(2) + ')');
            showSavedToast('Location updated — refresh prayer times to apply.');
          } else {
            cityStatus.textContent = 'City not found. Try a different spelling.';
          }
        })
        .catch(function() {
          cityStatus.textContent = 'Network error. Check your connection.';
        });
    });
  }
}

/* ══════════════════════════════════════
   NOTIFICATIONS
   ══════════════════════════════════════ */
function initNotificationSettings() {
  function requestAndSave(key, toggleEl) {
    if (!('Notification' in window)) {
      toggleEl.checked = false;
      setText('notif-support-msg', 'Notifications are not supported in this browser.');
      return;
    }
    if (Notification.permission === 'granted') {
      S.set(key, toggleEl.checked);
      return;
    }
    if (Notification.permission === 'denied') {
      toggleEl.checked = false;
      var msg = el('notif-denied-msg');
      if (msg) msg.classList.remove('hidden');
      return;
    }
    Notification.requestPermission().then(function(p) {
      if (p === 'granted') {
        S.set(key, toggleEl.checked);
      } else {
        toggleEl.checked = false;
        var msg = el('notif-denied-msg');
        if (msg) msg.classList.remove('hidden');
      }
    });
  }

  ['notif-adhan-s', 'notif-reminder-s', 'notif-silent-s'].forEach(function(id) {
    var t = el(id);
    if (!t) return;
    var key = id.replace('-s', '').replace('notif-', 'notif_');
    t.checked = !!S.get(key);
    t.addEventListener('change', function() { requestAndSave(key, t); });
  });
}

/* ══════════════════════════════════════
   ACCESSIBILITY
   ══════════════════════════════════════ */
function initAccessibility() {
  /* Font size */
  var fontBtns = document.querySelectorAll('.font-size-btn');
  var savedFs = S.get('font_size') || 'default';
  fontBtns.forEach(function(btn) {
    var size = btn.getAttribute('data-size');
    if (size === savedFs) btn.classList.add('active');
    btn.addEventListener('click', function() {
      fontBtns.forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      S.set('font_size', size);
      document.documentElement.classList.remove('font-small','font-default','font-large');
      document.documentElement.classList.add('font-' + size);
    });
  });

  /* High contrast */
  initToggle('setting-contrast', 'contrast', function(on) {
    if (on) {
      document.documentElement.setAttribute('data-contrast','high');
      S.set('contrast', 'high');
    } else {
      document.documentElement.removeAttribute('data-contrast');
      S.set('contrast', 'normal');
    }
  });
}

/* ══════════════════════════════════════
   DATA — Clear All
   ══════════════════════════════════════ */
function initDataSettings() {
  var clearBtn = el('btn-clear-data');
  var confirmBox = el('clear-confirm');
  var confirmYes = el('btn-clear-confirm-yes');
  var confirmNo  = el('btn-clear-confirm-no');

  if (clearBtn) {
    clearBtn.addEventListener('click', function() {
      if (confirmBox) confirmBox.classList.remove('hidden');
    });
  }
  if (confirmNo) {
    confirmNo.addEventListener('click', function() {
      if (confirmBox) confirmBox.classList.add('hidden');
    });
  }
  if (confirmYes) {
    confirmYes.addEventListener('click', function() {
      S.clearAll();
      if (confirmBox) confirmBox.classList.add('hidden');
      showSavedToast('All data cleared. Refreshing…');
      setTimeout(function() { window.location.href = 'index.html'; }, 1500);
    });
  }
}

/* ══════════════════════════════════════
   TOAST
   ══════════════════════════════════════ */
function showSavedToast(msg) {
  var toast = el('settings-toast');
  if (!toast) return;
  toast.textContent = msg || '✓ Saved';
  toast.classList.remove('hidden');
  toast.classList.add('toast-show');
  setTimeout(function() {
    toast.classList.remove('toast-show');
    setTimeout(function() { toast.classList.add('hidden'); }, 300);
  }, 2500);
}

/* ══════════════════════════════════════
   BOOT
   ══════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function() {
  initPrayerMethod();
  initThemeSettings();
  initLanguageSettings();
  initLocationSettings();
  initNotificationSettings();
  initAccessibility();
  initDataSettings();
});
