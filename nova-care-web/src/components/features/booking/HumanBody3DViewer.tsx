'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { BodyModelLoader, ModelInspectionResult } from '@/services/BodyModelLoader';
import { BodyRegionMapper } from '@/services/BodyRegionMapper';
import { BodyRegion } from '@/models/BodyRegion';
import {
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Loader2,
  Sparkles,
  HelpCircle,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

interface HumanBody3DViewerProps {
  gender: 'male' | 'female';
  onGenderChange: (gender: 'male' | 'female') => void;
  selectedRegionIds: string[];
  onRegionToggle: (region: BodyRegion) => void;
}

export function HumanBody3DViewer({
  gender,
  onGenderChange,
  selectedRegionIds,
  onRegionToggle,
}: HumanBody3DViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Three.js instances
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const modelGroupRef = useRef<THREE.Group | null>(null);

  // Interaction & Asset State
  const [loading, setLoading] = useState(true);
  const [assetMissingError, setAssetMissingError] = useState<string | null>(null);
  const [inspectionResult, setInspectionResult] = useState<ModelInspectionResult | null>(null);
  const [hoveredRegion, setHoveredRegion] = useState<BodyRegion | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Raycaster & Pointer
  const raycasterRef = useRef(new THREE.Raycaster());
  const pointerRef = useRef(new THREE.Vector2());

  // ── 1. SETUP THREE.JS SCENE ─────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xF8FAFC);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    // Position camera for Posterior View (Mặt sau) by default
    camera.position.set(0, 0, -4.8);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.8;
    controls.zoomSpeed = 1.0;
    controls.minDistance = 1.5;
    controls.maxDistance = 10.0;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // Lighting (Medical PBR Lighting)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight1.position.set(5, 8, 5);
    dirLight1.castShadow = true;
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
    dirLight2.position.set(-5, 3, -5);
    scene.add(dirLight2);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.5);
    hemiLight.position.set(0, 10, 0);
    scene.add(hemiLight);

    // Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize Handler
    const handleResize = () => {
      if (!containerRef.current || !renderer || !camera) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(containerRef.current);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      controls.dispose();
      renderer.dispose();
    };
  }, []);

  // ── 2. LOAD REALISTIC 3D GLB MODEL ─────────────────────────
  const load3DModel = useCallback(async () => {
    const scene = sceneRef.current;
    if (!scene) return;

    setLoading(true);
    setAssetMissingError(null);

    // Dispose old model
    if (modelGroupRef.current) {
      scene.remove(modelGroupRef.current);
      modelGroupRef.current = null;
    }

    try {
      const { modelGroup, inspection } = await BodyModelLoader.loadModel(gender);
      scene.add(modelGroup);
      modelGroupRef.current = modelGroup;
      setInspectionResult(inspection);

      // Auto-frame camera to fit full body and orient to Posterior View
      const bbox = inspection.boundingBox;
      const center = bbox.getCenter(new THREE.Vector3());
      const size = bbox.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);

      if (controlsRef.current && cameraRef.current) {
        controlsRef.current.target.copy(center);
        // Default camera position: Posterior (Mặt sau)
        cameraRef.current.position.set(center.x, center.y + 0.2, center.z - maxDim * 2.2);
        controlsRef.current.update();
      }

      setLoading(false);
    } catch (err: any) {
      setLoading(false);
      setAssetMissingError(err.message || 'Chưa có realistic human GLB/GLTF model');
    }
  }, [gender]);

  useEffect(() => {
    load3DModel();
  }, [load3DModel]);

  // ── 3. UPDATE SELECTION HIGHLIGHTS (RED #EF4444 EMISSIVE) ──
  useEffect(() => {
    const group = modelGroupRef.current;
    if (!group) return;

    const selectedSet = new Set(selectedRegionIds);

    group.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const region = BodyRegionMapper.mapMeshToRegion(mesh.name, mesh);
        const mat = mesh.material as THREE.MeshStandardMaterial;

        if (mat && region) {
          if (selectedSet.has(region.id)) {
            // Highlight color: RED #EF4444 (0xEF4444) emissive while preserving original PBR skin maps!
            mat.emissive = new THREE.Color(0xEF4444);
            mat.emissiveIntensity = 0.65;
          } else {
            // Restore original PBR emissive state
            if (mesh.userData.originalEmissive) {
              mat.emissive.copy(mesh.userData.originalEmissive);
              mat.emissiveIntensity = mesh.userData.originalEmissiveIntensity ?? 0;
            } else {
              mat.emissive.setHex(0x000000);
              mat.emissiveIntensity = 0;
            }
          }
        }
      }
    });
  }, [selectedRegionIds, gender, loading]);

  // ── 4. RAYCASTING: MOUSE HOVER DETECT & TOOLTIP ───────────
  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const container = containerRef.current;
      const camera = cameraRef.current;
      const group = modelGroupRef.current;
      if (!container || !camera || !group) return;

      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      pointerRef.current.x = (x / rect.width) * 2 - 1;
      pointerRef.current.y = -(y / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(pointerRef.current, camera);
      const intersects = raycasterRef.current.intersectObjects(group.children, true);

      if (intersects.length > 0) {
        const hitMesh = intersects[0].object as THREE.Mesh;
        const region = BodyRegionMapper.mapMeshToRegion(hitMesh.name, hitMesh);
        if (region) {
          setHoveredRegion(region);
          setTooltipPos({ x: x + 15, y: y - 15 });
          container.style.cursor = 'pointer';
          return;
        }
      }

      setHoveredRegion(null);
      setTooltipPos(null);
      container.style.cursor = 'grab';
    },
    []
  );

  // ── 5. RAYCASTING: MOUSE CLICK TO SELECT REGION ──────────
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const container = containerRef.current;
      const camera = cameraRef.current;
      const group = modelGroupRef.current;
      if (!container || !camera || !group) return;

      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      pointerRef.current.x = (x / rect.width) * 2 - 1;
      pointerRef.current.y = -(y / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(pointerRef.current, camera);
      const intersects = raycasterRef.current.intersectObjects(group.children, true);

      if (intersects.length > 0) {
        const hitMesh = intersects[0].object as THREE.Mesh;
        const region = BodyRegionMapper.mapMeshToRegion(hitMesh.name, hitMesh);
        if (region) {
          onRegionToggle(region);
        }
      }
    },
    [onRegionToggle]
  );

  // Controls Handlers
  const handleResetCamera = () => {
    if (cameraRef.current && controlsRef.current) {
      // Reset to Posterior View (Mặt sau)
      cameraRef.current.position.set(0, 0, -4.8);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  };

  const handleZoomIn = () => {
    if (cameraRef.current) {
      cameraRef.current.position.multiplyScalar(0.85);
    }
  };

  const handleZoomOut = () => {
    if (cameraRef.current) {
      cameraRef.current.position.multiplyScalar(1.15);
    }
  };

  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* ── GENDER SELECTOR TOP BAR ── */}
      <div className="flex items-center justify-between gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800">
        <div className="flex gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            aria-label="Chọn mô hình Nam"
            onClick={() => onGenderChange('male')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
              gender === 'male'
                ? 'bg-[#0c4b39] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100'
            }`}
          >
            <span>👨 Nam</span>
          </button>
          <button
            type="button"
            aria-label="Chọn mô hình Nữ"
            onClick={() => onGenderChange('female')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
              gender === 'female'
                ? 'bg-[#0c4b39] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100'
            }`}
          >
            <span>👩 Nữ</span>
          </button>
        </div>

        <span className="text-xs font-extrabold text-slate-500 pr-2">
          {gender === 'male' ? '🧍‍♂️ Mô hình Nam 3D' : '🧍‍♀️ Mô hình Nữ 3D'}
        </span>
      </div>

      {/* ── 3D WEBGL CANVAS VIEWER CONTAINER ── */}
      <div
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
        className="relative w-full rounded-3xl border border-slate-200 dark:border-slate-800 bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:to-slate-900 overflow-hidden select-none shadow-sm"
        style={{ height: 460 }}
      >
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Loading Spinner Indicator */}
        {loading && !assetMissingError && (
          <div className="absolute inset-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-30">
            <Loader2 className="w-8 h-8 text-[#0c4b39] animate-spin" />
            <p className="text-xs font-black text-slate-800 dark:text-slate-200">
              Đang nạp mô hình cơ thể 3D chân thực ({gender === 'male' ? 'male.glb' : 'female.glb'})...
            </p>
          </div>
        )}

        {/* REALISTIC MODEL ASSET PENDING NOTICE (Section 11 & 21) */}
        {assetMissingError && (
          <div className="absolute inset-0 bg-slate-900/90 text-white p-6 backdrop-blur-md flex flex-col items-center justify-center text-center space-y-4 z-40">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1 max-w-md">
              <span className="inline-block px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase tracking-wider mb-1">
                REALISTIC MODEL ASSET PENDING
              </span>
              <h4 className="text-sm font-black text-white">Chưa Có File Mô Hình GLB Cơ Thể Người Thật</h4>
              <p className="text-xs text-slate-300">
                {assetMissingError}
              </p>
              <p className="text-[11px] text-slate-400 pt-2">
                Vui lòng copy file <code className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-300">male.glb</code> và <code className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-300">female.glb</code> vào thư mục <code className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-200">/public/assets/models/</code>.
              </p>
            </div>
            <button
              type="button"
              onClick={load3DModel}
              className="px-4 py-2 rounded-xl bg-[#0c4b39] hover:bg-[#083629] text-white text-xs font-extrabold flex items-center gap-2 shadow-lg transition"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Thử lại (Retry)
            </button>
          </div>
        )}

        {/* ── LEFT FLOATING VERTICAL TOOLBAR ── */}
        <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md">
          <button
            type="button"
            aria-label="Đặt lại góc nhìn camera về mặt sau"
            onClick={handleResetCamera}
            title="Đặt lại góc nhìn (↻)"
            className="p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            aria-label="Phóng to camera"
            onClick={handleZoomIn}
            title="Phóng to (+)"
            className="p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <button
            type="button"
            aria-label="Thu nhỏ camera"
            onClick={handleZoomOut}
            title="Thu nhỏ (-)"
            className="p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <button
            type="button"
            aria-label="Chế độ toàn màn hình"
            onClick={toggleFullscreen}
            title="Toàn màn hình (⛶)"
            className="p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>

        {/* ── RIGHT FLOATING GUIDE CARD ── */}
        <div className="absolute top-4 right-4 z-20 hidden sm:block bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md max-w-[160px] text-left">
          <p className="text-[11px] font-black text-[#0c4b39] dark:text-[#66FF33] mb-2 flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5" /> Hướng dẫn 3D
          </p>
          <ul className="space-y-1.5 text-[10px] font-bold text-slate-600 dark:text-slate-300">
            <li className="flex items-center gap-1.5">
              <span>👆</span> Kéo để xoay 360°
            </li>
            <li className="flex items-center gap-1.5">
              <span>🤏</span> Cuộn chuột để zoom
            </li>
            <li className="flex items-center gap-1.5">
              <span>🎯</span> Click chọn vùng đau
            </li>
          </ul>
        </div>

        {/* Hover Tooltip Badge */}
        {hoveredRegion && tooltipPos && (
          <div
            className="absolute z-30 bg-red-600 text-white text-xs font-black px-3.5 py-1.5 rounded-xl shadow-xl pointer-events-none whitespace-nowrap flex items-center gap-1.5"
            style={{ left: tooltipPos.x, top: tooltipPos.y }}
          >
            <Sparkles className="w-3.5 h-3.5 text-white" />
            <span>
              {selectedRegionIds.includes(hoveredRegion.id) ? '🔴 ' : ''}
              {hoveredRegion.name}
            </span>
          </div>
        )}

        {/* Subtitle */}
        <p className="absolute bottom-2 left-0 right-0 text-center text-[11px] font-semibold text-slate-400 pointer-events-none">
          Xoay mô hình 360° và nhấp trực tiếp vào vùng cơ thể để đánh dấu vị trí tổn thương
        </p>
      </div>
    </div>
  );
}
