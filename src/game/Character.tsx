"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Group, MathUtils } from "three";

export type CharacterProps = { color?: string; moving?: boolean; running?: boolean; carrying?: boolean; storm?: number };

function Limb({ length, color }: { length: number; color: string }) {
  return <mesh position={[0, -length / 2, 0]} castShadow><capsuleGeometry args={[0.085, length - 0.17, 4, 8]} /><meshStandardMaterial color={color} roughness={0.85} /></mesh>;
}

/** Original stylized character. Facing +Z; soles at y=0. */
const Character = forwardRef<Group, CharacterProps>(function Character({ color = "#8aab92", moving = false, running = false, carrying = false, storm = 0 }, ref) {
  const root = useRef<Group>(null);
  const body = useRef<Group>(null);
  const leftLeg = useRef<Group>(null);
  const rightLeg = useRef<Group>(null);
  const leftArm = useRef<Group>(null);
  const rightArm = useRef<Group>(null);
  const scarf = useRef<Group>(null);
  const phase = useRef(0);
  useImperativeHandle(ref, () => root.current!, []);
  useFrame((_, dt) => {
    const isMoving = moving || !!root.current?.parent?.userData.moving;
    const isRunning = running || !!root.current?.parent?.userData.running;
    phase.current += dt * (isMoving ? isRunning ? 13 : 8 : 1.7);
    const p = phase.current;
    const swing = isMoving ? Math.sin(p) * (isRunning ? 0.9 : 0.55) : 0;
    const lerp = 1 - Math.exp(-dt * 18);
    if (leftLeg.current && rightLeg.current) {
      leftLeg.current.rotation.x = MathUtils.lerp(leftLeg.current.rotation.x, swing, lerp);
      rightLeg.current.rotation.x = MathUtils.lerp(rightLeg.current.rotation.x, -swing, lerp);
    }
    if (leftArm.current && rightArm.current) {
      leftArm.current.rotation.x = MathUtils.lerp(leftArm.current.rotation.x, carrying ? -1.15 : -swing * 0.8, lerp);
      rightArm.current.rotation.x = MathUtils.lerp(rightArm.current.rotation.x, carrying ? -1.15 : swing * 0.8, lerp);
      leftArm.current.rotation.z = carrying ? -0.18 : 0.1;
      rightArm.current.rotation.z = carrying ? 0.18 : -0.1;
    }
    if (body.current) {
      body.current.position.y = isMoving ? Math.abs(Math.sin(p)) * 0.045 : Math.sin(p) * 0.008;
      body.current.rotation.z = isMoving ? Math.sin(p) * 0.035 : 0;
      body.current.rotation.x = isRunning && isMoving ? 0.12 : 0;
    }
    if (scarf.current) scarf.current.rotation.x = 0.25 + (isMoving ? 0.35 : 0) + Math.sin(p * 1.4) * (0.12 + storm * 0.15);
  });
  return <group ref={root}>
    <group ref={body}>
      <group ref={leftLeg} position={[-0.115, 0.62, 0]}><Limb length={0.46} color="#4b5759" /><mesh position={[0, -0.49, 0.055]} castShadow><boxGeometry args={[0.17, 0.16, 0.28]} /><meshStandardMaterial color="#5d4940" roughness={0.85} /></mesh><mesh position={[0, -0.565, 0.055]}><boxGeometry args={[0.18, 0.035, 0.29]} /><meshStandardMaterial color="#d7ccb0" /></mesh></group>
      <group ref={rightLeg} position={[0.115, 0.62, 0]}><Limb length={0.46} color="#4b5759" /><mesh position={[0, -0.49, 0.055]} castShadow><boxGeometry args={[0.17, 0.16, 0.28]} /><meshStandardMaterial color="#5d4940" roughness={0.85} /></mesh><mesh position={[0, -0.565, 0.055]}><boxGeometry args={[0.18, 0.035, 0.29]} /><meshStandardMaterial color="#d7ccb0" /></mesh></group>
      <mesh position={[0, 0.88, 0]} castShadow><capsuleGeometry args={[0.235, 0.35, 6, 12]} /><meshStandardMaterial color={color} roughness={0.92} /></mesh>
      <mesh position={[0, 0.74, 0.205]}><boxGeometry args={[0.36, 0.15, 0.075]} /><meshStandardMaterial color={color} /></mesh>
      <mesh position={[0, 0.93, 0.218]}><boxGeometry args={[0.018, 0.35, 0.02]} /><meshStandardMaterial color="#ddcba7" /></mesh>
      {[-1, 1].map((s) => <mesh key={s} position={[s * 0.105, 0.78, 0.249]}><boxGeometry args={[0.09, 0.015, 0.016]} /><meshStandardMaterial color="#d0c09b" /></mesh>)}
      <group ref={leftArm} position={[-0.27, 1.04, 0]}><Limb length={0.39} color={color} /><mesh position={[0, -0.4, 0]} castShadow><sphereGeometry args={[0.08, 8, 6]} /><meshStandardMaterial color="#edc1a1" /></mesh></group>
      <group ref={rightArm} position={[0.27, 1.04, 0]}><Limb length={0.39} color={color} /><mesh position={[0, -0.4, 0]} castShadow><sphereGeometry args={[0.08, 8, 6]} /><meshStandardMaterial color="#edc1a1" /></mesh></group>
      <mesh position={[0, 1.22, 0]}><cylinderGeometry args={[0.075, 0.08, 0.14, 8]} /><meshStandardMaterial color="#edc1a1" /></mesh>
      <group position={[0, 1.47, 0]}>
        <mesh scale={[0.97, 1.05, 0.91]} castShadow><sphereGeometry args={[0.28, 20, 14]} /><meshStandardMaterial color="#efc6a9" roughness={0.85} /></mesh>
        <mesh position={[0, 0.085, -0.06]} scale={[1.05, 1.04, 0.96]} castShadow><sphereGeometry args={[0.28, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.69]} /><meshStandardMaterial color="#514039" roughness={0.95} /></mesh>
        {[-0.18, -0.07, 0.06, 0.17].map((x, i) => <mesh key={x} position={[x, 0.16 - Math.abs(x) * 0.25, 0.22]} rotation={[0.15, 0, (i - 1.5) * -0.22]} scale={[0.7, 1.2, 0.6]} castShadow><sphereGeometry args={[0.1, 10, 8]} /><meshStandardMaterial color="#59473b" roughness={0.9} /></mesh>)}
        {[-1, 1].map((s) => <group key={s}><mesh position={[s * 0.102, -0.015, 0.241]} scale={[1, 1.3, 0.5]}><sphereGeometry args={[0.044, 10, 8]} /><meshStandardMaterial color="#394440" /></mesh><mesh position={[s * 0.105 - 0.011, 0.002, 0.262]}><sphereGeometry args={[0.013, 6, 6]} /><meshBasicMaterial color="#fff7e8" /></mesh><mesh position={[s * 0.17, -0.082, 0.206]} scale={[1.4, 0.6, 0.3]}><sphereGeometry args={[0.04, 8, 6]} /><meshStandardMaterial color="#db9e91" /></mesh><mesh position={[s * 0.264, -0.01, 0]} scale={[0.5, 1, 0.8]}><sphereGeometry args={[0.065, 8, 8]} /><meshStandardMaterial color="#edc1a1" /></mesh></group>)}
        <mesh position={[0, -0.1, 0.247]} rotation={[0, 0, Math.PI]}><torusGeometry args={[0.032, 0.008, 5, 10, Math.PI]} /><meshStandardMaterial color="#986e5c" /></mesh>
      </group>
      <mesh position={[0, 1.17, 0.015]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.13, 0.055, 6, 14]} /><meshStandardMaterial color="#d29b68" roughness={0.96} /></mesh>
      <group ref={scarf} position={[0.06, 1.17, -0.13]}><mesh position={[0, -0.15, -0.035]} castShadow><boxGeometry args={[0.115, 0.32, 0.035]} /><meshStandardMaterial color="#d29b68" /></mesh></group>
      <mesh position={[0, 0.91, -0.22]} castShadow><boxGeometry args={[0.28, 0.32, 0.13]} /><meshStandardMaterial color="#b6a078" roughness={0.9} /></mesh>
      <mesh position={[0, 0.89, -0.297]}><boxGeometry args={[0.22, 0.12, 0.045]} /><meshStandardMaterial color="#a28b65" /></mesh>
    </group>
  </group>;
});

export default Character;
