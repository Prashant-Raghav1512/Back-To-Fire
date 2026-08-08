import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { loadRiggedCharacter, poseBone, type RiggedBone, type RiggedCharacter } from '@/lib/riggedCharacter';

// A from-scratch 3D IK pose library (the math, not the mesh) rendered with
// three.js and driving a real rigged/skinned glTF character (public/models/
// soldier.glb, loaded via src/lib/riggedCharacter.ts — see that file for the
// bind-pose/skinning bugs its loader works around). Framework-
// agnostic on purpose — createExerciseVisualizer() takes a plain <canvas>
// and container element and returns an imperative handle; the React wrapper
// (src/components/ExerciseDemo.tsx) owns all UI state and just calls into
// this handle. Exercise ids are kept identical to this app's
// src/data/*.json exercise ids so the two stay in sync without a
// translation table.
//
// The IK math below still targets a hand-derived skeleton with fixed bone
// lengths (the L constants) and a hip-centered root, exactly as when it
// drove a hand-built primitive rig. applyPoseToRig() is what bridges that
// to the loaded skeleton: it maps each IK joint angle onto the
// corresponding mixamorig bone, applying the same base-correction +
// left/right sign-flip transform derived (and verified by rendering) for
// the flex character's arms, plus the direct pass-through that worked for
// its legs/torso/head — see the comment above applyPoseToRig for the full
// mapping and why each axis needs (or doesn't need) a flip.

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

// Ankle angle that keeps the sole flat against the ground plane no matter
// how the body is rotated (rotX) or how much the hip/knee are bent — since
// every joint in this rig turns on the same local X axis, their rotations
// simply sum, so cancelling that sum out holds the foot's world orientation
// fixed at "flat" (its orientation when every angle is 0, i.e. standing).
function flatAnkle(rotX: number, hipX: number, kneeX: number): number {
  return clamp(-rotX - hipX - kneeX, -1.9, 1.3);
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
  // Hands actually grip the low bar here — the previous z:0.18 placed them
  // off the bar's real position.
  lowbarHand: { y: 0.95, z: 0.0 },
  bridgeFoot: { y: 0.05, z: -0.34 },
  // Rear foot resting on the Bulgarian split squat bench.
  benchFoot: { y: 0.28, z: 0.42 },
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
  lAnkle: JointAngle;
  rHip: JointAngle;
  rKnee: JointAngle;
  rAnkle: JointAngle;
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
    lAnkle: { x: -0.2 },
    rHip: { x: 0, z: 0 },
    rKnee: { x: 0 },
    rAnkle: { x: -0.2 },
    rootY: 0,
    rootZ: 0,
  };
}
function S(phase: number) {
  return Math.sin(phase * Math.PI);
}

