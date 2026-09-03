/* Add terminal labels and copy controls without changing the source snippets. */
(function () {
  'use strict';

  function fallbackCopy(text) {
    var input = document.createElement('textarea');
    input.value = text;
    input.setAttribute('readonly', '');
    input.style.position = 'fixed';
    input.style.opacity = '0';
    document.body.appendChild(input);
    input.select();
    var copied = false;
    try {
      copied = document.execCommand('copy');
    } finally {
      input.remove();
    }
    if (!copied) throw new Error('Clipboard unavailable');
  }

  document.querySelectorAll('.nas-article pre[data-code-language]').forEach(function (pre) {
    var code = pre.querySelector('code');
    if (!code) return;
    var language = pre.getAttribute('data-code-language');
    var kind = pre.getAttribute('data-code-kind');
    var wrapper = document.createElement('div');
    wrapper.className = 'code-block';
    var toolbar = document.createElement('div');
    toolbar.className = 'code-toolbar';
    var label = document.createElement('span');
    label.className = 'code-label';
    var languageLabel = document.createElement('span');
    languageLabel.textContent = language;
    label.appendChild(languageLabel);
    if (kind) {
      var kindLabel = document.createElement('span');
      kindLabel.className = 'code-kind';
      kindLabel.textContent = kind;
      label.appendChild(kindLabel);
    }
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'code-copy';
    button.textContent = '复制';
    button.setAttribute('aria-label', '复制 ' + language + ' ' + (kind || '代码'));
    button.setAttribute('aria-live', 'polite');
    toolbar.appendChild(label);
    toolbar.appendChild(button);
    pre.parentNode.insertBefore(wrapper, pre);
    wrapper.appendChild(toolbar);
    wrapper.appendChild(pre);
    pre.tabIndex = 0;
    pre.setAttribute('aria-label', language + ' ' + (kind || '代码') + '，可横向滚动');

    var resetTimer;
    button.addEventListener('click', async function () {
      clearTimeout(resetTimer);
      try {
        if (navigator.clipboard && window.isSecureContext) {
          try {
            await navigator.clipboard.writeText(code.textContent);
          } catch (_) {
            fallbackCopy(code.textContent);
          }
        } else {
          fallbackCopy(code.textContent);
        }
        button.textContent = '已复制';
      } catch (_) {
        var range = document.createRange();
        range.selectNodeContents(code);
        var selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        button.textContent = '请手动复制';
      }
      button.focus({ preventScroll: true });
      resetTimer = setTimeout(function () { button.textContent = '复制'; }, 2200);
    });
  });
})();
