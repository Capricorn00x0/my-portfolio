// Network topology diagram — interaction only (hover highlight is pure CSS).
// vercel.json sends `script-src 'self'`, so no inline onclick="" anywhere: every
// binding happens here so the diagram works on the live site too.
(function () {
  'use strict';

  function byId(id) { return document.getElementById(id); }

  // Copy is taken from the case study itself — no invented subnets.
  var DETAIL = {
    fw: {
      title: 'FortiGate NGFW',
      sub: 'gateway for all three locations',
      body: 'Routing and firewall policies live here. It is the one place the three segments could meet, and policies are what stop them.'
    },
    a: {
      title: 'Location A',
      sub: 'VLAN 20',
      body: 'Main office, staff accommodation, warehouse, and the factory with its machinery — plus Wi-Fi access points, cameras and printers. One L3 switch. Printers and machinery on static IPs.'
    },
    b: {
      title: 'Location B',
      sub: 'VLAN 30',
      body: 'Main office, staff accommodation, warehouse, and the factory with its machinery — plus Wi-Fi access points, cameras and printers. One L3 switch. Printers and machinery on static IPs.'
    },
    c: {
      title: 'Location C',
      sub: 'VLAN 40',
      body: 'Main office, staff accommodation, warehouse, and the factory with its machinery — plus Wi-Fi access points, cameras and printers. One L3 switch. Printers and machinery on static IPs.'
    }
  };

  var DEFAULT_TEXT = 'Click a location (or tab to one and press Enter) for what is inside it.';
  var ISO_TEXT = 'Isolation ON — VLAN 20, 30 and 40 cannot reach each other. A fault in one location stays in that location instead of taking down the compound.';

  function init() {
    var svg = byId('netSvg');
    if (!svg) return; // not on the topology page

    var detail = byId('netDetail');
    var isoBtn = byId('netIso');

    function show(key) {
      var d = DETAIL[key];
      if (!d || !detail) return;
      detail.textContent = d.title + ' — ' + d.sub + '\n' + d.body;
    }

    var nodes = svg.querySelectorAll('[data-net]');
    for (var i = 0; i < nodes.length; i++) {
      bind(nodes[i]);
    }

    function bind(node) {
      var key = node.getAttribute('data-net');
      node.addEventListener('click', function () { show(key); });
      node.addEventListener('focus', function () { show(key); });
      node.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          show(key);
        }
      });
    }

    if (isoBtn) {
      isoBtn.addEventListener('click', function () {
        var isOn = svg.getAttribute('data-iso') === 'on';
        svg.setAttribute('data-iso', isOn ? 'off' : 'on');
        isoBtn.setAttribute('aria-pressed', isOn ? 'false' : 'true');
        isoBtn.textContent = isOn ? 'Show isolation' : 'Hide isolation';
        if (detail) detail.textContent = isOn ? DEFAULT_TEXT : ISO_TEXT;
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
