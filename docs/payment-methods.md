# Donation payment methods

## Zelle payment destination

The public donation page uses the congregation's bank-generated Zelle QR code. The maintainer supplied the source PDF on 2026-08-20.

- Public asset: `public/images/payments/zelle-ohrhatorahoc-qr.png`
- Asset SHA-256: `029cd082d7ed5d771d2cd41d8cf9e9009719d5e08f776c3bf180265747ad27ef`
- Zelle tag shown by the bank: `ohrhatorahoc`
- Recipient name shown by the bank: `CONGREGATION OHR HAT`
- Decoded QR host: `enroll.zellepay.com`

Before replacing the QR, tag, recipient name, or payment URL, obtain a new bank-generated artifact and verify all four values agree. Scan-test the final public asset after any image processing. Never substitute a QR supplied through email or an unverified third party.

The public page uses a plain-text Zelle reference and the bank-generated QR. Do not add an independent Zelle logo, certification mark, or trust badge without documented permission from the trademark owner or an authorized sublicense. Do not imply purchase protection, sponsorship, endorsement, or affiliation.

## PayPal hosted Donate destination

The public donation page uses the PayPal-hosted Donate page created in the congregation's PayPal account on 2026-08-20.

- PayPal hosted button ID: `LPN2RWR887N84`
- Public donation URL: `https://www.paypal.com/donate/?hosted_button_id=LPN2RWR887N84`
- QR destination: `https://www.paypal.com/donate/?hosted_button_id=LPN2RWR887N84&source=qr`
- Public QR asset: `public/images/payments/paypal-donation-qr.png`
- Asset SHA-256: `0d3a54e810b811429f2cd4b3e6f9a28d7252a3d7070c3c48063ef04532c7d93b`
- Official button image: `https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif`

The PayPal page supports one-time, monthly, and yearly giving; suggested amounts of $18, $36, and $72; a custom amount; optional fee coverage; and an optional donor note. PayPal owns and processes the checkout flow. The website must not collect PayPal credentials or imply that the congregation is a PayPal Confirmed Charity unless that separate status is verified in PayPal.

Before replacing the button ID, URL, or QR, create or update the donation page inside the congregation-controlled PayPal account, download PayPal's generated QR, decode the final asset, and verify that every public destination uses the same hosted button ID.

Do not ask donors to select a personal or "Friends and Family" transaction. Donations must follow the account type and payment flow authorized by PayPal.
