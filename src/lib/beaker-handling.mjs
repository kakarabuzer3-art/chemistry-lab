/**
 * Real-time beaker handling and liquid-transfer helpers.
 *
 * The liquid transfer is a deterministic volume model. The visible stream is a
 * gravity-arc approximation; this is not a computational-fluid-dynamics solver.
 */

export const WATER_LIQUID = Object.freeze({
  id: 'water',
  label: 'Water',
  color: 0x63c8ee,
  densityKgPerL: 1,
});

const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));

function internalRadiusAt(preset, normalizedHeight) {
  const radius = (preset.diameterMm / 2) * 0.012;
  const height = preset.heightMm * 0.012;
  const y = normalizedHeight * height;
  const lowerWallY = height * 0.14;
  const upperWallY = height * 0.91;
  const lowerRadius = radius * 0.82;
  const wallRadius = radius * 0.965;

  if (y <= height * 0.095) return 0;
  if (y < lowerWallY) {
    const amount = clamp((y - height * 0.095) / (lowerWallY - height * 0.095), 0, 1);
    return lowerRadius + (wallRadius - lowerRadius) * amount;
  }
  if (y <= upperWallY) return wallRadius;
  const amount = clamp((y - upperWallY) / (height * 0.045), 0, 1);
  return wallRadius * (1 - amount * 0.12);
}

function integrateInternalVolume(preset, maximumNormalizedHeight) {
  const height = preset.heightMm * 0.012;
  const segments = 96;
  let volume = 0;
  let previousY = height * 0.095;
  let previousRadius = internalRadiusAt(preset, previousY / height);

  for (let index = 1; index <= segments; index += 1) {
    const normalizedY = 0.095 + (maximumNormalizedHeight - 0.095) * (index / segments);
    const y = normalizedY * height;
    const radius = internalRadiusAt(preset, normalizedY);
    const deltaY = y - previousY;
    volume += (Math.PI * deltaY / 3) * (
      previousRadius * previousRadius + previousRadius * radius + radius * radius
    );
    previousY = y;
    previousRadius = radius;
  }

  return volume;
}

/** Convert nominal volume to an internal geometric fill height. */
export function calculateLiquidFillHeight(preset, volumeMl) {
  const height = preset.heightMm * 0.012;
  const minimumNormalizedHeight = 0.095;
  const maximumNormalizedHeight = 0.955;
  const maximumGeometricVolume = integrateInternalVolume(preset, maximumNormalizedHeight);
  const targetFraction = clamp(Number(volumeMl) / Math.max(1, preset.capacityMl), 0, 1);
  const targetVolume = maximumGeometricVolume * targetFraction;
  let low = minimumNormalizedHeight;
  let high = maximumNormalizedHeight;

  for (let iteration = 0; iteration < 24; iteration += 1) {
    const middle = (low + high) / 2;
    if (integrateInternalVolume(preset, middle) < targetVolume) low = middle;
    else high = middle;
  }

  return height * ((low + high) / 2);
}

/**
 * Apply a conserved transfer to two beakers. Each side is clamped to its
 * physical limits; the exact accepted amount is removed from the source.
 */
export function transferLiquidVolume(source, receiver, requestedMl) {
  if (!source || !receiver || source === receiver || requestedMl <= 0) return 0;
  if (!source.liquidType || source.liquidVolumeMl <= 0) return 0;
  if (receiver.liquidVolumeMl > 0 && receiver.liquidType !== source.liquidType) return 0;

  const available = Math.max(0, source.liquidVolumeMl);
  const freeCapacity = Math.max(0, receiver.preset.capacityMl - receiver.liquidVolumeMl);
  const accepted = Math.min(available, freeCapacity, Math.max(0, requestedMl));
  if (accepted <= 0) return 0;

  source.liquidVolumeMl = Math.max(0, available - accepted);
  receiver.liquidVolumeMl = Math.min(receiver.preset.capacityMl, receiver.liquidVolumeMl + accepted);
  if (receiver.liquidVolumeMl > 0 && !receiver.liquidType) receiver.liquidType = source.liquidType;
  return accepted;
}

const vector = (x, y, z) => ({ x, y, z });
const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;
const length = (v) => Math.hypot(v.x, v.y, v.z);
const normalize = (v) => {
  const magnitude = length(v) || 1;
  return vector(v.x / magnitude, v.y / magnitude, v.z / magnitude);
};

function pointOnTrajectory(outlet, velocity, time, gravity) {
  return vector(
    outlet.x + velocity.x * time,
    outlet.y + velocity.y * time - 0.5 * gravity * time * time,
    outlet.z + velocity.z * time,
  );
}

function pathBlocked(points, obstacles, streamRadius) {
  for (const obstacle of obstacles ?? []) {
    const radius = Math.max(0, obstacle.radius - streamRadius * 0.5);
    for (let index = 1; index < points.length - 1; index += 1) {
      const point = points[index];
      if (point.y < obstacle.bottomY || point.y > obstacle.topY) continue;
      if (Math.hypot(point.x - obstacle.x, point.z - obstacle.z) < radius) return obstacle;
    }
  }
  return null;
}

/**
 * Predict the liquid stream from the actual world-space spout outlet and axis.
 * The path is ballistic and is checked against the receiver opening and other
 * vessel envelopes; it is a stable educational approximation, not CFD.
 */
