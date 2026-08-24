import { useRef, useEffect, useState } from 'react'
import { useGLTF, useAnimations } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function Avatar({ listening, speaking, onReady }) {
  const group = useRef()
  const glowLight = useRef()
  const { scene, animations } = useGLTF('/models/mixamo-character.glb')
  const { actions } = useAnimations(animations, group)
  const [measured, setMeasured] = useState(false)

  useEffect(() => {
    const firstAnimationName = Object.keys(actions)[0]
    if (firstAnimationName) actions[firstAnimationName].play()
  }, [actions])

  useEffect(() => {
    const box = new THREE.Box3().setFromObject(scene)
    const height = box.max.y - box.min.y
    const centerX = (box.min.x + box.max.x) / 2
    const centerZ = (box.min.z + box.max.z) / 2

    scene.position.x -= centerX
    scene.position.z -= centerZ
    scene.position.y -= box.min.y

    const torsoStart = height * 0.55
    const clipPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), -torsoStart)

    scene.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material.clippingPlanes = [clipPlane]
        child.material.clipShadows = true
      }
    })

    const visibleHeight = height - torsoStart
    const visibleCenterY = torsoStart + visibleHeight / 2

    if (onReady) onReady({ visibleHeight, visibleCenterY })
    setMeasured(true)
  }, [scene, onReady])

  useFrame((state) => {
    if (!group.current || !measured) return
    const t = state.clock.getElapsedTime()

    if (speaking) {
      group.current.position.y = Math.sin(t * 1) * 0.04
      group.current.rotation.y = Math.sin(t * 1) * 0.04
      group.current.rotation.z = Math.sin(t * 3) * 0.03
    } else if (listening) {
      group.current.rotation.x = 0.12
      group.current.rotation.y = 0.05
      group.current.position.y = 0
    } else {
      group.current.position.y = Math.sin(t * 1.2) * 0.015
      group.current.rotation.x = 0
      group.current.rotation.y = 0
      group.current.rotation.z = 0
    }

    // Glow pulses while speaking, fades out otherwise
    if (glowLight.current) {
      const targetIntensity = speaking ? 1.5 + Math.sin(t * 6) * 0.6 : 0
      glowLight.current.intensity += (targetIntensity - glowLight.current.intensity) * 0.15
    }
  })

  return (
    <group ref={group}>
      <primitive object={scene} />
      <pointLight ref={glowLight} position={[0, 1, 0.8]} color="#fff2e0" intensity={0} distance={3} />
    </group>
  )
}

export default Avatar