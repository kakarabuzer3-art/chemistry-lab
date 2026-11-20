/**
 * Shape-aware placement helpers for the Chemistry Beaker Lab.
 * Collision footprints are derived from the actual Three.js model geometry,
 * including the glass body, rim/base and formed pouring spout.
 */

function convexHull(points) {
  const unique = new Map();
  for (const point of points) {
    const x = Number(point.x.toFixed(6));
    const z = Number(point.z.toFixed(6));
    unique.set(`${x}:${z}`, { x, z });
  }

  const sorted = [...unique.values()].sort((a, b) => a.x - b.x || a.z - b.z);
  if (sorted.length <= 2) return sorted;

  const cross = (origin, a, b) =>
    (a.x - origin.x) * (b.z - origin.z) -
    (a.z - origin.z) * (b.x - origin.x);

  const lower = [];
  for (const point of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], point) <= 1e-9) {
      lower.pop();
    }
    lower.push(point);
  }

  const upper = [];
  for (let index = sorted.length - 1; index >= 0; index -= 1) {
    const point = sorted[index];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], point) <= 1e-9) {
      upper.pop();
    }
    upper.push(point);
  }

  lower.pop();
  upper.pop();
  const hull = lower.concat(upper);
  if (hull.length <= 72) return hull;

  // Keep the outline bounded for predictable pointer-move cost.
  return Array.from({ length: 72 }, (_, index) => hull[Math.floor(index * hull.length / 72)]);
}

function addGeometryFootprint(geometry, matrix, output) {
  const position = geometry?.attributes?.position;
  if (!position) return;

  // Avoid allocating a Vector3 for every vertex. Matrix components are applied
  // directly to the buffer attributes using the column-major Three.js layout.
  const elements = matrix.elements;
  for (let index = 0; index < position.count; index += 1) {
    const x = position.getX(index);
    const y = position.getY(index);
    const z = position.getZ(index);
    const worldX = elements[0] * x + elements[4] * y + elements[8] * z + elements[12];
    const worldY = elements[1] * x + elements[5] * y + elements[9] * z + elements[13];
    const worldZ = elements[2] * x + elements[6] * y + elements[10] * z + elements[14];
    if (Number.isFinite(worldX + worldY + worldZ)) output.push({ x: worldX, z: worldZ });
  }
}

/** Build a convex 2D footprint from the model's true ground-projected geometry. */
export function buildBeakerFootprint(THREE, modelParts) {
  const points = [];
  const identity = new THREE.Matrix4();
  addGeometryFootprint(modelParts.glassGeometry, identity, points);
  addGeometryFootprint(modelParts.spoutGeometry, identity, points);
  for (const edgeGeometry of modelParts.spoutEdgeGeometries ?? []) {
    addGeometryFootprint(edgeGeometry, identity, points);
  }

  // TorusGeometry is authored in XY and placed horizontally in the model group.
  const rimTransform = new THREE.Matrix4().makeRotationX(Math.PI / 2);
  rimTransform.setPosition(0, modelParts.height * 0.98, 0);
  addGeometryFootprint(modelParts.rimGeometry, rimTransform, points);
  const baseTransform = new THREE.Matrix4().makeRotationX(Math.PI / 2);
  baseTransform.setPosition(0, modelParts.height * 0.075, 0);
  addGeometryFootprint(modelParts.baseGeometry, baseTransform, points);

  const hull = convexHull(points);
  const radius = hull.reduce((maximum, point) => Math.max(maximum, Math.hypot(point.x, point.z)), 0);
  return { points: hull, radius, geometryVertexCount: points.length };
}

function toWorldPolygon(footprint, position, rotationY = 0) {
  const cosine = Math.cos(rotationY);
  const sine = Math.sin(rotationY);
  return footprint.points.map((point) => ({
    x: position.x + point.x * cosine + point.z * sine,
    z: position.z - point.x * sine + point.z * cosine,
  }));
}

function projectionsSeparatedOnAxis(a, b, axisX, axisZ, clearance) {
  let aMin = Infinity;
  let aMax = -Infinity;
  let bMin = Infinity;
  let bMax = -Infinity;

  for (const point of a) {
    const projection = point.x * axisX + point.z * axisZ;
    aMin = Math.min(aMin, projection);
    aMax = Math.max(aMax, projection);
  }
  for (const point of b) {
    const projection = point.x * axisX + point.z * axisZ;
    bMin = Math.min(bMin, projection);
    bMax = Math.max(bMax, projection);
  }

  return aMax + clearance < bMin || bMax + clearance < aMin;
}

function polygonsOverlapWithClearance(a, b, clearance) {
  for (const polygon of [a, b]) {
    for (let index = 0; index < polygon.length; index += 1) {
      const start = polygon[index];
      const end = polygon[(index + 1) % polygon.length];
      const edgeX = end.x - start.x;
      const edgeZ = end.z - start.z;
      const length = Math.hypot(edgeX, edgeZ);
      if (length < 1e-9) continue;
      const axisX = -edgeZ / length;
      const axisZ = edgeX / length;
      if (projectionsSeparatedOnAxis(a, b, axisX, axisZ, clearance)) return false;
    }
  }
  return true;
}

