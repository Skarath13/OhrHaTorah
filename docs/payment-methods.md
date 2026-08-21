# Donation payment methods

## Zelle payment destination

The public donation page uses the congregation's bank-generated Zelle QR code. The maintainer supplied the source PDF on 2026-08-20.

- Public asset: `public/images/payments/zelle-ohrhatorahoc-qr.png`
- Asset SHA-256: `029cd082d7ed5d771d2cd41d8cf9e9009719d5e08f776c3bf180265747ad27ef`
- Bank-sheet wordmark asset: `public/images/payments/zelle-bank-wordmark.png`
- Wordmark asset SHA-256: `8c1e0c88e4706ee97013272b25fe0ae9d9e99cc722773c50048e6bdc26dfbedf`
- Zelle tag shown by the bank: `ohrhatorahoc`
- Recipient name shown by the bank: `CONGREGATION OHR HAT`
- Decoded QR host: `enroll.zellepay.com`

Before replacing the QR, tag, recipient name, or payment URL, obtain a new bank-generated artifact and verify all four values agree. Scan-test the final public asset after any image processing. Never substitute a QR supplied through email or an unverified third party.

The public page uses the bank-generated QR and the unmodified Zelle wordmark embedded in the same bank-generated payment sheet. The wordmark is used only inside that Zelle payment module to identify the bank-issued payment path. Do not reuse it as a site or congregation mark, replace it with a third-party recreation, or add a certification or trust badge without separately documented permission from the trademark owner or an authorized sublicense. Do not imply purchase protection, sponsorship, endorsement, or affiliation.

## PayPal hosted Donate destination

The public donation page uses the PayPal-hosted Donate page created in the congregation's PayPal account on 2026-08-20.

- PayPal hosted button ID: `LPN2RWR887N84`
- Public donation URL: `https://www.paypal.com/donate/?hosted_button_id=LPN2RWR887N84`
- QR destination: `https://www.paypal.com/donate/?hosted_button_id=LPN2RWR887N84&source=qr`
- Public QR asset: `public/images/payments/paypal-donation-qr.png`
- Asset SHA-256: `0d3a54e810b811429f2cd4b3e6f9a28d7252a3d7070c3c48063ef04532c7d93b`
- Official button image: `https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif`
- Official PayPal mark image: `https://www.paypalobjects.com/webstatic/mktg/logo/pp_cc_mark_111x69.jpg`

The PayPal page supports one-time, monthly, and yearly giving; suggested amounts of $18, $36, and $72; a custom amount; optional fee coverage; and an optional donor note. PayPal owns and processes the checkout flow. The website must not collect PayPal credentials or imply that the congregation is a PayPal Confirmed Charity unless that separate status is verified in PayPal.

Before replacing the button ID, URL, QR, button image, or PayPal mark, create or update the donation page inside the congregation-controlled PayPal account, download PayPal's generated QR, decode the final asset, and verify that every public destination uses the same hosted button ID. Keep PayPal-hosted brand images unmodified and link the displayed mark to the PayPal donation destination.

Do not ask donors to select a personal or "Friends and Family" transaction. Donations must follow the account type and payment flow authorized by PayPal.
