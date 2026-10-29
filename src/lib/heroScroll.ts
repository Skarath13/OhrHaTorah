import {
    BackSide,
    CanvasTexture,
    DirectionalLight,
    FrontSide,
    Group,
    HemisphereLight,
    LatheGeometry,
    MathUtils,
    Mesh,
    MeshBasicMaterial,
    MeshStandardMaterial,
    NoToneMapping,
    PerspectiveCamera,
    PlaneGeometry,
    SRGBColorSpace,
    Scene,
    Vector2,
    WebGLRenderer,
} from 'three';
import {
    ARTWORK_CROP,
    LOGO_HEIGHT,
    LOGO_WIDTH,
    ORIGIN_X,
    ORIGIN_Y,
    PX,
    ROLLER_PROFILE,
    SHEET_HEIGHT,
    SHEET_SCALE,
    STRIP_LENGTH,
    STRIP_SEGMENTS,
    closedOffset,
    poseStrip,
} from './heroScrollGeometry.ts';

const UNFURL_MS = 3400;
const START_DELAY_MS = 350;
const TEXELS_PER_UNIT = 280;

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

// Parchment strip texture built from the logo's own pixels. The back side
// (outside of the coils) is plain parchment, painted a little paler like the
// artwork's coils.
function stripCanvas(art: HTMLImageElement, withArt: boolean) {
    const width = Math.round(STRIP_LENGTH * TEXELS_PER_UNIT);
    const height = Math.round(SHEET_HEIGHT * TEXELS_PER_UNIT);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const g = canvas.getContext('2d');
    if (!g) throw new Error('2D canvas unavailable');

    const { x0, x1, y0, y1 } = ARTWORK_CROP;
    const toTexel = (logoX: number) => width / 2 + (logoX - ORIGIN_X) * PX * TEXELS_PER_UNIT * SHEET_SCALE;
    g.imageSmoothingQuality = 'high';
    // Plain parchment from a text-free column keeps the artwork's tone top to bottom.
    g.drawImage(art, 114, y0, 1, y1 - y0, 0, 0, width, height);

    // Fixed seed so every visit shows the same fibres.
    let seed = 7;
    const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 2500; i++) {
        g.fillStyle = `rgba(150,100,45,${random() * 0.05})`;
        const r = 20 + random() * 90;
        g.beginPath();
        g.ellipse(random() * width, random() * height, r, r * 0.6, 0, 0, Math.PI * 2);
        g.fill();
    }

    if (withArt) {
        g.drawImage(art, x0, y0, x1 - x0, y1 - y0, toTexel(x0), 0, toTexel(x1) - toTexel(x0), height);
    } else {
        g.fillStyle = 'rgba(255,244,222,0.2)';
        g.fillRect(0, 0, width, height);
    }
    return canvas;
}

