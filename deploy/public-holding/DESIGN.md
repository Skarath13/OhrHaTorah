---
name: Public construction surface
description: Spacious white holding page with quiet typography and a traced Star of David.
colors:
  canvas: "#fff"
  ink: "#263434"
  muted-text: "#65716f"
  mark-line: "#657e7b"
  mark-foundation: "#e3e9e8"
  selection: "#dce7e6"
typography:
  headline:
    fontFamily: '"Source Serif", Georgia, serif'
    fontSize: "clamp(32px, 3.4vw, 46px)"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "-.025em"
  body:
    fontFamily: '"Source Sans", sans-serif'
    fontSize: "17px"
    lineHeight: 1.6
  label:
    fontFamily: '"Source Sans", sans-serif'
    fontSize: "12px"
    lineHeight: 1.5
    letterSpacing: ".035em"
spacing:
  supporting-copy-gap: "17px"
  mark-gap: "38px"
  short-mark-gap: "24px"
components:
  construction-mark:
    width: "104px"
    height: "104px"
  construction-mark-short:
    width: "76px"
    height: "76px"
  construction-copy:
    width: "100%"
  domain-label:
    textColor: "{colors.muted-text}"
    typography: "{typography.label}"
    padding: "0 24px 24px"
---

# Design System: Public construction surface

## Overview

**Creative North Star: "White space and quiet type"**

A bright white page centers a thin Star of David above a serif headline and one
supporting sentence. Generous empty space, restrained colors, and a small domain
label provide the entire visual hierarchy. This records the approved holding
surface only.

**Key Characteristics:**
- Generous white space.
- Centered serif headline and sans-serif supporting text.
- Thin SVG mark with continuous trace.

## Colors

The cool, muted palette uses ink for the headline, muted text for the supporting
sentence and footer, and a softer accent for the traced mark. The pale foundation
keeps the symbol visible before the trace completes. Selection uses the pale
selection color with ink text. Values in the frontmatter are extracted from CSS.

## Typography

Source Serif supplies the balanced headline; Source Sans supplies the sentence
and domain label. Both local variable font files support weights 200–900 with
`font-display: swap`; the headline explicitly uses regular weight. Supporting
text and the footer inherit the normal body weight. No additional type roles
are implemented.

## Layout

The main area uses a centered grid with `100vh` fallback and `100svh` minimum
height. Padding is `64px 24px 104px`; the centered copy block has a maximum width
of `580px`. The mark sits above the headline; the supporting sentence follows
with the documented copy gap. The footer begins at `calc(100svh - 58px)`.

At viewport heights up to `440px`, the main minimum height becomes `400px`, top
padding becomes `32px`, the smaller mark and gap apply, and the footer begins
at `360px`. There is no width breakpoint; the headline scales fluidly.

## Elevation & Depth

The surface is flat. It uses no shadows, panels, gradients, or raised controls.

## Shapes

Two triangular outlines form the Star of David in a `120 × 120` SVG viewBox.
Strokes are `1.15px` with round joins and caps. No card or control radius exists.

## Components

The decorative mark is hidden from assistive technology. Each triangle traces, holds, and retraces over a looping `12s` cycle using
`cubic-bezier(.45, 0, .2, 1)`; the second starts `0.4s` later. The headline carries a letter-by-letter light wave on the same 12-second cycle.
Each letter changes from ink `#263434` to sage `#657e7b` and returns to ink,
with a `65ms` stagger. Word wrappers preserve natural line breaks; the heading
keeps one complete accessible name. Text remains visible and stationary throughout. A small 44px pause
checkbox at the bottom right stops both animations and switches its icon to play.
Reduced-motion preference disables all animation, immediately displays both
outlines, and hides the motion control. The remaining components are
the construction copy and non-interactive domain label.

## Do's and Don'ts

- Do preserve the generous white space and centered hierarchy.
- Do preserve the looping trace, pause control, and reduced-motion static state.
- Don't expand the visible body beyond the approved vague construction message.
