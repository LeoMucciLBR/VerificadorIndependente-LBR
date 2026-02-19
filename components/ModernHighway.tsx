"use client";

import React, { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Sky, Stars, useTexture, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import ThemeSwitch from "./ThemeSwitch";
import { motion } from "framer-motion";

// --- Sub-components ---

const Road = ({ isDark }: { isDark: boolean }) => {
  const mesh = useRef<THREE.Mesh>(null);
  
  // Use standard material with some tweaks for asphalt look
  // We can simulate movement by animating texture offset if we had a texture,
  // or just moving the road chunks.
  // For a simple infinite road, we often move stripes.

  const roadColor = isDark ? "#1e1e1e" : "#333333";
  const stripeColor = isDark ? "#fbbf24" : "#f59e0b";

  useFrame((state, delta) => {
    if (mesh.current) {
        // Move stripes? 
        // A simpler way for a "moving" road without textures is to have moving elements ON the road.
        // But let's try a shader approach or simple texture scroll if possible.
        // For now, static road base, moving lines.
    }
  });

  return (
    <group rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, -50]}>
      {/* Main Road Surface */}
      <mesh receiveShadow>
        <planeGeometry args={[40, 400]} />
        <meshStandardMaterial color={roadColor} roughness={0.8} />
      </mesh>
      
      {/* Road Markings - animated in a separate component ideally, but let's put static for now */}
    </group>
  );
};

const MovingStripes = () => {
    const group = useRef<THREE.Group>(null);
    useFrame((state, delta) => {
        if (group.current) {
            group.current.position.z += 20 * delta; // Speed
            if (group.current.position.z > 20) {
                group.current.position.z = -20;
            }
        }
    });

    // Create a pool of stripes
    const stripes = useMemo(() => {
        const arr = [];
        for (let i = -100; i < 20; i+=20) {
            arr.push(i);
        }
        return arr;
    }, []);

    return (
        <group ref={group}>
            {stripes.map((z, i) => (
                 <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.98, z]}>
                    <planeGeometry args={[1, 8]} />
                    <meshBasicMaterial color="#fbbf24" />
                </mesh>
            ))}
        </group>
    )
}

const Car = ({ 
    position, 
    color, 
    speed, 
    isReverse 
}: { 
    position: [number, number, number], 
    color: string, 
    speed: number, 
    isReverse?: boolean 
}) => {
    const ref = useRef<THREE.Group>(null);

    useFrame((state, delta) => {
        if (ref.current) {
            ref.current.position.z += speed * delta;
            
            // Reset position for loop
            if (!isReverse && ref.current.position.z > 20) {
                ref.current.position.z = -150;
            }
            if (isReverse && ref.current.position.z < -150) {
                ref.current.position.z = 20;
            }
        }
    });

    const carRot = isReverse ? [0, Math.PI, 0] : [0, 0, 0];

    return (
        <group ref={ref} position={position} rotation={carRot as any}>
            {/* Body */}
            <mesh position={[0, 0.75, 0]} castShadow>
                <boxGeometry args={[2, 1, 4.5]} />
                <meshStandardMaterial color={color} metalness={0.5} roughness={0.2} />
            </mesh>
            {/* Cabin */}
            <mesh position={[0, 1.5, -0.5]} castShadow>
                <boxGeometry args={[1.8, 0.8, 2.5]} />
                <meshStandardMaterial color="#333" />
            </mesh>
            {/* Wheels */}
            <mesh position={[1, 0.4, 1.5]} rotation={[0, 0, Math.PI/2]}>
                <cylinderGeometry args={[0.4, 0.4, 0.3, 16]} />
                <meshStandardMaterial color="#111" />
            </mesh>
            <mesh position={[-1, 0.4, 1.5]} rotation={[0, 0, Math.PI/2]}>
                <cylinderGeometry args={[0.4, 0.4, 0.3, 16]} />
                <meshStandardMaterial color="#111" />
            </mesh>
            <mesh position={[1, 0.4, -1.5]} rotation={[0, 0, Math.PI/2]}>
                <cylinderGeometry args={[0.4, 0.4, 0.3, 16]} />
                <meshStandardMaterial color="#111" />
            </mesh>
            <mesh position={[-1, 0.4, -1.5]} rotation={[0, 0, Math.PI/2]}>
                <cylinderGeometry args={[0.4, 0.4, 0.3, 16]} />
                <meshStandardMaterial color="#111" />
            </mesh>

            {/* Lights */}
            {/* Headlights */}
            <mesh position={[0.6, 0.8, 2.3]}>
                <sphereGeometry args={[0.2]} />
                <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={5} />
            </mesh>
            <mesh position={[-0.6, 0.8, 2.3]}>
                <sphereGeometry args={[0.2]} />
                <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={5} />
            </mesh>
            {/* Taillights */}
            <mesh position={[0.6, 0.8, -2.3]}>
                <sphereGeometry args={[0.2]} />
                <meshStandardMaterial color="#f00" emissive="#f00" emissiveIntensity={3} />
            </mesh>
            <mesh position={[-0.6, 0.8, -2.3]}>
                <sphereGeometry args={[0.2]} />
                <meshStandardMaterial color="#f00" emissive="#f00" emissiveIntensity={3} />
            </mesh>
        </group>
    );
};

