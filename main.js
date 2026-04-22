// --- CONFIGURACIÓN EMAILJS: reemplazar con valores reales del cliente ---
var EMAILJS_PUBLIC_KEY   = 'TU_PUBLIC_KEY_AQUI';
var EMAILJS_SERVICE_ID   = 'TU_SERVICE_ID_AQUI';
var EMAILJS_TEMPLATE_ID  = 'TU_TEMPLATE_ID_AQUI';

emailjs.init(EMAILJS_PUBLIC_KEY);

function initStickyHeader() {
  var header = document.getElementById('site-header');
  if (!header) return;

  function onScroll() {
    if (window.scrollY > 50) {
      header.classList.add('is-scrolled');
    } else {
      header.classList.remove('is-scrolled');
    }
  }

  window.addEventListener('scroll', onScroll);
  onScroll();
}

function initMobileMenu() {
  var navToggle = document.getElementById('nav-toggle');
  var navMenu   = document.getElementById('nav-menu');
  var navMain   = document.getElementById('nav-main');

  if (!navToggle || !navMenu) return;

  navToggle.addEventListener('click', function () {
    navMain.classList.toggle('is-open');
    var isOpen = navMain.classList.contains('is-open');
    navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  var navLinks = navMenu.querySelectorAll('.nav__link');
  navLinks.forEach(function (link) {
    link.addEventListener('click', function () {
      navMain.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

function initActiveNavOnScroll() {
  var sectionIds = ['section-home', 'section-services', 'section-about', 'section-contact'];

  var sections = sectionIds.map(function (id) {
    return document.getElementById(id);
  }).filter(function (el) {
    return el !== null;
  });

  var navLinks = document.querySelectorAll('#nav-menu .nav__link');

  window.addEventListener('scroll', function () {
    var activeSection = null;

    sections.forEach(function (section) {
      var rect = section.getBoundingClientRect();
      if (rect.top <= window.innerHeight / 2 && rect.top > -section.offsetHeight) {
        activeSection = section;
      }
    });

    if (!activeSection) return;

    navLinks.forEach(function (link) {
      link.classList.remove('is-active');
    });

    navLinks.forEach(function (link) {
      if (link.getAttribute('href') === '#' + activeSection.id) {
        link.classList.add('is-active');
      }
    });
  });
}

function initScrollAnimations() {
  var elements = document.querySelectorAll('.animate-on-scroll');
  if (!elements.length) return;

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-active');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  elements.forEach(function (el) {
    observer.observe(el);
  });
}

function validateForm(formData) {
  var isValid = true;

  var nameInput    = document.getElementById('form-name');
  var emailInput   = document.getElementById('form-email');
  var messageInput = document.getElementById('form-message');
  var nameError    = document.getElementById('form-name-error');
  var emailError   = document.getElementById('form-email-error');
  var messageError = document.getElementById('form-message-error');

  nameInput.classList.remove('has-error');
  emailInput.classList.remove('has-error');
  messageInput.classList.remove('has-error');
  nameError.classList.add('is-hidden');
  emailError.classList.add('is-hidden');
  messageError.classList.add('is-hidden');

  if (formData.name.trim().length === 0) {
    nameInput.classList.add('has-error');
    nameError.classList.remove('is-hidden');
    isValid = false;
  }

  var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(formData.email.trim())) {
    emailInput.classList.add('has-error');
    emailError.classList.remove('is-hidden');
    isValid = false;
  }

  if (formData.message.trim().length === 0) {
    messageInput.classList.add('has-error');
    messageError.classList.remove('is-hidden');
    isValid = false;
  }

  return isValid;
}

function initContactForm() {
  var form       = document.getElementById('contact-form');
  var submitBtn  = document.getElementById('form-submit');
  var feedback   = document.getElementById('form-feedback');

  if (!form) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var honeypot = form.querySelector('[name="website"]');
    if (honeypot && honeypot.value.trim() !== '') return;

    var formData = {
      name:    document.getElementById('form-name').value,
      email:   document.getElementById('form-email').value,
      message: document.getElementById('form-message').value
    };

    if (!validateForm(formData)) return;

    submitBtn.disabled = true;
    submitBtn.classList.add('is-hidden');
    feedback.classList.remove('feedback--success');
    feedback.classList.remove('feedback--error');
    feedback.classList.add('is-hidden');

    var templateParams = {
      from_name:    formData.name.trim(),
      from_email:   formData.email.trim(),
      message:      formData.message.trim()
    };

    emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams)
      .then(function () {
        feedback.textContent = '¡Mensaje enviado con éxito! Nos pondremos en contacto pronto.';
        feedback.classList.remove('feedback--error');
        feedback.classList.add('feedback--success');
        feedback.classList.remove('is-hidden');
        form.reset();
        submitBtn.disabled = false;
        submitBtn.classList.remove('is-hidden');
      })
      .catch(function () {
        feedback.textContent = 'Ocurrió un error al enviar el mensaje. Por favor, inténtalo de nuevo.';
        feedback.classList.remove('feedback--success');
        feedback.classList.add('feedback--error');
        feedback.classList.remove('is-hidden');
        submitBtn.disabled = false;
        submitBtn.classList.remove('is-hidden');
      });
  });
}

document.addEventListener('DOMContentLoaded', function () {
  initStickyHeader();
  initMobileMenu();
  initActiveNavOnScroll();
  initScrollAnimations();
  initContactForm();
});