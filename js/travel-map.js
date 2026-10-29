/* Japanese photo atlas: local overview and online OpenFreeMap transport detail. */
(function () {
  'use strict';
  var status = document.getElementById('atlas-status');
  function showStatus(message) {
    status.textContent = message;
    status.hidden = !message;
  }
  if (!window.L) {
    showStatus('地图暂时无法加载，请稍后刷新页面。');
    document.getElementById('atlas-japan').disabled = true;
    return;
  }
  // Map views are not visited places. Only photo records create markers.
  var homeView = { center: [36, 138], zoom: 4 };
  var map = L.map('travel-map', {
    scrollWheelZoom: true, minZoom: 3, maxZoom: 18, zoomSnap: 0.25, zoomDelta: 0.5,
    maxBounds: [[20, 120], [48, 156]], maxBoundsViscosity: 0.8
  });
  map.setView(homeView.center, homeView.zoom);
  if (!window.travelJapan) {
    showStatus('基础地图文件未能加载，请检查网站文件是否完整。');
  }
  var land = window.createJapanBasemap(map, showStatus);
  map.attributionControl.addAttribution('<a href="https://www.naturalearthdata.com/">Natural Earth</a>');
  map.attributionControl.addAttribution('<a href="https://www.geonames.org/">GeoNames</a>');
  if (window.initJapanStreets) window.initJapanStreets(map, showStatus);
  if (window.initJapanPlaceSearch) window.initJapanPlaceSearch(map);
  L.control.scale({ imperial: false, position: 'bottomright' }).addTo(map);
  function imagePath(value) {
    if (typeof value !== 'string' || !value.trim()) return '';
    try {
      var url = new URL(value, document.baseURI);
      return /^(https?:|file:)$/.test(url.protocol) ? url.href : '';
    } catch (e) { return ''; }
  }
  var input = (Array.isArray(window.travelPhotos) ? window.travelPhotos : [])
    .concat(Array.isArray(window.travelCloudinaryPhotos) ? window.travelCloudinaryPhotos : []);
  var places = input.reduce(function (valid, place) {
    if (!place || typeof place.lat !== 'number' || !Number.isFinite(place.lat) || Math.abs(place.lat) > 85 ||
        typeof place.lng !== 'number' || !Number.isFinite(place.lng) || Math.abs(place.lng) > 180 || !Array.isArray(place.photos)) return valid;
    var photos = place.photos.filter(function (photo) { return photo && imagePath(photo.src); });
    if (photos.length) valid.push({ title: String(place.title || '未命名地点'), region: String(place.region || ''), lat: place.lat, lng: place.lng, photos: photos });
    return valid;
  }, []);
  var fitButton = document.getElementById('atlas-fit');
  document.getElementById('atlas-place-count').textContent = places.length;
  document.getElementById('atlas-photo-count').textContent = places.reduce(function (count, place) { return count + place.photos.length; }, 0);
  fitButton.disabled = !places.length;
  var viewer = document.getElementById('atlas-viewer');
  var photoImage = document.getElementById('atlas-photo');
  var photoError = document.getElementById('atlas-photo-error');
  var prevButton = document.getElementById('atlas-prev');
  var nextButton = document.getElementById('atlas-next');
  var selectedPlace = null;
  var selectedIndex = 0;
  photoImage.addEventListener('error', function () { photoImage.hidden = true; photoError.hidden = false; });
  function renderPhoto() {
    var photo = selectedPlace.photos[selectedIndex];
    photoError.hidden = true;
    photoImage.hidden = false;
    photoImage.alt = photo.alt || photo.caption || selectedPlace.title;
    photoImage.src = imagePath(photo.src);
    document.getElementById('atlas-viewer-title').textContent = photo.atlasPlaceTitle || selectedPlace.title;
    document.getElementById('atlas-photo-caption').textContent = photo.caption || '';
    document.getElementById('atlas-photo-meta').textContent = [photo.atlasPlaceRegion || selectedPlace.region, photo.date, (selectedIndex + 1) + ' / ' + selectedPlace.photos.length].filter(Boolean).join(' · ');
    prevButton.disabled = selectedIndex === 0;
    nextButton.disabled = selectedIndex === selectedPlace.photos.length - 1;
  }
  function openPhotos(place) {
    selectedPlace = place;
    selectedIndex = 0;
    renderPhoto();
    viewer.showModal();
  }
  function stepPhoto(direction) {
    if (!selectedPlace) return;
    selectedIndex = Math.max(0, Math.min(selectedPlace.photos.length - 1, selectedIndex + direction));
    renderPhoto();
  }
  prevButton.addEventListener('click', function () { stepPhoto(-1); });
  nextButton.addEventListener('click', function () { stepPhoto(1); });
  document.getElementById('atlas-viewer-close').addEventListener('click', function () { viewer.close(); });
  viewer.addEventListener('click', function (event) {
    var box = viewer.getBoundingClientRect();
    if (event.target === viewer && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)) viewer.close();
  });
  document.addEventListener('keydown', function (event) {
    if (!viewer.open) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      stepPhoto(event.key === 'ArrowLeft' ? -1 : 1);
    }
  });
  function accessibleMarker(marker, action) {
    marker.on('click', action);
    marker.on('add', function () {
      var element = marker.getElement();
      element.setAttribute('aria-label', marker.options.title);
      // Leaflet handles Enter; add Space for button-style keyboard access.
      element.addEventListener('keydown', function (event) {
        if (event.key === ' ') {
          event.preventDefault();
          event.stopPropagation();
          action();
        }
      });
    });
    return marker;
  }
  function createPhotoMarker(place) {
    var frame = document.createElement('div');
    frame.className = 'photo-pin-frame';
    var image = document.createElement('img');
    image.alt = '';
    image.src = imagePath(place.photos[0].thumbnail) || imagePath(place.photos[0].src);
    image.addEventListener('error', function () {
      if (image.dataset.retried !== 'true') {
        image.dataset.retried = 'true';
        image.src = imagePath(place.photos[0].src);
      } else {
        var fallback = document.createElement('span');
        fallback.className = 'photo-pin-fallback';
        fallback.textContent = '▧';
        image.replaceWith(fallback);
      }
    });
    frame.appendChild(image);
    var marker = L.marker([place.lat, place.lng], {
      icon: L.divIcon({ className: 'photo-pin', html: frame, iconSize: [64, 77], iconAnchor: [32, 77] }),
      title: place.title, alt: place.title,
      pane: 'atlas-photos', riseOnHover: true, keyboard: true
    });
    return accessibleMarker(marker, function () { openGroup(marker.atlasGroup); });
  }
  var photoPane = map.createPane('atlas-photos');
  photoPane.style.zIndex = 600;
  var photoLayer = L.layerGroup().addTo(map);
  var photoMarkers = new Map();
  function groupCenter(group) {
    // Keep each representative photo pinned to its actual shooting location.
    var place = group.members[0];
    group.latlng = L.latLng(place.lat, place.lng);
    group.point = map.project(group.latlng, map.getZoom());
  }
  function groupBox(group) {
    var p = group.point;
    // Leave room for the photo frame, pointer, hover scale and a small gap.
    return { left: p.x - 40, right: p.x + 40, top: p.y - 85, bottom: p.y + 8 };
  }
  function openGroup(group) {
    if (group.members.length === 1) {
      openPhotos(group.members[0]);
      return;
    }
    if (map.getZoom() < map.getMaxZoom()) {
      var bounds = L.latLngBounds(group.members.map(function (place) { return [place.lat, place.lng]; }));
      var zoom = Math.min(map.getMaxZoom(), Math.max(map.getZoom() + 2, map.getBoundsZoom(bounds, false, L.point(110, 110))));
      map.setView(bounds.getCenter(), zoom);
      return;
    }
    // Co-located photos remain accessible even when they cannot separate on screen.
    openPhotos({ title: '附近的照片', region: '', photos: group.members.reduce(function (all, place) {
      return all.concat(place.photos.map(function (photo) {
        return Object.assign({}, photo, { atlasPlaceTitle: place.title, atlasPlaceRegion: place.region });
      }));
    }, []) });
  }
  function renderPhotoMarkers() {
    var groups = places.map(function (place) {
      var group = { members: [place] };
      groupCenter(group);
      return group;
    });
    // Show one representative image for each overlapping screen footprint.
    // As the map grows, nearby photos separate and more images can be displayed.
    var merged = true;
    while (merged) {
      merged = false;
      for (var i = 0; i < groups.length && !merged; i++) {
        var a = groupBox(groups[i]);
        for (var j = i + 1; j < groups.length; j++) {
          var b = groupBox(groups[j]);
          if (a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top) {
            groups[i].members = groups[i].members.concat(groups[j].members);
            groups.splice(j, 1);
            groupCenter(groups[i]);
            merged = true;
            break;
          }
        }
      }
    }
    photoLayer.clearLayers();
    var visibleBounds = map.getBounds().pad(.2);
    groups.forEach(function (group) {
      if (!visibleBounds.contains(group.latlng)) return;
      var place = group.members[0];
      if (!photoMarkers.has(place)) photoMarkers.set(place, createPhotoMarker(place));
      var marker = photoMarkers.get(place);
      marker.atlasGroup = group;
      marker.options.title = place.title + (group.members.length > 1 ? ' · 点击放大查看更多照片' : '');
      photoLayer.addLayer(marker);
    });
    photoPane.style.visibility = '';
  }
  map.on('zoomstart', function () { photoPane.style.visibility = 'hidden'; });
  map.on('zoomend moveend resize', renderPhotoMarkers);
  function fitPhotos() {
    if (places.length) map.fitBounds(places.map(function (place) { return [place.lat, place.lng]; }), { padding: [65, 85], maxZoom: 10, animate: false });
    else fitJapan();
  }
  function fitJapan() {
    if (land.getBounds().isValid()) map.fitBounds(land.getBounds(), { padding: [30, 30], maxZoom: 5, animate: false });
    else map.setView(homeView.center, homeView.zoom, { animate: false });
  }
  fitButton.addEventListener('click', fitPhotos);
  document.getElementById('atlas-japan').addEventListener('click', fitJapan);
  document.querySelectorAll('[data-atlas-province]').forEach(function (button) {
    button.addEventListener('click', function () {
      if (button.dataset.bounds) {
        var bounds = button.dataset.bounds.split(',').map(Number);
        if (bounds.length === 4 && bounds.every(Number.isFinite)) {
          map.fitBounds([[bounds[0], bounds[1]], [bounds[2], bounds[3]]], {
            padding: [40, 55], maxZoom: Number(button.dataset.zoom), animate: false
          });
          return;
        }
      }
      map.setView([Number(button.dataset.lat), Number(button.dataset.lng)], Number(button.dataset.zoom));
    });
  });
  map.invalidateSize();
  fitPhotos();
  renderPhotoMarkers();
})();
