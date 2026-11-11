import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

// tsx loads this package's .ts files as CJS. Use the same Three class identities.
const require = createRequire(import.meta.url);
const { BoxGeometry, BufferAttribute, Group, InstancedMesh, Matrix3, Mesh, MeshStandardMaterial, Texture, Vector3 } = require("three");
const { batchStaticMeshes } = require("../src/game/static-batch.ts");

function prop(color, settings = {}) {
  const mesh = new Mesh(new BoxGeometry(1, 2, 3), new MeshStandardMaterial({ color, roughness: 0.86, ...settings }));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function worldSurface(mesh) {
  const geometry = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone();
  const normalMatrix = new Matrix3().getNormalMatrix(mesh.matrixWorld);
  const vertices = Array.from({ length: geometry.attributes.position.count }, (_, index) => ({
    position: new Vector3().fromBufferAttribute(geometry.attributes.position, index).applyMatrix4(mesh.matrixWorld),
    normal: new Vector3().fromBufferAttribute(geometry.attributes.normal, index).applyNormalMatrix(normalMatrix),
  }));
  geometry.dispose();
  return vertices;
}

function assertSameSurface(expected, actual) {
  assert.equal(actual.length, expected.length);
  expected.forEach((vertex, index) => {
    assert.ok(vertex.position.distanceTo(actual[index].position) < 0.00001, `vertex ${index} moved`);
    assert.ok(vertex.normal.distanceTo(actual[index].normal) < 0.00001, `normal ${index} changed`);
  });
}

test("colored static props become one draw with the same surface, lighting normals and linear colors", (t) => {
  const group = new Group();
  group.position.set(12, 2, -3);
  group.rotation.set(0.1, 0.7, -0.2);
  group.scale.setScalar(1.4);
  const a = prop("#668776"), b = prop("#d2b367");
  a.position.set(2, 3, 1);
  a.rotation.set(0.2, 0.1, 0.3);
  a.scale.set(1, 0.83, 0.9);
  b.position.set(-2, 1, 3);
  group.add(a, b);
  group.updateWorldMatrix(true, true);
  const expected = [a, b].flatMap(worldSurface);
  const cleanup = batchStaticMeshes(group);
  t.after(cleanup);
  const visible = group.children.filter(child => child.visible);
  assert.equal(visible.length, 1);
  const merged = visible[0];
  group.updateWorldMatrix(true, true);
  assertSameSurface(expected, worldSurface(merged));
  assert.equal(merged.material.vertexColors, true);
  assert.deepEqual(merged.material.color.toArray(), [1, 1, 1]);
  const colors = merged.geometry.attributes.color;
  assert.ok(Math.abs(colors.getX(0) - a.material.color.r) < 1e-7);
  assert.ok(Math.abs(colors.getY(worldSurface(a).length) - b.material.color.g) < 1e-7);

  // The parent can still animate the entire crown after its local meshes are batched.
  group.rotation.z += 0.25;
  group.updateWorldMatrix(true, true);
  assertSameSurface([a, b].flatMap(worldSurface), worldSurface(merged));
});

test("material render settings and shadow flags remain distinct", (t) => {
  const group = new Group();
  const a = prop("red", { emissive: "#a08332", emissiveIntensity: 0.4, roughness: 0.6, depthWrite: false });
  const b = prop("blue", { emissive: "#a08332", emissiveIntensity: 0.4, roughness: 0.6, depthWrite: false });
  const c = prop("green"), d = prop("yellow");
  a.castShadow = b.castShadow = false;
  a.layers.set(2); b.layers.set(2);
  a.renderOrder = b.renderOrder = 3;
  group.add(a, b, c, d);
  t.after(batchStaticMeshes(group));
  const visible = group.children.filter(child => child.visible);
  assert.equal(visible.length, 2);
  const glowing = visible.find(mesh => !mesh.castShadow);
  assert.ok(glowing);
  assert.equal(glowing.receiveShadow, true);
  assert.equal(glowing.renderOrder, 3);
  assert.equal(glowing.layers.mask, a.layers.mask);
  assert.equal(glowing.material.roughness, 0.6);
  assert.equal(glowing.material.depthWrite, false);
  assert.equal(glowing.material.emissiveIntensity, 0.4);
  assert.deepEqual(glowing.material.emissive.toArray(), a.material.emissive.toArray());
  assert.equal(visible.find(mesh => mesh.castShadow).material.depthWrite, true);
});

test("textured, transparent, instanced, custom-shader and partially drawn props keep their rendering", (t) => {
  const group = new Group();
  const textured = prop("white", { map: new Texture() });
  const transparent = prop("orange", { transparent: true, opacity: 0.5 });
  const custom = prop("blue");
  custom.material.onBeforeCompile = () => {};
  const partial = prop("green");
  partial.geometry.setDrawRange(0, 6);
  const instanced = new InstancedMesh(new BoxGeometry(), new MeshStandardMaterial(), 2);
  const originals = [textured, transparent, custom, partial, instanced];
  group.add(...originals);
  t.after(batchStaticMeshes(group));
  assert.deepEqual(group.children, originals);
  assert.ok(originals.every(mesh => mesh.visible && mesh.matrixAutoUpdate));
});

test("incompatible geometry remains visible if a merge cannot be built", (t) => {
  const group = new Group();
  const a = prop("red"), b = prop("blue");
  b.geometry.setAttribute("extra", new BufferAttribute(new Float32Array(b.geometry.attributes.position.count), 1));
  group.add(a, b);
  const error = t.mock.method(console, "error", () => {});
  t.after(batchStaticMeshes(group));
  assert.equal(error.mock.callCount(), 1);
  assert.deepEqual(group.children, [a, b]);
  assert.ok(a.visible && b.visible);
});

test("cleanup releases only batch resources and rebuilding respects changed props", () => {
  const group = new Group();
  const a = prop("red"), b = prop("blue");
  b.updateMatrix();
  b.matrixAutoUpdate = false;
  group.add(a, b);
  let sourceDisposals = 0;
  for (const mesh of [a, b]) {
    mesh.geometry.addEventListener("dispose", () => sourceDisposals++);
    mesh.material.addEventListener("dispose", () => sourceDisposals++);
  }
  const cleanup = batchStaticMeshes(group);
  const merged = group.children.find(mesh => mesh.visible);
  let geometryDisposals = 0, materialDisposals = 0;
  merged.geometry.addEventListener("dispose", () => geometryDisposals++);
  merged.material.addEventListener("dispose", () => materialDisposals++);
  cleanup();
  assert.deepEqual(group.children, [a, b]);
  assert.ok(a.visible && b.visible);
  assert.equal(a.matrixAutoUpdate, true);
  assert.equal(b.matrixAutoUpdate, false);
  assert.equal(geometryDisposals, 1);
  assert.equal(materialDisposals, 1);
  assert.equal(sourceDisposals, 0);

  a.position.y = 2;
  a.material.emissive.set("yellow");
  b.material.emissive.set("yellow");
  const rebuiltCleanup = batchStaticMeshes(group);
  const rebuilt = group.children.find(mesh => mesh.visible);
  group.updateWorldMatrix(true, true);
  assertSameSurface([a, b].flatMap(worldSurface), worldSurface(rebuilt));
  assert.deepEqual(rebuilt.material.emissive.toArray(), a.material.emissive.toArray());
  rebuiltCleanup();
  assert.equal(sourceDisposals, 0);
});