// apply IK results (same target -> same angles for symmetric L/R) to a pose,
// keeping both planted feet flat against whatever surface they're on
function applyLegsSym(p: Pose, target: Target, rootY: number, rootZ: number, rotX: number, bend = 1) {
  const r = legIK(target, rootY, rootZ, rotX, bend);
  p.lHip.x = r.x;
  p.lKnee.x = r.kneeX;
  p.rHip.x = r.x;
  p.rKnee.x = r.kneeX;
  const a = flatAnkle(rotX, r.x, r.kneeX);
  p.lAnkle.x = a;
  p.rAnkle.x = a;
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
      p.lAnkle.x = -0.3;
      p.rAnkle.x = -0.3;
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
      const frontA = flatAnkle(0, frontR.x, frontR.kneeX);
      const backA = flatAnkle(0, backR.x, backR.kneeX);
      if (half) {
        p.lHip.x = frontR.x;
        p.lKnee.x = frontR.kneeX;
        p.lAnkle.x = frontA;
        p.rHip.x = backR.x;
        p.rKnee.x = backR.kneeX;
        p.rAnkle.x = backA;
      } else {
        p.rHip.x = frontR.x;
        p.rKnee.x = frontR.kneeX;
        p.rAnkle.x = frontA;
        p.lHip.x = backR.x;
        p.lKnee.x = backR.kneeX;
        p.lAnkle.x = backA;
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
      p.lAnkle.x = -0.25;
      p.rAnkle.x = -0.25;
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
      // draw the hands in toward the midline (the defining "diamond" hand
      // shape) — a cosmetic adduction on top of the IK solve above, since
      // the elbows tuck in close to the ribs rather than flaring.
      p.lShoulder.z = 0.32;
      p.rShoulder.z = -0.32;
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
        const a = flatAnkle(rotX, p.lHip.x, p.lKnee.x);
        p.lAnkle.x = a;
        p.rAnkle.x = a;
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
        const a = flatAnkle(rotX, p.lHip.x, p.lKnee.x);
        p.lAnkle.x = a;
        p.rAnkle.x = a;
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
        const a = flatAnkle(0, p.lHip.x, p.lKnee.x);
        p.lAnkle.x = a;
        p.rAnkle.x = a;
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
      const stillAnkle = flatAnkle(rotX, stillLeg.x, stillLeg.kneeX);
      if (half) {
        p.lHip.x = -1.5 * s;
        p.lKnee.x = 1.7 * s;
        p.lAnkle.x = -0.3;
        p.rHip.x = stillLeg.x;
        p.rKnee.x = stillLeg.kneeX;
        p.rAnkle.x = stillAnkle;
      } else {
        p.rHip.x = -1.5 * s;
        p.rKnee.x = 1.7 * s;
        p.rAnkle.x = -0.3;
        p.lHip.x = stillLeg.x;
        p.lKnee.x = stillLeg.kneeX;
        p.lAnkle.x = stillAnkle;
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
      p.lAnkle.x = -0.35;
      p.rAnkle.x = -0.35;
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
      p.rAnkle.x = flatAnkle(0, r.x, r.kneeX);
      const rear = legIK(ANCHOR.benchFoot, rootY, rootZ, 0, -1);
      p.lHip.x = rear.x;
      p.lKnee.x = rear.kneeX;
      p.lAnkle.x = flatAnkle(0, rear.x, rear.kneeX);
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
      p.lAnkle.x = -0.35;
      p.rAnkle.x = -0.35;
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
      p.lAnkle.x = -0.4;
      p.rAnkle.x = -0.4;
      p.rootY = 1.05 - 0.12 * s;
      p.rootZ = -0.56;
      return p;
    },
  },

  'muscle-ups': {
    id: 'muscle-ups',
    label: 'Muscle-ups',
    repDuration: 3.0,
    prop: 'highbar',
    muscles: ['back', 'arms', 'chest'],
    description: 'Pull up explosively, roll your shoulders over the bar, then press out to a straight-arm lockout.',
    custom: true,
    orient: () => 0,
    customFn(phase) {
      const p = basePose();
      const baseY = HANG_BASE_Y;
      // Keyframed like an actual muscle-up: pull -> hips drive up & forward
      // to roll over the bar (the hard "transition") -> settle into a dip
      // at the bottom -> press to a straight-arm support/lockout -> drop
      // back to the hang. sh/el angles at the two hang/pull keys are the
      // exact armIK solution for ANCHOR.barHand so the hands read as truly
      // gripping the bar there; the transition/dip/lockout keys are FK,
      // since rolling the wrist over the bar isn't something this
      // single-axis rig's IK can solve for.
      const KEYS: MuscleUpKey[] = [
        { t: 0.0, y: baseY, z: 0, torso: 0, sh: -3.07, el: -0.04, hip: 0.05, knee: 0.3 },
        { t: 0.3, y: baseY + 0.32, z: 0, torso: -0.05, sh: -1.93, el: -2.3, hip: 0.05, knee: 0.3 },
        { t: 0.45, y: baseY + 0.4, z: -0.12, torso: -0.95, sh: -0.9, el: -2.25, hip: -0.15, knee: 0.2 },
        { t: 0.58, y: baseY + 0.36, z: -0.14, torso: -0.65, sh: 0.3, el: -2.15, hip: -0.05, knee: 0.15 },
        { t: 0.72, y: baseY + 0.3, z: -0.08, torso: -0.15, sh: 1.3, el: -1.9, hip: 0.0, knee: 0.15 },
        { t: 0.9, y: baseY + 0.46, z: -0.02, torso: -0.02, sh: 0.85, el: -0.1, hip: 0.0, knee: 0.1 },
        { t: 1.0, y: baseY, z: 0, torso: 0, sh: -3.07, el: -0.04, hip: 0.05, knee: 0.3 },
      ];
      let a = KEYS[0];
      let b = KEYS[1];
      let e = 0;
      for (let i = 0; i < KEYS.length - 1; i++) {
        if (phase <= KEYS[i + 1].t) {
          a = KEYS[i];
          b = KEYS[i + 1];
          const span = b.t - a.t;
          const local = span > 0 ? clamp((phase - a.t) / span, 0, 1) : 0;
          e = local * local * (3 - 2 * local); // smoothstep, so each phase eases in/out
          break;
        }
      }
      const mix = (k: Exclude<keyof MuscleUpKey, 't'>) => lerp(a[k], b[k], e);
      p.torso.x = mix('torso');
      p.lShoulder.x = mix('sh');
      p.rShoulder.x = p.lShoulder.x;
      p.lElbow.x = mix('el');
      p.rElbow.x = p.lElbow.x;
      p.lHip.x = mix('hip');
      p.rHip.x = p.lHip.x;
      p.lKnee.x = mix('knee');
      p.rKnee.x = p.lKnee.x;
      p.lAnkle.x = -0.25;
      p.rAnkle.x = -0.25;
      return { rotX: 0, y: mix('y'), z: mix('z'), pose: p };
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
      p.lAnkle.x = flatAnkle(0, stand.x, stand.kneeX);
      p.rHip.x = 1.3 * s;
      p.rKnee.x = 0.15 * s;
      p.rAnkle.x = -0.3 * s;
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
      const a = flatAnkle(rotX, 0.02, 0);
      p.lAnkle.x = a;
      p.rAnkle.x = a;
      p.rootY = rootY;
      p.rootZ = rootZ;
      return p;
    },
  },
};

