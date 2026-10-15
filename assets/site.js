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

  // theme toggle: dark (default) / light, remembered in localStorage
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
    btn.addEventListener('click', function () {
      var light = root.getAttribute('data-theme') !== 'light';
      if (light) root.setAttribute('data-theme', 'light'); else root.removeAttribute('data-theme');
      try { localStorage.setItem('theme', light ? 'light' : 'dark'); } catch (e) {}
      sync();
      readStar();
      if (reduce) draw(0);
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

  // reveal on scroll
  var items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
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
