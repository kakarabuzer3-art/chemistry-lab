import * as e from "three";

import { buildBeakerFootprint, validateBeakerPlacement, createPlacementGhost, createBlockerFootprintHighlight } from "./beaker-placement.js";

import { WATER_LIQUID, calculateLiquidFillHeight, transferLiquidVolume, calculatePourTrajectory, createLiquidGeometry, calculateAutomaticLiftHeight, createLiquidStream } from "./beaker-handling.mjs";

import { OrbitControls as t } from "three/addons/controls/OrbitControls.js";

import { RoomEnvironment as n } from "three/addons/environments/RoomEnvironment.js";

(function () { let e = document.createElement(`link`).relList;
   if (e && e.supports && e.supports(`modulepreload`))
    return;
   for (let e of document.querySelectorAll(`link[rel="modulepreload"]`))
    n(e);
   new MutationObserver(e => { for (let t of e)
    if (t.type === `childList`)
        for (let e of t.addedNodes)
            e.tagName === `LINK` && e.rel === `modulepreload` && n(e);
     }).observe(document, { childList: !0, subtree: !0 });
   function t(e) { let t = {};
     return e.integrity && (t.integrity = e.integrity), e.referrerPolicy && (t.referrerPolicy = e.referrerPolicy), t.credentials = e.crossOrigin === `use-credentials` ? `include` : e.crossOrigin === `anonymous` ? `omit` : `same-origin`, t;
     } function n(e) { if (e.ep)
    return;
     e.ep = !0;
     let n = t(e);
     fetch(e.href, n);
     } })();

function r(t, n, r = 0) { let i = n * .15, a = n * .87, o = t + Math.max(.003, t * .008), s = [], c = [], l = [];
   for (let e = 0;
   e <= 2;
   e += 1) {
    let t = e / 2, n = a - (a - i) * t;
    
    for (let e = 0;
     e <= 48;
     e += 1) {
        let i = e / 48, a = r + (i - .5) * 1;
      
        s.push(Math.sin(a) * o, n, Math.cos(a) * o), c.push(i, 1 - t);
      
    }
} for (let e = 0;
   e < 2;
   e += 1)
    for (let t = 0;
   t < 48;
   t += 1) {
        let n = e * 49 + t, r = (e + 1) * 49 + t, i = n + 1, a = r + 1;
    
        l.push(n, r, i, r, a, i);
    
    } let u = new e.BufferGeometry;
   return u.setAttribute(`position`, new e.Float32BufferAttribute(s, 3)), u.setAttribute(`uv`, new e.Float32BufferAttribute(c, 2)), u.setIndex(l), u.computeVertexNormals(), u.computeBoundingSphere(), u;
   }
function i(t, n, r = 0) { let i = Math.max(.001, Number(t) || .001), a = Math.max(.001, Number(n) || .001), o = i * .18, s = new e.Shape;
   s.moveTo(-o * .78, i * .945), s.quadraticCurveTo(-o * .86, i * .995, -o * .48, i * 1.045), s.quadraticCurveTo(-o * .22, i * 1.09, 0, i * 1.12), s.quadraticCurveTo(o * .22, i * 1.09, o * .48, i * 1.045), s.quadraticCurveTo(o * .86, i * .995, o * .78, i * .945), s.quadraticCurveTo(0, i * .97, -o * .78, i * .945);
   let c = new e.ShapeGeometry(s, 12), l = c.getAttribute(`position`), u = Math.sin(r), d = Math.cos(r), f = u, p = d, m = d, h = -u;
   for (let t = 0;
   t < l.count;
   t += 1) {
    let n = l.getX(t), r = l.getY(t), o = a * (.98 - e.MathUtils.clamp((r - i * .945) / (i * .175), 0, 1) * .01);
    
    l.setXYZ(t, f * r + m * n, o, p * r + h * n);
    
} return c.computeVertexNormals(), c.computeBoundingBox(), c.computeBoundingSphere(), c;
   }
function a(t, n, r = 0) { let i = Math.max(.001, Number(t) || .001), a = Math.max(.001, Number(n) || .001), o = i * .18, s = Math.sin(r), c = Math.cos(r), l = Math.max(.0025, i * .008), u = (t, n, r) => new e.Vector3(s * n + c * t, a * r, c * n - s * t);
   return [-1, 1].map(t => { let n = new e.CatmullRomCurve3([u(t * o * .78, i * .95, .981), u(t * o * .72, i * 1.005, .978), u(t * o * .43, i * 1.065, .973), u(0, i * 1.12, .97)]), r = new e.TubeGeometry(n, 24, l, 6, !1);
     return r.computeBoundingBox(), r.computeBoundingSphere(), r;
     });
   }
function o(e, t) { return { x: t.x - e.x, z: t.z - e.z };
   }
function s(e, t) { return { x: e.x - t.x, z: e.z - t.z };
   }
var c = Object.freeze([{ capacityMl: 10, label: `10 mL`, diameterMm: 25, heightMm: 35, graduationMl: 1 }, { capacityMl: 25, label: `25 mL`, diameterMm: 30, heightMm: 45, graduationMl: 5 }, { capacityMl: 50, label: `50 mL`, diameterMm: 38, heightMm: 55, graduationMl: 5 }, { capacityMl: 100, label: `100 mL`, diameterMm: 48, heightMm: 70, graduationMl: 10 }, { capacityMl: 250, label: `250 mL`, diameterMm: 70, heightMm: 95, graduationMl: 25 }, { capacityMl: 500, label: `500 mL`, diameterMm: 85, heightMm: 115, graduationMl: 50 }, { capacityMl: 1e3, label: `1 L`, diameterMm: 105, heightMm: 145, graduationMl: 100 }, { capacityMl: 2e3, label: `2 L`, diameterMm: 130, heightMm: 185, graduationMl: 200 }, { capacityMl: 5e3, label: `5 L`, diameterMm: 190, heightMm: 260, graduationMl: 500 }, { capacityMl: 1e4, label: `10 L`, diameterMm: 230, heightMm: 320, graduationMl: 1e3 }].map(e => Object.freeze(e))), l = .012;

function d(e) { return c.find(t => t.capacityMl === Number(e)) ?? null;
   }
function f(e) { let t = Number(e);
   return !Number.isFinite(t) || t <= 0 ? `—` : t >= 1e3 && t % 1e3 == 0 ? `${t / 1e3} L` : `${t.toLocaleString(`en-US`)} mL`;
   }
function p(e) { return e.diameterMm / 2 * l;
   }
function m(e) { return p(e) * 1.12;
   }
var v = e => document.querySelector(e), y = v(`#scene`), b = v(`#control-panel`), x = v(`#scene-loading`), S = v(`#scene-status-text`), C = v(`#capacity-select`), w = v(`#capacity-info`), T = v(`#add-beaker`), ee = v(`#place-beaker-title`), te = v(`#place-beaker-hint`), ne = v(`#place-beaker-state`), E = v(`#capacity-details`), re = v(`#inventory-list`), ie = v(`#recycle-list`), D = v(`#recycle-drawer`), O = v(`#drag-ghost`), k = v(`#toast`), A = new Map, j = new Map, M = new Map, ae = 1, N = null, P = null, F = !1, oe = null, I, L, R, z, B, V, se, H = window.matchMedia(`(prefers-reduced-motion: reduce)`).matches, ce = 1.75;

let placementFootprints = new Map, placementGhost = null, placementPreset = null, placementPosition = null, placementValid = !1, placementTouchId = null, placementBlockerHighlights = new Map, heldState = null, rotationActive = !1, pourRequested = !1, pourTarget = null, pourTrajectory = null, pourStream = null, pourStreamMaterial = null, receiverRing = null, receiverRingRecord = null, nextAlignmentAt = 0, lastPhysicsFrame = performance.now(), lastUiVolumeAt = 0, lastStreamUpdateAt = 0;

