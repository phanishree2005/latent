'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

interface ThreeDInstallationProps {
  className?: string;
  height?: string;
  enableInteraction?: boolean;
}

export default function ThreeDInstallation({
  className = '',
  height = '420px',
  enableInteraction = true,
}: ThreeDInstallationProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    let animId: number;
    let isDisposed = false;

    // Dimensions
    const width = container.clientWidth || 400;
    const heightPx = container.clientHeight || 420;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, width / heightPx, 0.1, 100);
    camera.position.set(0, 0, 7.5);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, heightPx);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffeedd, 2.5);
    keyLight.position.set(-3, 5, 5);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xff3333, 1.5);
    rimLight.position.set(4, -2, -3);
    scene.add(rimLight);

    // Physics Pendulum State
    const pendulum = {
      angleX: 0,
      angleZ: 0,
      velX: 0,
      velZ: 0,
      targetX: 0,
      targetZ: 0,
      isDragging: false,
    };

    const group = new THREE.Group();
    scene.add(group);

    // Cord/Rope Line
    const ropePoints = [new THREE.Vector3(0, 3.2, 0), new THREE.Vector3(0, 0.4, 0)];
    const ropeGeo = new THREE.BufferGeometry().setFromPoints(ropePoints);
    const ropeMat = new THREE.LineBasicMaterial({ color: 0x992222, linewidth: 2 });
    const ropeLine = new THREE.Line(ropeGeo, ropeMat);
    group.add(ropeLine);

    // Load Model
    const loader = new GLTFLoader();
    loader.load(
      '/models/chili-lime.glb',
      (gltf) => {
        if (isDisposed) return;
        const model = gltf.scene;

        // Auto-center & scale
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 3.6 / maxDim;
        model.scale.setScalar(scale);

        // Adjust position so top aligns with rope bottom
        box.setFromObject(model);
        model.position.y = -box.max.y + 0.5;

        // Materials polish
        model.traverse((child: any) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.material) {
              child.material.roughness = 0.35;
              child.material.metalness = 0.1;
            }
          }
        });

        group.add(model);
        setLoading(false);
      },
      undefined,
      (err) => {
        console.warn('Fallback 3D geometry for Nimbu Mirchi talisman:', err);
        // Fallback procedural talisman (lime + chili peppers + eye amulet)
        const fallbackGroup = new THREE.Group();

        // Lime (green sphere)
        const limeGeo = new THREE.SphereGeometry(0.75, 32, 32);
        const limeMat = new THREE.MeshStandardMaterial({ color: 0x70b000, roughness: 0.4 });
        const limeMesh = new THREE.Mesh(limeGeo, limeMat);
        limeMesh.position.y = 0.4;
        fallbackGroup.add(limeMesh);

        // Chilis (7 red curved cones)
        for (let i = 0; i < 7; i++) {
          const chiliGeo = new THREE.ConeGeometry(0.14, 1.4, 16);
          const chiliMat = new THREE.MeshStandardMaterial({
            color: i % 2 === 0 ? 0xcc1111 : 0x118822,
            roughness: 0.3,
          });
          const chili = new THREE.Mesh(chiliGeo, chiliMat);
          const angle = (i / 7) * Math.PI * 2;
          chili.position.set(Math.cos(angle) * 0.45, -0.7 - (i % 3) * 0.15, Math.sin(angle) * 0.45);
          chili.rotation.z = Math.PI - 0.2 + (i % 2) * 0.4;
          fallbackGroup.add(chili);
        }

        group.add(fallbackGroup);
        setLoading(false);
      }
    );

    // Pointer events for drag and fling
    let lastPointerX = 0;
    let lastPointerY = 0;

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      if (!enableInteraction) return;
      pendulum.isDragging = true;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      lastPointerX = clientX;
      lastPointerY = clientY;
      canvas.style.cursor = 'grabbing';
    };

    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      if (pendulum.isDragging) {
        const dx = (clientX - lastPointerX) * 0.015;
        const dy = (clientY - lastPointerY) * 0.015;
        pendulum.angleZ -= dx;
        pendulum.angleX += dy;
        lastPointerX = clientX;
        lastPointerY = clientY;
      } else {
        // Subtle ambient mouse sway
        const rect = container.getBoundingClientRect();
        const normX = ((clientX - rect.left) / rect.width) * 2 - 1;
        pendulum.targetZ = -normX * 0.25;
      }
    };

    const onPointerUp = () => {
      pendulum.isDragging = false;
      canvas.style.cursor = 'grab';
    };

    canvas.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);

    canvas.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('touchend', onPointerUp);

    // Animation Loop
    let clock = new THREE.Clock();

    const animate = () => {
      if (isDisposed) return;
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Physics: spring damped pendulum
      if (!pendulum.isDragging) {
        // Restoring force towards target + natural breathing sway
        const naturalSway = Math.sin(time * 1.8) * 0.06;
        const forceZ = (pendulum.targetZ + naturalSway - pendulum.angleZ) * 6.0;
        const forceX = -pendulum.angleX * 6.0;

        pendulum.velZ = (pendulum.velZ + forceZ * delta) * 0.94;
        pendulum.velX = (pendulum.velX + forceX * delta) * 0.94;

        pendulum.angleZ += pendulum.velZ * delta;
        pendulum.angleX += pendulum.velX * delta;
      }

      group.rotation.z = pendulum.angleZ;
      group.rotation.x = pendulum.angleX;
      group.rotation.y = Math.sin(time * 0.8) * 0.35 + (pendulum.angleZ * 0.5);

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };

    animate();

    // Resize handler
    const handleResize = () => {
      if (!container || !renderer) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      isDisposed = true;
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      canvas.removeEventListener('touchstart', onPointerDown);
      window.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('touchend', onPointerUp);
      renderer.dispose();
    };
  }, [enableInteraction]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full flex items-center justify-center overflow-hidden select-none ${className}`}
      style={{ height }}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 text-white/50 text-xs font-mono tracking-widest uppercase">
          Loading 3D Talisman...
        </div>
      )}
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-grab active:cursor-grabbing outline-none"
        title="Interactive 3D Nimbu Mirchi Talisman (Drag to swing!)"
      />
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 pointer-events-none px-3 py-1 rounded-full bg-black/60 border border-white/10 text-[10px] uppercase font-mono tracking-wider text-white/60">
        ✦ Drag or Hover Talisman ✦
      </div>
    </div>
  );
}
