"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import { BufferGeometry, CanvasTexture, CatmullRomCurve3, Color, DoubleSide, Float32BufferAttribute, Group, InstancedMesh, Matrix4, Mesh, MeshStandardMaterial, Object3D, RepeatWrapping, ShaderMaterial, SRGBColorSpace, Vector3 } from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

export type WorldProps = { power: "shelter" | "shop" | null; bridge: boolean; storm: number; reducedMotion: boolean };
type V3 = [number, number, number];

/** Batch complete static props by material; animated foliage and weather stay independent. */
function StaticBatch({ children, version = "" }: { children: ReactNode; version?: string }) {
  const root = useRef<Group>(null);
  useLayoutEffect(() => {
    const group = root.current;
    if (!group) return;
    group.updateWorldMatrix(true, true);
    const inverse = new Matrix4().copy(group.matrixWorld).invert();
    const batches = new Map<string, { geometries: BufferGeometry[]; material: MeshStandardMaterial; shadow: boolean; receive: boolean }>();
    const originals: Mesh[] = [];
    group.traverse((node) => {
      if (!(node instanceof Mesh) || node instanceof InstancedMesh || !(node.material instanceof MeshStandardMaterial) || !node.visible) return;
      const material = node.material;
      const key = [material.color.getHexString(), material.emissive.getHexString(), material.emissiveIntensity, material.roughness, material.metalness, material.map?.uuid || "", material.side, material.opacity, material.transparent, node.castShadow, node.receiveShadow].join("/");
      const transformed = node.geometry.clone().applyMatrix4(new Matrix4().multiplyMatrices(inverse, node.matrixWorld));
      const geometry = transformed.index ? transformed.toNonIndexed() : transformed;
      if (geometry !== transformed) transformed.dispose();
      if (!geometry.attributes.uv) geometry.setAttribute("uv", new Float32BufferAttribute(new Float32Array(geometry.attributes.position.count * 2), 2));
      if (!geometry.attributes.normal) geometry.computeVertexNormals();
      const batch = batches.get(key);
      if (batch) batch.geometries.push(geometry);
      else batches.set(key, { geometries: [geometry], material, shadow: node.castShadow, receive: node.receiveShadow });
      originals.push(node);
    });
    const merged: Mesh[] = [];
    batches.forEach(({ geometries, material, shadow, receive }) => {
      const geometry = mergeGeometries(geometries, false);
      geometries.forEach((geo) => geo.dispose());
      if (!geometry) return;
      const mesh = new Mesh(geometry, material); mesh.castShadow = shadow; mesh.receiveShadow = receive;
      group.add(mesh); merged.push(mesh);
    });
    originals.forEach((mesh) => { mesh.visible = false; });
    return () => {
      merged.forEach((mesh) => { group.remove(mesh); mesh.geometry.dispose(); });
      originals.forEach((mesh) => { mesh.visible = true; });
    };
  }, [version]);
  return <group ref={root}>{children}</group>;
}

function Box({ at, size, color, rotation, emissive, shadow = true }: { at: V3; size: V3; color: string; rotation?: V3; emissive?: string; shadow?: boolean }) {
  return <mesh position={at} rotation={rotation} castShadow={shadow} receiveShadow><boxGeometry args={size} /><meshStandardMaterial color={color} roughness={0.86} emissive={emissive || "#000000"} emissiveIntensity={emissive ? 0.8 : 0} /></mesh>;
}

function Cylinder({ at, args, color, rotation }: { at: V3; args: [number, number, number, number?]; color: string; rotation?: V3 }) {
  return <mesh position={at} rotation={rotation} castShadow receiveShadow><cylinderGeometry args={args} /><meshStandardMaterial color={color} roughness={0.82} /></mesh>;
}

function makeRng(seed: number) {
  let x = seed;
  return () => { x = (x * 1664525 + 1013904223) >>> 0; return x / 4294967296; };
}

function usePavingTexture() {
  const map = useMemo(() => {
    const canvas = document.createElement("canvas"); canvas.width = canvas.height = 512;
    const ctx = canvas.getContext("2d")!;
    const random = makeRng(18);
    ctx.fillStyle = "#929d84"; ctx.fillRect(0, 0, 512, 512);
    const shades = ["#ceccba", "#d6cfb9", "#c6c8b3", "#cbc7af", "#d0d1bd", "#c9cbb5"];
    for (let row = -1; row < 9; row++) for (let col = -1; col < 9; col++) {
      const x = col * 64 + (row % 2) * 32; const y = row * 64;
      ctx.fillStyle = shades[Math.floor(random() * shades.length)];
      ctx.beginPath(); ctx.roundRect(x + 2, y + 2, 59, 59, 6); ctx.fill();
      ctx.strokeStyle = "rgba(230,222,189,.18)"; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = "rgba(77,86,64,.13)";
      for (let i = 0; i < 7; i++) ctx.fillRect(x + random() * 58 + 3, y + random() * 58 + 3, 1 + random() * 4, 1);
    }
    const texture = new CanvasTexture(canvas); texture.colorSpace = SRGBColorSpace; texture.wrapS = texture.wrapT = RepeatWrapping; texture.anisotropy = 4;
    return texture;
  }, []);
  useEffect(() => () => map.dispose(), [map]);
  return map;
}