export function calculatePourTrajectory({
  outlet,
  spoutDirection,
  opening,
  openingRadius,
  sourceHeight,
  streamRadius = 0.012,
  obstacles = [],
}) {
  if (!outlet || !spoutDirection || !opening) return { valid: false, reason: 'missing-geometry', points: [] };

  const direction = normalize(spoutDirection);
  const horizontalDirection = normalize(vector(direction.x, 0, direction.z));
  const horizontalToOpening = normalize(vector(opening.x - outlet.x, 0, opening.z - outlet.z));
  const directionAgreement = dot(horizontalDirection, horizontalToOpening);

  if (direction.y > -0.12) {
    return { valid: false, reason: 'tilt-spout-down', points: [], directionAgreement };
  }
  if (directionAgreement < 0.58) {
    return { valid: false, reason: 'turn-spout-toward-target', points: [], directionAgreement };
  }

  const verticalGap = outlet.y - opening.y;
  const maximumGap = Math.max(0.65, sourceHeight * 2.4);
  if (verticalGap < 0.045) return { valid: false, reason: 'raise-source', points: [], directionAgreement };
  if (verticalGap > maximumGap) return { valid: false, reason: 'lower-source', points: [], directionAgreement };

  const gravity = 9.81;
  const speed = 0.78;
  const velocity = vector(
    direction.x * speed,
    direction.y * speed - 0.12,
    direction.z * speed,
  );
  const discriminant = velocity.y * velocity.y + 2 * gravity * verticalGap;
  const flightTime = (velocity.y + Math.sqrt(discriminant)) / gravity;
  if (!Number.isFinite(flightTime) || flightTime <= 0) {
    return { valid: false, reason: 'invalid-trajectory', points: [], directionAgreement };
  }

  const points = Array.from({ length: 13 }, (_, index) =>
    pointOnTrajectory(outlet, velocity, flightTime * (index / 12), gravity),
  );
  const impact = points[points.length - 1];
  const missDistance = Math.hypot(impact.x - opening.x, impact.z - opening.z);
  const clearRadius = Math.max(0, openingRadius - streamRadius * 1.6);
  const blocker = pathBlocked(points, obstacles, streamRadius);

  if (blocker) {
    return { valid: false, reason: 'pour-path-blocked', points, impact, missDistance, blocker, flightTime, directionAgreement };
  }
  if (missDistance > clearRadius) {
    return { valid: false, reason: 'align-over-opening', points, impact, missDistance, flightTime, directionAgreement };
  }

  return { valid: true, reason: 'aligned', points, impact, missDistance, flightTime, directionAgreement };
}

/** Build the visible liquid volume mesh for an upright or mildly tilted vessel. */
export function createLiquidGeometry(THREE, preset, fillHeight) {
  const radius = (preset.diameterMm / 2) * 0.012;
  const height = preset.heightMm * 0.012;
  const bottomY = height * 0.095;
  const wallStartY = height * 0.14;
  const innerRadius = radius * 0.89;
  const actualFillHeight = clamp(fillHeight, bottomY + 0.002, height * 0.955);
  const points = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(innerRadius * 0.84, 0),
    new THREE.Vector2(innerRadius * 0.97, wallStartY - bottomY),
    new THREE.Vector2(innerRadius, Math.max(wallStartY + 0.002, actualFillHeight) - bottomY),
    new THREE.Vector2(0, Math.max(wallStartY + 0.002, actualFillHeight) - bottomY),
  ];
  const geometry = new THREE.LatheGeometry(points, 48);
  geometry.computeVertexNormals();
  return geometry;
}

/** Geometry-independent height target for a lifted source beaker. */
export function calculateAutomaticLiftHeight(sourcePreset, receiverPreset, receiverBaseY = 0) {
  const sourceHeight = sourcePreset.heightMm * 0.012;
  const sourceOutletHeight = sourceHeight * 1.12;

  if (!receiverPreset) {
    return Math.max(0.12, sourceHeight * 0.22);
  }

  const sourceRadius = (sourcePreset.diameterMm / 2) * 0.012;
  const receiverHeight = receiverPreset.heightMm * 0.012;
  const receiverRadius = (receiverPreset.diameterMm / 2) * 0.012;
  const rimClearance = Math.max(0.12, receiverHeight * 0.075, sourceRadius * 0.18, receiverRadius * 0.08);

  // The source group is positioned at its base. Place its actual spout outlet
  // just above the receiver rim instead of lifting the entire source by a
  // second full beaker height. Tall sources naturally use a smaller base lift.
  return Math.max(0.05, receiverBaseY + receiverHeight + rimClearance - sourceOutletHeight);
}

/** Create a smooth, low-poly tube for the predicted/active stream. */
export function createLiquidStream(THREE, trajectory, material) {
  if (!trajectory?.points?.length || trajectory.points.length < 2) return null;
  const curve = new THREE.CatmullRomCurve3(
    trajectory.points.map((point) => new THREE.Vector3(point.x, point.y, point.z)),
  );
  const geometry = new THREE.TubeGeometry(curve, 18, 0.009, 6, false);
  return new THREE.Mesh(geometry, material);
}
