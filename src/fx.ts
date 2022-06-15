import { restore, save, spr, SpriteId } from "./engine";

export interface Particle {
  variant: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  ttl: number;
  floor: number;
}

let _pool: Particle[] = [];

export let emitters: Emitter[] = [];

function spreadRandom(n: number, spread: number): number {
  return n + (Math.random() * spread) - (spread / 2);
}

function createParticle(): Particle {
  if (_pool.length > 0) {
    return _pool.pop()!;
  } else {
    return {
      variant: 0,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      life: 0,
      ttl: 0,
      floor: -Infinity,
    };
  }
}

export class Emitter {
  x: number;
  y: number;
  w: number = 0;
  h: number = 0;
  active = false;
  particles = new Set<Particle>();

  private clock: number = 0;
  private _resolve = () => {};

  variants: SpriteId[][];
  frequency: number;
  initialSpeed: number;
  initialSpeedSpread: number;
  initialAngle: number;
  initialAngleSpread: number;
  initialLife: number;
  initialLifeSpread: number;
  floorLevel: number;
  floorLevelSpread: number;
  floorFriction: number;
  airFriction: number;
  bounciness: number;
  gravity: number;

  constructor(x: number, y: number, settings: Partial<Emitter> = {}) {
    this.x = x;
    this.y = y;
    this.variants = [];
    this.frequency = 1;
    this.initialSpeed = 1;
    this.initialSpeedSpread = 0;
    this.initialAngle = 0;
    this.initialAngleSpread = 0;
    this.initialLife = 1000;
    this.initialLifeSpread = 0;
    this.floorLevel = Infinity;
    this.floorLevelSpread = 0;
    this.floorFriction = 0;
    this.airFriction = 0;
    this.bounciness = 0;
    this.gravity = 0;

    Object.assign(this, settings);
    emitters.push(this);
  }

  remove() {
    emitters.splice(emitters.indexOf(this), 1);
  }

  start() {
    this.active = true;
  }

  stop() {
    this.active = false;
    return new Promise<void>(resolve => this._resolve = resolve);
  }

  // Override to add emitter specific behaviours
  update() {}

  _update(dt: number) {
    this.update();

    let step = dt / 1000;

    if (this.active) {
      this.clock += this.frequency;

      while (this.clock >= 1) {
        this.clock -= 1;
        this.emit();
      }
    }

    for (let p of this.particles) {
      p.ttl -= dt;

      if (p.ttl <= 0) {
        this.particles.delete(p);
        _pool.push(p);
        continue;
      }

      p.x += p.vx * step;
      p.y += p.vy * step;
      p.vy += this.gravity * step;

      if (p.y >= p.floor && p.vy > 0) {
        p.y = p.floor;
        p.vx *= 1 - this.floorFriction;
        p.vy *= -this.bounciness;
      }
    }

    if (this.particles.size === 0) {
      this._resolve();
    }
  }

  emit() {
    let angle = spreadRandom(this.initialAngle, this.initialAngleSpread);
    let speed = spreadRandom(this.initialSpeed, this.initialSpeedSpread);
    angle -= Math.PI / 2;

    let p = createParticle();
    p.life = p.ttl = spreadRandom(this.initialLife, this.initialLifeSpread);
    p.x = this.x + Math.random() * this.w;
    p.y = this.y + Math.random() * this.h;
    p.vx = speed * Math.cos(angle);
    p.vy = speed * Math.sin(angle);
    p.variant = Math.floor(Math.random() * this.variants.length);
    p.floor = p.y - spreadRandom(this.floorLevel, this.floorLevelSpread);
    this.particles.add(p);
  }

  burst(amount: number) {
    for (let i = 0; i < amount; i++) {
      this.emit();
    }
  }

  render() {
    save();
    for (let p of this.particles) {
      let progress = (p.life - p.ttl) / p.life;
      let sprites = this.variants[p.variant];
      let step = Math.floor(progress * sprites.length);
      let sprite = sprites[step];
      spr(sprite, p.x, p.y);
    }
    restore();
  }
}

let sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function smoke(x: number, y: number) {
  let e = new Emitter(x, y, {
    frequency: 0.3,
    initialSpeed: 10,
    initialSpeedSpread: 0,
    initialAngle: 0,
    initialAngleSpread: 1,
    initialLife: 800,
    initialLifeSpread: 200,
    variants: [
      ["p_smoke_1", "p_smoke_2", "p_smoke_3"],
      ["p_smoke_alt_1", "p_smoke_alt_2", "p_smoke_alt_3"],
    ],
  });

  e.start();
  await sleep(1000);
  await e.stop();
  e.remove();
}

export async function coinBurst(x: number, y: number, w: number, h: number, coins: number) {
  let e = new Emitter(x, y, {
    w,
    h,
    initialSpeed: 30,
    initialSpeedSpread: 5,
    gravity: 60,
    initialAngle: 0,
    initialAngleSpread: 0.8,
    initialLife: 2000,
    initialLifeSpread: 200,
    floorLevel: 0,
    floorLevelSpread: 10,
    floorFriction: 0.2,
    bounciness: 0.5,
    variants: [
      ["particle_coin_1"],
      ["particle_coin_2"],
      ["p2"],
    ],
  });

  e.burst(coins);
  await sleep(2000);
  e.remove();
}

export async function sparks(x: number, y: number) {
  let e = new Emitter(x, y, {
    initialSpeed: 20,
    initialSpeedSpread: 2,
    gravity: 10,
    initialAngle: 0,
    initialAngleSpread: 4.8,
    initialLife: 400,
    initialLifeSpread: 400,
    floorFriction: 0.25,
    bounciness: 0.75,
    variants: [
      ["p1", "p2", "p3"],
      ["p2", "p3"],
    ],
  });

  e.burst(10);
  await sleep(300);
  e.burst(5);
  await sleep(5000);
  e.remove();
}

export async function bloodSplatter(x: number, y: number) {
  let e = new Emitter(x, y, {
    initialSpeed: 40,
    initialSpeedSpread: 40,
    initialAngle: 0,
    initialAngleSpread: 3,
    initialLife: 400,
    initialLifeSpread: 400,
    gravity: 100,
    floorLevel: 5,
    floorLevelSpread: 10,
    floorFriction: 1,
    airFriction: 0.05,
    bounciness: 0.3,
    variants: [
      ["p_blood_1", "p_blood_2"],
      ["p_blood_2", "p_blood_3"],
      ["p_blood_3"],
      ["p_blood_1", "p_blood_alt_2"],
      ["p_blood_2", "p_blood_alt_3"],
    ],
  });

  e.burst(40);
  await sleep(5000);
  e.remove();
}
