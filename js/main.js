// ═══ Caring Nannies - Main JS ═══

const MILLIE_API = 'https://app.caringnannies.com/api/leads';

// ─── Lead attribution: UTMs, landing page, referrer, market ──────────────
// Captured once per visit (sessionStorage) so a family who lands on an ad
// link and browses before submitting keeps the original source.
function sessionGet(key) {
  try { return sessionStorage.getItem(key) || ''; } catch (e) { return ''; }
}
function sessionSetOnce(key, value) {
  try { if (value && !sessionStorage.getItem(key)) sessionStorage.setItem(key, value); } catch (e) {}
}

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
const UTM = (() => {
  const p = new URLSearchParams(window.location.search);
  const found = {};
  UTM_KEYS.forEach((k) => { if (p.get(k)) found[k] = p.get(k).slice(0, 200); });
  // A new tagged link replaces the stored one; otherwise keep what we had.
  if (Object.keys(found).length) {
    try { sessionStorage.setItem('cn_utm', JSON.stringify(found)); } catch (e) {}
    return found;
  }
  try { return JSON.parse(sessionGet('cn_utm') || '{}'); } catch (e) { return {}; }
})();

sessionSetOnce('cn_landing', window.location.pathname);
// Only an outside referrer counts; moving between our own pages does not.
if (document.referrer && !document.referrer.includes(window.location.hostname)) {
  sessionSetOnce('cn_referrer', document.referrer.slice(0, 300));
}

// The page decides the market. Millie falls back to ZIP when it needs to.
const MARKET = window.location.pathname.startsWith('/austin') ? 'ATX' : 'SATX';

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
const formError = document.getElementById('form-error');
const formRetry = document.getElementById('form-retry');

// One attempt. Resolves true when Millie accepted the lead, false when it is
// worth trying again (network failure, timeout, 429 or a server error), and
// throws on a 4xx the visitor has to fix.
async function postLead(payload) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(MILLIE_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (res.ok) return true;
    if (res.status === 429 || res.status >= 500) return false;
    const data = await res.json().catch(() => ({}));
    const err = new Error(data.error || 'Please check the form and try again.');
    err.userFacing = true;
    throw err;
  } catch (err) {
    if (err.userFacing) throw err;
    return false;
  } finally {
    clearTimeout(timer);
  }
}

if (contactForm) {
  // Record page load time for bot detection (bots submit forms in < 3 seconds)
  const loadedAtEl = document.getElementById('loaded-at');
  if (loadedAtEl) loadedAtEl.value = Date.now().toString();

  const originalLabel = submitBtn.innerHTML;
  const fieldError = document.createElement('p');
  fieldError.className = 'hidden text-sm text-champagne text-center';
  fieldError.setAttribute('role', 'alert');
  submitBtn.insertAdjacentElement('afterend', fieldError);

  function show(el) {
    contactForm.classList.add('hidden');
    el.classList.remove('hidden');
    el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  if (formRetry) {
    formRetry.addEventListener('click', () => {
      formError.classList.add('hidden');
      contactForm.classList.remove('hidden');
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalLabel;
    });
  }

  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Guard against double-submit
    if (submitBtn.disabled) return;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
    fieldError.classList.add('hidden');

    const messageInput = document.getElementById('message').value;
    const heardAbout = document.getElementById('heardAbout')?.value || '';
    const landingPage = sessionGet('cn_landing') || window.location.pathname;
    const referrer = sessionGet('cn_referrer');

    // Millie stores the structured fields below once it supports them. Until
    // then the same facts ride along in the message so coordinators see them.
    const sourceBits = [
      heardAbout && `heard about us: ${heardAbout}`,
      `market: ${MARKET}`,
      `page: ${window.location.pathname}`,
      landingPage !== window.location.pathname && `landed on: ${landingPage}`,
      referrer && `referrer: ${referrer}`,
      ...Object.keys(UTM).map((k) => `${k}=${UTM[k]}`),
    ].filter(Boolean);

    const payload = {
      name: document.getElementById('name').value,
      email: document.getElementById('email').value,
      phone: document.getElementById('phone').value,
      service: document.getElementById('service').value,
      zipCode: document.getElementById('zipCode')?.value?.trim() || '',
      message: `${messageInput}\n\n[source: ${sourceBits.join(' | ')}]`,
      smsConsent: document.getElementById('sms-consent')?.checked || false,
      website: document.getElementById('website')?.value || '', // honeypot
      loadedAt: parseInt(loadedAtEl?.value || '0', 10),
      // Structured attribution
      market: MARKET,
      page: window.location.pathname,
      landingPage,
      referrer,
      utm: UTM,
      heardAbout,
    };

    try {
      // Try once, wait briefly, try once more. Only then tell the family it
      // did not go through, so a failed send is never shown as "Thank you".
      let sent = await postLead(payload);
      if (!sent) {
        await new Promise((r) => setTimeout(r, 1500));
        sent = await postLead(payload);
      }

      if (sent) {
        try { if (typeof fbq === 'function') fbq('track', 'Lead'); } catch (e) {}
        try { if (typeof plausible === 'function') plausible('Lead', { props: { market: MARKET } }); } catch (e) {}
        show(formSuccess);
      } else {
        try { if (typeof plausible === 'function') plausible('Lead send failed', { props: { market: MARKET } }); } catch (e) {}
        show(formError || formSuccess);
      }
    } catch (err) {
      // A problem the visitor can fix (e.g. an invalid email): stay on the form.
      fieldError.textContent = err.message;
      fieldError.classList.remove('hidden');
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalLabel;
    }
  });
}
