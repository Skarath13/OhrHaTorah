// Site-wide scroll reveal: every section is ruled before it is written. A
// section's top hairline draws in, then its heading comes into focus, its copy
// settles, media eases down from a slight scale, and short groups arrive in
// order. Content stays visible by default: this script only marks content that
// is still below the fold, and motion.css (screen, no reduced motion, no forced
// colors) turns that mark into a paused first frame that plays once on arrival.

import { planSiteReveals } from './siteRevealPlan.ts';
import type { PlannedReveal } from './siteRevealPlan.ts';

export const SITE_REVEAL_QUERY = 'screen and (prefers-reduced-motion: no-preference) and (forced-colors: none)';

// Start just before content rises past the lower edge; settle anything just above the top.
const ROOT_MARGIN = '12% 0px 6% 0px';
const STAGGER_MS = 70;
const MAX_STAGGER_STEPS = 3;
// Siblings whose tops sit this close share a visual row and arrive together.
const ROW_TOLERANCE = 40;
// Content first seen above this share of the viewport was jumped to, not scrolled to.
const ARRIVAL_LINE = 0.8;
const JUMP_SHARE = 0.75;
// Faster than reading speed (px per ms), as in a fling or an anchor glide: show content as it passes.
const HURRIED_SPEED = 3;
const SPEED_WINDOW_MS = 120;

export const revealDelay = (step: number): number =>
    Math.min(Math.max(step, 0), MAX_STAGGER_STEPS) * STAGGER_MS;

export const arrivesByScrolling = (top: number, viewportHeight: number): boolean =>
    top >= viewportHeight * ARRIVAL_LINE;

export const isScrollJump = (previousY: number, currentY: number, viewportHeight: number): boolean =>
    Math.abs(currentY - previousY) > viewportHeight * JUMP_SHARE;

export const isHurriedScroll = (distance: number, elapsedMs: number): boolean =>
    elapsedMs > 0 && Math.abs(distance) / elapsedMs > HURRIED_SPEED;

const fragmentTarget = (hash: string): Element | null => {
    if (hash.length < 2) return null;

    try {
        return document.getElementById(decodeURIComponent(hash.slice(1)));
    } catch {
        return null;
    }
};

/** Where content stops counting as already shown: the fold, or the fold below a fragment's target. */
const settledUntil = (): number => {
    const target = fragmentTarget(window.location.hash);
    const viewportHeight = window.innerHeight;
    return target ? Math.max(viewportHeight, target.getBoundingClientRect().top + viewportHeight) : viewportHeight;
};

const inReadingOrder = (a: Element, b: Element): number =>
    a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;

class SiteReveal {
    waiting = new Set<HTMLElement>();
    revealing = new Set<HTMLElement>();
    observer: IntersectionObserver;
    motionQuery: MediaQueryList;
    lastScrollY = window.scrollY;
    lastScrollTime = performance.now();
    hurried = false;
    active = true;

    constructor(motionQuery: MediaQueryList, pending: PlannedReveal[]) {
        this.motionQuery = motionQuery;
        this.observer = new IntersectionObserver((entries) => this.arrive(entries), { rootMargin: ROOT_MARGIN, threshold: 0 });

        for (const { element, role, rule, anchor } of pending) {
            if (rule) {
                element.dataset.siteRule = anchor ? 'anchor' : '';
                element.style.setProperty('--site-rule-color', rule.color);
                element.style.setProperty('--site-rule-width', rule.width);
            } else if (role) {
                element.dataset.siteReveal = role;
            }
            this.waiting.add(element);
        }

        document.documentElement.classList.add('site-motion-ready');
        this.waiting.forEach((element) => this.observer.observe(element));
        this.listen();
    }

    listen() {
        window.addEventListener('scroll', this.onScroll, { passive: true });
        window.addEventListener('pageshow', this.onPageShow);
        window.addEventListener('hashchange', this.onHashChange);
        document.addEventListener('focusin', this.onFocusIn);
        document.addEventListener('animationend', this.onAnimationDone);
        document.addEventListener('animationcancel', this.onAnimationDone);
        this.motionQuery.addEventListener('change', this.onMotionPreferenceChange);
    }

    unlisten() {
        window.removeEventListener('scroll', this.onScroll);
        window.removeEventListener('pageshow', this.onPageShow);
        window.removeEventListener('hashchange', this.onHashChange);
        document.removeEventListener('focusin', this.onFocusIn);
        document.removeEventListener('animationend', this.onAnimationDone);
        document.removeEventListener('animationcancel', this.onAnimationDone);
        this.motionQuery.removeEventListener('change', this.onMotionPreferenceChange);
    }