function Paving({ at, width, depth, map, circle = false }: { at: V3; width: number; depth: number; map: CanvasTexture; circle?: boolean }) {
  const paving = useMemo(() => {
    const texture = map.clone(); texture.repeat.set(width / 4, depth / 4); texture.needsUpdate = true; return texture;
  }, [map, width, depth]);
  useEffect(() => () => paving.dispose(), [paving]);
  return <mesh rotation={[-Math.PI / 2, 0, 0]} position={at} receiveShadow>{circle ? <circleGeometry args={[width / 2, 64]} /> : <planeGeometry args={[width, depth]} />}<meshStandardMaterial map={paving} color="#f0ead9" roughness={0.95} /></mesh>;
}

function useMeadowTexture() {
  const map = useMemo(() => {
    const canvas = document.createElement("canvas"); canvas.width = canvas.height = 512;
    const ctx = canvas.getContext("2d")!; const random = makeRng(47);
    ctx.fillStyle = "#9ca97d"; ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 16000; i++) {
      ctx.fillStyle = ["rgba(101,124,75,.18)", "rgba(175,182,130,.22)", "rgba(116,140,89,.21)", "rgba(196,190,138,.13)"][i % 4];
      ctx.fillRect(random() * 512, random() * 512, 1 + random() * 3, 3 + random() * 7);
    }
    const texture = new CanvasTexture(canvas); texture.colorSpace = SRGBColorSpace; texture.wrapS = texture.wrapT = RepeatWrapping; texture.repeat.set(46, 46); texture.anisotropy = 4; return texture;
  }, []);
  useEffect(() => () => map.dispose(), [map]);
  return map;
}

function Sign({ text, sub, at, width = 3.2 }: { text: string; sub?: string; at: V3; width?: number }) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas"); canvas.width = 768; canvas.height = 256;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#354b43"; ctx.fillRect(0, 0, 768, 256);
    ctx.strokeStyle = "#b6b18a"; ctx.lineWidth = 3; ctx.strokeRect(15, 15, 738, 226);
    ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = "#f3e5bb";
    ctx.font = "600 62px Georgia, serif"; ctx.fillText(text, 384, sub ? 101 : 133);
    if (sub) { ctx.font = "25px Arial, sans-serif"; ctx.fillStyle = "#b9c4a7"; ctx.fillText(sub, 384, 176); }
    const map = new CanvasTexture(canvas); map.colorSpace = SRGBColorSpace; map.anisotropy = 4; return map;
  }, [text, sub]);
  useEffect(() => () => texture.dispose(), [texture]);
  return <group position={at}><Box at={[0, 0, 0]} size={[width + 0.12, width / 3 + 0.12, 0.16]} color="#65513c" /><mesh position={[0, 0, 0.086]}><planeGeometry args={[width, width / 3]} /><meshStandardMaterial map={texture} roughness={0.8} /></mesh></group>;
}

function Window({ x, y, z, lit, shutters = true }: { x: number; y: number; z: number; lit: boolean; shutters?: boolean }) {
  return <group position={[x, y, z]}>
    <Box at={[0, 0, 0]} size={[1.18, 1.55, 0.14]} color="#ded3ad" />
    <Box at={[0, 0, 0.09]} size={[0.97, 1.31, 0.035]} color={lit ? "#edd38e" : "#53706e"} emissive={lit ? "#f3c26b" : undefined} shadow={false} />
    <Box at={[0, 0, 0.13]} size={[0.055, 1.4, 0.055]} color="#d5c397" />
    <Box at={[0, 0.1, 0.13]} size={[1.06, 0.055, 0.055]} color="#d5c397" />
    <Box at={[0, -0.83, 0.06]} size={[1.39, 0.12, 0.35]} color="#c3b48f" />
    {shutters && [-1, 1].map((s) => <group key={s} position={[s * 0.84, 0, 0.03]} rotation={[0, s * -0.22, 0]}><Box at={[0, 0, 0]} size={[0.48, 1.48, 0.1]} color="#668776" />{[-0.52, -0.26, 0, 0.26, 0.52].map((h) => <Box key={h} at={[0, h, 0.06]} size={[0.39, 0.035, 0.04]} color="#8fa18a" shadow={false} />)}</group>)}
  </group>;
}

