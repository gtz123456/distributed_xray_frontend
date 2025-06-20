// ThreeHexMap.ts
import * as THREE from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export interface ThreeHexMapOptions {
  container?: HTMLElement;
  mapImageUrl?: string;
  sphereRadius?: number;
  gridResolutionX?: number;
  hexSizeFactor?: number;
  landColor?: number;
  landThreshold?: number;
  arcTubeRadius?: number;
}

export class ThreeHexMap {
  container: HTMLElement;
  MAP_IMAGE_URL: string;
  SPHERE_RADIUS: number;
  HORIZONTAL_CURVE_ANGLE: number = Math.PI * 0.3;
  VERTICAL_CURVE_ANGLE: number = Math.PI * 0.2;

  MOUSE_ROTATION_FACTOR_Y: number = Math.PI / 18;
  MOUSE_ROTATION_FACTOR_X: number = Math.PI / 18;
  MOUSE_ROTATION_SMOOTHING: number = 0.05;

  GRID_RESOLUTION_X: number;
  GRID_RESOLUTION_Y: number;
  HEX_SIZE_FACTOR: number;
  LAND_COLOR: number;
  LAND_THRESHOLD: number;
  hexRadius: number;

  rayAnimator: ((delta: number) => void) | null = null;
  lastTime: number = performance.now();
  mouseX: number = window.innerWidth / 2;
  mouseY: number = window.innerHeight / 2;

  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;
  sphereCenter: THREE.Vector3;
  hexGroup: THREE.Group;

  constructor(options: ThreeHexMapOptions = {}) {
    // 配置项与默认值
    this.container = options.container || document.body;
    // 注意：直接通过 '/transparentWorldMap.png' 访问 public 文件夹下的图片
    this.MAP_IMAGE_URL = options.mapImageUrl || '/transparentWorldMap.png';
    this.SPHERE_RADIUS = options.sphereRadius || 150;
    this.GRID_RESOLUTION_X = options.gridResolutionX || 200;
    this.GRID_RESOLUTION_Y = Math.floor(
      this.GRID_RESOLUTION_X * (this.VERTICAL_CURVE_ANGLE / this.HORIZONTAL_CURVE_ANGLE)
    );
    this.HEX_SIZE_FACTOR = options.hexSizeFactor || 1.1;
    this.LAND_COLOR = options.landColor || 0x3399ff;
    this.LAND_THRESHOLD = options.landThreshold || 50;

    // 根据球面尺寸和曲率计算六边形半径
    const approxHexWidth = (this.SPHERE_RADIUS * this.HORIZONTAL_CURVE_ANGLE) / this.GRID_RESOLUTION_X;
    const approxHexHeight = (this.SPHERE_RADIUS * this.VERTICAL_CURVE_ANGLE) / this.GRID_RESOLUTION_Y;
    this.hexRadius = (Math.min(approxHexWidth, approxHexHeight) / 2) * this.HEX_SIZE_FACTOR;

    // 初始化 Three.js 对象
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, this.SPHERE_RADIUS * 0.1, this.SPHERE_RADIUS * 1.1);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.container.appendChild(this.renderer.domElement);

