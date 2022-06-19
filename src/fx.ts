import { Emitter } from "./engine";

export function createSmokeEmitter(x: number, y: number) {
  return new Emitter(x, y, {
    frequency: 0.5,
    initialSpeed: 10,
    initialSpeedSpread: 0,
    initialAngle: 0,
    initialAngleSpread: 1,
    initialLife: 800,
    initialLifeSpread: 200,
    variants: [
      ["p_smoke_2", "p_smoke_1", "p_smoke_2", "p_smoke_3"],
      ["p_smoke_alt_1", "p_smoke_alt_2", "p_smoke_alt_3"],
    ],
  });
}

export function createCoinEmitter(x: number, y: number, w: number, h: number) {
  return new Emitter(x, y, {
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
      ["p_gold_coin_1"],
      ["p_gold_coin_1", "p_gold_coin_2"],
      ["p_gold_coin_2"],
      ["p_silver_coin_1", "p_silver_coin_2"],
    ],
  });
}

export function createSparkEmitter(x: number, y: number) {
  return new Emitter(x, y, {
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
}

export function createBloodEmitter(x: number, y: number) {
  return new Emitter(x, y, {
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
}

export function createHealthEmitter(x: number, y: number) {
  return new Emitter(x - 2.5, y, {
    w: 5,
    h: 2,
    frequency: 0.3,
    initialSpeed: 10,
    initialSpeedSpread: 5,
    initialAngle: 0,
    initialAngleSpread: 1,
    initialLife: 800,
    initialLifeSpread: 400,
    gravity: -10,
    variants: [
      ["p_heal", "p7"],
      ["p_heal", "p7", "p8"],
      ["p_heal_2", "p8"],
      ["p7"],
      ["p8"],
    ],
  });
}
