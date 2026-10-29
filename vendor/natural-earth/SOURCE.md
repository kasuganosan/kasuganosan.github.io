# Natural Earth local Japan basemap and detail layers

- Source repository: https://github.com/nvkelso/natural-earth-vector/tree/master/geojson
- Layers: `ne_10m_admin_1_states_provinces`, `ne_10m_populated_places`, `ne_10m_roads`, `ne_10m_rivers_lake_centerlines`, `ne_10m_lakes`, `ne_10m_urban_areas`.
- License: public domain, https://www.naturalearthdata.com/about/terms-of-use/
- Retrieved: 2026-10-28.

`japan.js` contains the dissolved Japanese prefecture outline. `japan-detail.js` contains 47 prefectures, 69 populated places, 398 road features, 3 river features, 1 lake feature and 259 urban features. Source geometries are clipped to Japan and simplified, and coordinates rounded to five decimal places. Prefecture label anchors are computed inside the largest polygon. City labels use Japanese source names. Data is wrapped as JavaScript variables so it works when opening the page directly from disk, without a fetch request or a server.

These generalized overview layers are not a complete street or building database and should not be used for navigation. There are no online tile requests, Google Maps services or map API keys. The map and photo markers work with local files and with a static web server.
