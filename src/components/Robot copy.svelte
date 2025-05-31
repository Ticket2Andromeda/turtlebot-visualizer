<script lang="ts">
  import { T } from "@threlte/core";
  export let position: [number, number, number] = [0, 0, 0];
</script>

<T.Group {position}>
  <!-- Robot body -->
  <T.Mesh position={[0, 0.13, 0]}>
    <T.CylinderGeometry args={[0.15, 0.15, 0.2, 32]} />
    <T.MeshStandardMaterial color="#aaaaaa" />
  </T.Mesh>

  <!-- Left wheel (flush along X-axis, offset in X) -->
  <T.Mesh position={[-0.17, 0.09, 0]} rotation={[0, 0, Math.PI / 2]}>
    <T.CylinderGeometry args={[0.09, 0.09, 0.03, 10]} />
    <T.MeshStandardMaterial color="#666666" />
  </T.Mesh>

  <!-- Right wheel (symmetrical) -->
  <T.Mesh position={[0.17, 0.09, 0]} rotation={[0, 0, Math.PI / 2]}>
    <T.CylinderGeometry args={[0.09, 0.09, 0.03, 10]} />
    <T.MeshStandardMaterial color="#666666" />
  </T.Mesh>
</T.Group>