// --- Main Scene ---

const Scene = ({ isDark }: { isDark: boolean }) => {
  return (
    <>
        <PerspectiveCamera makeDefault position={[5, 5, 20]} fov={50} />

        {/* Lighting */}
        <ambientLight intensity={isDark ? 0.1 : 0.5} />
        {isDark ? (
           <directionalLight position={[-5, 10, -5]} intensity={0.5} color="#aaccff" />
        ) : (
           <directionalLight position={[10, 20, 10]} intensity={1.5} castShadow />
        )}
        
        {/* Environment */}
        {isDark ? (
            <>
                <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
                <color attach="background" args={['#050510']} />
                <fog attach="fog" args={['#050510', 10, 100]} />
            </>
        ) : (
            <>
                <Sky sunPosition={[100, 20, 100]} turbidity={0.5} rayleigh={0.5} />
                <color attach="background" args={['#87CEEB']} />
                <fog attach="fog" args={['#87CEEB', 20, 120]} />
            </>
        )}

        {/* Road */}
        <Road isDark={isDark} />
        <MovingStripes />

        {/* Cars */}
        {/* Right Lane (Going away/Forward) */}
        <Car position={[3, 0, 0]} color="#ef4444" speed={30} />
        <Car position={[3, 0, -40]} color="#3b82f6" speed={35} />
        
        {/* Left Lane (Coming towards/Reverse) */}
        <Car position={[-3, 0, -100]} color="#f59e0b" speed={-30} isReverse />
        <Car position={[-3, 0, -20]} color="#8b5cf6" speed={-32} isReverse />

        {/* Ground */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.1, 0]}>
            <planeGeometry args={[500, 500]} />
            <meshStandardMaterial color={isDark ? "#050b03" : "#4a7c2e"} />
        </mesh>
        
        {/* Simple Mountains */}
        <mesh position={[-40, 0, -60]} rotation={[0, Math.PI/4, 0]}>
            <coneGeometry args={[30, 40, 4]} />
            <meshStandardMaterial color={isDark ? "#12122a" : "#2d5016"} />
        </mesh>
        <mesh position={[40, 0, -80]} rotation={[0, -Math.PI/4, 0]}>
            <coneGeometry args={[40, 50, 4]} />
            <meshStandardMaterial color={isDark ? "#12122a" : "#2d5016"} />
        </mesh>
    </>
  );
};

const ModernHighway = () => {
    const [isDark, setIsDark] = useState(true);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const checkTheme = () => {
            const isDarkMode = document.documentElement.classList.contains('dark');
            setIsDark(isDarkMode);
        };
        checkTheme();
        const observer = new MutationObserver(checkTheme);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    const toggleTheme = () => {
        const newTheme = !isDark;
        setIsDark(newTheme);
        if (newTheme) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    if (!mounted) return null;

    return (
        <div className="fixed inset-0 z-0">
             {/* Theme Switcher Overlay */}
            <motion.div 
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1, duration: 0.5, type: "spring" }}
                className="fixed top-6 left-6 z-[9999]"
            >
                <ThemeSwitch checked={!isDark} onChange={toggleTheme} />
            </motion.div>

            <Canvas shadows className="w-full h-full">
                <Scene isDark={isDark} />
            </Canvas>
        </div>
    );
};

export default ModernHighway;
