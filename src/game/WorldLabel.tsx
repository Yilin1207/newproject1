"use client";

import { memo, useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Group, MathUtils, Vector3 } from "three";

type WorldLabelProps = {
  position: [number, number, number];
  text: string;
  detail?: string;
  className: string;
};

/** A projected DOM annotation without a second React root or portal lifecycle. */
const WorldLabel = memo(function WorldLabel({ position, text, detail, className }: WorldLabelProps) {
  const anchor = useRef<Group>(null);
  const element = useRef<HTMLDivElement | null>(null);
  const { gl, camera, size } = useThree();
  const vectors = useMemo(() => ({ world: new Vector3(), projected: new Vector3(), camera: new Vector3() }), []);
  const previousStyle = useRef({ transform: "", opacity: "", visibility: "hidden" });

  useEffect(() => {
    const parent = gl.domElement.parentElement;
    if (!parent) return;
    const document = gl.domElement.ownerDocument;
    const label = document.createElement("div");
    label.className = className;
    label.setAttribute("aria-hidden", "true");
    Object.assign(label.style, {
      position: "absolute", left: "0", top: "0", pointerEvents: "none",
      zIndex: "1", visibility: "hidden", transformOrigin: "center center",
      willChange: "transform, opacity",
    });
    const title = document.createElement("span");
    title.textContent = text;
    label.appendChild(title);
    if (detail) {
      const subtitle = document.createElement("small");
      subtitle.textContent = detail;
      label.appendChild(subtitle);
    }
    parent.appendChild(label);
    element.current = label;
    previousStyle.current = { transform: "", opacity: "", visibility: "hidden" };
    return () => {
      label.remove();
      if (element.current === label) element.current = null;
    };
  }, [gl.domElement, text, detail, className]);

  useFrame(() => {
    const label = element.current;
    if (!label || !anchor.current) return;
    const previous = previousStyle.current;
    anchor.current.getWorldPosition(vectors.world);
    camera.updateMatrixWorld();
    camera.getWorldPosition(vectors.camera);
    vectors.projected.copy(vectors.world).project(camera);
    const projected = vectors.projected;
    const distance = vectors.camera.distanceTo(vectors.world);
    const opacity = distance <= 35 ? 1 : MathUtils.clamp((55 - distance) / 20, 0, 1);
    if (!Number.isFinite(projected.x) || !Number.isFinite(projected.y)
      || projected.z < -1 || projected.z > 1
      || projected.x < -1 || projected.x > 1 || projected.y < -1 || projected.y > 1
      || opacity === 0) {
      if (previous.visibility !== "hidden") {
        label.style.visibility = previous.visibility = "hidden";
      }
      return;
    }
    const x = (projected.x * 0.5 + 0.5) * size.width;
    const y = (-projected.y * 0.5 + 0.5) * size.height;
    const scale = MathUtils.clamp(14 / Math.max(distance, 0.01), 0.65, 1);
    const transform = `translate3d(${x}px,${y}px,0) translate(-50%,-50%) scale(${scale})`;
    const alpha = String(opacity);
    if (previous.transform !== transform) label.style.transform = previous.transform = transform;
    if (previous.opacity !== alpha) label.style.opacity = previous.opacity = alpha;
    if (previous.visibility !== "visible") label.style.visibility = previous.visibility = "visible";
  });

  return <group ref={anchor} position={position} />;
}, (previous, next) => previous.text === next.text && previous.detail === next.detail
  && previous.className === next.className
  && previous.position[0] === next.position[0] && previous.position[1] === next.position[1]
  && previous.position[2] === next.position[2]);

export default WorldLabel;
