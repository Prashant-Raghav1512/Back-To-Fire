import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

// A from-scratch 3D IK rig + exercise-pose library rendered with three.js.
// Framework-agnostic on purpose — createExerciseVisualizer() takes a plain
// <canvas> and container element and returns an imperative handle; the React
// wrapper (src/components/ExerciseDemo.tsx) owns all UI state and just calls
// into this handle. Ported from a standalone prototype (see PR/commit that
// introduced this file for the original single-file version) — ids were
// kept identical to this app's src/data/*.json exercise ids so the two stay
// in sync without a translation table.

/* =========================================================================
   RIG DIMENSIONS (all lengths verified against a standalone FK/IK solver
   before being wired into the renderer — see the two-bone IK note below).
   ========================================================================= */
const L = {
  hipW: 0.17,
  shW: 0.27,
  torsoLen: 0.52,
  headR: 0.13,
  upArm: 0.27,
  foArm: 0.25,
  thigh: 0.4,
  shin: 0.38,
  footLen: 0.22,
};
const STAND_H = L.thigh + L.shin + 0.06;
const lerp = THREE.MathUtils.lerp;
const clamp = THREE.MathUtils.clamp;

/* =========================================================================
   TWO-BONE IK (exact closed-form solver for a pure hinge chain: bone1
   pivots at the joint, bone2 pivots at the elbow/knee, both rotate about a
   single local X axis. Given any reachable target the reconstructed
   end-effector matches the target to float precision.)
   ========================================================================= */
function rxY(dy: number, dz: number, t: number) {
  return dy * Math.cos(t) - dz * Math.sin(t);
}
function rxZ(dy: number, dz: number, t: number) {
  return dy * Math.sin(t) + dz * Math.cos(t);
}

function ik2(L1: number, L2: number, ty: number, tz: number, bend = 1): [number, number] {
  let r = Math.hypot(ty, tz);
  const rmin = Math.abs(L1 - L2) + 1e-4;
  const rmax = L1 + L2 - 1e-4;
  r = clamp(r, rmin, rmax);
  const psi = Math.atan2(-tz, -ty);
  const cosA = clamp((L1 * L1 + r * r - L2 * L2) / (2 * L1 * r), -1, 1);
  const A = Math.acos(cosA);
  const cosK = clamp((L1 * L1 + L2 * L2 - r * r) / (2 * L1 * L2), -1, 1);
  const K = Math.acos(cosK);
  const theta1 = psi + bend * A;
  const theta2 = -bend * (Math.PI - K);
  return [theta1, theta2];
}

interface Target {
  y: number;
  z: number;
}

// Solve a leg reaching a fixed world-space foot target from the hip joint.
function legIK(target: Target, rootY: number, rootZ: number, rotX: number, bend = 1) {
  const jY = rootY + rxY(-0.06, 0, rotX);
  const jZ = rootZ + rxZ(-0.06, 0, rotX);
  const dy = target.y - jY;
  const dz = target.z - jZ;
  const ly = rxY(dy, dz, -rotX);
  const lz = rxZ(dy, dz, -rotX);
  const [t1, t2] = ik2(L.thigh, L.shin, ly, lz, bend);
  return { x: t1, kneeX: t2 };
}
// Solve an arm reaching a fixed world-space hand target from the shoulder
// joint, accounting for any extra torso lean (torsoX) ahead of the shoulder.
function armIK(target: Target, rootY: number, rootZ: number, rotX: number, torsoX: number, bend = 1) {
  const effRot = rotX + torsoX;
  const jY = rootY + rxY(L.torsoLen - 0.04, 0, effRot);
  const jZ = rootZ + rxZ(L.torsoLen - 0.04, 0, effRot);
  const dy = target.y - jY;
  const dz = target.z - jZ;
  const ly = rxY(dy, dz, -effRot);
  const lz = rxZ(dy, dz, -effRot);
  const [t1, t2] = ik2(L.upArm, L.foArm, ly, lz, bend);
  return { x: t1, elX: t2 };
}

/* Fixed world-space contact points (ground / bar), reused across exercises */
const ANCHOR = {
  standFoot: { y: 0.03, z: 0.05 },
  proneHand: { y: 0.05, z: -0.44 },
  proneFoot: { y: 0.05, z: 0.7 },
  pikeHand: { y: 0.05, z: -0.42 },
  pikeFoot: { y: 0.05, z: 0.62 },
  barHand: { y: 2.15, z: 0.03 },
  dipHand: { y: 0.94, z: 0.0 },
  lowbarHand: { y: 0.95, z: 0.18 },
  bridgeFoot: { y: 0.05, z: -0.34 },
};
const HANG_BASE_Y = STAND_H + 0.3;

/* =========================================================================
   POSE TYPES
   ========================================================================= */
interface JointAngle {
  x: number;
  z?: number;
}
interface Pose {
  torso: JointAngle;
  head: JointAngle;
  lShoulder: JointAngle;
  lElbow: JointAngle;
  rShoulder: JointAngle;
  rElbow: JointAngle;
  lHip: JointAngle;
  lKnee: JointAngle;
  rHip: JointAngle;
  rKnee: JointAngle;
  rootY: number;
  rootZ: number;
}

function basePose(): Pose {
  return {
    torso: { x: 0, z: 0 },
    head: { x: 0 },
    lShoulder: { x: 0, z: 0 },
    lElbow: { x: 0.05 },
    rShoulder: { x: 0, z: 0 },
    rElbow: { x: 0.05 },
    lHip: { x: 0, z: 0 },
    lKnee: { x: 0 },
    rHip: { x: 0, z: 0 },
    rKnee: { x: 0 },
    rootY: 0,
    rootZ: 0,
  };
}
function S(phase: number) {
  return Math.sin(phase * Math.PI);
}

