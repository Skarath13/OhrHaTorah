// Mobile menu toggle functions
function toggleMenu() {
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const navContainer = document.querySelector('.nav-container');
    const navOverlay = document.querySelector('.nav-overlay');
    
    menuBtn.classList.toggle('active');
    navContainer.classList.toggle('active');
    navOverlay.classList.toggle('active');
    
    // Prevent body scroll when menu is open
    if (navContainer.classList.contains('active')) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = '';
    }
}

function closeMenu() {
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const navContainer = document.querySelector('.nav-container');
    const navOverlay = document.querySelector('.nav-overlay');
    
    menuBtn.classList.remove('active');
    navContainer.classList.remove('active');
    navOverlay.classList.remove('active');
    
    // Restore body scroll
    document.body.style.overflow = '';
}

document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu click handler for nav links
    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            closeMenu();
        });
    });
    
    // Dynamic navigation text wrap detection
    function checkNavTextWrapping() {
        const navLinks = document.querySelectorAll('.nav-links a');
        
        navLinks.forEach(link => {
            // Temporarily remove the wrapped class to get natural height
            link.classList.remove('text-wrapped');
            
            // Create a temporary span to measure single-line height
            const tempSpan = document.createElement('span');
            tempSpan.style.visibility = 'hidden';
            tempSpan.style.position = 'absolute';
            tempSpan.style.whiteSpace = 'nowrap';
            tempSpan.style.fontSize = getComputedStyle(link).fontSize;
            tempSpan.style.fontWeight = getComputedStyle(link).fontWeight;
            tempSpan.style.lineHeight = getComputedStyle(link).lineHeight;
            tempSpan.textContent = link.textContent;
            
            document.body.appendChild(tempSpan);
            const singleLineHeight = tempSpan.offsetHeight;
            document.body.removeChild(tempSpan);
            
            // Check if the actual link height is greater than single line height
            const linkHeight = link.offsetHeight;
            const hasWrapped = linkHeight > singleLineHeight * 1.2; // 20% tolerance
            
            if (hasWrapped) {
                link.classList.add('text-wrapped');
            } else {
                link.classList.remove('text-wrapped');
            }
        });
    }
    
    // Check on page load
    setTimeout(checkNavTextWrapping, 100);
    
    // Check on window resize with debouncing
    let resizeTimeout;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(checkNavTextWrapping, 150);
    });
    // Load Hebrew date from Hebcal API with better date handling
    const loadHebrewDate = async () => {
        const hebrewDateElement = document.getElementById('hebrew-date');
        if (!hebrewDateElement) return;
        hebrewDateElement.textContent = 'Loading...';
        
        try {
            // Try multiple approaches for getting the correct Hebrew date
            let hebrewDateString = null;
            
            // Method 1: Use today's Hebrew date from Shabbat API (most reliable)
            try {
                const shabbatResponse = await fetch(`https://www.hebcal.com/shabbat?cfg=json&geo=pos&latitude=33.7175&longitude=-117.8311&tzid=America/Los_Angeles&lg=en`);
                const shabbatData = await shabbatResponse.json();
                
                if (shabbatData.items && shabbatData.items.length > 0) {
                    // Find today's Hebrew date in the response
                    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
                    for (const item of shabbatData.items) {
                        if (item.date === today) {
                            // Prefer English transliteration over Hebrew text
                            if (item.hdate) {
                                hebrewDateString = item.hdate;
                                break;
                            } else if (item.hebrew) {
                                hebrewDateString = item.hebrew;
                                break;
                            }
                        }
                    }
                }
            } catch (shabbatError) {
                console.warn('Shabbat API failed:', shabbatError);
            }
            
            // Method 2: Use converter API if Shabbat API didn't work
            if (!hebrewDateString) {
                // Get current PST time and check if it's after sunset
                const now = new Date();
                const pstTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
                
                // Get actual sunset time for today to determine Hebrew day boundary
                let isAfterSunset = false;
                try {
                    const lat = 33.7175; // Tustin, CA
                    const lng = -117.8311;
                    const sunsetResponse = await fetch(`https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lng}&formatted=0`);
                    const sunsetData = await sunsetResponse.json();
                    
                    if (sunsetData.status === 'OK') {
                        const sunset = new Date(sunsetData.results.sunset);
                        
                        // Get current time in PST as hours and minutes
                        const currentPSTTime = pstTime.getHours() * 100 + pstTime.getMinutes();
                        
                        // Get sunset time in PST as hours and minutes
                        const sunsetPSTDate = new Date(sunset.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
                        const sunsetPSTTime = sunsetPSTDate.getHours() * 100 + sunsetPSTDate.getMinutes();
                        
                        isAfterSunset = currentPSTTime >= sunsetPSTTime;
                        
                    } else {
                        // Fallback to rough estimate if sunset API fails
                        isAfterSunset = pstTime.getHours() >= 20;
                    }
                } catch (sunsetError) {
                    console.warn('Sunset API failed, using rough estimate');
                    isAfterSunset = pstTime.getHours() >= 20;
                }
                
                let dateToConvert = pstTime;
                if (isAfterSunset) {
                    dateToConvert = new Date(pstTime);
                    dateToConvert.setDate(pstTime.getDate() + 1);
                }
                
                const dateString = dateToConvert.toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
                const [year, month, day] = dateString.split('-');
                
                const converterResponse = await fetch(`https://www.hebcal.com/converter?cfg=json&gy=${year}&gm=${month}&gd=${day}&g2h=1&lg=en`);
                const converterData = await converterResponse.json();
                
                if (converterData.hm !== undefined && converterData.hd !== undefined && converterData.hy !== undefined) {
                    // Check if hm is already a month name (string) or a number
                    if (typeof converterData.hm === 'string') {
                        // API returned month name directly
                        hebrewDateString = `${converterData.hd} ${converterData.hm} ${converterData.hy}`;
                    } else if (converterData.hms) {
                        // Use the Hebrew month name directly from API if available
                        hebrewDateString = `${converterData.hd} ${converterData.hms} ${converterData.hy}`;
                    } else {
                        // Fallback to manual mapping - corrected for Hebrew calendar order
                        const hebrewMonths = [
                            '', // 0 - unused
                            'Tishrei',    // 1 (Sep/Oct)
                            'Cheshvan',   // 2 (Oct/Nov) 
                            'Kislev',     // 3 (Nov/Dec)
                            'Tevet',      // 4 (Dec/Jan)
                            'Shevat',     // 5 (Jan/Feb)
                            'Adar',       // 6 (Feb/Mar) - or Adar I in leap years
                            'Nisan',      // 7 (Mar/Apr) - or Adar II in leap years, then Nisan
                            'Iyyar',      // 8 (Apr/May)
                            'Sivan',      // 9 (May/Jun) ← This should be the correct month
                            'Tammuz',     // 10 (Jun/Jul)
                            'Av',         // 11 (Jul/Aug)
                            'Elul'        // 12 (Aug/Sep)
                        ];
                        
                        let monthName = hebrewMonths[converterData.hm];
                        
                        // Handle leap years
                        if (converterData.leap && converterData.hm >= 6) {
                            if (converterData.hm === 6) monthName = 'Adar I';
                            else if (converterData.hm === 7) monthName = 'Adar II';
                            else if (converterData.hm > 7) monthName = hebrewMonths[converterData.hm - 1];
                        }
                        
                        if (!monthName) {
                            console.error('Could not map month number:', converterData.hm);
                            monthName = `Month ${converterData.hm}`;
                        }
                        
                        hebrewDateString = `${converterData.hd} ${monthName} ${converterData.hy}`;
                    }
                }
            }
            
            // Method 3: Try the today API as final fallback
            if (!hebrewDateString) {
                const todayResponse = await fetch('https://www.hebcal.com/converter?cfg=json&today=1&g2h=1&lg=en');
                const todayData = await todayResponse.json();
                
                if (todayData.hdate) {
                    hebrewDateString = todayData.hdate;
                } else if (todayData.hebrew) {
                    hebrewDateString = todayData.hebrew;
                } else if (todayData.hm !== undefined && todayData.hd !== undefined && todayData.hy !== undefined) {
                    const hebrewMonths = {
                        1: 'Tishrei', 2: 'Cheshvan', 3: 'Kislev', 4: 'Tevet', 
                        5: 'Shevat', 6: 'Adar', 7: 'Nisan', 8: 'Iyyar', 
                        9: 'Sivan', 10: 'Tammuz', 11: 'Av', 12: 'Elul'
                    };
                    
                    const monthName = hebrewMonths[todayData.hm] || 'Unknown';
                    hebrewDateString = `${todayData.hd} ${monthName} ${todayData.hy}`;
                }
            }
            
            // Display the result
            if (hebrewDateString) {
                hebrewDateElement.textContent = hebrewDateString;
            } else {
                throw new Error('All Hebrew date methods failed');
            }
            
        } catch (error) {
            console.error('Error loading Hebrew date:', error);
            // Final fallback - show a placeholder
            hebrewDateElement.textContent = 'Hebrew Date Available Soon';
        }
    };
    
    loadHebrewDate();
    
    // Load Gregorian date
    const loadGregorianDate = () => {
        const gregorianDateElement = document.getElementById('gregorian-date');
        if (!gregorianDateElement) return;
        
        const today = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            timeZone: 'America/Los_Angeles'
        };
        
        gregorianDateElement.textContent = today.toLocaleDateString('en-US', options);
    };
    
    loadGregorianDate();
    
    // PST time clock with modern display
    const updatePSTTime = () => {
        const now = new Date();
        // Convert to PST time
        const pstTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
        
        let hours = pstTime.getHours();
        const minutes = pstTime.getMinutes().toString().padStart(2, '0');
        const seconds = pstTime.getSeconds().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        
        // Convert to 12-hour format
        hours = hours % 12;
        hours = hours ? hours : 12; // 0 should be 12
        
        const timeString = `${hours}:${minutes}:${seconds}`;
        const timeElement = document.getElementById('israel-time');
        
        if (timeElement) {
            timeElement.innerHTML = `${timeString} <span class="time-suffix">${ampm} PST</span>`;
        }
    };
    
    // Update clock immediately and then every second
    updatePSTTime();
    setInterval(updatePSTTime, 1000);
    
    // Hostage Counter - counts up from October 7, 2023 at 6:30 AM IST
    const updateHostageCounter = () => {
        // October 7, 2023 at 6:30 AM IST (when the attack began)
        const attackDate = new Date('2023-10-07T06:30:00+03:00');
        const now = new Date();
        
        // Calculate time difference in milliseconds
        const timeDiff = now.getTime() - attackDate.getTime();
        
        // Calculate days, hours, minutes, and seconds
        const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
        
        // Update the display elements
        const daysElement = document.getElementById('hostage-days');
        const hoursElement = document.getElementById('hostage-hours');
        const minutesElement = document.getElementById('hostage-minutes');
        const secondsElement = document.getElementById('hostage-seconds');
        
        if (daysElement) daysElement.textContent = days.toString().padStart(3, '0');
        if (hoursElement) hoursElement.textContent = hours.toString().padStart(2, '0');
        if (minutesElement) minutesElement.textContent = minutes.toString().padStart(2, '0');
        if (secondsElement) secondsElement.textContent = seconds.toString().padStart(2, '0');
    };
    
    // Update hostage counter immediately and then every second
    updateHostageCounter();
    setInterval(updateHostageCounter, 1000);
    
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
    
    
    // Load real Parashah information
    const loadParashah = async () => {
        const paraLoader = document.getElementById('parashah-loader');
        if (!paraLoader) return;
        
        paraLoader.style.display = 'block';
        
        // Brit Chadashah lookup table
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
            "Beha'alotcha": 'John 6:1-14',
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

        // Try Hebcal API first (primary source) - Annual readings
        const tryHebcalAPI = async () => {
            const apiUrl = `https://www.hebcal.com/shabbat?cfg=json&geo=pos&latitude=33.7175&longitude=-117.8311&tzid=America/Los_Angeles`;
            
            const response = await fetch(apiUrl);
            
            if (!response.ok) {
                throw new Error(`Hebcal API failed: ${response.status}`);
            }
            
            const data = await response.json();
            
            const torahReading = data.items?.find(item => item.category === 'parashat');
            
            
            if (!torahReading) {
                throw new Error('No Torah reading found in Hebcal response');
            }
            
            const result = {
                name: torahReading.title.replace('Parashat ', ''),
                torah: torahReading.leyning?.torah || 'See bulletin',
                haftarah: torahReading.leyning?.haftarah || 'See bulletin',
                date: torahReading.date,
                source: 'Hebcal'
            };
            
            return result;
        };


        // Try Sefaria API as fallback
        const trySefariaAPI = async () => {
            const params = new URLSearchParams({
                timezone: 'America/Los_Angeles',
                diaspora: '1',
                custom: 'sephardi'
            });
            
            const response = await fetch(`https://www.sefaria.org/api/calendars?${params}`);
            
            if (!response.ok) {
                throw new Error(`Sefaria API failed: ${response.status}`);
            }
            
            const data = await response.json();
            const parashatHashavua = data.calendar_items?.find(
                item => item.title?.en === "Parashat Hashavua"
            );
            const haftarah = data.calendar_items?.find(
                item => item.title?.en === "Haftarah"
            );
            
            if (!parashatHashavua) {
                throw new Error('No Parashat Hashavua found in Sefaria response');
            }
            
            return {
                name: parashatHashavua.displayValue?.en || 'Unknown',
                torah: parashatHashavua.ref || 'See bulletin',
                haftarah: haftarah?.ref || 'See bulletin',
                date: data.date,
                source: 'Sefaria'
            };
        };

        // Update UI with parashah data
        const updateParashahUI = (annualData, triennialData = null) => {
            
            // Update parashah name
            document.getElementById('parashah-name').textContent = annualData.name;
            
            // Update header with date
            const parashahHeaderEl = document.getElementById('parashah-header');
            if (parashahHeaderEl && annualData.date) {
                const date = new Date(annualData.date);
                const formattedDate = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
                parashahHeaderEl.textContent = `Weekly Parashah - ${formattedDate}`;
            } else if (parashahHeaderEl) {
                parashahHeaderEl.textContent = 'Weekly Parashah';
            }
            
            // Update Torah and Haftarah readings
            document.getElementById('torah-reading').textContent = annualData.torah;
            document.getElementById('haftarah-reading').textContent = annualData.haftarah;
            
            // Update main content area
            const mainParashahElement = document.querySelector('.infobox strong');
            if (mainParashahElement) {
                const infoboxContent = mainParashahElement.parentElement;
                infoboxContent.innerHTML = `<i class="fas fa-info-circle"></i>
                    <strong>Shabbat Service This Week:</strong> Join us each Saturday at 2:30 p.m. for contemporary Messianic Jewish music and dance, a traditional Mincha Torah Service (Parashat ${annualData.name}), and Scripture study at our Fountain Valley location.`;
            }
            
            // Update Brit Chadashah with flexible name matching
            let britReading = null;
            
            // Try exact match first
            britReading = britReadings[annualData.name];
            
            // If no exact match, try case-insensitive and apostrophe-insensitive search
            if (!britReading) {
                const searchName = annualData.name.toLowerCase();
                for (const [key, value] of Object.entries(britReadings)) {
                    // Replace character code 8217 (right single quotation mark) and other apostrophe variants with standard apostrophe
                    const normalizedKey = key.toLowerCase().replace(/[\u2019\u2018''`]/g, "'");
                    const normalizedSearch = searchName.replace(/[\u2019\u2018''`]/g, "'");
                    if (normalizedKey === normalizedSearch) {
                        britReading = value;
                        break;
                    }
                }
            }
            
            // Check for admin override first
            const britOverride = localStorage.getItem('oht_brit_override');
            if (britOverride) {
                document.getElementById('brit-reading').textContent = britOverride;
            } else {
                document.getElementById('brit-reading').textContent = britReading || 'Pending';
            }
            
            // Update triennial readings if available
            if (triennialData) {
                document.getElementById('triennial-torah-reading').textContent = triennialData.torah;
                document.getElementById('triennial-haftarah-reading').textContent = triennialData.haftarah;
                
                // Update triennial year info
                const yearElement = document.getElementById('triennial-year');
                const yearTextElement = document.getElementById('triennial-year-text');
                if (yearElement) yearElement.textContent = triennialData.year;
                if (yearTextElement) yearTextElement.textContent = triennialData.yearText;
            } else {
                document.getElementById('triennial-torah-reading').textContent = 'Not available';
                document.getElementById('triennial-haftarah-reading').textContent = 'Not available';
                
                // Calculate triennial year for fallback
                const calculateTriennialYearFallback = () => {
                    const now = new Date();
                    const currentYear = now.getFullYear();
                    const currentMonth = now.getMonth() + 1;
                    
                    let effectiveYear = currentYear;
                    if (currentMonth < 10) {
                        effectiveYear = currentYear;
                    } else {
                        effectiveYear = currentYear + 1;
                    }
                    
                    const baseYear = 2025;
                    const baseTriennialYear = 3;
                    const yearDiff = effectiveYear - baseYear;
                    const triennialYear = ((baseTriennialYear - 1 + yearDiff) % 3) + 1;
                    
                    return triennialYear;
                };
                
                const fallbackYear = calculateTriennialYearFallback();
                const fallbackYearText = fallbackYear === 1 ? 'First year of three-year Torah reading cycle' :
                                       fallbackYear === 2 ? 'Second year of three-year Torah reading cycle' :
                                       'Third year of three-year Torah reading cycle';
                
                // Set calculated triennial year info
                const yearElement = document.getElementById('triennial-year');
                const yearTextElement = document.getElementById('triennial-year-text');
                if (yearElement) yearElement.textContent = fallbackYear;
                if (yearTextElement) yearTextElement.textContent = fallbackYearText;
            }
        };

        // Try Hebcal triennial API
        const tryHebcalTriennialAPI = async () => {
            const response = await fetch('https://www.hebcal.com/shabbat?cfg=json&triennial=on&geo=pos&latitude=33.7175&longitude=-117.8311&tzid=America/Los_Angeles&lg=en');
            
            if (!response.ok) {
                throw new Error(`Triennial API responded with status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.items || data.items.length === 0) {
                throw new Error('No triennial data available');
            }
            
            // Find current Shabbat's readings
            const today = new Date();
            const saturday = new Date(today);
            saturday.setDate(today.getDate() + (6 - today.getDay()) % 7);
            const saturdayStr = saturday.toISOString().split('T')[0];
            
            for (const item of data.items) {
                if (item.category === 'parashat' && item.date === saturdayStr) {
                    // Extract triennial data from leyning.triennial
                    const triennial = item.leyning?.triennial;
                    let triennialTorah = 'Not available';
                    
                    if (triennial) {
                        // Construct Torah range from first and last aliyot
                        if (triennial['1'] && triennial['7']) {
                            const firstAliyah = triennial['1'];
                            const lastAliyah = triennial['7'];
                            const startVerse = firstAliyah.split('-')[0];
                            const endVerse = lastAliyah.split('-')[1];
                            triennialTorah = `${startVerse}-${endVerse}`;
                        }
                    }
                    
                    // Calculate triennial year (Conservative movement cycle)
                    const calculateTriennialYear = () => {
                        const now = new Date();
                        const currentYear = now.getFullYear();
                        const currentMonth = now.getMonth() + 1; // 1-12
                        
                        // Conservative triennial cycle reference points:
                        // 2025 Jan-Sep = Year 3, Oct 2025-Sep 2026 = Year 1
                        // 2024 Oct-Sep 2025 = Year 3
                        // 2023 Oct-Sep 2024 = Year 2  
                        // 2022 Oct-Sep 2023 = Year 1
                        
                        let effectiveYear = currentYear;
                        if (currentMonth < 10) { // Before October
                            effectiveYear = currentYear;
                        } else { // October or later - start of new Jewish year
                            effectiveYear = currentYear + 1;
                        }
                        
                        // Calculate based on 2025 = Year 3 reference
                        const baseYear = 2025;
                        const baseTriennialYear = 3;
                        
                        const yearDiff = effectiveYear - baseYear;
                        const triennialYear = ((baseTriennialYear - 1 + yearDiff) % 3) + 1;
                        
                        return triennialYear;
                    };
                    
                    // Try to get from API first, fallback to calculation
                    const triennialYear = item.triennial?.yearNum || calculateTriennialYear();
                    const yearText = triennialYear === 1 ? 'First year of three-year Torah reading cycle' :
                                   triennialYear === 2 ? 'Second year of three-year Torah reading cycle' :
                                   'Third year of three-year Torah reading cycle';
                    
                    return {
                        name: item.title.replace('Parashat ', ''),
                        torah: triennialTorah,
                        haftarah: item.haftarah || item.leyning?.haftarah || 'Not available',
                        year: triennialYear,
                        yearText: yearText
                    };
                }
            }
            
            throw new Error('No current triennial reading found');
        };

        // Set fallback UI when all APIs fail
        const setFallbackUI = () => {
            document.getElementById('parashah-name').textContent = "Pending";
            document.getElementById('torah-reading').textContent = "Pending";
            document.getElementById('haftarah-reading').textContent = "Pending";
            document.getElementById('brit-reading').textContent = "Pending";
            
            // Also set triennial fallbacks
            document.getElementById('triennial-torah-reading').textContent = "Pending";
            document.getElementById('triennial-haftarah-reading').textContent = "Pending";
            
            const parashahHeaderEl = document.getElementById('parashah-header');
            if (parashahHeaderEl) {
                parashahHeaderEl.textContent = "Weekly Parashah";
            }
        };

        // Main execution with fallback chain - load both annual and triennial
        try {
            // Load annual data first
            const annualData = await tryHebcalAPI();
            
            // Try to load triennial data
            let triennialData = null;
            try {
                triennialData = await tryHebcalTriennialAPI();
            } catch (triennialError) {
                console.warn('Triennial API failed, will use fallback:', triennialError.message);
            }
            
            updateParashahUI(annualData, triennialData);
            
        } catch (hebcalError) {
            console.warn('Hebcal API failed completely:', hebcalError.message);
            
            try {
                const annualData = await trySefariaAPI();
                updateParashahUI(annualData, null); // No triennial support from Sefaria
            } catch (sefariaError) {
                console.warn('Sefaria API also failed:', sefariaError.message);
                console.error('All Torah portion APIs failed - using fallback UI');
                setFallbackUI();
            }
        }
        
        paraLoader.style.display = 'none';
    };
    
    // Initialize triennial toggle
    const initializeTriennialToggle = () => {
        const toggleButtons = document.querySelectorAll('.cycle-btn');
        const annualSection = document.getElementById('annual-readings');
        const triennialSection = document.getElementById('triennial-readings');
        const triennialYearInfo = document.getElementById('triennial-year-info');
        
        toggleButtons.forEach(button => {
            button.addEventListener('click', function() {
                const cycle = this.getAttribute('data-cycle');
                
                // Update button states
                toggleButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                
                // Show/hide sections with animation
                if (cycle === 'annual') {
                    triennialSection.style.display = 'none';
                    annualSection.style.display = 'block';
                    if (triennialYearInfo) triennialYearInfo.style.display = 'none';
                } else {
                    annualSection.style.display = 'none';
                    triennialSection.style.display = 'block';
                    if (triennialYearInfo) triennialYearInfo.style.display = 'flex';
                }
            });
        });
    };

    // Load parashah data
    initializeTriennialToggle();
    loadParashah();
    
    // Calculate candle lighting time (sunset - 18 minutes) for a given date and location
    const calculateCandleLightingTime = (date, latitude, longitude) => {
        const month = date.getMonth() + 1; // 1-12
        const day = date.getDate();
        
        // Comprehensive sunset times for Southern California (Tustin, CA)
        // Based on astronomical calculations throughout the year
        let sunsetTime;
        
        if (month === 1) { // January
            sunsetTime = 17.17; // ~5:10pm
        } else if (month === 2) { // February  
            sunsetTime = 17.75; // ~5:45pm
        } else if (month === 3) { // March
            sunsetTime = 18.25; // ~6:15pm (before DST) / 7:15pm (after DST)
        } else if (month === 4) { // April
            sunsetTime = 19.58; // ~7:35pm
        } else if (month === 5) { // May
            sunsetTime = 19.85; // ~7:51pm
        } else if (month === 6) { // June
            if (day >= 20) {
                sunsetTime = 20.08; // Summer solstice period ~8:05pm
            } else {
                sunsetTime = 20.05; // Early June ~8:03pm
            }
        } else if (month === 7) { // July
            if (day <= 7) {
                sunsetTime = 20.08; // Early July ~8:05pm
            } else if (day <= 14) {
                sunsetTime = 20.05; // Mid July ~8:03pm  
            } else if (day <= 21) {
                sunsetTime = 20.02; // Late July ~8:01pm
            } else {
                sunsetTime = 19.98; // End of July ~7:59pm
            }
        } else if (month === 8) { // August
            if (day <= 15) {
                sunsetTime = 19.85; // Early August ~7:51pm
            } else {
                sunsetTime = 19.67; // Late August ~7:40pm
            }
        } else if (month === 9) { // September
            sunsetTime = 19.25; // ~7:15pm
        } else if (month === 10) { // October
            sunsetTime = 18.58; // ~6:35pm
        } else if (month === 11) { // November
            sunsetTime = 17.08; // ~5:05pm (after DST ends)
        } else if (month === 12) { // December
            sunsetTime = 16.83; // ~4:50pm (winter solstice)
        }
        
        // Subtract 18 minutes (0.3 hours) for candle lighting
        const candleLightingTime = sunsetTime - 0.3;
        
        // Convert to hours and minutes
        const hours = Math.floor(candleLightingTime);
        const minutes = Math.round((candleLightingTime - hours) * 60);
        
        // Format as 12-hour time
        let displayHours = hours;
        let ampm = 'pm';
        
        if (hours >= 12) {
            if (hours > 12) displayHours = hours - 12;
        } else {
            ampm = 'am';
            if (hours === 0) displayHours = 12;
        }
        
        return `${displayHours}:${minutes.toString().padStart(2, '0')}${ampm}`;
    };
    
    const calculateHavdalahTime = (date, latitude, longitude) => {
        const month = date.getMonth() + 1;
        const day = date.getDate();
        
        // Use same comprehensive sunset calculation as candle lighting
        let sunsetTime;
        
        if (month === 1) {
            sunsetTime = 17.17;
        } else if (month === 2) {
            sunsetTime = 17.75;
        } else if (month === 3) {
            sunsetTime = 18.25;
        } else if (month === 4) {
            sunsetTime = 19.58;
        } else if (month === 5) {
            sunsetTime = 19.85;
        } else if (month === 6) {
            if (day >= 20) {
                sunsetTime = 20.08;
            } else {
                sunsetTime = 20.05;
            }
        } else if (month === 7) {
            if (day <= 7) {
                sunsetTime = 20.08;
            } else if (day <= 14) {
                sunsetTime = 20.05;
            } else if (day <= 21) {
                sunsetTime = 20.02;
            } else {
                sunsetTime = 19.98;
            }
        } else if (month === 8) {
            if (day <= 15) {
                sunsetTime = 19.85;
            } else {
                sunsetTime = 19.67;
            }
        } else if (month === 9) {
            sunsetTime = 19.25;
        } else if (month === 10) {
            sunsetTime = 18.58;
        } else if (month === 11) {
            sunsetTime = 17.08;
        } else if (month === 12) {
            sunsetTime = 16.83;
        }
        
        // Add 42 minutes (0.7 hours) after sunset for Havdalah (3 stars)
        const havdalahTime = sunsetTime + 0.7;
        
        // Convert to hours and minutes
        const hours = Math.floor(havdalahTime);
        const minutes = Math.round((havdalahTime - hours) * 60);
        
        // Format as 12-hour time
        let displayHours = hours;
        let ampm = 'pm';
        
        if (hours >= 12) {
            if (hours > 12) displayHours = hours - 12;
        } else {
            ampm = 'am';
            if (hours === 0) displayHours = 12;
        }
        
        return `${displayHours}:${minutes.toString().padStart(2, '0')}${ampm}`;
    };
    
    // Load real candle lighting times from Hebcal API
    const loadCandleLighting = async () => {
        const candleLoader = document.getElementById('candle-times-loader');
        if (!candleLoader) return;
        
        candleLoader.style.display = 'block';
        
        
        try {
            // Get this Friday and next Friday
            const today = new Date();
            const thisFriday = new Date(today);
            const daysUntilFriday = (5 - today.getDay() + 7) % 7;
            
            if (daysUntilFriday === 0) {
                // Today is Friday, so "this Friday" is today
                thisFriday.setDate(today.getDate());
            } else {
                // Set to next Friday
                thisFriday.setDate(today.getDate() + daysUntilFriday);
            }
            
            const nextFriday = new Date(thisFriday);
            nextFriday.setDate(thisFriday.getDate() + 7);
            
            
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
            
            // Calculate candle lighting times using a more reliable approach
            const candleTime1 = calculateCandleLightingTime(thisFriday, lat, lng);
            const candleTime2 = calculateCandleLightingTime(nextFriday, lat, lng);
            
            

            // Update DOM with calculated times
            const nextFridayEl = document.getElementById('next-friday-date');
            if (nextFridayEl) {
                nextFridayEl.textContent = thisFriday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            }
            const candleTime1El = document.getElementById('candle-time-1');
            if (candleTime1El) {
                candleTime1El.textContent = candleTime1;
            }
            
            const followingFridayEl = document.getElementById('following-friday-date');
            if (followingFridayEl) {
                followingFridayEl.textContent = nextFriday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            }
            const candleTime2El = document.getElementById('candle-time-2');
            if (candleTime2El) {
                candleTime2El.textContent = candleTime2;
            }
            
            // Update Havdalah (Saturday evening)
            const havdalahDate = new Date(thisFriday);
            havdalahDate.setDate(thisFriday.getDate() + 1); // Saturday
            const havdalahTime = calculateHavdalahTime(havdalahDate, lat, lng);
            
            const havdalahDateEl = document.getElementById('havdalah-date');
            if (havdalahDateEl) {
                havdalahDateEl.textContent = havdalahDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            }
            const havdalahTimeEl = document.getElementById('havdalah-time');
            if (havdalahTimeEl) {
                havdalahTimeEl.textContent = havdalahTime;
            }
            
        } catch (error) {
            console.error('Error loading candle times:', error.message);
            
            // Calculate correct dates for fallback
            const todayCatch = new Date();
            const nextFridayCatch = new Date(todayCatch);
            const daysUntilFridayCatch = (5 - todayCatch.getDay() + 7) % 7 || 7;
            nextFridayCatch.setDate(todayCatch.getDate() + daysUntilFridayCatch);
            
            const followingFridayCatch = new Date(nextFridayCatch);
            followingFridayCatch.setDate(nextFridayCatch.getDate() + 7);
            
            const havdalahDateCatch = new Date(nextFridayCatch);
            havdalahDateCatch.setDate(nextFridayCatch.getDate() + 1); // Saturday
            
            // Use appropriate fallback text instead of hardcoded times
            const candleTime1El = document.getElementById('candle-time-1');
            const candleTime2El = document.getElementById('candle-time-2');
            const havdalahTimeEl = document.getElementById('havdalah-time');
            
            // Update dates
            document.getElementById('next-friday-date').textContent = nextFridayCatch.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            document.getElementById('following-friday-date').textContent = followingFridayCatch.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            document.getElementById('havdalah-date').textContent = havdalahDateCatch.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            
            // Calculate times when API is completely unavailable
            if (candleTime1El) candleTime1El.textContent = calculateCandleLightingTime(nextFridayCatch, 33.7175, -117.8311);
            if (candleTime2El) candleTime2El.textContent = calculateCandleLightingTime(followingFridayCatch, 33.7175, -117.8311);
            if (havdalahTimeEl) havdalahTimeEl.textContent = 'After sunset + 3 stars';
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
        } else {
        }
        
        // Listen for changes in color scheme preference
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
            if (e.matches) {
            } else {
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
            
            // Add Admin link at the end
            const adminLi = document.createElement('li');
            const adminA = document.createElement('a');
            adminA.href = '#';
            adminA.id = 'admin-link';
            adminA.innerHTML = '<i class="fas fa-chevron-right"></i> Admin';
            adminLi.appendChild(adminA);
            footerLinks.appendChild(adminLi);
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
            if (link && link.id !== 'backToTop' && link.id !== 'admin-link' && link.id !== 'faq-link' && link.id !== 'rabbi-link' && link.id !== 'holidays-link' && link.id !== 'special-events-link' && link.id !== 'shabbat-services-link' && link.id !== 'welcome-header' && link.id !== 'events-header' && link.id !== 'community-header' && link.id !== 'learn-header' && link.id !== 'resources-header' && link.id !== 'contact-us-link' && link.id !== 'donate-link' && link.id !== 'messianic-resources-link' && link.id !== 'stand-with-israel-link' && link.id !== 'shabbat-school-link' && link.id !== 'who-are-we-link' && link.id !== 'what-to-expect-link' && link.id !== 'mission-vision-link' && link.id !== 'our-location-link' && link.id !== 'umjc-affiliation-link') {
                e.preventDefault();
                const linkText = link.textContent.trim();
                
                // Check if this is the Worship Times link
                if (linkText.includes('Worship Times')) {
                    showWorshipTimesModal();
                } else {
                    showModal(linkText);
                }
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
    
    // Worship Times Modal functionality
    const showWorshipTimesModal = () => {
        const modal = document.getElementById('worship-times-modal');
        const modalClose = modal.querySelector('.modal-close');
        const modalBtn = modal.querySelector('.modal-btn');
        const modalOverlay = modal.querySelector('.modal-overlay');
        
        // Close modal function
        const closeWorshipModal = () => {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        };
        
        // Show modal
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        // Close modal events (remove existing listeners first to avoid duplicates)
        modalClose.removeEventListener('click', closeWorshipModal);
        modalBtn.removeEventListener('click', closeWorshipModal);
        modalOverlay.removeEventListener('click', closeWorshipModal);
        
        modalClose.addEventListener('click', closeWorshipModal);
        modalBtn.addEventListener('click', closeWorshipModal);
        modalOverlay.addEventListener('click', closeWorshipModal);
        
        // Close modal on Escape key
        const handleEscapeKey = (e) => {
            if (e.key === 'Escape' && modal.style.display === 'block') {
                closeWorshipModal();
                document.removeEventListener('keydown', handleEscapeKey);
            }
        };
        document.addEventListener('keydown', handleEscapeKey);
    };
    
    // Admin Portal Functionality
    const initializeAdminPortal = () => {
        // Simple hash function for password protection
        const simpleHash = (str) => {
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                const char = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash; // Convert to 32-bit integer
            }
            return hash.toString();
        };
        
        // Admin users database (in production, this should be more secure)
        const adminUsers = {
            'rabbi_chuck': {
                password: simpleHash('123456'), // This will be changed later
                name: 'Rabbi Chuck Ott',
                permissions: ['edit_brit', 'edit_content']
            }
        };
        
        // Admin session management
        let adminSession = null;
        
        // Check if user is already logged in
        const savedSession = localStorage.getItem('oht_admin_session');
        if (savedSession) {
            try {
                adminSession = JSON.parse(savedSession);
                // Validate session (basic check)
                if (adminSession && adminSession.username && adminSession.expiry > Date.now()) {
                    // Session is valid, but don't auto-open admin panel
                } else {
                    localStorage.removeItem('oht_admin_session');
                    adminSession = null;
                }
            } catch (e) {
                localStorage.removeItem('oht_admin_session');
                adminSession = null;
            }
        }
        
        // Admin link click handler
        document.getElementById('admin-link').addEventListener('click', (e) => {
            e.preventDefault();
            showAdminModal();
        });
        
        // Show admin modal
        const showAdminModal = () => {
            const modal = document.getElementById('admin-modal');
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            
            if (adminSession) {
                showAdminPanel();
            } else {
                showLoginForm();
            }
        };
        
        // Hide admin modal
        const hideAdminModal = () => {
            const modal = document.getElementById('admin-modal');
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        };
        
        // Show login form
        const showLoginForm = () => {
            document.getElementById('admin-login-form').style.display = 'block';
            document.getElementById('admin-panel').style.display = 'none';
            document.getElementById('admin-error').style.display = 'none';
            document.getElementById('admin-username').value = '';
            document.getElementById('admin-password').value = '';
        };
        
        // Show admin panel
        const showAdminPanel = () => {
            document.getElementById('admin-login-form').style.display = 'none';
            document.getElementById('admin-panel').style.display = 'block';
            
            // Populate current parashah info
            const parashahName = document.getElementById('parashah-name').textContent;
            document.getElementById('current-parashah').value = parashahName;
            
            // Load any existing brit override
            const britOverride = localStorage.getItem('oht_brit_override');
            document.getElementById('brit-override').value = britOverride || '';
        };
        
        // Login handler
        document.getElementById('admin-login-btn').addEventListener('click', () => {
            const username = document.getElementById('admin-username').value.trim();
            const password = document.getElementById('admin-password').value;
            const errorDiv = document.getElementById('admin-error');
            
            if (!username || !password) {
                errorDiv.textContent = 'Please enter both username and password.';
                errorDiv.style.display = 'block';
                return;
            }
            
            const hashedPassword = simpleHash(password);
            const user = adminUsers[username];
            
            if (user && user.password === hashedPassword) {
                // Successful login
                adminSession = {
                    username: username,
                    name: user.name,
                    permissions: user.permissions,
                    expiry: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
                };
                
                localStorage.setItem('oht_admin_session', JSON.stringify(adminSession));
                showAdminPanel();
                errorDiv.style.display = 'none';
            } else {
                errorDiv.textContent = 'Invalid username or password.';
                errorDiv.style.display = 'block';
            }
        });
        
        // Save Brit override
        document.getElementById('save-brit-btn').addEventListener('click', () => {
            const britReading = document.getElementById('brit-override').value.trim();
            if (britReading) {
                localStorage.setItem('oht_brit_override', britReading);
                // Update the live display
                document.getElementById('brit-reading').textContent = britReading;
                alert('Brit Chadashah override saved successfully!');
            }
        });
        
        // Clear Brit override
        document.getElementById('clear-brit-btn').addEventListener('click', () => {
            localStorage.removeItem('oht_brit_override');
            document.getElementById('brit-override').value = '';
            
            // Restore original brit reading logic
            const parashahName = document.getElementById('parashah-name').textContent;
            // This would need to re-run the brit reading lookup logic
            // For now, just show "Pending" until next page load
            document.getElementById('brit-reading').textContent = 'Pending';
            alert('Brit Chadashah override cleared!');
        });
        
        // Logout handler
        document.getElementById('admin-logout-btn').addEventListener('click', () => {
            adminSession = null;
            localStorage.removeItem('oht_admin_session');
            showLoginForm();
        });
        
        // Close modal handlers
        document.querySelector('.admin-modal-close').addEventListener('click', hideAdminModal);
        document.querySelector('.admin-modal-overlay').addEventListener('click', hideAdminModal);
        
        // Escape key handler
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const modal = document.getElementById('admin-modal');
                if (modal.style.display === 'flex') {
                    hideAdminModal();
                }
            }
        });
        
        // Enter key handler for login form
        document.getElementById('admin-password').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('admin-login-btn').click();
            }
        });
        
        // Edit Mode System
        let editModeActive = false;
        let pendingChanges = {};
        
        // Comprehensive cleanup function
        const cleanupEditMode = () => {
            editModeActive = false;
            disableEditMode();
            
            // Update toggle button
            const toggleBtn = document.getElementById('toggle-edit-mode');
            const saveBtn = document.getElementById('save-all-content');
            if (toggleBtn) {
                toggleBtn.innerHTML = '<i class="fas fa-edit"></i> Enable Edit Mode';
                toggleBtn.classList.remove('btn');
                toggleBtn.classList.add('btn-blue');
            }
            if (saveBtn) {
                saveBtn.style.display = 'none';
            }
        };
        
        // Toggle edit mode
        document.getElementById('toggle-edit-mode').addEventListener('click', () => {
            editModeActive = !editModeActive;
            const toggleBtn = document.getElementById('toggle-edit-mode');
            const saveBtn = document.getElementById('save-all-content');
            
            if (editModeActive) {
                enableEditMode();
                toggleBtn.innerHTML = '<i class="fas fa-times"></i> Exit Edit Mode';
                toggleBtn.classList.remove('btn-blue');
                toggleBtn.classList.add('btn');
                saveBtn.style.display = 'block';
                hideAdminModal(); // Close admin panel when entering edit mode
            } else {
                cleanupEditMode();
            }
        });
        
        // Save all content changes
        document.getElementById('save-all-content').addEventListener('click', () => {
            saveAllChanges();
            cleanupEditMode();
            alert('All changes saved successfully!');
        });
        
        // Enable edit mode
        const enableEditMode = () => {
            document.body.classList.add('edit-mode');
            
            // Add edit icons to all editable elements
            const editableElements = document.querySelectorAll('[data-editable]');
            
            editableElements.forEach((element, index) => {
                // Create edit icon
                const editIcon = document.createElement('div');
                editIcon.className = 'edit-icon';
                editIcon.innerHTML = '<i class="fas fa-edit"></i>';
                editIcon.title = 'Click to edit';
                
                // Position relative to element
                element.style.position = 'relative';
                element.appendChild(editIcon);
                
                // Add click handler
                const clickHandler = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openEditDialog(element);
                };
                
                element.addEventListener('click', clickHandler);
                editIcon.addEventListener('click', clickHandler);
                
                // Store handler for cleanup
                element._editClickHandler = clickHandler;
            });
            
            // Show edit mode indicator
            showEditModeIndicator();
            
            // Add keyboard shortcut to exit edit mode (Escape key)
            document.addEventListener('keydown', escapeEditModeHandler);
        };
        
        // Escape key handler for exiting edit mode
        const escapeEditModeHandler = (e) => {
            if (e.key === 'Escape' && editModeActive) {
                // Check if we're not in an edit dialog
                if (!document.querySelector('.edit-overlay')) {
                    cleanupEditMode();
                }
            }
        };
        
        // Disable edit mode
        const disableEditMode = () => {
            document.body.classList.remove('edit-mode');
            
            // More thorough cleanup of ALL edit icons (multiple selectors)
            const allEditIcons = document.querySelectorAll('.edit-icon');
            allEditIcons.forEach(icon => {
                icon.remove();
            });
            
            // Remove edit icons and handlers from editable elements
            const editableElements = document.querySelectorAll('[data-editable]');
            editableElements.forEach(element => {
                // Remove any remaining edit icons inside this element
                const nestedEditIcons = element.querySelectorAll('.edit-icon');
                nestedEditIcons.forEach(icon => icon.remove());
                
                // Remove click handler
                if (element._editClickHandler) {
                    element.removeEventListener('click', element._editClickHandler);
                    delete element._editClickHandler;
                }
                
                // Remove editing styles
                element.classList.remove('editing');
                element.style.removeProperty('border');
                element.style.removeProperty('background');
                element.style.removeProperty('position');
            });
            
            // Additional cleanup - search for any orphaned edit icons by class
            setTimeout(() => {
                const orphanedIcons = document.querySelectorAll('.edit-icon');
                if (orphanedIcons.length > 0) {
                    orphanedIcons.forEach(icon => icon.remove());
                }
            }, 100);
            
            // Remove escape key handler
            document.removeEventListener('keydown', escapeEditModeHandler);
            
            // Hide edit mode indicator
            hideEditModeIndicator();
        };
        
        // Show edit mode indicator
        const showEditModeIndicator = () => {
            const indicator = document.createElement('div');
            indicator.id = 'edit-mode-indicator';
            indicator.className = 'edit-mode-indicator';
            indicator.innerHTML = `
                <div><i class="fas fa-edit"></i> <strong>Edit Mode Active</strong></div>
                <div class="edit-mode-controls">
                    <button class="btn exit-edit-btn" id="exit-edit-mode">
                        <i class="fas fa-times"></i> Exit
                    </button>
                    <button class="btn save-all-edit-btn" id="save-all-floating">
                        <i class="fas fa-save"></i> Save All
                    </button>
                </div>
            `;
            document.body.appendChild(indicator);
            
            // Add click handlers for the floating buttons
            document.getElementById('exit-edit-mode').addEventListener('click', () => {
                cleanupEditMode();
            });
            
            document.getElementById('save-all-floating').addEventListener('click', () => {
                saveAllChanges();
                alert('All changes saved successfully!');
            });
        };
        
        // Hide edit mode indicator
        const hideEditModeIndicator = () => {
            const indicator = document.getElementById('edit-mode-indicator');
            if (indicator) {
                indicator.remove();
            }
        };
        
        // Extract clean text content from HTML element
        const extractCleanText = (element) => {
            // Clone the element to avoid modifying the original
            const clone = element.cloneNode(true);
            
            // Remove edit icons
            const editIcons = clone.querySelectorAll('.edit-icon');
            editIcons.forEach(icon => icon.remove());
            
            // Get text content without HTML tags
            let textContent = clone.textContent || clone.innerText || '';
            
            // Clean up whitespace
            textContent = textContent.trim().replace(/\s+/g, ' ');
            
            return textContent;
        };
        
        // Reconstruct element content with new text while preserving structure
        const reconstructElementContent = (element, newText) => {
            // Store original structure info
            const hasIcon = element.querySelector('i[class*="fas"]');
            const iconClasses = hasIcon ? hasIcon.className : null;
            const hasSpans = element.querySelectorAll('span').length > 0;
            const hasBr = element.innerHTML.includes('<br>');
            
            // Handle different element types
            if (element.tagName === 'P' || element.tagName === 'DIV') {
                if (hasBr) {
                    // Convert line breaks in text to <br> tags
                    const lines = newText.split('\n').filter(line => line.trim());
                    element.innerHTML = lines.join('<br>\n');
                } else if (hasIcon) {
                    // Preserve icon structure
                    element.innerHTML = `<i class="${iconClasses}"></i> ${newText}`;
                } else {
                    element.textContent = newText;
                }
            } else if (element.tagName === 'SPAN') {
                element.textContent = newText;
            } else if (element.tagName === 'A') {
                // For links, preserve icon if it exists
                if (hasIcon) {
                    element.innerHTML = `<i class="${iconClasses}"></i> ${newText}`;
                } else {
                    element.textContent = newText;
                }
            } else if (element.classList.contains('widget-header') || element.classList.contains('card-header')) {
                // For headers, preserve icon and span structure
                if (hasIcon && hasSpans) {
                    const icon = element.querySelector('i');
                    const span = element.querySelector('span[data-editable]');
                    if (span) {
                        span.textContent = newText;
                    } else {
                        element.innerHTML = `<i class="${iconClasses}"></i> <span>${newText}</span>`;
                    }
                } else if (hasIcon) {
                    element.innerHTML = `<i class="${iconClasses}"></i> ${newText}`;
                } else {
                    element.textContent = newText;
                }
            } else {
                // Default case
                element.textContent = newText;
            }
        };
        
        // Open edit dialog
        const openEditDialog = (element) => {
            const editKey = element.getAttribute('data-editable');
            const cleanText = extractCleanText(element);
            
            // Create edit overlay
            const overlay = document.createElement('div');
            overlay.className = 'edit-overlay';
            
            // Create edit dialog
            const dialog = document.createElement('div');
            dialog.className = 'edit-dialog';
            
            // Create friendly field name
            const friendlyName = editKey.replace(/-/g, ' ')
                .replace(/\b\w/g, l => l.toUpperCase())
                .replace('Sidebar', 'Sidebar:')
                .replace('Rabbi', 'Rabbi:')
                .replace('Prayer', 'Prayer:')
                .replace('Parashah', 'Parashah:');
            
            dialog.innerHTML = `
                <h3><i class="fas fa-edit"></i> Edit ${friendlyName}</h3>
                <div style="margin-bottom: 1rem; color: var(--gray-600); font-size: 0.9rem;">
                    <i class="fas fa-info-circle"></i> Edit the text content below. Line breaks will be preserved where appropriate.
                </div>
                <textarea id="edit-textarea" placeholder="Enter your text content..." rows="6">${cleanText}</textarea>
                <div class="edit-dialog-buttons">
                    <button class="btn btn-blue" id="save-edit">Save Changes</button>
                    <button class="btn" id="cancel-edit">Cancel</button>
                </div>
            `;
            
            overlay.appendChild(dialog);
            document.body.appendChild(overlay);
            
            // Focus textarea and select all text for easy editing
            const textarea = document.getElementById('edit-textarea');
            textarea.focus();
            textarea.select();
            
            // Handle save
            document.getElementById('save-edit').addEventListener('click', () => {
                const newText = textarea.value.trim();
                if (newText) {
                    reconstructElementContent(element, newText);
                    pendingChanges[editKey] = element.innerHTML;
                    element.classList.add('editing');
                }
                overlay.remove();
            });
            
            // Handle cancel
            document.getElementById('cancel-edit').addEventListener('click', () => {
                overlay.remove();
            });
            
            // Handle overlay click
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    overlay.remove();
                }
            });
            
            // Handle escape key
            document.addEventListener('keydown', function escapeHandler(e) {
                if (e.key === 'Escape') {
                    overlay.remove();
                    document.removeEventListener('keydown', escapeHandler);
                }
            });
        };
        
        // Save all changes to localStorage
        const saveAllChanges = () => {
            const allChanges = localStorage.getItem('oht_content_changes');
            const existingChanges = allChanges ? JSON.parse(allChanges) : {};
            
            const updatedChanges = { ...existingChanges, ...pendingChanges };
            localStorage.setItem('oht_content_changes', JSON.stringify(updatedChanges));
            
            // Clear pending changes
            pendingChanges = {};
            
            // Remove editing class from all elements
            document.querySelectorAll('[data-editable].editing').forEach(el => {
                el.classList.remove('editing');
            });
        };
        
        // Load saved changes on page load
        const loadSavedChanges = () => {
            const savedChanges = localStorage.getItem('oht_content_changes');
            if (savedChanges) {
                const changes = JSON.parse(savedChanges);
                Object.keys(changes).forEach(key => {
                    const element = document.querySelector(`[data-editable="${key}"]`);
                    if (element) {
                        element.innerHTML = changes[key];
                    }
                });
            }
        };
        
        // Load saved changes when admin is initialized
        loadSavedChanges();
    };
    
    // Initialize admin portal
    initializeAdminPortal();
    
    // FAQ Modal functionality
    const faqLink = document.getElementById('faq-link');
    const faqModal = document.getElementById('faq-modal');
    const faqModalClose = faqModal.querySelector('.modal-close');
    const faqModalBtn = faqModal.querySelector('.modal-btn');
    const faqModalOverlay = faqModal.querySelector('.modal-overlay');
    
    // Open FAQ modal
    faqLink.addEventListener('click', function(e) {
        e.preventDefault();
        faqModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    });
    
    // Close FAQ modal functions
    function closeFaqModal() {
        faqModal.style.display = 'none';
        document.body.style.overflow = '';
    }
    
    faqModalClose.addEventListener('click', closeFaqModal);
    faqModalBtn.addEventListener('click', closeFaqModal);
    faqModalOverlay.addEventListener('click', closeFaqModal);
    
    // FAQ accordion functionality
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        question.addEventListener('click', function() {
            // Close other open items
            faqItems.forEach(otherItem => {
                if (otherItem !== item && otherItem.classList.contains('active')) {
                    otherItem.classList.remove('active');
                }
            });
            
            // Toggle current item
            item.classList.toggle('active');
        });
    });
    
    // Rabbi Modal functionality
    const rabbiLink = document.getElementById('rabbi-link');
    const rabbiModal = document.getElementById('rabbi-modal');
    const rabbiModalClose = rabbiModal.querySelector('.modal-close');
    const rabbiModalBtn = rabbiModal.querySelector('.modal-btn');
    const rabbiModalOverlay = rabbiModal.querySelector('.modal-overlay');
    
    // Open Rabbi modal
    rabbiLink.addEventListener('click', function(e) {
        e.preventDefault();
        rabbiModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    });
    
    // Close Rabbi modal functions
    function closeRabbiModal() {
        rabbiModal.style.display = 'none';
        document.body.style.overflow = '';
    }
    
    rabbiModalClose.addEventListener('click', closeRabbiModal);
    rabbiModalBtn.addEventListener('click', closeRabbiModal);
    rabbiModalOverlay.addEventListener('click', closeRabbiModal);
    
    // Holidays Modal functionality
    const holidaysLink = document.getElementById('holidays-link');
    const holidaysModal = document.getElementById('holidays-modal');
    const holidaysModalClose = holidaysModal.querySelector('.modal-close');
    const holidaysModalBtn = holidaysModal.querySelector('.modal-btn');
    const holidaysModalOverlay = holidaysModal.querySelector('.modal-overlay');
    
    // Open Holidays modal
    holidaysLink.addEventListener('click', function(e) {
        e.preventDefault();
        holidaysModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    });
    
    // Close Holidays modal functions
    function closeHolidaysModal() {
        holidaysModal.style.display = 'none';
        document.body.style.overflow = '';
    }
    
    holidaysModalClose.addEventListener('click', closeHolidaysModal);
    holidaysModalBtn.addEventListener('click', closeHolidaysModal);
    holidaysModalOverlay.addEventListener('click', closeHolidaysModal);
    
    // Special Events Modal functionality
    const specialEventsLink = document.getElementById('special-events-link');
    const specialEventsModal = document.getElementById('special-events-modal');
    const specialEventsModalClose = specialEventsModal.querySelector('.modal-close');
    const specialEventsModalBtn = specialEventsModal.querySelector('.modal-btn');
    const specialEventsModalOverlay = specialEventsModal.querySelector('.modal-overlay');
    
    // Open Special Events modal
    specialEventsLink.addEventListener('click', function(e) {
        e.preventDefault();
        specialEventsModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    });
    
    // Close Special Events modal functions
    function closeSpecialEventsModal() {
        specialEventsModal.style.display = 'none';
        document.body.style.overflow = '';
    }
    
    specialEventsModalClose.addEventListener('click', closeSpecialEventsModal);
    specialEventsModalBtn.addEventListener('click', closeSpecialEventsModal);
    specialEventsModalOverlay.addEventListener('click', closeSpecialEventsModal);
    
    // Shabbat Services Modal functionality
    const shabbatServicesLink = document.getElementById('shabbat-services-link');
    const shabbatServicesModal = document.getElementById('shabbat-services-modal');
    const shabbatServicesModalClose = shabbatServicesModal.querySelector('.modal-close');
    const shabbatServicesModalBtn = shabbatServicesModal.querySelector('.modal-btn');
    const shabbatServicesModalOverlay = shabbatServicesModal.querySelector('.modal-overlay');
    
    // Open Shabbat Services modal
    shabbatServicesLink.addEventListener('click', function(e) {
        e.preventDefault();
        shabbatServicesModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    });
    
    // Close Shabbat Services modal functions
    function closeShabbatServicesModal() {
        shabbatServicesModal.style.display = 'none';
        document.body.style.overflow = '';
    }
    
    shabbatServicesModalClose.addEventListener('click', closeShabbatServicesModal);
    shabbatServicesModalBtn.addEventListener('click', closeShabbatServicesModal);
    shabbatServicesModalOverlay.addEventListener('click', closeShabbatServicesModal);
    
    // Contact Us Modal functionality
    const contactUsLink = document.getElementById('contact-us-link');
    const contactUsModal = document.getElementById('contact-us-modal');
    const contactUsModalClose = contactUsModal.querySelector('.modal-close');
    const contactUsModalBtn = contactUsModal.querySelector('.modal-btn');
    const contactUsModalOverlay = contactUsModal.querySelector('.modal-overlay');
    
    // Open Contact Us modal
    contactUsLink.addEventListener('click', function(e) {
        e.preventDefault();
        contactUsModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    });
    
    // Close Contact Us modal functions
    function closeContactUsModal() {
        contactUsModal.style.display = 'none';
        document.body.style.overflow = '';
    }
    
    contactUsModalClose.addEventListener('click', closeContactUsModal);
    contactUsModalBtn.addEventListener('click', closeContactUsModal);
    contactUsModalOverlay.addEventListener('click', closeContactUsModal);
    
    // Donate Modal functionality
    const donateLink = document.getElementById('donate-link');
    const donateModal = document.getElementById('donate-modal');
    const donateModalClose = donateModal.querySelector('.modal-close');
    const donateModalBtn = donateModal.querySelector('.modal-btn');
    const donateModalOverlay = donateModal.querySelector('.modal-overlay');
    
    // Open Donate modal
    donateLink.addEventListener('click', function(e) {
        e.preventDefault();
        donateModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    });
    
    // Close Donate modal functions
    function closeDonateModal() {
        donateModal.style.display = 'none';
        document.body.style.overflow = '';
    }
    
    donateModalClose.addEventListener('click', closeDonateModal);
    donateModalBtn.addEventListener('click', closeDonateModal);
    donateModalOverlay.addEventListener('click', closeDonateModal);
    
    // Messianic Jewish Resources Modal functionality
    const messianicResourcesLink = document.getElementById('messianic-resources-link');
    const messianicResourcesModal = document.getElementById('messianic-resources-modal');
    const messianicResourcesModalClose = messianicResourcesModal.querySelector('.modal-close');
    const messianicResourcesModalBtn = messianicResourcesModal.querySelector('.modal-btn');
    const messianicResourcesModalOverlay = messianicResourcesModal.querySelector('.modal-overlay');
    
    // Open Messianic Resources modal
    messianicResourcesLink.addEventListener('click', function(e) {
        e.preventDefault();
        messianicResourcesModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    });
    
    // Close Messianic Resources modal functions
    function closeMessianicResourcesModal() {
        messianicResourcesModal.style.display = 'none';
        document.body.style.overflow = '';
    }
    
    messianicResourcesModalClose.addEventListener('click', closeMessianicResourcesModal);
    messianicResourcesModalBtn.addEventListener('click', closeMessianicResourcesModal);
    messianicResourcesModalOverlay.addEventListener('click', closeMessianicResourcesModal);
    
    // Stand With Israel Modal functionality
    const standWithIsraelLink = document.getElementById('stand-with-israel-link');
    const standWithIsraelModal = document.getElementById('stand-with-israel-modal');
    const standWithIsraelModalClose = standWithIsraelModal.querySelector('.modal-close');
    const standWithIsraelModalBtn = standWithIsraelModal.querySelector('.modal-btn');
    const standWithIsraelModalOverlay = standWithIsraelModal.querySelector('.modal-overlay');
    
    // Open Stand With Israel modal
    standWithIsraelLink.addEventListener('click', function(e) {
        e.preventDefault();
        standWithIsraelModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    });
    
    // Close Stand With Israel modal functions
    function closeStandWithIsraelModal() {
        standWithIsraelModal.style.display = 'none';
        document.body.style.overflow = '';
    }
    
    standWithIsraelModalClose.addEventListener('click', closeStandWithIsraelModal);
    standWithIsraelModalBtn.addEventListener('click', closeStandWithIsraelModal);
    standWithIsraelModalOverlay.addEventListener('click', closeStandWithIsraelModal);
    
    // Shabbat School for Youth Modal functionality
    const shabbatSchoolLink = document.getElementById('shabbat-school-link');
    const shabbatSchoolModal = document.getElementById('shabbat-school-modal');
    const shabbatSchoolModalClose = shabbatSchoolModal.querySelector('.modal-close');
    const shabbatSchoolModalBtn = shabbatSchoolModal.querySelector('.modal-btn');
    const shabbatSchoolModalOverlay = shabbatSchoolModal.querySelector('.modal-overlay');
    
    // Open Shabbat School modal
    shabbatSchoolLink.addEventListener('click', function(e) {
        e.preventDefault();
        shabbatSchoolModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    });
    
    // Close Shabbat School modal functions
    function closeShabbatSchoolModal() {
        shabbatSchoolModal.style.display = 'none';
        document.body.style.overflow = '';
    }
    
    shabbatSchoolModalClose.addEventListener('click', closeShabbatSchoolModal);
    shabbatSchoolModalBtn.addEventListener('click', closeShabbatSchoolModal);
    shabbatSchoolModalOverlay.addEventListener('click', closeShabbatSchoolModal);

    // Who Are We Modal Handler
    const whoAreWeModal = document.getElementById('who-are-we-modal');
    const whoAreWeModalClose = whoAreWeModal.querySelector('.modal-close');
    const whoAreWeModalBtn = whoAreWeModal.querySelector('.modal-btn');
    const whoAreWeModalOverlay = whoAreWeModal.querySelector('.modal-overlay');

    // Open Who Are We modal
    document.getElementById('who-are-we-link').addEventListener('click', function(e) {
        e.preventDefault();
        whoAreWeModal.style.display = 'block';
    });

    // Close Who Are We modal functions
    function closeWhoAreWeModal() {
        whoAreWeModal.style.display = 'none';
    }
    
    whoAreWeModalClose.addEventListener('click', closeWhoAreWeModal);
    whoAreWeModalBtn.addEventListener('click', closeWhoAreWeModal);
    whoAreWeModalOverlay.addEventListener('click', closeWhoAreWeModal);

    // What to Expect Modal Handler
    const whatToExpectModal = document.getElementById('what-to-expect-modal');
    const whatToExpectModalClose = whatToExpectModal.querySelector('.modal-close');
    const whatToExpectModalBtn = whatToExpectModal.querySelector('.modal-btn');
    const whatToExpectModalOverlay = whatToExpectModal.querySelector('.modal-overlay');

    // Open What to Expect modal
    document.getElementById('what-to-expect-link').addEventListener('click', function(e) {
        e.preventDefault();
        whatToExpectModal.style.display = 'block';
    });

    // Close What to Expect modal functions
    function closeWhatToExpectModal() {
        whatToExpectModal.style.display = 'none';
    }
    
    whatToExpectModalClose.addEventListener('click', closeWhatToExpectModal);
    whatToExpectModalBtn.addEventListener('click', closeWhatToExpectModal);
    whatToExpectModalOverlay.addEventListener('click', closeWhatToExpectModal);

    // Mission Vision Modal Handler
    const missionVisionModal = document.getElementById('mission-vision-modal');
    const missionVisionModalClose = missionVisionModal.querySelector('.modal-close');
    const missionVisionModalBtn = missionVisionModal.querySelector('.modal-btn');
    const missionVisionModalOverlay = missionVisionModal.querySelector('.modal-overlay');

    // Open Mission Vision modal
    document.getElementById('mission-vision-link').addEventListener('click', function(e) {
        e.preventDefault();
        missionVisionModal.style.display = 'block';
    });

    // Close Mission Vision modal functions
    function closeMissionVisionModal() {
        missionVisionModal.style.display = 'none';
    }
    
    missionVisionModalClose.addEventListener('click', closeMissionVisionModal);
    missionVisionModalBtn.addEventListener('click', closeMissionVisionModal);
    missionVisionModalOverlay.addEventListener('click', closeMissionVisionModal);

    // Our Location Modal Handler
    const ourLocationModal = document.getElementById('our-location-modal');
    const ourLocationModalClose = ourLocationModal.querySelector('.modal-close');
    const ourLocationModalBtn = ourLocationModal.querySelector('.modal-btn');
    const ourLocationModalOverlay = ourLocationModal.querySelector('.modal-overlay');

    // Open Our Location modal
    document.getElementById('our-location-link').addEventListener('click', function(e) {
        e.preventDefault();
        ourLocationModal.style.display = 'block';
    });

    // Close Our Location modal functions
    function closeOurLocationModal() {
        ourLocationModal.style.display = 'none';
    }
    
    ourLocationModalClose.addEventListener('click', closeOurLocationModal);
    ourLocationModalBtn.addEventListener('click', closeOurLocationModal);
    ourLocationModalOverlay.addEventListener('click', closeOurLocationModal);

    // UMJC Affiliation Modal Handler
    const umjcAffiliationModal = document.getElementById('umjc-affiliation-modal');
    const umjcAffiliationModalClose = umjcAffiliationModal.querySelector('.modal-close');
    const umjcAffiliationModalBtn = umjcAffiliationModal.querySelector('.modal-btn');
    const umjcAffiliationModalOverlay = umjcAffiliationModal.querySelector('.modal-overlay');

    // Open UMJC Affiliation modal
    document.getElementById('umjc-affiliation-link').addEventListener('click', function(e) {
        e.preventDefault();
        umjcAffiliationModal.style.display = 'block';
    });

    // Close UMJC Affiliation modal functions
    function closeUmjcAffiliationModal() {
        umjcAffiliationModal.style.display = 'none';
    }
    
    umjcAffiliationModalClose.addEventListener('click', closeUmjcAffiliationModal);
    umjcAffiliationModalBtn.addEventListener('click', closeUmjcAffiliationModal);
    umjcAffiliationModalOverlay.addEventListener('click', closeUmjcAffiliationModal);

    // Add Escape key handling for all new modals
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            if (whoAreWeModal.style.display === 'block') {
                closeWhoAreWeModal();
            }
            if (whatToExpectModal.style.display === 'block') {
                closeWhatToExpectModal();
            }
            if (missionVisionModal.style.display === 'block') {
                closeMissionVisionModal();
            }
            if (ourLocationModal.style.display === 'block') {
                closeOurLocationModal();
            }
            if (umjcAffiliationModal.style.display === 'block') {
                closeUmjcAffiliationModal();
            }
        }
    });
});