// Which parts of a page reveal, and how. Regions are split into their children
// so a full section is never held at once. An element with a plain top hairline
// keeps still while that line redraws, and its children carry the rise.

export type RevealRole = 'heading' | 'text' | 'item' | 'media' | 'trace' | 'fade';

export interface RuleStyle {
    borderTopStyle: string;
    borderTopWidth: string;
    borderTopColor: string;
    borderLeftWidth: string;
    borderRightWidth: string;
    borderTopLeftRadius: string;
    borderTopRightRadius: string;
    borderImageSource: string;
    overflowX: string;
    overflowY: string;
    transitionProperty: string;
    transitionDuration: string;
    beforeContent: string;
}

export interface RuleDraw {
    color: string;
    width: string;
}

export interface PlannedReveal {
    element: HTMLElement;
    top: number;
    role?: RevealRole;
    rule?: RuleDraw;
    anchor?: boolean;
}

/** Elements with motion of their own, or none at all: never revealed and never inside a reveal. */
export const SITE_REVEAL_PROTECTED = [
    '[data-home-motion-heading]',
    '.home-hero',
    '.page-hero',
    '.organic-section-divider',
    '.home-scroll-thread',
    'dialog',
].join(', ');

const SKIPPED = `${SITE_REVEAL_PROTECTED}, template, script, style, noscript, link, [hidden], [data-calendar-manager]`;

/** Short sets whose members arrive in reading order. */
const GROUPS = [
    '.editorial-columns',
    '.editorial-link-list',
    '.holiday-year',
    '.identity-vision__statements',
    '.donation-grid',
    '.secondary-giving',
    '.timeline',
    '.home-identity-links',
    '.home-visit-utility',
    '.home-shabbat-timeline',
    '.home-dashboard-grid',
    '.footer-grid',
].join(', ');

/** Regions revealed through their children, so a full section is never hidden at once. */
export const SITE_REVEAL_CONTAINERS = [
    '.page-container',
    '.page-body',
    '.editorial-page',
    '.editorial-page > section',
    '.holiday-programme',
    '.identity-page',
    '.identity-section',
    '.identity-section-heading',
    '.identity-commitment-list',
    '.identity-value-groups',
    '.identity-value-group',
    '.identity-value-group__heading',
    '.identity-value-list',
    '.policy-page',
    '.policy-section',
    '.donate-content',
    '.service-schedule',
    '.home-section',
    '.home-torah-quote',
    '.home-shell',
    '.home-about-grid',
    '.home-about-story',
    '.home-identity-intro',
    '.home-visit-grid',
    '.home-shabbat-primary',
    '.home-schedule-card',
    '.home-reading-card',
    '.home-shabbat-dashboard',
    '.home-calendar-layout',
    '.footer-content',
    GROUPS,
].join(', ');

// Always revealed whole: disclosures keep their own open motion, media and controls stay intact.
const ATOMIC = 'details, figure, picture, a, button';
const HEADINGS = 'h1, h2, h3, h4, h5, h6, blockquote, .giving-heading, .identity-hebrew-seal';
const MEDIA = 'figure, picture, img, video, .home-about-visual';
const TRACES = '.identity-section-heading__mark, .home-torah-quote-icon';
const REPLACED = 'img, video, iframe, canvas, svg, embed, object';

const colorAlpha = (color: string): number => {
    if (color === 'transparent') return 0;

    const channels = color.match(/^rgba?\(([^)]*)\)$/)?.[1].split(/[\s,/]+/).filter(Boolean);
    if (!channels || channels.length < 4) return 1;

    const alpha = channels[3];
    return alpha.endsWith('%') ? Number.parseFloat(alpha) / 100 : Number.parseFloat(alpha);
};

const isZero = (length: string): boolean => Number.parseFloat(length) === 0;

const transitionsBorder = (properties: string, durations: string): boolean => {
    const times = durations.split(',').map((duration) => Number.parseFloat(duration));
    return properties
        .split(',')
        .some((property, index) => {
            const name = property.trim();
            return (name === 'all' || name.startsWith('border')) && times[index % times.length] > 0;
        });
};

