/* Local cartographic layers. Coordinates come from Natural Earth; see vendor/natural-earth/SOURCE.md. */
(function () {
  'use strict';
  window.createJapanBasemap = function (map, showStatus) {
    function pane(name, order) {
      map.createPane(name).style.zIndex = order;
    }
    pane('atlas-land', 150);
    pane('atlas-urban', 153);
    pane('atlas-water', 155);
    pane('atlas-borders', 157);
    pane('atlas-road-casing', 170);
    pane('atlas-roads', 171);
    pane('atlas-labels', 350);
    map.getPane('atlas-labels').style.pointerEvents = 'none';
    var empty = { type: 'FeatureCollection', features: [] };
    var land = L.geoJSON(window.travelJapan || empty, {
      pane: 'atlas-land', interactive: false,
      style: { color: '#a8b6b5', weight: 0.7, fillColor: '#edf2e7', fillOpacity: 1 }
    }).addTo(map);
    var data = window.travelJapanDetail;
    if (!data) {
      if (window.travelJapan) showStatus('县界与城市数据未能加载，当前显示日本基础地图。');
      return land;
    }
    function layer(collection, name, style, interactive) {
      return L.geoJSON(collection, { pane: name, style: style, interactive: !!interactive });
    }
    var urban = layer(data.urban, 'atlas-urban', { stroke: false, fillColor: '#e3e7e5', fillOpacity: 0.95 });
    var lakes = layer(data.lakes, 'atlas-water', { color: '#9fc4e3', weight: 0.6, fillColor: '#b8d5ed', fillOpacity: 1 }).addTo(map);
    var rivers = layer(data.rivers, 'atlas-water', { color: '#a5c8e4', weight: 0.9, opacity: 0.9 }).addTo(map);
    var borders = layer(data.prefectures, 'atlas-borders', { color: '#91a095', weight: 0.8, dashArray: '3 3', fill: false }, true).addTo(map);
    borders.eachLayer(function (prefecture) {
      prefecture.bindTooltip(prefecture.feature.properties.name, { sticky: true, className: 'atlas-pref-tooltip' });
      prefecture.on('click', function () { map.fitBounds(prefecture.getBounds(), { padding: [40, 40], maxZoom: 8.5 }); });
    });
    var roadCasing = layer(data.roads, 'atlas-road-casing', { color: '#fff', weight: 3, opacity: 0.95, lineCap: 'round' });
    var roads = layer(data.roads, 'atlas-roads', { color: '#f1cb7f', weight: 1.4, opacity: 0.95, lineCap: 'round' });
    var labels = L.layerGroup().addTo(map);
    function visible(layer, enabled) {
      if (enabled && !map.hasLayer(layer)) layer.addTo(map);
      else if (!enabled && map.hasLayer(layer)) map.removeLayer(layer);
    }
    function intersects(a, b) {
      return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    }
    function drawLabels() {
      labels.clearLayers();
      var zoom = map.getZoom();
      var size = map.getSize();
      var candidates = [];
      data.prefectures.features.forEach(function (feature) {
        if (zoom < 4.25) return;
        var info = feature.properties;
        candidates.push({ name: info.name, at: info.label, kind: 'pref', priority: zoom >= 6 ? 100 : 40, font: zoom >= 6 ? 12 : 11 });
      });
      var cityList = zoom >= 7 && window.travelPlaces ? window.travelPlaces.filter(function (place) { return place.kind === 'city'; }) : data.cities;
      cityList.forEach(function (city) {
        var threshold = zoom < 5 ? 2000000 : zoom < 6 ? 600000 : 0;
        if (zoom < 4.25 || city.population < threshold) return;
        candidates.push({ name: city.name, at: city.label, kind: 'city', major: city.population >= 2000000,
          priority: 60 + Math.log10(Math.max(city.population, 1)), font: city.population >= 2000000 ? 13 : 11 });
      });
      candidates.sort(function (a, b) { return b.priority - a.priority; });
      var occupied = [];
      candidates.forEach(function (place) {
        var point = map.latLngToContainerPoint(place.at);
        if (point.x < -30 || point.y < -30 || point.x > size.x + 30 || point.y > size.y + 30) return;
        var width = place.name.length * (place.font + (place.kind === 'pref' ? 1 : 0));
        var offsets = place.kind === 'pref' ? [[-width / 2, -8]] : [[9, -9], [9, 7], [-width - 9, -9], [-width - 9, 7]];
        var position = null;
        for (var i = 0; i < offsets.length; i++) {
          var box = { x: point.x + offsets[i][0] - 4, y: point.y + offsets[i][1] - 3, w: width + 8, h: 21 };
          if (!occupied.some(function (other) { return intersects(box, other); })) { position = offsets[i]; occupied.push(box); break; }
        }
        if (!position) return;
        var content = document.createElement('div');
        if (place.kind === 'city') {
          var dot = document.createElement('span');
          dot.className = 'atlas-city-dot' + (place.major ? ' major' : '');
          content.appendChild(dot);
        }
        var text = document.createElement('span');
        text.className = place.kind === 'pref' ? 'atlas-pref-name' : 'atlas-city-name' + (place.major ? ' major' : '');
        text.textContent = place.name;
        text.style.left = position[0] + 'px';
        text.style.top = position[1] + 'px';
        text.style.fontSize = place.font + 'px';
        content.appendChild(text);
        L.marker(place.at, { pane: 'atlas-labels', interactive: false, keyboard: false,
          icon: L.divIcon({ className: 'atlas-place-label', html: content, iconSize: [0, 0], iconAnchor: [0, 0] }) }).addTo(labels);
      });
    }
    function update() {
      var zoom = map.getZoom();
      visible(urban, zoom >= 5.5);
      visible(roadCasing, zoom >= 5.75);
      visible(roads, zoom >= 5.75);
      roadCasing.setStyle({ weight: zoom >= 8 ? 4 : 2.8 });
      roads.setStyle({ weight: zoom >= 8 ? 2.3 : 1.3 });
      borders.setStyle({ weight: zoom >= 7 ? 1.2 : 0.8, opacity: zoom >= 7 ? 0.85 : 0.65 });
      rivers.setStyle({ weight: zoom >= 8 ? 1.4 : 0.8 });
      drawLabels();
    }
    map.on('moveend zoomend resize', update);
    update();
    document.querySelectorAll('[data-atlas-city]').forEach(function (button) {
      button.addEventListener('click', function () {
        var city = data.cities.find(function (item) { return item.name === button.getAttribute('data-atlas-city'); });
        if (city) map.setView(city.label, 8, { animate: false });
      });
    });
    return land;
  };
})();
