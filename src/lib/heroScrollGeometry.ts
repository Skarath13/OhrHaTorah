// Geometry for the homepage hero Torah scroll. Units: 1 unit = 100 px of the
// 612x408 /images/logo.png artwork. Origin = midpoint between the two roller
// axes (logo x 306) at the vertical centre of the parchment (logo y 207.5).

export const LOGO_WIDTH = 612;
export const LOGO_HEIGHT = 408;
export const PX = 0.01;
export const ORIGIN_X = 306;
export const ORIGIN_Y = 207.5;

// The flat sheet sits behind the roller-axis plane, so it is scaled up to
// project at the artwork's size through the hero camera.
export const SHEET_SCALE = 1.0114;
export const SHEET_HEIGHT = 2.33 * SHEET_SCALE;   // logo y 91..324
export const COIL_TOP = 1.225;                   // wound parchment reaches the discs
export const COIL_BOTTOM = -1.175;
export const OPEN_OFFSET = 2.28;                 // roller axes at logo x 78 and 534
export const CORE_RADIUS = 0.1;
export const PITCH = 0.006;                      // spiral pitch / 2pi, open coil r 0.265
export const STRIP_LENGTH = 14.6;                // wound + visible parchment
export const STRIP_SEGMENTS = 900;

// Clean parchment area of the artwork, skipping the baked coil shadows.
export const ARTWORK_CROP = { x0: 112, x1: 504, y0: 91, y1: 324 } as const;

export const outerRadius = (wound: number) =>
    Math.sqrt(CORE_RADIUS * CORE_RADIUS + 2 * PITCH * Math.max(wound, 0));

// Turn angle at which `arc` length of parchment has been wound inward from
// the outer radius of an Archimedean coil.
export const windAngle = (arc: number, rOut: number) =>
    (rOut - Math.sqrt(Math.max(rOut * rOut - 2 * PITCH * arc, 0))) / PITCH;

// Closed: the coils press together, so the roller offset is just under the
// outer coil radius and the sheet behind the seam stays hidden.
export function closedOffset() {
    let offset = 0.3;
    for (let i = 0; i < 30; i++) offset = outerRadius(STRIP_LENGTH / 2 - offset);
    return offset * 0.94;
}

export type ScrollPose = { offset: number; spin: number };

// Writes the strip's vertex positions for progress 0 (closed) .. 1 (open).
// `baseX` / `baseY` are the flat strip's rest positions. Text faces inward on
// the rollers, as on a real sefer Torah.
export function poseStrip(
    progress: number,
    baseX: ArrayLike<number>,
    baseY: ArrayLike<number>,
    out: Float32Array,
    closed = closedOffset(),
): ScrollPose {
    const offset = closed + (OPEN_OFFSET - closed) * progress;
    const wound = STRIP_LENGTH / 2 - offset;
    const rOut = outerRadius(wound);

    for (let i = 0; i < baseX.length; i++) {
        const s = baseX[i];
        const sign = Math.sign(s) || 1;
        const arc = Math.abs(s) - offset;
        const j = i * 3;
        if (arc <= 0) {
            out[j] = s;
            out[j + 1] = baseY[i];
            out[j + 2] = -rOut;
            continue;
        }
        const angle = windAngle(Math.min(arc, wound), rOut);
        const r = rOut - PITCH * angle;
        out[j] = sign * (offset + r * Math.sin(angle));
        out[j + 1] = baseY[i] > 0 ? COIL_TOP : COIL_BOTTOM;
        out[j + 2] = -r * Math.cos(angle);
    }

    return { offset, spin: windAngle(wound, rOut) };
}

// Turned-wood roller (etz chaim) profile traced from the artwork, as
// [radius, height] pairs from the bottom finial to the top finial.
export const ROLLER_PROFILE: ReadonlyArray<readonly [number, number]> = [
    [0.001, -1.775], [0.03, -1.765], [0.055, -1.745], [0.07, -1.725], [0.08, -1.68], [0.08, -1.645],
    [0.068, -1.6], [0.064, -1.545], [0.066, -1.51], [0.085, -1.485], [0.075, -1.455], [0.07, -1.345],
    [0.145, -1.325], [0.305, -1.31], [0.335, -1.29], [0.335, -1.245], [0.3, -1.23], [0.17, -1.22],
    [0.17, -1.185], [CORE_RADIUS, -1.185],
    [CORE_RADIUS, 1.225], [0.265, 1.235], [0.29, 1.245], [0.335, 1.255], [0.34, 1.29], [0.335, 1.315],
    [0.31, 1.335], [0.155, 1.375], [0.065, 1.39], [0.06, 1.41], [0.075, 1.455], [0.085, 1.48],
    [0.07, 1.5], [0.06, 1.54], [0.06, 1.63], [0.07, 1.665], [0.08, 1.69], [0.08, 1.72], [0.07, 1.75],
    [0.06, 1.79], [0.05, 1.82], [0.035, 1.84], [0.001, 1.845],
];