function Roof({ height = 2.35, width = 9.7, depth = 8.6, color = "#9c6650" }: { height?: number; width?: number; depth?: number; color?: string }) {
  const angle = Math.atan2(height, width / 2); const slope = Math.hypot(height, width / 2);
  const gable = useMemo(() => {
    const geo = new BufferGeometry();
    geo.setAttribute("position", new Float32BufferAttribute([-width / 2, 0, 0, width / 2, 0, 0, 0, height, 0], 3));
    geo.computeVertexNormals(); return geo;
  }, [height, width]);
  return <group>
    {[-1, 1].map((s) => <group key={s}><Box at={[s * width / 4, height / 2, 0]} size={[slope, 0.17, depth]} rotation={[0, 0, s * -angle]} color={color} />
      {Array.from({ length: 8 }, (_, row) => {
        const x = s * (row + 0.5) / 8 * width / 2; const y = height * (1 - (row + 0.5) / 8) + 0.08;
        return <Box key={row} at={[x, y, 0]} size={[slope / 8 + 0.025, 0.07, depth + 0.06]} rotation={[0, 0, s * -angle]} color={row % 3 === 0 ? "#a86f54" : row % 3 === 1 ? color : "#a37459"} shadow={false} />;
      })}
      <Box at={[s * width / 2, 0, 0]} size={[0.14, 0.2, depth + 0.13]} color="#73533e" />
    </group>)}
    <Cylinder at={[0, height + 0.08, 0]} args={[0.13, 0.13, depth + 0.12, 8]} rotation={[Math.PI / 2, 0, 0]} color="#be8b63" />
    {[-1, 1].map((s) => <mesh key={s} geometry={gable} position={[0, 0, s * (depth / 2 - 0.08)]}><meshStandardMaterial color="#d6c092" side={DoubleSide} roughness={0.9} /></mesh>)}
    <Box at={[-width * 0.26, height * 0.8, -depth * 0.23]} size={[0.78, 2, 0.83]} color="#998f78" />
    <Box at={[-width * 0.26, height * 0.8 + 1, -depth * 0.23]} size={[0.97, 0.15, 1]} color="#6b7567" />
  </group>;
}

function Building({ at, shop = false, lit = false }: { at: V3; shop?: boolean; lit?: boolean }) {
  const wall = shop ? "#e3cba3" : "#e4dec3";
  return <group position={at}><StaticBatch version={String(lit)}>
    <Box at={[0, 0.35, 0]} size={[9.1, 0.7, 7.2]} color="#8a927e" />
    <Box at={[0, 3.05, 0]} size={[8.8, 5.4, 7]} color={wall} />
    <Box at={[0, 5.74, 0]} size={[9.05, 0.22, 7.24]} color="#88765b" />
    <Box at={[0, 2.9, 3.57]} size={[8.85, 0.14, 0.15]} color="#b5a37d" />
    {[-4.26, 4.26].map((x) => <group key={x}><Box at={[x, 3.05, 3.53]} size={[0.2, 5.35, 0.19]} color="#a89870" />{[0.8, 1.5, 2.2, 3.6, 4.3, 5].map((y) => <Box key={y} at={[x, y, 3.61]} size={[0.36, 0.26, 0.17]} color="#bcb08c" shadow={false} />)}</group>)}
    <group position={[0, 5.83, 0]}><Roof color={shop ? "#99734f" : "#a86d52"} /></group>
    {[-2.7, 2.7].map((x) => <group key={x}><Window x={x} y={1.7} z={3.58} lit={lit} /><Window x={x} y={4.35} z={3.58} lit={lit} /></group>)}
    <Window x={0} y={4.35} z={3.58} lit={lit} shutters={false} />
    <Box at={[0, 1.3, 3.58]} size={[1.57, 2.5, 0.18]} color="#42665a" />
    {[-0.43, 0, 0.43].map((x) => <Box key={x} at={[x, 1.26, 3.685]} size={[0.022, 2.31, 0.016]} color="#73907b" shadow={false} />)}
    <Box at={[0, 1.88, 3.7]} size={[1.23, 0.65, 0.025]} color={lit ? "#e6c27a" : "#647f79"} emissive={lit ? "#edbc60" : undefined} />
    <Cylinder at={[0.5, 1.15, 3.75]} args={[0.055, 0.055, 0.1, 8]} rotation={[Math.PI / 2, 0, 0]} color="#c0a56c" />
    <Box at={[0, 0.14, 4.02]} size={[2.2, 0.28, 0.9]} color="#b0ad93" />
    <Box at={[0, 0.055, 4.55]} size={[2.6, 0.11, 0.5]} color="#a8aa90" />
    <Sign text={shop ? "ЛАВКА СОСЕДА" : "ОБЩИЙ ДОМ"} sub={shop ? "свежий хлеб · добрые встречи" : "свет остаётся, когда мы вместе"} at={[0, 6.15, 4.35]} width={4.6} />
    <Box at={[0, 2.84, 4.05]} size={[3.3, 0.17, 1.65]} rotation={[-0.1, 0, 0]} color={shop ? "#b6b38b" : "#788f77"} />
    {shop && Array.from({ length: 8 }, (_, i) => <Box key={i} at={[-1.44 + i * 0.41, 2.85, 4.05]} size={[0.2, 0.035, 1.67]} rotation={[-0.1, 0, 0]} color="#e1d9b3" shadow={false} />)}
    {[-1.45, 1.45].map((x) => <Cylinder key={x} at={[x, 1.43, 4.65]} args={[0.055, 0.055, 2.85, 8]} color="#7e7559" />)}
    {[-2.6, 2.6].map((x) => <FlowerBox key={x} at={[x, 0.15, 3.95]} />)}
    <group position={[-4.49, 3.5, 0]} rotation={[0, -Math.PI / 2, 0]}><Window x={0} y={0} z={0} lit={lit} /></group>
    <group position={[4.49, 3.5, 0]} rotation={[0, Math.PI / 2, 0]}><Window x={0} y={0} z={0} lit={lit} /></group>
    <Box at={[3.7, 1.2, 3.85]} size={[0.38, 1.8, 0.35]} color="#53675f" />
    <Box at={[3.7, 1.34, 4.04]} size={[0.27, 0.3, 0.02]} color={lit ? "#e4bb60" : "#859487"} emissive={lit ? "#f2ca66" : undefined} />
    {lit && <pointLight position={[0, 2, 5]} color="#ffcb7c" intensity={6} distance={8} decay={2} />}
  </StaticBatch></group>;
}

