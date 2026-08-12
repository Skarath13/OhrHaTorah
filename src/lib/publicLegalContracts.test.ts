import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const readProjectFile = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');

const privacySource = readProjectFile('../pages/privacy.astro');
const websiteUseSource = readProjectFile('../pages/website-use.astro');
const accessibilitySource = readProjectFile('../pages/accessibility.astro');
const donateSource = readProjectFile('../pages/donate.astro');
const footerSource = readProjectFile('../components/layout/Footer.astro');
const pageLayoutSource = readProjectFile('../layouts/PageLayout.astro');
const policyStyles = readProjectFile('../../public/styles/policies.css');
const legalPageSources = [privacySource, websiteUseSource, accessibilitySource];
const combinedLegalSource = legalPageSources.join('\n');

test('public policy pages are photo-free, dated, and use the shared legal design', () => {
    for (const source of legalPageSources) {
        assert.match(source, /stylesheets=\{\['\/styles\/policies\.css'\]\}/);
        assert.match(source, /<time datetime="2026-08-11">August 11, 2026<\/time>/);
        assert.doesNotMatch(source, /<img\b|<picture\b|<figure\b|data-editable/);
    }

    assert.match(policyStyles, /\.policy-section \{/);
    assert.match(policyStyles, /\.policy-intro \{\s*display: block;/);
    assert.match(policyStyles, /grid-template-columns: minmax\(11\.5rem, 0\.42fr\) minmax\(0, 1fr\)/);
    assert.match(policyStyles, /@media \(max-width: 760px\)/);
    assert.match(policyStyles, /\.policy-section-contact \{/);
});

test('legal copy reflects the public website without publishing internal mechanics or unsupported status claims', () => {
    assert.doesNotMatch(
        combinedLegalSource,
        /\b(?:membership|dues|board|committee|quorum|voting|discipline|ordination|salary|bylaws?|indemnification)\b/i
    );
    assert.doesNotMatch(
        combinedLegalSource,
        /\b(?:fully compliant|guaranteed compliant|tax[- ]deductible|tax[- ]exempt|501\s*\(c\)\s*\(3\))\b/i
    );
    assert.match(combinedLegalSource, /<strong>\{congregationName\}<\/strong>/);
});

test('privacy notice describes the providers and browser behavior actually present in the site', () => {
    for (const provider of ['Cloudflare', 'Web3Forms', 'Hebcal', 'Google Maps', 'cdnjs', 'Font Awesome']) {
        assert.match(privacySource, new RegExp(provider));
    }

    assert.match(privacySource, /Cookies and local storage/);
    assert.match(privacySource, /Do Not Track/);
    assert.match(privacySource, /Global Privacy Control/);
    assert.match(privacySource, /independently collect information about visits to this and other websites under their own privacy policies/);
    assert.match(privacySource, /posted on this page with an updated date and, when appropriate, an additional notice/);
    assert.match(privacySource, /not designed to collect personal information directly from children under 13/);
    assert.match(privacySource, /please do not send sensitive personal information through ordinary email or the website form/i);
});

test('website-use and accessibility pages make cautious, specific public commitments', () => {
    assert.match(websiteUseSource, /id="copyright-sources"/);
    assert.match(websiteUseSource, /not legal, medical, mental-health, financial, or tax advice/);
    assert.match(websiteUseSource, /confirm time-sensitive information with us before relying on it/);
    assert.match(websiteUseSource, /To the extent permitted by applicable law/);

    assert.match(accessibilitySource, /working toward conformance with the/);
    assert.match(accessibilitySource, /WCAG\) 2\.2, Level AA/);
    assert.match(accessibilitySource, /not a claim that every page or third-party feature is free of barriers/);
    assert.match(accessibilitySource, /page address, what you were trying to do, the barrier you encountered/);
});

test('the footer offers policy links and collects only the minimum newsletter request fields', () => {
    assert.match(footerSource, /href="\/privacy">Privacy<\/a>/);
    assert.match(footerSource, /href="\/website-use">Website use<\/a>/);
    assert.match(footerSource, /href="\/accessibility">Accessibility<\/a>/);
    assert.match(footerSource, /href="\/website-use#copyright-sources">Copyright &amp; sources<\/a>/);

    assert.match(footerSource, /name="first_name"[^>]*\(optional\)[^>]*>/);
    assert.doesNotMatch(footerSource, /name="first_name"[^>]*\brequired\b/);
    assert.match(footerSource, /name="email"[^>]*\brequired\b/);
    assert.doesNotMatch(footerSource, /name="last_name"|name="phone"/);
    assert.match(footerSource, /name="botcheck" class="newsletter-botcheck"/);
    assert.match(footerSource, /name="email_consent"[^>]*\brequired\b/);
    assert.doesNotMatch(footerSource, /name="email_consent"[^>]*\bchecked\b/);
    assert.match(footerSource, /I can unsubscribe at any time/);
    assert.match(footerSource, /Read our <a href="\/privacy">Privacy Notice<\/a>/);
    assert.match(footerSource, /Your request was sent\./);
    assert.doesNotMatch(footerSource, /You are subscribed\./);
});

test('donation page gives careful recordkeeping and tax guidance without promising deductibility', () => {
    assert.match(donateSource, /Giving acknowledgments and special contributions/);
    assert.match(donateSource, /Please keep your check or bank record/);
    assert.match(donateSource, /Whether a contribution is deductible depends on applicable law and your individual circumstances/);
    assert.match(donateSource, /nothing on this website is tax advice/);
    assert.match(donateSource, /Contact us before sending a non-cash or other special contribution/);
    assert.doesNotMatch(donateSource, /contributions? (?:are|is) tax[- ]deductible/i);
});

test('policy routes receive deliberate breadcrumb identities', () => {
    assert.match(pageLayoutSource, /'\/privacy': \{\s*section: 'Privacy Notice',\s*sectionHref: '\/privacy',\s*\}/);
    assert.match(pageLayoutSource, /'\/website-use': \{\s*section: 'Website Use',\s*sectionHref: '\/website-use',\s*\}/);
    assert.match(pageLayoutSource, /'\/accessibility': \{\s*section: 'Accessibility',\s*sectionHref: '\/accessibility',\s*\}/);
});