function applyLegsSym(p: Pose, target: Target, rootY: number, rootZ: number, rotX: number, bend = 1) {
  const r = legIK(target, rootY, rootZ, rotX, bend);
  p.lHip.x = r.x;
  p.lKnee.x = r.kneeX;
  p.rHip.x = r.x;
  p.rKnee.x = r.kneeX;
}
function applyArmsSym(
  p: Pose,
  target: Target,
  rootY: number,
  rootZ: number,
  rotX: number,
  torsoX: number,
  bend = 1
) {
  const r = armIK(target, rootY, rootZ, rotX, torsoX, bend);
  p.lShoulder.x = r.x;
  p.lElbow.x = r.elX;
  p.rShoulder.x = r.x;
  p.rElbow.x = r.elX;
}

type PropName = 'highbar' | 'lowbar' | 'dipbars' | 'bench' | 'wall';

interface CustomResult {
  rotX: number;
  y: number;
  z: number;
  pose: Pose;
}

export interface ExerciseDef {
  id: string;
  label: string;
  repDuration: number;
  prop: PropName | null;
  muscles: string[];
  description: string;
  isHold?: boolean;
  custom?: boolean;
  orient: (phase: number) => number;
  poseFn?: (phase: number) => Pose;
  customFn?: (phase: number) => CustomResult;
}

/* =========================================================================
   EXERCISE LIBRARY — ids match src/data/*.json exercise ids exactly.
   ========================================================================= */
