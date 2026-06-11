'use strict';
/* WaqtX — Stories Page Logic */

var _currentStoryIdx = 0;
var _filteredStories = [];

/* ── Helpers ── */
function elS(id) { return document.getElementById(id); }

/* ── Category badge HTML ── */
function categoryBadge(cat) {
  var map = {
    prophet: { cls: 'sc-cat-prophet', label: '🌟 Prophet' },
    sahabi:  { cls: 'sc-cat-sahabi',  label: '🛡 Companion' },
    woman:   { cls: 'sc-cat-woman',   label: '💎 Woman of Islam' },
    moment:  { cls: 'sc-cat-moment',  label: '⚡ Hard Moment' }
  };
  var c = map[cat] || { cls: 'sc-cat-prophet', label: cat };
  return '<span class="sc-category ' + c.cls + '">' + c.label + '</span>';
}

/* ── Build a story card ── */
function buildStoryCard(story) {
  var div = document.createElement('div');
  div.className = 'story-card';
  div.setAttribute('data-id', story.id);
  div.innerHTML =
    categoryBadge(story.category) +
    '<div class="sc-name">' + story.name + '</div>' +
    '<div class="sc-title">' + story.title + '</div>' +
    '<div class="sc-pain">' + story.pain + '</div>' +
    '<div class="sc-reflection">' + story.reflection + '</div>';
  div.addEventListener('click', function() { openStory(story.id); });
  return div;
}

/* ── Render a grid ── */
function renderGrid(containerId, stories) {
  var container = elS(containerId);
  if (!container) return;
  container.innerHTML = '';
  stories.forEach(function(s) { container.appendChild(buildStoryCard(s)); });
}

/* ── Open story modal ── */
function openStory(id) {
  var all = window.STORIES || [];
  var idx = all.findIndex(function(s) { return s.id === id; });
  if (idx === -1) return;
  _currentStoryIdx = idx;
  renderStoryModal(all[idx], idx, all.length);
  var modal = elS('story-detail-modal');
  if (modal) {
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    modal.scrollTop = 0;
  }
}

function renderStoryModal(story, idx, total) {
  var cat = elS('smd-category');
  var name = elS('smd-name');
  var title = elS('smd-title');
  var pain = elS('smd-pain');
  var storyEl = elS('smd-story');
  var ayah = elS('smd-ayah');
  var ayahTr = elS('smd-ayah-tr');
  var decision = elS('smd-decision');
  var reflection = elS('smd-reflection');
  var action = elS('smd-action');

  if (cat)        cat.innerHTML = categoryBadge(story.category);
  if (name)       name.textContent = story.name;
  if (title)      title.textContent = story.title;
  if (pain)       pain.textContent = story.pain;
  if (storyEl)    storyEl.textContent = story.story;
  if (ayah)       ayah.textContent = story.ayah;
  if (ayahTr)     ayahTr.textContent = story.ayahTr;
  if (decision)   decision.textContent = story.decision;
  if (reflection) reflection.textContent = story.reflection;
  if (action)     action.textContent = story.action;

  /* Wire follow-up accountability */
  if (window.initStoryFollowUp) window.initStoryFollowUp(story.name, story.id);

  /* Nav buttons */
  var prevBtn = elS('smd-prev');
  var nextBtn = elS('smd-next');
  if (prevBtn) prevBtn.textContent = idx > 0 ? '\u2190 ' + window.STORIES[idx - 1].name : '\u2190 Previous';
  if (nextBtn) nextBtn.textContent = idx < total - 1 ? window.STORIES[idx + 1].name + ' \u2192' : 'Next \u2192';
  if (prevBtn) prevBtn.disabled = idx === 0;
  if (nextBtn) nextBtn.disabled = idx === total - 1;
}

/* ── Close modal ── */
function closeStoryModal() {
  var modal = elS('story-detail-modal');
  if (modal) { modal.classList.add('hidden'); document.body.style.overflow = ''; }
}

/* ── Featured today ── */
function renderFeatured() {
  var stories = window.STORIES || [];
  if (!stories.length) return;
  var dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  var story = stories[dayOfYear % stories.length];

  var bgText = elS('featured-bg-text');
  var heroName = elS('featured-hero-name');
  var title = elS('featured-title');
  var pain = elS('featured-pain');
  var readBtn = elS('featured-read-btn');
  var card = elS('featured-card');

  if (bgText)   bgText.textContent = story.name.split(' ')[1] || story.name;
  if (heroName) heroName.textContent = story.name;
  if (title)    title.textContent = story.title;
  if (pain)     pain.textContent = story.pain;

  if (readBtn) readBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    openStory(story.id);
  });
  if (card) card.addEventListener('click', function() { openStory(story.id); });
  if (card) card.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ' ') openStory(story.id);
  });
}

