/* GlassesPedia — Playful Geometric JS
   All content lives in HTML (AI-friendly).
   JS handles: nav, scroll, FAQ accordion, TOC, filters, pop-in animations.
*/

document.addEventListener('DOMContentLoaded', () => {

  // --- Mobile menu toggle ---
  const menuBtn = document.getElementById('menuBtn');
  const navLinks = document.getElementById('navLinks');
  if (menuBtn && navLinks) {
    menuBtn.addEventListener('click', () => {
      menuBtn.classList.toggle('open');
      navLinks.classList.toggle('open');
    });
    // Close menu when clicking a link
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        menuBtn.classList.remove('open');
        navLinks.classList.remove('open');
      });
    });
  }

  // --- Pop-in animations on scroll ---
  const popElements = document.querySelectorAll('.pop-in, .mosaic-item, .read-item, .article-card, .exhibit-piece');
  if (popElements.length && 'IntersectionObserver' in window) {
    // Respect reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!prefersReducedMotion) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.animationPlayState = 'running';
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

      popElements.forEach(el => {
        el.style.animationPlayState = 'paused';
        observer.observe(el);
      });
    } else {
      // No animation, just show everything
      popElements.forEach(el => {
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
    }
  }

  // --- FAQ accordion ---
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const wasOpen = item.classList.contains('open');
      // Close all siblings
      item.parentElement.querySelectorAll('.faq-item.open').forEach(el => el.classList.remove('open'));
      // Toggle
      if (!wasOpen) item.classList.add('open');
    });
  });

  // --- Article page: auto-generate TOC ---
  const tocContainer = document.getElementById('autoToc');
  const articleContent = document.querySelector('.article-content');
  if (tocContainer && articleContent) {
    const headings = articleContent.querySelectorAll('h2');
    if (headings.length > 1) {
      const ol = document.createElement('ol');
      headings.forEach((h, i) => {
        const id = 'section-' + i;
        h.id = id;
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = '#' + id;
        a.textContent = h.textContent;
        li.appendChild(a);
        ol.appendChild(li);
      });
      tocContainer.appendChild(ol);
    } else {
      tocContainer.style.display = 'none';
    }
  }

  // --- Category filter pills (articles page) ---
  document.querySelectorAll('.cat-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      const cat = btn.dataset.cat;
      document.querySelectorAll('.cat-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.article-card').forEach(card => {
        const cardCat = card.dataset.cat;
        card.style.display = (!cat || cat === 'all' || cardCat === cat) ? '' : 'none';
      });
    });
  });

  // --- URL param filter on articles page ---
  const params = new URLSearchParams(window.location.search);
  const catParam = params.get('cat');
  if (catParam) {
    const matchingPill = document.querySelector(`.cat-pill[data-cat="${catParam}"]`);
    if (matchingPill) matchingPill.click();
  }

  // --- Search on articles page ---
  const searchInput = document.getElementById('articleSearch');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      document.querySelectorAll('.article-card').forEach(card => {
        const text = card.textContent.toLowerCase();
        card.style.display = q && !text.includes(q) ? 'none' : '';
      });
    });
  }

  // --- Scheduled publishing: hide articles with future data-publish dates ---
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  document.querySelectorAll('[data-publish]').forEach(el => {
    if (el.dataset.publish > today) {
      el.style.display = 'none';
    }
  });

  // Update article count display
  const countEl = document.getElementById('articleCount');
  if (countEl) {
    const visible = document.querySelectorAll('.article-card:not([style*="display: none"])').length;
    countEl.textContent = visible;
  }
});
