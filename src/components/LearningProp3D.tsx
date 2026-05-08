import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Float, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

interface LearningProp3DProps {
    url: string;
}

export const LearningProp3D: React.FC<LearningProp3DProps> = ({ url }) => {
    const { scene } = useGLTF(url) as any;
    const propRef = useRef<THREE.Group>(null);

    useFrame(() => {
        if (!propRef.current) return;
        // Slow auto-rotation so the student can see all sides
        propRef.current.rotation.y += 0.005;
    });

    return (
        <group position={[-1.5, 0.5, 1.5]}>
            {/* Allow the user to drag and inspect the prop */}
            <OrbitControls enableZoom={true} enablePan={false} maxDistance={5} minDistance={1} />
            <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
                <group ref={propRef} scale={[0.8, 0.8, 0.8]}>
                    <primitive object={scene} />
                </group>
            </Float>
            <directionalLight position={[5, 5, 5]} intensity={1.5} />
            <ambientLight intensity={0.5} />
        </group>
    );
};
