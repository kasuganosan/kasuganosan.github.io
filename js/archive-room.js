(function () {
  'use strict';
  var room = document.getElementById('archive-room');
  if (!room) return;
  var entries = Array.from(room.querySelectorAll('.archive-entry'));
  var categories = Array.from(room.querySelectorAll('.archive-categories button'));
  var tags = Array.from(room.querySelectorAll('.archive-tag'));
  var query = document.getElementById('archive-query');
  var reset = document.getElementById('archive-reset');
  var empty = room.querySelector('.archive-empty');
  var count = document.getElementById('archive-result-count');
  var heading = document.getElementById('archive-list-title');
  var preview = room.querySelector('.archive-preview');
  var image = document.getElementById('archive-preview-image');
  var category = 'all', tag = null, previewEntry = null;
  var hoverTimer = null;
  function cancelHover() { if (hoverTimer !== null) { clearTimeout(hoverTimer); hoverTimer = null; } }
  var normalize = function (value) { return value.normalize('NFKC').toLocaleLowerCase().replace(/\s+/g, ' ').trim(); };
  var words = new Map(entries.map(function (entry) { return [entry, normalize(entry.textContent + ' ' + entry.dataset.tags + ' ' + entry.dataset.excerpt)]; }));
  function showPreview(entry) {
    if (!window.matchMedia('(min-width: 992px)').matches || entry.hidden || previewEntry === entry) return;
    previewEntry = entry;
    var link = entry.querySelector('.archive-link');
    var title = entry.querySelector('.archive-title').textContent;
    preview.hidden = false;
    room.querySelector('.archive-preview-number').textContent = 'NO. ' + entry.querySelector('.archive-number').textContent;
    document.getElementById('archive-preview-title').textContent = title;
    document.getElementById('archive-preview-excerpt').textContent = entry.dataset.excerpt;
    document.getElementById('archive-preview-link').href = link.getAttribute('href');
    image.hidden = !entry.dataset.image;
    if (entry.dataset.image) { image.alt = title + ' · 文章配图'; image.src = entry.dataset.image; }
    else image.removeAttribute('src');
  }
  function render() {
    cancelHover();
    var terms = normalize(query.value).split(' ').filter(Boolean);
    var candidates = entries.filter(function (entry) {
      return (!tag || entry.dataset.tags.split(',').map(function (item) { return item.trim(); }).includes(tag)) && terms.every(function (term) { return words.get(entry).includes(term); });
    });
    categories.forEach(function (button) {
      var matches = button.dataset.category === 'all' ? candidates.length : candidates.filter(function (entry) { return entry.dataset.category === button.dataset.category; }).length;
      button.querySelector('.archive-nav-count').textContent = String(matches).padStart(2, '0');
      button.setAttribute('aria-pressed', String(button.dataset.category === category));
    });
    var visible = candidates.filter(function (entry) { return category === 'all' || entry.dataset.category === category; });
    var matching = new Set(visible);
    entries.forEach(function (entry) { entry.hidden = !matching.has(entry); });
    var activeCategory = categories.find(function (button) { return button.dataset.category === category; });
    var label = category === 'all' ? '全蔵目録' : activeCategory.querySelector('span:nth-child(2)').textContent;
    heading.textContent = label;
    count.textContent = visible.length + ' 篇文献' + (tag ? ' · ' + tag : '');
    reset.hidden = !query.value && !tag && category === 'all';
    empty.hidden = visible.length !== 0;
    if (previewEntry && !matching.has(previewEntry)) { preview.hidden = true; previewEntry = null; }
  }
  function clear() {
    category = 'all'; tag = null; query.value = '';
    tags.forEach(function (button) { button.setAttribute('aria-pressed', 'false'); });
    render(); query.focus();
  }
  room.querySelector('.archive-discovery').hidden = false;
  room.querySelector('.archive-categories').hidden = false;
  room.querySelector('.archive-search').addEventListener('submit', function (event) { event.preventDefault(); });
  query.addEventListener('input', render);
  categories.forEach(function (button) { button.addEventListener('click', function () { category = button.dataset.category; render(); }); });
  tags.forEach(function (button) {
    button.addEventListener('click', function () {
      tag = tag === button.dataset.tag ? null : button.dataset.tag;
      tags.forEach(function (item) { item.setAttribute('aria-pressed', String(item.dataset.tag === tag)); });
      render();
    });
  });
  reset.addEventListener('click', clear);
  document.getElementById('archive-empty-reset').addEventListener('click', clear);
  entries.forEach(function (entry) {
    var link = entry.querySelector('.archive-link');
    var pointerFocus = false;
    // A quick click navigates directly; previews must not move a click target.
    link.addEventListener('pointerenter', function () {
      cancelHover();
      hoverTimer = setTimeout(function () { hoverTimer = null; showPreview(entry); }, 160);
    });
    link.addEventListener('pointerleave', function () { cancelHover(); pointerFocus = false; });
    link.addEventListener('pointerdown', function () { cancelHover(); pointerFocus = true; });
    link.addEventListener('pointerup', function () { pointerFocus = false; });
    link.addEventListener('pointercancel', function () { pointerFocus = false; });
    link.addEventListener('focus', function () { if (!pointerFocus) showPreview(entry); });
  });
  render();
}());
