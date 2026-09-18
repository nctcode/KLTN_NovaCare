import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export interface ModelInspectionResult {
  meshCount: number;
  meshNames: string[];
  materialsCount: number;
  hasTextures: boolean;
  boundingBox: THREE.Box3;
}

export class BodyModelLoader {
  private static loader = new GLTFLoader();

  /**
   * Loads realistic GLB 3D human body model from /assets/models/male.glb or female.glb.
   * Runs GLB inspection (scene.traverse()) to log mesh names, materials, textures, and bounding box.
   * Throws error if file is missing (DOES NOT generate procedural fake mannequins).
   */
  public static async loadModel(gender: 'male' | 'female'): Promise<{ modelGroup: THREE.Group; inspection: ModelInspectionResult }> {
    const modelPath = `/assets/models/${gender}.glb`;

    try {
      const gltf = await this.loader.loadAsync(modelPath);
      const modelGroup = gltf.scene;
      modelGroup.name = `HumanBody3D_${gender}`;

      // Run GLB Inspection (scene.traverse)
      const inspection = this.inspectGLBScene(modelGroup);

      return { modelGroup, inspection };
    } catch (error) {
      throw new Error(`MISSING_ASSET: Chưa có realistic human GLB/GLTF model cho ${gender === 'male' ? 'Nam' : 'Nữ'} (file ${modelPath} chưa được cung cấp)`);
    }
  }

  /**
   * Inspects the loaded GLB scene graph and logs hierarchy, mesh names, materials, and bounding box.
   */
  private static inspectGLBScene(scene: THREE.Group): ModelInspectionResult {
    let meshCount = 0;
    const meshNames: string[] = [];
    let materialsCount = 0;
    let hasTextures = false;

    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        meshCount++;
        meshNames.push(mesh.name || `UnsegmentedMesh_${meshCount}`);

        const mat = mesh.material as THREE.MeshStandardMaterial;
        if (mat) {
          materialsCount++;
          if (mat.map || mat.normalMap || mat.roughnessMap || mat.aoMap) {
            hasTextures = true;
          }
          // Store original material state on mesh userData for PBR preservation
          mesh.userData.originalMaterial = mat;
          mesh.userData.originalEmissive = mat.emissive ? mat.emissive.clone() : new THREE.Color(0x000000);
          mesh.userData.originalEmissiveIntensity = mat.emissiveIntensity ?? 0;
        }
      }
    });

    const bbox = new THREE.Box3().setFromObject(scene);

    return {
      meshCount,
      meshNames,
      materialsCount,
      hasTextures,
      boundingBox: bbox,
    };
  }
}
