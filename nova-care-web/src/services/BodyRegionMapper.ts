import * as THREE from 'three';
import { BodyRegion, ALL_BODY_REGIONS, findBodyRegionById } from '@/models/BodyRegion';

export const BodyRegionMapper = {
  /**
   * Maps an intersected 3D Three.js mesh/object name to a canonical BodyRegion.
   * Performs exact match first, then clean substring matching against meshNames array.
   */
  mapMeshToRegion(meshName: string, mesh?: THREE.Mesh): BodyRegion | null {
    if (!meshName) return null;
    const clean = meshName.trim().toLowerCase();

    // 1. Direct ID match
    let found = ALL_BODY_REGIONS.find((r) => r.id.toLowerCase() === clean);
    if (found) return found;

    // 2. MeshNames array matching
    found = ALL_BODY_REGIONS.find((r) =>
      r.meshNames.some((mName) => clean.includes(mName.toLowerCase()) || mName.toLowerCase().includes(clean))
    );
    if (found) return found;

    // 3. Heuristic substring mapping
    if (clean.includes('head') || clean.includes('skull') || clean.includes('face')) {
      return findBodyRegionById('head') || null;
    }
    if (clean.includes('neck') || clean.includes('nape')) {
      return findBodyRegionById('neck') || null;
    }
    if (clean.includes('chest') || clean.includes('pectoral')) {
      return findBodyRegionById('chest') || null;
    }
    if (clean.includes('abdomen') || clean.includes('abs') || clean.includes('stomach')) {
      return findBodyRegionById('abdomen') || null;
    }
    if (clean.includes('upper') && clean.includes('back')) {
      return findBodyRegionById('upper_back') || null;
    }
    if (clean.includes('lower') && clean.includes('back')) {
      return findBodyRegionById('lower_back') || null;
    }
    if (clean.includes('shoulder')) {
      return clean.includes('left') || clean.includes('_l')
        ? findBodyRegionById('left_shoulder') || null
        : findBodyRegionById('right_shoulder') || null;
    }

    // 4. Spatial 3D Bounding-Box fallback if GLB is unsegmented (single mesh)
    if (mesh && mesh.geometry) {
      if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
      const bbox = mesh.geometry.boundingBox;
      if (bbox) {
        // Can estimate normalized Y position relative to height
        const height = bbox.max.y - bbox.min.y;
        const normY = (mesh.position.y - bbox.min.y) / (height || 1);
        if (normY > 0.85) return findBodyRegionById('head') || null;
        if (normY > 0.75) return findBodyRegionById('neck') || null;
        if (normY > 0.55) return findBodyRegionById('chest') || null;
        if (normY > 0.40) return findBodyRegionById('abdomen') || null;
        if (normY > 0.20) return findBodyRegionById('left_thigh') || null;
        return findBodyRegionById('left_calf') || null;
      }
    }

    return null;
  },
};
