"use client";

import { memo, Suspense, useEffect, useMemo, useRef, type MutableRefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Sky } from "@react-three/drei";
import { Physics, RigidBody, CapsuleCollider, CuboidCollider, type RapierRigidBody } from "@react-three/rapier";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import World from "./World";
import Character from "./Character";
import ItemVisual from "./ItemVisual";
import WorldLabel from "./WorldLabel";
import { COLLIDERS, LOCATIONS, SPAWN, WORLD_BOUNDS, type CharacterId, type GamePhase, type GameState, type ItemKind, type Vec3, type GameItem } from "./model";

export type Controls = {
  keys: Set<string>; yaw: number; pitch: number; zoom: number; jump: boolean;
  moving: boolean; running: boolean; facing: Vec3; position: Vec3;
};
export type EngineProps = {
  game: GameState; controls: MutableRefObject<Controls>; active: boolean;
  quality: "high" | "low"; reducedMotion: boolean;
  playerPosition: Vec3; throwOrigin?: { id: string; position: Vec3 };
  onReady: () => void; onError: () => void; onPosition: (position: Vec3) => void;
};

function RendererHealth({ onError }: { onError: () => void }) {
  const { gl } = useThree();
  useEffect(() => {
    const lost = (event: Event) => { event.preventDefault(); onError(); };
    gl.domElement.addEventListener("webglcontextlost", lost);
    return () => gl.domElement.removeEventListener("webglcontextlost", lost);
  }, [gl, onError]);
  return null;
}

function Ready({ onReady }: { onReady: () => void }) {
  useEffect(() => { onReady(); }, [onReady]);
  return null;
}

type PlayerProps = Pick<EngineProps, "controls" | "active" | "onPosition"> & {
  character: CharacterId;
  heldKind?: ItemKind;
  finished: boolean;
};