function le() { I = new e.WebGLRenderer({ antialias: !0, alpha: !1, powerPreference: `high-performance` }), I.setPixelRatio(Math.min(window.devicePixelRatio || 1, ce)), I.setSize(y.clientWidth, y.clientHeight, !1), I.outputColorSpace = e.SRGBColorSpace, I.toneMapping = e.ACESFilmicToneMapping, I.toneMappingExposure = 1.12, I.shadowMap.enabled = !0, I.shadowMap.type = e.PCFSoftShadowMap, I.domElement.setAttribute(`aria-label`, `3D beaker scene. Drag a beaker to move it, or drag empty space to orbit the camera.`), y.prepend(I.domElement);
   }
function ue() { z = new e.Scene, z.background = new e.Color(`#0d1312`), z.fog = new e.FogExp2(`#0d1312`, .009);
   let t = new e.HemisphereLight(14282471, 1845284, 1.65);
   z.add(t);
   let r = new e.DirectionalLight(15794167, 3.1);
   r.position.set(-5, 10, 7), r.castShadow = !0, r.shadow.mapSize.set(2048, 2048), r.shadow.camera.left = -24, r.shadow.camera.right = 24, r.shadow.camera.top = 24, r.shadow.camera.bottom = -24, r.shadow.bias = -25e-5, z.add(r);
   let i = new e.DirectionalLight(10145220, 2);
   i.position.set(8, 6, -7), z.add(i);
   let a = new e.PointLight(11982535, 24, 32, 2);
   a.position.set(1, 4, 4), z.add(a);
   let o = new e.Mesh(new e.PlaneGeometry(600, 600), new e.MeshStandardMaterial({ color: 1120791, roughness: .92, metalness: .08 }));
   o.rotation.x = -Math.PI / 2, o.position.y = -.018, o.receiveShadow = !0, z.add(o);
   let s = new e.GridHelper(100, 100, 5335904, 2504751);
   s.position.y = -.008, s.material.transparent = !0, s.material.opacity = .23, z.add(s);
   try {
    let t = new e.PMREMGenerator(I), r = new n, i = t.fromScene(r, .04).texture;
    
    z.environment = i, r.dispose?.(), t.dispose();
    
}
catch (e) {
    console.warn(`Environment map could not be generated; continuing with direct lighting.`, e);
    
} }
function de() { L = new e.PerspectiveCamera(38, y.clientWidth / Math.max(1, y.clientHeight), .05, 800), L.position.set(7.8, 6.2, 9.7), R = new t(L, I.domElement), R.enableDamping = !0, R.dampingFactor = .065, R.enablePan = !0, R.enableRotate = !0, R.enableZoom = !0, R.minDistance = 2.4, R.maxDistance = 180, R.maxPolarAngle = Math.PI * .485, R.target.set(0, .48, 0), R.update();
   }
function fe(t) { let n = document.createElement(`canvas`);
   n.width = 512, n.height = 1024;
   let r = n.getContext(`2d`);
   r.clearRect(0, 0, n.width, n.height), r.textBaseline = `middle`, r.lineCap = `round`, r.lineJoin = `round`, r.shadowColor = `rgba(3, 11, 10, .98)`, r.shadowBlur = 7, r.shadowOffsetX = 1, r.shadowOffsetY = 1;
   let i = Math.max(0, Math.min(1, Math.log2(t.capacityMl / 10) / 10)), a = Math.round(68 - i * 17);
   for (let e = 1;
   e <= 10;
   e += 1) {
    let n = 110 + (10 - e) / 10 * 770, i = e % 2 == 0 || e === 10, o = i ? 438 : 360;
    
    if (r.beginPath(), r.moveTo(222, n), r.lineTo(o, n), r.strokeStyle = i ? `#FFD166` : `#F1FAF7`, r.lineWidth = i ? 9 : 6, r.stroke(), i) {
        let i = Math.round(t.capacityMl * e / 10), o = i >= 1e3 && i % 1e3 == 0 ? String(i / 1e3) + `L` : String(i);
      
        r.textAlign = `right`, r.font = `800 ` + a + `px Inter, Arial, sans-serif`, r.lineWidth = 7, r.strokeStyle = `rgba(4, 13, 12, .96)`, r.strokeText(o, 202, n), r.fillStyle = `#FFF2C9`, r.fillText(o, 202, n);
      
    }
} r.textAlign = `right`, r.font = `800 38px Inter, Arial, sans-serif`, r.lineWidth = 7, r.strokeStyle = `rgba(4, 13, 12, .96)`, r.strokeText(t.label.toUpperCase(), 438, 960), r.fillStyle = `#9FE7D1`, r.fillText(t.label.toUpperCase(), 438, 960), r.shadowBlur = 0;
   let o = new e.CanvasTexture(n);
   return o.colorSpace = e.SRGBColorSpace, o.anisotropy = Math.min(8, I.capabilities.getMaxAnisotropy()), o;
   }
function findSpoutOutlet(geometry) { let position = geometry.getAttribute(`position`), maximumRadius = 0;
   for (let index = 0;
   index < position.count;
   index += 1)
    maximumRadius = Math.max(maximumRadius, Math.hypot(position.getX(index), position.getZ(index)));
   let x = 0, y = 0, z = 0, count = 0, tolerance = Math.max(1e-5, maximumRadius * 1e-4);
   for (let index = 0;
   index < position.count;
   index += 1) {
    let px = position.getX(index), py = position.getY(index), pz = position.getZ(index);
    
    if (maximumRadius - Math.hypot(px, pz) <= tolerance) {
        x += px, y += py, z += pz, count += 1;
      
    }
} let outlet = new e.Vector3(x / Math.max(1, count), y / Math.max(1, count), z / Math.max(1, count)), direction = new e.Vector3(outlet.x, 0, outlet.z).normalize();
   return { point: outlet, direction };
   }
function pe(t) { if (M.has(t.capacityMl))
    return M.get(t.capacityMl);
   let n = p(t), o = t.heightMm * l, s = Math.max(.012, n * .035), c = [new e.Vector2(0, o * .045), new e.Vector2(n * .84, o * .045), new e.Vector2(n * .96, o * .06), new e.Vector2(n, o * .105), new e.Vector2(n, o * .88), new e.Vector2(n * 1.025, o * .945), new e.Vector2(n * 1.028, o * .98), new e.Vector2(n * .985, o * .98), new e.Vector2(n * .965, o * .94), new e.Vector2(n - s, o * .14), new e.Vector2(n * .82, o * .095), new e.Vector2(0, o * .095)], u = new e.LatheGeometry(c, 72);
   u.computeVertexNormals();
   let d = new e.MeshPhysicalMaterial({ color: 12181719, metalness: 0, roughness: .105, transmission: .88, thickness: .12, ior: 1.47, transparent: !0, opacity: .48, depthWrite: !1, side: e.DoubleSide, envMapIntensity: 1.25, clearcoat: .44, clearcoatRoughness: .13 }), f = new e.MeshPhysicalMaterial({ color: 14743277, metalness: 0, roughness: .1, transmission: .74, thickness: .05, ior: 1.47, transparent: !0, opacity: .76, depthWrite: !1, side: e.DoubleSide, envMapIntensity: 1.5, clearcoat: .6 }), m = Math.atan2(L.position.x, L.position.z), h = .5, g = new e.TorusGeometry(n * .985, Math.max(.009, n * .027), 12, 72, Math.PI * 2 - h), _ = Math.PI * 2 - h / 2, v = Math.PI / 2 - m;
   g.rotateZ(v - _);
   let y = new e.TorusGeometry(n * .91, Math.max(.012, n * .038), 12, 72), b = fe(t), x = r(n, o, m), S = i(n, o, m), C = a(n, o, m), w = { radius: n, height: o, glassGeometry: u, glassMaterial: d, edgeMaterial: f, rimGeometry: g, baseGeometry: y, labelMaterial: new e.MeshBasicMaterial({ map: b, color: 16777215, transparent: !0, alphaTest: .025, depthWrite: !1, depthTest: !0, side: e.DoubleSide, toneMapped: !1, polygonOffset: !0, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }), labelGeometry: x, spoutGeometry: S, spoutEdgeGeometries: C, outlet: findSpoutOutlet(S), selectionGeometry: new e.RingGeometry(1, 1.13, 64), selectionMaterial: new e.MeshBasicMaterial({ color: 10347727, transparent: !0, opacity: .82, side: e.DoubleSide, depthWrite: !1 }) };
   return M.set(t.capacityMl, w), w;
   }
