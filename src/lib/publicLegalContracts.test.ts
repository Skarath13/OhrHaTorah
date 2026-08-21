import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { UPDATE_REQUEST_CONSENT } from './updateRequests.ts';

const readProjectFile = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');

const privacySource = readProjectFile('../pages/privacy.astro');
const websiteUseSource = readProjectFile('../pages/website-use.astro');
const accessibilitySource = readProjectFile('../pages/accessibility.astro');
const donateSource = readProjectFile('../pages/donate.astro');
const footerSource = readProjectFile('../components/layout/Footer.astro');
const updateRequestEndpointSource = readProjectFile('../pages/api/update-requests.ts');
const pageLayoutSource = readProjectFile('../layouts/PageLayout.astro');
const policyStyles = readProjectFile('../../public/styles/policies.css');
const legalPageSources = [privacySource, websiteUseSource, accessibilitySource];
const combinedLegalSource = legalPageSources.join('\n');

test('public policy pages are photo-free, dated, and use the shared legal design', () => {
    for (const source of legalPageSources) {
        assert.match(source, /stylesheets=\{\['\/styles\/policies\.css'\]\}/);
        assert.match(source, /(?:Last updated|Effective) <time datetime="2026-08-(?:11|12|20)">August (?:11|12|20), 2026<\/time>/);
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
    for (const provider of ['Cloudflare', 'D1', 'Turnstile', 'Queues', 'Email Service', 'Google', 'Hebcal', 'Google Maps', 'Zelle', 'PayPal', 'cdnjs', 'Font Awesome']) {
        assert.match(privacySource, new RegExp(provider));
    }

    assert.doesNotMatch(privacySource, /Web3Forms|web3forms\.com/);
    assert.match(privacySource, /first and last name, email address, and consent; a phone number is optional/);
    assert.match(privacySource, /does not represent a guarantee that an address has already been enrolled/);

    assert.match(privacySource, /Cookies and local storage/);
    assert.match(privacySource, /Do Not Track/);
    assert.match(privacySource, /Global Privacy Control/);
    assert.match(privacySource, /independently collect information about visits to this and other websites under their own privacy policies/);
    assert.match(privacySource, /posted on this page with an updated date and, when appropriate, an additional notice/);
    assert.match(privacySource, /not designed to collect personal information directly from children under 13/);
    assert.match(privacySource, /please do not send sensitive personal information through ordinary email or the website form/i);
});

test('terms and accessibility pages make cautious, specific public commitments', () => {
    assert.match(websiteUseSource, /pageTitle="Terms and Conditions"/);
    assert.match(websiteUseSource, /id="email-updates"/);
    assert.match(websiteUseSource, /weekly emails and occasional important or community updates/);
    assert.match(websiteUseSource, /Frequency may vary/);
    assert.match(websiteUseSource, /must process it for enrollment/);
    assert.match(websiteUseSource, /does not authorize text messages or automated calls/);
    assert.match(websiteUseSource, /No part of these terms waives or limits any right or responsibility that cannot lawfully be waived or limited/);
    assert.match(websiteUseSource, /id="copyright-sources"/);
    assert.match(websiteUseSource, /not legal, medical, mental-health, financial, or tax advice/);
    assert.match(websiteUseSource, /confirm time-sensitive information with us before relying on it/);
    assert.match(websiteUseSource, /To the extent permitted by applicable law/);

    assert.match(accessibilitySource, /working toward conformance with the/);
    assert.match(accessibilitySource, /WCAG\) 2\.2, Level AA/);
    assert.match(accessibilitySource, /not a claim that every page or third-party feature is free of barriers/);
    assert.match(accessibilitySource, /page address, what you were trying to do, the barrier you encountered/);
});