/** Return every existing beaker whose real footprint intersects the candidate. */
export function validateBeakerPlacement({
  footprint,
  position,
  records,
  getFootprint,
}) {
  const blockers = [];
  const candidatePolygon = toWorldPolygon(footprint, position);

  for (const record of records) {
    if (!record || record.deleted || !record.position) continue;
    const otherFootprint = getFootprint(record.preset);
    const otherPolygon = toWorldPolygon(
      otherFootprint,
      record.group?.position ?? record.position,
      record.group?.userData?.pose?.rotation?.y ?? record.group?.rotation?.y ?? 0,
    );

    // Clearance scales with the actual size of both objects (3.5% of their
    // combined footprint radii), rather than one scene-wide fixed distance.
    const clearance = (footprint.radius + otherFootprint.radius) * 0.035;
    if (polygonsOverlapWithClearance(candidatePolygon, otherPolygon, clearance)) {
      blockers.push(record);
    }
  }

  return { valid: blockers.length === 0, blockers };
}

/** Create a temporary visual copy while reusing the existing model geometry. */
export function createPlacementGhost(THREE, sourceGroup, footprint) {
  const group = new THREE.Group();
  group.name = 'Temporary beaker placement preview';
  group.userData.isPlacementPreview = true;

  // Clone the complete object hierarchy so the centered rotation pivot and all
  // real glass geometry transforms are preserved in the preview.
  const modelClone = sourceGroup.clone(true);
  const ghostMaterial = new THREE.MeshBasicMaterial({
    color: 0x47e6b4,
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
  });

  const removeMeshes = [];
  modelClone.traverse((node) => {
    if (!node.isMesh) return;
    if (node.geometry?.type === 'RingGeometry') {
      removeMeshes.push(node);
      return;
    }
    node.material = ghostMaterial;
    node.castShadow = false;
    node.receiveShadow = false;
    node.renderOrder = Math.max(8, (node.renderOrder ?? 0) + 8);
  });
  for (const node of removeMeshes) node.removeFromParent();
  group.add(modelClone);

  const shape = new THREE.Shape();
  footprint.points.forEach((point, index) => {
    if (index === 0) shape.moveTo(point.x, point.z);
    else shape.lineTo(point.x, point.z);
  });
  shape.closePath();

  const footprintFillGeometry = new THREE.ShapeGeometry(shape, 1);
  const footprintFillMaterial = new THREE.MeshBasicMaterial({
    color: 0x47e6b4,
    transparent: true,
    opacity: 0.105,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  const footprintFill = new THREE.Mesh(footprintFillGeometry, footprintFillMaterial);
  footprintFill.rotation.x = Math.PI / 2;
  footprintFill.position.y = 0.012;
  footprintFill.renderOrder = 7;
  group.add(footprintFill);

  const outlinePoints = footprint.points.map((point) => new THREE.Vector3(point.x, 0.022, point.z));
  const outlineGeometry = new THREE.BufferGeometry().setFromPoints(outlinePoints);
  const outlineMaterial = new THREE.LineBasicMaterial({
    color: 0x47e6b4,
    transparent: true,
    opacity: 0.92,
    depthWrite: false,
    toneMapped: false,
  });
  const outline = new THREE.LineLoop(outlineGeometry, outlineMaterial);
  outline.renderOrder = 12;
  group.add(outline);

  return {
    group,
    setValidity(valid) {
      const color = valid ? 0x47e6b4 : 0xff4f58;
      ghostMaterial.color.setHex(color);
      footprintFillMaterial.color.setHex(color);
      outlineMaterial.color.setHex(color);
      ghostMaterial.opacity = valid ? 0.42 : 0.48;
      footprintFillMaterial.opacity = valid ? 0.105 : 0.16;
      outlineMaterial.opacity = 0.96;
    },
    dispose() {
      group.removeFromParent();
      footprintFillGeometry.dispose();
      outlineGeometry.dispose();
      ghostMaterial.dispose();
      footprintFillMaterial.dispose();
      outlineMaterial.dispose();
      group.clear();
    },
  };
}

/** Add a restrained ground-plane outline to identify an obstructing beaker. */
export function createBlockerFootprintHighlight(THREE, footprint) {
  const points = footprint.points.map((point) => new THREE.Vector3(point.x, 0.028, point.z));
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({
    color: 0xff4f58,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    toneMapped: false,
  });
  const outline = new THREE.LineLoop(geometry, material);
  outline.name = 'Placement blocker footprint highlight';
  outline.renderOrder = 13;

  return {
    object: outline,
    update(position, rotationY = 0) {
      outline.position.set(position.x, 0, position.z);
      outline.rotation.y = rotationY;
    },
    dispose() {
      outline.removeFromParent();
      geometry.dispose();
      material.dispose();
    },
  };
}