const EXERCISES: Record<string, ExerciseDef> = {
  'push-ups': {
    id: 'push-ups',
    label: 'Push-ups',
    repDuration: 1.8,
    prop: null,
    muscles: ['chest', 'arms', 'core'],
    description: 'Lower your chest to the floor and press back up, keeping your body in a straight line.',
    orient: () => -Math.PI / 2,
    poseFn(phase) {
      const s = S(phase);
      const p = basePose();
      const rotX = -Math.PI / 2;
      const rootY = 0.46 - 0.14 * s;
      const rootZ = 0;
      applyArmsSym(p, ANCHOR.proneHand, rootY, rootZ, rotX, 0, 1);
      applyLegsSym(p, ANCHOR.proneFoot, rootY, rootZ, rotX, 1);
      p.head.x = -0.1 * s;
      p.rootY = rootY;
      p.rootZ = rootZ;
      return p;
    },
  },

  'pull-ups': {
    id: 'pull-ups',
    label: 'Pull-ups',
    repDuration: 1.6,
    prop: 'highbar',
    muscles: ['back', 'arms'],
    description: 'Hang from the bar and pull your chin above it using your back and arms.',
    orient: () => 0,
    poseFn(phase) {
      const s = S(phase);
      const p = basePose();
      const rootY = HANG_BASE_Y + 0.28 * s;
      const rootZ = 0;
      applyArmsSym(p, ANCHOR.barHand, rootY, rootZ, 0, 0, 1);
      p.head.x = -0.15 * s;
      p.lHip.x = 0.1 + 0.15 * s;
      p.rHip.x = p.lHip.x;
      p.lKnee.x = 0.4 + 0.25 * s;
      p.rKnee.x = p.lKnee.x;
      p.rootY = rootY;
      p.rootZ = rootZ;
      return p;
    },
  },

  squats: {
    id: 'squats',
    label: 'Squats',
    repDuration: 2.0,
    prop: null,
    muscles: ['legs', 'glutes'],
    description: 'Bend your hips and knees to lower down, then drive back up to standing.',
    orient: () => 0,
    poseFn(phase) {
      const s = S(phase);
      const p = basePose();
      const rootY = STAND_H - 0.36 * s;
      const rootZ = 0.16 * s;
      applyLegsSym(p, ANCHOR.standFoot, rootY, rootZ, 0, 1);
      p.torso.x = -0.4 * s;
      p.lShoulder.x = 0.9 * s;
      p.rShoulder.x = 0.9 * s;
      p.lElbow.x = -0.3;
      p.rElbow.x = -0.3;
      p.rootY = rootY;
      p.rootZ = rootZ;
      return p;
    },
  },

  lunges: {
    id: 'lunges',
    label: 'Lunges',
    repDuration: 2.2,
    prop: null,
    muscles: ['legs', 'glutes'],
    description: 'Step forward and lower your back knee toward the floor, alternating legs.',
    orient: () => 0,
    poseFn(phase) {
      const p = basePose();
      const half = phase < 0.5;
      const sub = half ? phase * 2 : (phase - 0.5) * 2;
      const s = S(sub);
      const rootY = STAND_H - 0.3 * s;
      const rootZ = 0;
      const front = { y: 0.03, z: -0.3 };
      const back = { y: 0.03, z: 0.26 };
      const frontR = legIK(front, rootY, rootZ, 0, 1);
      const backR = legIK(back, rootY, rootZ, 0, -1);
      if (half) {
        p.lHip.x = frontR.x;
        p.lKnee.x = frontR.kneeX;
        p.rHip.x = backR.x;
        p.rKnee.x = backR.kneeX;
      } else {
        p.rHip.x = frontR.x;
        p.rKnee.x = frontR.kneeX;
        p.lHip.x = backR.x;
        p.lKnee.x = backR.kneeX;
      }
      p.torso.x = -0.15 * s;
      p.lShoulder.x = 0.2 * s;
      p.rShoulder.x = 0.2 * s;
      p.rootY = rootY;
      p.rootZ = rootZ;
      return p;
    },
  },

  plank: {
    id: 'plank',
    label: 'Plank',
    repDuration: 4.0,
    prop: null,
    isHold: true,
    muscles: ['core'],
    description: 'Hold a straight line from head to heels, bracing your core the whole time.',
    orient: () => -Math.PI / 2,
    poseFn(phase) {
      const t = phase * 2 * Math.PI;
      const p = basePose();
      const rotX = -Math.PI / 2;
      const rootY = 0.46 + 0.005 * Math.sin(t * 2);
      const rootZ = 0;
      applyArmsSym(p, ANCHOR.proneHand, rootY, rootZ, rotX, 0, 1);
      applyLegsSym(p, ANCHOR.proneFoot, rootY, rootZ, rotX, 1);
      p.torso.z = 0.015 * Math.sin(t);
      p.rootY = rootY;
      p.rootZ = rootZ;
      return p;
    },
  },

  dips: {
    id: 'dips',
    label: 'Dips',
    repDuration: 1.8,
    prop: 'dipbars',
    muscles: ['arms', 'chest'],
    description: 'Lower your body between two bars by bending your elbows, then press back up.',
    orient: () => 0,
    poseFn(phase) {
      const s = S(phase);
      const p = basePose();
      const rootY = 0.98 - 0.28 * s;
      const rootZ = 0.03;
      const torsoX = -0.15 * s;
      p.torso.x = torsoX;
      applyArmsSym(p, ANCHOR.dipHand, rootY, rootZ, 0, torsoX, 1);
      p.lHip.x = -0.35;
      p.rHip.x = -0.35;
      p.lKnee.x = 1.3;
      p.rKnee.x = 1.3;
      p.rootY = rootY;
      p.rootZ = rootZ;
      return p;
    },
  },

  'pike-push-ups': {
    id: 'pike-push-ups',
    label: 'Pike Push-ups',
    repDuration: 1.8,
    prop: null,
    muscles: ['shoulders', 'arms'],
    description: 'From a pike position, bend your elbows to lower your head toward the floor.',
    orient: () => -Math.PI / 2,
    poseFn(phase) {
      const s = S(phase);
      const p = basePose();
      const rotX = -Math.PI / 2;
      const rootY = 0.48 - 0.09 * s;
      const rootZ = 0;
      const torsoX = -0.55;
      p.torso.x = torsoX;
      applyArmsSym(p, ANCHOR.pikeHand, rootY, rootZ, rotX, torsoX, 1);
      applyLegsSym(p, ANCHOR.pikeFoot, rootY, rootZ, rotX, 1);
      p.rootY = rootY;
      p.rootZ = rootZ;
      return p;
    },
  },

  'diamond-push-ups': {
    id: 'diamond-push-ups',
    label: 'Diamond Push-ups',
    repDuration: 1.8,
    prop: null,
    muscles: ['arms', 'chest'],
    description: 'Push-ups with your hands close together to target the triceps.',
    orient: () => -Math.PI / 2,
    poseFn(phase) {
      const s = S(phase);
      const p = basePose();
      const rotX = -Math.PI / 2;
      const rootY = 0.46 - 0.14 * s;
      const rootZ = 0;
      applyArmsSym(p, ANCHOR.proneHand, rootY, rootZ, rotX, 0, 1);
      applyLegsSym(p, ANCHOR.proneFoot, rootY, rootZ, rotX, 1);
      p.head.x = -0.1 * s;
      p.rootY = rootY;
      p.rootZ = rootZ;
      return p;
    },
  },

  burpees: {
    id: 'burpees',
    label: 'Burpees',
    repDuration: 3.2,
    prop: null,
    muscles: ['legs', 'chest', 'core'],
    description: 'Squat, kick back to a plank, add a push-up, then jump up explosively.',
    custom: true,
    orient(phase) {
      if (phase < 0.15) return 0;
      if (phase < 0.75) return -Math.PI / 2;
      return 0;
    },
    customFn(phase) {
      const p = basePose();
      let rotX: number;
      let rootY: number;
      const rootZ = 0;
      if (phase < 0.15) {
        const s = phase / 0.15;
        rotX = 0;
        rootY = lerp(STAND_H, 0.55, s);
        applyLegsSym(p, ANCHOR.standFoot, rootY, rootZ, 0, 1);
        p.torso.x = lerp(0, -0.5, s);
        p.lShoulder.x = lerp(0, 0.6, s);
        p.rShoulder.x = p.lShoulder.x;
      } else if (phase < 0.35) {
        const s = (phase - 0.15) / 0.2;
        rotX = lerp(0, -Math.PI / 2, s);
        rootY = lerp(0.55, 0.46, s);
        p.torso.x = lerp(-0.5, 0, s);
        p.lHip.x = lerp(1.1, 0.0, s);
        p.rHip.x = p.lHip.x;
        p.lKnee.x = lerp(1.7, 0.0, s);
        p.rKnee.x = p.lKnee.x;
        p.lShoulder.x = lerp(0.6, 1.3, s);
        p.rShoulder.x = p.lShoulder.x;
        p.lElbow.x = -0.2;
        p.rElbow.x = -0.2;
      } else if (phase < 0.55) {
        const s = S((phase - 0.35) / 0.2);
        rotX = -Math.PI / 2;
        rootY = 0.46 - 0.13 * s;
        applyArmsSym(p, ANCHOR.proneHand, rootY, rootZ, rotX, 0, 1);
        applyLegsSym(p, ANCHOR.proneFoot, rootY, rootZ, rotX, 1);
      } else if (phase < 0.75) {
        const s = (phase - 0.55) / 0.2;
        rotX = lerp(-Math.PI / 2, 0, s);
        rootY = lerp(0.46, 0.55, s);
        p.lShoulder.x = lerp(1.3, 0.6, s);
        p.rShoulder.x = p.lShoulder.x;
        p.lHip.x = lerp(0.0, 1.1, s);
        p.rHip.x = p.lHip.x;
        p.lKnee.x = lerp(0.0, 1.7, s);
        p.rKnee.x = p.lKnee.x;
        p.torso.x = lerp(0, -0.5, s);
      } else if (phase < 0.9) {
        const s = (phase - 0.75) / 0.15;
        rotX = 0;
        rootY = lerp(0.55, STAND_H + 0.18, Math.sin((s * Math.PI) / 2));
        p.lHip.x = lerp(1.1, 0, s);
        p.rHip.x = p.lHip.x;
        p.lKnee.x = lerp(1.7, 0, s);
        p.rKnee.x = p.lKnee.x;
        p.torso.x = lerp(-0.5, 0, s);
        p.lShoulder.x = lerp(0.6, -2.6, s);
        p.rShoulder.x = p.lShoulder.x;
      } else {
        const s = (phase - 0.9) / 0.1;
        rotX = 0;
        rootY = lerp(STAND_H + 0.18, STAND_H, s);
        p.lShoulder.x = lerp(-2.6, 0, s);
        p.rShoulder.x = p.lShoulder.x;
      }
      return { rotX, y: rootY, z: rootZ, pose: p };
    },
  },

  'mountain-climbers': {
    id: 'mountain-climbers',
    label: 'Mountain Climbers',
    repDuration: 1.2,
    prop: null,
    muscles: ['core', 'legs'],
    description: 'From a plank, drive your knees toward your chest in a running motion.',
    orient: () => -Math.PI / 2,
    poseFn(phase) {
      const p = basePose();
      const rotX = -Math.PI / 2;
      const rootY = 0.46 - 0.02 * Math.sin(phase * 4 * Math.PI);
      const rootZ = 0;
      applyArmsSym(p, ANCHOR.proneHand, rootY, rootZ, rotX, 0, 1);
      const half = phase < 0.5;
      const sub = half ? phase * 2 : (phase - 0.5) * 2;
      const s = S(sub);
      const stillLeg = legIK(ANCHOR.proneFoot, rootY, rootZ, rotX, 1);
      if (half) {
        p.lHip.x = -1.5 * s;
        p.lKnee.x = 1.7 * s;
        p.rHip.x = stillLeg.x;
        p.rKnee.x = stillLeg.kneeX;
      } else {
        p.rHip.x = -1.5 * s;
        p.rKnee.x = 1.7 * s;
        p.lHip.x = stillLeg.x;
        p.lKnee.x = stillLeg.kneeX;
      }
      p.rootY = rootY;
      p.rootZ = rootZ;
      return p;
    },
  },

  'glute-bridges': {
    id: 'glute-bridges',
    label: 'Glute Bridges',
    repDuration: 2.0,
    prop: null,
    muscles: ['glutes', 'legs'],
    description: 'Lying on your back, lift your hips by squeezing your glutes.',
    orient: () => Math.PI / 2,
    poseFn(phase) {
      const s = S(phase);
      const p = basePose();
      const rotX = Math.PI / 2;
      const rootY = 0.16 + 0.2 * s;
      const rootZ = 0;
      applyLegsSym(p, ANCHOR.bridgeFoot, rootY, rootZ, rotX, -1);
      p.torso.x = -0.14 * s;
      p.lShoulder.x = 0.1;
      p.rShoulder.x = 0.1;
      p.lElbow.x = 0.1;
      p.rElbow.x = 0.1;
      p.rootY = rootY;
      p.rootZ = rootZ;
      return p;
    },
  },

  superman: {
    id: 'superman',
    label: 'Superman Hold',
    repDuration: 3.5,
    prop: null,
    isHold: true,
    muscles: ['back', 'core'],
    description: 'Lying face-down, lift your arms and legs off the floor and hold.',
    orient: () => -Math.PI / 2,
    poseFn(phase) {
      const t = phase * 2 * Math.PI;
      const p = basePose();
      p.torso.x = 0.35 + 0.05 * Math.sin(t);
      p.lHip.x = -0.4 - 0.05 * Math.sin(t);
      p.rHip.x = p.lHip.x;
      p.lShoulder.x = -2.6;
      p.lElbow.x = -0.1;
      p.rShoulder.x = -2.6;
      p.rElbow.x = -0.1;
      p.head.x = 0.15;
      p.rootY = 0.5;
      p.rootZ = 0;
      return p;
    },
  },

  'bulgarian-split-squats': {
    id: 'bulgarian-split-squats',
    label: 'Bulgarian Split Squats',
    repDuration: 2.0,
    prop: 'bench',
    muscles: ['legs', 'glutes'],
    description: 'With your rear foot elevated behind you, lower into a single-leg squat.',
    orient: () => 0,
    poseFn(phase) {
      const s = S(phase);
      const p = basePose();
      const rootY = STAND_H - 0.3 * s;
      const rootZ = -0.02;
      const front = { y: 0.03, z: -0.1 };
      const r = legIK(front, rootY, rootZ, 0, 1);
      p.rHip.x = r.x;
      p.rKnee.x = r.kneeX;
      p.lHip.x = -1.0;
      p.lKnee.x = 1.5;
      p.torso.x = -0.2 * s;
      p.lShoulder.x = 0.2 * s;
      p.rShoulder.x = 0.2 * s;
      p.rootY = rootY;
      p.rootZ = rootZ;
      return p;
    },
  },

  'hanging-leg-raises': {
    id: 'hanging-leg-raises',
    label: 'Hanging Leg Raises',
    repDuration: 2.2,
    prop: 'highbar',
    muscles: ['core'],
    description: 'Hang from the bar and raise your legs to hip height, then lower with control.',
    orient: () => 0,
    poseFn(phase) {
      const s = S(phase);
      const p = basePose();
      const rootY = HANG_BASE_Y;
      const rootZ = 0;
      applyArmsSym(p, ANCHOR.barHand, rootY, rootZ, 0, 0, 1);
      p.lHip.x = 1.6 * s;
      p.rHip.x = 1.6 * s;
      p.lKnee.x = 0.3;
      p.rKnee.x = 0.3;
      p.torso.x = 0.12 * s;
      p.rootY = rootY;
      p.rootZ = rootZ;
      return p;
    },
  },

  'handstand-push-ups': {
    id: 'handstand-push-ups',
    label: 'Handstand Push-ups',
    repDuration: 2.0,
    prop: 'wall',
    muscles: ['shoulders', 'arms'],
    description: 'In a handstand against the wall, bend your elbows to lower your head down.',
    orient: () => Math.PI,
    poseFn(phase) {
      const s = S(phase);
      const p = basePose();
      p.lShoulder.x = 1.3;
      p.lElbow.x = -0.15 - 1.5 * s;
      p.rShoulder.x = 1.3;
      p.rElbow.x = -0.15 - 1.5 * s;
      p.lHip.x = 0.05;
      p.rHip.x = 0.05;
      p.lKnee.x = 0.05;
      p.rKnee.x = 0.05;
      p.rootY = 1.05 - 0.12 * s;
      p.rootZ = 0;
      return p;
    },
  },

  'muscle-ups': {
    id: 'muscle-ups',
    label: 'Muscle-ups',
    repDuration: 2.6,
    prop: 'highbar',
    muscles: ['back', 'arms', 'chest'],
    description: 'Pull up explosively, transition over the bar, then press up into a dip.',
    custom: true,
    orient: () => 0,
    customFn(phase) {
      const p = basePose();
      const rotX = 0;
      const baseY = HANG_BASE_Y;
      let rootY: number;
      if (phase < 0.4) {
        const s = Math.sin((phase / 0.4) * (Math.PI / 2));
        rootY = baseY + 0.3 * s;
        applyArmsSym(p, ANCHOR.barHand, rootY, 0, 0, 0, 1);
        p.lKnee.x = 0.3;
        p.rKnee.x = 0.3;
      } else if (phase < 0.6) {
        const s = (phase - 0.4) / 0.2;
        rootY = baseY + 0.3 + 0.05 * Math.sin(s * Math.PI);
        p.torso.x = lerp(0, -0.5, s);
        p.lShoulder.x = lerp(-2.9, 1.4, s);
        p.rShoulder.x = p.lShoulder.x;
        p.lElbow.x = lerp(-2.15, -1.8, s);
        p.rElbow.x = p.lElbow.x;
        p.lKnee.x = 0.3;
        p.rKnee.x = 0.3;
      } else if (phase < 0.85) {
        const s = S((phase - 0.6) / 0.25);
        rootY = baseY + 0.3 - 0.15 * s;
        p.torso.x = -0.5;
        p.lShoulder.x = 1.4;
        p.rShoulder.x = 1.4;
        p.lElbow.x = -1.8 + 1.6 * s;
        p.rElbow.x = -1.8 + 1.6 * s;
        p.lKnee.x = 0.3;
        p.rKnee.x = 0.3;
      } else {
        const s = (phase - 0.85) / 0.15;
        rootY = lerp(baseY + 0.3, baseY, s);
        p.torso.x = lerp(-0.5, 0, s);
        p.lShoulder.x = lerp(1.4, -2.9, s);
        p.rShoulder.x = p.lShoulder.x;
        p.lElbow.x = lerp(0.2, -0.05, s);
        p.rElbow.x = p.lElbow.x;
      }
      return { rotX, y: rootY, z: 0, pose: p };
    },
  },

  'pistol-squats': {
    id: 'pistol-squats',
    label: 'Pistol Squats',
    repDuration: 2.4,
    prop: null,
    muscles: ['legs', 'glutes', 'core'],
    description: 'Squat down on one leg while extending the other straight out in front.',
    orient: () => 0,
    poseFn(phase) {
      const s = S(phase);
      const p = basePose();
      const rootY = STAND_H - 0.32 * s;
      const rootZ = 0.1 * s;
      const stand = legIK(ANCHOR.standFoot, rootY, rootZ, 0, 1);
      p.lHip.x = stand.x;
      p.lKnee.x = stand.kneeX;
      p.rHip.x = 1.3 * s;
      p.rKnee.x = 0.15 * s;
      p.torso.x = -0.3 * s;
      p.lShoulder.x = 0.9 * s;
      p.rShoulder.x = 0.9 * s;
      p.lElbow.x = -0.2;
      p.rElbow.x = -0.2;
      p.rootY = rootY;
      p.rootZ = rootZ;
      return p;
    },
  },

  'inverted-rows': {
    id: 'inverted-rows',
    label: 'Inverted Rows',
    repDuration: 1.8,
    prop: 'lowbar',
    muscles: ['back', 'arms'],
    description: 'Hang under a low bar and pull your chest up toward it.',
    orient: () => Math.PI / 2,
    poseFn(phase) {
      const s = S(phase);
      const p = basePose();
      const rotX = Math.PI / 2;
      const rootY = 0.16 - 0.02 * s;
      const rootZ = -0.06 - 0.1 * s;
      applyArmsSym(p, ANCHOR.lowbarHand, rootY, rootZ, rotX, 0, -1);
      p.lHip.x = 0.02;
      p.rHip.x = 0.02;
      p.rootY = rootY;
      p.rootZ = rootZ;
      return p;
    },
  },
};

