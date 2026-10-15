// Images and MP4 videos inside .frame blocks on case pages.
// Load in <head> (not deferred) so image errors that happen during parsing are caught.
//
//   Image:          <div class="frame"><img src="../media/x/shot.jpg" alt="" loading="lazy"></div>
//   Muted preview:  <div class="frame video" data-mode="preview" data-src="...mp4" data-poster="...jpg"></div>
//   Full demo:      <div class="frame video" data-mode="full"    data-src="...mp4" data-poster="...jpg"></div>
//
// data-src takes a site file (../media/...) or an external https:// URL to an .mp4.
// Previews only download when scrolled near, play muted and pause off screen.
// Full demos download nothing until the visitor presses Play, then show native controls with sound.
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Mark frames whose image failed to load; capture phase catches errors from any <img>.
  document.addEventListener('error', function (e) {
    var t = e.target;
    if (t && t.tagName === 'IMG' && t.parentNode && t.parentNode.classList) {
      var f = t.parentNode;
      if (t.classList.contains('poster')) f.classList.add('no-poster');
      else if (f.classList.contains('frame')) f.classList.add('is-missing');
    }
  }, true);

  function shortPath(p) { return (p || '').replace(/^(\.\.\/)+/, ''); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function icon(name) {
    var d = { play: 'M4 2.5v11l9-5.5z', pause: 'M4 2.5h3v11H4zM9 2.5h3v11H9z' }[name];
    return '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="' + d + '"/></svg>';
  }

  function addPlaceholder(frame, title, files) {
    if (frame.dataset.ph === 'off') return;
    var ph = document.createElement('div');
    ph.className = 'ph';
    ph.setAttribute('aria-hidden', 'true');
    var html = '<b>Placeholder</b><span>' + esc(title) + '</span>';
    files.forEach(function (f) { if (f) html += '<code>' + esc(shortPath(f)) + '</code>'; });
    if (frame.dataset.hint) html += '<span>' + esc(frame.dataset.hint) + '</span>';
    ph.innerHTML = html;
    frame.insertBefore(ph, frame.firstChild);
  }

  function setupImage(frame) {
    var img = frame.querySelector(':scope > img');
    if (!img) return;
    addPlaceholder(frame, 'Add image', [img.getAttribute('src')]);
    if (!img.getAttribute('src')) frame.classList.add('is-missing');
  }

  function makeVideo(frame, full) {
    var v = document.createElement('video');
    v.playsInline = true;
    v.setAttribute('playsinline', '');
    v.preload = full ? 'auto' : 'metadata';
    if (frame.dataset.poster && !frame.classList.contains('no-poster')) v.poster = frame.dataset.poster;
    if (full) {
      v.controls = true;
    } else {
      v.muted = true;
      v.defaultMuted = true;
      v.setAttribute('muted', '');
      v.loop = true;
    }
    v.addEventListener('error', function () {
      frame.classList.add('is-missing');
      frame.classList.remove('playing');
      v.remove();
    });
    v.addEventListener('playing', function () { frame.classList.add('playing'); });
    v.src = frame.dataset.src;
    frame.appendChild(v);
    return v;
  }

  function setupVideo(frame, observer) {
    var full = frame.dataset.mode === 'full';
    var src = frame.dataset.src;
    addPlaceholder(frame, full ? 'Add demo video (plays with sound and controls)' : 'Add muted preview video', [src, frame.dataset.poster]);
    if (!src) { frame.classList.add('is-missing'); return; }

    if (frame.dataset.poster) {
      var poster = document.createElement('img');
      poster.className = 'poster';
      poster.alt = '';
      poster.loading = 'lazy';
      poster.src = frame.dataset.poster;
      frame.insertBefore(poster, frame.querySelector('.ph').nextSibling);
    } else {
      frame.classList.add('no-poster');
    }

    if (full || reduce) {
      var play = document.createElement('button');
      play.type = 'button';
      play.className = 'play';
      play.innerHTML = icon('play') + (full ? 'Play demo' : 'Play preview');
      play.setAttribute('aria-label', (full ? 'Play demo video: ' : 'Play preview: ') + (frame.getAttribute('aria-label') || 'video'));
      play.addEventListener('click', function () {
        var v = frame.querySelector('video') || makeVideo(frame, full);
        frame.classList.add('playing');
        var p = v.play();
        if (p && p.catch) p.catch(function () {});
        if (full) v.focus();
        else addToggle(frame, v);
      });
      frame.appendChild(play);
      return;
    }
    observer.observe(frame);
  }

  function addToggle(frame, v) {
    if (frame.querySelector('.toggle')) return;
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'toggle';
    function sync() {
      var paused = frame.dataset.userPaused === '1';
      b.innerHTML = icon(paused ? 'play' : 'pause');
      b.setAttribute('aria-label', paused ? 'Play preview' : 'Pause preview');
    }
    b.addEventListener('click', function () {
      if (frame.dataset.userPaused === '1') { frame.dataset.userPaused = ''; v.play().catch(function () {}); }
      else { frame.dataset.userPaused = '1'; v.pause(); }
      sync();
    });
    sync();
    frame.appendChild(b);
  }

  function init() {
    var observer = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var frame = e.target;
        var v = frame.querySelector('video');
        if (e.isIntersecting) {
          if (frame.classList.contains('is-missing')) return;
          if (!v) { v = makeVideo(frame, false); addToggle(frame, v); }
          if (frame.dataset.userPaused !== '1') { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
        } else if (v) {
          v.pause();
        }
      });
    }, { rootMargin: '200px 0px' }) : { observe: function (frame) { var v = makeVideo(frame, false); addToggle(frame, v); v.play(); } };

    document.querySelectorAll('.frame').forEach(function (frame) {
      if (frame.classList.contains('video')) setupVideo(frame, observer);
      else setupImage(frame);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
