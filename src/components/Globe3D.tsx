import { useRef } from 'react';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
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

const EarthSphere = ({ onGlobeClick, traces = [], center }: { onGlobeClick?: Globe3DProps['onGlobeClick'], traces: Globe3DProps['traces'], center: { lat: number; lng: number } }) => {
  const meshRef = useRef<THREE.Mesh>(null);

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
      {/* Earth - simple colored sphere */}
      <mesh ref={meshRef} onClick={handleClick}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial 
          color="#1e40af" 
          roughness={0.8}
          metalness={0.2}
        />
      </mesh>

      {/* Current position marker */}
      <mesh position={latLngToVector3(center.lat, center.lng, 1.05)}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial 
          color="#ef4444" 
          emissive="#ef4444" 
          emissiveIntensity={0.8} 
        />
      </mesh>

      {/* Traces markers */}
      {traces.map((trace) => {
        const position = latLngToVector3(trace.latitude, trace.longitude, 1.05);
        return (
          <mesh key={trace.id} position={position}>
            <sphereGeometry args={[0.02, 8, 8]} />
            <meshStandardMaterial 
              color="#fbbf24" 
              emissive="#fbbf24" 
              emissiveIntensity={0.5} 
            />
          </mesh>
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
        
        <EarthSphere onGlobeClick={onGlobeClick} traces={traces} center={center} />
        
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