const Player = memo(function Player({ character, heldKind, finished, controls, active, onPosition }: PlayerProps) {
  const body = useRef<RapierRigidBody>(null);
  const inputRef = useRef(controls.current);
  const visual = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const target = useMemo(() => new THREE.Vector3(), []);
  const desired = useMemo(() => new THREE.Vector3(), []);
  const cameraCollision = useMemo(() => ({
    ray: new THREE.Ray(),
    hit: new THREE.Vector3(),
    boxes: COLLIDERS.map(({ position: [x, y, z], halfExtents: [hx, hy, hz] }) => new THREE.Box3(
      new THREE.Vector3(x - hx - 0.25, y - hy, z - hz - 0.25),
      new THREE.Vector3(x + hx + 0.25, y + hy + 2, z + hz + 0.25),
    )),
  }), []);
  const lastUpdate = useRef(0);
  const lastPosition = useRef<Vec3 | null>(null);
  const initialized = useRef(false);

  useFrame((_, rawDt) => {
    if (!body.current) return;
    const dt = Math.min(rawDt, 0.05);
    const input = inputRef.current;
    const p = body.current.translation();
    const velocity = body.current.linvel();
    let forward = 0, side = 0;
    if (active && !finished) {
      forward = Number(input.keys.has("KeyW") || input.keys.has("ArrowUp")) - Number(input.keys.has("KeyS") || input.keys.has("ArrowDown"));
      side = Number(input.keys.has("KeyD") || input.keys.has("ArrowRight")) - Number(input.keys.has("KeyA") || input.keys.has("ArrowLeft"));
    }
    const running = input.keys.has("ShiftLeft") || input.keys.has("ShiftRight");
    const length = Math.hypot(forward, side) || 1;
    const speed = (running ? 6.1 : 3.65) * (heldKind ? 0.83 : 1);
    const x = (-Math.sin(input.yaw) * forward + Math.cos(input.yaw) * side) / length * speed;
    const z = (-Math.cos(input.yaw) * forward - Math.sin(input.yaw) * side) / length * speed;
    const moving = Math.abs(x) + Math.abs(z) > 0.01;
    // Capsule center is 0.76m above the walkable ground.
    const grounded = p.y < 0.88 && Math.abs(velocity.y) < 0.4;
    body.current.setLinvel({ x, z, y: active && input.jump && grounded ? 6 : velocity.y }, true);
    input.jump = false;
    if (p.y < -3 || Math.abs(p.x) > WORLD_BOUNDS + 2 || Math.abs(p.z) > WORLD_BOUNDS + 2) {
      body.current.setTranslation({ x: SPAWN[0], y: 1, z: SPAWN[2] }, true);
      body.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
    }
    // Keep published positions immutable, and avoid waking React while stationary.
    if (input.position.x !== p.x || input.position.y !== p.y - 0.75 || input.position.z !== p.z) {
      input.position = { x: p.x, y: p.y - 0.75, z: p.z };
    }
    input.moving = moving; input.running = running;
    if (moving && visual.current) {
      const angle = Math.atan2(x, z);
      let delta = angle - visual.current.rotation.y;
      delta = Math.atan2(Math.sin(delta), Math.cos(delta));
      visual.current.rotation.y += delta * (1 - Math.exp(-dt * 14));
      input.facing = { x: x / speed, y: 0, z: z / speed };
    }
    target.set(p.x, p.y + 1.05, p.z);
    const distance = input.zoom;
    desired.set(p.x + Math.sin(input.yaw) * distance, p.y + input.pitch * distance, p.z + Math.cos(input.yaw) * distance);
    // Pull the camera in before a facade can get between it and the player.
    const { ray, hit, boxes } = cameraCollision;
    ray.origin.copy(target);
    ray.direction.copy(desired).sub(target).normalize();
    let cameraDistance = target.distanceTo(desired);
    for (const box of boxes) {
      if (ray.intersectBox(box, hit)) cameraDistance = Math.min(cameraDistance, Math.max(1.5, target.distanceTo(hit)-0.5));
    }
    desired.copy(target).addScaledVector(ray.direction, cameraDistance);
    camera.position.lerp(desired, initialized.current ? 1 - Math.exp(-dt * 7) : 1);
    camera.lookAt(target);
    initialized.current = true;
    lastUpdate.current += dt;
    if (lastUpdate.current > 0.1) {
      if (lastPosition.current !== input.position) {
        lastPosition.current = input.position;
        onPosition(input.position);
      }
      lastUpdate.current = 0;
    }
  });

  const color = { mira: "#7ca98b", sasha: "#c98264", ren: "#9284ba", tim: "#c6a452" }[character];
  return <RigidBody ref={body} position={[SPAWN[0], 1, SPAWN[2]]} colliders={false} enabledRotations={[false,false,false]} linearDamping={0} friction={0} restitution={0} canSleep={false} ccd>
    <CapsuleCollider args={[0.4, 0.34]} />
    <group ref={visual} position={[0,-0.74,0]} rotation={[0,Math.PI-1.3,0]}>
      <AnimatedCharacter controls={controls} color={color} carrying={!!heldKind} />
      {heldKind && <group position={[0,0.92,0.62]} scale={0.8}><ItemVisual kind={heldKind} /></group>}
    </group>
  </RigidBody>;
});

const AnimatedCharacter = memo(function AnimatedCharacter({ controls, color, carrying }: { controls: MutableRefObject<Controls>; color: string; carrying: boolean }) {
  // The art rig reads motion from a mutable group to avoid 60 React updates/second.
  const rig = useRef<THREE.Group>(null);
  useFrame(() => {
    if (rig.current) {
      rig.current.userData.moving = controls.current.moving;
      rig.current.userData.running = controls.current.running;
    }
  });
  return <group ref={rig}><Character color={color} moving={false} running={false} carrying={carrying} /></group>;
});

