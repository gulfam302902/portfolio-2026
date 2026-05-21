document.addEventListener('DOMContentLoaded', () => {
    const processSection = document.querySelector('.process');
    const timelineLine = document.querySelector('.timeline-line');
    const timelineProgress = document.getElementById('timeline-progress');
    const processSteps = document.querySelectorAll('.process-step');

    if (!processSection || !timelineLine || !timelineProgress || processSteps.length === 0) return;

    // Handle scroll interaction for the process timeline
    const updateTimeline = () => {
        const lineRect = timelineLine.getBoundingClientRect();
        
        // Set the trigger point to slightly below the middle of the viewport
        const triggerPoint = window.innerHeight * 0.6; 
        
        // Calculate the percentage of the line that has passed the trigger block
        const pixelsPassed = triggerPoint - lineRect.top;
        const totalLineHeight = lineRect.height;
        
        let progress = 0;
        if (pixelsPassed > 0) {
            progress = (pixelsPassed / totalLineHeight) * 100;
        }
        
        // Clamp between 0 and 100
        progress = Math.max(0, Math.min(100, progress));
        
        // Apply height to progress line
        timelineProgress.style.height = `${progress}%`;
        
        // Activate step indicators dynamically
        processSteps.forEach(step => {
            const circle = step.querySelector('.circle');
            // We measure from the circle's own position to be perfectly accurate
            const circleRect = circle.getBoundingClientRect();
            
            // If the center of the circle crosses the trigger point
            if (circleRect.top + (circleRect.height / 2) < triggerPoint) {
                circle.classList.add('active');
            } else {
                circle.classList.remove('active');
            }
        });
    };

    // Initial check
    updateTimeline();
    
    // Listen to scroll events
    window.addEventListener('scroll', updateTimeline, { passive: true });
});

// Testimonial Slider Logic
document.addEventListener('DOMContentLoaded', () => {
    const slides = document.querySelectorAll('.testi-card');
    const dots = document.querySelectorAll('.testi-dot');
    const sliderContainer = document.querySelector('.testi-slider-container');
    
    if (slides.length === 0 || dots.length === 0 || !sliderContainer) return;
    
    let currentSlide = 0;
    const totalSlides = slides.length;
    let slideInterval;
    const intervalTime = 5000; // 5 seconds
    
    const goToSlide = (index) => {
        // Remove active class from all
        slides.forEach(slide => slide.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));
        
        // Add active class to current
        slides[index].classList.add('active');
        dots[index].classList.add('active');
        
        currentSlide = index;
    };
    
    const nextSlide = () => {
        let nextIndex = (currentSlide + 1) % totalSlides;
        goToSlide(nextIndex);
    };
    
    // Start auto slide
    const startSlider = () => {
        slideInterval = setInterval(nextSlide, intervalTime);
    };
    
    // Pause auto slide
    // This allows the user time to read if they hover or interact
    const stopSlider = () => {
        clearInterval(slideInterval);
    };
    
    // Setup dots click interaction
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            goToSlide(index);
            // reset interval on manual click
            stopSlider();
            startSlider();
        });
    });
    
    // Pause on hover
    sliderContainer.addEventListener('mouseenter', stopSlider);
    sliderContainer.addEventListener('mouseleave', startSlider);
    
    // Initialize
    goToSlide(0);
    startSlider();
});

// Hero Floating Cards Parallax
document.addEventListener('mousemove', (e) => {
    const cards = document.querySelectorAll('.floating-card');
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    
    const moveX = (mouseX - centerX) / centerX;
    const moveY = (mouseY - centerY) / centerY;
    
    cards.forEach((card, index) => {
        const factor = parseFloat(card.getAttribute('data-parallax-factor')) || 0.03;
        // Apply a slight opposite movement for one of the boxes (index 1)
        const multiplier = index === 1 ? -1 : 1;
        const x = moveX * (window.innerWidth * factor) * multiplier;
        const y = moveY * (window.innerHeight * factor) * multiplier;
        
        card.style.transform = `translate(${x}px, ${y}px)`;
    });
});

// Scroll Reveal & Parallax
document.addEventListener('DOMContentLoaded', () => {
    // 1. Entrance Animations on Scroll
    const observerOptions = {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                // Once it's revealed, we don't need to observe it anymore
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const revealElements = document.querySelectorAll('.reveal-on-scroll');
    revealElements.forEach(el => observer.observe(el));

    // 2. Subtle Scroll Parallax for Images
    const parallaxElements = document.querySelectorAll('[data-parallax-strength]');
    
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        
        parallaxElements.forEach(el => {
            const strength = parseFloat(el.getAttribute('data-parallax-strength')) || 0.1;
            const parent = el.parentElement;
            const parentRect = parent.getBoundingClientRect();
            
            // Only calculate if the element is in or near the viewport
            if (parentRect.top < window.innerHeight && parentRect.bottom > 0) {
                const distance = (window.innerHeight / 2) - (parentRect.top + parentRect.height / 2);
                const move = distance * strength;
                
                // If it's the about image wrapper, we want to move the inner card
                const target = el.querySelector('.about-image-card') || el;
                target.style.transform = `translateY(${move}px)`;
            }
        });
    }, { passive: true });

    // 3. 3D Tilt Interaction for Impact Cards
    const impactSection = document.querySelector('.impact');
    const impactCards = document.querySelectorAll('.impact-card');
    
    if (impactSection && impactCards.length > 0) {
        window.addEventListener('mousemove', (e) => {
            const rect = impactSection.getBoundingClientRect();
            
            // Check if section is in viewport to save performance
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                const mouseX = e.clientX;
                const mouseY = e.clientY;
                
                const centerX = window.innerWidth / 2;
                const centerY = window.innerHeight / 2;
                
                const moveX = (mouseX - centerX) / centerX;
                const moveY = (mouseY - centerY) / centerY;
                
                // Max tilt/move amount
                const tiltX = moveY * -5; // rotateX
                const tiltY = moveX * 5;  // rotateY
                const transX = moveX * 20;
                const transY = moveY * 20;

                impactCards.forEach(card => {
                    card.style.transition = 'transform 0.2s cubic-bezier(0.1, 0.4, 0.2, 1)';
                    card.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translate3d(${transX}px, ${transY}px, 0)`;
                });
            }
        });
        
        impactSection.addEventListener('mouseleave', () => {
            impactCards.forEach(card => {
                card.style.transition = 'all 1s cubic-bezier(0.23, 1, 0.32, 1)';
                card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) translate3d(0, 0, 0)`;
            });
        });
    }
    // 4. Smooth Scroll for Navigation Links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });

                // Add highlight/glow effect if navigating to contact section
                if (targetId === '#contact') {
                    const footerCard = targetElement.querySelector('.footer-card');
                    if (footerCard) {
                        footerCard.classList.add('contact-glow');
                        setTimeout(() => {
                            footerCard.classList.remove('contact-glow');
                        }, 3000);
                    }
                }
            }
        });
    });
});
