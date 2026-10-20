// Shared behaviour for every page: starfield, reveal on scroll, copy email.
(function () {
  // starfield
  var canvas = document.getElementById('stars');
  var ctx = canvas.getContext('2d');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Each star has a depth z (0 far … 1 near): near stars are bigger, brighter,
  // drift faster and shift more with the cursor and with scrolling (parallax).
  var stars = [];
  var starRGB = '253,253,253';
  function readStar() { starRGB = getComputedStyle(document.documentElement).getPropertyValue('--star-rgb').trim() || starRGB; }
  readStar();
  var W = 0, H = 0;
  var mouse = { x: 0, y: 0 }, ease = { x: 0, y: 0 };
  var last = 0;
  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var count = Math.round(W * H / 8000);
    stars = [];
    for (var i = 0; i < count; i++) {
      var z = Math.pow(Math.random(), 1.6);
      var angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.2; // mostly upward, slightly sideways
      var speed = 4 + z * 14;                                  // px per second
      stars.push({
        x: Math.random() * W, y: Math.random() * H, z: z,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        r: 0.35 + z * 1.15, a: 0.12 + z * 0.5,
        s: Math.random() * 0.002 + 0.0005, p: Math.random() * 6.28
      });
    }
  }
  function draw(t) {
    var dt = last ? Math.min((t - last) / 1000, 0.05) : 0;
    last = t;
    ease.x += (mouse.x - ease.x) * 0.04;
    ease.y += (mouse.y - ease.y) * 0.04;
    var scroll = reduce ? 0 : window.scrollY || 0;
    var pad = 40;
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < stars.length; i++) {
      var st = stars[i];
      if (!reduce) {
        st.x += st.vx * dt; st.y += st.vy * dt;
        // wrap around the viewport so the field never empties
        if (st.y < -pad) st.y += H + pad * 2; else if (st.y > H + pad) st.y -= H + pad * 2;
        if (st.x < -pad) st.x += W + pad * 2; else if (st.x > W + pad) st.x -= W + pad * 2;
      }
      var px = st.x + ease.x * st.z * 24;
      var py = st.y + ease.y * st.z * 24 - scroll * st.z * 0.15;
      py = ((py % (H + pad * 2)) + H + pad * 2) % (H + pad * 2) - pad;
      var a = reduce ? st.a : st.a * (0.6 + 0.4 * Math.sin(t * st.s + st.p));
      ctx.fillStyle = 'rgba(' + starRGB + ',' + a.toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(px, py, st.r, 0, 6.283); ctx.fill();
    }
    if (!reduce) requestAnimationFrame(draw);
  }
  resize(); requestAnimationFrame(draw);
  window.addEventListener('resize', function () { resize(); if (reduce) draw(0); });
  if (!reduce) {
    window.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      mouse.x = (e.clientX / W - 0.5) * 2;
      mouse.y = (e.clientY / H - 0.5) * 2;
    }, { passive: true });
  }

  // theme toggle: light (default) / dark, kept only for this tab (sessionStorage), so every new visit opens light
  (function () {
    var nav = document.querySelector('nav.main');
    if (!nav) return;
    var root = document.documentElement;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'theme-toggle';
    btn.innerHTML = '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="7.25" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M10 2.75a7.25 7.25 0 0 1 0 14.5z" fill="currentColor"/></svg>';
    function sync() {
      var light = root.getAttribute('data-theme') === 'light';
      btn.setAttribute('aria-label', light ? 'Switch to dark theme' : 'Switch to light theme');
      btn.setAttribute('aria-pressed', String(light));
    }
    function apply(light) {
      if (light) root.setAttribute('data-theme', 'light'); else root.removeAttribute('data-theme');
      try { sessionStorage.setItem('theme', light ? 'light' : 'dark'); } catch (e) {}
      sync();
      readStar();
      if (reduce) draw(0);
    }
    // the new theme is revealed by four curtains moving left to right, one after another
    // (down from the top into the dark theme, up from the bottom into the light one):
    // a view transition keeps a snapshot of the old page, and the new one shows through
    // four columns that grow from the top (falls back to an instant switch)
    var busy = false;
    function ease(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
    btn.addEventListener('click', function () {
      var light = root.getAttribute('data-theme') !== 'light';
      if (reduce || !document.startViewTransition) { apply(light); return; }
      if (busy) return;
      busy = true;
      var COLS = 4, DUR = 600, GAP = 90, total = DUR + GAP * (COLS - 1), STEPS = 48, frames = [];
      for (var f = 0; f <= STEPS; f++) {
        // one outline: along the anchored edge, then back along the steps from the right-hand column to the left
        var ms = f / STEPS * total, edge = light ? '100%' : '0%', pts = ['0% ' + edge, '100% ' + edge];
        for (var c = COLS - 1; c >= 0; c--) {
          var h = ease(Math.min(1, Math.max(0, (ms - c * GAP) / DUR))) * 100;
          var y = (light ? 100 - h : h) + '%';
          pts.push((c + 1) / COLS * 100 + '% ' + y, c / COLS * 100 + '% ' + y);
        }
        frames.push({ clipPath: 'polygon(' + pts.join(', ') + ')' });
      }
      var vt = document.startViewTransition(function () { apply(light); });
      vt.ready.then(function () {
        root.animate(frames, { duration: total, easing: 'linear', pseudoElement: '::view-transition-new(root)' });
      }).catch(function () {});
      vt.finished.then(function () { busy = false; }, function () { busy = false; });
    });
    nav.insertBefore(btn, nav.querySelector('.pill'));
    sync();
  })();

  // back to top: round button whose ring fills with scroll progress
  (function () {
    var R = 22, C = 2 * Math.PI * R;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'to-top';
    btn.setAttribute('aria-label', 'Back to top');
    btn.innerHTML =
      '<svg class="to-top-ring" viewBox="0 0 52 52" aria-hidden="true">' +
        '<circle cx="26" cy="26" r="' + R + '" class="track"/>' +
        '<circle cx="26" cy="26" r="' + R + '" class="bar" stroke-dasharray="' + C.toFixed(2) + '" stroke-dashoffset="' + C.toFixed(2) + '"/>' +
      '</svg>' +
      '<svg class="to-top-arrow" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 13V3M4 7l4-4 4 4" stroke="currentColor" stroke-width="1.5"/></svg>';
    document.body.appendChild(btn);
    var bar = btn.querySelector('.bar');
    var ticking = false;
    function update() {
      ticking = false;
      var max = document.documentElement.scrollHeight - innerHeight;
      var p = max > 0 ? Math.min(Math.max(window.scrollY / max, 0), 1) : 0;
      bar.setAttribute('stroke-dashoffset', (C * (1 - p)).toFixed(2));
      btn.classList.toggle('is-visible', window.scrollY > innerHeight * 0.4);
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener('resize', update);
    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    });
    update();
  })();

  var enterUntil = 0; // when the entrance finishes; scroll reveals already in view wait for it
  // entrance on load: header items, then the top block of the page ([data-enter] children) one after
  // another; the main heading comes in word by word. Hidden by CSS only while html has .enter
  (function () {
    var root = document.documentElement;
    if (!root.classList.contains('enter')) return;
    var seq = [], t = 120;
    // the logo shows at once (it writes itself); the menu comes in from the right: Say hello, theme, About, Work
    var id = document.querySelector('header.top .id');
    if (id) seq.push([id, 60]);
    var nav = Array.prototype.slice.call(document.querySelectorAll('header.top nav.main > *')).reverse();
    nav.forEach(function (el, i) { seq.push([el, 140 + i * 140]); });
    var head = nav.concat(id ? [id] : []);
    var logo = document.querySelector('header.top .logo');
    if (logo) writeSignature(logo, 120);
    t = 80 + head.length * 70;
    document.querySelectorAll('[data-enter]').forEach(function (box) {
      Array.prototype.forEach.call(box.children, function (el, i) {
        if (el.classList.contains('reveal')) return;
        if (/^H1$/.test(el.tagName)) splitWords(el);
        seq.push([el, t + Math.min(i, 8) * 110]);
      });
    });
    seq.forEach(function (p) { setTimeout(function () { p[0].classList.add('on'); }, p[1]); });
    // after the last item has settled, drop the entrance styles altogether
    var lastAt = seq.length ? seq[seq.length - 1][1] : 0;
    enterUntil = Date.now() + lastAt + 250;
    setTimeout(function () { root.classList.remove('enter'); }, lastAt + 1600);

    // the signature writes itself, letter by letter: S, h, m, a, t (stem, then bar), k, o with its tail,
    // and finally the underline. Each letter is inked from its top down along its own lines, at pen speed.
    // Coordinates are pixels of assets/signature.png (633×250); letters are split along the slant of the writing.
    function writeSignature(logo, delay) {
      var m = /url\(["']?([^"')]+)["']?\)/.exec(getComputedStyle(logo).webkitMaskImage || getComputedStyle(logo).maskImage || '');
      if (!m) return;
      var img = new Image();
      img.onload = function () {
        var W = img.naturalWidth, H = img.naturalHeight, sx = W / 633, sy = H / 250;
        var src = document.createElement('canvas'); src.width = W; src.height = H;
        var sg = src.getContext('2d', { willReadFrequently: true }); sg.drawImage(img, 0, 0);
        var alpha = sg.getImageData(0, 0, W, H).data, N = W * H;
        // strokes in writing order: S h m a t-stem t-bar k o underline
        var SLANT = 0.35;
        // centre of the underline, measured from the image; a narrow band keeps the tail of the o out of it
        var LINE_PTS = [[176, 245], [200, 238], [250, 223.5], [300, 210], [350, 199], [400, 189], [450, 181], [500, 175], [540, 172.5], [600, 178.5]];
        function lineY(x) {
          for (var i = 1; i < LINE_PTS.length; i++) if (x <= LINE_PTS[i][0]) {
            var p0 = LINE_PTS[i - 1], p1 = LINE_PTS[i]; return p0[1] + (p1[1] - p0[1]) * (x - p0[0]) / (p1[0] - p0[0]);
          }
          return LINE_PTS[LINE_PTS.length - 1][1];
        }
        function stroke(x, y) {
          if (x >= 172 && x <= 600 && Math.abs(y - lineY(x)) < (x > 550 ? 6 : 7)) return 8;   // underline: a narrow band along it
          if (x >= 340 && x <= 530 && Math.abs(y - (114 - (x - 348) * 0.2246)) < 6) return 5;  // t bar (348,114)→(540,72)
          if (x > 524 && x < 550 && y > 62 && y < 94) return 5;                                  // … and its curl
          if (x < 386) {                                                                         // S h m a, split along the slant
            var u = x + (y - 125) * SLANT;
            return u < 255 ? 0 : u < 300 ? 1 : u < 375 ? 2 : 3;
          }
          // t, k and o: the two tall strokes and the bar are followed along their own lines
          if (y > 60 && y < 180 && Math.abs(x - (436 - (y - 68) * 0.365)) < 6) return 4;        // t stem (436,68)→(398,172)
          if (y > 10 && y < 186 && Math.abs(x - (490 - (y - 18) * 0.494)) < 6) return 6;         // k stem (490,18)→(410,180)
          if (y > 186 && x < 430) return 3;                                                      // the join from a, low down
          return x < 466 ? 6 : 7;                                                                // k loop | o and its tail
        }
        var part = new Int8Array(N).fill(-1), when = new Float32Array(N).fill(-1e9);
        var members = [[], [], [], [], [], [], [], [], []];
        for (var p = 0; p < N; p++) {
          if (alpha[p * 4 + 3] < 8) continue;
          var k = stroke((p % W) / sx, ((p / W) | 0) / sy); part[p] = k; members[k].push(p);
        }
        // walk each stroke from its start (leftmost point along the slant; the S from the tip inside its loop)
        var q = new Int32Array(N), clock = 0, marks = [];
        members.forEach(function (list, k) {
          if (!list.length) return;
          var left = list.slice(), base = clock, far = clock;
          while (left.length) {
            var start = -1, best = 1e9;
            // letters start at their highest point and the pen runs down along the lines;
            // the t-bar and the underline are drawn from their left end
            var fromLeft = k === 5 || k === 8;
            left.forEach(function (pp) {
              var v = fromLeft ? (pp % W) / sx : ((pp / W) | 0) / sy;
              if (v < best) { best = v; start = pp; }
            });
            var head = 0, tail = 0; q[tail++] = start; when[start] = far === base ? base : far + 4;
            while (head < tail) {
              var cur = q[head++], cx = cur % W, cy = (cur / W) | 0, tc = when[cur];
              for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) {
                var nx = cx + dx, ny = cy + dy, n = ny * W + nx;
                if (nx < 0 || ny < 0 || nx >= W || ny >= H || part[n] !== k || when[n] > -1e8) continue;
                when[n] = tc + 1; if (tc + 1 > far) far = tc + 1; q[tail++] = n;
              }
            }
            left = left.filter(function (pp) { return when[pp] < -1e8; });
          }
          marks.push(far);
          clock = far + (k === 7 ? 70 : 10); // the pen lifts a little longer before the underline
        });
        var total = marks[marks.length - 1], lettersEnd = marks[marks.length - 2], lineStart = lettersEnd + 70;
        var rgb = (getComputedStyle(logo).backgroundColor.match(/\d+/g) || [0, 0, 0]).map(Number);
        var out = sg.createImageData(W, H), od = out.data;
        for (var i = 0; i < N; i++) { od[i * 4] = rgb[0]; od[i * 4 + 1] = rgb[1]; od[i * 4 + 2] = rgb[2]; }
        var view = document.createElement('canvas');
        var dpr = Math.min(window.devicePixelRatio || 1, 2), r = logo.getBoundingClientRect();
        view.width = Math.round(r.width * dpr); view.height = Math.round(r.height * dpr);
        view.style.cssText = 'display:block;width:100%;height:100%';
        var vg = view.getContext('2d');
        logo.classList.add('writing'); logo.appendChild(view);
        // timing: the letters at writing pace, a short pen lift, then the underline as one quick flick
        var LETTERS = 2200, LIFT = 140, LINE = 320, DUR = LETTERS + LIFT + LINE, EDGE = 14, t0 = 0;
        function frame(now) {
          if (!t0) t0 = now;
          var ms = now - t0, kk = Math.min(1, ms / DUR), at;
          if (ms < LETTERS) { var e = ms / LETTERS; e = e < .5 ? 2 * e * e : 1 - Math.pow(-2 * e + 2, 2) / 2; at = e * (lettersEnd + EDGE); }
          else if (ms < LETTERS + LIFT) at = lettersEnd + EDGE;
          else { var u = Math.min(1, (ms - LETTERS - LIFT) / LINE); u = 1 - Math.pow(1 - u, 3); at = lineStart + u * (total - lineStart + EDGE); }
          for (var j = 0; j < N; j++) {
            var w = when[j];
            od[j * 4 + 3] = w < -1e8 || w > at ? 0 : alpha[j * 4 + 3] * Math.min(1, (at - w) / EDGE);
          }
          sg.putImageData(out, 0, 0);
          vg.clearRect(0, 0, view.width, view.height);
          vg.drawImage(src, 0, 0, view.width, view.height);
          if (kk < 1) requestAnimationFrame(frame);
          else { view.remove(); logo.classList.remove('writing'); } // back to the theme-aware mask
        }
        setTimeout(function () { requestAnimationFrame(frame); }, delay);
      };
      img.src = m[1];
    }

    function splitWords(h) {
      var n = 0, walker = document.createTreeWalker(h, NodeFilter.SHOW_TEXT), texts = [];
      while (walker.nextNode()) texts.push(walker.currentNode);
      texts.forEach(function (node) {
        var frag = document.createDocumentFragment();
        node.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
          var w = document.createElement('span');
          w.className = 'w'; w.textContent = part; w.style.setProperty('--d', (n++ * 45) + 'ms');
          frag.appendChild(w);
        });
        node.parentNode.replaceChild(frag, node);
      });
    }
  })();

  // reveal on scroll
  var items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        var wait = Math.max(0, enterUntil - Date.now());
        if (wait) setTimeout(function () { e.target.classList.add('in'); }, wait);
        else e.target.classList.add('in');
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('in'); });
  }

  // copy email
  var mail = document.querySelector(".foot-mail");
  var status = document.getElementById("copyStatus");
  if (mail) {
    var hint = mail.querySelector(".foot-mail-hint");
    var timer;
    function copied() {
      mail.classList.add("copied");
      hint.textContent = "Copied";
      if (status) status.textContent = "Email address copied";
      clearTimeout(timer);
      timer = setTimeout(function () {
        mail.classList.remove("copied");
        hint.textContent = "Click to copy";
        if (status) status.textContent = "";
      }, 1800);
    }
    function fallback(text) {
      var ta = document.createElement("textarea");
      ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      try { if (document.execCommand("copy")) copied(); } catch (e) {}
      ta.remove();
    }
    mail.addEventListener("click", function () {
      var text = mail.dataset.copy;
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(copied, function () { fallback(text); });
      else fallback(text);
    });
  }
})();
