<script lang="ts">
  import { T, useTask } from '@threlte/core';
  import { Float } from '@threlte/extras';

  let rotation = 0;

  useTask((_, delta) => {
    rotation += delta * 0.3;
  });
</script>

<T.PerspectiveCamera makeDefault position={[0, 0, 10]} fov={50} />

<!-- Ambient light -->
<T.AmbientLight intensity={0.3} />

<!-- Main lights -->
<T.DirectionalLight position={[5, 5, 5]} intensity={1} color="#a855f7" />
<T.DirectionalLight position={[-5, -5, 5]} intensity={0.5} color="#22d3ee" />

<!-- Floating Hexagon (purple) -->
<Float
  speed={2}
  rotationIntensity={1}
  floatIntensity={2}
>
  <T.Mesh position={[-3, 2, -2]} rotation.y={rotation} rotation.x={rotation * 0.5}>
    <T.CylinderGeometry args={[1, 1, 0.3, 6]} />
    <T.MeshStandardMaterial color="#a855f7" metalness={0.8} roughness={0.2} />
  </T.Mesh>
</Float>

<!-- Floating Torus (cyan) -->
<Float
  speed={1.5}
  rotationIntensity={0.5}
  floatIntensity={3}
>
  <T.Mesh position={[3, -1, -3]} rotation.x={rotation * 0.7} rotation.y={rotation}>
    <T.TorusGeometry args={[0.8, 0.3, 16, 32]} />
    <T.MeshStandardMaterial color="#22d3ee" metalness={0.9} roughness={0.1} />
  </T.Mesh>
</Float>

<!-- Floating Icosahedron (pink) -->
<Float
  speed={2.5}
  rotationIntensity={1.5}
  floatIntensity={1.5}
>
  <T.Mesh position={[0, -2, -4]} rotation.y={rotation} rotation.z={rotation * 0.3}>
    <T.IcosahedronGeometry args={[0.8]} />
    <T.MeshStandardMaterial color="#ec4899" metalness={0.7} roughness={0.3} />
  </T.Mesh>
</Float>

<!-- Small floating cubes -->
<Float speed={3} rotationIntensity={2} floatIntensity={2}>
  <T.Mesh position={[-4, -2, -5]} rotation.x={rotation} rotation.y={rotation}>
    <T.BoxGeometry args={[0.3, 0.3, 0.3]} />
    <T.MeshStandardMaterial color="#eab308" metalness={0.8} roughness={0.2} />
  </T.Mesh>
</Float>

<Float speed={2} rotationIntensity={1} floatIntensity={3}>
  <T.Mesh position={[4, 2, -6]} rotation.z={rotation} rotation.x={rotation}>
    <T.BoxGeometry args={[0.4, 0.4, 0.4]} />
    <T.MeshStandardMaterial color="#22d3ee" metalness={0.8} roughness={0.2} />
  </T.Mesh>
</Float>

<!-- Floating Octahedron (purple) -->
<Float speed={1.8} rotationIntensity={0.8} floatIntensity={2.5}>
  <T.Mesh position={[-2, -3, -7]} rotation.y={rotation * 1.2}>
    <T.OctahedronGeometry args={[0.6]} />
    <T.MeshStandardMaterial color="#a855f7" metalness={0.6} roughness={0.4} />
  </T.Mesh>
</Float>
