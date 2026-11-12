"use client";

import { memo, type ReactNode } from "react";

export type ItemKind = "food" | "water" | "blankets" | "planks" | "battery";

function Block({ position, size, color, children }: { position: [number, number, number]; size: [number, number, number]; color: string; children?: ReactNode }) {
  return <mesh position={position} castShadow receiveShadow><boxGeometry args={size} /><meshStandardMaterial color={color} roughness={0.76} />{children}</mesh>;
}

/** Original, locally authored props. The base of every prop is at y=0. */
const ItemVisual = memo(function ItemVisual({ kind, highlighted = false }: { kind: ItemKind; highlighted?: boolean }) {
  return <group>
    {highlighted && <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}><ringGeometry args={[0.48, 0.53, 36]} /><meshBasicMaterial color="#f4d98c" transparent opacity={0.8} /></mesh>}
    {kind === "food" && <group>
      <Block position={[0, 0.09, 0]} size={[0.68, 0.12, 0.5]} color="#986946" />
      {[-1, 1].map((s) => <group key={s}><Block position={[s * 0.31, 0.25, 0]} size={[0.055, 0.36, 0.52]} color="#b99162" />{[0.16, 0.29].map((h) => <Block key={h} position={[0, h, s * 0.235]} size={[0.63, 0.075, 0.045]} color="#c49e6e" />)}</group>)}
      {[-0.2, 0, 0.2].flatMap((x, i) => [-0.12, 0.1].map((z, j) => <group key={`${i}${j}`} position={[x, 0.34, z]}><mesh castShadow><sphereGeometry args={[0.11, 10, 8]} /><meshStandardMaterial color={(i + j) % 2 ? "#ce7553" : "#d4b759"} roughness={0.7} /></mesh><mesh position={[0, 0.105, 0]} rotation={[0.3, 0, 0.3]}><boxGeometry args={[0.045, 0.06, 0.025]} /><meshStandardMaterial color="#69844d" /></mesh></group>))}
    </group>}
    {kind === "water" && <group>
      <Block position={[0, 0.08, 0]} size={[0.62, 0.1, 0.44]} color="#b7a387" />
      {[-0.16, 0.16].flatMap((x) => [-0.1, 0.1].map((z) => <group key={`${x}${z}`} position={[x, 0, z]}><mesh position={[0, 0.3, 0]} castShadow><cylinderGeometry args={[0.105, 0.125, 0.4, 12]} /><meshStandardMaterial color="#8bc2c4" metalness={0.12} roughness={0.22} /></mesh><mesh position={[0, 0.54, 0]}><cylinderGeometry args={[0.055, 0.07, 0.09, 10]} /><meshStandardMaterial color="#e2d6a7" /></mesh><Block position={[0, 0.31, 0.108]} size={[0.15, 0.11, 0.014]} color="#ecedcd" /></group>))}
      <Block position={[0, 0.21, 0]} size={[0.055, 0.06, 0.47]} color="#dac89a" />
    </group>}
    {kind === "blankets" && <group>
      {[["#8cae9b", 0.11], ["#c6a18d", 0.27], ["#dcc99f", 0.43]].map(([color, y], i) => <group key={i}><Block position={[0, Number(y), 0]} size={[0.66 - i * 0.025, 0.145, 0.46]} color={String(color)} />{[-0.23, 0.23].map((x) => <Block key={x} position={[x, Number(y) + 0.077, 0]} size={[0.025, 0.008, 0.44]} color="#e3dbc5" />)}</group>)}
      <Block position={[0, 0.28, 0.236]} size={[0.055, 0.49, 0.018]} color="#9a805a" />
    </group>}
    {kind === "planks" && <group rotation={[0, 0.13, 0]}>
      {[-1, 0, 1].map((n) => <group key={n}><Block position={[n * 0.19, 0.09, 0]} size={[0.17, 0.12, 0.85]} color={n === 0 ? "#bd955f" : "#a88052"} /><Block position={[n * 0.19, 0.22, 0.06]} size={[0.17, 0.12, 0.83]} color="#c5a26e" /></group>)}
      {[-0.25, 0.28].map((z) => <Block key={z} position={[0, 0.29, z]} size={[0.59, 0.027, 0.045]} color="#737c72" />)}
    </group>}
    {kind === "battery" && <group>
      <Block position={[0, 0.26, 0]} size={[0.53, 0.48, 0.37]} color="#465e62" />
      <Block position={[0, 0.5, 0]} size={[0.56, 0.055, 0.4]} color="#354c51" />
      <Block position={[0, 0.25, 0.19]} size={[0.36, 0.23, 0.018]} color="#d9b76b" />
      <Block position={[0, 0.27, 0.206]} size={[0.025, 0.13, 0.009]} color="#54615a" />
      <Block position={[0.035, 0.23, 0.206]} size={[0.09, 0.025, 0.009]} color="#54615a" />
      {[-1, 1].map((s) => <mesh key={s} position={[s * 0.17, 0.57, 0]} castShadow><cylinderGeometry args={[0.045, 0.05, 0.1, 10]} /><meshStandardMaterial color={s < 0 ? "#c47161" : "#b6b6a3"} metalness={0.6} roughness={0.4} /></mesh>)}
      <Block position={[-0.13, 0.59, 0]} size={[0.045, 0.14, 0.045]} color="#2c4145" />
      <Block position={[0.13, 0.59, 0]} size={[0.045, 0.14, 0.045]} color="#2c4145" />
      <Block position={[0, 0.66, 0]} size={[0.29, 0.045, 0.045]} color="#2c4145" />
    </group>}
  </group>;
});

export default ItemVisual;
