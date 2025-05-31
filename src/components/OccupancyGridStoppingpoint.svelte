<script lang="ts">
  import { T } from "@threlte/core";
  import { onMount } from "svelte";
  import { Euler, Quaternion } from "three";
  import { connectToROS, subscribeToMap } from "../lib/ros/subscriptions";
  // const cellSize = mockOccupancyGrid.resolution;

  let cells: any = [];
  let cellSize = 0.05;
  let mapListener: any;

  interface OccupancyGridMessage {
    data: number[];
    info: {
      resolution: number;
      width: number;
      height: number;
      origin: {
        position: { x: number; y: number; z: number };
        orientation: { x: number; y: number; z: number; w: number };
      };
    };
  }

  function updateCellsFromMap(message: OccupancyGridMessage) {
    const { data, info } = message;
    const { resolution, width, height, origin } = info;

    cellSize = resolution;
    cells = [];

    const originX = origin.position.x;
    const originY = origin.position.y;

    // Convert orientation quaternion to yaw (rotation around Z axis)
    const q = new Quaternion(
      origin.orientation.x,
      origin.orientation.y,
      origin.orientation.z,
      origin.orientation.w
    );
    const euler = new Euler().setFromQuaternion(q);
    const yaw = euler.z;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const flatIndex = y * width + x;
        if (data[flatIndex] === 100) {
          // Local coordinates in map frame
          const localX = x * resolution;
          const localY = y * resolution;

          // Apply yaw rotation
          const rotatedX = localX * Math.cos(yaw) - localY * Math.sin(yaw);
          const rotatedY = localX * Math.sin(yaw) + localY * Math.cos(yaw);

          // Translate to world position
          const worldX = rotatedX + originX;
          const worldZ = rotatedY + originY;

          cells.push({
            x: worldX,
            y: 0,
            z: worldZ,
          });
        }
      }
    }
  }
  // function updateCellsFromMap(message: OccupancyGridMessage) {
  //   const { data, info } = message;
  //   const { resolution, width, height } = info;

  //   cellSize = resolution;
  //   cells = [];

  //   const originX = info.origin.position.x;
  //   const originY = info.origin.position.y;
  //   // const mapWidthMeters = width * resolution;
  //   // const mapHeightMeters = height * resolution;

  //   // const offsetX = -mapWidthMeters / 2;
  //   // const offsetY = -mapHeightMeters / 2;

  //   for (let y = 0; y < height; y++) {
  //     for (let x = 0; x < width; x++) {
  //       const flatIndex = y * width + x;
  //       if (data[flatIndex] === 100) {
  //         cells.push({
  //           x: x * resolution + originX,
  //           y: 0,
  //           z: y * resolution + originY,
  //         });
  //         // cells.push({
  //         //   x: x * resolution + offsetX,
  //         //   y: 0,
  //         //   z: y * resolution + offsetY,
  //         // });
  //       }
  //     }
  //   }
  // }

  onMount(() => {
    const ros = connectToROS("ws://192.168.64.2:9090");

    mapListener = subscribeToMap(ros, (message: OccupancyGridMessage) => {
      console.log("Received map message:", message);
      updateCellsFromMap(message);
    });

    return () => {
      mapListener?.unsubscribe();
    };
  });
</script>

<T.Group position={[originX, 0, originY]} rotation={[0, yaw, 0]}>
  {#each cells as cell}
    <T.Mesh position={[cell.x, cell.y, cell.z]}>
      <T.BoxGeometry args={[cellSize, 0.1, cellSize]} />
      <T.MeshStandardMaterial color="green" />
    </T.Mesh>
  {/each}
</T.Group>

<!-- {#each cells as cell}
  <T.Mesh position={[cell.x, cell.y, cell.z]}>
    <T.BoxGeometry args={[cellSize, 0.1, cellSize]} />
    <T.MeshStandardMaterial color="green" />
  </T.Mesh>
{/each} -->
