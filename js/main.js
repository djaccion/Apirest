let currentLang = 'es'
const SECTIONS = ['home', 'servicios', 'quienes-somos', 'contacto']

function setActiveLink(activeEl, allLinks) {
  allLinks.forEach(link => link.classList.remove('nav-link--active'))
  activeEl.classList.add('nav-link--active')
}

function initNavigation() {
  const allLinks = Array.from(document.querySelectorAll('nav a[data-section]'))

  allLinks.forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault()
      setActiveLink(link, allLinks)
      scrollToSection(link.dataset.section)
    })
  })
}

function scrollToSection(sectionId) {
  const target = document.getElementById(sectionId)
  if (!target) return
  target.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function findLinkBySection(sectionId, allLinks) {
  return allLinks.find(link => link.dataset.section === sectionId) || null
}

function initScrollSpy() {
  const sections = Array.from(document.querySelectorAll('section[id]'))
  const allLinks = Array.from(document.querySelectorAll('nav a[data-section]'))

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return
      const matchingLink = findLinkBySection(entry.target.id, allLinks)
      if (matchingLink) setActiveLink(matchingLink, allLinks)
    })
  }, { threshold: 0.4 })

  sections.forEach(section => observer.observe(section))
}

function applyLangToElement(el, lang) {
  const text = el.dataset[lang]
  if (text !== undefined) el.textContent = text
}

function initLangToggle() {
  const toggleBtn = document.querySelector('[data-lang-toggle]')
  if (!toggleBtn) return

  const translatableEls = Array.from(document.querySelectorAll('[data-es][data-en]'))

  toggleBtn.addEventListener('click', () => {
    currentLang = currentLang === 'es' ? 'en' : 'es'
    translatableEls.forEach(el => applyLangToElement(el, currentLang))
    toggleBtn.textContent = currentLang === 'es' ? 'EN' : 'ES'
    document.documentElement.setAttribute('lang', currentLang)
  })
}

function initAnimations() {
  const animatedEls = Array.from(document.querySelectorAll('[data-animate]'))

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return
      entry.target.classList.add('is-visible')
      observer.unobserve(entry.target)
    })
  }, { threshold: 0.15 })

  animatedEls.forEach(el => observer.observe(el))
}

function setInitialActiveLink() {
  const allLinks = Array.from(document.querySelectorAll('nav a[data-section]'))
  if (allLinks.length === 0) return
  const firstLink = allLinks.find(link => link.dataset.section === SECTIONS[0])
  if (firstLink) setActiveLink(firstLink, allLinks)
}

document.addEventListener('DOMContentLoaded', () => {
  setInitialActiveLink()
  initNavigation()
  initScrollSpy()
  initLangToggle()
  initAnimations()
})