interface MuscleUpKey {
  t: number;
  y: number;
  z: number;
  torso: number;
  sh: number;
  el: number;
  hip: number;
  knee: number;
}

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
  cur.lAnkle.x = lerp(cur.lAnkle.x, tgt.lAnkle.x, d);
  cur.rAnkle.x = lerp(cur.rAnkle.x, tgt.rAnkle.x, d);
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

// This rig has real bind-pose quirks, all discovered by rendering and
// comparing screenshots rather than from the glTF JSON alone: non-identity
// bind rotations on Hips/UpLeg (see riggedCharacter.ts's poseBone()), arms
// extending along local +Y instead of +X, and facing away from the camera
// by default (hence FACING_CORRECTION below).
const MODEL_URL = `${import.meta.env.BASE_URL}models/soldier.glb`;
const FACING_CORRECTION = Math.PI;

const BONE_NAMES = {
  hips: 'mixamorigHips',
  spine: 'mixamorigSpine',
  spine1: 'mixamorigSpine1',
  neck: 'mixamorigNeck',
  head: 'mixamorigHead',
  lArm: 'mixamorigLeftArm',
  lForeArm: 'mixamorigLeftForeArm',
  lHand: 'mixamorigLeftHand',
  rArm: 'mixamorigRightArm',
  rForeArm: 'mixamorigRightForeArm',
  rHand: 'mixamorigRightHand',
  lUpLeg: 'mixamorigLeftUpLeg',
  lLeg: 'mixamorigLeftLeg',
  lFoot: 'mixamorigLeftFoot',
  rUpLeg: 'mixamorigRightUpLeg',
  rLeg: 'mixamorigRightLeg',
  rFoot: 'mixamorigRightFoot',
};

// Bringing the arms down out of the T-pose is a local X rotation on this
// rig (see flexCharacter.ts) — opposite base sign per side, since the
// skeleton mirrors its arm bones' local axes left/right.
const BASE_ARM_X_L = Math.PI / 2;
const BASE_ARM_X_R = -Math.PI / 2;

// The old hand-built rig was authored in real-world-ish meters (a standing
// height of ~1.75m, e.g. ANCHOR.barHand.y = 2.15 reads as a realistic pull-
// up bar height) — every ANCHOR constant above assumes that scale. Loading
// the model at this target height keeps those anchors reading correctly
// regardless of the glTF's native scale.
const TARGET_HEIGHT = 1.75;

