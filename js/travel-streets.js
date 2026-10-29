/* Travel transport detail: customized OpenFreeMap vectors, with the local Japan atlas underneath. */
(function () {
  'use strict';
  window.initJapanStreets = function (map, showStatus) {
    if (!window.maplibregl || !L.maplibreGL || !window.travelMapStyle) return;
    var pane = map.createPane('atlas-detail');
    pane.style.zIndex = 250;
    pane.style.pointerEvents = 'none';
    pane.style.visibility = 'hidden';
    var detail = null;
    var ready = false;
    var warning = false;
    var deadline = null;
    function showDetail(enabled) {
      pane.style.visibility = enabled ? 'visible' : 'hidden';
      map.getContainer().classList.toggle('atlas-streets-visible', enabled);
    }
    function clearWarning() { if (warning) { showStatus(''); warning = false; } }
    function fallback() {
      if (map.getZoom() < 8 || ready) return;
      showDetail(false);
      warning = true;
      showStatus('旅行交通底图暂时无法连接，当前显示本地概览。');
    }
    function start() {
      try {
        detail = L.maplibreGL({
          pane: 'atlas-detail', style: JSON.parse(JSON.stringify(window.travelMapStyle)),
          interactive: false, renderWorldCopies: false, fadeDuration: 0,
          localIdeographFontFamily: 'Microsoft YaHei, Yu Gothic, sans-serif',
          attribution: '<a href="https://openfreemap.org/">OpenFreeMap</a> · <a href="https://openmaptiles.org/">OpenMapTiles</a> · <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        });
        // The adapter's legacy direct transform writes do not refresh all vector sources.
        // Synchronize through the supported camera API before each adapter redraw.
        detail._transformGL = function (gl) {
          var center = map.getCenter();
          gl.jumpTo({ center: [center.lng, center.lat], zoom: map.getZoom() - 1 });
        };
        detail.addTo(map);
        var gl = detail.getMaplibreMap();
        function rendered() {
          if (!gl.isStyleLoaded() || !gl.areTilesLoaded()) return;
          ready = true;
          clearTimeout(deadline);
          clearWarning();
          showDetail(map.getZoom() >= 8);
        }
        gl.on('load', rendered);
        gl.on('idle', rendered);
        gl.on('error', function () { if (!ready) fallback(); });
        deadline = setTimeout(fallback, 12000);
      } catch (error) {
        if (detail && map.hasLayer(detail)) map.removeLayer(detail);
        detail = null;
        fallback();
      }
    }
    function update() {
      if (map.getZoom() >= 8) {
        if (!detail) start();
        else if (ready) showDetail(true);
      } else {
        showDetail(false);
        clearWarning();
      }
    }
    map.on('zoomend', update);
    update();
  };
})();
