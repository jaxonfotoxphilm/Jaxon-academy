import React, { useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRMLoaderPlugin, VRMUtils, VRM } from '@pixiv/three-vrm';

interface Avatar3DProps {
  url: string;
  isTalking?: boolean;
}

export const Avatar3D: React.FC<Avatar3DProps> = ({ url, isTalking }) => {
  const [vrm, setVrm] = useState<VRM | null>(null);

  useEffect(() => {
    if (!url) return;
    
    const loader = new GLTFLoader();
    loader.crossOrigin = 'anonymous';
    loader.register((parser) => new VRMLoaderPlugin(parser));

    loader.load(
      url,
      (gltf) => {
        const vrmData = gltf.userData.vrm;
        if (!vrmData) {
            console.error('No VRM data found in the model.');
            return;
        }
        
        VRMUtils.removeUnnecessaryJoints(gltf.scene);
        
        // Rotate the model to face the camera properly depending on the export
        // Most VRMs face +Z. If she's backwards, setting to 0 or Math.PI offsets it. 
        vrmData.scene.rotation.y = 0; 
        
        // Position it nicely in the frame
        vrmData.scene.position.y = -1.3;

        // Set initial pose immediately to prevent spring-bone physics from 'jumping'
        // when she snaps from a T-pose to a resting pose in the first frame.
        const leftArm = vrmData.humanoid?.getNormalizedBoneNode('leftUpperArm');
        const rightArm = vrmData.humanoid?.getNormalizedBoneNode('rightUpperArm');
        if (leftArm) leftArm.rotation.z = -1.1;
        if (rightArm) {
            rightArm.rotation.z = 0.9;
            rightArm.rotation.x = -0.3;
        }

        // Reset the spring bone manager so her dress and hair settle instantly
        if (vrmData.springBoneManager) {
            vrmData.springBoneManager.reset();
        }
        
        setVrm(vrmData);
      },
      (progress) => console.log('Loading model...', 100.0 * (progress.loaded / progress.total), '%'),
      (error) => console.error('Error loading VRM model:', error)
    );
  }, [url]);

  useFrame((state, delta) => {
    if (vrm) {
      vrm.update(delta);
      
      const t = state.clock.elapsedTime;
      const s = Math.sin(t);
      const c = Math.cos(t);

      // --- Idle Animation (Breathing / Swaying) ---
      const spine = vrm.humanoid.getNormalizedBoneNode('spine');
      const head = vrm.humanoid.getNormalizedBoneNode('head');
      const neck = vrm.humanoid.getNormalizedBoneNode('neck');

      if (spine) {
          spine.rotation.z = s * 0.015; // Extremely subtle body sway
          spine.rotation.x = c * 0.01;
      }

      // Human-like mannerisms: subtle head tracking and neck tilts
      if (head) {
          // Slow looking around
          head.rotation.y = Math.sin(t * 0.3) * 0.05;
          // Slight head tilt
          head.rotation.z = Math.cos(t * 0.2) * 0.03;
      }
      if (neck) {
          // Subtle breathing shift in the neck
          neck.rotation.x = Math.sin(t * 0.4) * 0.02;
      }

      // --- Arm Gestures ---
      const leftArm = vrm.humanoid.getNormalizedBoneNode('leftUpperArm');
      const rightArm = vrm.humanoid.getNormalizedBoneNode('rightUpperArm');
      const rightLowerArm = vrm.humanoid.getNormalizedBoneNode('rightLowerArm');
      const leftLowerArm = vrm.humanoid.getNormalizedBoneNode('leftLowerArm');
      
      // Slower sine waves for graceful movement
      const slowS = Math.sin(t * 0.5);
      const slowC = Math.cos(t * 0.5);
      
      // Left arm resting but subtly swaying
      if (leftArm) {
          leftArm.rotation.z = -1.1 + (slowS * 0.05); // Gently swing to the side
          leftArm.rotation.x = slowC * 0.05; // Gently swing forward/back
      }
      if (leftLowerArm) {
          leftLowerArm.rotation.x = -0.1 + (slowS * 0.05);
      }
      
      // Right arm actively but gracefully gesturing
      if (rightArm) {
          // Base gesture lowered towards the box, with a sweeping motion
          rightArm.rotation.z = 0.9 + (slowC * 0.1); 
          rightArm.rotation.x = -0.3 + (slowS * 0.15); // Sweep forward and back
      }
      if (rightLowerArm) {
          // Graceful elbow bending while talking/gesturing
          rightLowerArm.rotation.x = -0.5 + (slowS * 0.2); 
          rightLowerArm.rotation.y = slowC * 0.2; 
      }

      // --- Facial Expressions & Lip Sync ---
      if (isTalking) {
        // Fast random-looking mouth movements based on sine waves
        const talkS = Math.sin(t * 20);
        vrm.expressionManager?.setValue('aa', talkS > 0 ? talkS * 0.8 : 0);
        vrm.expressionManager?.setValue('ih', talkS < 0 ? -talkS * 0.5 : 0);
        vrm.expressionManager?.setValue('blink', 0);
      } else {
        // Random blinking when idle
        const blinkPhase = t % 4;
        const blinkAmount = blinkPhase > 3.8 ? Math.sin((blinkPhase - 3.8) * 15.7) : 0;
        vrm.expressionManager?.setValue('blink', Math.max(0, blinkAmount));
        vrm.expressionManager?.setValue('aa', 0);
        vrm.expressionManager?.setValue('ih', 0);
      }
    }
  });

  return vrm ? <primitive object={vrm.scene} /> : null;
};
