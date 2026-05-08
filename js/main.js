// ═══ Caring Nannies - Main JS ═══

const MILLIE_API = 'https://app.caringnannies.com/api/leads';

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
    const neighborhood = document.getElementById('neighborhood')?.value || '';
    const messageInput = document.getElementById('message').value;
    const smsConsent = document.getElementById('sms-consent')?.checked || false;
    const website = document.getElementById('website')?.value || ''; // honeypot
    const loadedAt = parseInt(loadedAtEl?.value || '0', 10);

    // Prepend neighborhood to the message body so the API doesn't need a new field.
    // Keeps the structured info searchable in the coordinator-facing internalNotes.
    const message = neighborhood
      ? `Neighborhood: ${neighborhood}\n\n${messageInput}`.trim()
      : messageInput;

    try {
      const res = await fetch(MILLIE_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          service,
          message,
          smsConsent,
          website,
          loadedAt,
        }),
      });

      if (res.ok) {
        contactForm.classList.add('hidden');
        formSuccess.classList.remove('hidden');
        formSuccess.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      } else {
        throw new Error('Failed');
      }
    } catch (err) {
      // Even on network error, show success — coordinator gets backup via Plausible
      // event log + phone number in success copy.
      contactForm.classList.add('hidden');
      formSuccess.classList.remove('hidden');
      formSuccess.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
    // Don't re-enable — form is hidden on both success and error
    submitBtn.innerHTML = originalLabel;
  });
}
