import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const repositoryRoot = fileURLToPath(new URL('../..', import.meta.url));
const donateSource = readFileSync(`${repositoryRoot}/src/pages/donate.astro`, 'utf8');
const zelleQrAsset = readFileSync(`${repositoryRoot}/public/images/payments/zelle-ohrhatorahoc-qr.png`);
const zelleWordmarkAsset = readFileSync(`${repositoryRoot}/public/images/payments/zelle-bank-wordmark.png`);
const paypalQrAsset = readFileSync(`${repositoryRoot}/public/images/payments/paypal-donation-qr.png`);
const expectedZelleQrSha256 = '029cd082d7ed5d771d2cd41d8cf9e9009719d5e08f776c3bf180265747ad27ef';
const expectedZelleWordmarkSha256 = '8c1e0c88e4706ee97013272b25fe0ae9d9e99cc722773c50048e6bdc26dfbedf';
const expectedPaypalQrSha256 = '0d3a54e810b811429f2cd4b3e6f9a28d7252a3d7070c3c48063ef04532c7d93b';

test('the published Zelle destination matches the bank-generated QR evidence', () => {
    const paymentUrl = donateSource.match(/const zellePaymentUrl = '([^']+)'/)?.[1];
    assert.ok(paymentUrl, 'The Zelle payment URL must remain explicit and reviewable');

    const url = new URL(paymentUrl);
    assert.equal(url.origin, 'https://enroll.zellepay.com');
    const encodedPayload = url.searchParams.get('data');
    assert.ok(encodedPayload);
    assert.deepEqual(JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')), {
        name: 'CONGREGATION OHR HAT',
        token: 'ohrhatorahoc',
    });

    assert.match(donateSource, /const zelleTag = 'ohrhatorahoc'/);
    assert.match(donateSource, /const zelleRecipientName = 'CONGREGATION OHR HAT'/);
    assert.equal(createHash('sha256').update(zelleQrAsset).digest('hex'), expectedZelleQrSha256);
    assert.equal(createHash('sha256').update(zelleWordmarkAsset).digest('hex'), expectedZelleWordmarkSha256);
    assert.match(donateSource, /src="\/images\/payments\/zelle-bank-wordmark\.png"[^>]*alt="Zelle"/);
});

test('the published PayPal destination matches the PayPal-hosted Donate artifacts', () => {
    assert.match(donateSource, /const paypalHostedButtonId = 'LPN2RWR887N84'/);
    assert.match(donateSource, /https:\/\/www\.paypal\.com\/donate\/\?hosted_button_id=/);
    assert.match(donateSource, /href=\{paypalDonationUrl\}/);
    assert.match(donateSource, /href=\{paypalQrDonationUrl\}/);
    assert.match(donateSource, /https:\/\/www\.paypalobjects\.com\/webstatic\/mktg\/logo\/pp_cc_mark_111x69\.jpg/);
    assert.match(donateSource, /class="fab fa-paypal"/);
    assert.match(donateSource, /\/images\/payments\/paypal-donation-qr\.png/);
    assert.match(donateSource, /one-time, monthly, or yearly gift/);
    assert.equal(createHash('sha256').update(paypalQrAsset).digest('hex'), expectedPaypalQrSha256);
});

test('payment presentation stays accurate and does not fabricate provider trust', () => {
    assert.match(donateSource, /Zelle® does not offer purchase protection/);
    assert.match(donateSource, /not affiliated with, sponsored by, or endorsed by Early Warning Services/);
    assert.match(donateSource, /PayPal processes the donation on its website/);
    assert.match(donateSource, /does not receive your PayPal password or payment credentials/);
    assert.match(donateSource, /bank-generated QR code/);
    assert.match(donateSource, /Confirm recipient/);
    assert.match(donateSource, /Hosted checkout/);
    assert.doesNotMatch(donateSource, /PayPal-hosted giving is being prepared|No payment is collected here yet/);
    assert.doesNotMatch(donateSource, /Friends and Family/i);
    assert.doesNotMatch(donateSource, /verified Zelle|trust badge|purchase-protection badge|guaranteed secure/i);
    assert.doesNotMatch(donateSource, /confirmed charity|tax-deductible gift|used with permission/i);
});