const Pickup = memo(function Pickup({ item, highlighted, reducedMotion, launchFrom }: { item: GameItem; highlighted: boolean; reducedMotion: boolean; launchFrom?: Vec3 }) {
  const group = useRef<THREE.Group>(null);
  const last = useRef(new THREE.Vector3(launchFrom?.x ?? item.position.x, launchFrom?.y ?? 0.08, launchFrom?.z ?? item.position.z));
  const flight = useRef(1);
  const destination = useMemo(() => new THREE.Vector3(item.position.x,0.08,item.position.z), [item.position.x,item.position.z]);
  useEffect(() => { flight.current = 0; }, [destination]);
  useFrame(({ clock }, dt) => {
    if (!group.current) return;
    if (flight.current < 1) {
      flight.current = Math.min(1, flight.current + dt * 2.1);
      group.current.position.lerpVectors(last.current, destination, flight.current);
      group.current.position.y += Math.sin(flight.current * Math.PI) * 1.3;
      if (flight.current >= 1) last.current.copy(destination);
    } else group.current.position.y = 0.08 + (reducedMotion ? 0 : Math.sin(clock.elapsedTime * 2 + item.position.x) * 0.045);
  });
  return <group ref={group} position={[launchFrom?.x ?? item.position.x, launchFrom?.y ?? 0.08, launchFrom?.z ?? item.position.z]}>
    <ItemVisual kind={item.kind} highlighted={highlighted} />
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,0.02,0]}><ringGeometry args={[0.5,0.57,36]} /><meshBasicMaterial color={highlighted ? "#fff0aa" : "#a4d2ae"} transparent opacity={0.65} /></mesh>
    <WorldLabel position={[0,1.35,0]} text={item.label} className={`game-item-label ${highlighted ? "near" : ""}`} />
  </group>;
});

