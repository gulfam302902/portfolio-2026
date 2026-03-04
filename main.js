/* ===================================================
   GulfamAI — Premium JavaScript v4.0
   Cursor: translate3d + RAF, sitewide
   Performance: lazy load, optimized animations
   =================================================== */

// -------- Custom Cursor (Ultra Smooth) --------
(function initCursor() {
  const dot = document.querySelector('.cursor-dot');
  const ring = document.querySelector('.cursor-ring');
  if (!dot || !ring) return;
  if (!window.matchMedia('(pointer: fine)').matches) {
    dot.style.display = 'none';
    ring.style.display = 'none';
    return;
  }

  let mouseX = 0, mouseY = 0, ringX = 0, ringY = 0;
  let rafId = null;

  dot.style.willChange = 'transform';
  ring.style.willChange = 'transform';

  document.addEventListener('mousemove', function (e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
    dot.style.transform = 'translate3d(' + (mouseX - 4) + 'px,' + (mouseY - 4) + 'px,0)';
  }, { passive: true });

  function animateRing() {
    ringX += (mouseX - ringX) * 0.13;
    ringY += (mouseY - ringY) * 0.13;
    ring.style.transform = 'translate3d(' + (ringX - 18) + 'px,' + (ringY - 18) + 'px,0)';
    rafId = requestAnimationFrame(animateRing);
  }
  animateRing();

  document.addEventListener('mouseleave', function () {
    dot.style.opacity = '0';
    ring.style.opacity = '0';
  });
  document.addEventListener('mouseenter', function () {
    dot.style.opacity = '1';
    ring.style.opacity = '1';
  });

  document.querySelectorAll('a, button, .card, .link-card, .blog-card, .tab-btn, .stat-card').forEach(function (el) {
    el.addEventListener('mouseenter', function () { ring.classList.add('expanded'); });
    el.addEventListener('mouseleave', function () { ring.classList.remove('expanded'); });
  });
})();

// -------- Particles Canvas --------
(function initParticles() {
  var canvas = document.getElementById('particles-canvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var W = canvas.width = canvas.offsetWidth;
  var H = canvas.height = canvas.offsetHeight;

  var particles = [];
  for (var i = 0; i < 48; i++) {
    particles.push({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 1.8 + 0.4,
      dx: (Math.random() - 0.5) * 0.3,
      dy: (Math.random() - 0.5) * 0.3,
      a: Math.random() * 0.5 + 0.15
    });
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(96,165,250,' + p.a + ')';
      ctx.fill();
      p.x += p.dx; p.y += p.dy;
      if (p.x < 0 || p.x > W) p.dx *= -1;
      if (p.y < 0 || p.y > H) p.dy *= -1;
    }
    for (var i = 0; i < particles.length; i++) {
      for (var j = i + 1; j < particles.length; j++) {
        var dx = particles[i].x - particles[j].x;
        var dy = particles[i].y - particles[j].y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 100) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = 'rgba(96,165,250,' + (0.07 * (1 - dist / 100)) + ')';
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(draw);
  }
  draw();

  window.addEventListener('resize', function () {
    W = canvas.width = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  });
})();

// -------- Page Fade-In --------
document.documentElement.style.opacity = '0';
document.documentElement.style.transition = 'opacity 0.4s ease';
window.addEventListener('load', function () {
  document.documentElement.style.opacity = '1';
});

// -------- Navbar scroll --------
var navbar = document.getElementById('navbar');
var navToggle = document.getElementById('nav-toggle');
var mobileMenu = document.getElementById('mobile-menu');

window.addEventListener('scroll', function () {
  if (!navbar) return;
  navbar.classList.toggle('scrolled', window.scrollY > 40);
  updateBackToTop();
}, { passive: true });

if (navToggle) {
  navToggle.addEventListener('click', function () {
    mobileMenu.classList.toggle('open');
    var spans = navToggle.querySelectorAll('span');
    var isOpen = mobileMenu.classList.contains('open');
    spans[0].style.transform = isOpen ? 'rotate(45deg) translate(5px,5px)' : '';
    spans[1].style.opacity = isOpen ? '0' : '';
    spans[2].style.transform = isOpen ? 'rotate(-45deg) translate(5px,-5px)' : '';
  });
}

document.querySelectorAll('.mobile-menu a').forEach(function (link) {
  link.addEventListener('click', function () {
    if (!mobileMenu) return;
    mobileMenu.classList.remove('open');
    if (navToggle) {
      var spans = navToggle.querySelectorAll('span');
      spans[0].style.transform = '';
      spans[1].style.opacity = '';
      spans[2].style.transform = '';
    }
  });
});

// Active nav link
(function setActiveNav() {
  var path = window.location.pathname;
  var parts = path.split('/');
  var current = parts[parts.length - 1] || 'index.html';
  // handle directory index pages  
  if (current === '') current = 'index.html';
  document.querySelectorAll('.nav-links a, .mobile-menu a').forEach(function (link) {
    var href = link.getAttribute('href') || '';
    // normalize: get last segment of href
    var hrefParts = href.split('/');
    var hrefFile = hrefParts[hrefParts.length - 1];
    if (hrefFile === current || (current === 'index.html' && href === 'index.html')) {
      link.classList.add('active');
    }
    // check full path segment for subpages like blog/index.html
    if (href && path.includes(href.replace(/index\.html$/, '').replace(/^\.\.\//, ''))) {
      link.classList.add('active');
    }
  });
})();

// -------- Scroll Animations --------
var fadeEls = document.querySelectorAll('.fade-up');
var observer = new IntersectionObserver(function (entries) {
  entries.forEach(function (entry) {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.06, rootMargin: '0px 0px -30px 0px' });
fadeEls.forEach(function (el) { observer.observe(el); });

// Staggered card animation
document.querySelectorAll('.grid-3, .grid-2, .grid-4, .grid-auto, .testimonials-grid, .industries-grid').forEach(function (grid) {
  var items = grid.querySelectorAll(':scope > *');
  items.forEach(function (item, i) {
    if (!item.classList.contains('fade-up')) {
      item.classList.add('fade-up');
      item.style.transitionDelay = (i * 0.07) + 's';
      observer.observe(item);
    }
  });
});

// -------- FAQ Accordion --------
document.querySelectorAll('.faq-question').forEach(function (btn) {
  btn.addEventListener('click', function () {
    var item = btn.closest('.faq-item');
    var isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(function (i) { i.classList.remove('open'); });
    if (!isOpen) item.classList.add('open');
  });
});

// -------- Back to Top --------
var backToTop = document.getElementById('back-to-top');
function updateBackToTop() {
  if (!backToTop) return;
  backToTop.classList.toggle('visible', window.scrollY > 400);
}
if (backToTop) {
  backToTop.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// -------- Cookie Banner --------
var cookieBanner = document.getElementById('cookie-banner');
var cookieAccept = document.getElementById('cookie-accept');
var cookieDecline = document.getElementById('cookie-decline');
if (cookieBanner && !localStorage.getItem('cookies_accepted')) {
  setTimeout(function () { cookieBanner.classList.add('visible'); }, 1500);
}
cookieAccept && cookieAccept.addEventListener('click', function () {
  localStorage.setItem('cookies_accepted', 'true');
  cookieBanner.classList.remove('visible');
});
cookieDecline && cookieDecline.addEventListener('click', function () {
  localStorage.setItem('cookies_accepted', 'declined');
  cookieBanner.classList.remove('visible');
});

// -------- Services Tab Switcher --------
document.querySelectorAll('.tab-btn').forEach(function (btn) {
  btn.addEventListener('click', function () {
    var target = btn.dataset.tab;
    document.querySelectorAll('.tab-btn').forEach(function (b) { b.classList.remove('active'); });
    document.querySelectorAll('.tab-panel').forEach(function (p) { p.style.display = 'none'; });
    btn.classList.add('active');
    var panel = document.getElementById(target);
    if (panel) panel.style.display = 'block';
  });
});

// -------- TOC Sidebar --------
(function initTOC() {
  var tocLinks = document.querySelectorAll('.toc-list a');
  if (!tocLinks.length) return;
  var sections = [];
  tocLinks.forEach(function (link) {
    var id = link.getAttribute('href').replace('#', '');
    var el = document.getElementById(id);
    if (el) sections.push({ id: id, el: el, link: link });
  });
  var tocObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        tocLinks.forEach(function (l) { l.classList.remove('active'); });
        var active = sections.find(function (s) { return s.id === entry.target.id; });
        if (active) active.link.classList.add('active');
      }
    });
  }, { rootMargin: '-20% 0px -70% 0px' });
  sections.forEach(function (s) { tocObserver.observe(s.el); });
})();

// -------- Lazy Load Images --------
if ('IntersectionObserver' in window) {
  var imgObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        var img = entry.target;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
        }
        imgObserver.unobserve(img);
      }
    });
  }, { rootMargin: '200px 0px' });
  document.querySelectorAll('img[data-src]').forEach(function (img) { imgObserver.observe(img); });
}

