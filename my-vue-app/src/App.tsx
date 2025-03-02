import { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';

const GravitySimulator = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [restitution, setRestitution] = useState(0.7); // Bounce factor
  const [gravity, setGravity] = useState(9.8); // Gravity acceleration (m/s²)
  const [sphereRadius, setSphereRadius] = useState(1); // Sphere radius
  const [friction, setFriction] = useState(0.03); // Surface friction

  useEffect(() => {
    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb); // Sky blue background

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 5, 10);
    camera.lookAt(0, 0, 0);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;

    // Add renderer to DOM
    if (mountRef.current) {
      mountRef.current.appendChild(renderer.domElement);
    }

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    scene.add(directionalLight);

    // Ground plane
    const groundGeometry = new THREE.PlaneGeometry(20, 20);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x999999,
      roughness: 0.8,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    ground.position.y = 0;
    ground.receiveShadow = true;
    scene.add(ground);

    // Grid helper
    const gridHelper = new THREE.GridHelper(20, 20);
    scene.add(gridHelper);

    // Sphere
    const sphereGeometry = new THREE.SphereGeometry(sphereRadius, 32, 32);
    const sphereMaterial = new THREE.MeshStandardMaterial({
      color: 0xff4040,
      roughness: 0.7,
      metalness: 0.2,
    });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphere.position.y = 10; // Start from height
    sphere.castShadow = true;
    scene.add(sphere);

    // Physics variables
    let velocity = 0;
    let isResting = false;
    const restThreshold = 0.01;

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // Animation loop
    const clock = new THREE.Clock();

    const animate = () => {
      requestAnimationFrame(animate);

      if (!isResting) {
        const delta = Math.min(clock.getDelta(), 0.1); // Cap delta time to avoid large jumps

        // Apply gravity
        velocity -= gravity * delta;

        // Update position
        sphere.position.y += velocity * delta;

        // Check ground collision
        if (sphere.position.y < sphereRadius) {
          // Bounce
          sphere.position.y = sphereRadius;

          if (Math.abs(velocity) > restThreshold) {
            velocity = -velocity * restitution;

            // Apply friction to reduce horizontal movement when bouncing
            velocity *= 1 - friction;
          } else {
            // Come to rest
            velocity = 0;
            isResting = true;
          }
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // Reset function
    const resetSimulation = () => {
      sphere.position.y = 10;
      velocity = 0;
      isResting = false;
    };

    // Create a reset button
    const resetButton = document.createElement('button');
    resetButton.innerHTML = 'Reset Simulation';
    resetButton.style.position = 'absolute';
    resetButton.style.top = '20px';
    resetButton.style.left = '20px';
    resetButton.style.padding = '10px';
    resetButton.style.cursor = 'pointer';
    resetButton.addEventListener('click', resetSimulation);
    document.body.appendChild(resetButton);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      document.body.removeChild(resetButton);
    };
  }, [restitution, gravity, sphereRadius, friction]);

  return (
    <div className="w-full h-screen">
      <div className="w-full h-full" ref={mountRef}></div>
      <div className="absolute bottom-4 left-4 bg-gray-800 bg-opacity-70 p-4 rounded text-white">
        <h3 className="text-lg font-bold mb-2">Gravity Simulator</h3>
        <p>球体が重力で落下し、地面に当たると跳ね返ります。</p>
        <p>徐々に摩擦によってエネルギーを失い、静止します。</p>
      </div>
    </div>
  );
};

export default GravitySimulator;