function me(t, n) { let model = pe(t), group = new e.Group;
   group.name = `Beaker ${n} · ${t.label}`, group.userData.beakerId = n, group.userData.capacityMl = t.capacityMl;
   let body = new e.Mesh(model.glassGeometry, model.glassMaterial);
   body.castShadow = !0, body.receiveShadow = !0, body.renderOrder = 2, body.userData.beakerId = n, group.add(body);
   let rim = new e.Mesh(model.rimGeometry, model.edgeMaterial);
   rim.rotation.x = Math.PI / 2, rim.position.y = model.height * .98, rim.castShadow = !0, rim.renderOrder = 3, rim.userData.beakerId = n, group.add(rim);
   let base = new e.Mesh(model.baseGeometry, model.edgeMaterial);
   base.rotation.x = Math.PI / 2, base.position.y = model.height * .075, base.renderOrder = 3, base.userData.beakerId = n, group.add(base);
   let spout = new e.Mesh(model.spoutGeometry, model.edgeMaterial);
   spout.name = `Functional formed-glass pouring lip`, spout.renderOrder = 3.5, spout.userData.beakerId = n, group.add(spout), model.spoutEdgeGeometries.forEach((geometry, index) => { let edge = new e.Mesh(geometry, model.edgeMaterial);
     edge.name = index === 0 ? `Left raised pouring lip edge` : `Right raised pouring lip edge`, edge.renderOrder = 4, edge.userData.beakerId = n, group.add(edge);
     });
   let label = new e.Mesh(model.labelGeometry, model.labelMaterial);
   label.name = `Graduations printed on glass surface`, label.renderOrder = 5, label.userData.beakerId = n, group.add(label);
   let selection = new e.Mesh(model.selectionGeometry, model.selectionMaterial);
   selection.rotation.x = -Math.PI / 2, selection.scale.set(model.radius * 1.1, model.radius * 1.1, 1), selection.position.y = .006, selection.visible = !1, selection.renderOrder = 1, selection.userData.beakerId = n, group.add(selection);
   group.traverse(child => { child.isMesh && (child.userData.beakerId = n);
     });
   let pose = new e.Group;
   pose.name = `Beaker center rotation pivot`, pose.position.y = model.height * .5;
   for (let child of [...group.children])
    child.position.y -= model.height * .5, pose.add(child);
   group.add(pose);
   group.userData.pose = pose, group.userData.selectionMesh = selection, group.userData.outletMesh = spout, group.userData.outletPoint = model.outlet.point.clone(), group.userData.outletDirection = model.outlet.direction.clone();
   return group;
   }
function getPlacementFootprint(preset) { let cached = placementFootprints.get(preset.capacityMl);
   if (cached)
    return cached;
   let footprint = buildBeakerFootprint(e, pe(preset));
   placementFootprints.set(preset.capacityMl, footprint);
   return footprint;
   }
function updateBlockerHighlights(blockers) { let nextIds = new Set(blockers.map(record => record.id));
   for (let [id, highlight] of placementBlockerHighlights)
    if (!nextIds.has(id)) {
        highlight.dispose(), placementBlockerHighlights.delete(id);
    
    } for (let record of blockers) {
    let highlight = placementBlockerHighlights.get(record.id);
    
    if (!highlight) {
        highlight = createBlockerFootprintHighlight(e, getPlacementFootprint(record.preset));
      
        placementBlockerHighlights.set(record.id, highlight), z.add(highlight.object);
      
    }
    highlight.update(record.group?.position ?? record.position, record.group?.userData?.pose?.rotation?.y ?? record.group?.rotation?.y ?? 0);
    
} }
function clearBlockerHighlights() { for (let highlight of placementBlockerHighlights.values())
    highlight.dispose();
   placementBlockerHighlights.clear();
   }
function canPlaceAt(preset, position, records = U()) { return validateBeakerPlacement({ footprint: getPlacementFootprint(preset), position, records, getFootprint: getPlacementFootprint });
   }
function findFreePlacementPosition(preset, records = U()) { let footprint = getPlacementFootprint(preset), step = Math.max(.08, footprint.radius * 1.18), goldenAngle = Math.PI * (3 - Math.sqrt(5));
   for (let index = 0;
   index < 12000;
   index += 1) {
    let radius = step * Math.sqrt(index), angle = index * goldenAngle, position = { x: Math.cos(angle) * radius, z: Math.sin(angle) * radius };
    
    if (canPlaceAt(preset, position, records).valid)
        return position;
    
} let rightMost = records.reduce((maximum, record) => Math.max(maximum, record.position.x + getPlacementFootprint(record.preset).radius), 0);
   return { x: rightMost + footprint.radius * 2.5, z: 0 };
   }
function disposePlacementPreview() { if (placementGhost) {
    placementGhost.dispose();
    
    placementGhost = null;
    
} clearBlockerHighlights();
   placementPreset = null;
   placementPosition = null;
   placementValid = !1;
   placementTouchId = null;
   }
function createPlacementPreview(preset, position = placementPosition) { disposePlacementPreview();
   if (!preset)
    return;
   placementPreset = preset;
   placementPosition = position ? { x: position.x, z: position.z } : { x: R.target.x, z: R.target.z };
   let footprint = getPlacementFootprint(preset), source = me(preset, `PLACEMENT-PREVIEW`);
   placementGhost = createPlacementGhost(e, source, footprint);
   source.clear();
   placementGhost.group.position.set(placementPosition.x, 0, placementPosition.z);
   z.add(placementGhost.group);
   let result = canPlaceAt(preset, placementPosition, U());
   placementValid = result.valid;
   placementGhost.setValidity(placementValid);
   updateBlockerHighlights(result.blockers);
   S.textContent = placementValid ? `PLACEMENT VALID` : `PLACEMENT BLOCKED · ${result.blockers.length}`;
   }
function updatePlacementPreviewFromPointer(event) { if (!F || !placementGhost || !placementPreset)
    return !1;
   let rect = I.domElement.getBoundingClientRect();
   if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) {
    placementGhost.group.visible = !1;
    
    placementValid = !1;
    
    clearBlockerHighlights();
    
    S.textContent = `MOVE OVER LAB`;
    
    return !1;
    
} let point = De(event, new e.Plane(new e.Vector3(0, 1, 0), 0));
   if (!point) {
    placementGhost.group.visible = !1;
    
    placementValid = !1;
    
    clearBlockerHighlights();
    
    S.textContent = `MOVE OVER LAB`;
    
    return !1;
    
} placementPosition = { x: point.x, z: point.z };
   placementGhost.group.visible = !0;
   placementGhost.group.position.set(point.x, 0, point.z);
   let result = canPlaceAt(placementPreset, placementPosition, U());
   placementValid = result.valid;
   placementGhost.setValidity(placementValid);
   updateBlockerHighlights(result.blockers);
   S.textContent = placementValid ? `PLACEMENT VALID` : `BLOCKED · ${result.blockers.length} ${result.blockers.length === 1 ? `BEAKER` : `BEAKERS`}`;
   return !0;
   }
function commitPlacementAtPreview() { if (!F || !placementGhost || !placementPreset || !placementPosition || !placementGhost.group.visible)
    return !1;
   let result = canPlaceAt(placementPreset, placementPosition, U());
   placementValid = result.valid;
   placementGhost.setValidity(placementValid);
   updateBlockerHighlights(result.blockers);
   if (!result.valid) {
    Q(`Red preview: collision detected. Move the beaker to a green area.`);
    
    return !1;
    
} let record = W(placementPreset.capacityMl, { position: { x: placementPosition.x, z: placementPosition.z }, frame: !1 });
   if (!record) {
    Q(`That position is no longer available. Move the beaker and try again.`);
    
    return !1;
    
} $(!1);
   return !0;
   }
