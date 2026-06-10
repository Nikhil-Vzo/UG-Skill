import React, { Suspense, useRef, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGLTF, Float, Environment, ContactShadows, PresentationControls } from '@react-three/drei';

function RoboModel() {
  const { scene } = useGLTF('/models/robo-opt.glb');
  
  // Disable frustum culling to prevent model from disappearing when rotated/dragged
  useEffect(() => {
    scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        mesh.frustumCulled = false;
        
        // Add subtle holographic scan effect to materials
        if (mesh.material) {
          const mat = mesh.material as THREE.MeshStandardMaterial;
          mat.emissive = new THREE.Color('#0052ff');
          mat.emissiveIntensity = 0.1;
        }
      }
    });
  }, [scene]);

  return (
    <primitive
      object={scene}
      scale={1.5}
      position={[1.2, -1.2, 0]} /* Move robot right within the 3D canvas */
      rotation={[0, -Math.PI / 8, 0]}
    />
  );
}

/** Pauses the render loop when the canvas is not visible, saving GPU. */
function VisibilityController({ isVisible }: { isVisible: boolean }) {
  const { invalidate, advance } = useThree((s) => s);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isVisible) {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
      return;
    }
    // Kick off a render tick when we become visible again
    invalidate();
  }, [isVisible, invalidate]);

  return null;
}

export const HeroScene: React.FC = () => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = React.useState(true);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.01 } // Stop rendering when even 99% scrolled away
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={wrapperRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        touchAction: 'none',
      }}
    >
      <Canvas
        frameloop={isVisible ? 'always' : 'never'} // ← KEY: kills render loop when offscreen
        shadows={{ type: THREE.PCFShadowMap }}
        camera={{ position: [0, 0, 6], fov: 38, near: 0.1, far: 1000 }} /* Safer clipping planes */
        dpr={[1, 1.5]} // Performance: cap resolution on high-DPI screens
        gl={{ 
          antialias: true, 
          alpha: true,
          powerPreference: 'high-performance',
          stencil: false,
          depth: true
        }}
        style={{ 
          width: '100%', 
          height: '100%', 
          display: 'block',
          touchAction: 'none' 
        }}
        performance={{ min: 0.5 }} // Allow R3F to drop quality if needed
      >
        <ambientLight intensity={0.8} />
        <spotLight
          position={[5, 8, 5]}
          angle={0.2}
          penumbra={1}
          intensity={3}
          castShadow
          shadow-mapSize={[512, 512]} // Reduced from 1024 — invisible difference, half the VRAM
        />
        <pointLight position={[-5, -5, -5]} intensity={1.5} color="#0052ff" />
        <pointLight position={[5, 5, -5]} intensity={0.5} color="#10b981" />

        <Suspense fallback={null}>
          <PresentationControls
            global
            rotation={[0, 0, 0]}
            polar={[-Math.PI / 4, Math.PI / 4]}
            azimuth={[-Math.PI / 4, Math.PI / 4]}
          >
            <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.6}>
              <RoboModel />
            </Float>
          </PresentationControls>

          <Environment preset="city" />
          <ContactShadows
            position={[0, -2, 0]}
            opacity={0.4}
            scale={8}
            blur={2}
            far={10} /* Increased far for shadows */
          />
        </Suspense>
      </Canvas>
    </div>
  );
};
