import { BufferGeometry, Float32BufferAttribute, Group, InstancedMesh, Matrix4, Mesh, MeshStandardMaterial } from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

/** Merge opaque static geometry in the group's local space, preserving its materials and shadows. */
export function batchStaticMeshes(group: Group) {
  group.updateWorldMatrix(true, true);
  const inverse = new Matrix4().copy(group.matrixWorld).invert();
  const transform = new Matrix4();
  const batches = new Map<string, { source: Mesh<BufferGeometry, MeshStandardMaterial>; geometries: BufferGeometry[]; originals: Mesh[] }>();

  group.traverseVisible((node) => {
    if (!(node instanceof Mesh) || node instanceof InstancedMesh || node.children.length
      || !(node.material instanceof MeshStandardMaterial)) return;
    const material = node.material;
    // Textures, transparency and custom shaders keep their original rendering and sorting.
    if (material.type !== "MeshStandardMaterial" || material.transparent || material.vertexColors
      || Object.values(material).some(value => value && typeof value === "object" && "isTexture" in value)
      || material.onBeforeCompile !== MeshStandardMaterial.prototype.onBeforeCompile
      || material.customProgramCacheKey !== MeshStandardMaterial.prototype.customProgramCacheKey
      || node.customDepthMaterial || node.customDistanceMaterial
      || node.geometry.attributes.color || Object.keys(node.geometry.morphAttributes).length
      || node.geometry.drawRange.start !== 0 || node.geometry.drawRange.count !== Infinity) return;

    const settings = Object.fromEntries(Object.entries(material.toJSON()).filter(([key]) =>
      !["metadata", "uuid", "name", "color", "userData"].includes(key)));
    const key = JSON.stringify([settings, material.emissive.toArray(), material.blendColor.toArray(), material.defines,
      node.castShadow, node.receiveShadow, node.renderOrder, node.layers.mask, node.frustumCulled]);
    const transformed = node.geometry.clone().applyMatrix4(transform.multiplyMatrices(inverse, node.matrixWorld));
    const geometry = transformed.index ? transformed.toNonIndexed() : transformed;
    if (geometry !== transformed) transformed.dispose();
    const count = geometry.attributes.position.count;
    if (!geometry.attributes.uv) geometry.setAttribute("uv", new Float32BufferAttribute(new Float32Array(count * 2), 2));
    if (!geometry.attributes.normal) geometry.computeVertexNormals();
    const colors = new Float32Array(count * 3);
    // Three stores material colors in its linear working color space, as required by vertex colors.
    for (let i = 0; i < count; i++) material.color.toArray(colors, i * 3);
    geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
    const batch = batches.get(key);
    if (batch) { batch.geometries.push(geometry); batch.originals.push(node); }
    else batches.set(key, { source: node, geometries: [geometry], originals: [node] });
  });

  const merged: Mesh<BufferGeometry, MeshStandardMaterial>[] = [];
  const hidden: { mesh: Mesh; matrixAutoUpdate: boolean }[] = [];
  batches.forEach(({ source, geometries, originals }) => {
    const geometry = geometries.length > 1 ? mergeGeometries(geometries, false) : null;
    geometries.forEach(part => part.dispose());
    // If attributes are incompatible, the source meshes remain visible.
    if (!geometry) return;
    const material = source.material.clone();
    material.color.setRGB(1, 1, 1);
    material.vertexColors = true;
    const mesh = new Mesh(geometry, material);
    mesh.castShadow = source.castShadow;
    mesh.receiveShadow = source.receiveShadow;
    mesh.renderOrder = source.renderOrder;
    mesh.layers.mask = source.layers.mask;
    mesh.frustumCulled = source.frustumCulled;
    mesh.matrixAutoUpdate = false;
    group.add(mesh);
    merged.push(mesh);
    originals.forEach(original => {
      hidden.push({ mesh: original, matrixAutoUpdate: original.matrixAutoUpdate });
      original.visible = false;
      original.matrixAutoUpdate = false;
    });
  });

  return () => {
    merged.forEach(mesh => { group.remove(mesh); mesh.geometry.dispose(); mesh.material.dispose(); });
    hidden.forEach(({ mesh, matrixAutoUpdate }) => { mesh.visible = true; mesh.matrixAutoUpdate = matrixAutoUpdate; });
  };
}