export const EXERCISE_ORDER = [
  'push-ups',
  'pull-ups',
  'squats',
  'lunges',
  'plank',
  'dips',
  'pike-push-ups',
  'diamond-push-ups',
  'burpees',
  'mountain-climbers',
  'glute-bridges',
  'superman',
  'bulgarian-split-squats',
  'hanging-leg-raises',
  'handstand-push-ups',
  'muscle-ups',
  'pistol-squats',
  'inverted-rows',
];

export const EXERCISE_LIST: ExerciseDef[] = EXERCISE_ORDER.map((id) => EXERCISES[id]);

/* =========================================================================
   POSE APPLICATION
   ========================================================================= */
function lerpPose(cur: Pose, tgt: Pose, d: number) {
  cur.torso.x = lerp(cur.torso.x, tgt.torso.x, d);
  cur.torso.z = lerp(cur.torso.z ?? 0, tgt.torso.z ?? 0, d);
  cur.head.x = lerp(cur.head.x, tgt.head.x, d);
  cur.lShoulder.x = lerp(cur.lShoulder.x, tgt.lShoulder.x, d);
  cur.lShoulder.z = lerp(cur.lShoulder.z ?? 0, tgt.lShoulder.z ?? 0, d);
  cur.rShoulder.x = lerp(cur.rShoulder.x, tgt.rShoulder.x, d);
  cur.rShoulder.z = lerp(cur.rShoulder.z ?? 0, tgt.rShoulder.z ?? 0, d);
  cur.lElbow.x = lerp(cur.lElbow.x, tgt.lElbow.x, d);
  cur.rElbow.x = lerp(cur.rElbow.x, tgt.rElbow.x, d);
  cur.lHip.x = lerp(cur.lHip.x, tgt.lHip.x, d);
  cur.lHip.z = lerp(cur.lHip.z ?? 0, tgt.lHip.z ?? 0, d);
  cur.rHip.x = lerp(cur.rHip.x, tgt.rHip.x, d);
  cur.rHip.z = lerp(cur.rHip.z ?? 0, tgt.rHip.z ?? 0, d);
  cur.lKnee.x = lerp(cur.lKnee.x, tgt.lKnee.x, d);
  cur.rKnee.x = lerp(cur.rKnee.x, tgt.rKnee.x, d);
}

