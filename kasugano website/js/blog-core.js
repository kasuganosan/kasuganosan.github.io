/**
 * blog-core.js — 博客增强功能
 * 暗色模式 / 阅读进度 / 返回顶部 / 目录生成 / 阅读时间
 * 搜索 / 相关文章 / 分享按钮 / 分页
 * 纯原生 JS，无 jQuery 依赖
 */
(function () {
  'use strict';

  /* ================================================================
     1. 暗色模式 (Dark Mode Toggle)
     ================================================================ */
  function initThemeToggle() {
    var toggle = document.getElementById('theme-toggle');
    if (!toggle) return;

    // 读取保存的主题
    var saved = localStorage.getItem('theme');
    if (saved === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      updateToggleIcon(toggle, true);
    }

    toggle.addEventListener('click', function () {
      var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      if (isDark) {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
      } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
      }
      updateToggleIcon(toggle, !isDark);
    });
  }

  function updateToggleIcon(toggle, isDark) {
    var icon = toggle.querySelector('i');
    if (icon) {
      icon.className = isDark ? 'fa fa-sun-o' : 'fa fa-moon-o';
    }
    toggle.setAttribute('aria-label', isDark ? '切换亮色主题' : '切换暗色主题');
  }


  /* ================================================================
     2. 阅读进度条 (Reading Progress Bar)
     ================================================================ */
  function initProgressBar() {
    var bar = document.getElementById('progress-bar');
    if (!bar) return;

    var ticking = false;
    window.addEventListener('scroll', function () {
      if (!ticking) {
        requestAnimationFrame(function () {
          updateProgressBar(bar);
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });

    // 初始更新
    updateProgressBar(bar);
  }

  function updateProgressBar(bar) {
    var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    var docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    if (docHeight <= 0) {
      bar.style.width = '0%';
      return;
    }
    var progress = Math.min((scrollTop / docHeight) * 100, 100);
    bar.style.width = progress + '%';
  }


  /* ================================================================
     3. 返回顶部按钮 (Back to Top)
     ================================================================ */
  function initBackToTop() {
    var btn = document.getElementById('back-to-top');
    if (!btn) return;

    var ticking = false;
    window.addEventListener('scroll', function () {
      if (!ticking) {
        requestAnimationFrame(function () {
          var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          if (scrollTop > 400) {
            btn.classList.add('visible');
          } else {
            btn.classList.remove('visible');
          }
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });

    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }


  /* ================================================================
     4. 目录生成 (Table of Contents)
     ================================================================ */
  function initTOC() {
    var tocNav = document.querySelector('.toc-nav');
    var postContent = document.querySelector('.post-content');
    if (!tocNav || !postContent) return;

    var headings = postContent.querySelectorAll('h2, h3');
    if (headings.length < 2) {
      // 少于2个标题就隐藏目录
      var tocContainer = document.querySelector('.toc-container');
      if (tocContainer) tocContainer.style.display = 'none';
      return;
    }

    var list = document.createElement('ul');
    list.style.listStyle = 'none';
    list.style.paddingLeft = '0';

    headings.forEach(function (h, index) {
      // 给每个标题加上 id
      var id = 'section-' + index;
      h.id = id;

      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = '#' + id;
      a.textContent = h.textContent;
      a.className = h.tagName === 'H3' ? 'toc-h3' : '';
      a.addEventListener('click', function (e) {
        e.preventDefault();
        h.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // 更新激活状态
        document.querySelectorAll('.toc-nav a').forEach(function (el) { el.classList.remove('active'); });
        a.classList.add('active');
      });
      li.appendChild(a);
      list.appendChild(li);
    });

    tocNav.appendChild(list);

    // 使用 IntersectionObserver 高亮当前章节
    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var id = entry.target.id;
            document.querySelectorAll('.toc-nav a').forEach(function (a) {
              a.classList.remove('active');
              if (a.getAttribute('href') === '#' + id) {
                a.classList.add('active');
              }
            });
          }
        });
      }, { rootMargin: '-80px 0px -60% 0px' });

      headings.forEach(function (h) { observer.observe(h); });
    }
  }


  /* ================================================================
     5. 阅读时间 (Reading Time)
     ================================================================ */
  function initReadingTime() {
    var badge = document.querySelector('.reading-time');
    var postContent = document.querySelector('.post-content');
    if (!badge || !postContent) return;

    var text = postContent.textContent || postContent.innerText || '';
    // 中文字符按词计算，英文按空格分词
    var chineseChars = (text.match(/[一-鿿㐀-䶿]/g) || []).length;
    var nonChinese = text.replace(/[一-鿿㐀-䶿]/g, ' ');
    var words = nonChinese.split(/\s+/).filter(function (w) { return w.length > 0; }).length;
    var totalWords = chineseChars + words;
    // 中文阅读速度约 400 字/分钟，英文约 200 词/分钟
    var minutes = Math.max(1, Math.ceil(totalWords / 400));
    badge.textContent = '⏱ ' + minutes + ' 分钟阅读';
  }


  /* ================================================================
     6. 搜索 (Search)
     ================================================================ */
  var searchIndex = null;
  var fuse = null;

  function initSearch() {
    // 内联搜索框（用于 archive 页面）
    var inlineInput = document.getElementById('inline-search-input');
    if (inlineInput) {
      loadSearchIndex(function () {
        inlineInput.addEventListener('input', function () {
          inlineSearch(inlineInput.value);
        });
        inlineInput.addEventListener('keydown', function (e) {
          if (e.key === 'Escape') {
            inlineInput.value = '';
            inlineSearch('');
            inlineInput.blur();
          }
        });
      });
    }

    // 搜索覆盖层（全站通用）
    var searchToggle = document.getElementById('search-toggle');
    var searchOverlay = document.getElementById('search-overlay');
    var searchInput = document.getElementById('search-input');
    var searchResults = document.getElementById('search-results');
    var searchClose = document.getElementById('search-close');

    if (!searchToggle || !searchOverlay || !searchInput || !searchResults) return;

    var body = document.body;

    searchToggle.addEventListener('click', function () {
      loadSearchIndex(function () {
        searchOverlay.classList.add('open');
        body.classList.add('search-open');
        setTimeout(function () { searchInput.focus(); }, 150);
      });
    });

    if (searchClose) {
      searchClose.addEventListener('click', closeSearch);
    }

    // ESC 关闭
    searchOverlay.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeSearch();
    });

    // 点击背景关闭
    searchOverlay.addEventListener('click', function (e) {
      if (e.target === searchOverlay) closeSearch();
    });

    searchInput.addEventListener('input', function () {
      var query = searchInput.value.trim();
      if (!query) {
        searchResults.innerHTML = '';
        return;
      }
      if (!fuse) return;
      var results = fuse.search(query).slice(0, 12);
      if (results.length === 0) {
        searchResults.innerHTML = '<div class="search-empty">没有找到相关文章</div>';
        return;
      }
      var html = '';
      results.forEach(function (r) {
        var item = r.item || r;
        html += '<a href="' + item.url + '" class="search-result-item fade-in">' +
          '<div class="search-result-title">' + escapeHtml(item.title) + '</div>' +
          '<div class="search-result-meta">' + escapeHtml(item.category || '') + ' &middot; ' + escapeHtml(item.date || '') + '</div>' +
          '<div class="search-result-excerpt">' + escapeHtml(item.excerpt || '') + '</div>' +
          '</a>';
      });
      searchResults.innerHTML = html;
    });

    function closeSearch() {
      searchOverlay.classList.remove('open');
      body.classList.remove('search-open');
      searchInput.value = '';
      searchResults.innerHTML = '';
    }
  }

  function loadSearchIndex(callback) {
    if (searchIndex) {
      if (!fuse && typeof Fuse !== 'undefined') {
        fuse = new Fuse(searchIndex, { keys: ['title', 'excerpt', 'category', 'tags'], threshold: 0.35, includeScore: true });
      }
      callback();
      return;
    }

    // 确定搜索索引路径
    var basePath = '';
    var scripts = document.querySelectorAll('script[src]');
    for (var i = 0; i < scripts.length; i++) {
      var src = scripts[i].getAttribute('src');
      if (src && src.indexOf('blog-core.js') !== -1) {
        basePath = src.replace('js/blog-core.js', '');
        break;
      }
    }

    var xhr = new XMLHttpRequest();
    xhr.open('GET', basePath + 'search-index.json', true);
    xhr.onload = function () {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          searchIndex = JSON.parse(xhr.responseText);
          if (typeof Fuse !== 'undefined') {
            fuse = new Fuse(searchIndex, { keys: ['title', 'excerpt', 'category', 'tags'], threshold: 0.35, includeScore: true });
          }
        } catch (e) {
          searchIndex = [];
        }
      }
      callback();
    };
    xhr.onerror = function () { searchIndex = []; callback(); };
    xhr.send();
  }

  function inlineSearch(query) {
    var resultsContainer = document.getElementById('inline-search-results');
    if (!resultsContainer) return;
    if (!query) {
      resultsContainer.innerHTML = '';
      // 显示分类网格
      var grid = document.querySelector('.category-grid');
      if (grid) grid.style.display = '';
      return;
    }
    // 隐藏分类网格
    var grid = document.querySelector('.category-grid');
    if (grid) grid.style.display = 'none';

    if (!fuse) return;
    var results = fuse.search(query).slice(0, 15);
    if (results.length === 0) {
      resultsContainer.innerHTML = '<p style="text-align:center;color:var(--muted);padding:24px;">未找到匹配文章</p>';
      return;
    }
    var html = '';
    results.forEach(function (r) {
      var item = r.item || r;
      html += '<a href="' + item.url + '" class="search-result-item fade-in">' +
        '<div class="search-result-title">' + escapeHtml(item.title) + '</div>' +
        '<div class="search-result-meta">' + escapeHtml(item.category || '') + ' &middot; ' + escapeHtml(item.date || '') + '</div>' +
        '</a>';
    });
    resultsContainer.innerHTML = html;
  }

  function escapeHtml(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }


  /* ================================================================
     7. 相关文章 (Related Posts)
     ================================================================ */
  function initRelatedPosts() {
    var container = document.querySelector('.related-posts');
    if (!container) return;

    var articleId = container.getAttribute('data-article');
    if (!articleId) return;

    // 从 data 属性中读取当前文章的元数据
    var postContent = document.querySelector('.post-content');
    var category = postContent ? postContent.getAttribute('data-category') : '';
    var tags = postContent ? postContent.getAttribute('data-tags') : '';

    if (!searchIndex) {
      loadSearchIndex(function () { renderRelated(container, articleId, category, tags); });
    } else {
      renderRelated(container, articleId, category, tags);
    }
  }

  function renderRelated(container, currentId, category, tags) {
    if (!searchIndex || searchIndex.length === 0) {
      container.innerHTML = '<p style="text-align:center;color:var(--muted);">暂无推荐</p>';
      return;
    }

    // 基于分类和标签的相关性评分
    var currentTags = (tags || '').split(',').map(function (t) { return t.trim(); }).filter(Boolean);
    var scored = searchIndex
      .filter(function (a) { return a.id !== currentId; })
      .map(function (a) {
        var score = 0;
        if (a.category === category) score += 3;
        var articleTags = (a.tags || []).map(function (t) { return t.trim(); });
        currentTags.forEach(function (t) {
          if (articleTags.indexOf(t) !== -1) score += 2;
        });
        // 加入一些随机性以避免每次都一样
        score += Math.random() * 1.5;
        return { article: a, score: score };
      })
      .sort(function (a, b) { return b.score - a.score; })
      .slice(0, 3);

    if (scored.length === 0) {
      // 返回最近的文章
      scored = searchIndex
        .filter(function (a) { return a.id !== currentId; })
        .sort(function (a, b) { return (b.date || '').localeCompare(a.date || ''); })
        .slice(0, 3)
        .map(function (a) { return { article: a, score: 0 }; });
    }

    var html = '';
    scored.forEach(function (s) {
      var a = s.article;
      html += '<div class="col-sm-4">' +
        '<div class="post fade-in">' +
        (a.image ? '<div class="image"><a href="' + a.url + '"><img src="' + a.image + '" alt="" class="img-responsive"></a></div>' : '') +
        '<h3><a href="' + a.url + '">' + escapeHtml(a.title) + '</a></h3>' +
        '<p class="post__intro">' + escapeHtml(a.excerpt || '') + '</p>' +
        '<p class="read-more"><a href="' + a.url + '" class="btn btn-ghost">続き読む</a></p>' +
        '</div>' +
        '</div>';
    });
    container.innerHTML = html;
  }


  /* ================================================================
     8. 分享按钮 (Share Buttons)
     ================================================================ */
  function initShareButtons() {
    var buttons = document.querySelectorAll('.share-btn');
    if (buttons.length === 0) return;

    var url = encodeURIComponent(window.location.href);
    var title = encodeURIComponent(document.title);

    buttons.forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        var platform = btn.getAttribute('data-platform');
        var shareUrl;

        switch (platform) {
          case 'twitter':
            shareUrl = 'https://twitter.com/intent/tweet?url=' + url + '&text=' + title;
            break;
          case 'weibo':
            shareUrl = 'https://service.weibo.com/share/share.php?url=' + url + '&title=' + title;
            break;
          case 'copy':
            copyToClipboard(window.location.href, btn);
            return;
          default:
            return;
        }

        if (shareUrl) {
          window.open(shareUrl, '_blank', 'width=600,height=400,noopener');
        }
      });
    });
  }

  function copyToClipboard(text, btn) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        showCopySuccess(btn);
      }).catch(function () {
        fallbackCopy(text, btn);
      });
    } else {
      fallbackCopy(text, btn);
    }
  }

  function fallbackCopy(text, btn) {
    var textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      showCopySuccess(btn);
    } catch (e) {
      // 复制失败，静默处理
    }
    document.body.removeChild(textarea);
  }

  function showCopySuccess(btn) {
    btn.classList.add('copy-success');
    var originalTitle = btn.getAttribute('title') || '';
    btn.setAttribute('title', '已复制!');
    setTimeout(function () {
      btn.classList.remove('copy-success');
      btn.setAttribute('title', originalTitle);
    }, 1500);
  }


  /* ================================================================
     9. 首页分页 (Pagination) — 基于行 (row-based)
     ================================================================ */
  function initPagination() {
    var wrapper = document.querySelector('.pagination-wrapper');
    if (!wrapper) return;

    // 找到 articles-container 内的所有 row 元素
    var rows = document.querySelectorAll('.articles-container .row');
    if (rows.length === 0) return;

    var rowsPerPage = 3; // 每页 3 行（第一行2个宽卡片 + 后面2行各3个 = 8卡片，视觉平衡）
    var totalPages = Math.ceil(rows.length / rowsPerPage);
    if (totalPages <= 1) {
      wrapper.style.display = 'none';
      return;
    }

    var currentPage = 1;

    function showPage(page) {
      currentPage = page;

      rows.forEach(function (row, i) {
        var rowStart = (page - 1) * rowsPerPage;
        var rowEnd = rowStart + rowsPerPage - 1;
        if (i >= rowStart && i <= rowEnd) {
          row.style.display = '';
        } else {
          row.style.display = 'none';
        }
      });

      // 更新分页按钮状态
      var buttons = wrapper.querySelectorAll('.pagination-btn');
      buttons.forEach(function (btn) {
        btn.classList.remove('active');
        if (parseInt(btn.getAttribute('data-page')) === page) {
          btn.classList.add('active');
        }
      });

      // 滚动到文章区域
      var container = document.querySelector('.articles-container');
      if (container && page > 1) {
        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }

    // 构建分页按钮
    var paginationHtml = '';
    paginationHtml += '<button class="pagination-btn" data-page="prev" aria-label="上一页">&laquo;</button>';
    for (var p = 1; p <= totalPages; p++) {
      paginationHtml += '<button class="pagination-btn' + (p === 1 ? ' active' : '') + '" data-page="' + p + '">' + p + '</button>';
    }
    paginationHtml += '<button class="pagination-btn" data-page="next" aria-label="下一页">&raquo;</button>';
    wrapper.innerHTML = paginationHtml;

    // 初始显示第一页
    showPage(1);

    // 事件委托
    wrapper.addEventListener('click', function (e) {
      var btn = e.target.closest('.pagination-btn');
      if (!btn) return;
      var page = btn.getAttribute('data-page');
      if (page === 'prev') {
        if (currentPage > 1) showPage(currentPage - 1);
      } else if (page === 'next') {
        if (currentPage < totalPages) showPage(currentPage + 1);
      } else {
        showPage(parseInt(page));
      }
    });
  }


  /* ================================================================
     10. 标签过滤 (Tag Filter)
     ================================================================ */
  function initTagFilter() {
    var tagCloud = document.querySelector('.tag-cloud');
    if (!tagCloud) return;

    var pills = tagCloud.querySelectorAll('.tag-pill');
    var activeTag = null;

    pills.forEach(function (pill) {
      pill.addEventListener('click', function () {
        var tag = pill.getAttribute('data-tag');

        if (activeTag === tag) {
          // 取消选择
          activeTag = null;
          pills.forEach(function (p) { p.classList.remove('active'); });
          filterCategoriesByTag(null);
        } else {
          activeTag = tag;
          pills.forEach(function (p) { p.classList.remove('active'); });
          pill.classList.add('active');
          filterCategoriesByTag(tag);
        }
      });
    });
  }

  function filterCategoriesByTag(tag) {
    var cards = document.querySelectorAll('.category-card');
    cards.forEach(function (card) {
      var items = card.querySelectorAll('li');
      var hasVisible = false;
      items.forEach(function (item) {
        if (!tag || item.getAttribute('data-tags') === null) {
          item.style.display = tag ? 'none' : '';
          return;
        }
        var itemTags = (item.getAttribute('data-tags') || '').split(',');
        var match = itemTags.some(function (t) { return t.trim() === tag; });
        item.style.display = (tag && !match) ? 'none' : '';
        if (match || !tag) hasVisible = true;
      });
      // 如果分类下没有可见条目就隐藏分类
      card.style.display = (!tag || hasVisible) ? '' : 'none';
    });
  }


  /* ================================================================
     初始化
     ================================================================ */
  function init() {
    initThemeToggle();
    initProgressBar();
    initBackToTop();
    initTOC();
    initReadingTime();
    initSearch();
    initRelatedPosts();
    initShareButtons();
    initPagination();
    initTagFilter();
  }

  // DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
