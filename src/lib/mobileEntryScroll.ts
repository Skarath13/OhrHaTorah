export interface MobileEntryContext {
    compactViewport: boolean;
    topLevel: boolean;
    hasHash: boolean;
    navigationType: string;
    hasReferrer: boolean;
}

export function shouldResetMobileEntry(context: MobileEntryContext): boolean {
    if (!context.compactViewport || !context.topLevel || context.hasHash) return false;
    if (context.navigationType === 'reload') return false;
    if (context.navigationType === 'back_forward' && context.hasReferrer) return false;

    return true;
}

export const mobileEntryScrollScript = String.raw`
(() => {
    const compactViewport = window.matchMedia?.('(max-width: 1359px)').matches ?? false;
    const topLevel = window.top === window.self;
    const hasHash = window.location.hash.length > 0;
    const navigationEntry = window.performance?.getEntriesByType?.('navigation')?.[0];
    const legacyType = window.performance?.navigation?.type;
    const navigationType = navigationEntry?.type
        ?? (legacyType === 1 ? 'reload' : legacyType === 2 ? 'back_forward' : 'navigate');
    const hasReferrer = document.referrer.length > 0;

    if (!compactViewport || !topLevel || hasHash || navigationType === 'reload') return;
    if (navigationType === 'back_forward' && hasReferrer) return;

    const maximumRestoredOffset = Math.max(160, Math.min(280, window.innerHeight * 0.28));
    const manageRestoration = navigationType !== 'back_forward';
    const previousRestoration = 'scrollRestoration' in window.history
        ? window.history.scrollRestoration
        : null;
    let releaseTimer = 0;

    const currentOffset = () => Math.max(
        window.scrollY || 0,
        document.documentElement?.scrollTop || 0,
        document.body?.scrollTop || 0,
    );

    const resetSmallRestoredOffset = () => {
        if (currentOffset() > maximumRestoredOffset) return;

        window.scrollTo(0, 0);
        if (document.documentElement) document.documentElement.scrollTop = 0;
        if (document.body) document.body.scrollTop = 0;
    };

    const settleAtTop = () => {
        window.clearTimeout(releaseTimer);
        if (manageRestoration && previousRestoration !== null) {
            window.history.scrollRestoration = 'manual';
        }

        resetSmallRestoredOffset();
        window.requestAnimationFrame(resetSmallRestoredOffset);
        window.requestAnimationFrame(() => window.requestAnimationFrame(resetSmallRestoredOffset));

        releaseTimer = window.setTimeout(() => {
            resetSmallRestoredOffset();
            if (manageRestoration && previousRestoration !== null) {
                window.history.scrollRestoration = previousRestoration;
            }
        }, 180);
    };

    settleAtTop();
    window.addEventListener('pageshow', settleAtTop, { once: true });
})();
`;
