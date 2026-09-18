(function () {
  'use strict';

  var root = document.documentElement;
  var body = document.body;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Header shadow on scroll */
  var header = document.querySelector('.site-header');
  if (header) {
    var onScroll = function () { header.classList.toggle('scrolled', window.scrollY > 8); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* Mobile drawer */
  var toggle = document.querySelector('.menu-toggle');
  var nav = document.getElementById('main-nav');
  var backdrop = document.querySelector('.nav-backdrop');

  function setMenu(open) {
    if (!toggle || !nav) return;
    body.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    if (open) {
      var first = nav.querySelector('a');
      if (first) setTimeout(function () { first.focus({ preventScroll: true }); }, 250);
    }
  }

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      setMenu(!body.classList.contains('menu-open'));
    });
    if (backdrop) backdrop.addEventListener('click', function () { setMenu(false); });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && body.classList.contains('menu-open')) {
        setMenu(false);
        toggle.focus();
      }
    });
    window.matchMedia('(min-width: 1280px)').addEventListener('change', function (mq) {
      if (mq.matches) setMenu(false);
    });
  }

  /* Active nav item */
  if (nav) {
    var path = location.pathname;
    nav.querySelectorAll('a[href^="/"]').forEach(function (a) {
      var href = a.getAttribute('href');
      if (href.indexOf('#') !== -1 || a.classList.contains('nav-cta')) return;
      if ((href === '/' && path === '/') || (href !== '/' && path.indexOf(href) === 0)) a.classList.add('active');
    });
  }

  /* Reveal on scroll */
  window.__reveal = true;
  var revealEls = document.querySelectorAll('.reveal');
  function revealNow(scope) {
    (scope || document).querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
  }
  if (revealEls.length && 'IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.05, rootMargin: '0px 0px -4% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
    var revealHashTarget = function () {
      if (!location.hash || location.hash.length < 2) return;
      var target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (target) revealNow(target);
    };
    revealHashTarget();
    window.addEventListener('hashchange', revealHashTarget);
  } else {
    revealNow();
  }
  document.querySelectorAll('[data-stagger]').forEach(function (group) {
    Array.prototype.forEach.call(group.children, function (child, i) {
      child.style.setProperty('--d', Math.min(i * 0.08, 0.4) + 's');
    });
  });

  /* Accordions: on phones keep only the first open */
  var usefulCards = document.querySelectorAll('.useful-card');
  if (usefulCards.length && window.matchMedia('(max-width: 900px)').matches) {
    usefulCards.forEach(function (d, i) { if (i > 0) d.removeAttribute('open'); });
  }

  /* Toasts */
  document.querySelectorAll('.toast').forEach(function (t) {
    var close = function () {
      t.classList.add('hide');
      setTimeout(function () { t.remove(); }, 350);
    };
    var btn = t.querySelector('.toast-close');
    if (btn) btn.addEventListener('click', close);
    if (!t.classList.contains('error')) setTimeout(close, 7000);
  });

  /* Forms: prevent double submit */
  document.querySelectorAll('form[data-once]').forEach(function (form) {
    form.addEventListener('submit', function () {
      var btn = form.querySelector('button[type="submit"]');
      if (!btn) return;
      setTimeout(function () {
        btn.disabled = true;
        btn.dataset.label = btn.innerHTML;
        btn.textContent = 'Отправляем…';
      }, 0);
    });
  });

  /* Отзывы: «Читать полностью» для длинных текстов */
  document.querySelectorAll('.review-text.js-clamp').forEach(function (el) {
    el.classList.add('clamped');
    if (el.scrollHeight <= el.clientHeight + 8) {
      el.classList.remove('clamped');
      return;
    }
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'review-more';
    btn.textContent = 'Читать полностью';
    btn.addEventListener('click', function () {
      var stillClamped = el.classList.toggle('clamped');
      btn.textContent = stillClamped ? 'Читать полностью' : 'Свернуть';
    });
    el.insertAdjacentElement('afterend', btn);
  });

  /* Лента направлений: если анимации выключены системой — даём листать */
  var marquee = document.querySelector('.marquee');
  if (marquee && reduceMotion) {
    var down = false, startX = 0, startLeft = 0;
    marquee.style.cursor = 'grab';
    marquee.addEventListener('pointerdown', function (e) {
      down = true; startX = e.clientX; startLeft = marquee.scrollLeft; marquee.style.cursor = 'grabbing';
    });
    marquee.addEventListener('pointermove', function (e) {
      if (down) marquee.scrollLeft = startLeft - (e.clientX - startX);
    });
    ['pointerup', 'pointerleave'].forEach(function (ev) {
      marquee.addEventListener(ev, function () { down = false; marquee.style.cursor = 'grab'; });
    });
  }


  /* Подменю «Операции» */
  document.querySelectorAll('.nav-sub-toggle').forEach(function (btn) {
    var item = btn.closest('.nav-item');
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      var open = item.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(open));
    });
  });

  /* Форма: показываем имя выбранного файла */
  document.querySelectorAll('.file-input').forEach(function (input) {
    var drop = document.querySelector('label[for="' + input.id + '"].file-drop');
    if (!drop) return;
    var text = drop.querySelector('.file-drop-text');
    input.addEventListener('change', function () {
      var file = input.files && input.files[0];
      if (file) {
        text.textContent = file.name + ' · ' + Math.round(file.size / 1024) + ' КБ';
        drop.classList.add('has-file');
      } else {
        text.textContent = text.dataset.placeholder || '';
        drop.classList.remove('has-file');
      }
    });
  });

  /* Печать памятки */
  document.querySelectorAll('.js-print').forEach(function (btn) {
    btn.addEventListener('click', function () { window.print(); });
  });

  /* Баннер-слайдер: автосмена + стрелки, точки, пауза */
  var slider = document.querySelector('.hero-slider');
  if (slider) {
    var slides = Array.prototype.slice.call(slider.querySelectorAll('.hero-slide'));
    var dots = Array.prototype.slice.call(slider.querySelectorAll('.hero-dot'));
    var playBtn = slider.querySelector('.hero-play');
    var timer = null;
    var current = 0;
    var DELAY = 7000;

    var show = function (i) {
      current = (i + slides.length) % slides.length;
      slides.forEach(function (sl, n) {
        var active = n === current;
        sl.classList.toggle('is-active', active);
        var v = sl.querySelector('video');
        if (v) {
          if (active) {
            // при медленной сети play() до загрузки данных отклоняется — повторяем по canplay
            var attempt = v.play();
            if (attempt && attempt.catch) {
              attempt.catch(function () {
                var again = function () {
                  v.removeEventListener('canplay', again);
                  if (sl.classList.contains('is-active')) v.play().catch(function () {});
                };
                v.addEventListener('canplay', again);
              });
            }
          } else {
            v.pause();
          }
        }
      });
      dots.forEach(function (d, n) { d.classList.toggle('is-active', n === current); });
    };
    var stop = function () { if (timer) { clearInterval(timer); timer = null; } };
    var start = function () {
      stop();
      if (slides.length > 1 && !reduceMotion) timer = setInterval(function () { show(current + 1); }, DELAY);
    };

    slider.querySelectorAll('.hero-nav').forEach(function (btn) {
      btn.addEventListener('click', function () {
        show(current + (btn.classList.contains('next') ? 1 : -1));
        start();
      });
    });
    dots.forEach(function (d) {
      d.addEventListener('click', function () { show(parseInt(d.dataset.go, 10) || 0); start(); });
    });
    if (playBtn) {
      playBtn.addEventListener('click', function () {
        var playing = !!timer;
        if (playing) { stop(); } else { start(); }
        playBtn.setAttribute('aria-pressed', String(!playing));
        playBtn.setAttribute('aria-label', playing ? 'Запустить автопрокрутку' : 'Остановить автопрокрутку');
        playBtn.innerHTML = playing ? '<i class="fas fa-play"></i>' : '<i class="fas fa-pause"></i>';
      });
    }
    slider.addEventListener('mouseenter', stop);
    slider.addEventListener('mouseleave', start);
    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });

    var touchX = null;
    slider.addEventListener('touchstart', function (e) { touchX = e.touches[0].clientX; }, { passive: true });
    slider.addEventListener('touchend', function (e) {
      if (touchX === null) return;
      var dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 40) { show(current + (dx < 0 ? 1 : -1)); start(); }
      touchX = null;
    });

    show(0);
    start();
  }

  /* Cookie notice */
  var cookie = document.getElementById('cookie');
  if (cookie) {
    var accepted = false;
    try { accepted = localStorage.getItem('cookies_accepted_v1') === '1'; } catch (e) {}
    if (!accepted) cookie.hidden = false;
    var ok = document.getElementById('cookie-ok');
    if (ok) ok.addEventListener('click', function () {
      try { localStorage.setItem('cookies_accepted_v1', '1'); } catch (e) {}
      cookie.hidden = true;
    });
  }
})();
