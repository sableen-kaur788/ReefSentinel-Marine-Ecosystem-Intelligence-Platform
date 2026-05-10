import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { motion } from 'framer-motion';

function LightRays() {
  const raysRef = useRef<THREE.Group>(null);
  const materialsRef = useRef<THREE.MeshBasicMaterial[]>([]);
  
  const rays = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => ({
      id: i,
      x: (i - 3.5) * 2.5,
      opacity: 0.02 + Math.random() * 0.03,
      width: 0.3 + Math.random() * 0.8,
      speed: 0.0003 + Math.random() * 0.0007,
    }));
  }, []);

  useFrame((state) => {
    materialsRef.current.forEach((material, i) => {
      if (material) {
        material.opacity = 0.015 + Math.sin(state.clock.elapsedTime * rays[i].speed * 150) * 0.015;
      }
    });
    
    // Sway the rays
    if (raysRef.current) {
      raysRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.1) * 0.02;
    }
  });

  return (
    <group ref={raysRef}>
      {rays.map((ray, i) => (
        <mesh key={ray.id} position={[ray.x, 4, -6]} rotation={[0, 0, -0.15]}>
          <planeGeometry args={[ray.width, 20]} />
          <meshBasicMaterial
            ref={(el) => { if (el) materialsRef.current[i] = el; }}
            color="#38bdf8"
            transparent
            opacity={ray.opacity}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

function FloatingParticles() {
  const particlesRef = useRef<THREE.Points>(null);
  const count = 300;

  const [positions, velocities] = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 25;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 25;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 15;
      
      velocities[i * 3] = (Math.random() - 0.5) * 0.008;
      velocities[i * 3 + 1] = 0.003 + Math.random() * 0.008;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.003;
    }
    
    return [positions, velocities];
  }, []);

  useFrame((state) => {
    if (!particlesRef.current) return;
    const positionArray = particlesRef.current.geometry.attributes.position.array as Float32Array;
    
    for (let i = 0; i < count; i++) {
      // Add subtle wave motion
      positionArray[i * 3] += velocities[i * 3] + Math.sin(state.clock.elapsedTime * 0.5 + i) * 0.001;
      positionArray[i * 3 + 1] += velocities[i * 3 + 1];
      positionArray[i * 3 + 2] += velocities[i * 3 + 2];
      
      if (positionArray[i * 3 + 1] > 12) {
        positionArray[i * 3 + 1] = -12;
        positionArray[i * 3] = (Math.random() - 0.5) * 25;
      }
    }
    
    particlesRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        color="#00d4ff"
        transparent
        opacity={0.7}
        sizeAttenuation
      />
    </points>
  );
}

function SwayingCoral() {
  const coralRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!coralRef.current) return;
    
    coralRef.current.children.forEach((coral, i) => {
      // Each coral sways at different speed
      const sway = Math.sin(state.clock.elapsedTime * (0.5 + i * 0.1)) * 0.08;
      coral.rotation.z = sway;
      coral.rotation.x = sway * 0.5;
    });
  });

  const coralData = useMemo(() => [
    { x: -7, scale: 1.4, height: 4, color: '#1a3a4a' },
    { x: -4.5, scale: 0.9, height: 2.8, color: '#1e4a5a' },
    { x: -2, scale: 1.1, height: 3.5, color: '#163040' },
    { x: 1.5, scale: 0.8, height: 2.5, color: '#1a4a5a' },
    { x: 4, scale: 1.3, height: 3.8, color: '#143440' },
    { x: 6.5, scale: 0.7, height: 2.2, color: '#1e3a4a' },
    { x: 8.5, scale: 1, height: 3, color: '#164050' },
  ], []);

  return (
    <group ref={coralRef} position={[0, -6, -2]}>
      {coralData.map((coral, i) => (
        <mesh key={i} position={[coral.x, coral.height / 2, 0]}>
          <cylinderGeometry args={[0.08 * coral.scale, 0.35 * coral.scale, coral.height, 6]} />
          <meshBasicMaterial color={coral.color} transparent opacity={0.25} />
        </mesh>
      ))}
    </group>
  );
}

