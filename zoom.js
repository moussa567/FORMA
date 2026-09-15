/* FORMA — zoom-on-click for site photos (shared across all pages/languages) */
(function () {
  function init() {
    var style = document.createElement('style');
    style.textContent =
      '.fz-zoomable{cursor:zoom-in;position:relative}' +
      '*:has(>img.fz-zoomable)::after,*:has(>img.fz-zoomable)::before{pointer-events:none}' +
      '.fz-overlay{position:fixed;inset:0;background:rgba(6,6,5,.96);z-index:9000;display:none;align-items:center;justify-content:center;padding:40px}' +
      '.fz-overlay.open{display:flex}' +
      '.fz-overlay img{max-width:92vw;max-height:88vh;width:auto;height:auto;object-fit:contain;cursor:zoom-in;transition:transform .25s ease;touch-action:pinch-zoom}' +
      '.fz-overlay img.fz-zoomed{cursor:zoom-out;max-width:none;max-height:none;transform:scale(1.9)}' +
      '.fz-close{position:absolute;top:24px;right:32px;background:none;border:1px solid rgba(201,169,106,.4);color:#F8F5EE;width:44px;height:44px;font-size:1.1rem;cursor:pointer;transition:border-color .3s,color .3s;font-family:sans-serif;line-height:1}' +
      '.fz-close:hover{border-color:#C9A96A;color:#C9A96A}' +
      '.fz-btn{position:absolute;top:14px;left:14px;width:38px;height:38px;background:rgba(10,10,10,.55);border:1px solid rgba(201,169,106,.5);border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:5;opacity:0;transition:opacity .25s,border-color .25s;padding:0}' +
      '.fz-btn svg{width:16px;height:16px;stroke:#F8F5EE}' +
      '@media(hover:none){.fz-btn{opacity:1}}' +
      'a:hover>.fz-btn,.fz-btn:hover,.fz-btn:focus-visible{opacity:1;border-color:#C9A96A}' +
      '@media(max-width:760px){.fz-close{top:14px;right:14px}}';
    document.head.appendChild(style);

    var overlay = document.createElement('div');
    overlay.className = 'fz-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.innerHTML =
      '<button class="fz-close" type="button" aria-label="Fermer">✕</button>' +
      '<img src="" alt=""/>';
    document.body.appendChild(overlay);
    var overlayImg = overlay.querySelector('img');
    var closeBtn = overlay.querySelector('.fz-close');
    var lastFocus = null;

    function openZoom(src, alt, triggerEl) {
      lastFocus = triggerEl || document.activeElement;
      overlayImg.src = src;
      overlayImg.alt = alt || '';
      overlayImg.classList.remove('fz-zoomed');
      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
      closeBtn.focus();
    }
    function closeZoom() {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
      if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
    }
    closeBtn.addEventListener('click', closeZoom);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeZoom();
    });
    overlayImg.addEventListener('click', function (e) {
      e.stopPropagation();
      overlayImg.classList.toggle('fz-zoomed');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay.classList.contains('open')) closeZoom();
    });

    document.querySelectorAll('[data-qr]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        openZoom(btn.dataset.qr, btn.dataset.qrLabel || '', btn);
      });
    });

    var magnifierSVG =
      '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>' +
      '<line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>';

    var IMG_EXT = /\.(jpe?g|png|webp|avif)(\?.*)?$/i;
    var SKIP_SELECTOR =
      '.nav-mark, .lang-switch img, .qr-contact img, .gallery-item img, .fz-overlay img';

    function shouldSkip(img) {
      if (img.closest('nav')) return true;
      if (img.closest('footer')) return true;
      if (img.closest('.fz-overlay')) return true;
      if (img.closest('.gallery-item')) return true;
      if (img.matches(SKIP_SELECTOR)) return true;
      if (img.dataset.noZoom !== undefined) return true;
      var w = parseInt(img.getAttribute('width') || '0', 10);
      var h = parseInt(img.getAttribute('height') || '0', 10);
      if (w && h && w <= 48 && h <= 48) return true;
      return false;
    }

    function fullSrc(img) {
      return img.currentSrc || img.src;
    }

    var imgs = document.querySelectorAll('img');
    imgs.forEach(function (img) {
      if (shouldSkip(img)) return;
      var parentLink = img.closest('a');

      if (parentLink && IMG_EXT.test(parentLink.getAttribute('href') || '')) {
        // Link points straight at an image file: open it in the zoom overlay instead of navigating away.
        img.classList.add('fz-zoomable');
        parentLink.addEventListener('click', function (e) {
          e.preventDefault();
          openZoom(parentLink.getAttribute('href'), img.alt, parentLink);
        });
        return;
      }

      if (parentLink) {
        // Link goes elsewhere (e.g. a filtered collection page): keep that navigation,
        // add a small magnifier button so the photo itself can still be zoomed.
        var computed = getComputedStyle(parentLink);
        if (computed.position === 'static') parentLink.style.position = 'relative';
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'fz-btn';
        btn.setAttribute('aria-label', 'Agrandir la photo');
        btn.innerHTML = magnifierSVG;
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          openZoom(fullSrc(img), img.alt, btn);
        });
        parentLink.appendChild(btn);
        return;
      }

      img.classList.add('fz-zoomable');
      img.addEventListener('click', function () {
        openZoom(fullSrc(img), img.alt, img);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
