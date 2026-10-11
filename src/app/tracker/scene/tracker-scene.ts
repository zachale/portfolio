import * as THREE from "three";
import { Sky } from "three/examples/jsm/objects/Sky.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

import { TrackerStatus, STATUS_META } from "../telemetry";
import { sunAt, sunDirection } from "./sun";

/** What the scene shows: a point in time and what the tracker was doing then. */
export interface SceneMoment {
  time: Date;
  percent: number;
  windMs: number;
  status: TrackerStatus | null;
}

export interface Atmosphere {
  /** Horizon colour, for tinting the page around the canvas. */
  horizon: string;
  /** 0 in full daylight, 1 in full night. */
  night: number;
}

/** Where the tracker should sit in the canvas, as fractions of its width and height. */
export interface Framing {
  x: number;
  y: number;
}

interface SceneOptions {
  /** Desktop-class device: render at full pixel ratio with sharper shadows. */
  highDetail: boolean;
  reducedMotion: boolean;
  onAtmosphere?: (atmosphere: Atmosphere) => void;
}

// On this frame 50% extension is flat, and 69% sits about 21° past flat (SPEC.md, defect 3),
// so one percent of stroke is ~1.1° of tilt. Positive tilt faces the array west.
const DEGREES_PER_PERCENT = 1.1;
export function tiltDegrees(percent: number): number {
  return (Math.min(100, Math.max(0, percent)) - 50) * DEGREES_PER_PERCENT;
}

const DECK_TOP = 0.32;
// The deck is square around the post; the walk joins one of its corners.
const DECK_HALF = 1.16;
const WALK_HALF_WIDTH = 0.575;
const WALK_LENGTH = 16;
// The walk's first board sits far enough into the corner that both of its ends tuck under the
// deck: the corner is DECK_HALF·√2 out, and the deck falls back at 45° on either side of it.
const WALK_START = DECK_HALF * Math.SQRT2 - WALK_HALF_WIDTH - 0.1;
const PIVOT_HEIGHT = 2.62;
const CAMERA_TARGET = new THREE.Vector3(0, 2.05, 0);
// The boardwalk meets the square deck at its north-east corner and runs out to the north-east.
const PATH_DIRECTION = new THREE.Vector2(1, -1).normalize();
// The camera stands north-north-west of the tracker looking along the torque tube, so the array's
// face shows, the walk leads in from the left and the lake opens up on the right, as in the photos.
const CAMERA_AZIMUTH = Math.atan2(-0.265, -0.964);
// The lake lies to the west, so the array faces it when it parks at 100% for the night, and
// reaches round behind the tracker to the south-west.
const LAKE_CENTRE = new THREE.Vector2(-14, 12);

// 3 × 3 modules, each with its long side along the torque tube, as in the photos.
const MODULE_WIDTH = 1.134;
const MODULE_LENGTH = 1.722;
const MODULE_GAP = 0.02;
const ARRAY_HALF_WIDTH = 1.5 * MODULE_WIDTH + MODULE_GAP;
const ARRAY_HALF_LENGTH = 1.5 * MODULE_LENGTH + MODULE_GAP;