function moveBeakerWithoutCollision(record, target, records) { if (canPlaceAt(record.preset, target, records).valid)
    return target;
   let start = { x: record.position.x, z: record.position.z }, dx = target.x - start.x, dz = target.z - start.z, low = 0, high = 1;
   for (let index = 0;
   index < 22;
   index += 1) {
    let middle = (low + high) / 2, candidate = { x: start.x + dx * middle, z: start.z + dz * middle };
    
    if (canPlaceAt(record.preset, candidate, records).valid)
        low = middle;
    
    else
        high = middle;
    
} return { x: start.x + dx * low, z: start.z + dz * low };
   }
function createLiquidVisual(record) { let material = new e.MeshPhysicalMaterial({ color: WATER_LIQUID.color, roughness: .14, metalness: 0, transparent: !0, opacity: .76, depthWrite: !1, side: e.DoubleSide, clearcoat: .85, clearcoatRoughness: .08, envMapIntensity: .8 });
   let geometry = createLiquidGeometry(e, record.preset, calculateLiquidFillHeight(record.preset, record.liquidVolumeMl));
   let mesh = new e.Mesh(geometry, material);
   mesh.name = `${WATER_LIQUID.label} volume · ${record.id}`, mesh.userData.beakerId = record.id, mesh.renderOrder = 1.7, mesh.frustumCulled = !1, record.group.add(mesh), record.liquidMesh = mesh, record.liquidMaterial = material, record.lastLiquidVolumeMl = -1, record.lastLiquidVisualAt = 0, updateLiquidVisual(record, !0);
   }
function updateLiquidVisual(record, force = !1) { if (!record?.liquidMesh)
    return;
   let now = performance.now();
   if (!force && now - record.lastLiquidVisualAt < 45)
    return;
   let model = pe(record.preset), fillHeight = calculateLiquidFillHeight(record.preset, record.liquidVolumeMl), volumeChanged = force || Math.abs(record.liquidVolumeMl - record.lastLiquidVolumeMl) >= .35;
   if (volumeChanged) {
    let geometry = createLiquidGeometry(e, record.preset, fillHeight), old = record.liquidMesh.geometry;
    
    record.liquidMesh.geometry = geometry, old?.dispose(), record.lastLiquidVolumeMl = record.liquidVolumeMl;
    
} let pose = record.group.userData.pose, beakerHeight = model.height, bottomY = beakerHeight * .095, localBase = new e.Vector3(0, bottomY - beakerHeight * .5, 0);
   record.group.updateWorldMatrix(!0, !0), pose.updateWorldMatrix(!0, !1);
   let worldBase = pose.localToWorld(localBase);
   record.group.worldToLocal(worldBase), record.liquidMesh.position.copy(worldBase), record.liquidMesh.quaternion.copy(record.group.getWorldQuaternion(new e.Quaternion()).invert());
   let up = new e.Vector3(0, 1, 0).applyQuaternion(pose.getWorldQuaternion(new e.Quaternion())).normalize(), tilt = Math.acos(e.MathUtils.clamp(up.y, -1, 1)), shrink = e.MathUtils.clamp(1 - tilt * .5, .58, 1);
   record.liquidMesh.scale.set(shrink, 1, shrink), record.liquidMesh.visible = record.liquidVolumeMl > .05, record.lastLiquidVisualAt = now;
   }
function setLiquidVolume(record, value) { if (!record)
    return;
   record.liquidVolumeMl = e.MathUtils.clamp(Number(value) || 0, 0, record.preset.capacityMl);
   record.liquidType = record.liquidVolumeMl > 0 ? (record.liquidType || WATER_LIQUID.id) : record.liquidType, updateLiquidVisual(record, !0), syncLiquidControls(record), Y();
   }
function syncLiquidControls(record = A.get(N)) { let input = v(`#liquid-volume-input`), label = v(`#liquid-volume-label`), button = v(`#apply-liquid-volume`);
   if (!input || !label || !button)
    return;
   if (!record) {
    input.value = `0`, input.max = `0`, input.disabled = !0, button.disabled = !0, label.textContent = `Select a beaker`;
    
    return;
    
} input.max = String(record.preset.capacityMl), input.value = String(Math.round(record.liquidVolumeMl)), input.disabled = !1, button.disabled = !1, label.textContent = `${f(record.liquidVolumeMl)} / ${f(record.preset.capacityMl)} · ${record.liquidType === WATER_LIQUID.id ? WATER_LIQUID.label : `Empty`}`;
   }
function clearReceiverRing() { if (receiverRing) {
    receiverRing.removeFromParent(), receiverRing.geometry.dispose(), receiverRing.material.dispose(), receiverRing = null;
    
} receiverRingRecord = null;
   }
function highlightReceiver(record, valid) { if (!record) {
    clearReceiverRing();
    
    return;
    
} if (receiverRingRecord !== record) {
    clearReceiverRing();
    
    let radius = pe(record.preset).radius * .86;
    
    receiverRing = new e.Mesh(new e.RingGeometry(radius * .94, radius * 1.035, 64), new e.MeshBasicMaterial({ color: valid ? 0x48dca9 : 0xff5964, transparent: !0, opacity: .88, depthWrite: !1, side: e.DoubleSide, toneMapped: !1 }));
    
    receiverRing.name = `Pour target opening indicator`, receiverRing.rotation.x = -Math.PI / 2, receiverRing.position.y = pe(record.preset).height * .982, receiverRing.renderOrder = 14, record.group.add(receiverRing), receiverRingRecord = record;
    
} receiverRing.material.color.setHex(valid ? 0x48dca9 : 0xff5964), receiverRing.visible = !0;
   }
function clearPourStream() { if (pourStream) {
    z.remove(pourStream), pourStream.geometry.dispose(), pourStream = null;
    
} if (pourStreamMaterial) {
    pourStreamMaterial.dispose(), pourStreamMaterial = null;
    
} }
function updatePourStream(trajectory, valid) { if (!trajectory?.points?.length || trajectory.points.length < 2) {
    clearPourStream();
    
    return;
    
} if (!pourStreamMaterial)
    pourStreamMaterial = new e.MeshPhysicalMaterial({ color: valid ? 0x75d8f3 : 0xff5964, transparent: !0, opacity: .78, roughness: .08, metalness: 0, clearcoat: .9, depthWrite: !1, side: e.DoubleSide });
   pourStreamMaterial.color.setHex(valid ? 0x75d8f3 : 0xff5964);
   let now = performance.now();
   if (pourStream && now - lastStreamUpdateAt < 55)
    return;
   let next = createLiquidStream(e, trajectory, pourStreamMaterial);
   if (!next)
    return;
   if (pourStream) {
    z.remove(pourStream), pourStream.geometry.dispose();
    
} pourStream = next, pourStream.name = `Gravity-based liquid transfer stream`, z.add(pourStream), lastStreamUpdateAt = now;
   }
function stopPouring() { pourRequested = !1, pourTarget = null, pourTrajectory = null, clearPourStream(), clearReceiverRing();
   }
function worldSpout(record) { let mesh = record.group.userData.outletMesh, pose = record.group.userData.pose;
   if (!mesh || !pose)
    return null;
   record.group.updateWorldMatrix(!0, !0);
   let point = mesh.localToWorld(record.group.userData.outletPoint.clone()), direction = record.group.userData.outletDirection.clone().applyQuaternion(pose.getWorldQuaternion(new e.Quaternion())).normalize();
   return { point, direction };
   }
function worldOpening(record) { let pose = record.group.userData.pose, height = pe(record.preset).height;
   record.group.updateWorldMatrix(!0, !0);
   return pose.localToWorld(new e.Vector3(0, height * .982 - height * .5, 0));
   }
