# Ohr HaTorah Public Content Voice

This guide is the durable source of truth for audience-facing website copy. It is derived from the rabbi's August 11, 2026 website feedback and the June 16, 2026 bylaws. Treat the wording in those sources as deliberate.

## Controlling identity statement

Use this statement verbatim when a concise description of the congregation is needed:

> Kehilat Ohr HaTorah is a Messianic Jewish congregation (UMJC member) committed to Torah Covenant faithfulness, to Jewish community life and tradition, to the unity of Jewish and non-Jewish members, and to faith in the atoning death and resurrection of Yeshua, our coming Messiah and restorer of Israel.

The canonical website copy and structured long-form content live in `src/data/congregationIdentity.ts`. Update that source first so the homepage and `/mission` do not drift.

## Voice

- Write with a precise, covenantal, communal, and declarative voice.
- Prefer the source's first-person forms: `We are committed to...`, `We affirm...`, `We embrace...`, and `We value...`.
- Use `Messianic Jewish congregation` or `Messianic Synagogue`; do not flatten the identity into generic `faith community` language.
- Preserve all four identity anchors: Torah Covenant faithfulness; Jewish community life and tradition; unity of Jewish and non-Jewish members without erasing their distinct identities and callings; and faith in Yeshua's atoning death and bodily resurrection as the coming Messiah and restorer of Israel.
- Preserve Jewish theological vocabulary. Translate it on first use where the approved source does, including `Besorah (good news)`, `Brit Chadashah (New Covenant)`, `Ruach HaKodesh (Holy Spirit)`, `talmidim (disciples)`, and `Maasei Tovim (good works)`.
- Preserve Scripture references and material theological claims. Do not paraphrase away covenant, Israel, resurrection, restoration, repentance, or reconciliation language for brevity.
- Use the brand spelling `Kehilat Ohr HaTorah` consistently.
- Render `HaShem` and `Adonai` in small caps only when the term refers to YHVH. Do not render either term in full-size all caps.

## Editorial boundaries

- Keep promotional summaries short, but build them from the canonical language rather than generic marketing copy.
- Avoid hype, church-marketing cliches, vague inclusivity, invented programs, and unverified claims.
- Do not publish internal bylaws material about membership approval, boards, voting, salaries, dues, records, insurance, indemnification, or ordination procedures as general identity copy.
- The current public status is `UMJC member`. Never restore the superseded sentence that expected membership by June 2026.
- Treat a requested wording change to the canonical identity, vision, commitments, affirmations, or values as a content-governance change. Preserve the approved source unless the rabbi or maintainer explicitly supplies replacement language.

## Source precedence

For the content covered here, use this order when sources differ:

1. Direct, dated feedback from the rabbi or maintainer.
2. The newest approved public-copy module in `src/data/congregationIdentity.ts`.
3. The June 16, 2026 bylaws for Vision and Purpose, Core Commitments and Affirmations, and Core Values.
4. Older website copy.

Do not silently reconcile a conflict. Record the controlling source and make the smallest necessary change.