    release(element: HTMLElement) {
        this.observer.unobserve(element);
        this.waiting.delete(element);
        this.revealing.delete(element);
        element.classList.remove('is-site-revealing');
        delete element.dataset.siteReveal;
        delete element.dataset.siteRule;
        element.style.removeProperty('--site-rule-color');
        element.style.removeProperty('--site-rule-width');
        if (!element.getAttribute('style')) element.removeAttribute('style');
    }

    settle(element: HTMLElement) {
        this.release(element);
        if (this.waiting.size === 0 && this.revealing.size === 0) this.stop();
    }

    play(element: HTMLElement, delay: number) {
        this.observer.unobserve(element);
        this.waiting.delete(element);
        this.revealing.add(element);
        // Stagger by starting later: changing a held animation's delay would end it early.
        const start = () => {
            if (this.revealing.has(element)) element.classList.add('is-site-revealing');
        };
        if (delay > 0) window.setTimeout(start, delay);
        else start();
    }

    settleAbove(line: number) {
        Array.from(this.waiting)
            .filter((element) => element.getBoundingClientRect().top < line)
            .forEach((element) => this.settle(element));
    }

    arrive(entries: IntersectionObserverEntry[]) {
        const tops = new Map<HTMLElement, number>();
        entries.forEach((entry) => {
            const element = entry.target as HTMLElement;
            if (entry.isIntersecting && this.waiting.has(element)) tops.set(element, entry.boundingClientRect.top);
        });

        // A heading and its copy, or the cells of one grid row, arrive together in reading order.
        for (const [element, top] of Array.from(tops)) {
            for (const sibling of Array.from(element.parentElement?.children ?? [])) {
                if (!(sibling instanceof HTMLElement) || tops.has(sibling) || !this.waiting.has(sibling)) continue;
                const siblingTop = sibling.getBoundingClientRect().top;
                if (Math.abs(siblingTop - top) <= ROW_TOLERANCE) tops.set(sibling, siblingTop);
            }
        }

        const height = window.innerHeight;
        const rushing = this.hurried && performance.now() - this.lastScrollTime < SPEED_WINDOW_MS;
        let step = 0;

        for (const element of Array.from(tops.keys()).sort(inReadingOrder)) {
            if (rushing || !arrivesByScrolling(tops.get(element) ?? 0, height)) {
                this.settle(element);
            } else if (element.hasAttribute('data-site-rule')) {
                // The rule leads its section's words by one beat.
                this.play(element, 0);
                step = Math.max(step, 1);
            } else {
                this.play(element, revealDelay(step));
                step += 1;
            }
        }
    }

    onScroll = () => {
        const scrollY = window.scrollY;
        const now = performance.now();
        if (isScrollJump(this.lastScrollY, scrollY, window.innerHeight)) this.settleAbove(window.innerHeight);
        this.hurried = isHurriedScroll(scrollY - this.lastScrollY, now - this.lastScrollTime);
        this.lastScrollY = scrollY;
        this.lastScrollTime = now;
    };

    onPageShow = (event: PageTransitionEvent) => {
        this.lastScrollY = window.scrollY;
        if (event.persisted) this.settleAbove(window.innerHeight);
    };

    // An in-page link glides to its target; everything on the way and on arrival is already shown.
    onHashChange = () => this.settleAbove(settledUntil());

    onFocusIn = (event: FocusEvent) => {
        const host = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-site-reveal]') : null;
        if (host && this.waiting.has(host)) this.settle(host);
    };

    onAnimationDone = (event: AnimationEvent) => {
        const element = event.target as HTMLElement;
        // An end with no elapsed time is a held frame stepping back, not a finished reveal.
        if (event.type === 'animationend' && event.elapsedTime === 0) return;
        if (event.animationName.startsWith('oht-reveal-') && this.revealing.has(element)) this.settle(element);
    };

    onMotionPreferenceChange = () => {
        if (!this.motionQuery.matches) this.stop();
    };

    stop() {
        if (!this.active) return;

        this.active = false;
        this.observer.disconnect();
        [...this.waiting, ...this.revealing].forEach((element) => this.release(element));
        document.documentElement.classList.remove('site-motion-ready');
        this.unlisten();
    }
}

export function startSiteReveal(): void {
    if (!('IntersectionObserver' in window) || typeof window.matchMedia !== 'function') return;

    const motionQuery = window.matchMedia(SITE_REVEAL_QUERY);
    if (!motionQuery.matches) return;

    // Anything on screen, above it after a scroll restore, or on the way to a fragment's target
    // (which the browser may glide to after load) stays exactly as rendered.
    const foldLine = settledUntil();
    const pending = planSiteReveals(document.querySelectorAll('main, .site-footer'))
        .filter((target) => target.top >= foldLine);

    if (pending.length > 0) new SiteReveal(motionQuery, pending);
}
