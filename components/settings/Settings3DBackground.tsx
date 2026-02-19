"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import { useState, useRef, useMemo } from "react";
// @ts-ignore
import * as random from "maath/random/dist/maath-random.esm";
import { useTheme } from "../theme/ThemeProvider";
import * as THREE from "three";

function Stars(props: any) {
  const ref = useRef<THREE.Points>(null);
  const [sphere] = useState(() => random.inSphere(new Float32Array(5000), { radius: 1.5 }));

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.x -= delta / 10;
      ref.current.rotation.y -= delta / 15;
    }
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere} stride={3} frustumCulled={false} {...props}>
        <PointMaterial
          transparent
          color={props.color}
          size={0.002}
          sizeAttenuation={true}
          depthWrite={false}
        />
      </Points>
    </group>
  );
}

function FloatingGrid() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <gridHelper 
        args={[30, 30, isDark ? 0xffffff : 0x000000, isDark ? 0x222222 : 0xe5e7eb]} 
        position={[0, -1, 0]} 
        rotation={[Math.PI / 2.5, 0, 0]}
    />
  );
}

export function Settings3DBackground() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="absolute inset-0 z-0">
      <Canvas camera={{ position: [0, 0, 1] }}>
        <fog attach="fog" args={[isDark ? "#0f172a" : "#f8fafc", 1, 3]} />
        <Stars color={isDark ? "#ffa0e0" : "#3b82f6"} />
        {/* <FloatingGrid /> */}
      </Canvas>
    </div>
  );
}
