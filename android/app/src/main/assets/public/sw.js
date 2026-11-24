/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-53feb3a3'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();
  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "pwa-maskable-512x512.png",
    "revision": "cb1158761d413a4a1437662c962905c1"
  }, {
    "url": "pwa-512x512.png",
    "revision": "2d305f11184fc09212199905386e37db"
  }, {
    "url": "pwa-192x192.png",
    "revision": "73479eebedc8dc1855214f70f599d27a"
  }, {
    "url": "mangorema-logo.jpg",
    "revision": "387dd1d18752d6221123bed3dc79f9af"
  }, {
    "url": "mangorema-full-logo.svg",
    "revision": "3d931ac1fe136de0d3b4cfba854690a3"
  }, {
    "url": "logo.jpg",
    "revision": "387dd1d18752d6221123bed3dc79f9af"
  }, {
    "url": "index.html",
    "revision": "c8c9705bd09e424dbab297753fbf7274"
  }, {
    "url": "icon.svg",
    "revision": "343b110dd1c3120aed6c348497b157c4"
  }, {
    "url": "favicon.ico",
    "revision": "387dd1d18752d6221123bed3dc79f9af"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "b9deffe01e4382f1aa8ce8e26f326399"
  }, {
    "url": "assets/workbox-window.prod.es5-Bd17z0YL.js",
    "revision": null
  }, {
    "url": "assets/trending-up-BKclvPBQ.js",
    "revision": null
  }, {
    "url": "assets/search-FtGz9oo_.js",
    "revision": null
  }, {
    "url": "assets/save-DAct3N5G.js",
    "revision": null
  }, {
    "url": "assets/route-wK5UGNhg.js",
    "revision": null
  }, {
    "url": "assets/pongara_coastal_safari_1795342715267-DpNc55Uw.jpg",
    "revision": null
  }, {
    "url": "assets/map-DwEJVyTf.js",
    "revision": null
  }, {
    "url": "assets/ivindo_djidji_waterfalls_1795342714431-BWkF_Ah2.jpg",
    "revision": null
  }, {
    "url": "assets/index-q1ie7kKw.css",
    "revision": null
  }, {
    "url": "assets/index-DJVZ3IYH.js",
    "revision": null
  }, {
    "url": "assets/icon_navettes_1794990184691-D__gcP5T.jpg",
    "revision": null
  }, {
    "url": "assets/icon_location_1794990184570-CgdoZwok.jpg",
    "revision": null
  }, {
    "url": "assets/icon_guides_1794990185916-7ZGAP8uD.jpg",
    "revision": null
  }, {
    "url": "assets/icon_expeditions_1794990186765-Dxnh0mEr.jpg",
    "revision": null
  }, {
    "url": "assets/hero_mondah_canopy_1795342713775-FYc1ToWN.jpg",
    "revision": null
  }, {
    "url": "assets/gabon_pongara_estuary_1795398444241-C9uZausq.jpg",
    "revision": null
  }, {
    "url": "assets/gabon_loango_lagoon_1795398443917-D3J8e3Eh.jpg",
    "revision": null
  }, {
    "url": "assets/gabon_ivindo_falls_1795398444066-DPRVaOEo.jpg",
    "revision": null
  }, {
    "url": "assets/gabon_cristal_mountains_1795398446159-DGiE1LCN.jpg",
    "revision": null
  }, {
    "url": "assets/footprints-CGQdROsP.js",
    "revision": null
  }, {
    "url": "assets/cristal_misty_highlands_1795342716179-C9rMBH3N.jpg",
    "revision": null
  }, {
    "url": "assets/createLucideIcon-DNxkVNhU.js",
    "revision": null
  }, {
    "url": "assets/circle-play-DL8k9lz6.js",
    "revision": null
  }, {
    "url": "assets/chevron-up-BozT9yYm.js",
    "revision": null
  }, {
    "url": "assets/bivouac_equatorial_gear_1795342715941-BkTBUX4n.js",
    "revision": null
  }, {
    "url": "assets/bivouac_equatorial_gear_1795342715941-BScsisOL.jpg",
    "revision": null
  }, {
    "url": "assets/VendorPortalModal--1tYC160.js",
    "revision": null
  }, {
    "url": "assets/TransportsView-CTQ4zqaW.js",
    "revision": null
  }, {
    "url": "assets/StoreWorkspace-DH79E2tt.js",
    "revision": null
  }, {
    "url": "assets/SortiesView-COk71egt.js",
    "revision": null
  }, {
    "url": "assets/SiteContributionsSection-hNfMsy2C.js",
    "revision": null
  }, {
    "url": "assets/SafetyView-LD0YKst7.js",
    "revision": null
  }, {
    "url": "assets/ProfileView-BkqPc3P9.js",
    "revision": null
  }, {
    "url": "assets/ProfessionalWorkspace-utZN5IHP.js",
    "revision": null
  }, {
    "url": "assets/PhotoGalleryView-BuKmcwXR.js",
    "revision": null
  }, {
    "url": "assets/OfflineMapsModal-NB0sMH8b.js",
    "revision": null
  }, {
    "url": "assets/MediaCaptureBox-wkTTLQ9q.js",
    "revision": null
  }, {
    "url": "assets/GroundingPanels-CbKjKI02.js",
    "revision": null
  }, {
    "url": "assets/ExplorerView-BZ-FTWsg.js",
    "revision": null
  }, {
    "url": "assets/EquipementView-ZAloXjD-.js",
    "revision": null
  }, {
    "url": "assets/CommunityHubModal-BSQKHkKp.js",
    "revision": null
  }, {
    "url": "apple-touch-icon.png",
    "revision": "b9deffe01e4382f1aa8ce8e26f326399"
  }, {
    "url": "favicon.ico",
    "revision": "387dd1d18752d6221123bed3dc79f9af"
  }, {
    "url": "icon.svg",
    "revision": "343b110dd1c3120aed6c348497b157c4"
  }, {
    "url": "logo.jpg",
    "revision": "387dd1d18752d6221123bed3dc79f9af"
  }, {
    "url": "pwa-192x192.png",
    "revision": "73479eebedc8dc1855214f70f599d27a"
  }, {
    "url": "pwa-512x512.png",
    "revision": "2d305f11184fc09212199905386e37db"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "cb1158761d413a4a1437662c962905c1"
  }, {
    "url": "manifest.webmanifest",
    "revision": "84d8864f399e656d9b959099b724d7f0"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html"), {
    denylist: [/^\/api\//, /^\/ws\//]
  }));
  workbox.registerRoute(/^https:\/\/fonts\.googleapis\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "google-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/^https:\/\/fonts\.gstatic\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "gstatic-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/^https:\/\/[a-c]\.tile\.openstreetmap\.org\/.*/i, new workbox.StaleWhileRevalidate({
    "cacheName": "osm-tiles-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 250,
      maxAgeSeconds: 2592000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/\/api\/marketplace\/stock$/, new workbox.NetworkFirst({
    "cacheName": "marketplace-stock-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 5,
      maxAgeSeconds: 600
    })]
  }), 'GET');

}));
