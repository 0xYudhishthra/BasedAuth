import React, { useEffect, useRef } from "react";
//@ts-ignore
import * as THREE from "three";

interface NFTRender3DProps {
  metadata: {
    image: string;
  };
  size: {
    width: number;
    height: number;
  };
}

const NFTRender3D: React.FC<NFTRender3DProps> = ({ metadata, size }) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Set up scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      size.width / size.height,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer();

    renderer.setSize(size.width, size.height);
    mountRef.current.appendChild(renderer.domElement);

    // Create a plane for the NFT image
    const geometry = new THREE.PlaneGeometry(5, 5);
    const texture = new THREE.TextureLoader().load(metadata.image);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.DoubleSide,
    });
    const plane = new THREE.Mesh(geometry, material);
    scene.add(plane);

    camera.position.z = 5;

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      plane.rotation.y += 0.01;
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      mountRef.current?.removeChild(renderer.domElement);
    };
  }, [metadata, size]);

  return <div ref={mountRef} />;
};

export default NFTRender3D;
