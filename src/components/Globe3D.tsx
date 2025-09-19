import { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useLoader, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';

interface Globe3DProps {
  center: { lat: number; lng: number };
  onGlobeClick?: (location: { lat: number; lng: number }) => void;
  traces?: Array<{
    id: string;
    latitude: number;
    longitude: number;
    message: string;
    created_at: string;
  }>;
}

// Convert lat/lng to 3D coordinates on a sphere
const latLngToVector3 = (lat: number, lng: number, radius: number = 1) => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);

  return new THREE.Vector3(x, y, z);
};

// Convert 3D position back to lat/lng
const vector3ToLatLng = (position: THREE.Vector3) => {
  const radius = position.length();
  const lat = 90 - (Math.acos(position.y / radius) * 180) / Math.PI;
  const lng = ((Math.atan2(position.z, -position.x) * 180) / Math.PI) - 180;
  return { lat, lng };
};

const EarthSphere = ({ onGlobeClick, traces = [] }: { onGlobeClick?: Globe3DProps['onGlobeClick'], traces: Globe3DProps['traces'] }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [earthTexture] = useLoader(THREE.TextureLoader, [
    'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Land_ocean_ice_cloud_1024.jpg/1024px-Land_ocean_ice_cloud_1024.jpg'
  ]);

  // Auto-rotation
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.1;
    }
  });

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    if (!onGlobeClick) return;
    
    event.stopPropagation();
    const point = event.point;
    const { lat, lng } = vector3ToLatLng(point);
    onGlobeClick({ lat, lng });
  };

  return (
    <group>
      {/* Earth */}
      <mesh ref={meshRef} onClick={handleClick}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial map={earthTexture} />
      </mesh>

      {/* Traces markers */}
      {traces.map((trace) => {
        const position = latLngToVector3(trace.latitude, trace.longitude, 1.02);
        return (
          <group key={trace.id}>
            <mesh position={position}>
              <sphereGeometry args={[0.02, 8, 8]} />
              <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.3} />
            </mesh>
            <Text
              position={[position.x * 1.1, position.y * 1.1, position.z * 1.1]}
              fontSize={0.05}
              color="#fbbf24"
              anchorX="center"
              anchorY="middle"
            >
              {trace.message.substring(0, 20)}...
            </Text>
          </group>
        );
      })}
    </group>
  );
};

const Globe3D = ({ center, onGlobeClick, traces = [] }: Globe3DProps) => {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 2.5], fov: 75 }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -5]} intensity={0.5} />
        
        <EarthSphere onGlobeClick={onGlobeClick} traces={traces} />
        
        <OrbitControls
          enableZoom={true}
          enablePan={false}
          enableRotate={true}
          minDistance={1.5}
          maxDistance={5}
          autoRotate={false}
          rotateSpeed={0.5}
        />
      </Canvas>
    </div>
  );
};

export default Globe3D;