    // 灯光
    const ambientLight = new THREE.AmbientLight(0xaaaaaa);
    this.scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0.5, 1, 1).normalize();
    this.scene.add(directionalLight);

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.target.set(0, 0, -this.SPHERE_RADIUS);
    this.controls.minDistance = this.SPHERE_RADIUS * 0.5;
    this.controls.maxDistance = this.SPHERE_RADIUS * 3;

    // 球心及 hexGroup
    this.sphereCenter = new THREE.Vector3(0, 0, -this.SPHERE_RADIUS);
    this.hexGroup = new THREE.Group();
    this.scene.add(this.hexGroup);

    // 开始加载纹理
    this.loadTextureAndCreateMap();

    // 事件绑定
    window.addEventListener('resize', this.onWindowResize.bind(this), false);
    window.addEventListener('mousemove', this.onMouseMove.bind(this), false);

    // 开始动画循环
    this.animate();
  }

  private loadTextureAndCreateMap(): void {
    const textureLoader = new THREE.TextureLoader();
    textureLoader.crossOrigin = 'Anonymous';
    console.log('Loading map texture...');
    textureLoader.load(
      this.MAP_IMAGE_URL,
      (texture: THREE.Texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        const image = texture.image as HTMLImageElement;
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) {
          console.error('无法获取 canvas 2d 上下文');
          return;
        }
        canvas.width = image.width;
        canvas.height = image.height;
        context.drawImage(image, 0, 0);
        this.createHexagonMap(context, image.width, image.height);
      },
      (xhr) => console.log((xhr.loaded / xhr.total) * 100 + '% loaded'),
      (error) => {
        console.error('Error loading texture:', error);
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText =
          'position:absolute;top:10px;left:10px;padding:10px;background:red;color:white;';
        errorDiv.textContent = `Error loading map image. Check CORS policy or URL. URL: ${this.MAP_IMAGE_URL}`;
        document.body.appendChild(errorDiv);
      }
    );
  }

  private createHexagonMap(
    context: CanvasRenderingContext2D,
    imageWidth: number,
    imageHeight: number
  ): void {
    const imageData = context.getImageData(0, 0, imageWidth, imageHeight).data;
    const hexMaterial = new THREE.MeshStandardMaterial({
      color: this.LAND_COLOR,
      side: THREE.DoubleSide,
      metalness: 0.2,
      roughness: 0.8,
    });
    const hexGeometry = new THREE.CircleGeometry(this.hexRadius, 6);
    const tempPosition = new THREE.Vector3();
    const tempNormal = new THREE.Vector3();
    const positionRelativeToCenter = new THREE.Vector3();

    // 生成六边形网格
    for (let j = 0; j < this.GRID_RESOLUTION_Y; j++) {
      const v = (j + 0.5) / this.GRID_RESOLUTION_Y;
      const verticalAngle = (v - 0.5) * this.VERTICAL_CURVE_ANGLE;
      const isStaggeredRow = j % 2 === 1;
      const currentResolutionX = this.GRID_RESOLUTION_X;
      const uOffset = isStaggeredRow ? 0.5 : 0;
      for (let i = 0; i < currentResolutionX; i++) {
        const u = (i + uOffset + 0.5) / currentResolutionX;
        const horizontalAngle = (u - 0.5) * this.HORIZONTAL_CURVE_ANGLE;
        positionRelativeToCenter.set(
          this.SPHERE_RADIUS * Math.cos(verticalAngle) * Math.sin(horizontalAngle),
          this.SPHERE_RADIUS * Math.sin(verticalAngle),
          this.SPHERE_RADIUS * Math.cos(verticalAngle) * Math.cos(horizontalAngle)
        );
        tempPosition.copy(positionRelativeToCenter).add(this.sphereCenter);

        // 采样纹理像素
        const imageX = Math.floor(u * imageWidth);
        const imageY = Math.floor((1 - v) * imageHeight);
        const clampedX = Math.max(0, Math.min(imageWidth - 1, imageX));
        const clampedY = Math.max(0, Math.min(imageHeight - 1, imageY));
        const pixelIndex = (clampedY * imageWidth + clampedX) * 4;
        const r = imageData[pixelIndex];
        const a = imageData[pixelIndex + 3];
        if (a > 128 && r > this.LAND_THRESHOLD) {
          const hexMesh = new THREE.Mesh(hexGeometry, hexMaterial);
          hexMesh.position.copy(tempPosition);
          tempNormal.copy(positionRelativeToCenter).normalize();
          // 根据法向量调整六边形朝向
          const tangent = new THREE.Vector3();
          tangent.crossVectors(tempNormal, new THREE.Vector3(0, 1, 0)).normalize();
          if (tangent.lengthSq() < 1e-6) {
            tangent.crossVectors(tempNormal, new THREE.Vector3(1, 0, 0)).normalize();
          }
          const bitangent = new THREE.Vector3().crossVectors(tempNormal, tangent).normalize();
          const rotationMatrix = new THREE.Matrix4().makeBasis(tangent, bitangent, tempNormal);
          hexMesh.quaternion.setFromRotationMatrix(rotationMatrix);
          this.hexGroup.add(hexMesh);
        }
      }
    }

    // 查找起始 hex 节点，作为弧线动画的起点（例如调整至中国附近）
    if (this.hexGroup.children.length > 0) {
      let startingHex: THREE.Mesh | null = null;
      let minAngleDistSq = Infinity;
      const targetHorizontalAngle = (1 / 4) * (this.HORIZONTAL_CURVE_ANGLE / 2);
      const targetVerticalAngle = (1 / 8) * (this.VERTICAL_CURVE_ANGLE / 2);
      const targetAngles = { h: targetHorizontalAngle, v: targetVerticalAngle };
      console.log(
        `Searching for starting hex near angles: h=${targetAngles.h.toFixed(
          3
        )}, v=${targetAngles.v.toFixed(3)}`
      );
      this.hexGroup.children.forEach((child) => {
        const hex = child as THREE.Mesh;
        if (!hex.isMesh) return;
        const posRelCenter = hex.position.clone().sub(this.sphereCenter);
        const estVerticalAngle = Math.asin(posRelCenter.y / this.SPHERE_RADIUS);
        const estHorizontalAngle = Math.atan2(posRelCenter.x, posRelCenter.z + this.SPHERE_RADIUS);
        const angleDistSq =
          Math.pow(estVerticalAngle - targetAngles.v, 2) +
          Math.pow(estHorizontalAngle - targetAngles.h, 2);
        if (angleDistSq < minAngleDistSq) {
          minAngleDistSq = angleDistSq;
          startingHex = hex;
        }
      });

      if (!startingHex) {
        console.warn("Could not find a hex near the target angles, using fallback (center-ish).");
        const meshes = this.hexGroup.children.filter((c) => (c as THREE.Mesh).isMesh);
        if (meshes.length > 0) {
          startingHex = meshes[Math.floor(meshes.length / 2)] as THREE.Mesh;
        }
      }

      if (startingHex) {
        console.log("Starting ray animation from hex near target position:", startingHex.position);
        const arcTubeRadius = 0.2;
        this.rayAnimator = this.createArcLinesLogHeight(
          startingHex.position,
          this.hexGroup,
          { baseHeight: 10, logScaleFactor: 8, tubeRadius: arcTubeRadius },
          0.0015
        );
      } else {
        console.warn("No valid starting hexagon found, cannot start ray animation.");
      }
    } else {
      console.warn("No hexagons generated, cannot start ray animation.");
    }
  }

  private createArcLinesLogHeight(
    startPoint: THREE.Vector3,
    targetHexGroup: THREE.Group,
    params: Partial<{
      baseHeight: number;
      logScaleFactor: number;
      tubeRadius: number;
      curveSegments: number;
      tubeSegments: number;
      rippleDuration: number;
      rippleMaxSize: number;
      rippleLayers: number;
      rippleLayerDelay: number;
      rippleStartDelay: number;
      repeatRipple: boolean;
    }> = {},
    selectionChance: number = 0.015
  ): ((delta: number) => void) {
    if (!startPoint || typeof startPoint.x === 'undefined') {
      console.error("createArcLinesLogHeight: Invalid startPoint provided.", startPoint);
      return () => {};
    }
    if (!targetHexGroup || !targetHexGroup.isGroup) {
      console.error("createArcLinesLogHeight: Invalid targetHexGroup provided.", targetHexGroup);
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

    const selectedHexes: THREE.Mesh[] = [];
    targetHexGroup.children.forEach((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh.isMesh && mesh.position && mesh.position.distanceToSquared(startPoint) > 0.1) {
        if (Math.random() < selectionChance) {
          selectedHexes.push(mesh);
        }
      }
    });
    if (selectedHexes.length === 0) {
      console.log("No target hexes selected for arcs.");
      return () => {};
    }

    type ArcTube = {
      mesh: THREE.Mesh;
      curve: THREE.QuadraticBezierCurve3;
      progress: number;
      totalIndices: number;
    };

    const arcTubes: ArcTube[] = [];
    const rippleEffects: Array<{
      mesh: THREE.Mesh;
      progress: number;
      maxSize: number;
      duration: number;
      layerDelay: number;
      opacity: number;
      startDelay: number;
      repeat: boolean;
    }> = [];
    const surfaceMidpoint = new THREE.Vector3();
    const midNormal = new THREE.Vector3();
    const controlPoint = new THREE.Vector3();
    const vecToMid = new THREE.Vector3();

    selectedHexes.forEach((targetHex, index) => {
      const endPoint = targetHex.position.clone();
      const distance = startPoint.distanceTo(endPoint);
      const logDistComponent = Math.log(Math.max(1, distance));
      const dynamicCurveHeight = baseHeight + logDistComponent * logScaleFactor;

      const chordMidpoint = new THREE.Vector3().lerpVectors(startPoint, endPoint, 0.5);
      vecToMid.copy(chordMidpoint).sub(this.sphereCenter).normalize();
      surfaceMidpoint.copy(vecToMid).multiplyScalar(this.SPHERE_RADIUS).add(this.sphereCenter);
      midNormal.copy(vecToMid);
      controlPoint.copy(surfaceMidpoint).addScaledVector(midNormal, dynamicCurveHeight);

      const curve = new THREE.QuadraticBezierCurve3(
        startPoint.clone(),
        controlPoint.clone(),
        endPoint.clone()
      );

      const tubeGeometry = new THREE.TubeGeometry(curve, curveSegments, tubeRadius, tubeSegments, false);
      const tubeMaterial = new THREE.MeshBasicMaterial({
        color: 0xaaffff,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide,
      });
      const tubeMesh = new THREE.Mesh(tubeGeometry, tubeMaterial);
      tubeMesh.name = `ArcTube_${index}`;
      tubeGeometry.setDrawRange(0, 0);

      arcTubes.push({ mesh: tubeMesh, curve, progress: 0, totalIndices: tubeGeometry.index!.count });
      targetHexGroup.add(tubeMesh);

      // 多层水波纹动画效果
      const rippleGroup = new THREE.Group();
      targetHexGroup.add(rippleGroup);
      for (let layer = 0; layer < Math.max(3, rippleLayers); layer++) {
        const rippleSize = (layer + 1) * (rippleMaxSize / Math.max(3, rippleLayers));
        const rippleGeometry = new THREE.CircleGeometry(rippleSize, 32);
        const rippleMaterial = new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.6 - 0.1 * layer,
          side: THREE.DoubleSide,
        });
        const rippleMesh = new THREE.Mesh(rippleGeometry, rippleMaterial);
        rippleMesh.position.copy(endPoint);
        const rippleNormal = endPoint.clone().sub(this.sphereCenter).normalize();
        const rippleOffset = 0.05 * (layer + 1);
        rippleMesh.position.addScaledVector(rippleNormal, rippleOffset);
        const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), rippleNormal);
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
    // 返回每帧执行的动画函数
    return (deltaTime: number): void => {
      for (let i = arcTubes.length - 1; i >= 0; i--) {
        const arc = arcTubes[i];
        if (!arc.mesh || !arc.mesh.parent || !arc.mesh.geometry) {
          if (arc.mesh && arc.mesh.geometry) arc.mesh.geometry.dispose();
          // if (arc.mesh && arc.mesh.material) arc.mesh.material.dispose();
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
          ripple.mesh.scale.set(ripple.progress * ripple.maxSize, ripple.progress * ripple.maxSize, 1);
          // ripple.mesh.material.opacity = ripple.opacity * (1 - ripple.progress);
        } else {
          if (ripple.repeat) {
            ripple.progress = 0;
          } else {
            // ripple.mesh.material.opacity = Math.max(0, ripple.opacity * (1 - (ripple.progress - 1)));
            /* if (ripple.mesh.material.opacity <= 0) {
              targetHexGroup.remove(ripple.mesh);
              ripple.mesh.geometry.dispose();
              ripple.mesh.material.dispose();
              rippleEffects.splice(i, 1);
            } */
            console.log(`Ripple effect for ${ripple.mesh.name} completed.`);
          }
        }
      }
    };
  }

  private onMouseMove(event: MouseEvent): void {
    this.mouseX = event.clientX;
    this.mouseY = event.clientY;
  }

  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.mouseX = window.innerWidth / 2;
    this.mouseY = window.innerHeight / 2;
  }

  private animate(): void {
    requestAnimationFrame(this.animate.bind(this));
    const now = performance.now();
    const delta = Math.min(0.1, (now - this.lastTime) / 1000);
    this.lastTime = now;

    this.controls.update();

    if (this.hexGroup) {
      const normalizedX = -((this.mouseX / window.innerWidth) * 2 - 1);
      const normalizedY = -((this.mouseY / window.innerHeight) * 2 - 1);
      const targetRotationY = normalizedX * this.MOUSE_ROTATION_FACTOR_X;
      const targetRotationX = normalizedY * this.MOUSE_ROTATION_FACTOR_Y;
      const smoothFactor = 1.0 - Math.exp(-this.MOUSE_ROTATION_SMOOTHING * 60 * delta);
      this.hexGroup.rotation.y += (targetRotationY - this.hexGroup.rotation.y) * smoothFactor;
      this.hexGroup.rotation.x += (targetRotationX - this.hexGroup.rotation.x) * smoothFactor;
    }

    if (this.rayAnimator) {
      this.rayAnimator(delta);
    }

    this.renderer.render(this.scene, this.camera);
  }
}
