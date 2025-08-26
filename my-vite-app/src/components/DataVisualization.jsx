import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere } from '@react-three/drei';
import * as THREE from 'three';
import styles from './DataVisualization.module.css';

const DataParticles = ({ theme }) => {
  const particlesRef = useRef();
  const count = 500;
  
  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.3) * 0.1;
      particlesRef.current.rotation.y += 0.002;
    }
  });

  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  
  const getColorForTheme = () => {
    switch(theme) {
      case 'neon-purple': return [0.6, 0.2, 1];
      case 'neon-green': return [0.2, 1, 0.2];
      case 'neon-red': return [1, 0.2, 0.2];
      case 'cyberpunk': return [1, 0, 0.6];
      default: return [0.2, 0.8, 1];
    }
  };
  
  const themeColor = getColorForTheme();
  
  for (let i = 0; i < count * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 10;
    positions[i + 1] = (Math.random() - 0.5) * 10;
    positions[i + 2] = (Math.random() - 0.5) * 10;
    
    // Add some color variation based on theme
    colors[i] = themeColor[0] + Math.random() * 0.3 - 0.15;
    colors[i + 1] = themeColor[1] + Math.random() * 0.3 - 0.15;
    colors[i + 2] = themeColor[2] + Math.random() * 0.3 - 0.15;
  }

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
      />
    </points>
  );
};

const DataBars = () => {
  const barsRef = useRef();
  
  useFrame((state) => {
    if (barsRef.current) {
      barsRef.current.rotation.y = state.clock.getElapsedTime() * 0.2;
    }
  });
  
  const barCount = 12;
  const bars = [];
  
  for (let i = 0; i < barCount; i++) {
    const angle = (i / barCount) * Math.PI * 2;
    const radius = 3;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const height = Math.random() * 2 + 0.5;
    
    bars.push(
      <mesh key={i} position={[x, height / 2, z]} rotation={[0, -angle, 0]}>
        <boxGeometry args={[0.2, height, 0.2]} />
        <meshStandardMaterial color="#4cc9f0" emissive="#4cc9f0" emissiveIntensity={0.5} />
      </mesh>
    );
  }
  
  return <group ref={barsRef}>{bars}</group>;
};

const DataVisualization = ({ theme }) => {
  return (
    <div className={styles.container}>
      <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={1.5} />
        <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={2} />
        <DataParticles theme={theme} />
        <DataBars />
        <Sphere args={[1.5, 32, 32]} position={[0, 0, 0]}>
          <meshStandardMaterial color="#ffffff" transparent opacity={0.1} wireframe />
        </Sphere>
      </Canvas>
    </div>
  );
};

export default DataVisualization;