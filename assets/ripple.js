// Water ripples on the page background: the cursor disturbs a low-res height field,
// waves spread and fade, drawn as a faint shade of the text colour. Over sections marked
// data-ripple-color (Kind words) the slopes turn light blue, blue or violet by the direction they face.
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return; // mouse only

  var CELL = 4;          // CSS px per simulation cell
  var DAMP = 0.965;      // energy kept per step: lower = calmer water
  var MAX_ALPHA = 0.06;  // strongest shade, keeps the effect barely visible
  var MAX_TINT = 0.09;   // colour reads lighter than grey, so it may go a little stronger
  var FEATHER = 12;      // cells over which grey blends into colour at a zone edge
  var GAIN = 0.0045;     // slope → opacity

  var canvas = document.createElement('canvas');
  canvas.id = 'ripples';
  canvas.setAttribute('aria-hidden', 'true');
  var page = document.querySelector('.page');
  document.body.insertBefore(canvas, page || document.body.firstChild);
  var ctx = canvas.getContext('2d');
  if (!ctx) return;

  var gw, gh, a, b, img, buf32, raf = 0, idle = 0, last = null, rgb = [18, 20, 23];
  var zones = document.querySelectorAll("[data-ripple-color]"), wx, wy;

  function readColor() {
    var m = getComputedStyle(document.body).color.match(/\d+/g);
    if (m) rgb = [+m[0], +m[1], +m[2]];
  }

  // colour wheel by slope direction: light blue → blue → violet → back, 64 steps
  var STOPS = [[56, 189, 248], [37, 99, 235], [139, 92, 246]];
  var LUT = [];
  for (var q = 0; q < 64; q++) {
    var p = q / 64 * 3, i0 = Math.floor(p), f = p - i0, c0 = STOPS[i0], c1 = STOPS[(i0 + 1) % 3];
    LUT.push([0, 1, 2].map(function (j) { return Math.round(c0[j] + (c1[j] - c0[j]) * f); }));
  }
  var le = new Uint8Array(new Uint32Array([1]).buffer)[0] === 1;

  function resize() {
    gw = Math.ceil(window.innerWidth / CELL) + 2;
    gh = Math.ceil(window.innerHeight / CELL) + 2;
    a = new Float32Array(gw * gh);
    b = new Float32Array(gw * gh);
    canvas.width = gw; canvas.height = gh; // drawn at grid size, stretched by CSS (smoothed)
    img = ctx.createImageData(gw, gh);
    buf32 = new Uint32Array(img.data.buffer);
    wx = new Float32Array(gw); wy = new Float32Array(gh);
  }

  // colour weight per column and row (0 grey … 1 colour), from where the zones are on screen now
  function zoneWeights() {
    wx.fill(0); wy.fill(0);
    var any = false;
    for (var z = 0; z < zones.length; z++) {
      var r = zones[z].getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) continue;
      any = true;
      var x0 = r.left / CELL + 1, x1 = r.right / CELL + 1, y0 = r.top / CELL + 1, y1 = r.bottom / CELL + 1;
      for (var i = 0; i < gw; i++) wx[i] = Math.max(wx[i], Math.min(1, Math.max(0, Math.min(i - x0, x1 - i) / FEATHER + 0.5)));
      for (var j = 0; j < gh; j++) wy[j] = Math.max(wy[j], Math.min(1, Math.max(0, Math.min(j - y0, y1 - j) / FEATHER + 0.5)));
    }
    return any;
  }

  function drop(x, y, strength) {
    var cx = Math.round(x / CELL) + 1, cy = Math.round(y / CELL) + 1;
    for (var j = -2; j <= 2; j++) {
      for (var i = -2; i <= 2; i++) {
        var px = cx + i, py = cy + j;
        if (px < 1 || py < 1 || px >= gw - 1 || py >= gh - 1) continue;
        var d = Math.sqrt(i * i + j * j);
        if (d <= 2) a[py * gw + px] += strength * Math.cos(d / 2 * Math.PI / 2);
      }
    }
  }

  function step() {
    var energy = 0, w = gw;
    // classic two-buffer wave equation
    for (var y = 1; y < gh - 1; y++) {
      var row = y * w;
      for (var x = 1; x < w - 1; x++) {
        var k = row + x;
        var v = ((a[k - 1] + a[k + 1] + a[k - w] + a[k + w]) / 2 - b[k]) * DAMP;
        b[k] = v;
        energy += v < 0 ? -v : v;
      }
    }
    var t = a; a = b; b = t;

    // shade by slope: steepness sets the opacity; inside a colour zone the direction picks the hue
    var tinted = zones.length && zoneWeights();
    var r0 = rgb[0], g0 = rgb[1], b0 = rgb[2];
    for (var y2 = 1; y2 < gh - 1; y2++) {
      var row2 = y2 * w, ry = tinted ? wy[y2] : 0;
      for (var x2 = 1; x2 < w - 1; x2++) {
        var k2 = row2 + x2;
        var gx = a[k2 - 1] - a[k2 + 1], gy = a[k2 - w] - a[k2 + w];
        var mix = ry && wx[x2] < ry ? wx[x2] : ry;
        var cap = MAX_ALPHA + (MAX_TINT - MAX_ALPHA) * mix;
        var al = ((gx < 0 ? -gx : gx) + (gy < 0 ? -gy : gy)) * GAIN;
        if (al > cap) al = cap;
        var A = (al * 255) | 0;
        if (!A) { buf32[k2] = 0; continue; }
        var r = r0, g = g0, bl = b0;
        if (mix > 0) {
          var c = LUT[((Math.atan2(gy, gx) / (2 * Math.PI) + 1) * 64 | 0) & 63];
          r = (r0 + (c[0] - r0) * mix) | 0; g = (g0 + (c[1] - g0) * mix) | 0; bl = (b0 + (c[2] - b0) * mix) | 0;
        }
        buf32[k2] = le ? (A << 24) | (bl << 16) | (g << 8) | r : (r << 24) | (g << 16) | (bl << 8) | A;
      }
    }
    ctx.putImageData(img, 0, 0);
    return energy / (gw * gh);
  }

  function loop() {
    var e = step();
    // stop when the water is calm again; the next movement restarts it
    if (e < 0.01) { if (++idle > 30) { raf = 0; ctx.clearRect(0, 0, gw, gh); a.fill(0); b.fill(0); return; } }
    else idle = 0;
    raf = requestAnimationFrame(loop);
  }
  function isLight() { return document.documentElement.getAttribute("data-theme") === "light"; }
  // switching to the dark theme stills the water at once
  function calm() { if (raf) { cancelAnimationFrame(raf); raf = 0; } ctx.clearRect(0, 0, gw, gh); a.fill(0); b.fill(0); last = null; }
  function wake() { idle = 0; if (!raf && !document.hidden) raf = requestAnimationFrame(loop); }

  window.addEventListener('pointermove', function (e) {
    if (reduce.matches || e.pointerType !== 'mouse' || !isLight()) return; // light theme only
    var x = e.clientX, y = e.clientY, now = e.timeStamp;
    if (last) {
      var dx = x - last.x, dy = y - last.y, dist = Math.sqrt(dx * dx + dy * dy);
      // barely moving the mouse leaves the water still
      if (dist / Math.max(1, now - last.t) < 0.3) { last = { x: x, y: y, t: now }; return; }
      // a few drops along the path, stronger for faster moves (capped)
      var n = Math.min(6, Math.ceil(dist / (CELL * 3)));
      var strength = Math.min(60, 12 + dist * 0.6);
      for (var i = 1; i <= n; i++) drop(last.x + dx * i / n, last.y + dy * i / n, strength / n);
    }
    last = { x: x, y: y, t: now };
    wake();
  }, { passive: true });
  document.addEventListener('pointerleave', function () { last = null; });
  document.addEventListener('visibilitychange', function () { if (document.hidden && raf) { cancelAnimationFrame(raf); raf = 0; } });
  new MutationObserver(function () { readColor(); if (!isLight()) calm(); }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(resize, 150); });

  readColor();
  resize();
})();