export type CameraPreset = 'angle' | 'front' | 'side';

const CAM_PRESETS: Record<CameraPreset, { pos: [number, number, number]; target: [number, number, number] }> = {
  angle: { pos: [2.5, 1.75, 3.0], target: [0, 1.0, 0] },
  front: { pos: [0, 1.4, 3.6], target: [0, 1.0, 0] },
  side: { pos: [3.6, 1.4, 0], target: [0, 1.0, 0] },
};

export interface VisualizerState {
  exerciseId: string;
  reps: number;
  isHold: boolean;
}

export interface VisualizerHandle {
  selectExercise: (id: string) => void;
  setPlaying: (playing: boolean) => void;
  setSpeed: (speed: number) => void;
  setCamera: (preset: CameraPreset) => void;
  resize: (width: number, height: number) => void;
  subscribe: (cb: (state: VisualizerState) => void) => () => void;
  dispose: () => void;
}

export function createExerciseVisualizer(canvas: HTMLCanvasElement, width: number, height: number): VisualizerHandle {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b0e11);
  scene.fog = new THREE.Fog(0x0b0e11, 6, 15);

  const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 50);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(width, height, false);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  // Environment map (baked "room" light probe) — gives every PBR material on
  // the figure soft, realistic reflections instead of flat matte shading.
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 1.0, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 1.6;
  controls.maxDistance = 6.5;
  controls.maxPolarAngle = Math.PI * 0.49;

  function setCam(name: CameraPreset) {
    const c = CAM_PRESETS[name];
    camera.position.set(...c.pos);
    controls.target.set(...c.target);
  }
  setCam('angle');

  /* Lighting / ground */
  scene.add(new THREE.HemisphereLight(0x4a5a6a, 0x0a0d10, 0.55));

  const key = new THREE.DirectionalLight(0xffffff, 1.2);
  key.position.set(2.4, 4.2, 2.0);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -2;
  key.shadow.camera.right = 2;
  key.shadow.camera.top = 3;
  key.shadow.camera.bottom = -1.5;
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 10;
  key.shadow.bias = -0.0015;
  key.shadow.radius = 3;
  scene.add(key);

  const rim = new THREE.DirectionalLight(0x22c55e, 0.45);
  rim.position.set(-3, 2.2, -2.2);
  scene.add(rim);
  const fill = new THREE.DirectionalLight(0x8fb4d9, 0.25);
  fill.position.set(-1.5, 1.0, 2.6);
  scene.add(fill);

  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(6, 64),
    new THREE.MeshStandardMaterial({ color: 0x0e1217, roughness: 0.85, metalness: 0.15 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const grid = new THREE.GridHelper(6, 24, 0x22c55e, 0x1b222a);
  (grid.material as THREE.Material).transparent = true;
  (grid.material as THREE.Material).opacity = 0.14;
  grid.position.y = 0.002;
  scene.add(grid);

  function makeContactShadowTexture() {
    const size = 128;
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d')!;
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, 'rgba(0,0,0,0.55)');
    g.addColorStop(0.7, 'rgba(0,0,0,0.25)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(c);
  }
  const contactShadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.42, 32),
    new THREE.MeshBasicMaterial({ map: makeContactShadowTexture(), transparent: true, depthWrite: false })
  );
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.y = 0.004;
  scene.add(contactShadow);

  /* Character rig */
  const matTorso = new THREE.MeshPhysicalMaterial({ color: 0x2a323c, roughness: 0.5, metalness: 0.1, clearcoat: 0.15, clearcoatRoughness: 0.6 });
  const matHips = new THREE.MeshPhysicalMaterial({ color: 0x232b33, roughness: 0.5, metalness: 0.1, clearcoat: 0.15, clearcoatRoughness: 0.6 });
  const matUpperArm = new THREE.MeshStandardMaterial({ color: 0x5b6b7a, roughness: 0.45, metalness: 0.12 });
  const matForearm = new THREE.MeshStandardMaterial({ color: 0x4a5866, roughness: 0.45, metalness: 0.12 });
  const matThigh = new THREE.MeshStandardMaterial({ color: 0x5b6b7a, roughness: 0.45, metalness: 0.12 });
  const matShin = new THREE.MeshStandardMaterial({ color: 0x4a5866, roughness: 0.45, metalness: 0.12 });
  const matHead = new THREE.MeshPhysicalMaterial({ color: 0xe0b48c, roughness: 0.45, clearcoat: 0.25, clearcoatRoughness: 0.4 });
  const matShoe = new THREE.MeshStandardMaterial({ color: 0x14181d, roughness: 0.55, metalness: 0.2 });

  function addBone(parent: THREE.Object3D, length: number, radius: number, mat: THREE.Material, tags: string[], dir: number) {
    const h = Math.max(length - 2 * radius, 0.02);
    const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(radius, h, 6, 12), mat);
    mesh.position.set(0, (dir * length) / 2, 0);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.tags = tags;
    parent.add(mesh);
    const end = new THREE.Group();
    end.position.set(0, dir * length, 0);
    parent.add(end);
    return { mesh, end };
  }

  const character = new THREE.Group();
  scene.add(character);

  const hips = new THREE.Group();
  character.add(hips);
  const hipsMesh = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.16, 0.19), matHips);
  hipsMesh.userData.tags = ['core', 'glutes'];
  hipsMesh.castShadow = hipsMesh.receiveShadow = true;
  hips.add(hipsMesh);

  const torsoPivot = new THREE.Group();
  hips.add(torsoPivot);
  const torsoMesh = new THREE.Mesh(new THREE.BoxGeometry(0.3, L.torsoLen, 0.17), matTorso);
  torsoMesh.position.set(0, L.torsoLen / 2, 0);
  torsoMesh.castShadow = torsoMesh.receiveShadow = true;
  torsoMesh.userData.tags = ['chest', 'back', 'core'];
  torsoPivot.add(torsoMesh);
  const torsoEnd = new THREE.Group();
  torsoEnd.position.set(0, L.torsoLen, 0);
  torsoPivot.add(torsoEnd);

  const headJoint = new THREE.Group();
  torsoEnd.add(headJoint);
  const headMesh = new THREE.Mesh(new THREE.SphereGeometry(L.headR, 20, 16), matHead);
  headMesh.position.set(0, L.headR + 0.045, 0);
  headMesh.castShadow = true;
  headJoint.add(headMesh);

  function makeArm(sign: number) {
    const shoulder = new THREE.Group();
    shoulder.position.set(sign * L.shW, -0.04, 0);
    torsoEnd.add(shoulder);
    const upperArm = addBone(shoulder, L.upArm, 0.058, matUpperArm, ['arms', 'shoulders'], -1);
    const forearm = addBone(upperArm.end, L.foArm, 0.05, matForearm, ['arms'], -1);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.052, 12, 10), matHead);
    hand.position.set(0, -0.04, 0);
    hand.castShadow = true;
    forearm.end.add(hand);
    return { shoulder, elbow: upperArm.end, upperArmMesh: upperArm.mesh, forearmMesh: forearm.mesh };
  }
  const armL = makeArm(1);
  const armR = makeArm(-1);

  function makeLeg(sign: number) {
    const hipJ = new THREE.Group();
    hipJ.position.set(sign * L.hipW, -0.06, 0);
    hips.add(hipJ);
    const thigh = addBone(hipJ, L.thigh, 0.082, matThigh, ['legs', 'glutes'], -1);
    const shin = addBone(thigh.end, L.shin, 0.066, matShin, ['legs'], -1);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.095, 0.055, L.footLen), matShoe);
    foot.position.set(0, -0.03, L.footLen * 0.32);
    foot.castShadow = foot.receiveShadow = true;
    shin.end.add(foot);
    return { hipJ, kneeEnd: thigh.end, thighMesh: thigh.mesh, shinMesh: shin.mesh };
  }
  const legL = makeLeg(1);
  const legR = makeLeg(-1);

  const joints = {
    torso: torsoPivot,
    head: headJoint,
    lShoulder: armL.shoulder,
    lElbow: armL.elbow,
    rShoulder: armR.shoulder,
    rElbow: armR.elbow,
    lHip: legL.hipJ,
    lKnee: legL.kneeEnd,
    rHip: legR.hipJ,
    rKnee: legR.kneeEnd,
  };

  const taggedMeshes = [
    torsoMesh,
    hipsMesh,
    armL.upperArmMesh,
    armL.forearmMesh,
    armR.upperArmMesh,
    armR.forearmMesh,
    legL.thighMesh,
    legL.shinMesh,
    legR.thighMesh,
    legR.shinMesh,
  ];

  /* Props */
  const barMat = new THREE.MeshStandardMaterial({ color: 0x394450, roughness: 0.3, metalness: 0.7 });
  const postMat = new THREE.MeshStandardMaterial({ color: 0x20262d, roughness: 0.45, metalness: 0.5 });

  function makeBar(y: number, span = 0.9) {
    const g = new THREE.Group();
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, span, 16), barMat);
    bar.rotation.z = Math.PI / 2;
    bar.position.set(0, y, 0);
    bar.castShadow = true;
    g.add(bar);
    [-span / 2 - 0.06, span / 2 + 0.06].forEach((x) => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, y, 12), postMat);
      post.position.set(x, y / 2, 0);
      post.castShadow = post.receiveShadow = true;
      g.add(post);
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.04, 16), postMat);
      base.position.set(x, 0.02, 0);
      base.receiveShadow = true;
      g.add(base);
    });
    g.visible = false;
    scene.add(g);
    return g;
  }
  function makeDipBars() {
    const g = new THREE.Group();
    [-0.26, 0.26].forEach((x) => {
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.9, 14), barMat);
      bar.rotation.x = Math.PI / 2;
      bar.position.set(x, 0.94, 0);
      bar.castShadow = true;
      g.add(bar);
      [-0.4, 0.4].forEach((z) => {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.94, 12), postMat);
        post.position.set(x, 0.47, z);
        post.castShadow = post.receiveShadow = true;
        g.add(post);
      });
    });
    g.visible = false;
    scene.add(g);
    return g;
  }
  function makeBench() {
    const mat = new THREE.MeshStandardMaterial({ color: 0x2a323c, roughness: 0.55 });
    const g = new THREE.Group();
    const top = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.06, 0.85), mat);
    top.position.set(0, 0.24, 0.55);
    top.castShadow = top.receiveShadow = true;
    g.add(top);
    ([[-0.13, 0.28], [0.13, 0.28], [-0.13, 0.82], [0.13, 0.82]] as [number, number][]).forEach(([x, z]) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.24, 0.05), mat);
      leg.position.set(x, 0.11, z);
      g.add(leg);
    });
    g.visible = false;
    scene.add(g);
    return g;
  }
  function makeWall() {
    const mat = new THREE.MeshStandardMaterial({ color: 0x171c23, roughness: 0.85 });
    const wall = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.4, 0.08), mat);
    wall.position.set(0, 1.2, -0.55);
    wall.receiveShadow = true;
    wall.visible = false;
    scene.add(wall);
    return wall;
  }

  const props: Record<PropName, THREE.Object3D> = {
    highbar: makeBar(ANCHOR.barHand.y),
    lowbar: makeBar(ANCHOR.lowbarHand.y),
    dipbars: makeDipBars(),
    bench: makeBench(),
    wall: makeWall(),
  };
  function setProp(name: PropName | null) {
    Object.values(props).forEach((o) => (o.visible = false));
    if (name && props[name]) props[name].visible = true;
  }

  function applyPoseToRig(p: Pose) {
    joints.torso.rotation.set(p.torso.x, 0, p.torso.z ?? 0);
    joints.head.rotation.set(p.head.x, 0, 0);
    joints.lShoulder.rotation.set(p.lShoulder.x, 0, p.lShoulder.z ?? 0);
    joints.rShoulder.rotation.set(p.rShoulder.x, 0, p.rShoulder.z ?? 0);
    joints.lElbow.rotation.set(p.lElbow.x, 0, 0);
    joints.rElbow.rotation.set(p.rElbow.x, 0, 0);
    joints.lHip.rotation.set(p.lHip.x, 0, p.lHip.z ?? 0);
    joints.rHip.rotation.set(p.rHip.x, 0, p.rHip.z ?? 0);
    joints.lKnee.rotation.set(p.lKnee.x, 0, 0);
    joints.rKnee.rotation.set(p.rKnee.x, 0, 0);
  }

  const ACCENT_GLOW = new THREE.Color(0x22c55e);
  const BLACK = new THREE.Color(0x000000);
  function updateMuscleGlow(muscles: string[], phase: number) {
    const pulse = 0.35 + 0.65 * Math.pow(Math.abs(Math.sin(phase * Math.PI)), 1.4);
    taggedMeshes.forEach((m) => {
      const tags = m.userData.tags as string[];
      const active = tags.some((t) => muscles.includes(t));
      const target = active ? pulse : 0;
      const mat = m.material as THREE.MeshStandardMaterial;
      const cur = mat.emissiveIntensity || 0;
      mat.emissiveIntensity = lerp(cur, target, 0.15);
      mat.emissive.copy(active ? ACCENT_GLOW : BLACK);
    });
  }

  /* State */
  let currentKey = 'push-ups';
  let elapsed = 0;
  let prevPhase = 0;
  let reps = 0;
  let playing = true;
  let speed = 1;
  const curPose = basePose();
  const curOrient = { rotX: -Math.PI / 2, y: 0.46, z: 0 };
  let lastReportedReps = -1;

  const listeners = new Set<(state: VisualizerState) => void>();
  function notify(displayReps: number) {
    const state: VisualizerState = { exerciseId: currentKey, reps: displayReps, isHold: !!EXERCISES[currentKey].isHold };
    listeners.forEach((cb) => cb(state));
  }

  function selectExercise(id: string) {
    if (!EXERCISES[id]) return;
    currentKey = id;
    elapsed = 0;
    prevPhase = 0;
    reps = 0;
    lastReportedReps = -1;
    setProp(EXERCISES[id].prop);
    notify(0);
  }
  selectExercise(currentKey);

  const clock = new THREE.Clock();
  let rafId = 0;

  function frame() {
    rafId = requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), 0.05);
    const ex = EXERCISES[currentKey];

    if (playing) elapsed += dt * speed;
    const phase = (elapsed % ex.repDuration) / ex.repDuration;

    if (!ex.isHold && phase < prevPhase) {
      reps++;
    }
    prevPhase = phase;

    const displayReps = ex.isHold ? Math.floor(elapsed) : reps;
    if (displayReps !== lastReportedReps) {
      lastReportedReps = displayReps;
      notify(displayReps);
    }

    let targetOrient: { rotX: number; y: number; z: number };
    let targetPose: Pose;
    if (ex.custom && ex.customFn) {
      const r = ex.customFn(phase);
      targetOrient = { rotX: r.rotX, y: r.y, z: r.z };
      targetPose = r.pose;
    } else {
      const p = ex.poseFn!(phase);
      targetOrient = { rotX: ex.orient(phase), y: p.rootY, z: p.rootZ };
      targetPose = p;
    }

    const jointDamp = 0.22;
    const rootDamp = 0.1;
    lerpPose(curPose, targetPose, jointDamp);
    curOrient.rotX = lerp(curOrient.rotX, targetOrient.rotX, rootDamp);
    curOrient.y = lerp(curOrient.y, targetOrient.y, rootDamp);
    curOrient.z = lerp(curOrient.z, targetOrient.z, rootDamp);

    applyPoseToRig(curPose);
    character.rotation.x = curOrient.rotX;
    character.position.set(0, curOrient.y, curOrient.z);

    contactShadow.position.x = character.position.x;
    contactShadow.position.z = character.position.z;
    const groundedness = clamp(1.2 - curOrient.y * 0.5, 0.35, 1.1);
    contactShadow.scale.setScalar(groundedness);

    updateMuscleGlow(ex.muscles, phase);

    controls.update();
    renderer.render(scene, camera);
  }
  rafId = requestAnimationFrame(frame);

  function resize(width: number, height: number) {
    if (width <= 0 || height <= 0) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }

  function dispose() {
    cancelAnimationFrame(rafId);
    controls.dispose();
    renderer.dispose();
    pmrem.dispose();
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
      else if (mat) mat.dispose();
    });
    listeners.clear();
  }

  function subscribe(cb: (state: VisualizerState) => void) {
    listeners.add(cb);
    cb({ exerciseId: currentKey, reps, isHold: !!EXERCISES[currentKey].isHold });
    return () => listeners.delete(cb);
  }

  return {
    selectExercise,
    setPlaying: (p: boolean) => {
      playing = p;
    },
    setSpeed: (s: number) => {
      speed = s;
    },
    setCamera: setCam,
    resize,
    subscribe,
    dispose,
  };
}
