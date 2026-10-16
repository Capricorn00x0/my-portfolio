// Subnet calculator tool — external file on purpose.
// vercel.json sends `script-src 'self'`, which blocks inline <script>.
// Keep all logic here so Calculate works on the live site too.
(function () {
  'use strict';

  function byId(id) { return document.getElementById(id); }

  function ipToInt(ip) {
    var parts = String(ip).trim().split('.');
    if (parts.length !== 4) throw new Error('IP must have 4 octets like 192.168.10.0');
    var n = 0;
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      if (!/^\d+$/.test(p)) throw new Error('Bad octet "' + p + '"');
      var v = parseInt(p, 10);
      if (v < 0 || v > 255) throw new Error('Octet ' + v + ' out of range 0-255');
      n = (n << 8) + v;
    }
    return n >>> 0;
  }

  function intToIp(n) {
    n = n >>> 0;
    return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.');
  }

  function maskFromCidr(cidr) {
    if (!Number.isInteger(cidr) || cidr < 0 || cidr > 32) throw new Error('CIDR must be 0-32');
    if (cidr === 0) return 0;
    return (0xFFFFFFFF << (32 - cidr)) >>> 0;
  }

  function calcSubnet(ipStr, cidr) {
    var ip = ipToInt(ipStr);
    var mask = maskFromCidr(cidr);
    var net = (ip & mask) >>> 0;
    var bcast = (net | (~mask >>> 0)) >>> 0;
    var hosts = cidr >= 31 ? (cidr === 32 ? 1 : 2) : Math.pow(2, 32 - cidr) - 2;
    var first = cidr === 32 ? intToIp(net) : intToIp((net + 1) >>> 0);
    var last = cidr >= 31 ? intToIp(bcast) : intToIp((bcast - 1) >>> 0);
    return {
      input: ipStr + '/' + cidr,
      network: intToIp(net) + '/' + cidr,
      mask: intToIp(mask),
      broadcast: intToIp(bcast),
      first: first,
      last: last,
      hosts: hosts,
      cidr: cidr
    };
  }

  function parseCidr(input) {
    var parts = String(input).trim().split('/');
    if (parts.length !== 2) throw new Error('Use format like 192.168.10.0/26');
    var cidr = parseInt(parts[1].trim(), 10);
    if (!parts[0] || Number.isNaN(cidr)) throw new Error('Use format like 192.168.10.0/26');
    ipToInt(parts[0].trim());
    maskFromCidr(cidr);
    return { ip: parts[0].trim(), cidr: cidr };
  }

  function splitSubnets(baseIp, baseCidr, count) {
    if (!Number.isInteger(count) || count < 1 || count > 8) throw new Error('Split count must be 1-8');
    var bits = Math.ceil(Math.log2(count));
    var newCidr = baseCidr + bits;
    if (newCidr > 32) throw new Error('Cannot split /' + baseCidr + ' into ' + count + ' subnets');
    var actual = Math.pow(2, bits);
    var baseNet = ipToInt(calcSubnet(baseIp, baseCidr).network.split('/')[0]);
    var size = Math.pow(2, 32 - newCidr);
    var out = [];
    for (var i = 0; i < actual; i++) {
      var r = calcSubnet(intToIp((baseNet + i * size) >>> 0), newCidr);
      r.index = i + 1;
      out.push(r);
    }
    return out;
  }

  var lastSplit = [];

  function fallbackCopy(text, done) {
    var ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      done();
    } catch (e) {
      byId('subOut').textContent += '\n(Copy blocked — select table manually)';
    }
    ta.remove();
  }

  function runSubnet() {
    var ipEl = byId('subIp');
    var splitEl = byId('splitCount');
    var outEl = byId('subOut');
    var wrapEl = byId('splitWrap');
    if (!ipEl || !splitEl || !outEl || !wrapEl) return;
    try {
      var parsed = parseCidr(ipEl.value);
      var r = calcSubnet(parsed.ip, parsed.cidr);
      outEl.textContent =
        'Network:      ' + r.network + '\nMask:         ' + r.mask +
        '\nBroadcast:    ' + r.broadcast + '\nUsable hosts: ' + r.hosts +
        '\nFirst: ' + r.first + '  Last: ' + r.last;
      var count = parseInt(splitEl.value, 10);
      if (count > 1) {
        lastSplit = splitSubnets(parsed.ip, parsed.cidr, count);
        wrapEl.innerHTML = '<table><thead><tr><th>#</th><th>Network</th><th>First</th><th>Last</th><th>Broadcast</th><th>Hosts</th></tr></thead><tbody>' +
          lastSplit.map(function (p) {
            return '<tr><td>' + p.index + '</td><td>' + p.network + '</td><td>' + p.first + '</td><td>' + p.last + '</td><td>' + p.broadcast + '</td><td>' + p.hosts + '</td></tr>';
          }).join('') +
          '</tbody></table>';
      } else {
        lastSplit = [];
        wrapEl.innerHTML = '';
      }
    } catch (e) {
      lastSplit = [];
      wrapEl.innerHTML = '';
      outEl.textContent = (e && e.message) || 'Use format like 192.168.10.0/26';
    }
  }

  function init() {
    var btn = byId('subBtn');
    var ipEl = byId('subIp');
    var splitEl = byId('splitCount');
    var csvBtn = byId('csvBtn');
    if (!btn || !ipEl || !splitEl || !csvBtn) return; // not on the subnet page
    btn.addEventListener('click', runSubnet);
    ipEl.addEventListener('keydown', function (e) { if (e.key === 'Enter') runSubnet(); });
    splitEl.addEventListener('change', runSubnet);
    csvBtn.addEventListener('click', function () {
      var outEl = byId('subOut');
      if (!lastSplit.length) {
        outEl.textContent += '\n(Calculate a split first to copy CSV)';
        return;
      }
      var csv = 'index,network,first,last,broadcast,hosts\n' +
        lastSplit.map(function (p) {
          return [p.index, p.network, p.first, p.last, p.broadcast, p.hosts].join(',');
        }).join('\n');
      var done = function () {
        csvBtn.textContent = 'Copied ✓';
        setTimeout(function () { csvBtn.textContent = 'Copy CSV'; }, 1500);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(csv).then(done).catch(function () { fallbackCopy(csv, done); });
      } else {
        fallbackCopy(csv, done);
      }
    });
    runSubnet();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
