"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Stars, PerspectiveCamera, Text3D, Center, useMatcapTexture, OrbitControls, Environment } from "@react-three/drei";
import { useRef, useState, Suspense } from "react";
import * as THREE from "three";

function FloatingShape({ position, color, speed = 1 }: { position: [number, number, number], color: string, speed?: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();
    meshRef.current.rotation.x = t * 0.2 * speed;
    meshRef.current.rotation.y = t * 0.3 * speed;
    meshRef.current.position.y = position[1] + Math.sin(t * speed) * 0.5;
  });

  return (
    <Float speed={2} rotationIntensity={2} floatIntensity={2}>
      <mesh ref={meshRef} position={position}>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color={color} roughness={0.1} metalness={0.8} />
      </mesh>
    </Float>
  );
}

function SceneContent() {
    return (
        <>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1.5} color="#4f46e5" />
            <pointLight position={[-10, -10, -10]} intensity={1} color="#ecc055" />
            
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
            
            <group>
                <FloatingShape position={[-3, 0, -5]} color="#4f46e5" speed={0.8} />
                <FloatingShape position={[3, 2, -10]} color="#6366f1" speed={0.5} />
                <FloatingShape position={[-4, -3, -8]} color="#312e81" speed={0.6} />
                <FloatingShape position={[5, -2, -6]} color="#a5b4fc" speed={0.7} />
                
                {/* Debris */}
                {Array.from({ length: 20 }).map((_, i) => (
                    <Float key={i} speed={1} rotationIntensity={1} floatIntensity={1}>
                        <mesh 
                            position={[
                                (Math.random() - 0.5) * 20, 
                                (Math.random() - 0.5) * 20, 
                                (Math.random() - 0.5) * 10 - 5
                            ]}
                            rotation={[Math.random() * Math.PI, Math.random() * Math.PI, 0]}
                        >
                            <tetrahedronGeometry args={[Math.random() * 0.3]} />
                            <meshStandardMaterial color="#ffffff" roughness={0.1} metalness={0.9} transparent opacity={0.6} />
                        </mesh>
                    </Float>
                ))}
            </group>

            <Environment preset="city" />
        </>
    );
}

export default function NotFoundScene() {
  return (
    <div className="absolute inset-0 z-0">
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 10]} fov={50} />
        <SceneContent />
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
      </Canvas>
    </div>
  );
}