/* ── When You Feel… — emotional entry points ── */
var PAIN_POINTS = [
  { emotion: '🌫️', feeling: 'Lost',          label: 'When you feel lost',          story: 'Musa (AS) in the desert',      id: 'prophet-musa-red-sea' },
  { emotion: '😔',  feeling: 'Alone',         label: 'When you feel completely alone', story: 'Yusuf (AS) in the well',    id: 'moment-completely-alone' },
  { emotion: '😞',  feeling: 'Unmotivated',   label: 'When you have lost motivation', story: 'Nuh (AS) — 950 years',       id: 'prophet-nuh-950-years' },
  { emotion: '💔',  feeling: 'Guilty',        label: 'When you feel weighed down by guilt', story: 'The door of tawbah',   id: 'prophet-yusuf-betrayed-by-brothers' },
  { emotion: '😡',  feeling: 'Angry',         label: 'When anger takes over',       story: 'Bilal (RA) under the sun',     id: 'moment-treated-unjustly' },
  { emotion: '😰',  feeling: 'Afraid',        label: 'When fear grips your heart',  story: 'Nuh (AS) — keep going',        id: 'moment-want-to-give-up' },
  { emotion: '🤐',  feeling: 'Misunderstood', label: 'When no one understands you', story: 'Maryam (AS) stood alone',      id: 'maryam-alone-and-misunderstood' },
  { emotion: '💸',  feeling: 'Heartbroken',   label: 'When everything falls apart', story: 'Ayyub (AS) — patience',        id: 'prophet-ayyub-everything-taken' },
  { emotion: '😤',  feeling: 'Overwhelmed',   label: 'When life is too much',       story: 'Musa (AS) at the Red Sea',     id: 'prophet-musa-red-sea' },
  { emotion: '🥀',  feeling: 'Grieving',      label: 'When grief will not leave',   story: 'Yaqub (AS) — beautiful patience', id: 'moment-completely-alone' }
];

function renderPainPoints() {
  var grid = elS('pain-grid');
  if (!grid) return;
  grid.innerHTML = '';
  PAIN_POINTS.forEach(function(p) {
    var div = document.createElement('div');
    div.className = 'pain-card';
    div.setAttribute('role', 'button');
    div.setAttribute('tabindex', '0');
    div.setAttribute('aria-label', p.label + ' — ' + p.story);
    div.innerHTML =
      '<div class="pain-card-emotion">' + p.emotion + '</div>' +
      '<div class="pain-card-text">' +
        '<div class="pain-card-feeling">' + p.label + '</div>' +
        '<div class="pain-card-story">' + p.story + '</div>' +
      '</div>' +
      '<div class="pain-card-arrow">→</div>';
    div.addEventListener('click', function() { openStory(p.id); });
    div.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') openStory(p.id);
    });
    grid.appendChild(div);
  });
}

/* ── Category filter ── */
function filterByCategory(cat) {
  var stories = window.STORIES || [];
  var prophets = elS('prophets-section');
  var sahaba   = elS('sahaba-section');
  var women    = elS('women-section');
  var painSec  = elS('pain-section');
  var featured = elS('featured-section');

  if (cat === 'all') {
    [prophets, sahaba, women, painSec, featured].forEach(function(s) { if (s) s.classList.remove('hidden'); });
    renderAllGrids();
    return;
  }

  /* Hide all, show only relevant */
  [prophets, sahaba, women, painSec, featured].forEach(function(s) { if (s) s.classList.add('hidden'); });

  var filtered = stories.filter(function(s) { return s.category === cat; });

  if (cat === 'feel' && painSec) {
    painSec.classList.remove('hidden');
    renderPainPoints();
  } else if (cat === 'prophet' && prophets) {
    prophets.classList.remove('hidden');
    renderGrid('prophets-grid', filtered);
  } else if (cat === 'sahabi' && sahaba) {
    sahaba.classList.remove('hidden');
    renderGrid('sahaba-grid', filtered);
  } else if (cat === 'woman' && women) {
    women.classList.remove('hidden');
    renderGrid('women-grid', filtered);
  } else if (cat === 'moment' && painSec) {
    painSec.classList.remove('hidden');
    renderGrid('pain-grid', filtered.map(function(s) {
      return s; /* reuse story cards for moments */
    }));
    /* Replace pain-grid with story cards */
    var pg = elS('pain-grid');
    if (pg) {
      pg.className = 'stories-grid';
      pg.innerHTML = '';
      filtered.forEach(function(s) { pg.appendChild(buildStoryCard(s)); });
    }
  }
}