function getPourCandidate(source) { let spout = worldSpout(source);
   if (!spout)
    return null;
   let candidates = [];
   for (let receiver of U()) {
    if (receiver.id === source.id)
        continue;
    
    let opening = worldOpening(receiver), horizontalDistance = Math.hypot(opening.x - spout.point.x, opening.z - spout.point.z), maxRange = Math.max(.85, (source.radiusWorld + receiver.radiusWorld) * 3.4);
    
    if (horizontalDistance > maxRange)
        continue;
    
    let obstacles = U().filter(record => record.id !== source.id && record.id !== receiver.id).map(record => ({ x: record.group.position.x, z: record.group.position.z, radius: record.radiusWorld, bottomY: record.group.position.y, topY: record.group.position.y + pe(record.preset).height }));
    
    let trajectory = calculatePourTrajectory({ outlet: { x: spout.point.x, y: spout.point.y, z: spout.point.z }, spoutDirection: { x: spout.direction.x, y: spout.direction.y, z: spout.direction.z }, opening: { x: opening.x, y: opening.y, z: opening.z }, openingRadius: pe(receiver.preset).radius * .86, sourceHeight: pe(source.preset).height, streamRadius: Math.max(.008, source.radiusWorld * .035), obstacles });
    
    let score = (trajectory.missDistance ?? horizontalDistance) + (trajectory.reason === `tilt-spout-down` ? .22 : 0) + (trajectory.reason === `turn-spout-toward-target` ? .35 : 0);
    
    candidates.push({ record: receiver, trajectory, score, valid: trajectory.valid });
    
} candidates.sort((a, b) => Number(b.valid) - Number(a.valid) || a.score - b.score);
   return candidates[0] ?? null;
   }
function nearestReceiver(source) { let best = null, bestDistance = Infinity;
   for (let record of U()) {
    if (record.id === source.id)
        continue;
    
    let distance = Math.hypot(record.position.x - source.position.x, record.position.z - source.position.z);
    
    if (distance < bestDistance) {
        best = record, bestDistance = distance;
      
    }
} return best;
   }
function refreshLiftTarget() { if (!heldState?.lifted)
    return;
   let receiver = nearestReceiver(heldState.record);
   heldState.receiverForLift = receiver;
   heldState.targetLiftY = calculateAutomaticLiftHeight(heldState.record.preset, receiver?.preset ?? null, receiver?.group.position.y ?? 0);
   }
function toggleLift() { if (!heldState)
    return;
   heldState.lifted = !heldState.lifted;
   if (heldState.lifted)
    refreshLiftTarget();
  
else
    heldState.targetLiftY = 0;
   v(`#handling-lift`)?.classList.toggle(`is-active`, heldState.lifted), v(`#handling-state`).textContent = heldState.lifted ? `LIFTED · Move above a receiver` : `HELD · Press Shift to lift`;
   Q(heldState.lifted ? `Beaker lifting automatically` : `Beaker lowered`);
   }
function setRotationMode(enabled) { if (!heldState || !P)
    return;
   rotationActive = !!enabled;
   heldState.rotationAnchor = { x: P.lastX ?? 0, y: P.lastY ?? 0, rotation: { x: heldState.pose.rotation.x, y: heldState.pose.rotation.y, z: heldState.pose.rotation.z } };
   v(`#handling-rotate`)?.classList.toggle(`is-active`, rotationActive), y.classList.toggle(`is-rotating`, rotationActive), v(`#handling-state`).textContent = rotationActive ? `ROTATION MODE · Drag to orient the spout` : (heldState.lifted ? `LIFTED · Move above a receiver` : `HELD · Move horizontally`);
   }
function releaseHeldBeaker(commit) { if (!heldState)
    return;
   let record = heldState.record;
   stopPouring();
   if (!commit) {
    record.group.position.copy(heldState.startPosition), record.position.x = heldState.startPosition.x, record.position.z = heldState.startPosition.z, heldState.pose.rotation.copy(heldState.startRotation);
    
}
else {
    record.group.position.y = 0, heldState.pose.rotation.x = 0, heldState.pose.rotation.z = 0;
    
    let otherRecords = U().filter(item => item.id !== record.id), candidate = { x: record.group.position.x, z: record.group.position.z };
    
    if (!canPlaceAt(record.preset, candidate, otherRecords).valid) {
        record.group.position.x = heldState.startPosition.x, record.group.position.z = heldState.startPosition.z, record.position.x = heldState.startPosition.x, record.position.z = heldState.startPosition.z, Q(`Beaker returned to its previous safe position`);
      
    }
    else {
        record.position.x = candidate.x, record.position.z = candidate.z;
      
    }
} P = null, heldState = null, rotationActive = !1, R.enabled = !0, y.classList.remove(`is-dragging`, `is-rotating`, `is-held`), O.classList.remove(`is-visible`), v(`#handling-controls`).hidden = !0, v(`#handling-rotate`)?.classList.remove(`is-active`), v(`#handling-lift`)?.classList.remove(`is-active`), updateLiquidVisual(record, !0), Y(), Z();
   }
function beginHolding(record, event, hitPoint) { G(record.id, { focus: !1, render: !1 });
   let point = { x: hitPoint.x, z: hitPoint.z }, offset = { x: point.x - record.group.position.x, z: point.z - record.group.position.z }, pose = record.group.userData.pose;
   P = { id: record.id, pointerId: event.pointerId, pointerType: event.pointerType, dragPlane: new e.Plane(new e.Vector3(0, 1, 0), 0), grabOffset: offset, moved: !1, lastX: event.clientX, lastY: event.clientY };
   heldState = { record, pose, startPosition: record.group.position.clone(), startRotation: pose.rotation.clone(), lifted: false, targetLiftY: 0, lastPointer: { x: event.clientX, y: event.clientY } };
   R.enabled = !1, y.classList.add(`is-dragging`, `is-held`), v(`#handling-controls`).hidden = !1, v(`#handling-state`).textContent = `HELD · R rotate · Shift lift · Ctrl pour · Esc cancel`;
   O.classList.add(`is-visible`), O.style.left = String(event.clientX) + `px`, O.style.top = String(event.clientY) + `px`;
   try {
    I.domElement.setPointerCapture(event.pointerId);
    
}
catch { } }
function updatePourFeedback(now) { if (!heldState)
    return;
   if (now < nextAlignmentAt)
    return;
   nextAlignmentAt = now + 55;
   let candidate = getPourCandidate(heldState.record);
   pourTarget = candidate?.record ?? null, pourTrajectory = candidate?.trajectory ?? null;
   highlightReceiver(pourTarget, !!candidate?.valid);
   if (!candidate) {
    v(`#handling-state`).textContent = `NO RECEIVER · Move the spout over another beaker`;
    
    return;
    
} let message = candidate.valid ? `ALIGNED · Hold Ctrl to pour` : candidate.trajectory.reason === `tilt-spout-down` ? `TILT SPOUT DOWN` : candidate.trajectory.reason === `turn-spout-toward-target` ? `TURN SPOUT TOWARD RECEIVER` : candidate.trajectory.reason === `raise-source` ? `LIFT SOURCE ABOVE THE RIM` : candidate.trajectory.reason === `lower-source` ? `LOWER SOURCE CLOSER` : candidate.trajectory.reason === `pour-path-blocked` ? `POUR PATH BLOCKED` : `ALIGN STREAM WITH OPENING`;
   v(`#handling-state`).textContent = message;
   }