function FlowerBox({ at }: { at: V3 }) {
  return <group position={at}><Box at={[0, 0.25, 0]} size={[1.3, 0.5, 0.6]} color="#8d7455" /><Box at={[0, 0.5, 0]} size={[1.4, 0.12, 0.68]} color="#ac8d62" />{[-0.48, -0.24, 0, 0.24, 0.48].map((x, i) => <group key={x}><Cylinder at={[x, 0.8, 0]} args={[0.018, 0.025, 0.6, 5]} color="#668148" /><mesh position={[x, 1 + (i % 2) * 0.1, 0]}><sphereGeometry args={[0.12, 6, 5]} /><meshStandardMaterial color={i % 2 ? "#eac46d" : "#be806e"} /></mesh><mesh position={[x + 0.08, 0.77, 0]} rotation={[0, 0, -0.65]} scale={[1, 0.45, 0.7]}><sphereGeometry args={[0.15, 6, 5]} /><meshStandardMaterial color="#7d9658" /></mesh></group>)}</group>;
}

function Tree({ at, scale = 1, gold = false, seed = 1, wind = true }: { at: V3; scale?: number; gold?: boolean; seed?: number; wind?: boolean }) {
  const crown = useRef<Group>(null);
  useFrame(({ clock }) => { if (crown.current && wind) { crown.current.rotation.z = Math.sin(clock.elapsedTime * 0.65 + seed) * 0.018; crown.current.rotation.x = Math.sin(clock.elapsedTime * 0.47 + seed) * 0.012; } });
  const colors = gold ? ["#c6a256", "#d2b367", "#b49349", "#d3b869", "#b6a365"] : ["#7c9566", "#a4ae6d", "#6f8962", "#99a56a", "#7e9b70"];
  return <group position={at} scale={scale}>
    <StaticBatch>
    <Cylinder at={[0, 1.8, 0]} args={[0.2, 0.4, 3.6, 9]} color="#7c6a4e" />
    <Cylinder at={[-0.5, 2.8, 0]} args={[0.09, 0.2, 1.8, 7]} rotation={[0, 0, 0.55]} color="#857251" />
    <Cylinder at={[0.5, 3.15, -0.2]} args={[0.08, 0.18, 2, 7]} rotation={[0, -0.2, -0.5]} color="#857251" />
    {[-0.45, 0.1, 0.6].map((x, i) => <mesh key={i} position={[x, 0.18, (i - 1) * 0.45]} scale={[0.7, 0.35, 0.5]} castShadow><icosahedronGeometry args={[0.6, 0]} /><meshStandardMaterial color="#8e9678" /></mesh>)}
    </StaticBatch>
    <group ref={crown} position={[0, 3.3, 0]}>
      {[[0, 1.5, 0, 1.85], [-1.1, 0.5, 0.1, 1.45], [1.1, 0.7, 0.1, 1.55], [0, 0.7, -1, 1.5], [-0.3, 0.3, 0.9, 1.4], [0.2, 2, -0.25, 1.25]].map(([x, y, z, r], i) => <mesh key={i} position={[x, y, z]} scale={[1, 0.83, 0.9]} rotation={[i * 0.2, seed + i, 0]} castShadow receiveShadow><icosahedronGeometry args={[r, 1]} /><meshStandardMaterial color={colors[i % colors.length]} roughness={1} /></mesh>)}
    </group>
  </group>;
}