test('primary payment cards remain side by side on desktop and stack Zelle first on mobile', () => {
    const zelleCardIndex = donateSource.indexOf('donation-card donation-card-zelle');
    const paypalCardIndex = donateSource.indexOf('donation-card donation-card-paypal');
    const checkDisclosureIndex = donateSource.indexOf('Give by check');

    assert.ok(zelleCardIndex >= 0);
    assert.ok(paypalCardIndex > zelleCardIndex, 'PayPal should follow Zelle in source and mobile order');
    assert.ok(checkDisclosureIndex > paypalCardIndex, 'Check giving should remain a quieter disclosure after the primary cards');
    assert.equal([...donateSource.matchAll(/<section class="donation-card /g)].length, 2);
    assert.match(
        donateSource,
        /\.donation-grid\.donation-methods\s*\{[^}]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/s,
    );
    assert.match(
        donateSource,
        /\.payment-card-body\s*\{[^}]*display:\s*flex[^}]*flex:\s*1[^}]*flex-direction:\s*column/s,
    );
    assert.match(
        donateSource,
        /@media \(max-width: 860px\)[\s\S]*?\.donation-grid\.donation-methods,[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\)/,
    );
});

test('provider themes use recognizable palettes and provider-issued payment artifacts', () => {
    assert.match(donateSource, /--zelle-purple:\s*#6d1ed4/);
    assert.match(donateSource, /--paypal-blue:\s*#0070ba/);
    assert.match(donateSource, /--paypal-deep:\s*#003087/);
    assert.match(donateSource, /#ffc439/);
    assert.match(donateSource, /https:\/\/www\.paypalobjects\.com\/webstatic\/mktg\/logo\/pp_cc_mark_111x69\.jpg/);
    assert.match(donateSource, /\/images\/payments\/zelle-bank-wordmark\.png/);
    assert.match(donateSource, /\/images\/payments\/zelle-ohrhatorahoc-qr\.png/);
    assert.match(donateSource, /\/images\/payments\/paypal-donation-qr\.png/);
    assert.match(donateSource, /\.payment-qr-link\s*\{[^}]*width:\s*min\(15\.25rem, 100%\)/s);
    assert.match(donateSource, /\.payment-qr-frame\s*\{[^}]*width:\s*100%/s);
    assert.match(donateSource, /width="240" height="240"/);
    assert.match(donateSource, /\.donate-content \.donation-card\s*\{[^}]*box-sizing:\s*border-box[^}]*padding:\s*0/s);
    assert.match(donateSource, /\.donate-content \.donation-card-zelle\s*\{[^}]*--payment-accent:\s*var\(--zelle-purple\)/s);
    assert.match(donateSource, /\.donate-content \.donation-card-paypal\s*\{[^}]*--payment-accent:\s*var\(--paypal-blue\)/s);
    assert.match(donateSource, /\.zelle-tag-control\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\) auto/s);
    assert.match(donateSource, /\.zelle-tag-control code\s*\{[^}]*overflow-wrap:\s*normal[^}]*white-space:\s*nowrap[^}]*word-break:\s*normal/s);
    assert.match(donateSource, /\.zelle-copy-button\s*\{[^}]*width:\s*auto[^}]*flex:\s*0 0 auto/s);
});

test('the giving experience stays minimal, parallel, and progressively discloses secondary details', () => {
    assert.match(donateSource, /class="giving-heading"/);
    assert.match(donateSource, /<h1 id="giving-title">Support Kehilat Ohr HaTorah<\/h1>/);
    assert.match(donateSource, /class="provider-primary-action zelle-primary-action"/);
    assert.match(donateSource, /class="provider-primary-action paypal-primary-action"/);
    assert.equal([...donateSource.matchAll(/class="provider-primary-action /g)].length, 2);
    assert.match(donateSource, /<details class="giving-disclosure">/);
    assert.match(donateSource, /Giving records and special gifts/);
    assert.doesNotMatch(donateSource, /class="giving-intro"|class="giving-confidence"|class="giving-info"/);
    assert.doesNotMatch(donateSource, /method-number|provider-state|payment-assurance-list|paypal-gift-options|paypal-official-button/);
    assert.match(donateSource, /@media \(prefers-reduced-motion: reduce\)/);
});