function updateHandlingFrame(deltaTime, now) { if (!heldState)
    return;
   let state = heldState, record = state.record;
   if (state.lifted) {
    let nearest = nearestReceiver(record), newTarget = calculateAutomaticLiftHeight(record.preset, nearest?.preset ?? null, nearest?.group.position.y ?? 0);
    
    state.targetLiftY = e.MathUtils.lerp(state.targetLiftY, newTarget, .08);
    
    record.group.position.y = e.MathUtils.damp(record.group.position.y, state.targetLiftY, 5, deltaTime);
    
}
else
    record.group.position.y = e.MathUtils.damp(record.group.position.y, 0, 7, deltaTime);
   updateLiquidVisual(record);
   updatePourFeedback(now);
   if (pourRequested) {
    let candidate = pourTarget && pourTrajectory ? { record: pourTarget, trajectory: pourTrajectory, valid: pourTrajectory.valid } : null;
    
    if (candidate?.valid) {
        if (record.liquidVolumeMl <= 0) {
            stopPouring(), Q(`Source beaker is empty`);
        
            return;
        
        }
        if (candidate.record.liquidVolumeMl >= candidate.record.preset.capacityMl) {
            stopPouring(), Q(`Receiving beaker is full`);
        
            return;
        
        }
        if (candidate.record.liquidVolumeMl > 0 && candidate.record.liquidType !== record.liquidType) {
            stopPouring(), Q(`Different liquid types cannot be mixed in this transfer model`);
        
            return;
        
        }
        updatePourStream(candidate.trajectory, !0);
      
        let transferred = transferLiquidVolume(record, candidate.record, 120 * deltaTime);
      
        if (transferred > 0) {
            updateLiquidVisual(record), updateLiquidVisual(candidate.record);
        
            if (now - lastUiVolumeAt > 180) {
                lastUiVolumeAt = now;
          
                syncLiquidControls(N ? A.get(N) : record);
          
                Y();
          
            }
        }
        if (record.liquidVolumeMl <= .001) {
            record.liquidVolumeMl = 0, updateLiquidVisual(record, !0), stopPouring(), Q(`Source beaker is empty`);
        
        }
        else if (candidate.record.liquidVolumeMl >= candidate.record.preset.capacityMl - .001) {
            candidate.record.liquidVolumeMl = candidate.record.preset.capacityMl, updateLiquidVisual(candidate.record, !0), stopPouring(), Q(`Receiving beaker is full`);
        
        }
    }
    else {
        if (pourTrajectory?.points?.length > 1)
            updatePourStream(pourTrajectory, !1);
      
        else
            clearPourStream();
      
    }
}
else
    clearPourStream();
   }
function finishHoldFromButton() { releaseHeldBeaker(!0);
   }
function U() { return [...A.values()];
   }
function he() { let e = `B${String(ae).padStart(3, `0`)}`;
   return ae += 1, e;
   }
function W(capacity = C.value, options = {}) { let preset = d(capacity);
   if (!preset)
    return null;
   let radius = m(preset), records = U(), position = options.position ? { x: options.position.x, z: options.position.z } : findFreePlacementPosition(preset, records);
   if (!position || !canPlaceAt(preset, position, records).valid) {
    Q(`No valid placement area was found for this beaker.`);
    
    return null;
    
} let id = he(), group = me(preset, id);
   group.position.set(position.x, 0, position.z), group.userData.beakerId = id, z.add(group);
   let record = { id, preset, capacityMl: preset.capacityMl, radiusWorld: radius, position: { x: position.x, z: position.z }, group, deleted: !1, liquidVolumeMl: e.MathUtils.clamp(Number(options.volumeMl) || 0, 0, preset.capacityMl), liquidType: options.liquidType || WATER_LIQUID.id };
   A.set(id, record), createLiquidVisual(record), G(id, { focus: !1, render: !1 }), X(), options.frame !== !1 && K({ animate: !H }), Z(), Q(`${preset.label} beaker ${id} added`);
   return record;
   }
function G(id, { focus: focusCamera = !0, render: renderInventory = !0 } = {}) { N = A.has(id) ? id : null;
   for (let record of A.values()) {
    let selection = record.group.userData.selectionMesh;
    
    if (selection)
        selection.visible = record.id === N;
    
} if (N && focusCamera)
    ge(A.get(N));
   syncLiquidControls(A.get(N));
   if (renderInventory)
    X();
   }
function ge(t) { if (!t)
    return;
   let n = L.position.clone().sub(R.target), r = new e.Vector3(t.position.x, t.preset.heightMm * l * .38, t.position.z);
   if (n.length() < .1 && n.set(5, 4, 6), H) {
    R.target.copy(r), L.position.copy(r).add(n), R.update();
    
    return;
    
} let i = R.target.clone(), a = L.position.clone(), o = r.clone().add(n), s = performance.now(), c = e => 1 - (1 - e) ** 3, u = e => { let t = Math.min(1, (e - s) / 360), n = c(t);
     R.target.lerpVectors(i, r, n), L.position.lerpVectors(a, o, n), R.update(), t < 1 && requestAnimationFrame(u);
     };
   requestAnimationFrame(u);
   }
function K({ animate: t = !0 } = {}) { let n = U();
   if (!n.length) {
    (!t || H) && (R.target.set(0, .35, 0), R.update());
    
    return;
    
} let r = 1 / 0, i = -1 / 0, a = 1 / 0, o = -1 / 0, s = 0;
   for (let e of n)
    r = Math.min(r, e.position.x - e.radiusWorld), i = Math.max(i, e.position.x + e.radiusWorld), a = Math.min(a, e.position.z - e.radiusWorld), o = Math.max(o, e.position.z + e.radiusWorld), s = Math.max(s, e.preset.heightMm * l);
   let c = new e.Vector3((r + i) / 2, Math.max(.35, s * .25), (a + o) / 2), u = Math.max(i - r, o - a), d = Math.max(6.5, u * 1.45 + s * .55 + 3.4), f = new e.Vector3(.82, .62, 1.05).normalize(), p = c.clone().addScaledVector(f, d);
   if (!t || H) {
    R.target.copy(c), L.position.copy(p), L.lookAt(c), R.update();
    
    return;
    
} let m = R.target.clone(), h = L.position.clone(), g = performance.now(), _ = e => 1 - (1 - e) ** 3, v = e => { let t = Math.min(1, (e - g) / 420), n = _(t);
     R.target.lerpVectors(m, c, n), L.position.lerpVectors(h, p, n), R.update(), t < 1 && requestAnimationFrame(v);
     };
   requestAnimationFrame(v);
   }
function _e(e) { let t = A.get(e);
   t && (z.remove(t.group), t.deleted = !0, A.delete(e), j.set(e, t), N === e && (N = U().at(-1)?.id ?? null, N && G(N, { focus: !1, render: !1 })), X(), K({ animate: !H }), Z(), Q(`${t.preset.label} beaker moved to Recycle Bin`));
   }
function ve(e) { let t = j.get(e);
   if (!t)
    return;
   let records = U();
   canPlaceAt(t.preset, t.position, records).valid || (t.position = findFreePlacementPosition(t.preset, records));
   t.group.position.set(t.position.x, 0, t.position.z), t.deleted = !1, j.delete(e), A.set(e, t), z.add(t.group), G(e, { focus: !1, render: !1 }), X(), K({ animate: !H }), Z(), Q(`${t.preset.label} beaker ${e} restored`);
   }
function ye(e) { let t = j.get(e);
   if (t) {
    t.liquidMesh?.geometry?.dispose(), t.liquidMaterial?.dispose(), t.group.clear(), j.delete(e), X(), Z(), Q(`${t.id} permanently deleted`);
    
} }
function be() { for (let e of [...j.keys()])
    ye(e);
   X(), Q(`Recycle Bin emptied`);
   }
function q(e, t = !0) { e && (v(`#details-title`).textContent = `${e.label} beaker`, v(`#details-capacity`).textContent = f(e.capacityMl), v(`#details-diameter`).textContent = `≈ ${e.diameterMm} mm`, v(`#details-height`).textContent = `≈ ${e.heightMm} mm`, v(`#details-graduation`).textContent = `≈ ${f(e.graduationMl)}`, E.hidden = !t, w.setAttribute(`aria-expanded`, String(t)));
   }
function xe(e) { let t = A.get(e);
   t && (C.value = String(t.capacityMl), q(t.preset, !0), w.focus({ preventScroll: !0 }));
   }
