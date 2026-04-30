import { useEffect, useRef, useState } from 'react';

type NavItem = {
  label: string;
  href: string;
  icon: string;
};

type NavGroup = {
  label: string;
  href?: string;
  icon: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    label: 'Welcome',
    href: '/',
    icon: 'fa-home',
    items: [
      { label: 'Who Are We', href: '/about', icon: 'fa-info-circle' },
      { label: 'What to Expect', href: '/expect', icon: 'fa-door-open' },
      { label: 'Mission & Values', href: '/mission', icon: 'fa-bullseye' },
      { label: 'Our Location', href: '/location', icon: 'fa-map-marker-alt' },
      { label: 'FAQ', href: '/faq', icon: 'fa-question-circle' },
      { label: 'UMJC Affiliation', href: '/umjc', icon: 'fa-handshake' },
    ],
  },
  {
    label: 'Gather',
    href: '/services',
    icon: 'fa-calendar-check',
    items: [
      { label: 'Shabbat Services', href: '/services', icon: 'fa-star-of-david' },
      { label: 'Jewish Holidays', href: '/holidays', icon: 'fa-calendar-day' },
      { label: 'Special Events', href: '/events', icon: 'fa-star' },
      { label: 'Shabbat School', href: '/youth', icon: 'fa-child' },
    ],
  },
  {
    label: 'Community',
    icon: 'fa-users',
    items: [
      { label: 'Calendar', href: '/#congregation-calendar', icon: 'fa-calendar-alt' },
      { label: 'Stand With Israel', href: '/israel', icon: 'fa-flag' },
      { label: 'Contact Us', href: '/contact', icon: 'fa-envelope' },
    ],
  },
  {
    label: 'Learn',
    href: '/resources',
    icon: 'fa-graduation-cap',
    items: [
      { label: 'Resources', href: '/resources', icon: 'fa-book-open' },
      { label: 'Weekly Readings', href: '/resources', icon: 'fa-scroll' },
      { label: 'Sermons & Teachings', href: '/resources', icon: 'fa-microphone' },
    ],
  },
];

export default function PremiumNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const navRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    document.body.classList.toggle('premium-nav-open', isOpen);
    return () => document.body.classList.remove('premium-nav-open');
  }, [isOpen]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setOpenGroup(null);
      }
    };

    const onClick = (event: MouseEvent) => {
      if (!navRef.current?.contains(event.target as Node)) {
        setOpenGroup(null);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('click', onClick);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('click', onClick);
    };
  }, []);

  const toggleGroup = (label: string) => {
    setOpenGroup(current => (current === label ? null : label));
  };

  const closeNav = () => {
    setIsOpen(false);
    setOpenGroup(null);
  };

  return (
    <header className="premium-site-header">
      <nav className="premium-nav-shell" ref={navRef} aria-label="Primary navigation">
        <a href="/" className="premium-brand" aria-label="Ohr HaTorah home" onClick={closeNav}>
          <img className="premium-brand-logo" src="/images/logo.png" alt="Ohr HaTorah Logo" />
        </a>

        <button
          className={`premium-menu-toggle${isOpen ? ' active' : ''}`}
          id="mobile-menu-btn"
          type="button"
          aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-controls="nav-container"
          aria-expanded={isOpen}
          onClick={() => setIsOpen(current => !current)}
        >
          <span />
          <span />
          <span />
        </button>

        <div className={`premium-nav-links${isOpen ? ' active' : ''}`} id="nav-container">
          {navGroups.map(group => (
            <div
              className={`premium-nav-group${openGroup === group.label ? ' open' : ''}`}
              key={group.label}
              onMouseEnter={() => setOpenGroup(group.label)}
              onMouseLeave={() => setOpenGroup(null)}
            >
              <button
                className="premium-nav-trigger"
                type="button"
                aria-expanded={openGroup === group.label}
                onClick={event => {
                  event.stopPropagation();
                  toggleGroup(group.label);
                }}
              >
                <i className={`fas ${group.icon}`} aria-hidden="true" />
                <span>{group.label}</span>
                <i className="fas fa-chevron-down" aria-hidden="true" />
              </button>

              <div className="premium-dropdown">
                {group.href && (
                  <a href={group.href} onClick={closeNav}>
                    <i className={`fas ${group.icon}`} aria-hidden="true" />
                    Overview
                  </a>
                )}
                {group.items.map(item => (
                  <a href={item.href} key={`${group.label}-${item.href}-${item.label}`} onClick={closeNav}>
                    <i className={`fas ${item.icon}`} aria-hidden="true" />
                    {item.label}
                  </a>
                ))}
              </div>
            </div>
          ))}

          <a href="/contact" className="premium-nav-link" onClick={closeNav}>
            <i className="fas fa-envelope" aria-hidden="true" />
            Contact
          </a>
          <a href="/donate" className="premium-donate-link" onClick={closeNav}>
            <i className="fas fa-heart" aria-hidden="true" />
            Donate
          </a>
        </div>
      </nav>
    </header>
  );
}
