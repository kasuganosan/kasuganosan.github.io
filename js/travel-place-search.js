(function () {
  'use strict';
  window.initJapanPlaceSearch = function (map) {
    var places = window.travelPlaces || [];
    var form = document.getElementById('atlas-place-search');
    var input = document.getElementById('atlas-place-query');
    var results = document.getElementById('atlas-place-results');
    var matches = [];
    function normalize(text) {
      return String(text).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[\s\-’']/g, '');
    }
    var index = places.map(function (place) {
      return { place: place, keys: [place.name, place.roman].concat(place.aliases || []).map(normalize) };
    });
    function close() { results.hidden = true; input.setAttribute('aria-expanded', 'false'); }
    function choose(place) {
      map.setView(place.label, place.kind === 'pref' ? 8 : 13, { animate: false });
      input.value = place.name;
      close();
    }
    function search() {
      var query = normalize(input.value.trim());
      results.replaceChildren();
      if (!query) { matches = []; close(); return; }
      matches = index.map(function (entry) {
        var score = entry.keys.reduce(function (best, key) {
          return Math.min(best, key === query ? 0 : key.startsWith(query) ? 1 : key.includes(query) ? 2 : 10);
        }, 10);
        return { place: entry.place, score: score };
      }).filter(function (entry) { return entry.score < 10; }).sort(function (a, b) {
        return a.score - b.score || b.place.population - a.place.population;
      }).slice(0, 8).map(function (entry) { return entry.place; });
      matches.forEach(function (place) {
        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'atlas-place-result';
        var title = document.createElement('strong');
        title.textContent = place.name;
        var meta = document.createElement('span');
        meta.textContent = [place.region, place.roman].filter(Boolean).join(' · ');
        button.append(title, meta);
        button.addEventListener('click', function () { choose(place); });
        results.appendChild(button);
      });
      if (!matches.length) {
        var empty = document.createElement('p');
        empty.className = 'atlas-place-no-results';
        empty.textContent = '未找到地点，可尝试日文或英文名称。';
        results.appendChild(empty);
      }
      results.hidden = false;
      input.setAttribute('aria-expanded', 'true');
    }
    input.addEventListener('input', search);
    input.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') close();
      if (event.key === 'ArrowDown' && matches.length) { event.preventDefault(); results.querySelector('button').focus(); }
    });
    results.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') { close(); input.focus(); }
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        var buttons = Array.from(results.querySelectorAll('button'));
        var position = buttons.indexOf(document.activeElement);
        var next = position + (event.key === 'ArrowDown' ? 1 : -1);
        if (buttons[next]) buttons[next].focus(); else input.focus();
      }
    });
    form.addEventListener('submit', function (event) { event.preventDefault(); search(); if (matches.length) choose(matches[0]); });
    document.addEventListener('click', function (event) { if (!form.contains(event.target)) close(); });
    document.querySelectorAll('[data-atlas-place]').forEach(function (button) {
      button.addEventListener('click', function () {
        var place = places.find(function (item) { return item.id === button.getAttribute('data-atlas-place'); });
        if (place) choose(place);
      });
    });
  };
})();