function J() { return `<svg viewBox="0 0 24 28" aria-hidden="true"><path d="M6 3h12l-1.2 22H7.2L6 3Z"/><path d="M7 7h10M8.5 11h7M9 16h6"/></svg>`;
   }
function Y() {
    let e = U();
  
    v(`#active-count`).textContent = String(e.length), v(`#inventory-caption`).textContent = e.length ? `${e.length} ${e.length === 1 ? `beaker` : `beakers`} in the scene · select one to focus` : `No beakers in the scene yet.`, re.innerHTML = e.length ? e.map(e => `
    <article class="inventory-item${e.id === N ? ` is-selected` : ``}" data-id="${e.id}">
      <span class="inventory-item-icon">${J()}</span>
      <button class="inventory-select" data-action="select" type="button" aria-label="Select ${e.preset.label} beaker ${e.id}" aria-pressed="${e.id === N}">
        <strong>${e.preset.label} Beaker · ${e.id}</strong>
        <small>Approx. ${e.preset.diameterMm} × ${e.preset.heightMm} mm · ${f(e.liquidVolumeMl)} water</small>
      </button>
      <button class="item-action" data-action="info" type="button" title="View ${e.id} specifications" aria-label="View ${e.id} specifications">
        <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-8h.01"/></svg>
      </button>
      <button class="item-action remove" data-action="remove" type="button" title="Move ${e.id} to Recycle Bin" aria-label="Remove ${e.id}">
        <svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3m-9 0 1 13h10l1-13M10 11v5m4-5v5"/></svg>
      </button>
    </article>
  `).join(``) : `<div class="empty-inventory">${J()}<strong>Your scene is empty</strong><span>Choose a size above and add your first 3D beaker.</span></div>`;
  
}
function Se() {
    let e = [...j.values()];
  
    v(`#recycle-count`).textContent = String(e.length), v(`#recycle-summary`).textContent = e.length ? `${e.length} ${e.length === 1 ? `beaker` : `beakers`} removed` : `Nothing removed`, v(`#empty-bin`).disabled = e.length === 0, ie.innerHTML = e.length ? e.map(e => `
    <article class="recycle-item" data-id="${e.id}">
      <div class="recycle-item-top"><strong>${e.preset.label} Beaker · ${e.id}</strong></div>
      <small>Removed from the 3D scene</small>
      <div class="recycle-item-actions">
        <button class="restore-button" data-action="restore" type="button">Restore</button>
        <button class="delete-forever-button" data-action="delete" type="button">Delete permanently</button>
      </div>
    </article>
  `).join(``) : `<div class="empty-inventory">${J()}<strong>Recycle Bin is empty</strong><span>Removed beakers will appear here. You can restore them later.</span></div>`;
  
}
function X() { Y(), Se();
   }
function Z() { let e = A.size;
   S.textContent = `READY · ${e} ${e === 1 ? `BEAKER` : `BEAKERS`}`;
   }
function Q(e) { k.textContent = e, k.classList.add(`is-visible`), window.clearTimeout(oe), oe = window.setTimeout(() => k.classList.remove(`is-visible`), 2200);
   }
function $(e) { F = !!e;
   T.classList.toggle(`is-placing`, F), T.setAttribute(`aria-pressed`, String(F)), T.setAttribute(`aria-label`, F ? `Cancel beaker placement` : `Pick a beaker and place it in the lab`), y.classList.toggle(`is-placing`, F), O.classList.toggle(`is-placement`, F), ee.textContent = F ? `Position Beaker` : `Pick & Place Beaker`, te.textContent = F ? `Move over the lab · Green = valid · Red = collision · Esc to cancel` : `Choose a size, then click an open spot in the lab`, ne.textContent = F ? `CANCEL` : `PLACE`;
   if (F) {
    createPlacementPreview(d(C.value));
    
    Q(`${d(C.value)?.label ?? `Beaker`} preview active. Green is clear; red is blocked.`);
    
}
else {
    disposePlacementPreview();
    
    O.classList.remove(`is-visible`), y.classList.remove(`is-hovered`);
    
    Z();
    
} }
function Ce(t) { if (!updatePlacementPreviewFromPointer(t))
    return Q(`Move the pointer over the lab bench to position the beaker.`), !1;
   return commitPlacementAtPreview();
   }
function we(e) { let t = I.domElement.getBoundingClientRect();
   V.x = (e.clientX - t.left) / t.width * 2 - 1, V.y = -((e.clientY - t.top) / t.height) * 2 + 1, B.setFromCamera(V, L);
   }
function Te(e) { we(e);
   let t = U().map(e => e.group), n = B.intersectObjects(t, !0);
   for (let e of n) {
    let t = e.object;
    
    for (;
     t && !t.userData.beakerId;
    )
        t = t.parent;
    
    let n = t?.userData.beakerId ? A.get(t.userData.beakerId) : null;
    
    if (n)
        return { record: n, point: e.point.clone() };
    
} return null;
   }
function Ee(e) { return Te(e)?.record ?? null;
   }
function De(t, n) { we(t);
   let r = new e.Vector3;
   return B.ray.intersectPlane(n, r) ? r : null;
   }
function Oe(event) { if (event.button !== 0 || !I)
    return;
   if (event.target?.closest?.(`#handling-controls`))
    return;
   if (heldState && P && P.pointerId === null && event.pointerType === `touch`) {
    event.preventDefault(), event.stopImmediatePropagation();
    
    let point = De(event, new e.Plane(new e.Vector3(0, 1, 0), 0));
    
    if (point) {
        P.pointerId = event.pointerId, P.pointerType = `touch`, P.grabOffset = { x: point.x - heldState.record.group.position.x, z: point.z - heldState.record.group.position.z }, P.lastX = event.clientX, P.lastY = event.clientY;
      
        if (rotationActive)
            heldState.rotationAnchor = { x: event.clientX, y: event.clientY, rotation: { x: heldState.pose.rotation.x, y: heldState.pose.rotation.y, z: heldState.pose.rotation.z } };
      
        try {
            I.domElement.setPointerCapture(event.pointerId);
        
        }
        catch { }
    }
    return;
    
} if (P)
    return;
   if (F) {
    event.preventDefault(), event.stopImmediatePropagation();
    
    if (event.pointerType === `touch`) {
        updatePlacementPreviewFromPointer(event), placementTouchId = event.pointerId;
      
        try {
            I.domElement.setPointerCapture(event.pointerId);
        
        }
        catch { }
        ;
      
        return;
      
    }
    Ce(event);
    
    return;
    
} let hit = Te(event);
   if (!hit)
    return;
   event.preventDefault(), event.stopImmediatePropagation(), beginHolding(hit.record, event, hit.point);
   }
function ke(event) { if (!I)
    return;
   if (F) {
    if (event.pointerType === `touch` && placementTouchId === event.pointerId || event.pointerType !== `touch` && event.buttons === 0)
        updatePlacementPreviewFromPointer(event);
    
    y.classList.remove(`is-hovered`);
    
    return;
    
} if (P) {
    if (P.pointerId != null && event.pointerId !== P.pointerId)
        return;
    
    let record = A.get(P.id);
    
    if (!record || !heldState)
        return;
    
    P.lastX = event.clientX, P.lastY = event.clientY, heldState.lastPointer = { x: event.clientX, y: event.clientY };
    
    if (rotationActive) {
        let anchor = heldState.rotationAnchor;
      
        if (anchor) {
            let deltaX = event.clientX - anchor.x, deltaY = event.clientY - anchor.y;
        
            heldState.pose.rotation.order = `YXZ`, heldState.pose.rotation.y = anchor.rotation.y + deltaX * .009, heldState.pose.rotation.x = e.MathUtils.clamp(anchor.rotation.x + deltaY * .008, -1.22, 1.22);
        
        }
    }
    else {
        let point = De(event, new e.Plane(new e.Vector3(0, 1, 0), 0));
      
        if (point) {
            let nextX = point.x - P.grabOffset.x, nextZ = point.z - P.grabOffset.z;
        
            if (Math.hypot(nextX - record.position.x, nextZ - record.position.z) > 5e-4) {
                record.position.x = nextX, record.position.z = nextZ, record.group.position.x = nextX, record.group.position.z = nextZ, P.moved = !0;
          
            }
        }
    }
    O.style.left = String(event.clientX) + `px`, O.style.top = String(event.clientY) + `px`;
    
    return;
    
} let record = Ee(event);
   y.classList.toggle(`is-hovered`, !!record);
   }
