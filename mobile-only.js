/* ===== MOBILE-ONLY JAVASCRIPT ===== */
/* Mobile interactions and functionality */

// Mobile detection
function isMobile() {
    return window.innerWidth <= 768;
}

// Initialize mobile functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    if (isMobile()) {
        initMobileMenu();
        initMobileDropdowns();
        initMobileTouchInteractions();
    }
});

// Reinitialize on window resize
window.addEventListener('resize', function() {
    if (isMobile()) {
        initMobileMenu();
        initMobileDropdowns();
    } else {
        closeMobileMenu();
    }
});

/* ===== MOBILE MENU FUNCTIONALITY ===== */
function initMobileMenu() {
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const navContainer = document.querySelector('.nav-container');
    const navOverlay = document.querySelector('.nav-overlay');
    
    // Create mobile menu button if it doesn't exist
    if (!menuBtn) {
        createMobileMenuButton();
    }
    
    // Create overlay if it doesn't exist
    if (!navOverlay) {
        createNavOverlay();
    }
}

function createMobileMenuButton() {
    const menuBtn = document.createElement('button');
    menuBtn.className = 'mobile-menu-btn';
    menuBtn.setAttribute('aria-label', 'Toggle navigation menu');
    menuBtn.innerHTML = '<span></span><span></span><span></span>';
    menuBtn.addEventListener('click', toggleMobileMenu);
    
    document.body.appendChild(menuBtn);
}

function createNavOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'nav-overlay';
    overlay.addEventListener('click', closeMobileMenu);
    document.body.appendChild(overlay);
}

function toggleMobileMenu() {
    if (!isMobile()) return;
    
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const navContainer = document.querySelector('.nav-container');
    const navOverlay = document.querySelector('.nav-overlay');
    
    if (menuBtn && navContainer && navOverlay) {
        const isActive = navContainer.classList.contains('active');
        
        if (isActive) {
            closeMobileMenu();
        } else {
            openMobileMenu();
        }
    }
}

function openMobileMenu() {
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const navContainer = document.querySelector('.nav-container');
    const navOverlay = document.querySelector('.nav-overlay');
    
    if (menuBtn && navContainer && navOverlay) {
        menuBtn.classList.add('active');
        navContainer.classList.add('active');
        navOverlay.classList.add('active');
        
        // Prevent body scrolling when menu is open
        document.body.style.overflow = 'hidden';
    }
}

function closeMobileMenu() {
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const navContainer = document.querySelector('.nav-container');
    const navOverlay = document.querySelector('.nav-overlay');
    
    if (menuBtn) menuBtn.classList.remove('active');
    if (navContainer) navContainer.classList.remove('active');
    if (navOverlay) navOverlay.classList.remove('active');
    
    // Restore body scrolling
    document.body.style.overflow = '';
    
    // Close all dropdowns
    const dropdowns = document.querySelectorAll('.dropdown.active');
    dropdowns.forEach(dropdown => dropdown.classList.remove('active'));
}

/* ===== MOBILE DROPDOWN FUNCTIONALITY ===== */
function initMobileDropdowns() {
    const dropdowns = document.querySelectorAll('.dropdown');
    
    dropdowns.forEach(dropdown => {
        const link = dropdown.querySelector('a');
        const content = dropdown.querySelector('.dropdown-content');
        
        if (link && content) {
            // Remove existing event listeners
            link.removeEventListener('click', handleMobileDropdownClick);
            
            // Add mobile-specific event listener
            link.addEventListener('click', handleMobileDropdownClick);
        }
    });
}

function handleMobileDropdownClick(e) {
    if (!isMobile()) return;
    
    // Don't prevent default for Contact Us and Donate links
    const linkText = e.currentTarget.textContent.trim();
    if (linkText.includes('Contact Us') || linkText.includes('Donate')) {
        return; // Let the default behavior happen
    }
    
    e.preventDefault();
    e.stopPropagation();
    
    const dropdown = e.currentTarget.closest('.dropdown');
    const content = dropdown.querySelector('.dropdown-content');
    
    if (dropdown && content) {
        // Close other dropdowns
        const otherDropdowns = document.querySelectorAll('.dropdown.active');
        otherDropdowns.forEach(otherDropdown => {
            if (otherDropdown !== dropdown) {
                otherDropdown.classList.remove('active');
            }
        });
        
        // Toggle current dropdown
        dropdown.classList.toggle('active');
    }
}