function Vegetation({ reducedMotion }: { reducedMotion: boolean }) {
  const grass = useRef<InstancedMesh>(null);
  const flowers = useRef<InstancedMesh>(null);
  const blade = useMemo(() => {
    const vertices: number[] = [];
    for (let n = 0; n < 3; n++) {
      const angle = n * Math.PI / 3, c = Math.cos(angle), s = Math.sin(angle);
      const points = [[-0.25, -0.5, 0], [0.25, -0.5, 0], [0.16, 0.1, 0.08], [-0.25, -0.5, 0], [0.16, 0.1, 0.08], [-0.13, 0.13, 0.08], [-0.13, 0.13, 0.08], [0.16, 0.1, 0.08], [0.24, 0.5, 0.15]];
      points.forEach(([x, y, z]) => vertices.push(x * c - z * s, y, x * s + z * c));
    }
    const geometry = new BufferGeometry(); geometry.setAttribute("position", new Float32BufferAttribute(vertices, 3)); geometry.computeVertexNormals(); return geometry;
  }, []);
  useEffect(() => () => blade.dispose(), [blade]);
  const matrices = useMemo(() => {
    const random = makeRng(578);
    const dummy = new Object3D();
    const blades = []; const blooms = [];
    for (let i = 0; i < 16000; i++) {
      const x = random() * 85 - 42.5, z = random() * 70 - 31;
      if (z > 11.1 && z < 16.9) continue;
      if (Math.abs(z) < 2.2 || Math.abs(x) < 2.2 || Math.abs(x - 16) < 2.8 && z > 3) continue;
      if (Math.abs(x + 12) < 6 && z < -3.2 && z > -15 || Math.abs(x - 12) < 6 && z < -3.2 && z > -15) continue;
      if (Math.hypot(x, z) < 7) continue;
      const h = 0.2 + random() * 0.45;
      dummy.position.set(x, h / 2, z); dummy.rotation.set(0, random() * Math.PI, (random() - 0.5) * 0.3); dummy.scale.set(0.12 + random() * 0.1, h, 0.12 + random() * 0.1); dummy.updateMatrix(); blades.push(dummy.matrix.clone());
      if (i % 28 === 0) { dummy.position.y = h; dummy.scale.setScalar(0.055 + random() * 0.03); dummy.updateMatrix(); blooms.push(dummy.matrix.clone()); }
    }
    return { blades, blooms };
  }, []);
  useEffect(() => {
    const palette = ["#a1ae77", "#859b65", "#b3b781", "#789064", "#adb77b"];
    if (grass.current) { matrices.blades.forEach((m, i) => { grass.current!.setMatrixAt(i, m); grass.current!.setColorAt(i, new Color(palette[i % 5])); }); grass.current.instanceMatrix.needsUpdate = true; if (grass.current.instanceColor) grass.current.instanceColor.needsUpdate = true; }
    if (flowers.current) { matrices.blooms.forEach((m, i) => { flowers.current!.setMatrixAt(i, m); flowers.current!.setColorAt(i, new Color(i % 3 ? "#e9d399" : "#cda476")); }); flowers.current.instanceMatrix.needsUpdate = true; if (flowers.current.instanceColor) flowers.current.instanceColor.needsUpdate = true; }
  }, [matrices]);
  return <group>
    <instancedMesh ref={grass} args={[blade, undefined, matrices.blades.length]} receiveShadow><meshStandardMaterial roughness={1} side={DoubleSide} /></instancedMesh>
    <instancedMesh ref={flowers} args={[undefined, undefined, matrices.blooms.length]}><icosahedronGeometry args={[1, 0]} /><meshStandardMaterial roughness={0.8} /></instancedMesh>
    {[
      [-24, -7, 1.2, 1], [-24, 3, 1, 1], [-6, -18, 1.4, 0], [5, -20, 1.2, 1], [23, -14, 1.4, 1], [25, -2, 1.15, 0], [24, 7, 1.2, 1], [6, 8, 0.9, 1], [-5, 8, 1.1, 1], [-26, 9, 1, 0], [-23, 22, 1.4, 1], [-10, 23, 1.25, 1], [4, 24, 1.4, 0], [25, 25, 1.6, 1], [-32, -18, 1.8, 1], [34, -22, 1.8, 0], [0, -32, 1.6, 1], [-18, -30, 1.8, 1], [17, -31, 1.7, 0], [-38, 1, 1.8, 0], [37, 1, 1.8, 1], [-34, 32, 1.8, 0], [37, 31, 1.9, 1],
    ].map(([x, z, scale, gold], i) => <Tree key={i} at={[x, 0, z]} scale={scale} gold={!!gold} seed={i * 3.4} wind={!reducedMotion} />)}
  </group>;
}

function Lamp({ at, on = true }: { at: V3; on?: boolean }) {
  return <group position={at}><StaticBatch version={String(on)}>
    <Cylinder at={[0, 0.2, 0]} args={[0.22, 0.3, 0.4, 8]} color="#657467" />
    <Cylinder at={[0, 1.9, 0]} args={[0.055, 0.09, 3.6, 8]} color="#4f665f" />
    <Box at={[0, 3.8, 0]} size={[0.45, 0.6, 0.45]} color={on ? "#eac680" : "#7d927e"} emissive={on ? "#ffd38a" : undefined} shadow={false} />
    {[-1, 1].flatMap((a) => [-1, 1].map((b) => <Box key={`${a}${b}`} at={[a * 0.225, 3.8, b * 0.225]} size={[0.035, 0.66, 0.035]} color="#4f665f" />))}
    <mesh position={[0, 4.18, 0]} castShadow><coneGeometry args={[0.43, 0.35, 4]} /><meshStandardMaterial color="#526d62" /></mesh>
    <Box at={[0, 3.46, 0]} size={[0.55, 0.1, 0.55]} color="#526d62" />
    {on && <pointLight position={[0, 3.65, 0]} color="#f7c77b" intensity={3.5} distance={8} decay={2} />}
  </StaticBatch></group>;
}

