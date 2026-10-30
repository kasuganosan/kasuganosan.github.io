(function () {
  'use strict';
  var room = document.getElementById('portrait-room');
  if (!room) return;
  // Keep shared controls Japanese on this page without changing other pages.
  var themeButton = document.getElementById('theme-toggle');
  function localizeTheme() {
    var label = document.documentElement.dataset.theme === 'dark' ? 'ライトモードに切り替え' : 'ダークモードに切り替え';
    if (themeButton && themeButton.getAttribute('aria-label') !== label) themeButton.setAttribute('aria-label', label);
  }
  if (themeButton) {
    new MutationObserver(localizeTheme).observe(themeButton, { attributes: true, attributeFilter: ['aria-label'] });
    localizeTheme();
  }
  var searchResults = document.getElementById('search-results');
  if (searchResults) new MutationObserver(function () {
    var empty = searchResults.querySelector('.search-empty');
    if (empty && empty.textContent === '没有找到相关文章') empty.textContent = '該当する記事がありません';
  }).observe(searchResults, { childList: true, subtree: true });
  var figures = Array.from(room.querySelectorAll('.portrait-panel'));
  var tabs = Array.from(room.querySelectorAll('.portrait-tab'));
  var tablist = room.querySelector('.portrait-tabs');
  var allButton = room.querySelector('.portrait-all');
  var status = room.querySelector('.portrait-status');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var numerals = ['I', 'II', 'III', 'IV', 'V'];
  var active = 0, all = false, animations = [];
  function stop() {
    animations.forEach(function (animation) { animation.cancel(); });
    animations = [];
    figures.forEach(function (figure, i) {
      figure.hidden = !all && i !== active;
      figure.inert = !all && i !== active;
    });
  }
  function render() {
    room.classList.toggle('is-all', all);
    allButton.setAttribute('aria-pressed', String(all));
    allButton.textContent = all ? '一枚ずつ見る' : 'すべての肖像';
    status.textContent = all ? '全五点' : numerals[active] + ' / V';
    tabs.forEach(function (tab, i) {
      tab.setAttribute('aria-selected', String(i === active));
      tab.tabIndex = i === active ? 0 : -1;
    });
    figures.forEach(function (figure, i) {
      figure.hidden = !all && i !== active;
      figure.inert = !all && i !== active;
      figure.setAttribute('role', all ? 'figure' : 'tabpanel');
      figure.setAttribute('aria-labelledby', all ? 'portrait-title-' + i : tabs[i].id);
    });
  }
  function select(index, focus) {
    if (index === active && !all) return;
    stop();
    var previous = figures[active];
    var canFade = !all && !reduced.matches && previous.animate;
    active = (index + figures.length) % figures.length;
    all = false; render();
    var current = figures[active];
    if (canFade) {
      previous.hidden = false;
      previous.inert = true;
      var exit = previous.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 280, easing: 'ease-in-out' });
      var enter = current.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 280, easing: 'ease-in-out' });
      animations = [exit, enter];
      exit.finished.then(function () { if (previous !== figures[active]) previous.hidden = true; }, function () {});
    }
    if (focus) tabs[active].focus({ preventScroll: true });
  }
  tabs.forEach(function (tab, i) {
    tab.setAttribute('role', 'tab');
    tab.addEventListener('click', function () { select(i, false); });
  });
  tablist.setAttribute('role', 'tablist');
  tablist.addEventListener('keydown', function (event) {
    var i = tabs.indexOf(document.activeElement);
    if (i < 0) return;
    if (event.key === 'ArrowRight') i++;
    else if (event.key === 'ArrowLeft') i--;
    else if (event.key === 'Home') i = 0;
    else if (event.key === 'End') i = figures.length - 1;
    else return;
    event.preventDefault(); select(i, true);
  });
  room.querySelector('.portrait-previous').addEventListener('click', function () { select(active - 1, false); });
  room.querySelector('.portrait-next').addEventListener('click', function () { select(active + 1, false); });
  allButton.addEventListener('click', function () {
    stop(); all = !all; render();
    if (all) figures.forEach(function (figure) { figure.querySelector('img').loading = 'eager'; });
  });
  reduced.addEventListener('change', function () { if (reduced.matches) stop(); });
  room.classList.add('is-enhanced');
  room.querySelectorAll('[data-portrait-controls]').forEach(function (control) { control.hidden = false; });
  render();
}());
