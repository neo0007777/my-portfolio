import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

const EarthBackground = ({ mousePosition }) => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const animationIdRef = useRef(null);
  const earthRef = useRef(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Set up the scene, camera, and renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true // Enable transparency for overlay
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0); // Fully transparent background
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.zIndex = '-1'; // Behind other content
    renderer.domElement.style.pointerEvents = 'none'; // Allow interactions with content above
    mountRef.current.appendChild(renderer.domElement);

    // Store refs
    sceneRef.current = scene;
    rendererRef.current = renderer;

    // Create Earth sphere with realistic texture
    const geometry = new THREE.SphereGeometry(1, 64, 64);
    const texture = new THREE.TextureLoader().load('https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg');
    const material = new THREE.MeshPhongMaterial({
      map: texture,
      shininess: 1000,
      specular: 0x222222,
      emissive: 0x001122,
      emissiveIntensity: 0.1
    });
    const earth = new THREE.Mesh(geometry, material);
    scene.add(earth);
    earthRef.current = earth;

    // Add subtle wireframe overlay
    const wireframeGeometry = new THREE.SphereGeometry(1.01, 24, 24);
    const wireframeMaterial = new THREE.MeshBasicMaterial({
      color: 0x00aaff,
      wireframe: true,
      transparent: true,
      opacity: 0.15
    });
    const wireframe = new THREE.Mesh(wireframeGeometry, wireframeMaterial);
    scene.add(wireframe);

    // Add subtle energy particles
    const energyGeometry = new THREE.BufferGeometry();
    const energyPositions = [];
    const energyColors = [];

    for (let i = 0; i < 100; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 1.1 + Math.random() * 0.2;

      const x = Math.sin(phi) * Math.cos(theta) * radius;
      const y = Math.sin(phi) * Math.sin(theta) * radius;
      const z = Math.cos(phi) * radius;

      energyPositions.push(x, y, z);

      const colorChoice = Math.random();
      if (colorChoice > 0.8) {
        energyColors.push(0, 0.8, 1);
      } else {
        energyColors.push(0, 0.5, 0.8);
      }
    }

    energyGeometry.setAttribute('position', new THREE.Float32BufferAttribute(energyPositions, 3));
    energyGeometry.setAttribute('color', new THREE.Float32BufferAttribute(energyColors, 3));

    const energyMaterial = new THREE.PointsMaterial({
      size: 0.015,
      transparent: true,
      opacity: 0.4,
      vertexColors: true,
      blending: THREE.AdditiveBlending
    });

    const energyParticles = new THREE.Points(energyGeometry, energyMaterial);
    scene.add(energyParticles);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 3, 5);
    scene.add(directionalLight);

    // Subtle background lights
    const pointLight1 = new THREE.PointLight(0x00aaff, 0.3, 15);
    pointLight1.position.set(2, 2, 2);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x00ffff, 0.2, 12);
    pointLight2.position.set(-2, -2, 2);
    scene.add(pointLight2);

    // Camera position
    camera.position.z = 3;

    // Animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);

      if (earthRef.current && mousePosition) {
        // Calculate Earth transform based on mouse position
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const deltaX = (mousePosition.x - centerX) / centerX;
        const deltaY = (mousePosition.y - centerY) / centerY;

        // Calculate distance from center for zoom effect
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const maxDistance = Math.sqrt(2); // Maximum possible distance from center
        const zoomFactor = 1 + (distance / maxDistance) * 0.2; // 20% zoom range

        // Constrain movement to keep Earth in view
        const maxMove = 0.3;
        earthRef.current.position.x = Math.max(-maxMove, Math.min(maxMove, deltaX * 0.2));
        earthRef.current.position.y = Math.max(-maxMove, Math.min(maxMove, deltaY * 0.2));
        earthRef.current.scale.setScalar(zoomFactor);
      }

      // Rotate Earth slowly
      earth.rotation.y += 0.002;

      // Subtle independent wireframe motion
      wireframe.rotation.y += 0.003;
      wireframe.rotation.x += 0.001;

      // Animate energy particles in orbit
      const positions = energyGeometry.attributes.position.array;
      for (let i = 0; i < 100; i++) {
        const i3 = i * 3;
        const t = Date.now() * 0.0008;

        const r = Math.sqrt(positions[i3] ** 2 + positions[i3 + 1] ** 2 + positions[i3 + 2] ** 2);
        const phi = Math.acos(positions[i3 + 2] / r);
        const theta = Math.atan2(positions[i3 + 1], positions[i3]) + 0.005;
        const radius = 1.1 + Math.sin(t + i * 0.1) * 0.05;

        positions[i3] = Math.sin(phi) * Math.cos(theta) * radius;
        positions[i3 + 1] = Math.sin(phi) * Math.sin(theta) * radius;
        positions[i3 + 2] = Math.cos(phi) * radius;
      }
      energyGeometry.attributes.position.needsUpdate = true;

      // Subtle pulsing
      const time = Date.now() * 0.002;
      pointLight1.intensity = 0.3 + Math.sin(time) * 0.1;
      pointLight2.intensity = 0.2 + Math.cos(time * 1.3) * 0.08;
      wireframe.material.opacity = 0.15 + Math.sin(time * 1.5) * 0.05;

      renderer.render(scene, camera);
    };
    animate();

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup function
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return <div ref={mountRef} className="earth-background" />;
};

export default EarthBackground;