function Bench({ at, rotation = 0 }: { at: V3; rotation?: number }) {
  return <group position={at} rotation={[0, rotation, 0]}><StaticBatch>{[-0.9, 0.9].map((x) => <group key={x}><Box at={[x, 0.35, 0]} size={[0.13, 0.7, 0.68]} color="#54665b" /><Box at={[x, 0.88, -0.29]} size={[0.1, 1.1, 0.1]} rotation={[-0.12, 0, 0]} color="#54665b" /></group>)}{[-0.21, 0, 0.21].map((z) => <Box key={z} at={[0, 0.7, z]} size={[2.2, 0.095, 0.18]} color="#a78b5f" />)}{[0.96, 1.19].map((y) => <Box key={y} at={[0, y, -0.36]} size={[2.2, 0.18, 0.08]} rotation={[-0.12, 0, 0]} color="#ad9266" />)}</StaticBatch></group>;
}

function Water({ storm, reducedMotion }: { storm: number; reducedMotion: boolean }) {
  const material = useRef<ShaderMaterial>(null);
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uStorm: { value: 0 }, uColor: { value: new Color("#58918b") } }), []);
  useFrame(({ clock }) => { if (material.current) { material.current.uniforms.uTime.value = reducedMotion ? 0 : clock.elapsedTime; material.current.uniforms.uStorm.value = storm; } });
  return <mesh position={[0, -0.16, 14]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[220, 5, 1, 1]} /><shaderMaterial ref={material} uniforms={uniforms} transparent vertexShader={`varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`} fragmentShader={`varying vec2 vUv; uniform float uTime; uniform float uStorm; uniform vec3 uColor; void main(){ float wave=sin(vUv.x*280.+vUv.y*16.+uTime*1.7)*sin(vUv.y*80.-uTime*.7); float foam=smoothstep(.88,1.,sin(vUv.x*145.+sin(vUv.y*19.+uTime)*3.-uTime*2.))*0.16; vec3 col=mix(uColor,vec3(.17,.32,.33),uStorm*.65)+wave*.025+foam; gl_FragColor=vec4(col, .96); }`} /></mesh>;
}

function Bridge({ repaired, storm }: { repaired: boolean; storm: number }) {
  return <group position={[16, 0, 14]}>
    {Array.from({ length: 20 }, (_, i) => <Box key={i} at={[0, 0.1 + Math.sin(i * 0.15) * 0.05 - (!repaired && i > 7 && i < 11 ? storm * 0.17 : 0), -3.1 + i * 0.33]} size={[4.4, 0.18, 0.3]} color={i % 3 ? "#a58c63" : "#b59c70"} rotation={[!repaired && i === 8 ? storm * 0.4 : 0, 0, !repaired && i === 9 ? 0.025 + storm * 0.1 : 0]} />)}
    {[-2, 2].map((x) => <group key={x}>
      <Box at={[x, -0.16, 0]} size={[0.22, 0.5, 7.2]} color="#786d52" />
      {[-2.8, -1.4, 0, 1.4, 2.8].map((z, i) => <group key={z}><Box at={[x, 0.78, z]} size={[0.18, 1.45, 0.18]} color="#8e7a57" rotation={[0, 0, !repaired && i === 2 ? x * 0.07 : 0]} /><Box at={[x, 1.53, z]} size={[0.24, 0.08, 0.24]} color="#c4ac7b" /></group>)}
      <Box at={[x, 1.34, -1.4]} size={[0.11, 0.12, 3]} color="#a58d63" />
      <Box at={[x, 1.34, 2.05]} size={[0.11, 0.12, 1.7]} color="#a58d63" />
      {repaired && <><Box at={[x, 1.34, 0.45]} size={[0.14, 0.14, 2.2]} color="#d0b17c" /><Box at={[x, 0.78, 0.55]} size={[0.12, 0.14, 2.7]} rotation={[0.32, 0, 0]} color="#c4a46d" /></>}
    </group>)}
    <Sign text="МОСТ" sub={repaired ? "укреплён · путь свободен" : "нужны доски и забота"} at={[-3.35, 1.8, -3.4]} width={2.1} />
    <Cylinder at={[-3.35, 0.8, -3.4]} args={[0.065, 0.09, 1.6, 7]} color="#7c7154" />
  </group>;
}

