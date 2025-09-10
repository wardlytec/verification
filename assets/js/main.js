// ====== DOM Elements ======
const themeToggle = document.getElementById("themeToggle");
const mobileMenuBtn = document.getElementById("mobileMenuBtn");
const navActions = document.querySelector(".nav .actions");
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightbox-img");
const lightboxClose = document.querySelector("#lightbox .close");
const accordionHeaders = document.querySelectorAll('.accordion-header');
const lightboxTriggers = document.querySelectorAll('.lightbox-trigger');

// ====== Theme Toggle ======
const THEME_KEY = 'wt-theme';

// Function to apply theme
function applyTheme(theme) {
  if (theme === 'light') {
    document.body.classList.add('light');
    document.documentElement.style.setProperty('color-scheme', 'light');
    themeToggle.textContent = '☀️';
  } else {
    document.body.classList.remove('light');
    document.documentElement.style.setProperty('color-scheme', 'dark');
    themeToggle.textContent = '🌙';
  }
}

// Check for saved theme preference
let savedTheme = null;
try {
  savedTheme = localStorage.getItem(THEME_KEY);
} catch(e) {
  console.log('LocalStorage not available');
}

// Initialize theme - default to dark mode
if(savedTheme === null) {
  applyTheme('dark');
  try {
    localStorage.setItem(THEME_KEY, 'dark');
  } catch(e) {}
} else {
  applyTheme(savedTheme);
}

// Theme toggle event
if(themeToggle) {
  themeToggle.addEventListener("click", () => {
    const isLight = document.body.classList.contains("light");
    const newTheme = isLight ? 'dark' : 'light';

    applyTheme(newTheme);

    try {
      localStorage.setItem(THEME_KEY, newTheme);
    } catch(e) {
      console.log('Could not save theme preference');
    }
  });
}

// ====== Mobile Menu Toggle ======
if(mobileMenuBtn && navActions) {
  mobileMenuBtn.addEventListener("click", () => {
    mobileMenuBtn.classList.toggle("active");
    navActions.classList.toggle("active");
  });

  // Close menu when clicking on a link
  navActions.addEventListener("click", (e) => {
    if(e.target.classList.contains("link")) {
      mobileMenuBtn.classList.remove("active");
      navActions.classList.remove("active");
    }
  });

  // Close menu when clicking outside
  document.addEventListener("click", (e) => {
    if(!mobileMenuBtn.contains(e.target) && !navActions.contains(e.target)) {
      mobileMenuBtn.classList.remove("active");
      navActions.classList.remove("active");
    }
  });

  // Close menu on escape key
  document.addEventListener("keydown", (e) => {
    if(e.key === "Escape" && navActions.classList.contains("active")) {
      mobileMenuBtn.classList.remove("active");
      navActions.classList.remove("active");
    }
  });
}

// ====== Lightbox ======
function openLightbox(src) {
  lightboxImg.src = src;
  lightbox.classList.add('open');
  lightbox.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden'; // Prevent scrolling
}

function closeLightbox() {
  lightbox.classList.remove('open');
  lightbox.setAttribute('aria-hidden', 'true');
  setTimeout(() => {
    lightboxImg.removeAttribute('src');
  }, 250);
  document.body.style.overflow = ''; // Enable scrolling
}

// Open lightbox when clicking on a trigger
lightboxTriggers.forEach(trigger => {
  trigger.addEventListener('click', function(e) {
    e.preventDefault();
    const src = this.getAttribute('href');
    openLightbox(src);
  });
});

// Close lightbox when clicking the close button
lightboxClose.addEventListener('click', closeLightbox);

// Close lightbox when clicking outside the image
lightbox.addEventListener('click', (e) => {
  if(e.target.id === 'lightbox') {
    closeLightbox();
  }
});

// Close lightbox on escape key
document.addEventListener('keydown', (e) => {
  if(e.key === 'Escape' && lightbox.classList.contains('open')) {
    closeLightbox();
  }
});

// ====== Accordion ======
accordionHeaders.forEach(btn => {
  btn.addEventListener('click', () => {
    const item = btn.parentElement;
    const openItem = document.querySelector('.accordion-item.active');

    // Close previously opened item if it's not the current one
    if(openItem && openItem !== item) {
      openItem.classList.remove('active');
    }

    // Toggle current item
    item.classList.toggle('active');
  });
});

// ====== Performance Optimizations ======

// Lazy loading for images
document.addEventListener('DOMContentLoaded', function() {
  const lazyImages = document.querySelectorAll('img[loading="lazy"]');

  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.src;
          img.classList.remove('lazy');
          observer.unobserve(img);
        }
      });
    });

    lazyImages.forEach(img => imageObserver.observe(img));
  }
});

// Add loading indicator for external links
document.querySelectorAll('a[target="_blank"]').forEach(link => {
  link.addEventListener('click', function() {
    this.style.opacity = '0.7';
    setTimeout(() => {
      this.style.opacity = '1';
    }, 1000);
  });
});

// Improve font loading
if ('fonts' in document) {
  document.fonts.ready.then(() => {
    document.body.classList.add('fonts-loaded');
  });
}
