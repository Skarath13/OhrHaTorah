import assert from 'node:assert/strict';
import test from 'node:test';
import {
    CORE_RADIUS,
    OPEN_OFFSET,
    PITCH,
    STRIP_LENGTH,
    closedOffset,
    outerRadius,
    poseStrip,
    windAngle,
} from './heroScrollGeometry.ts';

test('winding the full wound length ends on the roller core', () => {
    const wound = STRIP_LENGTH / 2 - OPEN_OFFSET;
    const rOut = outerRadius(wound);
    const angle = windAngle(wound, rOut);
    assert.ok(Math.abs(rOut - PITCH * angle - CORE_RADIUS) < 1e-9);
    assert.ok(Math.abs(rOut - 0.265) < 0.005, 'open coil matches the artwork radius');
});

test('closed coils press together instead of leaving a gap', () => {
    const offset = closedOffset();
    assert.ok(offset < outerRadius(STRIP_LENGTH / 2 - offset));
});

test('the open strip is flat between the rollers and continuous where it winds on', () => {
    const baseX = Float32Array.from([-1, 0, 1, OPEN_OFFSET + 1e-4]);
    const baseY = Float32Array.from([1, 1, -1, 1]);
    const out = new Float32Array(baseX.length * 3);
    const { offset } = poseStrip(1, baseX, baseY, out);
    const rOut = outerRadius(STRIP_LENGTH / 2 - offset);

    assert.equal(offset, OPEN_OFFSET);
    for (const i of [0, 1, 2]) {
        assert.equal(out[i * 3], baseX[i]);
        assert.ok(Math.abs(out[i * 3 + 2] + rOut) < 1e-6);
    }
    assert.ok(Math.abs(out[9] - OPEN_OFFSET) < 1e-3, 'tangent point joins the flat sheet');
    assert.ok(Math.abs(out[11] + rOut) < 1e-3);
});
