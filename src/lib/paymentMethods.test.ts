import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const repositoryRoot = fileURLToPath(new URL('../..', import.meta.url));
const donateSource = readFileSync(`${repositoryRoot}/src/pages/donate.astro`, 'utf8');
const zelleQrAsset = readFileSync(`${repositoryRoot}/public/images/payments/zelle-ohrhatorahoc-qr.png`);
const paypalQrAsset = readFileSync(`${repositoryRoot}/public/images/payments/paypal-donation-qr.png`);
const expectedZelleQrSha256 = '029cd082d7ed5d771d2cd41d8cf9e9009719d5e08f776c3bf180265747ad27ef';
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
});

test('the published PayPal destination matches the PayPal-hosted Donate artifacts', () => {
    assert.match(donateSource, /const paypalHostedButtonId = 'LPN2RWR887N84'/);
    assert.match(donateSource, /https:\/\/www\.paypal\.com\/donate\/\?hosted_button_id=/);
    assert.match(donateSource, /https:\/\/www\.paypal\.com\/donate[^>]*method="post"/);
    assert.match(donateSource, /name="hosted_button_id" value=\{paypalHostedButtonId\}/);
    assert.match(donateSource, /https:\/\/www\.paypalobjects\.com\/en_US\/i\/btn\/btn_donateCC_LG\.gif/);
    assert.match(donateSource, /\/images\/payments\/paypal-donation-qr\.png/);
    assert.match(donateSource, /one-time, monthly, or yearly gift/);
    assert.equal(createHash('sha256').update(paypalQrAsset).digest('hex'), expectedPaypalQrSha256);
});

test('payment presentation stays accurate and does not fabricate provider trust', () => {
    assert.match(donateSource, /Zelle® does not offer purchase protection/);
    assert.match(donateSource, /not affiliated with, sponsored by, or endorsed by Early Warning Services/);
    assert.match(donateSource, /PayPal processes the donation on its website/);
    assert.match(donateSource, /does not receive your PayPal password or payment credentials/);
    assert.match(donateSource, /Bank-generated QR/);
    assert.match(donateSource, /No bank sign-in on this site/);
    assert.match(donateSource, /Confirm recipient before sending/);
    assert.match(donateSource, /PayPal-hosted checkout/);
    assert.match(donateSource, /No payment credentials stored here/);
    assert.doesNotMatch(donateSource, /PayPal-hosted giving is being prepared|No payment is collected here yet/);
    assert.doesNotMatch(donateSource, /Friends and Family/i);
    assert.doesNotMatch(donateSource, /verified Zelle|trust badge|purchase-protection badge|guaranteed secure/i);
    assert.doesNotMatch(donateSource, /zelle[^"']*logo/i);
});

test('primary payment cards remain side by side on desktop and stack Zelle first on mobile', () => {
    const zelleCardIndex = donateSource.indexOf('donation-card donation-card-zelle');
    const paypalCardIndex = donateSource.indexOf('donation-card donation-card-paypal');
    const checkCardIndex = donateSource.indexOf('donation-card donation-card-check');

    assert.ok(zelleCardIndex >= 0);
    assert.ok(paypalCardIndex > zelleCardIndex, 'PayPal should follow Zelle in source and mobile order');
    assert.ok(checkCardIndex > paypalCardIndex, 'Check giving should remain the quieter final option');
    assert.match(
        donateSource,
        /\.donation-grid\.donation-methods\s*\{[^}]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/s,
    );
    assert.match(
        donateSource,
        /\.donation-card-check\s*\{[^}]*grid-column:\s*1 \/ -1/s,
    );
    assert.match(
        donateSource,
        /@media \(max-width: 760px\)[\s\S]*?\.donation-grid\.donation-methods,[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\)/,
    );
});

test('provider themes use accurate palettes without replacing the official payment artifacts', () => {
    assert.match(donateSource, /\.donation-card-zelle\s*\{[^}]*--payment-accent:\s*#6d1ed4/s);
    assert.match(donateSource, /\.donation-card-paypal\s*\{[^}]*--payment-accent:\s*#0070ba/s);
    assert.match(donateSource, /--payment-accent-deep:\s*#003087/);
    assert.match(donateSource, /#ffc439/);
    assert.match(donateSource, /https:\/\/www\.paypalobjects\.com\/en_US\/i\/btn\/btn_donateCC_LG\.gif/);
    assert.match(donateSource, /\/images\/payments\/zelle-ohrhatorahoc-qr\.png/);
    assert.match(donateSource, /\/images\/payments\/paypal-donation-qr\.png/);
});