function AutumnLeaves({ reducedMotion, storm }: { reducedMotion: boolean; storm: number }) {
  const mesh = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  const seeds = useMemo(() => {
    const random = makeRng(901);
    return Array.from({ length: 100 }, () => ({ x: random() * 55 - 27.5, z: random() * 46 - 23, y: random() * 7 + 0.2, phase: random() * 7, scale: 0.025 + random() * 0.045 }));
  }, []);
  useEffect(() => {
    if (!mesh.current) return;
    seeds.forEach((seed, i) => mesh.current!.setColorAt(i, new Color(i % 3 ? "#d4b776" : "#b99a58")));
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;
  }, [seeds]);
  useFrame(({ clock }) => {
    if (!mesh.current) return;
    const t = reducedMotion ? 0 : clock.elapsedTime;
    seeds.forEach((seed, i) => {
      dummy.position.set(seed.x + Math.sin(t * 0.3 + seed.phase) * (0.8 + storm), (seed.y - t * (0.13 + storm * 0.25) % 7 + 7) % 7 + 0.3, seed.z + Math.cos(t * 0.2 + seed.phase) * 0.6);
      dummy.rotation.set(t * 0.45 + seed.phase, seed.phase + t * 0.3, Math.sin(t + seed.phase));
      dummy.scale.set(seed.scale, seed.scale * 2.3, seed.scale * 0.3); dummy.updateMatrix(); mesh.current!.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });
  return <instancedMesh ref={mesh} args={[undefined, undefined, seeds.length]}><octahedronGeometry args={[1, 0]} /><meshStandardMaterial roughness={0.9} emissive="#8e6c2c" emissiveIntensity={0.1} /></instancedMesh>;
}

function Generator() {
  return <group position={[-15, 0, 8]}><StaticBatch>
    <Box at={[0, 0.08, 0]} size={[5.5, 0.16, 4]} color="#9c9f87" />
    <Box at={[0, 0.72, 0.3]} size={[2.3, 1.15, 1.35]} color="#6e8574" />
    <Box at={[0, 1.34, 0.3]} size={[2.4, 0.13, 1.5]} color="#c2b38b" />
    <Box at={[0.3, 0.7, -0.4]} size={[1.3, 0.65, 0.14]} color="#435d56" />
    {[-0.4, -0.15, 0.1, 0.35, 0.6].map((x) => <Box key={x} at={[x, 0.75, -0.49]} size={[0.06, 0.44, 0.025]} color="#94a08a" />)}
    <Cylinder at={[-0.9, 1.53, 0.5]} args={[0.09, 0.1, 0.4, 8]} color="#5c6d62" />
    <Cylinder at={[-0.9, 1.72, 0.5]} args={[0.15, 0.15, 0.06, 8]} color="#8d8c72" />
    <Box at={[-0.72, 0.86, -0.43]} size={[0.35, 0.29, 0.06]} color="#ddc18a" />
    <Box at={[-0.72, 0.86, -0.47]} size={[0.19, 0.12, 0.015]} color="#46685b" />
    {[-2.1, 2.1].flatMap((x) => [-1, 1.5].map((z) => <Cylinder key={`${x}${z}`} at={[x, 1.7, z]} args={[0.075, 0.09, 3.4, 8]} color="#8d7c56" />))}
    <Box at={[0, 3.6, 0.2]} size={[5.2, 0.14, 3.8]} rotation={[-0.1, 0, 0]} color="#7e8d76" />
    <Sign text="ГЕНЕРАТОР" sub="одна батарея · одно решение" at={[0, 2.8, -1.38]} width={3.5} />
    <group position={[0, 2.8, -1.47]} rotation={[0, Math.PI, 0]}><Sign text="ГЕНЕРАТОР" sub="одна батарея · одно решение" at={[0, 0, 0]} width={3.5} /></group>
  </StaticBatch></group>;
}

function Cable({ points, powered }: { points: V3[]; powered: boolean }) {
  const curve = useMemo(() => new CatmullRomCurve3(points.map((p) => new Vector3(...p))), [points]);
  return <mesh><tubeGeometry args={[curve, 24, 0.035, 5, false]} /><meshStandardMaterial color={powered ? "#ba9d58" : "#495b50"} emissive={powered ? "#a08332" : "#000000"} emissiveIntensity={powered ? 0.4 : 0} roughness={0.6} /></mesh>;
}

function DistantHouse({ at, scale = 1, rotation = 0 }: { at: V3; scale?: number; rotation?: number }) {
  return <group position={at} scale={scale} rotation={[0, rotation, 0]}><StaticBatch><Box at={[0, 2, 0]} size={[6, 4, 5]} color="#b7b899" /><group position={[0, 4, 0]}><Roof width={6.9} depth={6} height={1.7} color="#8b7b5d" /></group><Window x={-1.5} y={2} z={2.55} lit /><Window x={1.5} y={2} z={2.55} lit /><Box at={[0, 0.9, 2.56]} size={[1, 1.8, 0.1]} color="#5d7a69" /></StaticBatch></group>;
}

export default function World({ power, bridge, storm, reducedMotion }: WorldProps) {
  const paving = usePavingTexture();
  const meadow = useMeadowTexture();
  return <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.045, -49]} receiveShadow><planeGeometry args={[220, 121]} /><meshStandardMaterial map={meadow} roughness={1} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.045, 72]} receiveShadow><planeGeometry args={[220, 111]} /><meshStandardMaterial map={meadow} roughness={1} /></mesh>
    <Paving at={[0, 0.002, 0]} width={14.2} depth={14.2} map={paving} circle />
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]} receiveShadow><ringGeometry args={[6.7, 7.12, 64]} /><meshStandardMaterial color="#aaa98a" roughness={0.9} /></mesh>
    {[[0, 0, 56, 3.6], [0, -19, 3.7, 26], [0, 7, 3.7, 9], [-12, -4, 4, 8], [12, -4, 4, 8], [-15, 4.4, 5, 3], [16, 7, 4.7, 8], [16, 23, 4.7, 12]].map(([x, z, w, d], i) => <Paving key={i} at={[x, 0.006, z]} width={w} depth={d} map={paving} />)}
    <Building at={[-12, 0, -10]} lit={power === "shelter" || storm < 0.15} />
    <Building at={[12, 0, -10]} shop lit={power === "shop" || storm < 0.15} />
    <Generator />
    <Bridge repaired={bridge} storm={storm} />
    <Water storm={storm} reducedMotion={reducedMotion} />
    {[-1, 1].map((side) => <group key={side}>
      <Box at={[0, -0.19, 14 + side * 2.66]} size={[110, 0.6, 0.4]} color="#84937e" />
      <Box at={[0, 0.1, 14 + side * 2.9]} size={[110, 0.2, 0.7]} color="#a5a992" />
      {Array.from({ length: 16 }, (_, i) => i < 11 || i > 12 ? <group key={i} position={[-28 + i * 3.6, 0, 14 + side * 3.15]}><Cylinder at={[0, 0.54, 0]} args={[0.075, 0.095, 1, 7]} color="#788b78" /><Box at={[1.8, 0.91, 0]} size={[3.6, 0.065, 0.06]} color="#96a18a" /></group> : null)}
    </group>)}
    <Vegetation reducedMotion={reducedMotion} />
    <AutumnLeaves storm={storm} reducedMotion={reducedMotion} />
    {[[-6.9, 3.4], [6.9, -3.4], [-19, -3], [19, -3], [-21, 9], [12.3, 10], [19.7, 18], [-8, 19]].map(([x, z], i) => <Lamp key={i} at={[x, 0, z]} on={storm < 0.4 || (power === "shelter" && i % 2 === 0) || (power === "shop" && i % 2 === 1)} />)}
    <Bench at={[-5.2, 0, -3.4]} rotation={0.6} /><Bench at={[5.1, 0, 3.6]} rotation={-2.5} /><Bench at={[-9, 0, 9]} rotation={Math.PI} />
    <group position={[0, 0, 0]}>
      <Cylinder at={[0, 0.17, 0]} args={[1.5, 1.65, 0.34, 20]} color="#aaa98b" />
      <Cylinder at={[0, 0.48, 0]} args={[1.24, 1.32, 0.32, 20]} color="#bdba98" />
      <Cylinder at={[0, 0.66, 0]} args={[1.35, 1.35, 0.1, 20]} color="#d0c6a1" />
      <Cylinder at={[0, 0.69, 0]} args={[1.17, 1.17, 0.025, 28]} color="#6c9990" />
      <Cylinder at={[0, 1.16, 0]} args={[0.23, 0.36, 0.94, 12]} color="#b2ac87" />
      <Cylinder at={[0, 1.68, 0]} args={[0.73, 0.36, 0.22, 16]} color="#c6bd95" />
      <Cylinder at={[0, 1.82, 0]} args={[0.17, 0.22, 0.2, 10]} color="#baa978" />
    </group>
    <group position={[0, 0, -7.7]}>
      <Cylinder at={[0, 1.6, 0]} args={[0.07, 0.1, 3.2, 8]} color="#7b7352" />
      <Sign at={[0, 2.6, 0]} text="НАШ РАЙОН" sub="маленькие дела меняют всё" width={3.4} />
      <Sign at={[-1.2, 1.75, 0.08]} text="← Общий дом" width={2.1} /><Sign at={[1.2, 1.2, 0.08]} text="Магазин →" width={2.1} />
    </group>
    <Cable points={[[-15, 3.7, 8], [-18, 3.1, 0], [-16.3, 5.8, -6.4]]} powered={power === "shelter"} />
    <Cable points={[[-15, 3.7, 8], [-2, 4, 8], [16.3, 5.8, -6.4]]} powered={power === "shop"} />
    <DistantHouse at={[-12, 0, -26]} scale={0.95} rotation={0.15} /><DistantHouse at={[14, 0, -28]} scale={1.1} rotation={-0.2} /><DistantHouse at={[-29, 0, -16]} scale={1} rotation={0.6} /><DistantHouse at={[30, 0, -14]} scale={1} rotation={-0.7} />
    {Array.from({ length: 16 }, (_, i) => { const a = i / 16 * Math.PI * 2; return <mesh key={i} position={[Math.sin(a) * (59 + i % 3 * 7), -4, Math.cos(a) * 62]} scale={[14 + i % 4 * 5, 15 + i % 3 * 6, 12]} rotation={[0, i, 0]} receiveShadow><icosahedronGeometry args={[1, 1]} /><meshStandardMaterial color={i % 2 ? "#718e80" : "#799486"} roughness={1} /></mesh>; })}
    {[-1, 1].map((s) => <group key={s} position={[s * 25, 0, -5]}>{Array.from({ length: 5 }, (_, i) => <group key={i} position={[0, 0, i * 2]}><Cylinder at={[0, 0.45, 0]} args={[0.08, 0.1, 0.9, 7]} color="#a38f61" /><Box at={[0, 0.68, 1]} size={[0.065, 0.11, 2]} color="#b7a276" /><Box at={[0, 0.36, 1]} size={[0.065, 0.11, 2]} color="#b7a276" /></group>)}</group>)}
  </group>;
}
