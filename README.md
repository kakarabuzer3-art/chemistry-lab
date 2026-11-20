# Chemistry Beaker Lab · 3D

## Stack
- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Three.js 0.187 / WebGL canvas

## Existing laboratory systems
The original laboratory scene, beaker capacities, glass geometry, right-side control panel, inventory, selection, recycle bin, camera controls and placement preview are retained. The interactive engine remains in `src/lib/beaker-engine.js` as the Three.js compatibility layer.

## Beaker placement
- Pick & Place creates a temporary 3D ghost using the selected beaker's existing model geometry.
- The preview follows the pointer over the lab bench and shows green/cyan when valid or red when blocked.
- Collision footprints are built from the glass body, spout, rim and base, then compared using a convex-polygon Separating Axis Theorem test.
- Desktop confirms with a click; touch confirms on release. Escape cancels placement.

## Beaker handling and pouring
- Grab: click and drag a placed beaker. The camera orbit control is suspended while it is held.
- Rotate: press `R` to toggle rotation mode, then drag horizontally to yaw the beaker and vertically to tilt it. Press `R` again to leave rotation mode.
- Lift: press `Shift` to toggle automatic vertical lift. The target places the source's geometry-derived spout outlet just above the nearest receiver's rim, using both beakers' dimensions and a minimum clearance; the lift eases smoothly to its target.
- Pour: hold `Ctrl` while a receiver is aligned. Releasing `Ctrl` stops transfer. Mobile users get contextual Rotate, Lift, Hold to pour, Place and Cancel buttons while a beaker is held.
- Escape cancels a held manipulation and returns the beaker to its starting transform. Place commits it only at a clear bench position; otherwise it returns to its previous safe position.

## Liquid model and accuracy
- The first 250 mL sample beaker starts with 150 mL of water to make the transfer workflow immediately demonstrable. Newly placed beakers start empty.
- Select a beaker in Scene inventory, open its information panel, and set its Water volume (mL) to prepare a source or receiver.
- The visible liquid level is mapped from mL through an approximate internal vessel profile. During transfer, the same accepted amount is subtracted from the source and added to the receiver, clamped to both vessels' limits.
- The pouring outlet is derived from vertices of the actual formed-spout geometry and transformed through the beaker's world matrix. A ballistic gravity-arc approximation is tested against the receiver's inner opening and nearby beaker envelopes.
- The liquid mesh remains approximately gravity-level during handling and narrows visually as the vessel tilts; this is a visual approximation for moderate tilt, not a geometrically clipped free-surface solver. The stream is a procedural tube following a ballistic gravity arc. This is a deterministic educational approximation, not computational fluid dynamics (CFD), particle fluid simulation, or laboratory-validated metrology.
- Only water is currently modelled. Different liquid identities are not mixed; transfer into a non-empty incompatible liquid is blocked.

## Commands
- `npm install`
- `npm run dev`
- `npm run test:unit`
- `npm run build`
- `npm start`

## Automated tests
The dependency-free Node test suite covers fill-height monotonicity, volume conservation, full/empty/incompatible transfer guards, capacity-aware lift height, gravity-arc alignment, insufficient tilt and path blocking.
