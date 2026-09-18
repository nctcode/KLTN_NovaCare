import * as THREE from 'three';
import fs from 'fs';
import path from 'path';

function buildGLBBuffer(gender) {
  const isFemale = gender === 'female';
  const group = new THREE.Group();
  group.name = `HumanBody_${gender}`;

  const skinColor = isFemale ? 0xEBB798 : 0xDF9F7B;
  const material = new THREE.MeshStandardMaterial({
    color: skinColor,
    roughness: 0.5,
    metalness: 0.1,
  });

  const createPart = (name, geo, pos) => {
    const mesh = new THREE.Mesh(geo, material);
    mesh.name = name;
    mesh.position.set(...pos);
    return mesh;
  };

  // Add 24 anatomical regions
  const headGeo = new THREE.SphereGeometry(isFemale ? 0.32 : 0.35, 16, 16);
  group.add(createPart('Head', headGeo, [0, 2.5, 0]));

  const neckGeo = new THREE.CylinderGeometry(0.14, 0.17, 0.35, 16);
  group.add(createPart('Neck', neckGeo, [0, 2.05, 0]));

  const chestGeo = new THREE.SphereGeometry(isFemale ? 0.52 : 0.62, 16, 16);
  group.add(createPart('Chest', chestGeo, [0, 1.55, 0]));
  group.add(createPart('UpperBack', chestGeo.clone(), [0, 1.55, -0.05]));

  const absGeo = new THREE.SphereGeometry(isFemale ? 0.46 : 0.54, 16, 16);
  group.add(createPart('Abdomen', absGeo, [0, 0.95, 0]));
  group.add(createPart('LowerBack', absGeo.clone(), [0, 0.95, -0.05]));

  const pelvisGeo = new THREE.SphereGeometry(isFemale ? 0.52 : 0.54, 16, 16);
  group.add(createPart('LeftHip', pelvisGeo, [-0.2, 0.45, 0]));
  group.add(createPart('RightHip', pelvisGeo, [0.2, 0.45, 0]));

  const shoulderGeo = new THREE.SphereGeometry(isFemale ? 0.20 : 0.24, 16, 16);
  const sOff = isFemale ? 0.62 : 0.75;
  group.add(createPart('LeftShoulder', shoulderGeo, [-sOff, 1.75, 0]));
  group.add(createPart('RightShoulder', shoulderGeo, [sOff, 1.75, 0]));

  const upperArmGeo = new THREE.CylinderGeometry(0.13, 0.10, 0.65, 16);
  const lowerArmGeo = new THREE.CylinderGeometry(0.10, 0.07, 0.60, 16);
  const handGeo = new THREE.SphereGeometry(0.11, 16, 16);

  const aOff = isFemale ? 0.70 : 0.84;
  group.add(createPart('LeftArm', upperArmGeo, [-aOff, 1.35, 0]));
  group.add(createPart('RightArm', upperArmGeo, [aOff, 1.35, 0]));

  group.add(createPart('LeftElbow', lowerArmGeo, [-aOff - 0.06, 0.70, 0]));
  group.add(createPart('RightElbow', lowerArmGeo, [aOff + 0.06, 0.70, 0]));

  group.add(createPart('LeftHand', handGeo, [-aOff - 0.10, 0.25, 0]));
  group.add(createPart('RightHand', handGeo, [aOff + 0.10, 0.25, 0]));

  const thighGeo = new THREE.CylinderGeometry(0.24, 0.17, 0.90, 16);
  const calfGeo = new THREE.CylinderGeometry(0.16, 0.10, 0.85, 16);
  const footGeo = new THREE.BoxGeometry(0.16, 0.12, 0.45);

  const lOff = isFemale ? 0.28 : 0.32;
  group.add(createPart('LeftThigh', thighGeo, [-lOff, -0.10, 0]));
  group.add(createPart('RightThigh', thighGeo, [lOff, -0.10, 0]));

  const kneeGeo = new THREE.SphereGeometry(0.14, 16, 16);
  group.add(createPart('LeftKnee', kneeGeo, [-lOff, -0.58, 0]));
  group.add(createPart('RightKnee', kneeGeo, [lOff, -0.58, 0]));

  group.add(createPart('LeftCalf', calfGeo, [-lOff, -1.02, 0]));
  group.add(createPart('RightCalf', calfGeo, [lOff, -1.02, 0]));

  const ankleGeo = new THREE.SphereGeometry(0.10, 16, 16);
  group.add(createPart('LeftAnkle', ankleGeo, [-lOff, -1.48, 0]));
  group.add(createPart('RightAnkle', ankleGeo, [lOff, -1.48, 0]));

  group.add(createPart('LeftFoot', footGeo, [-lOff, -1.56, 0.15]));
  group.add(createPart('RightFoot', footGeo, [lOff, -1.56, 0.15]));

  // Build GLTF JSON data structure
  const nodes = [];
  const meshes = [];
  const accessors = [];
  const bufferViews = [];
  const binaryBuffers = [];
  let currentByteOffset = 0;

  // Root node
  const rootNodeChildren = [];
  let nodeIdx = 1;

  group.children.forEach((child) => {
    const mesh = child;
    const geo = mesh.geometry.toNonIndexed();
    const posAttr = geo.attributes.position;
    const posArray = posAttr.array;

    // Buffer View
    const posBuffer = Buffer.from(posArray.buffer);
    binaryBuffers.push(posBuffer);

    bufferViews.push({
      buffer: 0,
      byteOffset: currentByteOffset,
      byteLength: posBuffer.byteLength,
      target: 34962, // ARRAY_BUFFER
    });

    // Accessor
    accessors.push({
      bufferView: bufferViews.length - 1,
      byteOffset: 0,
      componentType: 5126, // FLOAT
      count: posAttr.count,
      type: 'VEC3',
      max: [1, 3, 1],
      min: [-1, -2, -1],
    });

    // Mesh
    meshes.push({
      name: mesh.name,
      primitives: [
        {
          attributes: { POSITION: accessors.length - 1 },
        },
      ],
    });

    nodes.push({
      name: mesh.name,
      mesh: meshes.length - 1,
      translation: [mesh.position.x, mesh.position.y, mesh.position.z],
    });

    rootNodeChildren.push(nodeIdx);
    nodeIdx++;
    currentByteOffset += posBuffer.byteLength;
  });

  nodes.unshift({
    name: group.name,
    children: rootNodeChildren,
  });

  const totalBinBuffer = Buffer.concat(binaryBuffers);

  const gltfJson = {
    asset: { version: '2.0', generator: 'NovaCare 3D Model Exporter' },
    scenes: [{ nodes: [0] }],
    scene: 0,
    nodes,
    meshes,
    accessors,
    bufferViews,
    buffers: [{ byteLength: totalBinBuffer.byteLength }],
  };

  const jsonString = JSON.stringify(gltfJson);
  let jsonBuffer = Buffer.from(jsonString, 'utf8');

  // Alignment to 4 bytes
  while (jsonBuffer.length % 4 !== 0) {
    jsonBuffer = Buffer.concat([jsonBuffer, Buffer.from(' ')]);
  }

  const glbHeader = Buffer.alloc(12);
  glbHeader.write('glTF', 0, 4, 'ascii'); // Magic "glTF"
  glbHeader.writeUInt32LE(2, 4); // Version 2

  const jsonChunkHeader = Buffer.alloc(8);
  jsonChunkHeader.writeUInt32LE(jsonBuffer.length, 0);
  jsonChunkHeader.write('JSON', 4, 4, 'ascii'); // "JSON"

  const binChunkHeader = Buffer.alloc(8);
  binChunkHeader.writeUInt32LE(totalBinBuffer.length, 0);
  binChunkHeader.write('BIN\0', 4, 4, 'ascii'); // "BIN\0"

  const totalLength = 12 + 8 + jsonBuffer.length + 8 + totalBinBuffer.length;
  glbHeader.writeUInt32LE(totalLength, 8);

  const fullGLB = Buffer.concat([
    glbHeader,
    jsonChunkHeader,
    jsonBuffer,
    binChunkHeader,
    totalBinBuffer,
  ]);

  return fullGLB;
}

const outDir = 'd:/HTTT18B/KLTN/NovaCare/nova-care-web/public/assets/models';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const maleBuffer = buildGLBBuffer('male');
fs.writeFileSync(path.join(outDir, 'male.glb'), maleBuffer);
console.log(`Generated male.glb: ${path.join(outDir, 'male.glb')} (${(maleBuffer.length / 1024).toFixed(1)} KB)`);

const femaleBuffer = buildGLBBuffer('female');
fs.writeFileSync(path.join(outDir, 'female.glb'), femaleBuffer);
console.log(`Generated female.glb: ${path.join(outDir, 'female.glb')} (${(femaleBuffer.length / 1024).toFixed(1)} KB)`);
