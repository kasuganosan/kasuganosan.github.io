(function () {
  'use strict';
  var reader = document.getElementById('epitaph-reader');
  if (!reader) return;
  var controls = reader.querySelector('.epitaph-controls');
  var tablist = reader.querySelector('.epitaph-tabs');
  var tabs = Array.from(reader.querySelectorAll('.epitaph-tab'));
  var panels = Array.from(reader.querySelectorAll('.epitaph-panel'));
  var contents = reader.querySelector('.epitaph-panels');
  var continuousButton = document.getElementById('epitaph-continuous');
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var active = 'poem', continuous = false, motion = null, entering = null;
  function stopMotion() {
    var old = motion; motion = null;
    if (old) old.cancel();
    if (entering) entering.classList.remove('is-entering');
    entering = null;
  }
  function fadeIn(target) {
    if (reducedMotion.matches || !target.animate) return;
    entering = target; target.classList.add('is-entering');
    var animation = target.animate([
      { opacity: 0, transform: 'translateY(6px)' },
      { opacity: 1, transform: 'translateY(0)' }
    ], { duration: 250, easing: 'cubic-bezier(.22,1,.36,1)' });
    motion = animation;
    animation.finished.then(function () {
      if (motion === animation) { motion = null; target.classList.remove('is-entering'); entering = null; }
    }, function () {});
  }
  function render(animate) {
    stopMotion();
    reader.classList.toggle('is-continuous', continuous);
    continuousButton.setAttribute('aria-pressed', String(continuous));
    tablist.setAttribute('role', continuous ? 'group' : 'tablist');
    tabs.forEach(function (tab) {
      if (continuous) {
        tab.removeAttribute('role'); tab.removeAttribute('aria-selected'); tab.tabIndex = 0;
      } else {
        tab.setAttribute('role', 'tab'); tab.setAttribute('aria-selected', String(tab.dataset.view === active));
        tab.tabIndex = tab.dataset.view === active ? 0 : -1;
      }
    });
    panels.forEach(function (panel) {
      var tab = tabs.find(function (item) { return item.dataset.view === panel.dataset.view; });
      var title = panel.querySelector('.epitaph-panel-title');
      title.id = panel.id + '-title';
      panel.hidden = !continuous && panel.dataset.view !== active;
      panel.setAttribute('role', continuous ? 'region' : 'tabpanel');
      panel.setAttribute('aria-labelledby', continuous ? title.id : tab.id);
      if (continuous) panel.removeAttribute('tabindex');
      else panel.tabIndex = 0;
    });
    if (animate) fadeIn(continuous ? contents : panels.find(function (panel) { return panel.dataset.view === active; }));
  }
  function keepReaderInView() {
    requestAnimationFrame(function () {
      if (reader.getBoundingClientRect().top < -10) reader.scrollIntoView({ block: 'start', behavior: reducedMotion.matches ? 'instant' : 'smooth' });
    });
  }
  function select(view) {
    active = view; continuous = false; render(true); keepReaderInView();
  }
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () { select(tab.dataset.view); });
  });
  tablist.addEventListener('keydown', function (event) {
    if (continuous) return;
    var index = tabs.indexOf(document.activeElement);
    if (index < 0) return;
    var next = index;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    else if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.length - 1;
    else return;
    event.preventDefault(); select(tabs[next].dataset.view); tabs[next].focus({ preventScroll: true });
  });
  continuousButton.addEventListener('click', function () {
    continuous = !continuous; render(true); keepReaderInView();
  });
  reducedMotion.addEventListener('change', function () { if (reducedMotion.matches) stopMotion(); });
  reader.classList.add('is-enhanced'); controls.hidden = false; render(false);
}());