function buildScene(art: HTMLImageElement, renderer: WebGLRenderer) {
    const texture = (canvas: HTMLCanvasElement) => {
        const t = new CanvasTexture(canvas);
        t.colorSpace = SRGBColorSpace;
        t.anisotropy = renderer.capabilities.getMaxAnisotropy();
        return t;
    };

    const scene = new Scene();
    scene.add(new HemisphereLight(0xffffff, 0xb89a70, 0.55));
    const key = new DirectionalLight(0xffffff, 2.8);
    key.position.set(-1.5, 2, 5);
    scene.add(key);

    const root = new Group();
    scene.add(root);

    const strip = new PlaneGeometry(STRIP_LENGTH, SHEET_HEIGHT, STRIP_SEGMENTS, 1);
    const position = strip.attributes.position;
    const baseX = Float32Array.from({ length: position.count }, (_, i) => position.getX(i));
    const baseY = Float32Array.from({ length: position.count }, (_, i) => position.getY(i));
    const backTexture = texture(stripCanvas(art, false));
    // Text side is unlit so the open scroll shows the artwork's pixels unchanged.
    root.add(new Mesh(strip, new MeshBasicMaterial({ map: texture(stripCanvas(art, true)), side: FrontSide })));
    root.add(new Mesh(strip, new MeshStandardMaterial({
        map: backTexture, emissive: 0xffffff, emissiveMap: backTexture, emissiveIntensity: 0.6,
        roughness: 0.9, side: BackSide,
    })));

    const rollerGeometry = new LatheGeometry(ROLLER_PROFILE.map(([r, y]) => new Vector2(r, y)), 72);
    const wood = new MeshStandardMaterial({ color: 0x7a4220, roughness: 0.38, metalness: 0.05 });
    const left = new Mesh(rollerGeometry, wood);
    const right = new Mesh(rollerGeometry, wood);
    root.add(left, right);

    const closed = closedOffset();
    const pose = (progress: number) => {
        const { offset, spin } = poseStrip(progress, baseX, baseY, position.array as Float32Array, closed);
        position.needsUpdate = true;
        strip.computeVertexNormals();
        right.position.x = offset;
        right.rotation.y = -spin;
        left.position.x = -offset;
        left.rotation.y = spin;
    };

    // Long lens so the front view reads like the flat artwork, framed to its 612x408 box.
    const camera = new PerspectiveCamera(10, LOGO_WIDTH / LOGO_HEIGHT, 1, 100);
    const lift = (ORIGIN_Y - LOGO_HEIGHT / 2) * PX;
    camera.position.set(0, lift, (LOGO_HEIGHT / 2) * PX / Math.tan(MathUtils.degToRad(5)));
    camera.lookAt(0, lift, 0);

    return { scene, camera, pose };
}

const imageReady = (img: HTMLImageElement) =>
    img.complete && img.naturalWidth > 0
        ? Promise.resolve()
        : new Promise<void>((resolve, reject) => {
            img.addEventListener('load', () => resolve(), { once: true });
            img.addEventListener('error', () => reject(new Error('logo failed to load')), { once: true });
        });

const nextVisible = (host: HTMLElement) => new Promise<void>((resolve) => {
    const observer = new IntersectionObserver(([entry]) => {
        // A hidden page starts on its first visible frame: rAF does not tick while hidden.
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        resolve();
    });
    observer.observe(host);
});

// Unfurls the hero logo once in 3D, then hands back to the original image.
export async function mountHeroScroll(host: HTMLElement) {
    const art = host.querySelector('img');
    if (!art) throw new Error('hero logo image missing');
    await imageReady(art);

    const renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.toneMapping = NoToneMapping;
    const canvas = renderer.domElement;
    canvas.className = 'home-hero-logo-scroll';
    canvas.setAttribute('aria-hidden', 'true');

    const { scene, camera, pose } = buildScene(art, renderer);
    const draw = () => renderer.render(scene, camera);
    const fit = () => {
        renderer.setSize(host.clientWidth, host.clientWidth * (LOGO_HEIGHT / LOGO_WIDTH), false);
        draw();
    };
    const resizeObserver = new ResizeObserver(fit);

    pose(0);
    host.append(canvas);
    resizeObserver.observe(host);
    fit();
    host.dataset.heroScroll = 'playing';

    await nextVisible(host);
    await new Promise<void>((resolve) => {
        let start = 0;
        renderer.setAnimationLoop((now) => {
            start ||= now + START_DELAY_MS;
            const t = MathUtils.clamp((now - start) / UNFURL_MS, 0, 1);
            pose(ease(t));
            draw();
            if (t < 1) return;
            renderer.setAnimationLoop(null);
            resolve();
        });
    });

    // The final frame matches the artwork; cross-fade back to the crisp image.
    host.dataset.heroScroll = 'done';
    resizeObserver.disconnect();
    window.setTimeout(() => {
        canvas.remove();
        renderer.dispose();
        renderer.forceContextLoss();
    }, 600);
}