const Weather = memo(function Weather({ phase, storm, reducedMotion }: { phase: GamePhase; storm: number; reducedMotion: boolean }) {
  const light = useRef<THREE.DirectionalLight>(null);
  const ambient = useRef<THREE.HemisphereLight>(null);
  const rain = useRef<THREE.LineSegments>(null);
  const fog = useRef<THREE.Fog>(null);
  const fogColors = useMemo(() => ({ clear: new THREE.Color("#adbfb0"), storm: new THREE.Color("#526578") }), []);
  const rainGeometry = useMemo(() => {
    const positions = new Float32Array(1100 * 6);
    for(let i=0;i<1100;i++) {
      const x = ((i*13.731)%64)-32, y=(i*7.17)%20, z=((i*5.491)%64)-32;
      positions.set([x,y,z,x-.14,y-.65,z+.04],i*6);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position",new THREE.BufferAttribute(positions,3));
    return geometry;
  },[]);
  useEffect(() => () => rainGeometry.dispose(), [rainGeometry]);
  useFrame(({clock},dt) => {
    const flash = !reducedMotion && phase === "storm" && Math.sin(clock.elapsedTime*1.8)>0.995 ? 1.9 : 0;
    if(light.current) { light.current.intensity = 3.0 * (1-storm*.86)+flash; light.current.color.set(storm>.5?"#c5c5ee":"#ffe8b8"); }
    if(ambient.current) ambient.current.intensity = 1.55 - storm * .8 + flash*.35;
    if(fog.current) { fog.current.color.copy(fogColors.clear).lerp(fogColors.storm,storm); fog.current.near=25-storm*12; fog.current.far=95-storm*25; }
    if(rain.current && storm>.45) { rain.current.visible=true; rain.current.position.y -= dt*17; if(rain.current.position.y<-10)rain.current.position.y=0; }
    else if(rain.current)rain.current.visible=false;
  });
  return <>
    <Sky distance={450000} sunPosition={[35,19,-28]} turbidity={7} rayleigh={1.2} mieCoefficient={0.008} mieDirectionalG={0.82} />
    <fog ref={fog} attach="fog" args={["#adbfb0",25,95]} />
    <hemisphereLight ref={ambient} args={["#c7e8ed","#74836f",1.55]} />
    <directionalLight ref={light} position={[25,29,-18]} intensity={3} color="#ffe3a3" castShadow shadow-mapSize={[2048,2048]} shadow-camera-left={-38} shadow-camera-right={38} shadow-camera-top={38} shadow-camera-bottom={-38} shadow-camera-near={1} shadow-camera-far={90} shadow-normalBias={0.035} shadow-bias={-0.0002} />
    <lineSegments ref={rain} geometry={rainGeometry} visible={false}><lineBasicMaterial color="#b6d8ea" transparent opacity={0.45} depthWrite={false} /></lineSegments>
  </>;
});

const Collisions = memo(function Collisions() {
  return <RigidBody type="fixed" colliders={false}>
    <CuboidCollider args={[30,.2,20.75]} position={[0,-.2,-9.25]} />
    <CuboidCollider args={[30,.2,5.75]} position={[0,-.2,22.25]} />
    <CuboidCollider args={[2,.2,3.2]} position={[16,-.2,14]} />
    {COLLIDERS.map(c=><CuboidCollider key={c.id} position={c.position} args={c.halfExtents} />)}
    <CuboidCollider args={[.3,2,30]} position={[-28,1,0]} /><CuboidCollider args={[.3,2,30]} position={[28,1,0]} />
    <CuboidCollider args={[30,2,.3]} position={[0,1,-28]} /><CuboidCollider args={[30,2,.3]} position={[0,1,28]} />
    {/* Low riverbank colliders keep both players and dropped supplies on reachable paths. */}
    <CuboidCollider args={[22,1,.18]} position={[-8,0,11.5]} /><CuboidCollider args={[5,1,.18]} position={[23,0,11.5]} />
    <CuboidCollider args={[22,1,.18]} position={[-8,0,16.5]} /><CuboidCollider args={[5,1,.18]} position={[23,0,16.5]} />
    <CuboidCollider args={[1.1,1,1.1]} position={[-15,1,8]} />
    <CuboidCollider args={[1.4,1,1.4]} position={[0,1,0]} />
  </RigidBody>;
});

const Engine = memo(function Engine(props: EngineProps) {
  const {game,controls,active,quality,reducedMotion,onReady,onError,onPosition,playerPosition,throwOrigin}=props;
  const storm=game.phase==="preparing" ? 0 : Math.min(1,game.stormElapsed/3);
  const weatherStorm=game.phase==="preparing" ? game.elapsed/600*0.32 : storm;
  const heldKind=game.items.find(item=>item.id===game.carried)?.kind;
  return <Canvas shadows={quality==="high" ? "percentage" : false} dpr={quality==="high"?[1,1.6]:[1,1]} camera={{fov:48,near:.1,far:160,position:[-20,8,5]}} gl={{antialias:true,powerPreference:"high-performance"}} fallback={<p>Для игры нужен браузер с поддержкой WebGL 2.</p>}>
    <RendererHealth onError={onError}/>
    <Suspense fallback={null}>
      <Weather phase={game.phase} storm={weatherStorm} reducedMotion={reducedMotion} />
      <World power={game.power} bridge={game.bridge} storm={storm} reducedMotion={reducedMotion} />
      <Physics gravity={[0,-17,0]} timeStep={1/60} paused={!active}>
        <Collisions />
        <Player character={game.character} heldKind={heldKind} finished={game.phase==="finished"} controls={controls} active={active} onPosition={onPosition} />
      </Physics>
      {game.items.filter(i=>i.status==="ground").map(item=><Pickup key={item.id} item={item} highlighted={Math.hypot(item.position.x-playerPosition.x,item.position.z-playerPosition.z)<3} reducedMotion={reducedMotion} launchFrom={throwOrigin?.id===item.id ? throwOrigin.position : undefined} />)}
      {game.items.filter(i=>i.status==="delivered").map((item,index)=><group key={item.id} position={[-15.3+index*.9,.08,-5.3]} scale={.8}><ItemVisual kind={item.kind}/></group>)}
      {game.power&&<group position={[LOCATIONS[game.power].interact[0]+1.5,.1,LOCATIONS[game.power].interact[2]-.8]}><ItemVisual kind="battery" highlighted/><pointLight position={[0,.8,0]} color="#ffe299" intensity={1.5} distance={4}/></group>}
      {(["shelter","shop","generator","bridge"] as const).map(key=><WorldLabel key={key} position={[LOCATIONS[key].interact[0],2.7,LOCATIONS[key].interact[2]]} text={LOCATIONS[key].label} detail={key==="shelter"?`Припасы · ${game.delivered.length}/3`:key==="shop"?game.power==="shop"?"Электричество подключено":"Сохранить продукты":key==="generator"?"Единственный аккумулятор":game.bridge?"Укреплён":"Нужны доски"} className="game-location-label" />)}
      {quality==="high"&&<EffectComposer multisampling={0}><Bloom luminanceThreshold={1} intensity={0.34} mipmapBlur /><Vignette eskil={false} offset={0.16} darkness={0.23} /></EffectComposer>}
      <Ready onReady={onReady} />
    </Suspense>
  </Canvas>;
});

export default Engine;
