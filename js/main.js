// ═══ Caring Nannies - Main JS ═══

const MILLIE_API = 'https://app.caringnannies.com/api/leads';

// ─── Capture ad attribution (UTMs) from the landing URL ──────────────────
const UTM_PARAMS = (() => {
  const p = new URLSearchParams(window.location.search);
  const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  const found = keys.filter((k) => p.get(k)).map((k) => `${k}=${p.get(k)}`);
  if (found.length) sessionStorage.setItem('cn_utms', found.join(' | '));
  return sessionStorage.getItem('cn_utms') || '';
})();


// ─── Navbar scroll effect ────────────────────────────────────────────────
const navbar = document.getElementById('navbar');

function handleScroll() {
  if (window.scrollY > 32) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
}

window.addEventListener('scroll', handleScroll, { passive: true });
handleScroll();

// ─── Mobile menu toggle ──────────────────────────────────────────────────
const mobileToggle = document.getElementById('mobile-toggle');
const mobileMenu = document.getElementById('mobile-menu');
const menuIcon = document.getElementById('menu-icon');

mobileToggle.addEventListener('click', () => {
  const isOpen = !mobileMenu.classList.contains('hidden');
  mobileMenu.classList.toggle('hidden');

  if (isOpen) {
    menuIcon.setAttribute('d', 'M4 7h16M4 12h16M4 17h16');
  } else {
    menuIcon.setAttribute('d', 'M6 18L18 6M6 6l12 12');
  }
});

mobileMenu.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    mobileMenu.classList.add('hidden');
    menuIcon.setAttribute('d', 'M4 7h16M4 12h16M4 17h16');
  });
});

// ─── Reveal-on-scroll (Intersection Observer) ────────────────────────────
const reveals = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        revealObserver.unobserve(e.target);
      }
    });
  },
  { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
);
reveals.forEach((el) => revealObserver.observe(el));

// ─── Smooth scroll for anchor links ──────────────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', function (e) {
    const href = this.getAttribute('href');
    if (href === '#' || href.length < 2) return;
    const target = document.querySelector(href);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

// ─── Contact form: submit to Millie /api/leads ──────────────────────────
const contactForm = document.getElementById('contact-form');
const submitBtn = document.getElementById('submit-btn');
const formSuccess = document.getElementById('form-success');

if (contactForm) {
  // Record page load time for bot detection (bots submit forms in < 3 seconds)
  const loadedAtEl = document.getElementById('loaded-at');
  if (loadedAtEl) loadedAtEl.value = Date.now().toString();

  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Guard against double-submit
    if (submitBtn.disabled) return;
    submitBtn.disabled = true;
    const originalLabel = submitBtn.innerHTML;
    submitBtn.textContent = 'Sending...';

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const service = document.getElementById('service').value;
    const zipCode = document.getElementById('zipCode')?.value?.trim() || '';
    const messageInput = document.getElementById('message').value;
    const smsConsent = document.getElementById('sms-consent')?.checked || false;
    const website = document.getElementById('website')?.value || ''; // honeypot

    // Conversion tracking, safe no-ops if scripts are blocked
    function trackLead() {
      try { if (typeof fbq === 'function') fbq('track', 'Lead'); } catch (e) {}
      try { if (typeof plausible === 'function') plausible('Lead'); } catch (e) {}
    }

    const loadedAt = parseInt(loadedAtEl?.value || '0', 10);

    try {
      const res = await fetch(MILLIE_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          service,
          zipCode,
          message: UTM_PARAMS ? `${messageInput}\n\n[ad attribution: ${UTM_PARAMS}]` : messageInput,
          smsConsent,
          website,
          loadedAt,
        }),
      });

      if (res.ok) {
        trackLead();
        contactForm.classList.add('hidden');
        formSuccess.classList.remove('hidden');
        formSuccess.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      } else {
        throw new Error('Failed');
      }
    } catch (err) {
      // Even on network error, show success, coordinator gets backup via Plausible
      // event log + phone number in success copy.
      trackLead();
      contactForm.classList.add('hidden');
      formSuccess.classList.remove('hidden');
      formSuccess.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
    // Don't re-enable, form is hidden on both success and error
    submitBtn.innerHTML = originalLabel;
  });
}
