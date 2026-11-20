import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateAutomaticLiftHeight,
  calculateLiquidFillHeight,
  calculatePourTrajectory,
  transferLiquidVolume,
} from '../src/lib/beaker-handling.mjs';

const beaker250 = { capacityMl: 250, diameterMm: 70, heightMm: 95 };
const beaker1L = { capacityMl: 1000, diameterMm: 105, heightMm: 145 };
const beaker5L = { capacityMl: 5000, diameterMm: 190, heightMm: 260 };

test('liquid height increases monotonically with volume and remains inside the vessel', () => {
  const low = calculateLiquidFillHeight(beaker250, 25);
  const middle = calculateLiquidFillHeight(beaker250, 125);
  const full = calculateLiquidFillHeight(beaker250, 250);
  assert.ok(low > 0);
  assert.ok(middle > low);
  assert.ok(full > middle);
  assert.ok(full < beaker250.heightMm * 0.012);
});

test('a 200 mL transfer conserves volume between two 1 L beakers', () => {
  const source = { liquidVolumeMl: 750, liquidType: 'water', preset: beaker1L };
  const receiver = { liquidVolumeMl: 250, liquidType: 'water', preset: beaker1L };
  const initialTotal = source.liquidVolumeMl + receiver.liquidVolumeMl;
  const transferred = transferLiquidVolume(source, receiver, 200);
  assert.equal(transferred, 200);
  assert.equal(source.liquidVolumeMl, 550);
  assert.equal(receiver.liquidVolumeMl, 450);
  assert.equal(source.liquidVolumeMl + receiver.liquidVolumeMl, initialTotal);
});

test('transfer clamps to receiver free capacity and leaves excess in the source', () => {
  const source = { liquidVolumeMl: 500, liquidType: 'water', preset: beaker1L };
  const receiver = { liquidVolumeMl: 900, liquidType: 'water', preset: beaker1L };
  const transferred = transferLiquidVolume(source, receiver, 250);
  assert.equal(transferred, 100);
  assert.equal(source.liquidVolumeMl, 400);
  assert.equal(receiver.liquidVolumeMl, 1000);
});

test('empty, incompatible, and full vessels reject transfer safely', () => {
  const emptySource = { liquidVolumeMl: 0, liquidType: 'water', preset: beaker1L };
  const fullReceiver = { liquidVolumeMl: 1000, liquidType: 'water', preset: beaker1L };
  assert.equal(transferLiquidVolume(emptySource, fullReceiver, 100), 0);
  assert.equal(emptySource.liquidVolumeMl, 0);
  assert.equal(fullReceiver.liquidVolumeMl, 1000);

  const source = { liquidVolumeMl: 300, liquidType: 'water', preset: beaker1L };
  const incompatible = { liquidVolumeMl: 50, liquidType: 'ethanol', preset: beaker1L };
  assert.equal(transferLiquidVolume(source, incompatible, 100), 0);
  assert.equal(source.liquidVolumeMl, 300);
  assert.equal(incompatible.liquidVolumeMl, 50);
});

test('automatic lift height adapts to source and receiving beaker dimensions', () => {
  const smallReceiverLift = calculateAutomaticLiftHeight(beaker250, beaker250);
  const largeReceiverLift = calculateAutomaticLiftHeight(beaker250, beaker5L);
  const largeSourceLift = calculateAutomaticLiftHeight(beaker5L, beaker5L);
  assert.ok(largeReceiverLift > smallReceiverLift);
  assert.ok(largeSourceLift < largeReceiverLift);
  assert.ok(smallReceiverLift >= 0.05);
});

test('pour trajectory accepts a gravity arc that enters the opening', () => {
  const result = calculatePourTrajectory({
    outlet: { x: 0, y: 2, z: 0 },
    spoutDirection: { x: 0, y: -0.4, z: 0.9165 },
    opening: { x: 0, y: 1, z: 0.3 },
    openingRadius: 0.18,
    sourceHeight: 1.1,
    streamRadius: 0.01,
  });
  assert.equal(result.valid, true);
  assert.equal(result.reason, 'aligned');
  assert.ok(result.points.length > 2);
  assert.ok(result.missDistance < 0.18);
});

test('pour trajectory rejects insufficient tilt and a blocked path', () => {
  const base = {
    outlet: { x: 0, y: 2, z: 0 },
    opening: { x: 0, y: 1, z: 0.3 },
    openingRadius: 0.18,
    sourceHeight: 1.1,
    streamRadius: 0.01,
  };
  const upright = calculatePourTrajectory({ ...base, spoutDirection: { x: 0, y: 0, z: 1 } });
  assert.equal(upright.valid, false);
  assert.equal(upright.reason, 'tilt-spout-down');

  const blocked = calculatePourTrajectory({
    ...base,
    spoutDirection: { x: 0, y: -0.4, z: 0.9165 },
    obstacles: [{ x: 0, z: 0.13, radius: 0.08, bottomY: 1.4, topY: 1.8 }],
  });
  assert.equal(blocked.valid, false);
  assert.equal(blocked.reason, 'pour-path-blocked');
});
