// Mobile Menu Toggle
document.addEventListener('DOMContentLoaded', function() {
    // Load Hebrew date from Hebcal API
    const loadHebrewDate = async () => {
        const hebrewDateElement = document.getElementById('hebrew-date');
        if (!hebrewDateElement) return;
        hebrewDateElement.textContent = 'Loading...';
        
        try {
            const today = new Date();
            const response = await fetch(`https://www.hebcal.com/converter?cfg=json&gy=${today.getFullYear()}&gm=${today.getMonth() + 1}&gd=${today.getDate()}&g2h=1`);
            const data = await response.json();
            
            
            // Check different possible response formats
            if (data.hm !== undefined && data.hd !== undefined && data.hy !== undefined) {
                // Convert Hebrew month number to English name
                const hebrewMonths = [
                    'Tishrei', 'Cheshvan', 'Kislev', 'Tevet', 'Shevat', 'Adar',
                    'Nisan', 'Iyyar', 'Sivan', 'Tammuz', 'Av', 'Elul'
                ];
                
                let monthName;
                
                // Handle Adar in leap years
                if (data.leap) {
                    // In leap years, months are numbered differently
                    if (data.hm === 12) {
                        monthName = 'Adar I';
                    } else if (data.hm === 13) {
                        monthName = 'Adar II';
                    } else if (data.hm < 6) {
                        // Months after Adar II
                        monthName = hebrewMonths[data.hm + 6];
                    } else {
                        // Months before Adar I
                        monthName = hebrewMonths[data.hm - 1];
                    }
                } else {
                    // Regular year - month numbers correspond to array indices
                    monthName = hebrewMonths[data.hm - 1];
                }
                
                // Add safety check
                if (!monthName) {
                    monthName = hebrewMonths[0]; // Default to Tishrei if something goes wrong
                }
                
                hebrewDateElement.textContent = `${data.hd} ${monthName} ${data.hy}`;
            } else {
                // Use a fallback API endpoint
                const fallbackResponse = await fetch(`https://www.hebcal.com/hebcal?v=1&cfg=json&maj=off&min=off&mod=off&nx=off&year=${today.getFullYear()}&month=${today.getMonth() + 1}&ss=off&mf=off&c=off&s=off&geo=none`);
                const fallbackData = await fallbackResponse.json();
                
                hebrewDateElement.textContent = today.toLocaleDateString('en-US');
            }
        } catch (error) {
            // Fallback to local Hebrew date
            hebrewDateElement.textContent = new Date().toLocaleDateString('he-IL');
        }
    };
    
    loadHebrewDate();
    
    // Israel time clock with modern display
    const updateIsraelTime = () => {
        const now = new Date();
        // Convert to Israel time (UTC+2 or UTC+3 depending on DST)
        const israelTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Jerusalem" }));
        
        const hours = israelTime.getHours().toString().padStart(2, '0');
        const minutes = israelTime.getMinutes().toString().padStart(2, '0');
        const seconds = israelTime.getSeconds().toString().padStart(2, '0');
        
        const timeString = `${hours}:${minutes}:${seconds}`;
        const israelTimeElement = document.getElementById('israel-time');
        
        if (israelTimeElement) {
            israelTimeElement.innerHTML = `${timeString} <span class="time-suffix">IST</span>`;
        }
    };
    
    // Update clock immediately and then every second
    updateIsraelTime();
    setInterval(updateIsraelTime, 1000);
    
    // Load prayer times based on sunrise/sunset
    const loadPrayerTimes = async () => {
        try {
            // Using latitude and longitude for Tustin, CA
            const lat = 33.7175;
            const lng = -117.8311;
            
            // Get sunrise and sunset times
            const response = await fetch(`https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lng}&formatted=0`);
            const data = await response.json();
            
            if (data.status === 'OK') {
                const sunrise = new Date(data.results.sunrise);
                const sunset = new Date(data.results.sunset);
                
                // Calculate Jewish prayer times based on traditional calculations
                // Shacharit: 1 hour after sunrise
                const shacharit = new Date(sunrise.getTime() + 60 * 60 * 1000);
                
                // Mincha: 1 hour before sunset  
                const mincha = new Date(sunset.getTime() - 60 * 60 * 1000);
                
                // Ma'ariv: 1 hour after sunset
                const maariv = new Date(sunset.getTime() + 60 * 60 * 1000);
                
                // Update the prayer times in the UI
                const formatTime = (date) => {
                    let hours = date.getHours();
                    const minutes = date.getMinutes();
                    const ampm = hours >= 12 ? 'PM' : 'AM';
                    hours = hours % 12;
                    hours = hours ? hours : 12;
                    return `${hours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
                };
                
                // Update prayer times
                const prayerRows = document.querySelectorAll('.prayer-row');
                if (prayerRows.length >= 3) {
                    prayerRows[0].querySelector('.prayer-time').textContent = formatTime(shacharit);
                    prayerRows[1].querySelector('.prayer-time').textContent = formatTime(mincha);
                    prayerRows[2].querySelector('.prayer-time').textContent = formatTime(maariv);
                }
            }
        } catch (error) {
            console.error('Error loading prayer times:', error);
            // Keep default times if API fails
        }
    };
    
    // Load prayer times on page load
    loadPrayerTimes();
    // Mobile menu toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', function() {
            navLinks.classList.toggle('active');
        });
    }
    
    // Dropdown menu toggle for mobile
    const dropdowns = document.querySelectorAll('.dropdown');
    
    dropdowns.forEach(dropdown => {
        const link = dropdown.querySelector('a');
        
        if (link) {
            link.addEventListener('click', function(e) {
                // Only handle the click if we're in mobile view
                if (window.innerWidth <= 768) {
                    e.preventDefault();
                    dropdown.classList.toggle('active');
                }
            });
        }
    });
    
    // Back to top button functionality
    const backToTopButton = document.getElementById('backToTop');
    
    if (backToTopButton) {
        // Show/hide the button based on scroll position
        window.addEventListener('scroll', function() {
            if (window.pageYOffset > 300) {
                backToTopButton.classList.add('visible');
            } else {
                backToTopButton.classList.remove('visible');
            }
        });
        
        // Scroll to top when clicked
        backToTopButton.addEventListener('click', function(e) {
            e.preventDefault();
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
    
    // Load real Parashah information from Hebcal API
    const loadParashah = async () => {
        const paraLoader = document.getElementById('parashah-loader');
        if (!paraLoader) return;
        
        paraLoader.style.display = 'block';
        
        try {
            // Use a simpler approach - just get the current Torah portion for the location
            const response = await fetch(`https://www.hebcal.com/shabbat?cfg=json&geo=pos&latitude=33.7175&longitude=-117.8311&tzid=America/Los_Angeles`);
            const data = await response.json();
            
            // Find the Torah reading item
            const torahReading = data.items?.find(item => 
                item.category === 'parashat'
            );
            
            if (torahReading) {
                const parashahName = torahReading.title.replace('Parashat ', '');
                const hebrew = torahReading.hebrew?.replace('פרשת ', '') || '';
                
                // Update Parashah name
                document.getElementById('parashah-name').textContent = parashahName;
                
                // Extract Torah and Haftarah from leyning if available
                if (torahReading.leyning) {
                    document.getElementById('torah-reading').textContent = torahReading.leyning.torah || 'Check synagogue bulletin';
                    document.getElementById('haftarah-reading').textContent = torahReading.leyning.haftarah || 'Check synagogue bulletin';
                } else {
                    // Fallback values based on common Torah portions
                    document.getElementById('torah-reading').textContent = torahReading.torah || 'Check synagogue bulletin'; 
                    document.getElementById('haftarah-reading').textContent = torahReading.haftarah || 'Check synagogue bulletin';
                }
                
                // Update the main content area
                const mainParashahElement = document.querySelector('.infobox strong');
                if (mainParashahElement) {
                    const infoboxContent = mainParashahElement.parentElement;
                    infoboxContent.innerHTML = `<i class="fas fa-info-circle"></i>
                        <strong>Shabbat Service This Week:</strong> Join us Saturday at 10:00 AM for worship, Torah reading (Parashat ${parashahName}), and fellowship meal at our Tustin location.`;
                }
                
                // Update Brit Chadashah based on the found Parashah
                const britReadings = {
                    'Bereshit': 'Matthew 1:1-17; John 1:1-18',
                    'Noach': 'Matthew 24:36-44; 1 Peter 3:18-22',
                    'Lech-Lecha': 'Romans 4:1-25; Hebrews 11:8-12',
                    'Vayera': 'James 2:14-26; Hebrews 11:17-19',
                    'Chayei Sara': '1 Corinthians 15:50-57',
                    'Toldot': 'Romans 9:6-13; Hebrews 11:20',
                    'Vayetzei': 'John 1:43-51',
                    'Vayishlach': 'Hebrews 11:11-20',
                    'Vayeshev': 'Acts 7:9-16',
                    'Miketz': 'Acts 7:9-16',
                    'Vayigash': 'Acts 7:13-15',
                    'Vayechi': 'Hebrews 11:21',
                    'Shemot': 'Acts 7:17-35',
                    'Vaera': 'Romans 9:14-17',
                    'Bo': 'John 19:31-37; 1 Corinthians 5:6-8',
                    'Beshalach': '1 Corinthians 10:1-13',
                    'Yitro': 'Acts 6:1-7; 1 Timothy 3:1-13',
                    'Mishpatim': 'Matthew 5:38-42; Colossians 3:1-25',
                    'Terumah': 'Hebrews 8:1-6',
                    'Tetzaveh': 'Philippians 4:10-20',
                    'Ki Tisa': '2 Corinthians 3:1-18',
                    'Vayakhel': 'Hebrews 9:1-14',
                    'Pekudei': 'Hebrews 9:1-14',
                    'Vayikra': 'Hebrews 9:11-28',
                    'Tzav': 'Mark 12:28-34',
                    'Shemini': '2 Corinthians 6:14-7:1',
                    'Tazria': 'Matthew 8:1-4',
                    'Metzora': 'Luke 17:11-19',
                    'Acharei Mot': 'Romans 3:19-28; Hebrews 7:23-10:18',
                    'Kedoshim': '1 Peter 1:13-16',
                    'Emor': '1 Peter 2:4-10',
                    'Behar': 'Luke 4:16-21',
                    'Bechukotai': 'John 14:15-21',
                    'Bamidbar': '1 Corinthians 12:12-31',
                    'Naso': 'Acts 21:17-32',
                    'Beha\'alotcha': 'John 6:1-14',
                    'Shelach': 'Hebrews 3:7-19',
                    'Korach': '2 Timothy 2:8-21',
                    'Chukat': 'John 3:9-21',
                    'Balak': '2 Peter 2:1-22',
                    'Pinchas': 'Matthew 26:1-30',
                    'Matot': 'Matthew 5:33-37',
                    'Masei': 'James 4:1-12',
                    'Devarim': 'John 15:1-11',
                    'Vaetchanan': 'Mark 12:28-34',
                    'Eikev': 'Luke 4:1-13',
                    'Re\'eh': '1 Corinthians 5:9-13',
                    'Shoftim': 'Matthew 5:38-42',
                    'Ki Teitzei': '1 Corinthians 5:1-5',
                    'Ki Tavo': 'Romans 11:1-15',
                    'Nitzavim': 'Romans 10:11-13',
                    'Vayeilech': 'Hebrews 13:5-8',
                    'Ha\'azinu': 'Romans 10:17-21',
                    'V\'Zot HaBerachah': 'Matthew 17:1-9'
                };
                
                document.getElementById('brit-reading').textContent = britReadings[parashahName] || 'Matthew 5:1-48';
            } else {
                // Fallback values
                document.getElementById('parashah-name').textContent = "This Week's Portion";
                document.getElementById('torah-reading').textContent = "Check our bulletin";
                document.getElementById('haftarah-reading').textContent = "Check our bulletin";
                document.getElementById('brit-reading').textContent = "Matthew 5:1-48";
            }
            
        } catch (error) {
            console.error('Error loading Parashah:', error);
            // Fallback to default values
            document.getElementById('parashah-name').textContent = "This Week's Portion";
            document.getElementById('torah-reading').textContent = "Check our bulletin";
            document.getElementById('haftarah-reading').textContent = "Check our bulletin";
            document.getElementById('brit-reading').textContent = "Check our bulletin";
        } finally {
            paraLoader.style.display = 'none';
        }
    };
    
    loadParashah();
    
    // Load real candle lighting times from Hebcal API
    const loadCandleLighting = async () => {
        const candleLoader = document.getElementById('candle-times-loader');
        if (!candleLoader) return;
        
        candleLoader.style.display = 'block';
        
        try {
            // Get next two Fridays
            const today = new Date();
            const nextFriday = new Date(today);
            const daysUntilFriday = (5 - today.getDay() + 7) % 7 || 7;
            nextFriday.setDate(today.getDate() + daysUntilFriday);
            
            const followingFriday = new Date(nextFriday);
            followingFriday.setDate(nextFriday.getDate() + 7);
            
            // Format dates for API
            const formatDate = (date) => {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}${month}${day}`;
            };
            
            // Tustin, CA coordinates
            const lat = 33.7175;
            const lng = -117.8311;
            const tzid = 'America/Los_Angeles';
            
            // Fetch candle lighting times
            const response = await fetch(`https://www.hebcal.com/shabbat?cfg=json&geo=pos&latitude=${lat}&longitude=${lng}&tzid=${tzid}&start=${formatDate(nextFriday)}&end=${formatDate(followingFriday)}`);
            const data = await response.json();
            
            // Parse the response
            const events = data.items || [];
            let candleTime1, candleTime2, havdalahTime;
            
            events.forEach(event => {
                const eventDate = new Date(event.date);
                if (event.category === 'candles') {
                    if (eventDate.toDateString() === nextFriday.toDateString()) {
                        candleTime1 = event;
                    } else if (eventDate.toDateString() === followingFriday.toDateString()) {
                        candleTime2 = event;
                    }
                } else if (event.category === 'havdalah' && eventDate.toDateString() === new Date(nextFriday.getTime() + 86400000).toDateString()) {
                    havdalahTime = event;
                }
            });
            
            // Update DOM with real data
            if (candleTime1) {
                document.getElementById('next-friday-date').textContent = new Date(candleTime1.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                document.getElementById('candle-time-1').textContent = candleTime1.title.match(/\d{1,2}:\d{2}\s*(AM|PM)/i)?.[0] || '7:00 PM';
            }
            
            if (candleTime2) {
                document.getElementById('following-friday-date').textContent = new Date(candleTime2.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                document.getElementById('candle-time-2').textContent = candleTime2.title.match(/\d{1,2}:\d{2}\s*(AM|PM)/i)?.[0] || '7:00 PM';
            }
            
            if (havdalahTime) {
                document.getElementById('havdalah-date').textContent = new Date(havdalahTime.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                document.getElementById('havdalah-time').textContent = havdalahTime.title.match(/\d{1,2}:\d{2}\s*(AM|PM)/i)?.[0] || '8:00 PM';
            }
            
        } catch (error) {
            console.error('Error loading candle times:', error);
            // Use fallback times
            document.getElementById('candle-time-1').textContent = '7:00 PM';
            document.getElementById('candle-time-2').textContent = '7:00 PM';
            document.getElementById('havdalah-time').textContent = '8:00 PM';
        } finally {
            candleLoader.style.display = 'none';
        }
    };
    
    loadCandleLighting();
    
    // Add hover effect to sidebar items
    const sidebarItems = document.querySelectorAll('.sidebar-list a');
    
    sidebarItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            const icon = this.querySelector('i');
            if (icon) {
                icon.classList.add('fa-pulse');
            }
        });
        
        item.addEventListener('mouseleave', function() {
            const icon = this.querySelector('i');
            if (icon) {
                icon.classList.remove('fa-pulse');
            }
        });
    });
    
    // Enhanced Accessibility Features
    function enhanceAccessibility() {
        // Add ARIA attributes for better screen reader support
        const navItems = document.querySelectorAll('nav a');
        navItems.forEach((item, index) => {
            if (!item.getAttribute('aria-label')) {
                item.setAttribute('aria-label', item.textContent.trim());
            }
        });
        
        // Enable keyboard navigation for interactive elements
        const interactiveElements = document.querySelectorAll('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
        interactiveElements.forEach(el => {
            el.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    el.click();
                }
            });
        });
    }
    
    // Call accessibility enhancements
    enhanceAccessibility();
    
    // Check for user color scheme preference
    function detectColorSchemePreference() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            console.log("User prefers dark mode");
        } else {
            console.log("User prefers light mode");
        }
        
        // Listen for changes in color scheme preference
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
            if (e.matches) {
                console.log("User switched to dark mode");
            } else {
                console.log("User switched to light mode");
            }
        });
    }
    
    // Initialize color scheme preferences
    detectColorSchemePreference();
    
    // Simple calendar height adjustment
    function adjustCalendarHeight() {
        const responsive = document.querySelector('.responsive-calendar');
        if (responsive) {
            if (window.innerWidth <= 768) {
                responsive.style.height = '400px';
            } else {
                responsive.style.height = '650px';
            }
        }
    }
    
    adjustCalendarHeight();
    window.addEventListener('resize', adjustCalendarHeight);
    
    // Auto-populate footer links from navigation menu
    const populateFooterLinks = () => {
        const navLinks = document.querySelectorAll('.nav-links > li > a:not(.donate-btn)');
        const footerLinks = document.querySelector('.footer-links');
        
        if (footerLinks && navLinks.length > 0) {
            footerLinks.innerHTML = '';
            
            navLinks.forEach(link => {
                const li = document.createElement('li');
                const a = document.createElement('a');
                a.href = link.href;
                a.innerHTML = `<i class="fas fa-chevron-right"></i> ${link.textContent.trim()}`;
                li.appendChild(a);
                footerLinks.appendChild(li);
            });
        }
    };
    
    populateFooterLinks();
    
    // Modal functionality for unset hyperlinks
    const createModal = () => {
        // Create modal HTML
        const modalHTML = `
            <div id="link-modal" class="modal" style="display: none;">
                <div class="modal-overlay"></div>
                <div class="modal-content">
                    <button class="modal-close">&times;</button>
                    <h3><i class="fas fa-construction"></i> Page Under Construction</h3>
                    <p>We're working hard to bring you this content!</p>
                    <p class="modal-link-info">You clicked on: <span id="modal-link-text"></span></p>
                    <button class="btn modal-btn">Got it!</button>
                </div>
            </div>
        `;
        
        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Get modal elements
        const modal = document.getElementById('link-modal');
        const modalClose = modal.querySelector('.modal-close');
        const modalBtn = modal.querySelector('.modal-btn');
        const modalOverlay = modal.querySelector('.modal-overlay');
        const modalLinkText = document.getElementById('modal-link-text');
        
        // Track timeout for auto-close
        let autoCloseTimeout = null;
        
        // Close modal function
        const closeModal = () => {
            if (autoCloseTimeout) {
                clearTimeout(autoCloseTimeout);
                autoCloseTimeout = null;
            }
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        };
        
        // Show modal function
        const showModal = (linkText) => {
            modalLinkText.textContent = linkText;
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
            
            // Auto-close after 2 seconds
            autoCloseTimeout = setTimeout(closeModal, 2000);
        };
        
        // Close modal events
        modalClose.addEventListener('click', closeModal);
        modalBtn.addEventListener('click', closeModal);
        modalOverlay.addEventListener('click', closeModal);
        
        // Add event listeners to all links with href="#"
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href="#"]');
            if (link && link.id !== 'backToTop') {
                e.preventDefault();
                const linkText = link.textContent.trim();
                showModal(linkText);
            }
        });
        
        // Close modal on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.style.display === 'block') {
                closeModal();
            }
        });
    };
    
    // Initialize modal functionality
    createModal();
});