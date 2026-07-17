"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame, type ThreeElements } from "@react-three/fiber";
import { Center, ContactShadows, Environment } from "@react-three/drei";
import { easing } from "maath";
import * as THREE from "three";

export type Emocao = "neutro" | "atento" | "tapado" | "espiando" | "feliz" | "erro";

const LARANJA = "#f4841f";
const LARANJA_ESC = "#e06a0e";
const CREME = "#fff3e0";
const ESCURO = "#2b1a12";
const ORELHA_INT = "#4b2e2a";
const VERDE = "#22c55e";

function Raposa({
  emocao = "neutro",
  seguirMouse = true,
  ...props
}: { emocao?: Emocao; seguirMouse?: boolean } & ThreeElements["group"]) {
  const grupo = useRef<THREE.Group>(null!);
  const corpo = useRef<THREE.Group>(null!);
  const pataE = useRef<THREE.Group>(null!);
  const pataD = useRef<THREE.Group>(null!);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const { x, y } = state.pointer; // -1..1

    // Cabeça segue o mouse (mais discreto quando não é pra seguir).
    const ry = (seguirMouse ? 0.5 : 0.16) * x;
    const rx = (seguirMouse ? 0.3 : 0.1) * -y;
    const lean = emocao === "atento" ? 0.12 : 0; // inclina pra frente, curiosa
    const shake = emocao === "erro" ? Math.sin(t * 38) * 0.05 : 0; // tremida no erro
    easing.dampE(grupo.current.rotation, [rx + lean, ry, shake], 0.2, delta);

    // Respiração + pulinho quando feliz.
    const jump = emocao === "feliz" ? Math.abs(Math.sin(t * 5.5)) * 0.16 : 0;
    easing.damp3(corpo.current.position, [0, jump, 0], 0.14, delta);
    corpo.current.scale.setScalar(1 + Math.sin(t * 1.4) * 0.015);

    // Patas: tapam os olhos na senha ("tapado"); no "espiando" só a esquerda tapa.
    const cobreE = emocao === "tapado" || emocao === "espiando";
    const cobreD = emocao === "tapado";
    easing.damp3(pataE.current.position, cobreE ? [-0.28, 0.1, 1.02] : [-0.36, -0.62, 0.62], 0.12, delta);
    easing.damp3(pataD.current.position, cobreD ? [0.28, 0.1, 1.02] : [0.36, -0.62, 0.62], 0.12, delta);
  });

  return (
    <group ref={grupo} {...props} dispose={null}>
      <group ref={corpo}>
        {/* Cabeça redondinha e facetada */}
        <mesh castShadow scale={[1.02, 1, 0.96]}>
          <icosahedronGeometry args={[1, 1]} />
          <meshStandardMaterial color={LARANJA} flatShading metalness={0} roughness={0.6} />
        </mesh>

        {/* Focinho + nariz */}
        <mesh castShadow position={[0, -0.32, 0.78]} scale={[0.4, 0.3, 0.34]}>
          <icosahedronGeometry args={[1, 1]} />
          <meshStandardMaterial color={CREME} flatShading metalness={0} roughness={0.7} />
        </mesh>
        <mesh position={[0, -0.3, 1.08]}>
          <icosahedronGeometry args={[0.1, 1]} />
          <meshStandardMaterial color={ESCURO} flatShading roughness={0.4} />
        </mesh>

        {/* Orelhas triangulares pontudas */}
        {[-1, 1].map((lado) => (
          <group key={lado} position={[lado * 0.5, 1.0, 0.1]} rotation={[-0.16, 0, lado * 0.2]}>
            <mesh castShadow rotation={[0, lado * -0.5 + Math.PI, 0]}>
              <coneGeometry args={[0.44, 1.02, 3]} />
              <meshStandardMaterial color={LARANJA} flatShading metalness={0} roughness={0.6} />
            </mesh>
            <mesh position={[0, -0.05, 0.14]} rotation={[0, lado * -0.5 + Math.PI, 0]} scale={[0.5, 0.66, 0.5]}>
              <coneGeometry args={[0.44, 1.02, 3]} />
              <meshStandardMaterial color={ORELHA_INT} flatShading roughness={0.7} />
            </mesh>
          </group>
        ))}

        {/* Olhos: contas pretas brilhantes com brilho */}
        {[-1, 1].map((lado) => (
          <group key={lado} position={[lado * 0.3, 0.1, 0.88]}>
            <mesh>
              <sphereGeometry args={[0.15, 16, 16]} />
              <meshStandardMaterial color="#20140d" metalness={0.1} roughness={0.25} />
            </mesh>
            <mesh position={[lado * 0.05, 0.05, 0.11]}>
              <sphereGeometry args={[0.045, 10, 10]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
            <mesh position={[lado * -0.03, -0.03, 0.12]}>
              <sphereGeometry args={[0.02, 8, 8]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
          </group>
        ))}

        {/* Corpinho + barriga */}
        <mesh castShadow position={[0, -1.32, 0]} scale={[0.74, 0.82, 0.72]}>
          <icosahedronGeometry args={[1, 1]} />
          <meshStandardMaterial color={LARANJA_ESC} flatShading metalness={0} roughness={0.65} />
        </mesh>
        <mesh position={[0, -1.28, 0.46]} scale={[0.44, 0.58, 0.32]}>
          <icosahedronGeometry args={[1, 1]} />
          <meshStandardMaterial color={CREME} flatShading roughness={0.7} />
        </mesh>

        {/* Coleira verde + plaquinha dourada */}
        <mesh position={[0, -0.84, 0]} rotation={[1.45, 0, 0]} scale={[1, 1, 0.72]}>
          <torusGeometry args={[0.72, 0.12, 12, 32]} />
          <meshStandardMaterial color={VERDE} metalness={0.15} roughness={0.45} />
        </mesh>
        <mesh position={[0, -1.02, 0.6]} rotation={[0.35, 0, 0]}>
          <cylinderGeometry args={[0.11, 0.11, 0.05, 20]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.4} roughness={0.35} />
        </mesh>

        {/* Patas (tapam os olhos na senha) */}
        <group ref={pataE} position={[-0.36, -0.62, 0.62]}>
          <mesh castShadow>
            <icosahedronGeometry args={[0.2, 1]} />
            <meshStandardMaterial color={LARANJA} flatShading metalness={0} roughness={0.6} />
          </mesh>
        </group>
        <group ref={pataD} position={[0.36, -0.62, 0.62]}>
          <mesh castShadow>
            <icosahedronGeometry args={[0.2, 1]} />
            <meshStandardMaterial color={LARANJA} flatShading metalness={0} roughness={0.6} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

export default function RaposaCena({
  emocao = "neutro",
  seguirMouse = true,
}: {
  emocao?: Emocao;
  seguirMouse?: boolean;
}) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 0, 6.8], fov: 40 }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
    >
      <hemisphereLight args={["#ffffff", "#3a3f4a", 0.5]} />
      <directionalLight castShadow intensity={2.4} position={[4, 5, 3]} color="#fff6e8" />
      <directionalLight intensity={0.6} position={[-3, 2, 4]} color="#88b7ff" />
      <directionalLight intensity={1.4} position={[-4, 3, -5]} color="#3ddc84" />

      <Suspense fallback={null}>
        <Center position={[0, 0.5, 0]}>
          <Raposa emocao={emocao} seguirMouse={seguirMouse} />
        </Center>
        <Environment preset="city" environmentIntensity={0.35} />
        <ContactShadows position={[0, -2, 0]} opacity={0.45} scale={9} blur={2.6} far={4} />
      </Suspense>
    </Canvas>
  );
}