export async function createExerciseVisualizer(
  canvas: HTMLCanvasElement,
  width: number,
  height: number
): Promise<VisualizerHandle> {
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

  // CAM_PRESETS were tuned for a standing character (rotX = 0). Exercises
  // that lie prone, hang, or invert pitch the whole character by rotX
  // around world X — and a *fixed* world-space camera position ends up, for
  // large rotX, looking almost straight down the character's now-horizontal
  // long axis instead of across it, which perspective-foreshortens the body
  // into a shape that reads as "standing" even though the pitch is applied
  // correctly (verified against the actual `character.rotation.x` value).
  // Rotating each preset's camera offset by the exercise's own rotX keeps
  // the *viewing angle relative to the body* constant regardless of
  // orientation, the same way the fixed "side" preset only happens to work
  // for prone poses by coincidence (its offset is perpendicular to the
  // pitch axis).
  let activeCameraPreset: CameraPreset = 'angle';
  const camOffsetScratch = new THREE.Vector3();
  function primaryRotX(id: string): number {
    const ex = EXERCISES[id];
    if (ex.custom && ex.customFn) return ex.customFn(0).rotX;
    return ex.orient(0);
  }
  function setCam(name: CameraPreset) {
    activeCameraPreset = name;
    const c = CAM_PRESETS[name];
    const rotX = primaryRotX(currentKey);
    camOffsetScratch.set(c.pos[0] - c.target[0], c.pos[1] - c.target[1], c.pos[2] - c.target[2]);
    camOffsetScratch.applyAxisAngle(new THREE.Vector3(1, 0, 0), rotX);
    camera.position.set(c.target[0] + camOffsetScratch.x, c.target[1] + camOffsetScratch.y, c.target[2] + camOffsetScratch.z);
    controls.target.set(...c.target);
  }

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

  /* =======================================================================
     CHARACTER — the outer `character` group is the exact same "pitch root"
     the IK math above was written against: `character.position.set(0,
     rootY, rootZ)` places the hip joint in world space, and
     `character.rotation.x = rotX` reorients the whole rig (lying prone,
     hanging, upside-down, etc.) as a single rigid rotation. Two more groups
     get the loaded model into that frame without touching the IK math:
     `facing` applies this asset's constant facing correction, and `root`
     (the loaded scene) gets shifted so its own Hips bone — not the glTF's
     native origin — sits at local (0,0,0), matching how the old hand-built
     rig's hips.position was always (0,0,0) relative to `character`.
     ======================================================================= */
  const character = new THREE.Group();
  scene.add(character);
  const facing = new THREE.Group();
  facing.rotation.y = FACING_CORRECTION;
  character.add(facing);

  const rig: RiggedCharacter = await loadRiggedCharacter(
    MODEL_URL,
    BONE_NAMES,
    { top: 'mixamorigHeadTop_End', foot: 'mixamorigLeftFoot' },
    TARGET_HEIGHT
  );
  const { root, bones, skinnedMeshes } = rig;
  root.updateMatrixWorld(true);

  // Captured here, before `root` gets a parent below, so getWorldQuaternion
  // gives an orientation independent of whatever outer pitch/facing
  // transform gets applied to the character afterward. This asset's hand
  // bones have an ~identity bind rotation relative to the forearm (verified
  // by inspecting the raw glTF), and BONE_NAMES only maps as far as the
  // hand, not fingers — so with no per-frame correction the hand would just
  // rigidly track the forearm's rotation, swinging the palm to an arbitrary
  // angle every time the elbow bends to reach an IK target. See
  // applyHandOrientation() below for how this bind quaternion is used to
  // fix that.
  const lHandBindQuat = new THREE.Quaternion();
  bones.lHand.object.getWorldQuaternion(lHandBindQuat);
  const rHandBindQuat = new THREE.Quaternion();
  bones.rHand.object.getWorldQuaternion(rHandBindQuat);

  const hipsWorld = new THREE.Vector3();
  bones.hips.object.getWorldPosition(hipsWorld);
  root.position.set(-hipsWorld.x, -hipsWorld.y, -hipsWorld.z);
  facing.add(root);

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
    const top = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.06, 0.85), mat);
    top.position.set(0, 0.24, 0.55);
    top.castShadow = top.receiveShadow = true;
    g.add(top);
    ([[-0.17, 0.28], [0.17, 0.28], [-0.17, 0.82], [0.17, 0.82]] as [number, number][]).forEach(([x, z]) => {
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

  // Maps each IK joint angle (computed against the hand-derived skeleton
  // above) onto the loaded rig's bones. The arm mapping — base correction
  // plus an opposite sign per side on both the shoulder's rotation and the
  // elbow's — was derived and verified by rendering: this rig's left/right
  // arm bones mirror their local axes, so a symmetric IK result (same angle
  // fed to both sides) has to be applied with opposite sign to produce a
  // symmetric *pose*. Legs, torso, and head needed no such flip and are
  // passed through directly here too. The single torso pivot the IK math
  // assumes is spread across two spine bones (60/40) for a smoother curve
  // than dumping the whole rotation onto one joint.
  const scratchOuterQuat = new THREE.Quaternion();
  const scratchForearmQuat = new THREE.Quaternion();
  const scratchDesiredQuat = new THREE.Quaternion();

  // Locks a hand's WORLD orientation to its bind-pose orientation, rotated
  // only by the body's current overall pitch/facing (`scratchOuterQuat`) —
  // instead of rigidly inheriting whatever the forearm's rotation happens
  // to be. This matches real wrist behavior for every exercise here: a hand
  // on the ground or wrapped around a bar keeps roughly the same
  // orientation regardless of how bent the elbow is, because it's the
  // ground/bar dictating the hand's angle, not the elbow. Requires
  // `forearm`'s world matrix to already reflect this frame's pose (see the
  // updateMatrixWorld call below).
  function applyHandOrientation(hand: RiggedBone, forearm: RiggedBone, bindWorldQuat: THREE.Quaternion) {
    forearm.object.getWorldQuaternion(scratchForearmQuat);
    scratchDesiredQuat.copy(scratchOuterQuat).multiply(bindWorldQuat);
    hand.object.quaternion.copy(scratchForearmQuat.invert().multiply(scratchDesiredQuat));
  }

  function applyPoseToRig(p: Pose) {
    poseBone(bones.spine, p.torso.x * 0.6, 0, (p.torso.z ?? 0) * 0.6);
    poseBone(bones.spine1, p.torso.x * 0.4, 0, (p.torso.z ?? 0) * 0.4);
    poseBone(bones.head, p.head.x, 0, 0);
    poseBone(bones.lArm, BASE_ARM_X_L - p.lShoulder.x, 0, p.lShoulder.z ?? 0);
    poseBone(bones.rArm, BASE_ARM_X_R + p.rShoulder.x, 0, p.rShoulder.z ?? 0);
    poseBone(bones.lForeArm, p.lElbow.x, 0, 0);
    poseBone(bones.rForeArm, -p.rElbow.x, 0, 0);
    poseBone(bones.lUpLeg, p.lHip.x, 0, p.lHip.z ?? 0);
    poseBone(bones.rUpLeg, p.rHip.x, 0, p.rHip.z ?? 0);
    poseBone(bones.lLeg, p.lKnee.x, 0, 0);
    poseBone(bones.rLeg, p.rKnee.x, 0, 0);
    poseBone(bones.lFoot, p.lAnkle.x, 0, 0);
    poseBone(bones.rFoot, p.rAnkle.x, 0, 0);

    character.updateMatrixWorld(true);
    facing.getWorldQuaternion(scratchOuterQuat);
    applyHandOrientation(bones.lHand, bones.lForeArm, lHandBindQuat);
    applyHandOrientation(bones.rHand, bones.rForeArm, rHandBindQuat);
  }

  // The loaded model has only ~2 skinned meshes (not one mesh per limb like
  // the old primitive rig), so muscle emphasis is a whole-body tint rather
  // than per-limb — same approach as the flex character.
  const ACCENT_GLOW = new THREE.Color(0x22c55e);
  const BLACK = new THREE.Color(0x000000);
  function updateMuscleGlow(muscles: string[], phase: number) {
    const pulse = 0.35 + 0.65 * Math.pow(Math.abs(Math.sin(phase * Math.PI)), 1.4);
    const active = muscles.length > 0;
    const target = active ? pulse : 0;
    skinnedMeshes.forEach((mesh) => {
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      materials.forEach((m) => {
        const mat = m as THREE.MeshStandardMaterial;
        if (!('emissive' in mat)) return;
        const cur = mat.emissiveIntensity || 0;
        mat.emissiveIntensity = lerp(cur, target, 0.15);
        mat.emissive.copy(active ? ACCENT_GLOW : BLACK);
      });
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
    setCam(activeCameraPreset);
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