/** A top border that a drawn hairline can replace exactly, or null. */
export const drawableRule = (style: RuleStyle): RuleDraw | null => {
    if (style.borderTopStyle !== 'solid' || !(Number.parseFloat(style.borderTopWidth) > 0)) return null;
    if (colorAlpha(style.borderTopColor) === 0 || style.borderImageSource !== 'none') return null;
    if (!isZero(style.borderLeftWidth) || !isZero(style.borderRightWidth)) return null;
    if (!isZero(style.borderTopLeftRadius) || !isZero(style.borderTopRightRadius)) return null;
    if (style.overflowX !== 'visible' || style.overflowY !== 'visible') return null;
    if (style.beforeContent !== 'none' && style.beforeContent !== 'normal') return null;
    if (transitionsBorder(style.transitionProperty, style.transitionDuration)) return null;

    return { color: style.borderTopColor, width: style.borderTopWidth };
};

const hasOnlyElementChildren = (element: Element): boolean =>
    element.childElementCount > 0 &&
    Array.from(element.childNodes).every((node) => node.nodeType !== Node.TEXT_NODE || !node.textContent?.trim());

const ruleFor = (element: HTMLElement, style: CSSStyleDeclaration): RuleDraw | null => {
    if (style.borderTopStyle !== 'solid' || !hasOnlyElementChildren(element)) return null;

    return drawableRule({
        borderTopStyle: style.borderTopStyle,
        borderTopWidth: style.borderTopWidth,
        borderTopColor: style.borderTopColor,
        borderLeftWidth: style.borderLeftWidth,
        borderRightWidth: style.borderRightWidth,
        borderTopLeftRadius: style.borderTopLeftRadius,
        borderTopRightRadius: style.borderTopRightRadius,
        borderImageSource: style.borderImageSource,
        overflowX: style.overflowX,
        overflowY: style.overflowY,
        transitionProperty: style.transitionProperty,
        transitionDuration: style.transitionDuration,
        beforeContent: window.getComputedStyle(element, '::before').content,
    });
};

const roleFor = (element: HTMLElement, style: CSSStyleDeclaration, inGroup: boolean): RevealRole => {
    // Keep an element's own transform intact; text-level boxes cannot move.
    if (style.transform !== 'none' || (style.display === 'inline' && !element.matches(REPLACED))) return 'fade';
    if (element.matches(TRACES)) return 'trace';
    if (element.matches(MEDIA)) return 'media';
    if (inGroup) return 'item';
    if (element.matches(HEADINGS)) return 'heading';
    if (element.childElementCount === 1 && element.firstElementChild?.matches(HEADINGS)) return 'heading';
    return 'text';
};

const planRegion = (container: Element, inGroup: boolean, plan: PlannedReveal[]): void => {
    for (const child of Array.from(container.children)) {
        if (!(child instanceof HTMLElement) || child.matches(SKIPPED)) continue;

        const style = window.getComputedStyle(child);
        if (style.display === 'contents') {
            planRegion(child, inGroup, plan);
            continue;
        }
        if (style.display === 'none' || style.position === 'fixed') continue;

        const { top, width, height } = child.getBoundingClientRect();
        if (width < 1 || height < 1) continue;

        const atomic = child.matches(ATOMIC);
        const rule = atomic ? null : ruleFor(child, style);
        if (!atomic && (rule || child.matches(SITE_REVEAL_CONTAINERS) || child.querySelector(SITE_REVEAL_PROTECTED))) {
            if (rule) plan.push({ element: child, top, rule, anchor: style.position === 'static' });
            planRegion(child, child.matches(GROUPS), plan);
        } else {
            plan.push({ element: child, top, role: roleFor(child, style, inGroup) });
        }
    }
};

/** Every reveal target under the given regions, in document order. Reads layout only. */
export const planSiteReveals = (regions: Iterable<Element>): PlannedReveal[] => {
    const plan: PlannedReveal[] = [];
    for (const region of regions) planRegion(region, false, plan);
    return plan;
};
