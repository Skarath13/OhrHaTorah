import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
    SITE_REVEAL_QUERY,
    arrivesByScrolling,
    isHurriedScroll,
    isScrollJump,
    revealDelay,
} from './siteReveal.ts';
import { SITE_REVEAL_CONTAINERS, SITE_REVEAL_PROTECTED, drawableRule } from './siteRevealPlan.ts';

const motionStyles = readFileSync(new URL('../../public/styles/motion.css', import.meta.url), 'utf8');
const baseLayoutSource = readFileSync(new URL('../layouts/BaseLayout.astro', import.meta.url), 'utf8');
const revealSource = readFileSync(new URL('./siteReveal.ts', import.meta.url), 'utf8');

const revealMediaQuery = '@media screen and (prefers-reduced-motion: no-preference) and (forced-colors: none)';

const topLevelBlocks = (css: string) => {
    const blocks: Array<{ prelude: string; body: string }> = [];
    const source = css.replace(/\/\*[\s\S]*?\*\//g, '');
    let depth = 0;
    let preludeStart = 0;
    let bodyStart = 0;

    for (let index = 0; index < source.length; index += 1) {
        if (source[index] === '{') {
            if (depth === 0) bodyStart = index + 1;
            depth += 1;
        } else if (source[index] === '}') {
            depth -= 1;
            if (depth === 0) {
                const prelude = source.slice(preludeStart, bodyStart - 1).trim();
                blocks.push({ prelude, body: source.slice(bodyStart, index) });
                preludeStart = index + 1;
            }
        }
    }

    return blocks;
};

const blocks = topLevelBlocks(motionStyles);
const revealBlock = blocks.find((block) => block.prelude === revealMediaQuery);

const solidRule = {
    borderTopStyle: 'solid',
    borderTopWidth: '1px',
    borderTopColor: 'rgb(211, 201, 182)',
    borderLeftWidth: '0px',
    borderRightWidth: '0px',
    borderTopLeftRadius: '0px',
    borderTopRightRadius: '0px',
    borderImageSource: 'none',
    overflowX: 'visible',
    overflowY: 'visible',
    transitionProperty: 'all',
    transitionDuration: '0s',
    beforeContent: 'none',
};

test('short groups stagger by at most 70ms a step, four steps in total', () => {
    assert.deepEqual([0, 1, 2, 3, 4, 9].map(revealDelay), [0, 70, 140, 210, 210, 210]);
    assert.equal(revealDelay(-1), 0);
});

test('only content arriving at the lower edge animates; jumps and restores appear at once', () => {
    assert.equal(arrivesByScrolling(950, 900), true);
    assert.equal(arrivesByScrolling(760, 900), true);
    assert.equal(arrivesByScrolling(500, 900), false);
    assert.equal(arrivesByScrolling(-200, 900), false);
    assert.equal(isScrollJump(0, 300, 900), false);
    assert.equal(isScrollJump(0, 4200, 900), true);
    assert.equal(isScrollJump(4200, 0, 900), true);
});

test('content passing faster than reading speed is shown as it passes, not animated', () => {
    assert.equal(isHurriedScroll(101, 16), true);
    assert.equal(isHurriedScroll(-180, 16), true);
    assert.equal(isHurriedScroll(30, 16), false);
    assert.equal(isHurriedScroll(0, 16), false);
    assert.equal(isHurriedScroll(400, 0), false);
});

test('only plain, solid, unclipped top hairlines are redrawn', () => {
    assert.deepEqual(drawableRule(solidRule), { color: 'rgb(211, 201, 182)', width: '1px' });
    assert.deepEqual(
        drawableRule({ ...solidRule, borderTopWidth: '2px', borderTopColor: 'rgba(180, 138, 54, 0.8)' }),
        { color: 'rgba(180, 138, 54, 0.8)', width: '2px' },
    );

    for (const override of [
        { borderTopStyle: 'none' },
        { borderTopStyle: 'dashed' },
        { borderTopWidth: '0px' },
        { borderTopColor: 'rgba(0, 0, 0, 0)' },
        { borderTopColor: 'transparent' },
        { borderLeftWidth: '1px' },
        { borderRightWidth: '1px' },
        { borderTopLeftRadius: '8px' },
        { borderTopRightRadius: '0.5rem' },
        { borderImageSource: 'url("rule.png")' },
        { overflowY: 'hidden' },
        { overflowX: 'clip' },
        { beforeContent: '""' },
        { transitionProperty: 'border-color', transitionDuration: '0.2s' },
        { transitionProperty: 'all', transitionDuration: '0.3s' },
    ]) {
        assert.equal(drawableRule({ ...solidRule, ...override }), null, JSON.stringify(override));
    }
});

test('homepage headings, heroes, and dividers keep their own motion; whole sections are always split', () => {
    for (const selector of ['[data-home-motion-heading]', '.home-hero', '.page-hero', '.organic-section-divider']) {
        assert.ok(SITE_REVEAL_PROTECTED.includes(selector), `${selector} must never be revealed or sit inside a reveal`);
    }

    const containers = SITE_REVEAL_CONTAINERS.split(',').map((selector) => selector.trim());
    for (const selector of ['.home-section', '.home-torah-quote', '.page-body', '.policy-section', '.editorial-page > section']) {
        assert.ok(containers.includes(selector), `${selector} must be split into smaller reveals`);
    }
});

test('the reveal script is progressive enhancement that reveals once', () => {
    assert.equal(SITE_REVEAL_QUERY, 'screen and (prefers-reduced-motion: no-preference) and (forced-colors: none)');
    assert.match(revealSource, /!\('IntersectionObserver' in window\)/);
    assert.match(revealSource, /window\.matchMedia\(SITE_REVEAL_QUERY\)/);
    assert.match(revealSource, /observer\.unobserve\(element\)/);
    assert.match(revealSource, /addEventListener\('change'/);
    assert.match(revealSource, /addEventListener\('focusin'/);
    assert.match(revealSource, /addEventListener\('pageshow'/);
    assert.match(revealSource, /addEventListener\('hashchange'/);
    assert.match(revealSource, /fragmentTarget\(window\.location\.hash\)/);
    assert.match(revealSource, /classList\.add\('site-motion-ready'\)/);
    assert.match(baseLayoutSource, /import \{ startSiteReveal \} from '\.\.\/lib\/siteReveal';\s*startSiteReveal\(\);/);
});

test('pending content is hidden only by a paused screen animation under the readiness class', () => {
    assert.ok(revealBlock, 'motion.css needs one screen, no-preference, forced-colors: none block');

    for (const block of blocks) {
        if (block.prelude === revealMediaQuery) continue;
        assert.doesNotMatch(block.body, /site-motion-ready|data-site-reveal|data-site-rule/, block.prelude);
    }

    const body = revealBlock.body;
    assert.match(
        body,
        /html\.site-motion-ready \[data-site-reveal\] \{[^}]*animation: oht-reveal-text \d+ms var\(--motion-ease-lux\) backwards paused;/,
    );
    assert.match(body, /html\.site-motion-ready \[data-site-rule\]::before \{[^}]*backwards paused;/);
    assert.match(body, /\.is-site-revealing,[\s\S]*?\{\s*animation-play-state: running;/);
    assert.doesNotMatch(body, /\b(?:opacity|visibility|display|clip-path)\s*:/);
    assert.doesNotMatch(motionStyles, /animation-timeline/);
});

test('reveal keyframes move only opacity, transform, and at most a 2px blur', () => {
    const keyframes = blocks.filter((block) => block.prelude.startsWith('@keyframes oht-reveal-'));
    assert.deepEqual(
        keyframes.map((block) => block.prelude.replace('@keyframes ', '')).sort(),
        ['oht-reveal-fade', 'oht-reveal-heading', 'oht-reveal-item', 'oht-reveal-media', 'oht-reveal-rule', 'oht-reveal-text', 'oht-reveal-trace'],
    );

    for (const block of keyframes) {
        const declarations = block.body.match(/[a-z-]+(?=\s*:)/g) ?? [];
        for (const property of declarations) {
            assert.ok(['opacity', 'transform', 'filter'].includes(property), `${block.prelude} animates ${property}`);
        }
        for (const [, radius] of block.body.matchAll(/blur\(([\d.]+)px\)/g)) {
            assert.ok(Number(radius) <= 2, `${block.prelude} blurs ${radius}px`);
        }
        for (const [, distance] of block.body.matchAll(/translate[XY]\((-?[\d.]+)px\)/g)) {
            assert.ok(Math.abs(Number(distance)) >= 8 && Math.abs(Number(distance)) <= 14, `${block.prelude} travels ${distance}px`);
        }
    }
});