// -------- Animated Number Counters --------
function animateNum(el) {
  var original = el.dataset.target || el.textContent.trim();
  el.dataset.target = original;
  if (!/\d/.test(original)) return;
  var match = original.match(/(\d+(?:\.\d+)?)/);
  if (!match) return;
  var target = parseFloat(match[1]);
  var prefix = original.slice(0, original.indexOf(match[1]));
  var suffix = original.slice(original.indexOf(match[1]) + match[1].length);
  var isDecimal = match[1].includes('.');
  var start = 0;
  var dur = 1500;
  var step = function (timestamp) {
    if (!start) start = timestamp;
    var progress = Math.min((timestamp - start) / dur, 1);
    var eased = 1 - Math.pow(1 - progress, 3);
    var current = (target * eased).toFixed(isDecimal ? 1 : 0);
    el.textContent = prefix + current + suffix;
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = original;
  };
  requestAnimationFrame(step);
}

var numObserver = new IntersectionObserver(function (entries) {
  entries.forEach(function (entry) {
    if (entry.isIntersecting) {
      animateNum(entry.target);
      numObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });
document.querySelectorAll('.stat-number').forEach(function (el) { numObserver.observe(el); });

// -------- Magnetic Hover (CTA buttons) --------
document.querySelectorAll('.btn-primary.btn-lg').forEach(function (btn) {
  btn.addEventListener('mousemove', function (e) {
    var rect = btn.getBoundingClientRect();
    var x = (e.clientX - rect.left - rect.width / 2) * 0.15;
    var y = (e.clientY - rect.top - rect.height / 2) * 0.15;
    btn.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0) translateY(-2px)';
  });
  btn.addEventListener('mouseleave', function () {
    btn.style.transform = '';
  });
});

// -------- Card image hover zoom --------
document.querySelectorAll('.card, .blog-card, .link-card').forEach(function (card) {
  var img = card.querySelector('.card-img-top, .link-card-img, .blog-card-img-inner img');
  if (img) {
    card.addEventListener('mouseenter', function () {
      img.style.transform = 'scale(1.05)';
    });
    card.addEventListener('mouseleave', function () {
      img.style.transform = '';
    });
  }
});