function SwimmingFish() {
  const fishRef = useRef<THREE.Group>(null);
  
  const fish = useMemo(() => [
    { id: 1, y: 2, speed: 0.8, size: 0.15, color: '#ff6b6b' },
    { id: 2, y: -1, speed: 0.6, size: 0.12, color: '#4ecdc4' },
    { id: 3, y: 3.5, speed: 0.9, size: 0.1, color: '#ffe66d' },
    { id: 4, y: -2.5, speed: 0.7, size: 0.13, color: '#ff6b6b' },
    { id: 5, y: 1, speed: 0.5, size: 0.11, color: '#4ecdc4' },
  ], []);

  useFrame((state) => {
    if (!fishRef.current) return;
    
    fishRef.current.children.forEach((fishMesh, i) => {
      const f = fish[i];
      // Swim back and forth
      const x = Math.sin(state.clock.elapsedTime * f.speed * 0.5) * 8;
      fishMesh.position.x = x;
      fishMesh.position.y = f.y + Math.sin(state.clock.elapsedTime * f.speed) * 0.3;
      
      // Face direction of movement
      fishMesh.rotation.y = Math.cos(state.clock.elapsedTime * f.speed * 0.5) > 0 ? 0 : Math.PI;
      
      // Bobbing motion
      fishMesh.position.z = Math.sin(state.clock.elapsedTime * f.speed * 2) * 0.2;
    });
  });

  return (
    <group ref={fishRef}>
      {fish.map((f) => (
        <mesh key={f.id} position={[0, f.y, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <coneGeometry args={[f.size, f.size * 2, 8]} />
          <meshBasicMaterial color={f.color} transparent opacity={0.6} />
        </mesh>
      ))}
    </group>
  );
}

function Seaweed() {
  const seaweedRef = useRef<THREE.Group>(null);
  
  const plants = useMemo(() => [
    { x: -5, height: 2, segments: 8 },
    { x: -3, height: 2.5, segments: 10 },
    { x: 2, height: 1.8, segments: 7 },
    { x: 5, height: 2.2, segments: 9 },
    { x: 7, height: 1.5, segments: 6 },
  ], []);

  useFrame((state) => {
    if (!seaweedRef.current) return;
    
    seaweedRef.current.children.forEach((plant, i) => {
      // Sway like seaweed in current
      plant.rotation.z = Math.sin(state.clock.elapsedTime * 0.8 + i) * 0.15;
    });
  });

  return (
    <group ref={seaweedRef} position={[0, -5, -1]}>
      {plants.map((p, i) => (
        <mesh key={i} position={[p.x, p.height / 2, 0]}>
          <cylinderGeometry args={[0.05, 0.02, p.height, 4]} />
          <meshBasicMaterial color="#2d5a4a" transparent opacity={0.2} />
        </mesh>
      ))}
    </group>
  );
}

export function OceanBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Coral Reef Image Background */}
      <motion.div 
        className="absolute inset-0"
        animate={{
          scale: [1, 1.02, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <img
          src="/background.avif"
          alt="Coral Reef"
          className="w-full h-full object-cover opacity-30"
        />
        {/* Dark overlay gradient for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-ocean-950/80 via-ocean-900/60 to-ocean-950/90" />
        <div className="absolute inset-0 bg-gradient-to-r from-ocean-950/40 via-transparent to-ocean-950/40" />
      </motion.div>

      {/* Animated water ripple overlay */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div 
          className="w-full h-full"
          style={{
            background: 'repeating-linear-gradient(90deg, transparent, transparent 50px, rgba(0,212,255,0.03) 50px, rgba(0,212,255,0.03) 100px)',
            animation: 'wave 15s linear infinite',
          }}
        />
      </div>

      {/* 3D Effects Layer */}
      <div className="absolute inset-0 opacity-60">
        <Canvas
          camera={{ position: [0, 0, 12], fov: 55 }}
          style={{ background: 'transparent' }}
        >
          <ambientLight intensity={0.4} />
          <pointLight position={[0, 8, 6]} intensity={0.6} color="#38bdf8" />
          <pointLight position={[-5, 2, 4]} intensity={0.3} color="#00d4ff" />
          <pointLight position={[5, -2, 4]} intensity={0.3} color="#ff6b6b" />
          
          <LightRays />
          <FloatingParticles />
          <SwayingCoral />
          <SwimmingFish />
          <Seaweed />
        </Canvas>
      </div>
      
      {/* Animated ambient glows */}
      <motion.div 
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-reef-cyan/10 rounded-full blur-[150px]"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <motion.div 
        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-reef-coral/10 rounded-full blur-[150px]"
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 1,
        }}
      />
      
      {/* Moving light orbs */}
      <motion.div
        className="absolute w-32 h-32 rounded-full bg-cyan-400/20 blur-3xl"
        animate={{
          x: [0, 300, 0],
          y: [0, -200, 100, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{ left: '10%', top: '60%' }}
      />
      <motion.div
        className="absolute w-24 h-24 rounded-full bg-purple-400/20 blur-3xl"
        animate={{
          x: [0, -200, 100, 0],
          y: [0, 150, -100, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 5,
        }}
        style={{ right: '15%', top: '30%' }}
      />
      
      {/* Noise texture overlay */}
      <div className="noise-overlay" />
    </div>
  );
}

// Add wave animation keyframes to CSS
const style = document.createElement('style');
style.textContent = `
  @keyframes wave {
    0% { transform: translateX(0); }
    100% { transform: translateX(100px); }
  }
`;
document.head.appendChild(style);
