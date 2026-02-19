"use client";

import { useRef, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";

function DocumentIcon() {
  const groupRef = useRef<THREE.Group>(null);
  const mouse = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });

  // Track normalized mouse position within the canvas
  const { viewport } = useThree();

  useFrame((state) => {
    if (!groupRef.current) return;

    const t = state.clock.getElapsedTime();

    // Idle animation (always running)
    const idleY = Math.sin(t * 0.5) * 0.25;
    const idleX = Math.sin(t * 0.3) * 0.08;

    // Mouse tracking (blends on top of idle)
    const px = state.pointer.x;
    const py = state.pointer.y;

    target.current.x = py * 0.3;
    target.current.y = px * 0.4;

    mouse.current.x += (target.current.x - mouse.current.x) * 0.06;
    mouse.current.y += (target.current.y - mouse.current.y) * 0.06;

    groupRef.current.rotation.x = -0.1 + idleX + mouse.current.x;
    groupRef.current.rotation.y = idleY + mouse.current.y;
  });

  const pageW = 1.1;
  const pageH = 1.5;
  const pageD = 0.03;

  return (
    <group ref={groupRef}>
      {/* Back page */}
      <mesh position={[0.05, -0.05, -0.08]}>
        <boxGeometry args={[pageW, pageH, pageD]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.5} />
      </mesh>

      {/* Middle page */}
      <mesh position={[0.025, -0.025, -0.04]}>
        <boxGeometry args={[pageW, pageH, pageD]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.4} />
      </mesh>

      {/* Front page */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[pageW, pageH, pageD]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.25} metalness={0.02} />
      </mesh>

      {/* Blue header strip */}
      <mesh position={[0, 0.56, 0.02]}>
        <boxGeometry args={[0.95, 0.18, 0.005]} />
        <meshStandardMaterial color="#2563eb" roughness={0.2} metalness={0.15} />
      </mesh>

      {/* Title line */}
      <mesh position={[-0.1, 0.35, 0.02]}>
        <boxGeometry args={[0.55, 0.06, 0.004]} />
        <meshStandardMaterial color="#1e293b" roughness={0.5} />
      </mesh>

      {/* Text lines */}
      {[0, 1, 2, 3].map((i) => (
        <mesh key={`line-${i}`} position={[-0.08, 0.18 - i * 0.14, 0.02]}>
          <boxGeometry args={[0.7 - (i % 2) * 0.15, 0.04, 0.004]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.6} />
        </mesh>
      ))}

      {/* Mini bar chart */}
      <group position={[0, -0.42, 0.02]}>
        {[0, 1, 2, 3, 4].map((i) => {
          const heights = [0.12, 0.18, 0.1, 0.22, 0.15];
          const h = heights[i];
          return (
            <mesh key={`bar-${i}`} position={[-0.25 + i * 0.12, -0.12 + h / 2, 0]}>
              <boxGeometry args={[0.07, h, 0.005]} />
              <meshStandardMaterial
                color={i === 3 ? "#2563eb" : "#93c5fd"}
                roughness={0.3}
                metalness={0.05}
              />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}

export default function InteractiveIcon() {
  return (
    <div className="w-full h-full min-h-[200px]">
      <Canvas
        camera={{ position: [0, 0, 3.2], fov: 40 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={1} />
        <directionalLight position={[3, 4, 5]} intensity={1.5} />
        <pointLight position={[-4, -2, 3]} intensity={0.4} color="#93c5fd" />
        <Float speed={1.2} rotationIntensity={0.1} floatIntensity={0.3}>
          <DocumentIcon />
        </Float>
      </Canvas>
    </div>
  );
}
