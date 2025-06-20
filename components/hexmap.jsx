"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const MAP_IMAGE_URL = "/transparentWorldMap.png"; // 确保该资源在public文件夹下

const HexMap = () => {
  const mountRef = useRef(null);
  // 用于保存 requestAnimationFrame 的 id，方便卸载时取消动画循环
  let animationFrameId = null;

  useEffect(() => {
    if (!mountRef.current) return;

    // --- 配置变量 ---
    let rayAnimator = null;
    let lastTime = performance.now();
    let hexGroup = null; // 全局存储 hexGroup

    // 鼠标跟踪
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    const MOUSE_ROTATION_FACTOR_Y = Math.PI / 25;
    const MOUSE_ROTATION_FACTOR_X = Math.PI / 25;
    const MOUSE_ROTATION_SMOOTHING = 0.05;

    // 球面参数
    const SPHERE_RADIUS = 150;
    const HORIZONTAL_CURVE_ANGLE = Math.PI * 0.3; // 经度范围
    const VERTICAL_CURVE_ANGLE = Math.PI * 0.2; // 纬度范围

    // 六边形网格参数
    const GRID_RESOLUTION_X = 200;
    const GRID_RESOLUTION_Y = Math.floor(
      GRID_RESOLUTION_X * (VERTICAL_CURVE_ANGLE / HORIZONTAL_CURVE_ANGLE),
    );
    const HEX_SIZE_FACTOR = 1.1;
    const LAND_COLOR = 0x3399ff;
    const LAND_THRESHOLD = 50;

    // 计算六边形尺寸
    const approxHexWidth =
      (SPHERE_RADIUS * HORIZONTAL_CURVE_ANGLE) / GRID_RESOLUTION_X;
    const approxHexHeight =
      (SPHERE_RADIUS * VERTICAL_CURVE_ANGLE) / GRID_RESOLUTION_Y;
    const hexRadius =
      (Math.min(approxHexWidth, approxHexHeight) / 2) * HEX_SIZE_FACTOR;

    // --- Scene Setup ---
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      40,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );

    camera.position.set(0, SPHERE_RADIUS * 0.1, SPHERE_RADIUS * 1.1);

    const renderer = new THREE.WebGLRenderer({ antialias: true });

    renderer.setSize(window.innerWidth, window.innerHeight / 2);
    camera.aspect = window.innerWidth / (window.innerHeight / 1.8); // 水平拉伸
    camera.updateProjectionMatrix();
    mountRef.current.appendChild(renderer.domElement);

    // --- Lighting ---
    const ambientLight = new THREE.AmbientLight(0xaaaaaa);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0.5, 1, 1).normalize();
    scene.add(directionalLight);

    // --- Controls ---
    const controls = new OrbitControls(camera, renderer.domElement);

    controls.enableRotate = false;
    controls.enableZoom = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 0, -SPHERE_RADIUS);
    controls.minDistance = SPHERE_RADIUS * 0.5;
    controls.maxDistance = SPHERE_RADIUS * 3;

    // 球体中心辅助点
    const sphereCenter = new THREE.Vector3(0, 0, -SPHERE_RADIUS);

    // --- 加载图片纹理 ---
    const textureLoader = new THREE.TextureLoader();
    textureLoader.crossOrigin = "Anonymous";

    console.log("Loading map texture...");
    textureLoader.load(
      MAP_IMAGE_URL,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        const image = texture.image;
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d", { willReadFrequently: true });
        canvas.width = image.width;
        canvas.height = image.height;
        context.drawImage(image, 0, 0);
        createHexagonMap(context, image.width, image.height);
      },
      (xhr) => console.log((xhr.loaded / xhr.total) * 100 + "% loaded"),
      (error) => {
        console.error("Error loading texture:", error);
        const errorDiv = document.createElement("div");
        errorDiv.style.cssText =
          "position:absolute;top:10px;left:10px;padding:10px;background:red;color:white;";
        errorDiv.textContent = `Error loading map image. Check CORS policy or URL. See console for details. URL: ${MAP_IMAGE_URL}`;
        document.body.appendChild(errorDiv);
      },
    );

    // --- 六边形生成函数 ---
    function createHexagonMap(context, imageWidth, imageHeight) {
      const imageData = context.getImageData(
        0,
        0,
        imageWidth,
        imageHeight,
      ).data;
      const hexMaterial = new THREE.MeshStandardMaterial({
        color: LAND_COLOR,
        side: THREE.DoubleSide,
        metalness: 0.2,
        roughness: 0.8,
      });
      const hexGeometry = new THREE.CircleGeometry(hexRadius, 6);
      hexGroup = new THREE.Group();
      const tempPosition = new THREE.Vector3();
      const tempNormal = new THREE.Vector3();
      const positionRelativeToCenter = new THREE.Vector3();

      for (let j = 0; j < GRID_RESOLUTION_Y; j++) {
        const v = (j + 0.5) / GRID_RESOLUTION_Y;
        const verticalAngle = (v - 0.5) * VERTICAL_CURVE_ANGLE;
        const isStaggeredRow = j % 2 === 1;
        const currentResolutionX = GRID_RESOLUTION_X;
        const uOffset = isStaggeredRow ? 0.5 : 0;
        for (let i = 0; i < currentResolutionX; i++) {
          const u = (i + uOffset + 0.5) / currentResolutionX;
          const horizontalAngle = (u - 0.5) * HORIZONTAL_CURVE_ANGLE;
          positionRelativeToCenter.set(
            SPHERE_RADIUS * Math.cos(verticalAngle) * Math.sin(horizontalAngle),
            SPHERE_RADIUS * Math.sin(verticalAngle),
            SPHERE_RADIUS * Math.cos(verticalAngle) * Math.cos(horizontalAngle),
          );
          tempPosition.copy(positionRelativeToCenter).add(sphereCenter);
          const imageX = Math.floor(u * imageWidth);
          const imageY = Math.floor((1 - v) * imageHeight);
          const clampedX = Math.max(0, Math.min(imageWidth - 1, imageX));
          const clampedY = Math.max(0, Math.min(imageHeight - 1, imageY));
          const pixelIndex = (clampedY * imageWidth + clampedX) * 4;
          const r = imageData[pixelIndex];
          const a = imageData[pixelIndex + 3];
          if (a > 128 && r > LAND_THRESHOLD) {
            const hexMesh = new THREE.Mesh(hexGeometry, hexMaterial);
            hexMesh.position.copy(tempPosition);
            tempNormal.copy(positionRelativeToCenter).normalize();
            const tangent = new THREE.Vector3();
            tangent
              .crossVectors(tempNormal, new THREE.Vector3(0, 1, 0))
              .normalize();
            if (tangent.lengthSq() < 1e-6) {
              tangent
                .crossVectors(tempNormal, new THREE.Vector3(1, 0, 0))
                .normalize();
            }
            const bitangent = new THREE.Vector3()
              .crossVectors(tempNormal, tangent)
              .normalize();
            const rotationMatrix = new THREE.Matrix4().makeBasis(
              tangent,
              bitangent,
              tempNormal,
            );
            hexMesh.quaternion.setFromRotationMatrix(rotationMatrix);
            hexGroup.add(hexMesh);
          }
        }
      }
      scene.add(hexGroup);

      // --- 寻找起始 hexagon 并启动动画 ---
      if (hexGroup.children.length > 0) {
        let startingHex = null;
        let minAngleDistSq = Infinity;

        // 定义目标角度（可根据需要调整）
        const targetHorizontalAngle = (1 / 4) * (HORIZONTAL_CURVE_ANGLE / 2);
        const targetVerticalAngle = (1 / 8) * (VERTICAL_CURVE_ANGLE / 2);
        const targetAngles = {
          h: targetHorizontalAngle,
          v: targetVerticalAngle,
        };

        console.log(
          `Searching for starting hex near angles: h=${targetAngles.h.toFixed(3)}, v=${targetAngles.v.toFixed(3)}`,
        );

        hexGroup.children.forEach((hex) => {
          if (!hex.isMesh) return;
          const posRelCenter = hex.position.clone().sub(sphereCenter);
          const estVerticalAngle = Math.asin(posRelCenter.y / SPHERE_RADIUS);
          const estHorizontalAngle = Math.atan2(
            posRelCenter.x,
            posRelCenter.z + SPHERE_RADIUS,
          );
          const angleDistSq =
            (estVerticalAngle - targetAngles.v) ** 2 +
            (estHorizontalAngle - targetAngles.h) ** 2;
          if (angleDistSq < minAngleDistSq) {
            minAngleDistSq = angleDistSq;
            startingHex = hex;
          }
        });

        if (!startingHex) {
          console.warn(
            "Could not find a hex near the target angles, using fallback (center-ish).",
          );
          const meshes = hexGroup.children.filter((c) => c.isMesh);
          if (meshes.length > 0) {
            startingHex = meshes[Math.floor(meshes.length / 2)];
          }
        }

        if (startingHex) {
          console.log(
            "Starting ray animation from hex near target position:",
            startingHex.position,
          );
          const arcTubeRadius = 0.2; // 可调整弧线管道的厚度
          rayAnimator = createArcLinesLogHeight(
            startingHex.position,
            hexGroup,
            { baseHeight: 10, logScaleFactor: 8, tubeRadius: arcTubeRadius },
            0.0015,
          );
        } else {
          console.warn(
            "No valid starting hexagon found, cannot start ray animation.",
          );
        }
      } else {
        console.warn("No hexagons generated, cannot start ray animation.");
      }
    }

    // --- 弧线函数（添加波纹效果） ---
    function createArcLinesLogHeight(
      startPoint,
      targetHexGroup,
      params = {},
      selectionChance = 0.015,
    ) {
      if (!startPoint || typeof startPoint.x === "undefined") {
        console.error(
          "createArcLinesLogHeight: Invalid startPoint provided.",
          startPoint,
        );
        return () => {};
      }
      if (!targetHexGroup || !targetHexGroup.isGroup) {
        console.error(
          "createArcLinesLogHeight: Invalid targetHexGroup provided.",
          targetHexGroup,
        );
        return () => {};
      }

      const {
        baseHeight = 10,
        logScaleFactor = 8,
        tubeRadius = 0.1,
        curveSegments = 50,
        tubeSegments = 8,
        rippleDuration = 2,
        rippleMaxSize = 1.5,
        rippleLayers = 4,
        rippleLayerDelay = 0.5,
        rippleStartDelay = 0.5,
        repeatRipple = true,
      } = params;

      const selectedHexes = [];
      targetHexGroup.children.forEach((child) => {
        if (
          child.isMesh &&
          child.position &&
          child.position.distanceToSquared(startPoint) > 0.1
        ) {
          if (Math.random() < selectionChance) {
            selectedHexes.push(child);
          }
        }
      });

      if (selectedHexes.length === 0) {
        console.log("No target hexes selected for arcs.");
        return () => {};
      }

      const arcTubes = [];
      const rippleEffects = []; // 存储波纹效果
      const surfaceMidpoint = new THREE.Vector3();
      const midNormal = new THREE.Vector3();
      const controlPoint = new THREE.Vector3();
      const vecToMid = new THREE.Vector3();

      selectedHexes.forEach((targetHex, index) => {
        const endPoint = targetHex.position.clone();
        const distance = startPoint.distanceTo(endPoint);
        const logDistComponent = Math.log(Math.max(1, distance));
        const dynamicCurveHeight =
          baseHeight + logDistComponent * logScaleFactor;

        const chordMidpoint = new THREE.Vector3().lerpVectors(
          startPoint,
          endPoint,
          0.5,
        );
        vecToMid.copy(chordMidpoint).sub(sphereCenter).normalize();
        surfaceMidpoint
          .copy(vecToMid)
          .multiplyScalar(SPHERE_RADIUS)
          .add(sphereCenter);
        midNormal.copy(vecToMid);
        controlPoint
          .copy(surfaceMidpoint)
          .addScaledVector(midNormal, dynamicCurveHeight);

        const curve = new THREE.QuadraticBezierCurve3(
          startPoint.clone(),
          controlPoint.clone(),
          endPoint.clone(),
        );

        const tubeGeometry = new THREE.TubeGeometry(
          curve,
          curveSegments,
          tubeRadius,
          tubeSegments,
          false,
        );

        const tubeMaterial = new THREE.MeshBasicMaterial({
          color: 0xaaffff,
          transparent: true,
          opacity: 0.9,
          side: THREE.DoubleSide,
        });

        const tubeMesh = new THREE.Mesh(tubeGeometry, tubeMaterial);
        tubeMesh.name = `ArcTube_${index}`;
        tubeGeometry.setDrawRange(0, 0);

        arcTubes.push({
          mesh: tubeMesh,
          curve: curve,
          progress: 0,
          totalIndices: tubeGeometry.index.count,
        });
        targetHexGroup.add(tubeMesh);

        // 波纹效果
        const rippleGroup = new THREE.Group();
        targetHexGroup.add(rippleGroup);

        for (let layer = 0; layer < Math.max(3, rippleLayers); layer++) {
          const rippleSize =
            (layer + 1) * (rippleMaxSize / Math.max(3, rippleLayers));
          const rippleGeometry = new THREE.CircleGeometry(rippleSize, 32);
          const rippleMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.6 - 0.1 * layer,
            side: THREE.DoubleSide,
          });
          const rippleMesh = new THREE.Mesh(rippleGeometry, rippleMaterial);
          rippleMesh.position.copy(endPoint);

          // 调整波纹位置，使其略微偏离曲面
          const rippleNormal = endPoint.clone().sub(sphereCenter).normalize();
          const rippleOffset = 0.05 * (layer + 1);
          rippleMesh.position.addScaledVector(rippleNormal, rippleOffset);

          // 使波纹面朝外
          const quaternion = new THREE.Quaternion().setFromUnitVectors(
            new THREE.Vector3(0, 0, 1),
            rippleNormal,
          );
          rippleMesh.quaternion.copy(quaternion);

          rippleGroup.add(rippleMesh);

          rippleEffects.push({
            mesh: rippleMesh,
            progress: 0,
            maxSize: rippleSize,
            duration: rippleDuration,
            layerDelay: layer * rippleLayerDelay,
            opacity: 0.6 - 0.1 * layer,
            startDelay: rippleStartDelay,
            repeat: repeatRipple,
          });
        }
      });

      const animationSpeed = 0.7;
      function animateArcs(deltaTime) {
        for (let i = arcTubes.length - 1; i >= 0; i--) {
          const arc = arcTubes[i];
          if (!arc.mesh || !arc.mesh.parent || !arc.mesh.geometry) {
            if (arc.mesh && arc.mesh.geometry) {
              arc.mesh.geometry.dispose();
            }
            if (arc.mesh && arc.mesh.material) {
              arc.mesh.material.dispose();
            }
            arcTubes.splice(i, 1);
            continue;
          }

          if (arc.progress < 1) {
            arc.progress += deltaTime * animationSpeed;
            arc.progress = Math.min(arc.progress, 1);
            const drawCount = Math.floor(arc.progress * arc.totalIndices);
            arc.mesh.geometry.setDrawRange(0, drawCount);
          }
        }

        // 波纹动画
        for (let i = rippleEffects.length - 1; i >= 0; i--) {
          const ripple = rippleEffects[i];
          if (!ripple.mesh || !ripple.mesh.parent) {
            rippleEffects.splice(i, 1);
            continue;
          }

          if (ripple.progress < 1) {
            ripple.progress += deltaTime / ripple.duration;
          }

          if (ripple.progress < 1) {
            ripple.mesh.scale.set(
              ripple.progress * ripple.maxSize,
              ripple.progress * ripple.maxSize,
              1,
            );
            ripple.mesh.material.opacity =
              ripple.opacity * (1 - ripple.progress);
          } else {
            if (ripple.repeat) {
              ripple.progress = 0;
            } else {
              ripple.mesh.material.opacity = Math.max(
                0,
                ripple.opacity * (1 - (ripple.progress - 1)),
              );
              if (ripple.mesh.material.opacity <= 0) {
                targetHexGroup.remove(ripple.mesh);
                ripple.mesh.geometry.dispose();
                ripple.mesh.material.dispose();
                rippleEffects.splice(i, 1);
              }
            }
          }
        }
      }
      return animateArcs;
    }

    // --- 监听鼠标移动 ---
    function onMouseMove(event) {
      mouseX = event.clientX;
      mouseY = event.clientY;
    }
    window.addEventListener("mousemove", onMouseMove, false);

    // --- 动画循环 ---
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const now = performance.now();
      const delta = Math.min(0.1, (now - lastTime) / 1000);
      lastTime = now;

      controls.update();

      if (hexGroup) {
        const normalizedX = -((mouseX / window.innerWidth) * 2 - 1);
        const normalizedY = -((mouseY / window.innerHeight) * 2 - 1);
        const targetRotationY = normalizedX * MOUSE_ROTATION_FACTOR_X;
        const targetRotationX = normalizedY * MOUSE_ROTATION_FACTOR_Y;
        const smoothFactor =
          1.0 - Math.exp(-MOUSE_ROTATION_SMOOTHING * 60 * delta);
        hexGroup.rotation.y +=
          (targetRotationY - hexGroup.rotation.y) * smoothFactor;
        hexGroup.rotation.x +=
          (targetRotationX - hexGroup.rotation.x) * smoothFactor;
      }

      if (rayAnimator) {
        rayAnimator(delta);
      }

      renderer.render(scene, camera);
    };
    animate();

    // --- 处理窗口大小调整 ---
    const onWindowResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight / 2);
      camera.aspect = window.innerWidth / (window.innerHeight / 1.8); // 水平拉伸
      camera.updateProjectionMatrix();
      mouseX = window.innerWidth / 2;
      mouseY = window.innerHeight / 2;
    };
    window.addEventListener("resize", onWindowResize, false);

    // --- 清理函数 ---
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", onWindowResize, false);
      window.removeEventListener("mousemove", onMouseMove, false);
      // 清除 Three.js 场景
      renderer.dispose();
      while (scene.children.length > 0) {
        scene.remove(scene.children[0]);
      }
      // 移除渲染器 DOM 元素
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} style={{ width: "100vw", height: "50vh" }} />;
};

export default HexMap;