/* ── Search ── */
function handleSearch(query) {
  var stories = window.STORIES || [];
  var q = query.toLowerCase().trim();
  var searchSection = elS('search-results');
  var searchGrid    = elS('search-grid');
  var noResults     = elS('no-results');
  var mainSections  = ['featured-section','pain-section','prophets-section','sahaba-section','women-section'];

  if (!q) {
    if (searchSection) searchSection.classList.add('hidden');
    mainSections.forEach(function(id) { var s = elS(id); if (s) s.classList.remove('hidden'); });
    renderAllGrids();
    return;
  }

  mainSections.forEach(function(id) { var s = elS(id); if (s) s.classList.add('hidden'); });
  if (searchSection) searchSection.classList.remove('hidden');

  var results = stories.filter(function(s) {
    return (
      s.name.toLowerCase().includes(q) ||
      s.title.toLowerCase().includes(q) ||
      s.pain.toLowerCase().includes(q) ||
      s.reflection.toLowerCase().includes(q) ||
      (s.tags && s.tags.some(function(tag) { return tag.toLowerCase().includes(q); }))
    );
  });

  if (searchGrid) {
    searchGrid.innerHTML = '';
    results.forEach(function(s) { searchGrid.appendChild(buildStoryCard(s)); });
  }
  if (noResults) noResults.classList.toggle('hidden', results.length > 0);
}

/* ── Render all grids ── */
function renderAllGrids() {
  var stories = window.STORIES || [];
  renderGrid('prophets-grid', stories.filter(function(s) { return s.category === 'prophet'; }));
  renderGrid('sahaba-grid',   stories.filter(function(s) { return s.category === 'sahabi'; }));
  renderGrid('women-grid',    stories.filter(function(s) { return s.category === 'woman'; }));
  renderPainPoints();
}

/* ── Init ── */
(function init() {
  if (!window.STORIES) { console.warn('stories-data.js not loaded'); return; }

  renderFeatured();
  renderAllGrids();

  /* Category tabs */
  document.querySelectorAll('.stories-tab').forEach(function(tab) {
    tab.addEventListener('click', function() {
      document.querySelectorAll('.stories-tab').forEach(function(t) { t.classList.remove('active'); });
      tab.classList.add('active');
      filterByCategory(tab.getAttribute('data-cat'));
    });
  });

  /* Search */
  var searchInput = elS('stories-search');
  if (searchInput) {
    var searchTimer;
    searchInput.addEventListener('input', function() {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(function() { handleSearch(searchInput.value); }, 250);
    });
  }

  /* Modal close */
  var closeBtn = elS('story-modal-close');
  if (closeBtn) closeBtn.addEventListener('click', closeStoryModal);

  var modal = elS('story-detail-modal');
  if (modal) modal.addEventListener('click', function(e) {
    if (e.target === modal) closeStoryModal();
  });

  /* Modal nav */
  var prevBtn = elS('smd-prev');
  var nextBtn = elS('smd-next');
  var shareBtn = elS('smd-share');

  if (prevBtn) prevBtn.addEventListener('click', function() {
    if (_currentStoryIdx > 0) {
      _currentStoryIdx--;
      renderStoryModal(window.STORIES[_currentStoryIdx], _currentStoryIdx, window.STORIES.length);
      var mi = elS('story-detail-modal'); if (mi) mi.scrollTop = 0;
    }
  });
  if (nextBtn) nextBtn.addEventListener('click', function() {
    if (_currentStoryIdx < window.STORIES.length - 1) {
      _currentStoryIdx++;
      renderStoryModal(window.STORIES[_currentStoryIdx], _currentStoryIdx, window.STORIES.length);
      var mi = elS('story-detail-modal'); if (mi) mi.scrollTop = 0;
    }
  });
  if (shareBtn) shareBtn.addEventListener('click', function() {
    var story = window.STORIES[_currentStoryIdx];
    if (story && window.openViralModal) window.openViralModal(story);
  });

  /* Keyboard close */
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeStoryModal();
  });
})();
