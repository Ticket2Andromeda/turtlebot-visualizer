<script lang="ts">
  import { T } from "@threlte/core";
  import { mockOccupancyGrid } from "./mockOccupancyGrid";
  const cellSize = mockOccupancyGrid.resolution;

  let cells = [];

  for (let y = 0; y < mockOccupancyGrid.height; y++) {
    for (let x = 0; x < mockOccupancyGrid.width; x++) {
      const flatIndex = y * mockOccupancyGrid.width + x;
      if (mockOccupancyGrid.data[flatIndex] === 100) {
        cells.push({
          x: x * cellSize,
          y: 0,
          z: y * cellSize,
        });
      }
    }
  }
</script>

<!-- Reminder here about keys to efficiently render Meshes -->
{#each cells as cell}
  <T.Mesh position={[cell.x, cell.y, cell.z]}>
    <T.BoxGeometry args={[cellSize, 0.1, cellSize]} />
    <T.MeshStandardMaterial color="green" />
  </T.Mesh>
{/each}
