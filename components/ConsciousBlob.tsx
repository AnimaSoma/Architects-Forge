"use client";
import { useFrame, useThree, useLoader } from '@react-three/fiber';
import {
  Sphere,
  OrbitControls,
  MeshTransmissionMaterial,
} from '@react-three/drei';
import * as THREE from 'three';
import { useRef, useMemo } from 'react';
import { useTouchMemory } from './useTouchMemory';
import { BlobMaterial } from './BlobMaterial';
import { useISRM } from '../store/ism';
import { useBlobQueue } from '../store/blobQueue';
import { useThinking } from '../store/thinking';

export default function ConsciousBlob() {
  const mesh = useRef<THREE.Mesh>(null!);
  const { camera, gl } = useThree();
  const { memories, addTouch, update } = useTouchMemory();
  // thinking state from store
  const { thinking } = useThinking();
  
  // Load fractal mask texture
  const fractalTexture = useMemo(() => {
    try {
      return new THREE.TextureLoader().load('/fractal.png');
    } catch (e) {
      // Fallback - create procedural noise texture
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 256;
      const ctx = canvas.getContext('2d')!;
      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const r = Math.floor(Math.random() * 255);
          ctx.fillStyle = `rgb(${r},${r},${r})`;
          ctx.fillRect(x, y, 1, 1);
        }
      }
      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      return texture;
    }
  }, []);
  
  // shader material instance
  const material = useMemo(() => {
    const mat = new BlobMaterial();
    // Set the fractal mask texture
    mat.mask = fractalTexture;
    return mat;
  }, [fractalTexture]);

  // ISRM global store -------------------------------
  const {
    energy,
    utility,
    predictionError,
    coherenceTension, // ΔC
    addEnergy,
    update: updateISRM
  } =
    useISRM();
  // queue of scars added by chat interactions
  const { popScar } = useBlobQueue();

  // raycaster for clicks
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const pointer = useMemo(() => new THREE.Vector2(), []);
  // wrapper group to scale blob by energy
  const groupRef = useRef<THREE.Group>(null!);

  // on click handler
  function handlePointerDown(e: any) {
    const { clientX, clientY } = e;
    const { width, height } = gl.domElement.getBoundingClientRect();
    pointer.x = (clientX / width) * 2 - 1;
    pointer.y = -(clientY / height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObject(mesh.current);
    if (intersects.length) {
      // stronger impact when the user directly pokes the blob
      addTouch(intersects[0].point, 1.0);
      // give Aura a jolt of energy & raise ΔS a bit
      addEnergy(0.2);
      updateISRM({
        predictionError: Math.min(1, predictionError + 0.05)
      });
    }
  }

  useFrame((state, delta) => {
    // apply external scars queued by chat
    const queued = popScar();
    if (queued) addTouch(queued, 1.0); // questions create a noticeable scar

    // update memories decay
    update(delta);

    // ----------------------------------------------------------------
    // Update shader uniforms (time, energy, utility handled elsewhere)
    // ----------------------------------------------------------------
    material.time = state.clock.getElapsedTime();
    // Copy memory data into fixed-length arrays (max 10)
    const posArr: THREE.Vector3[] = [];
    const intArr = new Float32Array(10);
    memories.current.forEach((m, idx) => {
      if (idx < 10) {
        posArr[idx] = m.position;
        intArr[idx] = m.intensity;
      }
    });
    // Pad remaining slots
    for (let i = posArr.length; i < 10; i++) posArr[i] = new THREE.Vector3();
    material.memPositions = posArr;
    material.memIntensities = intArr;
    // local prediction error ~ max intensity of current memories
    material.deltaS = Math.max(0, ...intArr);
    // feed global ISRM state to shader
    material.energy = energy;
    material.utility = utility;
    // additional ISRM-driven uniforms
    const inertiaValue = 1 - energy; // simple proxy: low energy → high inertia
    material.deltaC = coherenceTension;
    material.inertia = inertiaValue;
    
    // Update thinking state for fractal overlay
    material.thinking = thinking ? 1.0 : 0.0;

    // simple perlin-like pulse animation & avoidance
    const time = state.clock.getElapsedTime();
    const geom = mesh.current.geometry as THREE.SphereGeometry;
    const posAttr = geom.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < posAttr.count; i++) {
      const v = new THREE.Vector3().fromBufferAttribute(posAttr, i);
      let displacement = 0.2 * (0.5 + Math.sin(time + v.length() * 4));
      // avoidance from memories
      memories.current.forEach(mem => {
        const dist = v.clone().normalize().distanceTo(mem.position.clone().normalize());
        displacement += mem.intensity * Math.exp(-dist * 20) * 0.4;
      });
      v.normalize().multiplyScalar(1 + displacement);
      posAttr.setXYZ(i, v.x, v.y, v.z);
    }
    posAttr.needsUpdate = true;
    geom.computeVertexNormals();

    // ---------------- dynamic size from energy -----------------
    const scale = 0.6 + energy * 0.9; // 0.6 at zero energy → 1.5 at full
    groupRef.current.scale.set(scale, scale, scale);

    // ---------------- ISRM-driven spin -----------------
    // Spin speed rises with coherence loss (ΔC) & prediction error (ΔS),
    // dampened by inertia (inverse of energy proxy).
    const spinY = THREE.MathUtils.clamp(
      coherenceTension * 2 + predictionError * 1.2 - inertiaValue * 0.8,
      -1.5,
      1.5
    );
    const spinX = THREE.MathUtils.clamp(
      (predictionError - coherenceTension) * 0.6,
      -1.5,
      1.5
    );

    groupRef.current.rotation.y += spinY * delta;
    groupRef.current.rotation.x += spinX * delta;
  });

  return (
    <>
      <group ref={groupRef}>
        {/* Outer blob */}
        <Sphere ref={mesh} args={[1, 64, 64]} onPointerDown={handlePointerDown}>
          {/* attach custom blob shader */}
          <primitive attach="material" object={material} />
        </Sphere>
        {/* inner transmission layer for jelly / refraction */}
        <Sphere args={[0.97, 64, 64]}>
          <MeshTransmissionMaterial
            backside
            thickness={0.4}
            anisotropy={0.2}
            chromaticAberration={0.5}
            distortion={0.3}
            distortionScale={0.3}
            temporalDistortion={0.1}
            clearcoat={1}
            samples={4}
          />
        </Sphere>
      </group>
      <ambientLight intensity={0.4} />
      <pointLight position={[5, 5, 5]} intensity={1} />
      <OrbitControls enableZoom={false} />
    </>
  );
}
