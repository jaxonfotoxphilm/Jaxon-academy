import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

interface Environment3DProps {
    url: string;
    isPanEnabled?: boolean;
}

export const Environment3D: React.FC<Environment3DProps> = ({ url, isPanEnabled = true }) => {
    const { scene } = useGLTF(url) as any;
    const groupRef = useRef<THREE.Group>(null);

    useFrame((state) => {
        if (!groupRef.current || !isPanEnabled) return;
        // Subtle cinematic panning effect
        groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.05;
        groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.05;
    });

    return (
        <group ref={groupRef} position={[0, -1, -5]} scale={[2, 2, 2]}>
            <primitive object={scene} />
        </group>
    );
};
