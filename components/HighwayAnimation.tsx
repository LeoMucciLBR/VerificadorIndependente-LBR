"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import ThemeSwitch from "./ThemeSwitch";

// --- 3D Car with Isometric 3/4 View ---
const LowPolyCar = ({ color, direction, isDark }: { color: string; direction: string; isDark: boolean }) => {
  const darkerColor = color + 'cc';
  const darkestColor = color + '99';
  
  return (
    <div 
      className="relative" 
      style={{ 
        width: '140px', 
        height: '90px',
        transformStyle: 'preserve-3d',
      }}
    >
      {/* Main chassis body - vista 3/4 */}
      <div 
        style={{ 
          position: 'absolute',
          width: '95px', 
          height: '38px', 
          left: '15px',
          top: '28px',
          background: `linear-gradient(135deg, ${color} 0%, ${darkerColor} 100%)`,
          clipPath: 'polygon(8% 0%, 92% 0%, 100% 100%, 0% 100%)',
          boxShadow: '0 3px 12px rgba(0,0,0,0.4)',
        }} 
      />
      
      {/* Front face - diagonal */}
      <div 
        style={{ 
          position: 'absolute',
          width: '28px', 
          height: '38px', 
          left: '9px',
          top: '28px',
          background: `linear-gradient(to right, ${darkerColor} 0%, ${darkestColor} 100%)`,
          clipPath: 'polygon(0% 30%, 100% 0%, 100% 100%, 0% 70%)',
          filter: 'brightness(0.85)',
        }} 
      />
      
      {/* Top surface - visível */}
      <div 
        style={{ 
          position: 'absolute',
          width: '100px', 
          height: '32px', 
          left: '12px',
          top: '22px',
          background: `linear-gradient(to bottom, ${color} 0%, ${darkerColor} 100%)`,
          clipPath: 'polygon(12% 0%, 88% 0%, 100% 100%, 0% 100%)',
          filter: 'brightness(1.15)',
        }} 
      />
      
      {/* Cabin/Roof - 3D */}
      <div 
        style={{ 
          position: 'absolute',
          width: '55px', 
          height: '28px', 
          left: '31px',
          top: '4px',
          background: `linear-gradient(135deg, ${color} 0%, ${darkerColor} 100%)`,
          clipPath: 'polygon(15% 0%, 85% 0%, 100% 100%, 0% 100%)',
          filter: 'brightness(1.1)',
        }} 
      >
        {/* Windshield front */}
        <div 
          style={{ 
            position: 'absolute',
            width: '18px', 
            height: '22px', 
            background: 'linear-gradient(135deg, rgba(147, 197, 253, 0.7) 0%, rgba(147, 197, 253, 0.4) 100%)',
            top: '3px',
            left: '5px',
            clipPath: 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)',
          }} 
        />
        {/* Windshield side */}
        <div 
          style={{ 
            position: 'absolute',
            width: '25px', 
            height: '22px', 
            background: 'linear-gradient(to right, rgba(147, 197, 253, 0.5) 0%, rgba(147, 197, 253, 0.3) 100%)',
            top: '3px',
            right: '3px',
            clipPath: 'polygon(0% 0%, 100% 10%, 100% 100%, 0% 90%)',
          }} 
        />
      </div>
      
      {/* Cabin front face */}
      <div 
        style={{ 
          position: 'absolute',
          width: '22px', 
          height: '28px', 
          left: '26px',
          top: '4px',
          background: `linear-gradient(to right, ${darkestColor} 0%, ${darkerColor} 100%)`,
          clipPath: 'polygon(0% 40%, 100% 0%, 100% 100%, 0% 70%)',
          filter: 'brightness(0.8)',
        }} 
      />
      
      {/* Wheels - perspectiva 3/4 com profundidade */}
      {/* Front wheel visible */}
      <div 
        className="wheel-spin"
        style={{ 
          position: 'absolute',
          width: '22px', 
          height: '22px', 
          background: 'radial-gradient(circle at 40% 40%, #555 20%, #333 50%, #1a1a1a 100%)',
          borderRadius: '50%',
          bottom: '6px',
          left: '22px',
          border: '3px solid #444',
          boxShadow: 'inset -3px -3px 6px rgba(0,0,0,0.8)',
        }} 
      >
        <div style={{ position: 'absolute', width: '9px', height: '9px', borderRadius: '50%', background: '#222', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
      </div>
      
      {/* Rear wheel partially visible */}
      <div 
        className="wheel-spin"
        style={{ 
          position: 'absolute',
          width: '22px', 
          height: '22px', 
          background: 'radial-gradient(circle at 35% 35%, #4a4a4a 20%, #2a2a2a 50%, #1a1a1a 100%)',
          borderRadius: '50%',
          bottom: '6px',
          left: '75px',
          border: '3px solid #3a3a3a',
          boxShadow: 'inset -3px -3px 6px rgba(0,0,0,0.7)',
          filter: 'brightness(0.8)',
        }} 
      >
        <div style={{ position: 'absolute', width: '8px', height: '8px', borderRadius: '50%', background: '#1a1a1a', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
      </div>
      
      {/* Faróis e Lanternas - Baseado no modelo virado para DIREITA */}
      {/* 
        MODELO: Nariz/Frente na DIREITA. Traseira na ESQUERDA.
        Forward (->): Não Inverte (Olha para Direita).
        Reverse (<-): Inverte (Olha para Esquerda).
      */}
      
      {/* Farol amarelo superior (FRENTE -> DIREITA) */}
      <div 
        className={isDark ? 'headlight-glow' : ''}
        style={{ 
          position: 'absolute',
          width: '8px', 
          height: '5px', 
          background: isDark 
            ? 'radial-gradient(ellipse, #fef08a 0%, #fde047 100%)' 
            : 'radial-gradient(ellipse, #e5e5e5 0%, #d4d4d4 100%)',
          right: '34px', 
          top: '26px',
          clipPath: 'polygon(15% 0%, 100% 0%, 85% 100%, 0% 100%)', // Shape \
          boxShadow: isDark 
            ? '0 0 15px rgba(254, 240, 138, 0.9), 0 0 25px rgba(254, 240, 138, 0.5)' 
            : '0 1px 2px rgba(0,0,0,0.2)',
          zIndex: 10,
        }} 
      />
      {/* Farol amarelo inferior (FRENTE -> DIREITA) */}
      <div 
        className={isDark ? 'headlight-glow' : ''}
        style={{ 
          position: 'absolute',
          width: '8px', 
          height: '5px', 
          background: isDark 
            ? 'radial-gradient(ellipse, #fef08a 0%, #fde047 100%)' 
            : 'radial-gradient(ellipse, #e5e5e5 0%, #d4d4d4 100%)',
          right: '34px',
          top: '38px',
          clipPath: 'polygon(15% 0%, 100% 0%, 85% 100%, 0% 100%)', // Shape \
          boxShadow: isDark 
            ? '0 0 15px rgba(254, 240, 138, 0.9), 0 0 25px rgba(254, 240, 138, 0.5)' 
            : '0 1px 2px rgba(0,0,0,0.2)',
          zIndex: 10,
        }} 
      />

      {/* --- LIGHT BEAMS (Outside to avoid clipping) --- */}
      {isDark && (
        <>
          {/* Top Beam */}
          <div 
            className="light-beam"
            style={{
              position: 'absolute',
              top: '28px', // Centered relative to top headlight (26px + 2.5px = 28.5px)
              left: '76px', // Starts exactly at headlight face (110width - 34right = 76left)
              width: '180px',
              height: '40px',
              transformOrigin: 'left center',
              background: 'linear-gradient(90deg, rgba(255, 255, 200, 0.4) 0%, rgba(255, 255, 200, 0.05) 70%, transparent 100%)',
              clipPath: 'polygon(12% 45%, 100% 0%, 100% 100%, 12% 55%)',
              pointerEvents: 'none',
              zIndex: -1,
            }}
          />
          {/* Bottom Beam */}
          <div 
            className="light-beam"
            style={{
              position: 'absolute',
              top: '40px', // Centered relative to bottom headlight (38px + 2.5px = 40.5px)
              left: '76px',
              width: '180px',
              height: '40px',
              transformOrigin: 'left center',
              background: 'linear-gradient(90deg, rgba(255, 255, 200, 0.4) 0%, rgba(255, 255, 200, 0.05) 70%, transparent 100%)',
              clipPath: 'polygon(12% 45%, 100% 0%, 100% 100%, 12% 55%)',
              pointerEvents: 'none',
              zIndex: -1,
            }}
          />
        </>
      )}
      
      {/* Shadow underneath */}
      <div 
        style={{ 
          position: 'absolute',
          width: '110px', 
          height: '32px', 
          background: 'radial-gradient(ellipse, rgba(0,0,0,0.5) 0%, transparent 70%)',
          bottom: '-3px',
          left: '8px',
          filter: 'blur(10px)',
        }} 
      />
    </div>
  );
};



// --- Improved Parallax Clouds ---
const Clouds = () => {
  const clouds = useMemo(() => {
    // Layer 1: Background (Small, Slow, Low Opacity)
    const backClouds = Array.from({ length: 6 }).map((_, i) => {
      const duration = 120 + Math.random() * 60;
      return {
        id: `back-${i}`,
        left: 100, // Start off-screen right
        top: Math.random() * 40,
        scale: 0.5 + Math.random() * 0.3,
        opacity: 0.2 + Math.random() * 0.2,
        duration: duration,
        delay: -Math.random() * duration, // Random start point in the cycle
      };
    });

    // Layer 2: Midground (Medium, Normal)
    const midClouds = Array.from({ length: 5 }).map((_, i) => {
      const duration = 90 + Math.random() * 40;
      return {
        id: `mid-${i}`,
        left: 100, // Start off-screen right
        top: Math.random() * 30,
        scale: 0.8 + Math.random() * 0.4,
        opacity: 0.4 + Math.random() * 0.3,
        duration: duration,
        delay: -Math.random() * duration,
      };
    });

    // Layer 3: Foreground (Large, Fast, Distinct)
    const frontClouds = Array.from({ length: 4 }).map((_, i) => {
      const duration = 50 + Math.random() * 30;
      return {
        id: `front-${i}`,
        left: 100, // Start off-screen right
        top: Math.random() * 20,
        scale: 1.2 + Math.random() * 0.6,
        opacity: 0.7 + Math.random() * 0.3,
        duration: duration,
        delay: -Math.random() * duration,
      };
    });

    return [...backClouds, ...midClouds, ...frontClouds];
  }, []);

  return (
    <>
      {clouds.map((cloud) => (
        <div 
          key={`cloud-${cloud.id}`} 
          className="absolute" 
          style={{ 
            left: `${cloud.left}%`, 
            top: `${cloud.top}%`, 
            transform: `scale(${cloud.scale})`,
            opacity: cloud.opacity, 
            animation: `cloudMove ${cloud.duration}s linear infinite`, 
            animationDelay: `${cloud.delay}s`,
            willChange: 'transform'
          }}
        >
          <svg width="200" height="60" viewBox="0 0 200 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10,40 Q25,25 50,30 Q70,5 100,25 Q130,5 160,30 Q180,20 190,40 H10 Z" fill="white" />
          </svg>
        </div>
      ))}
    </>
  );
};

const HighwayAnimation = () => {
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(true);

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

  // Enhanced Stars
  const stars = useMemo(() => Array.from({ length: 200 }).map((_, i) => ({ 
    id: i, 
    left: Math.random() * 100, 
    top: Math.random() * 60, 
    size: Math.random() > 0.95 ? 2.5 : Math.random() > 0.7 ? 1.5 : 1, 
    opacity: 0.1 + Math.random() * 0.9, 
    delay: Math.random() * 5, 
    duration: 3 + Math.random() * 4, 
  })), []);

  // Shooting Stars (Rare)
  const shootingStars = useMemo(() => Array.from({ length: 2 }).map((_, i) => ({
    id: `shoot-${i}`,
    left: Math.random() * 80,
    top: Math.random() * 30,
    delay: Math.random() * 20, // Initial offset
    duration: 20 + Math.random() * 20, // Long cycle (20s-40s)
  })), []);
  const mountains = useMemo(() => Array.from({ length: 20 }).map((_, i) => ({ id: i, width: 80 + (i % 4) * 30, height: 40 + (i % 5) * 12 })), []);
  const hills = useMemo(() => Array.from({ length: 24 }).map((_, i) => ({ id: i, width: 50 + (i % 3) * 25, height: 25 + (i % 4) * 8 })), []);

  const toggleTheme = () => { document.documentElement.classList.toggle('dark'); setIsDark(!isDark); };

  // --- Traffic Logic ---
  const carColors = ['#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6'];
  const cars = useMemo(() => [
    // Faixa superior (lane 1) - carros INDO (Velocidade constante para não colidir)
    { id: 0, color: '#ef4444', duration: 20, delay: 0, lane: 1, scale: 1.0, direction: 'forward' },
    { id: 1, color: '#3b82f6', duration: 20, delay: -10, lane: 1, scale: 1.05, direction: 'forward' },
    // Faixa inferior (lane -1) - carros VOLTANDO (Velocidade constante para não colidir)
    { id: 2, color: '#f59e0b', duration: 18, delay: -2, lane: -1, scale: 1.02, direction: 'reverse' },
    { id: 3, color: '#8b5cf6', duration: 18, delay: -11, lane: -1, scale: 1.08, direction: 'reverse' },
  ], []);

  if (!mounted) return null;

  const mountainColor = isDark ? "linear-gradient(to top, #12122a 0%, #1a1a3a 100%)" : "linear-gradient(to top, #2d5016 0%, #4a7c2e 100%)";
  const hillColor = isDark ? "linear-gradient(to top, #1a1a35 0%, #222245 100%)" : "linear-gradient(to top, #3d6b1f 0%, #5a9131 100%)";
  
  // Estrada reta
  const roadPathData = "M 0 100 L 2000 100";

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 1.1 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.5, ease: "easeOut" }}
      className="fixed inset-0 overflow-hidden"
    >
      
      {/* Backgrounds */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#050510] via-[#0a0a1a] to-[#0d0d20]" />
      <div className={`absolute inset-0 bg-gradient-to-b from-[#87CEEB] via-[#B8D8E8] to-[#E8F4F8] transition-opacity duration-1000 ${isDark ? 'opacity-0' : 'opacity-100'}`} />
      
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1, duration: 0.5, type: "spring" }}
        className="fixed top-6 left-6 z-[9999]"
      >
        <ThemeSwitch checked={!isDark} onChange={toggleTheme} />
      </motion.div>

      {/* Sky Scene */}
      <div className="absolute inset-0">
        <div className={`transition-opacity duration-1000 ${isDark ? 'opacity-100' : 'opacity-0'}`}>
          {stars.map((star) => (
            <div key={`star-${star.id}`} className="absolute rounded-full bg-white animate-pulse" style={{ width: star.size, height: star.size, left: star.left + '%', top: star.top + '%', opacity: star.opacity, animationDuration: star.duration + 's', animationDelay: star.delay + 's' }} />
          ))}
          
          {/* Constellations (Static SVG Overlay) */}
          <svg className="absolute top-0 left-0 w-full h-[40%] opacity-30 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
             {/* Example: Crux / Southern Cross style */}
             <circle cx="80" cy="20" r="0.3" fill="white" />
             <circle cx="82" cy="25" r="0.3" fill="white" />
             <circle cx="78" cy="25" r="0.3" fill="white" />
             <circle cx="80" cy="32" r="0.3" fill="white" />
             <circle cx="81" cy="28" r="0.2" fill="white" />
             <path d="M 80 20 L 80 32 M 78 25 L 82 25" stroke="white" strokeWidth="0.1" strokeOpacity="0.5" vectorEffect="non-scaling-stroke" />

             {/* Example: Big Dipper style (Generic) */}
             <circle cx="10" cy="15" r="0.3" fill="white" />
             <circle cx="15" cy="12" r="0.3" fill="white" />
             <circle cx="20" cy="14" r="0.3" fill="white" />
             <circle cx="23" cy="20" r="0.3" fill="white" />
             <circle cx="23" cy="25" r="0.3" fill="white" />
             <circle cx="30" cy="25" r="0.3" fill="white" />
             <circle cx="30" cy="20" r="0.3" fill="white" />
             <path d="M 10 15 L 15 12 L 20 14 L 23 20 L 23 25 L 30 25 L 30 20" stroke="white" strokeWidth="0.1" strokeOpacity="0.5" fill="none" vectorEffect="non-scaling-stroke" />
          </svg>

          {/* Shooting Stars */}
          {shootingStars.map((s, i) => (
             <div 
               key={s.id} 
               className="absolute bg-white rounded-full shooting-star"
               style={{ 
                 top: s.top + '%', 
                 left: s.left + '%', 
                 width: '4px',
                 height: '4px',
                 animationDelay: s.delay + 's',
                 animationDuration: s.duration + 's'
               }}
             />
          ))}
        </div>
        <div className={`transition-opacity duration-1000 ${isDark ? 'opacity-0' : 'opacity-100'}`}>
          <Clouds />
        </div>
      </div>
      <div className="absolute w-14 h-14 rounded-full transition-all duration-1000 ease-in-out" style={{ ...(isDark ? { top: '3rem', right: '12%', background: "radial-gradient(circle at 35% 35%, #f4f4f4 0%, #e0e0e0 50%, #b0b0b0 100%)", boxShadow: "0 0 30px 5px rgba(255, 255, 255, 0.4)" } : { top: '5rem', right: '15%', background: "radial-gradient(circle at 35% 35%, #fffef0 0%, #fdd835 60%, #f9a825 100%)", boxShadow: "0 0 80px 30px rgba(253, 216, 53, 0.5)" }) }} />

      {/* Ground/Grass */}
      <div className="absolute bottom-0 left-0 right-0 transition-opacity duration-1000" style={{ height: '42%', background: isDark ? 'linear-gradient(to top, #050b03 0%, #081005 100%)' : 'linear-gradient(to top, #4a7c2e 0%, #5a9131 100%)' }} />

      {/* Mountains */}
      <div className="absolute bottom-[32%] left-0 right-0 h-28 overflow-hidden pointer-events-none">
        <div className="flex" style={{ width: "200%", animation: "scrollLeft 300s linear infinite" }}>
          {[...mountains, ...mountains].map((m, i) => (
            <div key={`mountain-${i}`} className="flex-shrink-0" style={{ width: m.width, height: m.height, background: mountainColor, clipPath: "polygon(0% 100%, 50% 0%, 100% 100%)", marginLeft: "-15px" }} />
          ))}
        </div>
      </div>
      <div className="absolute bottom-[28%] left-0 right-0 h-20 overflow-hidden pointer-events-none">
        <div className="flex" style={{ width: "200%", animation: "scrollLeft 200s linear infinite" }}>
          {[...hills, ...hills].map((h, i) => (
            <div key={`hill-${i}`} className="flex-shrink-0" style={{ width: h.width, height: h.height, background: hillColor, clipPath: "polygon(0% 100%, 25% 30%, 75% 20%, 100% 100%)", marginLeft: "-8px" }} />
          ))}
        </div>
      </div>

      {/* --- ANIMATED WINDING ROAD & CARS --- */}
      <div className="absolute bottom-[-50px] md:bottom-[-130px] left-[-10%] w-[120%] h-[300px] md:h-[400px] pointer-events-none perspective-container">
        <div 
          className="relative w-full h-full origin-center"
          style={{
            transform: 'perspective(800px) rotateX(60deg)',
            transformStyle: 'preserve-3d'
          }}
        >
          <svg 
            className="absolute inset-0 w-full h-full overflow-visible" 
            viewBox="0 0 1800 200" 
            preserveAspectRatio="xMidYMid slice"
          >
            {/* Road Base */}
            <path d={roadPathData} fill="none" stroke={isDark ? '#1e293b' : '#374151'} strokeWidth="110" strokeLinecap="round" className="filter drop-shadow-lg" />
            
            {/* Center Lines - Duas linhas amarelas paralelas com espaço (estilo brasileiro) - ANIMAÇÃO LONGA E VARIADA */}
            {/* Top Line: Solid 4500 -> Dotted 1000 -> Solid 1000 -> Dotted 1500 (approx) */}
            <path d={roadPathData} fill="none" stroke={isDark ? '#fbbf24' : '#f59e0b'} strokeWidth="3" transform="translate(0, -3)" 
              strokeDasharray="4500 40 40 40 40 40 40 40 40 40 40 40 40 40 40 40 40 40 40 40 40 40 40 40 40 40 40 40 1000 40 40 40 40 40 40 40 40 40 40 40 40 40 40 40 40 40 40 40 40 40 40 40 40 40 40 40 40 40 40 40 40 40 40 40 40 40" 
              className="center-line-animate" />
            {/* Bottom Line: Solid 2000 -> Dotted 1000 -> Solid 3500 -> Dotted 1500 (approx) */}
            <path d={roadPathData} fill="none" stroke={isDark ? '#fbbf24' : '#f59e0b'} strokeWidth="3" transform="translate(0, 3)" 
              strokeDasharray="2000 40 40 40 40 40 40 40 40 40 40 40 40 40 40 40 40 40 40 40 40 40 40 40 40 40 40 40 3500 40 40 40 40 40 40 40 40 40 40 40 40 40 40 40 40 40 40 40 40 40 40 40 40 40 40 40 40 40 40 40 40 40 40 40 40 40" 
              className="center-line-animate" />
            
            {/* Side Lines */}
            <path d={roadPathData} fill="none" stroke="white" strokeWidth="2" strokeOpacity="0.4" transform="translate(0, -52)" />
            <path d={roadPathData} fill="none" stroke="white" strokeWidth="2" strokeOpacity="0.4" transform="translate(0, 52)" />
            
            {/* --- Cars using SVG animateMotion --- */}
            {cars.map((car) => (
              <g key={`car-${car.id}`}>
                <foreignObject
                  width="180"
                  height="120"
                  x="-90"
                  y={-45 + car.lane * (car.lane === -1 ? 48 : 28)}
                  style={{ overflow: 'visible' }}
                >
                  <div 
                    style={{ 
                      transform: `rotateX(-60deg) scale(${car.scale}) ${car.direction === 'reverse' ? 'scaleX(-1)' : ''}`,
                      transformOrigin: 'center center',
                    }}
                  >
                    <LowPolyCar color={car.color} direction={car.direction} isDark={isDark} />
                  </div>
                </foreignObject>
                <animateMotion
                  dur={`${car.duration}s`}
                  repeatCount="indefinite"
                  begin={`${car.delay}s`}
                  path={roadPathData}
                  keyPoints={car.direction === 'reverse' ? '1;0' : '0;1'}
                  keyTimes="0;1"
                  calcMode="linear"
                />
              </g>
            ))}
          </svg>
        </div>
      </div>

      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.65) 100%)" }} />

      <style jsx global>{`
        @keyframes scrollLeft { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        
        @keyframes shoot {
          0% { transform: translateX(0) translateY(0) rotate(215deg) scale(1); opacity: 1; }
          7% { transform: translateX(-300px) translateY(200px) rotate(215deg) scale(1); opacity: 0; }
          100% { transform: translateX(-300px) translateY(200px) rotate(215deg) scale(1); opacity: 0; }
        }
        .shooting-star {
          position: absolute;
          height: 2px;
          background: linear-gradient(-45deg, rgba(255,255,255,1), rgba(0,0,255,0));
          border-radius: 999px;
          filter: drop-shadow(0 0 6px rgba(105, 155, 255, 1));
          animation-name: shoot;
          animation-timing-function: ease-out;
          animation-iteration-count: infinite;
          opacity: 0;
        }
        .shooting-star::before {
           content: '';
           position: absolute;
           top: 50%;
           transform: translateY(-50%);
           width: 200px;
           height: 1px;
           background: linear-gradient(90deg, rgba(255,255,255,0.8), transparent);
           right: 0;
           border-radius: 999px;
        }
        @keyframes cloudMove { 0% { transform: translateX(0); } 100% { transform: translateX(-150vw); } }
        @keyframes movePath { 0% { offset-distance: 0%; } 100% { offset-distance: 100%; } }
        
        @keyframes wheelSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .wheel-spin { animation: wheelSpin 0.3s linear infinite; }
        
        @keyframes headlightGlow { 
          0%, 100% { box-shadow: 0 0 15px #fef08a, 0 0 25px rgba(254, 240, 138, 0.5); }
          50% { box-shadow: 0 0 25px #fef08a, 0 0 40px rgba(254, 240, 138, 0.8); }
        }
        @keyframes taillightGlow { 
          0%, 100% { box-shadow: 0 0 10px #ff0000, 0 0 20px rgba(255, 0, 0, 0.6); }
          50% { box-shadow: 0 0 20px #ff0000, 0 0 30px rgba(255, 0, 0, 0.9); }
        }
        .taillight-glow { animation: taillightGlow 1.5s ease-in-out infinite alternate; }
        .headlight-glow { animation: headlightGlow 2s ease-in-out infinite; }
        
        @keyframes dashMove { 0% { stroke-dashoffset: 0; } 100% { stroke-dashoffset: -7980; } }
        .center-line-animate { animation: dashMove 40s linear infinite; }
        
        @keyframes carBounce { 
          0%, 100% { transform: translateX(-50px) translateY(-40px) rotateX(-60deg); }
          50% { transform: translateX(-50px) translateY(-42px) rotateX(-60deg); }
        }
        .car-bounce { 
          animation: carBounce 1s ease-in-out infinite; 
          will-change: transform;
        }
        
        @keyframes beamPulsate { 
          0%, 100% { opacity: 0.8; transform: translateY(-50%) perspective(500px) rotateY(-10deg) scaleX(1); }
          50% { opacity: 1; transform: translateY(-50%) perspective(500px) rotateY(-10deg) scaleX(1.05); }
        }
        .light-beam { animation: beamPulsate 0.1s ease-in-out infinite alternate; }
        
        .car-motion {
          position: absolute;
          width: 100%;
          height: 100%;
        }
        
        .car-on-path {
          overflow: visible !important;
        }
        
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .backface-hidden { backface-visibility: hidden; }
      `}</style>
    </motion.div>
  );
};

export default HighwayAnimation;