/* ===== MOBILE TOUCH INTERACTIONS ===== */
function initMobileTouchInteractions() {
    // Add touch feedback for all interactive elements
    const interactiveElements = document.querySelectorAll('button, a, .clickable');
    
    interactiveElements.forEach(element => {
        element.addEventListener('touchstart', function() {
            this.style.transform = 'scale(0.98)';
        }, { passive: true });
        
        element.addEventListener('touchend', function() {
            this.style.transform = '';
        }, { passive: true });
        
        element.addEventListener('touchcancel', function() {
            this.style.transform = '';
        }, { passive: true });
    });
}

/* ===== MOBILE COLLAPSIBLE CONTENT ===== */
function initCollapsibleContent() {
    if (!isMobile()) return;
    
    // Make Torah portions collapsible on mobile
    const torahSections = document.querySelectorAll('.content-card');
    
    torahSections.forEach(section => {
        const header = section.querySelector('h3');
        const content = section.querySelector('.reading-content, .parashah-content');
        
        if (header && content && section.textContent.includes('Torah') || section.textContent.includes('Haftarah')) {
            header.style.cursor = 'pointer';
            header.style.position = 'relative';
            
            // Add collapse indicator
            if (!header.querySelector('.collapse-indicator')) {
                const indicator = document.createElement('span');
                indicator.className = 'collapse-indicator';
                indicator.innerHTML = '▼';
                indicator.style.cssText = `
                    position: absolute;
                    right: 0;
                    top: 50%;
                    transform: translateY(-50%);
                    transition: transform 0.3s ease;
                    font-size: 14px;
                `;
                header.appendChild(indicator);
            }
            
            header.addEventListener('click', function() {
                const isHidden = content.style.display === 'none';
                const indicator = header.querySelector('.collapse-indicator');
                
                if (isHidden) {
                    content.style.display = '';
                    if (indicator) indicator.style.transform = 'translateY(-50%) rotate(0deg)';
                } else {
                    content.style.display = 'none';
                    if (indicator) indicator.style.transform = 'translateY(-50%) rotate(-90deg)';
                }
            });
        }
    });
}

/* ===== MOBILE ACCESSIBILITY ===== */
function initMobileAccessibility() {
    // Ensure focus is visible on mobile
    document.addEventListener('focusin', function(e) {
        if (isMobile()) {
            e.target.style.outline = '2px solid var(--primary-blue)';
            e.target.style.outlineOffset = '2px';
        }
    });
    
    document.addEventListener('focusout', function(e) {
        if (isMobile()) {
            e.target.style.outline = '';
            e.target.style.outlineOffset = '';
        }
    });
}

/* ===== MOBILE PERFORMANCE OPTIMIZATIONS ===== */
function initMobileOptimizations() {
    if (!isMobile()) return;
    
    // Lazy load images that are not in viewport
    const images = document.querySelectorAll('img');
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    observer.unobserve(img);
                }
            }
        });
    });
    
    images.forEach(img => {
        if (img.src && !img.dataset.src) {
            img.dataset.src = img.src;
            img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
            imageObserver.observe(img);
        }
    });
}

/* ===== MOBILE INITIALIZATION ===== */
// Initialize all mobile functionality
function initAllMobileFunctionality() {
    if (isMobile()) {
        initMobileMenu();
        initMobileDropdowns();
        initMobileTouchInteractions();
        initCollapsibleContent();
        initMobileAccessibility();
        initMobileOptimizations();
    }
}

// Global functions for HTML onclick handlers
window.toggleMobileMenu = toggleMobileMenu;
window.closeMobileMenu = closeMobileMenu;

// Initialize when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllMobileFunctionality);
} else {
    initAllMobileFunctionality();
}