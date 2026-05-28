document.addEventListener('DOMContentLoaded', () => {
    
    /* ==============================================
       NAVBAR SCROLL EFFECT
       ============================================== */
    const navbar = document.getElementById('navbar');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    /* ==============================================
       MOBILE MENU TOGGLE
       ============================================== */
    const menuToggle = document.getElementById('mobile-menu-toggle');
    const navLinks = document.getElementById('nav-links');
    
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
            navLinks.style.flexDirection = 'column';
            navLinks.style.position = 'absolute';
            navLinks.style.top = '100%';
            navLinks.style.left = '0';
            navLinks.style.width = '100%';
            navLinks.style.background = 'rgba(0, 0, 0, 0.95)';
            navLinks.style.padding = '24px 0';
            navLinks.style.borderBottom = '1px solid rgba(212, 175, 55, 0.2)';
        });
    }

    /* ==============================================
       FLIP CARDS MOBILE INTERACTION
       ============================================== */
    const flipCards = document.querySelectorAll('.service-card-flip');
    
    flipCards.forEach(card => {
        card.addEventListener('click', function() {
            // Toggle 'is-flipped' class manually for mobile tap
            this.classList.toggle('is-flipped');
        });
    });

    /* ==============================================
       SCROLL ANIMATIONS (INTERSECTION OBSERVER)
       ============================================== */
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                scrollObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const products = document.querySelectorAll('.product-item');
    
    products.forEach(product => {
        scrollObserver.observe(product);
    });

    flipCards.forEach(card => {
        scrollObserver.observe(card);
    });

    /* ==============================================
       METRICS COUNTER ANIMATION
       ============================================== */
    const counters = document.querySelectorAll('.stat-value');
    let hasAnimated = false;

    const animateCounter = (element) => {
        const target = +element.getAttribute('data-target');
        const duration = 2000;
        const increment = target / (duration / 16);
        let current = 0;
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                element.textContent = target % 1 === 0 ? target : target.toFixed(1);
                clearInterval(timer);
            } else {
                element.textContent = target % 1 === 0 ? Math.ceil(current) : current.toFixed(1);
            }
        }, 16);
    };

    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !hasAnimated) {
                counters.forEach(counter => animateCounter(counter));
                hasAnimated = true;
            }
        });
    }, { threshold: 0.5 });
    
    const dashboardSection = document.querySelector('.dashboard-stats');
    if (dashboardSection) {
        counterObserver.observe(dashboardSection);
    }

    /* ==============================================
       PARTICLE SYSTEM
       ============================================== */
    const particlesContainer = document.getElementById('particles');
    const particleCount = window.innerWidth < 768 ? 20 : 50;

    if (particlesContainer) {
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            // Posición random
            particle.style.left = Math.random() * 100 + '%';
            particle.style.top = Math.random() * 100 + '%';
            
            // Animación randomizada
            particle.style.animationDelay = (Math.random() * 15) + 's';
            particle.style.animationDuration = (10 + Math.random() * 10) + 's';
            
            // Opacidad base variada para mayor realismo (café oro)
            particle.style.opacity = Math.random() * 0.5 + 0.1;

            particlesContainer.appendChild(particle);
        }
    }

    /* ==============================================
       SMOOTH SCROLL FOR LINKS
       ============================================== */
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
                
                // Close mobile menu if open
                if (window.innerWidth < 768) {
                    navLinks.style.display = 'none';
                }
            }
        });
    });
});
