# Hero media provenance

Downloaded and first transformed on 2026-08-06 from the official Pexels asset pages and CDN. The current `loop-v3` derivatives were rebuilt from the verified source files on 2026-09-01 with FFmpeg 8.0.1 and the checked-in `scripts/build-hero-loops.sh` recipe. Pexels permits free website use and modification without required attribution, subject to its restrictions on endorsement, offensive use of identifiable people, standalone resale/redistribution, and trademark use. See the [Pexels License](https://www.pexels.com/legal-pages/license/).

## Desktop Torah and yad

- Source page: https://www.pexels.com/video/close-up-view-of-a-person-using-a-yad-to-point-on-a-hebrew-bible-5986569/
- Creator: cottonbro studio
- Source file: `5986569-uhd_4096_2160_25fps.mp4`
- Source media: 4096x2160, 25 fps, 22.04 seconds
- Official CDN: https://videos.pexels.com/video-files/5986569/5986569-uhd_4096_2160_25fps.mp4
- Source SHA-256: `dcf4bc47af7e38ef4466cce7d353a50e7be1bef5fb3de29a3deb22b05199c5e6`
- Transform: selected source frames from 00:02.00 through 00:06.68 (exclusive trim boundary 00:06.72); removed audio; center-cropped from 4096x2160 to 16:9; resized to 1920x1080. Motion-compensated interpolation at 100 fps supports a 0.12-second quadratic speed transition at each end before the final 25 fps render.
- Outputs: `ohr-hatorah-hero-desktop-loop-v3.mp4` (H.264) and `ohr-hatorah-hero-desktop-loop-v3.webm` (VP9), both 9.36 seconds and 234 frames with no audio. The 118-frame eased forward derivative is followed by forward frames 116 through 1 in reverse order. Omitting the repeated turn and seam endpoints keeps each boundary to one endpoint frame while the short speed transition prevents a full-speed direction snap.
- Encoding: H.264 High Profile level 4.1, CRF 23, `faststart`, 50-frame GOP; VP9 Profile 0, CRF 31, 50-frame GOP. Both outputs are 8-bit YUV 4:2:0 with BT.709 color metadata.
- Output SHA-256: MP4 `4df444856be8e97ae507635033766373b56c018350f9d7f80e561b9448a414f6`; WebM `8edb130228601c45942274419417cb35c6e9f1ad8546bff7264071c00e18a68b`.
- Superseded issue: desktop `loop-v2` mirrored a legacy derivative that already contained an intentional 0.4-second final-frame hold. That doubled the still region at the turnaround; FFmpeg `freezedetect` measured 0.84 seconds at `-48dB`. Rebuilding from source and applying the short speed curve reduces the corresponding v3 transition to 0.16 seconds at the same threshold.
- Posters: the existing prior-render frame at 00:04 is retained as `ohr-hatorah-hero-poster.webp` (quality 82) and `ohr-hatorah-hero-poster.avif` (`CRF 32`).

## Mobile Torah and yad

- Source page: https://www.pexels.com/video/person-using-a-yad-to-point-on-a-hebrew-bible-5986561/
- Creator: cottonbro studio
- Source file: `5986561-uhd_2160_4096_25fps.mp4`
- Source media: 1440x2732, 25 fps, 24.44 seconds
- Official CDN: https://videos.pexels.com/video-files/5986561/5986561-uhd_2160_4096_25fps.mp4
- Source SHA-256: `5ea4a13a204fdcf2b80352bfd8d2d4335cd6913260422b2aef23676de9e9d153`
- Transform: selected source frames from 00:04.00 through 00:08.68 (exclusive trim boundary 00:08.72); removed audio; cropped from 1440x2732 to 1440x2560; resized to 1080x1920. The same 100 fps motion interpolation and 0.12-second quadratic end transitions are applied before the final 25 fps render.
- Outputs: `ohr-hatorah-hero-mobile-loop-v3.mp4` (H.264) and `ohr-hatorah-hero-mobile-loop-v3.webm` (VP9), both 9.36 seconds and 234 frames with no audio. The forward/reverse frame construction and endpoint omission match desktop.
- Encoding: H.264 High Profile level 4.1, CRF 23, `faststart`, 50-frame GOP; VP9 Profile 0, CRF 31, 50-frame GOP. Both outputs are 8-bit YUV 4:2:0 with BT.709 color metadata.
- Output SHA-256: MP4 `1ef14dc8ef0ac98c0e2bc7fb5db5b374e7202f76c75e7f96e0bd4519d7671903`; WebM `530db00198bbefc058f81f46f018814b59b5598145d50b03c15616467c818647`.
- Posters: the existing prior-render frame at 00:02.4 is retained as `ohr-hatorah-hero-mobile-poster.webp` and `ohr-hatorah-hero-mobile-poster.avif`.
- Poster SHA-256: WebP `9b5263c37847516151cc28f9edf4a150e023b4914e25fcfd9ae99c303ebed951`; AVIF `4dfcb190f8eeea29abe434f36376a7fad4f5800e8663435f59f470edb90352db`.

The video is decorative stock footage. It must not be presented as footage of Kehilat Ohr HaTorah, its building, clergy, or congregants.