function Ae(event) { if (placementTouchId != null && event?.pointerId === placementTouchId) {
    placementTouchId = null;
    
    if (event.type !== `pointercancel`)
        commitPlacementAtPreview();
    
    return;
    
} if (!P || event?.pointerId != null && P.pointerId != null && event.pointerId !== P.pointerId)
    return;
   if (P.pointerType === `touch` && event?.type === `pointerup`) {
    P.pointerId = null;
    
    O.classList.remove(`is-visible`);
    
    return;
    
} if (event?.type === `pointercancel`) {
    releaseHeldBeaker(!1);
    
    return;
    
} releaseHeldBeaker(!0);
   }
function je() { P || y.classList.remove(`is-hovered`), F && O.classList.remove(`is-visible`);
   }
function Me() { T.addEventListener(`click`, () => $(!F));
   window.addEventListener(`keydown`, event => { if (event.key === `Escape` && F) {
    event.preventDefault(), $(!1);
      
    return;
      
} if (event.key === `Escape` && heldState) {
    event.preventDefault(), releaseHeldBeaker(!1);
      
    return;
      
} });
   C.addEventListener(`change`, () => { q(d(C.value), !E.hidden), F && createPlacementPreview(d(C.value), placementPosition);
     });
   w.addEventListener(`click`, () => q(d(C.value), E.hidden));
   v(`#apply-liquid-volume`).addEventListener(`click`, () => { let record = A.get(N);
     if (!record) {
    Q(`Select a beaker from Scene inventory first`);
      
    return;
      
} setLiquidVolume(record, v(`#liquid-volume-input`).value), Q(`${f(record.liquidVolumeMl)} of water loaded into ${record.id}`);
     });
   v(`#liquid-volume-input`).addEventListener(`keydown`, event => { if (event.key === `Enter`)
    v(`#apply-liquid-volume`).click();
     });
   re.addEventListener(`click`, event => { let button = event.target.closest(`button[data-action]`), item = event.target.closest(`.inventory-item`);
     if (!button || !item)
    return;
     let { id } = item.dataset;
     if (button.dataset.action === `select`) {
        G(id);
    } else if (button.dataset.action === `info`) {
        G(id, { focus: !1, render: !1 });
        xe(id);
        Y();
    } else if (button.dataset.action === `remove`) {
        _e(id);
    }
     });
   ie.addEventListener(`click`, event => { let button = event.target.closest(`button[data-action]`), item = event.target.closest(`.recycle-item`);
     if (!button || !item)
    return;
     let { id } = item.dataset;
     button.dataset.action === `restore` && ve(id), button.dataset.action === `delete` && ye(id);
     });
   v(`#panel-collapse`).addEventListener(`click`, () => { b.classList.add(`is-hidden`), v(`#panel-reopen`).hidden = !1;
     }), v(`#panel-reopen`).addEventListener(`click`, () => { b.classList.remove(`is-hidden`), v(`#panel-reopen`).hidden = !0;
     });
   let toggleRecycle = open => { D.hidden = !open, v(`#recycle-trigger`).setAttribute(`aria-expanded`, String(open));
     };
   v(`#recycle-trigger`).addEventListener(`click`, () => toggleRecycle(D.hidden)), v(`#recycle-close`).addEventListener(`click`, () => toggleRecycle(!1)), v(`#empty-bin`).addEventListener(`click`, be);
   y.addEventListener(`pointerdown`, Oe, !0), y.addEventListener(`pointermove`, ke), y.addEventListener(`pointerleave`, je), window.addEventListener(`pointerup`, Ae), window.addEventListener(`pointercancel`, Ae), window.addEventListener(`blur`, () => { if (heldState)
    releaseHeldBeaker(!1);
    
else
    Ae();
     });
   window.addEventListener(`keydown`, event => { if (!heldState)
    return;
     if (event.key.toLowerCase() === `r` && !event.repeat) {
    event.preventDefault(), setRotationMode(!rotationActive);
      
    return;
      
} if (event.key === `Shift` && !event.repeat) {
    event.preventDefault(), toggleLift();
      
    return;
      
} if (event.key === `Control` && !event.repeat) {
    pourRequested = !0;
      
    return;
      
} });
   window.addEventListener(`keyup`, event => { if (event.key === `Control`) {
    pourRequested = !1, clearPourStream();
      
} });
   window.addEventListener(`keydown`, event => { if (event.key !== `+` && event.key !== `=` || F || [`INPUT`, `SELECT`, `TEXTAREA`].includes(document.activeElement?.tagName))
    return;
     event.preventDefault(), W(C.value);
     });
   v(`#handling-rotate`).addEventListener(`click`, () => setRotationMode(!rotationActive));
   v(`#handling-lift`).addEventListener(`click`, toggleLift);
   let pourButton = v(`#handling-pour`);
   pourButton.addEventListener(`pointerdown`, event => { event.preventDefault(), pourRequested = !0;
     });
   for (let name of [`pointerup`, `pointercancel`, `pointerleave`])
    pourButton.addEventListener(name, () => { pourRequested = !1, clearPourStream();
     });
   v(`#handling-finish`).addEventListener(`click`, finishHoldFromButton);
   v(`#handling-cancel`).addEventListener(`click`, () => releaseHeldBeaker(!1));
   }
function Ne() { if (!I || !L)
    return;
   let e = Math.max(1, y.clientWidth), t = Math.max(1, y.clientHeight);
   L.aspect = e / t, L.updateProjectionMatrix(), I.setPixelRatio(Math.min(window.devicePixelRatio || 1, ce)), I.setSize(e, t, !1);
   }
function Pe() { se = requestAnimationFrame(Pe);
   let now = performance.now(), deltaTime = Math.min(.05, Math.max(0, (now - lastPhysicsFrame) / 1000));
   lastPhysicsFrame = now, updateHandlingFrame(deltaTime, now), R.update(), I.render(z, L);
   }
function Fe(e) { console.error(`Chemistry Lab failed to initialise:`, e), x.classList.remove(`is-hidden`), x.innerHTML = `<strong>3D scene could not start</strong><span>Check WebGL support and reload this page.</span>`, S.textContent = `SCENE ERROR`;
   }
function Ie() { try {
    le(), ue(), de(), B = new e.Raycaster, V = new e.Vector2, Me(), q(d(C.value), !1), X(), Z(), new ResizeObserver(Ne).observe(y), window.addEventListener(`resize`, Ne, { passive: !0 }), Pe(), x.classList.add(`is-hidden`), window.setTimeout(() => { x.hidden = !0;
       }, 550), W(250, { position: { x: 0, z: 0 }, volumeMl: 150 });
    
}
catch (e) {
    Fe(e);
    
} }
window.addEventListener(`beforeunload`, () => { cancelAnimationFrame(se), disposePlacementPreview(), clearBlockerHighlights(), clearPourStream(), clearReceiverRing(), placementFootprints.clear(), R?.dispose(), I?.dispose();
   for (let e of M.values())
    e.glassGeometry.dispose(), e.rimGeometry.dispose(), e.baseGeometry.dispose(), e.labelGeometry.dispose(), e.selectionGeometry.dispose(), e.glassMaterial.dispose(), e.edgeMaterial.dispose(), e.labelMaterial.map?.dispose(), e.labelMaterial.dispose(), e.selectionMaterial.dispose();
   }), Ie();

