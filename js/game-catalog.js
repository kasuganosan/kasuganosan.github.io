(function () {
  'use strict';
  var library = document.getElementById('game-library');
  if (!library) return;
  var list = library.querySelector('.game-entries');
  var entries = Array.from(list.querySelectorAll('.game-entry'));
  var filters = Array.from(library.querySelectorAll('.game-genres button'));
  var input = document.getElementById('game-search');
  var sort = document.getElementById('game-sort');
  var count = library.querySelector('.game-result-count');
  var pane = document.getElementById('game-expanded-review');
  var empty = library.querySelector('.game-empty');
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var revealAnimation = null;
  var genre = 'all', matched = [], selected = null, buttons = new Map();
  var normalize = function (value) { return value.normalize('NFKC').toLocaleLowerCase().replace(/\s+/g, ' ').trim(); };
  var searchText = new Map(entries.map(function (entry) {
    return [entry, normalize(entry.querySelector('h3').textContent + ' ' + entry.querySelector('.game-review').textContent)];
  }));
  function textNode(tag, className, text) {
    var node = document.createElement(tag); node.className = className; node.textContent = text; return node;
  }
  function columns() { return parseInt(getComputedStyle(list).getPropertyValue('--wall-columns'), 10) || 2; }
  function stopReveal() {
    var previous = revealAnimation; revealAnimation = null;
    if (previous) previous.cancel();
    pane.classList.remove('is-opening');
  }
  function animatePanel() {
    if (reducedMotion.matches || !pane.animate) return;
    var height = pane.getBoundingClientRect().height;
    var style = getComputedStyle(pane);
    var paddingTop = style.paddingTop, paddingBottom = style.paddingBottom;
    pane.classList.add('is-opening');
    var animation = pane.animate([
      { height: '0px', opacity: .25, paddingTop: '0px', paddingBottom: '0px' },
      { height: height + 'px', opacity: 1, paddingTop: paddingTop, paddingBottom: paddingBottom }
    ], { duration: 300, easing: 'cubic-bezier(.22,1,.36,1)' });
    revealAnimation = animation;
    animation.finished.then(function () {
      if (revealAnimation === animation) { revealAnimation = null; pane.classList.remove('is-opening'); }
    }, function () { /* A new selection or resize may cancel this reveal. */ });
  }
  function placePanel() {
    if (!selected || pane.hidden) return;
    var index = matched.indexOf(selected), size = columns();
    if (index < 0) return;
    var lastInRow = matched[Math.min(matched.length - 1, Math.floor(index / size) * size + size - 1)];
    // Place the shared panel after the full row, including a partial final row.
    if (lastInRow.nextElementSibling !== pane) lastInRow.after(pane);
  }
  function closePanel() {
    var previous = selected; selected = null; updateSelection();
    if (previous) buttons.get(previous).focus({ preventScroll: true });
  }
  entries.forEach(function (entry) {
    var button = document.createElement('button');
    button.type = 'button'; button.className = 'game-wall-button';
    button.setAttribute('aria-controls', 'game-expanded-review');
    var frame = document.createElement('span'); frame.className = 'game-cover-frame';
    var cover = entry.querySelector('.game-cover').cloneNode(true); cover.alt = '';
    frame.appendChild(cover); button.appendChild(frame);
    button.appendChild(textNode('span', 'game-wall-title', entry.dataset.gameTitle));
    button.appendChild(textNode('span', 'game-wall-studio', entry.dataset.studio));
    entry.prepend(button); buttons.set(entry, button);
    button.addEventListener('click', function () {
      selected = selected === entry ? null : entry; updateSelection(true);
      if (selected) requestAnimationFrame(function () {
        function showHeading() {
          if (selected === entry && !pane.hidden) pane.querySelector('.game-expanded-heading').scrollIntoView({ block: 'nearest', behavior: reducedMotion.matches ? 'instant' : 'smooth' });
        }
        if (revealAnimation) revealAnimation.finished.then(showHeading, function () {});
        else showHeading();
      });
    });
    button.addEventListener('keydown', function (event) {
      var position = matched.indexOf(entry), next = position;
      if (event.key === 'ArrowRight') next++;
      else if (event.key === 'ArrowLeft') next--;
      else if (event.key === 'ArrowDown') next += columns();
      else if (event.key === 'ArrowUp') next -= columns();
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = matched.length - 1;
      else if (event.key === 'Escape' && selected) { event.preventDefault(); closePanel(); return; }
      else return;
      event.preventDefault(); next = Math.max(0, Math.min(matched.length - 1, next));
      buttons.get(matched[next]).focus();
    });
  });
  function updateSelection(animate) {
    stopReveal();
    entries.forEach(function (entry) {
      var expanded = entry === selected;
      buttons.get(entry).setAttribute('aria-expanded', String(expanded));
      buttons.get(entry).setAttribute('aria-label', entry.querySelector('h3').textContent + (expanded ? '，收起短评' : '，展开短评'));
    });
    pane.hidden = !selected; pane.replaceChildren();
    if (!selected) return;
    var inner = document.createElement('div'); inner.className = 'game-expanded-inner';
    var heading = document.createElement('header'); heading.className = 'game-expanded-heading';
    var cover = selected.querySelector('.game-cover').cloneNode(true);
    cover.alt = selected.dataset.gameTitle + ' — 封面'; cover.loading = 'eager';
    var text = document.createElement('div');
    var title = textNode('h3', '', selected.dataset.gameTitle); title.id = 'game-expanded-title';
    text.appendChild(title);
    text.appendChild(textNode('p', 'game-expanded-studio', selected.dataset.studio));
    text.appendChild(textNode('p', 'game-expanded-genre', '分类：' + selected.dataset.genre));
    var close = textNode('button', 'game-expanded-close', '×');
    close.type = 'button'; close.setAttribute('aria-label', '收起短评'); close.addEventListener('click', closePanel);
    heading.append(cover, text, close);
    var review = selected.querySelector('.game-review').cloneNode(true);
    review.removeAttribute('id'); review.className = 'game-expanded-text';
    inner.append(heading, review); pane.appendChild(inner); placePanel();
    if (animate) animatePanel();
  }
  function render() {
    var terms = normalize(input.value).split(' ').filter(Boolean);
    matched = entries.filter(function (entry) {
      return (genre === 'all' || entry.dataset.genre === genre) && terms.every(function (term) { return searchText.get(entry).includes(term); });
    });
    matched.sort(function (a, b) {
      var order = Number(a.dataset.order) - Number(b.dataset.order);
      return sort.value === 'title' ? a.dataset.gameTitle.localeCompare(b.dataset.gameTitle, 'ja') || order : sort.value === 'reverse' ? -order : order;
    });
    entries.forEach(function (entry) { entry.hidden = true; });
    matched.forEach(function (entry) { list.appendChild(entry); entry.hidden = false; });
    if (!matched.includes(selected)) selected = null;
    count.textContent = '共 ' + matched.length + ' 部作品';
    empty.hidden = matched.length !== 0; updateSelection();
  }
  library.classList.add('is-cover-wall');
  library.querySelector('.game-controls').hidden = false;
  filters.forEach(function (button) {
    button.querySelector('span').textContent = String(button.dataset.genre === 'all' ? entries.length : entries.filter(function (entry) { return entry.dataset.genre === button.dataset.genre; }).length);
    button.addEventListener('click', function () {
      genre = button.dataset.genre;
      filters.forEach(function (item) { item.setAttribute('aria-pressed', String(item === button)); });
      render();
    });
  });
  input.addEventListener('input', render);
  sort.addEventListener('change', render);
  document.getElementById('game-reset').addEventListener('click', function () {
    genre = 'all'; input.value = '';
    filters.forEach(function (button) { button.setAttribute('aria-pressed', String(button.dataset.genre === 'all')); });
    render(); input.focus();
  });
  pane.addEventListener('keydown', function (event) { if (event.key === 'Escape') { event.preventDefault(); closePanel(); } });
  function handleResize() { stopReveal(); placePanel(); }
  reducedMotion.addEventListener('change', function () { if (reducedMotion.matches) stopReveal(); });
  if (window.ResizeObserver) {
    var width = 0;
    new ResizeObserver(function (records) {
      var nextWidth = records[0].contentRect.width;
      if (nextWidth !== width) { width = nextWidth; handleResize(); }
    }).observe(list);
  }
  window.addEventListener('resize', handleResize);
  render();
}());
