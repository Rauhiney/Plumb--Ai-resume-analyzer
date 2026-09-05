import { useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

function ParticleField({ count = 900 }) {
  const ref = useRef();
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 3.2 + Math.random() * 3.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, [count]);

  useFrame((state, delta) => {
    ref.current.rotation.y -= delta * 0.03;
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.025}
        color="#00F3FF"
        transparent
        opacity={0.65}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

function Core() {
  const outer = useRef();
  const inner = useRef();
  const ring = useRef();
  const group = useRef();
  const { pointer } = useThree();

  useFrame((state, delta) => {
    outer.current.rotation.y += delta * 0.15;
    outer.current.rotation.z += delta * 0.05;
    inner.current.rotation.y -= delta * 0.25;
    const t = state.clock.elapsedTime;
    ring.current.position.y = Math.sin(t * 0.8) * 1.4;
    ring.current.rotation.z += delta * 0.4;
    group.current.rotation.x = THREE.MathUtils.lerp(
      group.current.rotation.x,
      pointer.y * 0.35,
      0.04
    );
    group.current.rotation.y = THREE.MathUtils.lerp(
      group.current.rotation.y,
      pointer.x * 0.45,
      0.04
    );
  });

  return (
    <group ref={group}>
      <mesh ref={outer}>
        <icosahedronGeometry args={[1.9, 1]} />
        <meshBasicMaterial color="#00F3FF" wireframe transparent opacity={0.5} />
      </mesh>
      <mesh ref={inner}>
        <icosahedronGeometry args={[1.15, 0]} />
        <meshStandardMaterial
          color="#0E131F"
          emissive="#8B5CF6"
          emissiveIntensity={0.55}
          roughness={0.2}
          metalness={0.9}
        />
      </mesh>
      <mesh ref={ring} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.5, 0.012, 8, 128]} />
        <meshBasicMaterial color="#00FF9D" transparent opacity={0.7} />
      </mesh>
      <ParticleField />
    </group>
  );
}

export function Hero3D() {
  return (
    <div
      data-testid="hero-3d-canvas"
      className="absolute inset-0 z-0 opacity-90"
      aria-hidden="true"
    >
      <Canvas camera={{ position: [0, 0, 6], fov: 55 }} dpr={[1, 2]}>
        <ambientLight intensity={0.6} />
        <pointLight position={[10, 10, 10]} color="#00F3FF" intensity={60} />
        <pointLight position={[-10, -10, -10]} color="#8B5CF6" intensity={50} />
        <Core />
      </Canvas>
    </div>
  );
}
