import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// glTF rigged-character loading, used by exerciseVisualizer.ts (the Home
// page's flex character used to be a second caller — see git history —
// before it was replaced by the frame-sequence scrubber in frameScrub.ts).
// Kept as its own module because getting this right took three real bugs to
// discover (see notes below), and it's cheap insurance against having to
// re-find them if a second three.js character ever gets added back.

export interface RiggedBone {
  object: THREE.Object3D;
  /**
   * The bone's rotation *as authored in the glTF's bind pose* — not
   * necessarily identity. `poseBone()` composes pose deltas on top of this
   * rather than overwriting `object.quaternion` outright, which matters a
   * lot: some rigs (e.g. the "Soldier" asset used on the Exercises page)
   * bake real, non-identity rotations into bones like Hips or UpLeg as
   * part of how their T-pose was authored. Setting `.rotation.set(x,y,z)`
   * directly — which is fine on a rig where every relevant bind rotation
   * happens to be identity (true of the "Xbot" asset, which is why that
   * bug stayed hidden there) — discards that baked rotation on this one
   * and snaps the whole lower body into a broken orientation.
   */
  bindQuaternion: THREE.Quaternion;
}

export interface RiggedCharacter {
  root: THREE.Group;
  bones: Record<string, RiggedBone>;
  skinnedMeshes: THREE.SkinnedMesh[];
  /** Character height in scene units, measured from actual bone world positions (see loadRiggedCharacter). */
  heightUnits: number;
  /** Add to `root.position.y` so the feet sit at world y=0. */
  restY: number;
  /** A reasonable "look at" height — roughly chest/shoulder level. */
  eyeY: number;
}

const scratchEuler = new THREE.Euler();
const scratchQuat = new THREE.Quaternion();

/** Apply a pose-space Euler rotation on top of the bone's bind pose (see RiggedBone.bindQuaternion). */
export function poseBone(bone: RiggedBone, x: number, y: number, z: number): void {
  scratchEuler.set(x, y, z);
  scratchQuat.setFromEuler(scratchEuler);
  bone.object.quaternion.copy(bone.bindQuaternion).multiply(scratchQuat);
}

function measureHeight(root: THREE.Object3D, heightRefBones: { top: string; foot: string }) {
  root.updateMatrixWorld(true);
  const topObj = root.getObjectByName(heightRefBones.top);
  const footObj = root.getObjectByName(heightRefBones.foot);
  if (!topObj || !footObj) throw new Error('Height reference bone not found');
  const topPos = new THREE.Vector3();
  topObj.getWorldPosition(topPos);
  const footPos = new THREE.Vector3();
  footObj.getWorldPosition(footPos);
  const restY = -footPos.y;
  const heightUnits = (topPos.y - footPos.y) * 1.03; // small pad for the foot's own sole thickness
  const eyeY = restY + heightUnits * 0.5;
  return { restY, heightUnits, eyeY };
}

export async function loadRiggedCharacter(
  url: string,
  boneNames: Record<string, string>,
  heightRefBones: { top: string; foot: string },
  /** If given, the model is uniformly scaled so its measured height matches this many scene units. */
  targetHeight?: number
): Promise<RiggedCharacter> {
  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync(url);
  const root = gltf.scene;

  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.isMesh) {
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    }
  });

  const bones: Record<string, RiggedBone> = {};
  Object.entries(boneNames).forEach(([key, name]) => {
    const obj = root.getObjectByName(name);
    if (!obj) throw new Error(`Bone not found in ${url}: ${name}`);
    bones[key] = { object: obj, bindQuaternion: obj.quaternion.clone() };
  });

  // A SkinnedMesh's frustum-culling bounding sphere is computed once from
  // the bind pose and never updates for bones driven directly like this
  // (there's no AnimationMixer keeping it in sync) — left at the default,
  // the mesh silently vanishes the moment a pose moves enough for the
  // stale sphere to miss the camera frustum.
  const skinnedMeshes: THREE.SkinnedMesh[] = [];
  root.traverse((obj) => {
    const mesh = obj as THREE.SkinnedMesh;
    if (mesh.isSkinnedMesh) {
      mesh.frustumCulled = false;
      skinnedMeshes.push(mesh);
    }
  });

  // Measured, not assumed: THREE.Box3().setFromObject() does not account
  // for skinning and returns a bounding box a fraction of a SkinnedMesh's
  // true rendered size — don't use it here. Real bone world positions have
  // no such issue.
  let { restY, heightUnits, eyeY } = measureHeight(root, heightRefBones);

  if (targetHeight) {
    root.scale.setScalar(targetHeight / heightUnits);
    ({ restY, heightUnits, eyeY } = measureHeight(root, heightRefBones));
  }

  return { root, bones, skinnedMeshes, heightUnits, restY, eyeY };
}