test('the footer restores the full update-request form without sending data to Web3Forms', () => {
    assert.match(footerSource, /href="\/privacy">Privacy<\/a>/);
    assert.match(footerSource, /href="\/website-use">Terms &amp; Conditions<\/a>/);
    assert.match(footerSource, /href="\/accessibility">Accessibility<\/a>/);
    assert.match(footerSource, /href="\/website-use#copyright-sources">Copyright &amp; sources<\/a>/);

    assert.match(footerSource, /name="firstName"[^>]*\brequired\b/);
    assert.match(footerSource, /name="lastName"[^>]*\brequired\b/);
    assert.match(footerSource, /name="email"[^>]*\brequired\b/);
    assert.match(footerSource, /name="phone"[^>]*maxlength="40"/);
    assert.match(footerSource, /name="website" class="newsletter-botcheck"/);
    assert.match(footerSource, /name="consent"[^>]*\brequired\b/);
    assert.doesNotMatch(footerSource, /name="consent"[^>]*\bchecked\b/);
    for (const part of ['permission', 'frequency', 'termsLead', 'termsLabel', 'termsEffective', 'privacyLead', 'privacyLabel', 'ending']) {
        assert.match(footerSource, new RegExp(`UPDATE_REQUEST_CONSENT\\.${part}`));
    }
    assert.match(footerSource, /href="\/website-use#email-updates"/);
    assert.match(footerSource, /href="\/privacy">\{UPDATE_REQUEST_CONSENT\.privacyLabel\}<\/a>/);
    assert.equal(
        UPDATE_REQUEST_CONSENT.text,
        'Yes, please send me weekly emails and occasional important or community updates from Kehilat Ohr HaTorah. Email frequency may vary, and I can unsubscribe at any time. I agree to the Terms and Conditions (effective August 20, 2026) and acknowledge the Privacy Notice.',
    );
    assert.match(updateRequestEndpointSource, /UPDATE_REQUEST_CONSENT\.text/);
    assert.match(footerSource, /action="\/api\/update-requests"/);
    assert.match(footerSource, /data-action="updates_request"/);
    assert.match(footerSource, /Your update request was received\./);
    assert.doesNotMatch(footerSource, /api\.web3forms\.com|access_key|Web3Forms/);
    assert.doesNotMatch(footerSource, /You are subscribed\./);
});

test('donation page gives careful recordkeeping and tax guidance without promising deductibility', () => {
    assert.match(donateSource, /zelleTag = 'ohrhatorahoc'/);
    assert.match(donateSource, /zelleRecipientName = 'CONGREGATION OHR HAT'/);
    assert.match(donateSource, /https:\/\/enroll\.zellepay\.com\/qr-codes\?data=/);
    assert.match(donateSource, /\/images\/payments\/zelle-ohrhatorahoc-qr\.png/);
    assert.match(donateSource, /Payments to an enrolled recipient generally cannot be canceled/);
    assert.match(donateSource, /Zelle® does not offer purchase protection/);
    assert.match(donateSource, /not affiliated with, sponsored by, or endorsed by Early Warning Services/);
    assert.match(donateSource, /paypalHostedButtonId = 'LPN2RWR887N84'/);
    assert.match(donateSource, /https:\/\/www\.paypal\.com\/donate/);
    assert.match(donateSource, /\/images\/payments\/paypal-donation-qr\.png/);
    assert.match(donateSource, /PayPal processes the donation on its website/);
    assert.doesNotMatch(donateSource, /Friends and Family/i);
    assert.doesNotMatch(donateSource, /trust badge|verified Zelle|purchase-protection badge/i);
    assert.match(donateSource, /Giving acknowledgments and special contributions/);
    assert.match(donateSource, /Please keep your check or bank record/);
    assert.match(donateSource, /Whether a contribution is deductible depends on applicable law and your individual circumstances/);
    assert.match(donateSource, /nothing on this website is tax advice/);
    assert.match(donateSource, /Contact us before sending a non-cash or other special contribution/);
    assert.doesNotMatch(donateSource, /contributions? (?:are|is) tax[- ]deductible/i);
});

test('policy routes receive deliberate breadcrumb identities', () => {
    assert.match(pageLayoutSource, /'\/privacy': \{\s*section: 'Privacy Notice',\s*sectionHref: '\/privacy',\s*\}/);
    assert.match(pageLayoutSource, /'\/website-use': \{\s*section: 'Terms and Conditions',\s*sectionHref: '\/website-use',\s*\}/);
    assert.match(pageLayoutSource, /'\/accessibility': \{\s*section: 'Accessibility',\s*sectionHref: '\/accessibility',\s*\}/);
});
