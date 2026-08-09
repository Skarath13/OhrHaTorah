import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { extname, join } from 'node:path';
import { test } from 'node:test';

const root = new URL('../../', import.meta.url).pathname;

function collectTextFiles(directory: string): string[] {
    return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
        const path = join(directory, entry.name);
        if (entry.isDirectory()) return collectTextFiles(path);
        return ['.astro', '.css'].includes(extname(entry.name)) ? [path] : [];
    });
}

const typographySources = [
    ...collectTextFiles(join(root, 'public/styles')),
    ...collectTextFiles(join(root, 'src/components')),
    ...collectTextFiles(join(root, 'src/layouts')),
    ...collectTextFiles(join(root, 'src/pages')),
].map(path => `${path}\n${readFileSync(path, 'utf8')}`).join('\n');

test('public typography is limited to the shared display and body families', () => {
    for (const bannedFamily of [
        'Segoe UI',
        'Tahoma',
        'Geneva',
        'Verdana',
        'Roboto',
        '-apple-system',
        'BlinkMacSystemFont',
    ]) {
        assert.doesNotMatch(typographySources, new RegExp(bannedFamily.replace('-', '\\-'), 'i'));
    }

    assert.match(typographySources, /--font-display: Georgia, 'Times New Roman', serif;/);
    assert.match(typographySources, /--font-body: Arial, Helvetica, sans-serif;/);
});

test('visitor guidance does not advertise programs that are still being planned', () => {
    const faqSource = readFileSync(join(root, 'src/pages/faq.astro'), 'utf8');
    assert.doesNotMatch(faqSource, /We have Shabbat School/i);
    assert.doesNotMatch(faqSource, /We offer Hebrew classes/i);
});

test('primary navigation does not expose placeholder destinations', () => {
    const navigationSource = readFileSync(join(root, 'src/components/layout/Navigation.astro'), 'utf8');
    assert.doesNotMatch(navigationSource, /href="#"/);
});

test('homepage protects copy legibility and leads with imagery on mobile About', () => {
    const homeStyles = readFileSync(join(root, 'public/styles/home.css'), 'utf8');
    assert.match(homeStyles, /\.home-hero::after\s*\{[\s\S]*?linear-gradient/);
    assert.match(homeStyles, /\.home-hero-logo\s*\{[\s\S]*?clamp\(280px, 30vw, 460px\)/);
    assert.match(homeStyles, /\.home-about-story\s*\{\s*grid-column: 1;\s*grid-row: 2;/);
    assert.match(homeStyles, /\.home-about-visual\s*\{\s*grid-column: 1;\s*grid-row: 1;/);
});
