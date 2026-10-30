(function () {
  'use strict';
  var library = document.getElementById('music-library');
  if (!library) return;
  var list = library.querySelector('.music-entries');
  var entries = Array.from(list.querySelectorAll('.music-entry'));
  var input = document.getElementById('music-search');
  var sort = document.getElementById('music-sort');
  var yearGroup = library.querySelector('.music-years');
  // Derive years and counts from the entries so future notes need no filter edits.
  var years = Array.from(new Set(entries.map(function (entry) { return entry.dataset.year; }))).sort().reverse();
  yearGroup.replaceChildren();
  ['all'].concat(years).forEach(function (value) {
    var button = document.createElement('button');
    button.type = 'button'; button.dataset.year = value;
    button.setAttribute('aria-pressed', String(value === 'all'));
    button.appendChild(document.createTextNode(value === 'all' ? 'すべて ' : value + ' '));
    var total = document.createElement('span');
    total.textContent = String(value === 'all' ? entries.length : entries.filter(function (entry) { return entry.dataset.year === value; }).length);
    button.appendChild(total); yearGroup.appendChild(button);
  });
  var filters = Array.from(yearGroup.querySelectorAll('button'));
  var count = library.querySelector('.music-result-count');
  var pager = library.querySelector('.music-pagination');
  var empty = library.querySelector('.music-empty');
  var desktop = window.matchMedia('(min-width: 768px)');
  var year = 'all', page = 1, pageSize = desktop.matches ? 24 : 8;
  var normalize = function (text) { return text.normalize('NFKC').toLocaleLowerCase().replace(/\s+/g, ' ').trim(); };
  var searchText = new Map(entries.map(function (entry) {
    return [entry, normalize(entry.querySelector('h3').textContent + ' ' + entry.querySelector('.music-review').textContent)];
  }));
  library.classList.add('is-enhanced');
  library.querySelector('.music-controls').hidden = false;

  function goToPage(number) {
    page = number;
    render();
    library.scrollIntoView({ block: 'start' });
    var current = pager.querySelector('[aria-current="page"]');
    if (current) current.focus({ preventScroll: true });
  }
  function pageButton(label, number, disabled, current) {
    var button = document.createElement('button');
    button.type = 'button'; button.textContent = label; button.disabled = disabled;
    if (current) button.setAttribute('aria-current', 'page');
    button.setAttribute('aria-label', /^\d+$/.test(label) ? '第 ' + label + ' 页' : label);
    button.addEventListener('click', function () { goToPage(number); });
    pager.appendChild(button);
  }
  function render() {
    var terms = normalize(input.value).split(' ').filter(Boolean);
    var matched = entries.filter(function (entry) {
      return (year === 'all' || entry.dataset.year === year) && terms.every(function (term) { return searchText.get(entry).includes(term); });
    });
    matched.sort(function (a, b) {
      var tie = Number(a.dataset.order) - Number(b.dataset.order);
      if (sort.value === 'title') return a.querySelector('h3').textContent.localeCompare(b.querySelector('h3').textContent, 'ja') || tie;
      var dateOrder = a.dataset.date.localeCompare(b.dataset.date);
      return (sort.value === 'oldest' ? dateOrder : -dateOrder) || tie;
    });
    var pages = Math.max(1, Math.ceil(matched.length / pageSize));
    page = Math.min(page, pages);
    entries.forEach(function (entry) { entry.hidden = true; });
    matched.forEach(function (entry, i) {
      list.appendChild(entry);
      entry.hidden = i < (page - 1) * pageSize || i >= page * pageSize;
    });
    empty.hidden = matched.length !== 0;
    count.textContent = matched.length ? '共 ' + matched.length + ' 篇短评 · 显示 ' + ((page - 1) * pageSize + 1) + '–' + Math.min(page * pageSize, matched.length) : '共 0 篇短评';
    pager.replaceChildren();
    pager.hidden = pages <= 1;
    if (pages > 1) {
      pageButton('上一页', page - 1, page === 1, false);
      // Keep pagination compact as the collection grows.
      for (var i = 1; i <= pages; i++) {
        if (i === 1 || i === pages || Math.abs(i - page) <= 1) pageButton(String(i), i, false, i === page);
        else if (i === page - 2 || i === page + 2) {
          var dots = document.createElement('span'); dots.textContent = '…'; pager.appendChild(dots);
        }
      }
      pageButton('下一页', page + 1, page === pages, false);
    }
  }
  filters.forEach(function (button) {
    button.addEventListener('click', function () {
      year = button.dataset.year; page = 1;
      filters.forEach(function (item) { item.setAttribute('aria-pressed', String(item === button)); });
      render();
    });
  });
  input.addEventListener('input', function () { page = 1; render(); });
  sort.addEventListener('change', function () { page = 1; render(); });
  document.getElementById('music-reset').addEventListener('click', function () {
    input.value = ''; year = 'all'; page = 1;
    filters.forEach(function (button) { button.setAttribute('aria-pressed', String(button.dataset.year === 'all')); });
    render(); input.focus();
  });
  desktop.addEventListener('change', function () {
    var firstVisible = (page - 1) * pageSize;
    pageSize = desktop.matches ? 24 : 8;
    page = Math.floor(firstVisible / pageSize) + 1;
    render();
  });
  render();
}());