// Day for night: after sunset the scene is lit like a film night scene shot in daylight, by a
// cool moon and a blue sky fill, so it stays readable and simply turns blue.
const NIGHT_SKY_TOP = 0x0c1834;
const NIGHT_HORIZON = 0x283d68;
const TWILIGHT_SKY_TOP = 0x1d2d5a;
const TWILIGHT_HORIZON = 0x4b5e8f;
// Moonlight drains colour: at night the greens are pulled toward a grey that the blue light
// then tints, as in day-for-night photography.
const NIGHT_VEGETATION = new THREE.Color(1.5, 0.75, 3);
const MOON_DIRECTION = new THREE.Vector3(-0.56, 0.78, -0.26).normalize();

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// Seeded so the forest is the same on every visit.
function random(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function inLake(x: number, z: number, margin = 0): boolean {
  const dx = x - LAKE_CENTRE.x, dz = z - LAKE_CENTRE.y;
  const angle = Math.atan2(dz, dx);
  const radius = 12 + 2.6 * Math.sin(angle * 3 + 0.6) + 1.4 * Math.sin(angle * 5 - 1.2);
  const stretched = Math.hypot(dx, dz * 0.8);
  return stretched < radius + margin;
}

// The few metres of marsh right at the camera's feet: a shrub there fills half the frame.
function atCameraFeet(x: number, z: number): boolean {
  const along = x * Math.sin(CAMERA_AZIMUTH) + z * Math.cos(CAMERA_AZIMUTH);
  const across = Math.abs(x * Math.cos(CAMERA_AZIMUTH) - z * Math.sin(CAMERA_AZIMUTH));
  return along > 7 && along < 16 && across < 3;
}

/** Whether something reaching `margin` out from (x, z) would touch the deck or the walk. */
function onBoardwalk(x: number, z: number, margin: number): boolean {
  if (Math.abs(x) < DECK_HALF + margin && Math.abs(z) < DECK_HALF + margin) return true;
  const along = x * PATH_DIRECTION.x + z * PATH_DIRECTION.y;
  const across = Math.abs(-x * PATH_DIRECTION.y + z * PATH_DIRECTION.x);
  return along > 0 && along < WALK_LENGTH + margin && across < WALK_HALF_WIDTH + margin;
}

function panelTexture(): THREE.CanvasTexture {
  // A 60-cell all-black monocrystalline module: 6 cells across, 10 along.
  const canvas = document.createElement("canvas");
  canvas.width = 384;
  canvas.height = 576;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#0b0e14";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const cw = canvas.width / 6, ch = canvas.height / 10;
  for (let i = 0; i < 6; i++) {
    for (let j = 0; j < 10; j++) {
      const shade = 18 + ((i * 7 + j * 3) % 5);
      ctx.fillStyle = `rgb(${shade - 6}, ${shade - 3}, ${shade + 8})`;
      ctx.fillRect(i * cw + 2, j * ch + 2, cw - 4, ch - 4);
      ctx.fillStyle = "rgba(160, 170, 190, 0.08)";
      for (let k = 1; k < 4; k++) ctx.fillRect(i * cw + 2, j * ch + (k * ch) / 4, cw - 4, 1);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

export class TrackerScene {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(40, 1, 0.3, 4000);
  private readonly clock = new THREE.Clock();

  private readonly sky = new Sky();
  private readonly envSky = new Sky();
  private readonly nightDome: THREE.Mesh<THREE.SphereGeometry, THREE.ShaderMaterial>;
  private readonly envNightDome: THREE.Mesh<THREE.SphereGeometry, THREE.ShaderMaterial>;
  private readonly envScene = new THREE.Scene();
  private readonly pmrem: THREE.PMREMGenerator;
  private envTarget: THREE.WebGLRenderTarget | null = null;
  private envSunDirection = new THREE.Vector3(0, -1, 0);
  private envUpdatedAt = 0;

  private readonly sunLight = new THREE.DirectionalLight(0xffffff, 3);
  private readonly moonLight = new THREE.DirectionalLight(0x9db6ff, 0);
  private readonly hemiLight = new THREE.HemisphereLight(0xcfe3ff, 0x5b6b38, 1);
  private readonly stars: THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial>;
  private readonly vegetation: { material: THREE.MeshStandardMaterial; color: THREE.Color }[] = [];

  private readonly array = new THREE.Group();
  private readonly actuatorBarrel: THREE.Mesh;
  private readonly actuatorRod: THREE.Mesh;
  // The actuator pushes up the east edge, so extending it turns the array to face west.
  private readonly actuatorBase = new THREE.Vector3(0.1, 1.2, 0);
  private readonly actuatorTop = new THREE.Vector3(0.7, -0.1, 0);
  private readonly rotor = new THREE.Group();
  private readonly led: THREE.Mesh<THREE.SphereGeometry, THREE.MeshStandardMaterial>;
  private readonly glass: THREE.MeshPhysicalMaterial;

  private framing: Framing = { x: 0.5, y: 0.5 };
  private target: SceneMoment = { time: new Date(), percent: 50, windMs: 0, status: null };
  private tilt = 0;
  private sunDir = new THREE.Vector3(0, 1, 0);
  private sunDirTarget = new THREE.Vector3(0, 1, 0);
  private lastAtmosphere = "";
  private running = false;
  private visible = true;
  private disposed = false;
  private readonly baseAzimuth: number;
  private readonly resizeObserver: ResizeObserver;
  private readonly intersectionObserver: IntersectionObserver;

  constructor(private readonly host: HTMLElement, private readonly options: SceneOptions) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, options.highDetail ? 2 : 1.75));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.domElement.style.display = "block";
    this.renderer.domElement.setAttribute("aria-hidden", "true");
    host.appendChild(this.renderer.domElement);
    this.pmrem = new THREE.PMREMGenerator(this.renderer);

    this.scene.fog = new THREE.Fog(0xb9cfe3, 70, 360);

    this.sky.scale.setScalar(3000);
    this.envSky.scale.setScalar(3000);
    for (const sky of [this.sky, this.envSky]) {
      const u = sky.material.uniforms;
      u["turbidity"].value = 2.4;
      u["rayleigh"].value = 2.2;
      u["mieCoefficient"].value = 0.003;
      u["mieDirectionalG"].value = 0.82;
    }
    this.nightDome = this.buildNightDome();
    this.envNightDome = this.nightDome.clone();
    this.scene.add(this.sky, this.nightDome);
    this.envScene.add(this.envSky, this.envNightDome);

    this.stars = this.buildStars();
    this.scene.add(this.stars);

    // The moon casts the shadows once the sun has set; only one of the two casts at a time, so
    // the shaders don't recompile at dusk.
    const shadowSize = options.highDetail ? 2048 : 1024;
    for (const light of [this.sunLight, this.moonLight]) {
      light.castShadow = true;
      light.shadow.mapSize.set(shadowSize, shadowSize);
      // Room for the whole array at full tilt, the deck and the anemometer.
      Object.assign(light.shadow.camera, { left: -6.5, right: 6.5, top: 6.5, bottom: -6.5, near: 1, far: 80 });
      light.shadow.bias = -0.0004;
      light.shadow.normalBias = 0.02;
      light.target.position.set(0, 1, 0);
    }
    this.moonLight.position.copy(MOON_DIRECTION).multiplyScalar(40).add(this.moonLight.target.position);
    this.scene.add(this.sunLight, this.sunLight.target, this.moonLight, this.moonLight.target, this.hemiLight);

    this.buildGround();
    this.buildForest();
    this.buildUnderstory();
    this.buildBoardwalk();
    const tracker = this.buildTracker();
    this.actuatorBarrel = tracker.barrel;
    this.actuatorRod = tracker.rod;
    this.led = tracker.led;
    this.glass = tracker.glass;
    this.buildAnemometer();

    this.baseAzimuth = CAMERA_AZIMUTH;
    // The camera never moves and takes no input: the canvas must not swallow the touches that
    // scroll the page on a phone.
    this.placeCamera();

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(host);
    this.intersectionObserver = new IntersectionObserver(([entry]) => {
      this.visible = entry.isIntersecting;
      this.updateRunning();
    });
    this.intersectionObserver.observe(host);
    document.addEventListener("visibilitychange", this.updateRunning);

    this.resize();
    this.applyMoment(true);
    this.updateRunning();
  }

  setMoment(moment: SceneMoment): void {
    this.target = moment;
    this.applyMoment(false);
  }

  setFraming(framing: Framing): void {
    this.framing = framing;
    this.resize();
  }

  dispose(): void {
    this.disposed = true;
    this.renderer.setAnimationLoop(null);
    this.resizeObserver.disconnect();
    this.intersectionObserver.disconnect();
    document.removeEventListener("visibilitychange", this.updateRunning);
    this.scene.traverse((object) => {
      const mesh = object as THREE.Mesh;
      mesh.geometry?.dispose();
      const materials = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : [];
      for (const material of materials) {
        for (const value of Object.values(material)) if (value instanceof THREE.Texture) value.dispose();
        material.dispose();
      }
    });
    this.envTarget?.dispose();
    this.pmrem.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  private applyMoment(immediate: boolean): void {
    const [x, y, z] = sunDirection(sunAt(this.target.time));
    this.sunDirTarget.set(x, y, z);
    const color = STATUS_META[this.target.status ?? "NIGHT"].color;
    this.led.material.color.set(color);
    this.led.material.emissive.set(color);
    if (immediate) {
      this.tilt = THREE.MathUtils.degToRad(tiltDegrees(this.target.percent));
      this.sunDir.copy(this.sunDirTarget);
      this.updateLighting(true);
      this.updateArray();
      this.renderer.render(this.scene, this.camera);
    }
  }

  private readonly updateRunning = () => {
    const shouldRun = !this.disposed && this.visible && document.visibilityState === "visible";
    if (shouldRun === this.running) return;
    this.running = shouldRun;
    if (shouldRun) {
      this.clock.getDelta();
      this.renderer.setAnimationLoop(() => this.tick());
    } else {
      this.renderer.setAnimationLoop(null);
    }
  };

  private tick(): void {
    const dt = Math.min(this.clock.getDelta(), 0.1);
    const elapsed = this.clock.elapsedTime;
    const ease = 1 - Math.exp(-dt * 2.5);

    const targetTilt = THREE.MathUtils.degToRad(tiltDegrees(this.target.percent));
    this.tilt += (targetTilt - this.tilt) * ease;
    this.updateArray();

    if (this.sunDir.distanceToSquared(this.sunDirTarget) > 1e-8) {
      this.sunDir.lerp(this.sunDirTarget, 1 - Math.exp(-dt * 3)).normalize();
      this.updateLighting(false);
    }

    // Stylised: real cups at 3 m/s would be a blur.
    this.rotor.rotation.y -= dt * (0.6 + this.target.windMs * 2.4);

    const pulse = this.options.reducedMotion ? 1 : 0.65 + 0.35 * Math.sin(elapsed * 2.2);
    this.led.material.emissiveIntensity = 2.2 * pulse;

    this.renderer.render(this.scene, this.camera);
  }

  private placeCamera(): void {
    const azimuth = this.baseAzimuth;
    const aspect = this.camera.aspect || 1;
    // Narrow screens see less sideways, so step back and widen the lens.
    const portrait = aspect < 1;
    const distance = portrait ? 10 + (1 - aspect) * 5 : 9;
    // Look down on the array a little, as from the bank in the photo, so its face shows.
    const elevation = portrait ? 0.2 : 0.17;
    this.camera.position.set(
      CAMERA_TARGET.x + Math.sin(azimuth) * Math.cos(elevation) * distance,
      CAMERA_TARGET.y + Math.sin(elevation) * distance,
      CAMERA_TARGET.z + Math.cos(azimuth) * Math.cos(elevation) * distance,
    );
    this.camera.lookAt(CAMERA_TARGET);
  }

  private resize(): void {
    const width = this.host.clientWidth;
    const height = this.host.clientHeight;
    if (!width || !height) return;
    this.renderer.setSize(width, height, false);
    this.renderer.domElement.style.width = "100%";
    this.renderer.domElement.style.height = "100%";
    this.camera.aspect = width / height;
    // Fit the width on wide screens; on tall ones cap the lens and let the sides crop, or the
    // frame fills with sky and treetops.
    const horizontal = THREE.MathUtils.degToRad(50);
    const vertical = 2 * Math.atan(Math.tan(horizontal / 2) / this.camera.aspect);
    this.camera.fov = THREE.MathUtils.clamp(THREE.MathUtils.radToDeg(vertical), 28, 56);
    // Shift the projection (not the camera) so the tracker lands where the layout has room for it.
    this.camera.setViewOffset(width, height, (0.5 - this.framing.x) * width, (0.5 - this.framing.y) * height, width, height);
    this.camera.updateProjectionMatrix();
    this.placeCamera();
    if (!this.running) this.renderer.render(this.scene, this.camera);
  }

  private updateArray(): void {
    this.array.rotation.z = this.tilt;
    this.array.updateMatrixWorld();
    const base = this.actuatorBase;
    const top = this.array.localToWorld(this.actuatorTop.clone());
    const axis = top.clone().sub(base);
    const length = axis.length();
    const direction = axis.clone().normalize();
    const orientation = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
    const barrelLength = 0.82;
    this.actuatorBarrel.quaternion.copy(orientation);
    this.actuatorBarrel.position.copy(base).addScaledVector(direction, barrelLength / 2);
    const rodLength = Math.max(0.05, length - barrelLength + 0.08);
    this.actuatorRod.quaternion.copy(orientation);
    this.actuatorRod.scale.set(1, rodLength, 1);
    this.actuatorRod.position.copy(top).addScaledVector(direction, -rodLength / 2);
  }

  private updateLighting(force: boolean): void {
    const dir = this.sunDir;
    const altitude = THREE.MathUtils.radToDeg(Math.asin(THREE.MathUtils.clamp(dir.y, -1, 1)));
    const day = smoothstep(-4, 10, altitude);
    const night = 1 - day;
    // The moon comes up as the sun goes down, so twilight is never darker than night.
    const moon = 1 - smoothstep(-6, 2, altitude);
    const starry = 1 - smoothstep(-12, -5, altitude);
    const golden = smoothstep(-5, 1, altitude) * (1 - smoothstep(5, 18, altitude));

    for (const sky of [this.sky, this.envSky]) sky.material.uniforms["sunPosition"].value.copy(dir);
    const domeOpacity = Math.min(0.96, 1 - smoothstep(-7, 1, altitude));
    for (const dome of [this.nightDome, this.envNightDome]) dome.material.uniforms["opacity"].value = domeOpacity;
    this.stars.material.opacity = starry * 0.95;
    this.stars.visible = starry > 0.01;
    const dusk = smoothstep(-12, -4, altitude);
    const dome = this.nightDome.material.uniforms;
    dome["top"].value.set(NIGHT_SKY_TOP).lerp(new THREE.Color(TWILIGHT_SKY_TOP), dusk);
    dome["horizon"].value.set(NIGHT_HORIZON).lerp(new THREE.Color(TWILIGHT_HORIZON), dusk);

    const horizon = new THREE.Color(NIGHT_HORIZON)
      .lerp(new THREE.Color(TWILIGHT_HORIZON), dusk)
      .lerp(new THREE.Color(0xb9cfe3), day)
      .lerp(new THREE.Color(0xe8b58c), golden * 0.55);
    (this.scene.fog as THREE.Fog).color.copy(horizon);

    const sunVisible = smoothstep(-1.5, 10, altitude);
    this.sunLight.intensity = 3.2 * sunVisible;
    this.sunLight.color.set(0xffc490).lerp(new THREE.Color(0xfff5e8), smoothstep(4, 30, altitude));
    this.sunLight.position.copy(dir).multiplyScalar(40).add(this.sunLight.target.position);
    this.sunLight.castShadow = altitude > -1;
    this.moonLight.castShadow = !this.sunLight.castShadow;

    this.moonLight.intensity = 1.6 * moon;
    this.hemiLight.color.set(0x6a86c4).lerp(new THREE.Color(0xd4e4ff), day);
    this.hemiLight.groundColor.set(0x1d2a44).lerp(new THREE.Color(0x56663a), day);
    this.hemiLight.intensity = THREE.MathUtils.lerp(1.15, 0.7, day);
    this.renderer.toneMappingExposure = THREE.MathUtils.lerp(1.2, 0.55, day);
    // The night sky in the panels and the lake is what makes them read after dark.
    this.scene.environmentIntensity = THREE.MathUtils.lerp(1.2, 0.6, day);
    this.glass.envMapIntensity = THREE.MathUtils.lerp(1.5, 0.5, day);
    const drain = new THREE.Color(1, 1, 1).lerp(NIGHT_VEGETATION, night);
    for (const { material, color } of this.vegetation) material.color.copy(color).multiply(drain);

    // Re-render the reflections only when the sky has visibly moved, and not every frame.
    const now = performance.now();
    if (force || (this.envSunDirection.angleTo(dir) > 0.01 && now - this.envUpdatedAt > 250)) {
      this.envSunDirection.copy(dir);
      this.envUpdatedAt = now;
      const previous = this.envTarget;
      this.envTarget = this.pmrem.fromScene(this.envScene, 0, 0.3, 3500);
      this.scene.environment = this.envTarget.texture;
      previous?.dispose();
    }

    const key = `${horizon.getHexString()}:${night.toFixed(2)}`;
    if (key !== this.lastAtmosphere) {
      this.lastAtmosphere = key;
      this.options.onAtmosphere?.({ horizon: `#${horizon.getHexString()}`, night });
    }
  }

  private plant(material: THREE.MeshStandardMaterial): THREE.MeshStandardMaterial {
    this.vegetation.push({ material, color: material.color.clone() });
    return material;
  }

  private buildNightDome() {
    const material = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
      fog: false,
      uniforms: {
        opacity: { value: 0 },
        top: { value: new THREE.Color(NIGHT_SKY_TOP) },
        horizon: { value: new THREE.Color(NIGHT_HORIZON) },
      },
      vertexShader: `varying vec3 vDir; void main() { vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `uniform float opacity; uniform vec3 top; uniform vec3 horizon; varying vec3 vDir;
        void main() { float h = smoothstep(-0.05, 0.55, vDir.y); gl_FragColor = vec4(mix(horizon, top, h), opacity);
        #include <colorspace_fragment>
        }`,
    });
    const dome = new THREE.Mesh(new THREE.SphereGeometry(2800, 32, 16), material);
    dome.renderOrder = 1;
    return dome;
  }

  private buildStars() {
    const rand = random(7);
    const count = 1400;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = rand() * Math.PI * 2;
      const y = 0.08 + rand() * 0.92;
      const r = Math.sqrt(1 - y * y);
      positions.set([Math.cos(theta) * r * 2600, y * 2600, Math.sin(theta) * r * 2600], i * 3);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color: 0xdfe8ff, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0, depthWrite: false, fog: false,
    });
    const stars = new THREE.Points(geometry, material);
    stars.renderOrder = 2;
    return stars;
  }

  private buildGround(): void {
    const geometry = new THREE.PlaneGeometry(700, 700, 220, 220);
    geometry.rotateX(-Math.PI / 2);
    const position = geometry.attributes["position"] as THREE.BufferAttribute;
    const colors = new Float32Array(position.count * 3);
    const marsh = [new THREE.Color(0x4a6624), new THREE.Color(0x5f7d2c), new THREE.Color(0x3c5520)];
    const shore = new THREE.Color(0x6b6440);
    const color = new THREE.Color();
    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i), z = position.getZ(i);
      const noise = Math.sin(x * 0.31) * Math.cos(z * 0.27) + Math.sin(x * 0.11 + z * 0.17) * 0.6;
      let y = noise * 0.08;
      if (inLake(x, z)) y = -1.2;
      else if (inLake(x, z, 2.5)) y = -0.15;
      position.setY(i, y);
      const pick = (noise + 1.6) / 3.2;
      color.copy(marsh[0]).lerp(marsh[1], THREE.MathUtils.clamp(pick, 0, 1));
      if (Math.sin(x * 0.7 + z * 0.4) > 0.6) color.lerp(marsh[2], 0.5);
      if (inLake(x, z, 3)) color.lerp(shore, 0.6);
      colors.set([color.r, color.g, color.b], i * 3);
    }
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.computeVertexNormals();
    const ground = new THREE.Mesh(geometry, this.plant(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 })));
    ground.receiveShadow = true;
    this.scene.add(ground);

    const water = new THREE.Mesh(
      new THREE.CircleGeometry(60, 64).rotateX(-Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0x0c1a1f, metalness: 1, roughness: 0.06, envMapIntensity: 1.1 }),
    );
    water.position.set(LAKE_CENTRE.x, -0.12, LAKE_CENTRE.y);
    this.scene.add(water);
  }

  private buildForest(): void {
    const rand = random(42);
    // A white pine reads as tiers of foliage on a bare trunk.
    const tiers: THREE.BufferGeometry[] = [];
    const layers = 5;
    for (let i = 0; i < layers; i++) {
      const t = i / (layers - 1);
      const radius = 0.34 - t * 0.2;
      const height = 0.26 - t * 0.06;
      const cone = new THREE.ConeGeometry(radius, height, 7, 1);
      cone.translate((i % 2 ? 0.03 : -0.03), 0.34 + t * 0.6, 0);
      tiers.push(cone);
    }
    const foliage = mergeGeometries(tiers)!;
    const trunk = new THREE.CylinderGeometry(0.012, 0.022, 1, 5).translate(0, 0.5, 0);

    const trees: THREE.Matrix4[] = [];
    const tints: THREE.Color[] = [];
    const greens = [0x24401f, 0x2e4d24, 0x1e3a22, 0x35552a];
    const place = (count: number, rMin: number, rMax: number, hMin: number, hMax: number) => {
      let placed = 0, attempts = 0;
      while (placed < count && attempts++ < count * 30) {
        const angle = rand() * Math.PI * 2;
        const r = rMin + rand() * (rMax - rMin);
        const x = Math.cos(angle) * r, z = Math.sin(angle) * r;
        if (inLake(x, z, 3)) continue;
        // Keep the view from the boardwalk to the tracker clear.
        const toward = Math.atan2(x, z) - CAMERA_AZIMUTH;
        const wrapped = Math.atan2(Math.sin(toward), Math.cos(toward));
        if (Math.abs(wrapped) < 1.25 && r < 90) continue;
        const height = hMin + rand() * (hMax - hMin);
        const spread = 0.8 + rand() * 0.45;
        trees.push(new THREE.Matrix4().compose(
          new THREE.Vector3(x, 0, z),
          new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rand() * Math.PI * 2),
          new THREE.Vector3(height * spread, height, height * spread),
        ));
        tints.push(new THREE.Color(greens[Math.floor(rand() * greens.length)]));
        placed++;
      }
    };
    place(60, 34, 85, 7, 14);
    place(320, 75, 210, 9, 18);

    const foliageMesh = new THREE.InstancedMesh(
      foliage,
      this.plant(new THREE.MeshStandardMaterial({ roughness: 0.95, flatShading: true })),
      trees.length,
    );
    const trunkMesh = new THREE.InstancedMesh(trunk, new THREE.MeshStandardMaterial({ color: 0x3b2f26, roughness: 1 }), trees.length);
    trees.forEach((matrix, i) => {
      foliageMesh.setMatrixAt(i, matrix);
      foliageMesh.setColorAt(i, tints[i]);
      trunkMesh.setMatrixAt(i, matrix);
    });
    this.scene.add(foliageMesh, trunkMesh);
  }

  private buildUnderstory(): void {
    const rand = random(1234);
    const bush = new THREE.IcosahedronGeometry(1, 1);
    const jitter = random(5);
    const bushPosition = bush.attributes["position"] as THREE.BufferAttribute;
    const seen = new Map<string, number>();
    for (let i = 0; i < bushPosition.count; i++) {
      // Displace shared vertices together so the blob stays closed.
      const key = [bushPosition.getX(i), bushPosition.getY(i), bushPosition.getZ(i)].map((v) => v.toFixed(3)).join();
      const k = seen.get(key) ?? 0.82 + jitter() * 0.36;
      seen.set(key, k);
      bushPosition.setXYZ(i, bushPosition.getX(i) * k, bushPosition.getY(i) * k, bushPosition.getZ(i) * k);
    }
    bush.computeVertexNormals();
    const shrubs: THREE.Matrix4[] = [];
    const tints: THREE.Color[] = [];
    const greens = [0x3f6a22, 0x4c7a28, 0x58872e, 0x66923a, 0x355d1f];
    let attempts = 0;
    while (shrubs.length < 900 && attempts++ < 12000) {
      const angle = rand() * Math.PI * 2;
      const r = 1.7 + Math.pow(rand(), 1.3) * 34;
      const x = Math.cos(angle) * r, z = Math.sin(angle) * r;
      if (inLake(x, z, 1.5) || atCameraFeet(x, z)) continue;
      const size = 0.22 + rand() * 0.34;
      const spread = new THREE.Vector3(size * (1 + rand() * 0.7), size * 0.8, size * (1 + rand() * 0.7));
      // Keep the whole bush (its jittered radius reaches 1.18) off the boards, not just its centre.
      if (onBoardwalk(x, z, Math.max(spread.x, spread.z) * 1.18 + 0.05)) continue;
      shrubs.push(new THREE.Matrix4().compose(
        new THREE.Vector3(x, size * 0.2, z),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(rand() * 0.4, rand() * 6, rand() * 0.4)),
        spread,
      ));
      tints.push(new THREE.Color(greens[Math.floor(rand() * greens.length)]));
    }
    const shrubMesh = new THREE.InstancedMesh(bush, this.plant(new THREE.MeshStandardMaterial({ roughness: 0.85 })), shrubs.length);
    shrubs.forEach((matrix, i) => {
      shrubMesh.setMatrixAt(i, matrix);
      shrubMesh.setColorAt(i, tints[i]);
    });
    shrubMesh.receiveShadow = true;
    this.scene.add(shrubMesh);

    // Reeds and cattails along the shore and through the marsh.
    const reed = new THREE.CylinderGeometry(0.006, 0.012, 1, 4).translate(0, 0.5, 0);
    const head = new THREE.CapsuleGeometry(0.022, 0.12, 2, 6).translate(0, 0.98, 0);
    const reeds: THREE.Matrix4[] = [];
    attempts = 0;
    while (reeds.length < 420 && attempts++ < 12000) {
      const x = LAKE_CENTRE.x - 24 + rand() * 48, z = LAKE_CENTRE.y - 26 + rand() * 52;
      const nearShore = inLake(x, z, 3.5) && !inLake(x, z, 0.3);
      const scattered = !inLake(x, z, 1) && rand() < 0.07;
      if ((!nearShore && !scattered) || onBoardwalk(x, z, 0.45)) continue;
      const height = 0.8 + rand() * 0.9;
      reeds.push(new THREE.Matrix4().compose(
        new THREE.Vector3(x, -0.1, z),
        new THREE.Quaternion().setFromEuler(new THREE.Euler((rand() - 0.5) * 0.25, 0, (rand() - 0.5) * 0.25)),
        new THREE.Vector3(1, height, 1),
      ));
    }
    const reedMesh = new THREE.InstancedMesh(reed, new THREE.MeshStandardMaterial({ color: 0x7c8f3d, roughness: 1 }), reeds.length);
    const headMesh = new THREE.InstancedMesh(head, new THREE.MeshStandardMaterial({ color: 0x4a3221, roughness: 1 }), Math.ceil(reeds.length / 3));
    reeds.forEach((matrix, i) => {
      reedMesh.setMatrixAt(i, matrix);
      if (i % 3 === 0) headMesh.setMatrixAt(i / 3, matrix);
    });
    this.scene.add(reedMesh, headMesh);
  }

  private buildBoardwalk(): void {
    const rand = random(99);
    const plank = new THREE.BoxGeometry(1, 1, 1);
    const boards: THREE.Matrix4[] = [];
    const tints: THREE.Color[] = [];
    const woods = [0xd2b183, 0xc8a476, 0xbf9a6c, 0xd8ba8e, 0xb79469];
    const addBoard = (center: THREE.Vector3, size: THREE.Vector3, yaw: number) => {
      boards.push(new THREE.Matrix4().compose(center, new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw), size));
      tints.push(new THREE.Color(woods[Math.floor(rand() * woods.length)]));
    };
    // Deck and walk are built the same way, so their edges read the same thickness: 36 mm boards
    // on 140 mm joists set flush with the outside edge.
    const board = 0.036, joist = 0.14;
    // Deck around the post: boards run east-west, on a joist frame round its edge.
    for (let i = -7; i <= 7; i++) {
      addBoard(new THREE.Vector3(0, DECK_TOP - board / 2, i * 0.155), new THREE.Vector3(DECK_HALF * 2, board, 0.14), 0);
    }
    const rimY = DECK_TOP - board - joist / 2;
    for (const edge of [-1, 1]) {
      addBoard(new THREE.Vector3(0, rimY, edge * (DECK_HALF - 0.025)), new THREE.Vector3(DECK_HALF * 2, joist, 0.05), 0);
      addBoard(new THREE.Vector3(edge * (DECK_HALF - 0.025), rimY, 0), new THREE.Vector3(0.05, joist, DECK_HALF * 2), 0);
    }
    // The walk: boards laid across it.
    const yaw = Math.atan2(PATH_DIRECTION.x, PATH_DIRECTION.y);
    // Level with the deck but a few millimetres lower, so where the two overlap at the corner the
    // deck covers it.
    const walkTop = DECK_TOP - 0.004;
    for (let along = WALK_START; along < WALK_LENGTH; along += 0.155) {
      const c = new THREE.Vector3(PATH_DIRECTION.x * along, walkTop - board / 2, PATH_DIRECTION.y * along);
      addBoard(c, new THREE.Vector3(WALK_HALF_WIDTH * 2, board, 0.14), yaw);
    }
    // Joists under the walk's edges and posts under the deck.
    for (const side of [-1, 1].map((edge) => edge * (WALK_HALF_WIDTH - 0.025))) {
      const offset = new THREE.Vector3(-PATH_DIRECTION.y * side, 0, PATH_DIRECTION.x * side);
      const middle = (WALK_START + WALK_LENGTH) / 2;
      const mid = new THREE.Vector3(PATH_DIRECTION.x * middle, walkTop - board - joist / 2, PATH_DIRECTION.y * middle).add(offset);
      addBoard(mid, new THREE.Vector3(0.05, joist, WALK_LENGTH - WALK_START), yaw);
    }
    for (const x of [-1.05, 1.05]) for (const z of [-1.05, 1.05]) {
      addBoard(new THREE.Vector3(x, DECK_TOP / 2 - 0.05, z), new THREE.Vector3(0.09, DECK_TOP + 0.1, 0.09), 0);
    }
    const mesh = new THREE.InstancedMesh(plank, new THREE.MeshStandardMaterial({ roughness: 0.85 }), boards.length);
    boards.forEach((matrix, i) => {
      mesh.setMatrixAt(i, matrix);
      mesh.setColorAt(i, tints[i]);
    });
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    this.scene.add(mesh);
  }

  private buildTracker() {
    const steel = new THREE.MeshStandardMaterial({ color: 0x16181b, metalness: 0.55, roughness: 0.5 });
    const aluminium = new THREE.MeshStandardMaterial({ color: 0xbfc4c9, metalness: 0.85, roughness: 0.32 });
    const glass = new THREE.MeshPhysicalMaterial({
      map: panelTexture(), metalness: 0.1, roughness: 0.5, clearcoat: 0.55, clearcoatRoughness: 0.12, envMapIntensity: 0.5,
    });
    const backsheet = new THREE.MeshStandardMaterial({ color: 0xd7dbd2, roughness: 0.8 });
    const enclosure = new THREE.MeshStandardMaterial({ color: 0xcfd2cc, roughness: 0.55 });
    const shadowed = <T extends THREE.Object3D>(o: T) => {
      o.traverse((c) => { c.castShadow = true; c.receiveShadow = true; });
      return o;
    };
    const box = (w: number, h: number, d: number, material: THREE.Material) =>
      shadowed(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material));

    const tracker = new THREE.Group();
    const plate = box(0.42, 0.025, 0.42, steel);
    plate.position.y = DECK_TOP + 0.012;
    const post = box(0.15, PIVOT_HEIGHT - DECK_TOP - 0.06, 0.15, steel);
    post.position.y = (PIVOT_HEIGHT + DECK_TOP - 0.06) / 2;
    const head = box(0.22, 0.14, 0.3, steel);
    head.position.y = PIVOT_HEIGHT - 0.06;
    tracker.add(plate, post, head);
    for (const [dx, dz] of [[0.09, 0], [-0.09, 0], [0, 0.09], [0, -0.09]]) {
      const gusset = box(dx ? 0.04 : 0.012, 0.16, dz ? 0.04 : 0.012, steel);
      gusset.position.set(dx, DECK_TOP + 0.09, dz);
      tracker.add(gusset);
    }

    // The control box hangs on the north face of the mast, level with the foot of the actuator,
    // with its door to the boardwalk and the junction box below it. The status light sits low on
    // the door, where it still shows under the array when it parks for the night.
    const cabinet = box(0.32, 0.42, 0.16, enclosure);
    cabinet.position.set(0, 1.32, -0.155);
    const junction = box(0.16, 0.2, 0.1, enclosure);
    junction.position.set(-0.02, 0.85, -0.125);
    const led = new THREE.Mesh(
      new THREE.SphereGeometry(0.018, 12, 8),
      new THREE.MeshStandardMaterial({ color: 0x0ca30c, emissive: 0x0ca30c, emissiveIntensity: 2 }),
    );
    led.position.set(-0.09, 1.2, -0.24);
    tracker.add(cabinet, junction, led);

    const cable = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.06, 1.53, -0.15), new THREE.Vector3(-0.1, 2.05, -0.13), new THREE.Vector3(-0.05, PIVOT_HEIGHT - 0.12, -0.09),
      ]), 16, 0.008, 5),
      new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.7 }),
    );
    const drop = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.02, 0.75, -0.13), new THREE.Vector3(-0.15, 0.5, -0.2), new THREE.Vector3(-0.6, DECK_TOP + 0.02, -0.4),
      ]), 16, 0.01, 5),
      cable.material,
    );
    tracker.add(cable, drop);

    // The array turns about a steel torque tube that runs north-south. Two cross-arms on the tube
    // carry steel purlins under the seams between the module columns, and aluminium rails across
    // the purlins clamp the modules at their ends.
    this.array.position.y = PIVOT_HEIGHT;
    const tube = box(0.11, 0.11, 3.2, steel);
    tube.position.y = -0.02;
    this.array.add(tube);
    for (const z of [-1.2, 1.2]) {
      const arm = box(1.5, 0.07, 0.07, steel);
      arm.position.set(0, 0.07, z);
      this.array.add(arm);
    }
    for (const side of [-1, 1]) {
      const purlin = box(0.06, 0.06, 2 * ARRAY_HALF_LENGTH - 0.4, steel);
      purlin.position.set((side * (MODULE_WIDTH + MODULE_GAP)) / 2, 0.135, 0);
      this.array.add(purlin);
    }
    const bracket = box(0.75, 0.06, 0.06, steel);
    bracket.position.set(0.38, -0.08, 0);
    this.array.add(bracket);
    const seam = (MODULE_LENGTH + MODULE_GAP) / 2;
    for (const z of [-ARRAY_HALF_LENGTH + 0.3, -seam, seam, ARRAY_HALF_LENGTH - 0.3]) {
      const rail = box(2 * ARRAY_HALF_WIDTH + 0.16, 0.045, 0.04, aluminium);
      rail.position.set(0, 0.1875, z);
      this.array.add(rail);
    }
    const module = new THREE.BoxGeometry(MODULE_WIDTH, 0.035, MODULE_LENGTH);
    const faces = [aluminium, aluminium, glass, backsheet, aluminium, aluminium];
    for (const column of [-1, 0, 1]) for (const row of [-1, 0, 1]) {
      const panel = shadowed(new THREE.Mesh(module, faces));
      panel.position.set(column * (MODULE_WIDTH + MODULE_GAP), 0.2275, row * (MODULE_LENGTH + MODULE_GAP));
      this.array.add(panel);
    }
    tracker.add(this.array);

    const barrel = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.82, 12), aluminium));
    const rod = shadowed(new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.018, 1, 10),
      new THREE.MeshStandardMaterial({ color: 0xd9dde1, metalness: 0.9, roughness: 0.2 }),
    ));
    tracker.add(barrel, rod);
    this.scene.add(tracker);
    return { barrel, rod, led, glass };
  }

  private buildAnemometer(): void {
    const wood = new THREE.MeshStandardMaterial({ color: 0xcfb084, roughness: 0.9 });
    const black = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.45, metalness: 0.2 });
    const group = new THREE.Group();
    // Beside the boardwalk near the deck, on the right as you walk in (as in the video), and
    // outside the array's sweep at full tilt either way.
    const right = new THREE.Vector2(PATH_DIRECTION.y, -PATH_DIRECTION.x).multiplyScalar(0.75);
    const spot = PATH_DIRECTION.clone().multiplyScalar(3).add(right);
    group.position.set(spot.x, 0, spot.y);

    const post = new THREE.Mesh(new THREE.BoxGeometry(0.09, 1.55, 0.09), wood);
    post.position.y = 0.775;
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.16, 12), black);
    body.position.y = 1.63;
    group.add(post, body);

    this.rotor.position.y = 1.74;
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.04, 10), black);
    this.rotor.add(hub);
    const cupGeometry = new THREE.SphereGeometry(0.034, 12, 8, 0, Math.PI);
    for (let i = 0; i < 3; i++) {
      const arm = new THREE.Group();
      arm.rotation.y = (i * Math.PI * 2) / 3;
      const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.15, 5), black);
      rod.rotation.z = Math.PI / 2;
      rod.position.x = 0.075;
      const cup = new THREE.Mesh(cupGeometry, black);
      cup.position.x = 0.15;
      cup.rotation.y = Math.PI / 2;
      arm.add(rod, cup);
      this.rotor.add(arm);
    }
    group.add(this.rotor);
    group.traverse((o) => { o.castShadow = true; });
    this.scene.add(group);
  }
}
