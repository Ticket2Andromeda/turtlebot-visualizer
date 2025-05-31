<script lang="ts">
  import { T } from "@threlte/core";
  import { onMount } from "svelte";
  import { Euler, Quaternion } from "three";
  import { subscribeToMap } from "../lib/ros/subscriptions";
  import { rosConnection } from "../lib/stores/connectionStore";

  let cells: any[] = [];
  let cellSize = 0.05;

  let mapOrigin = { x: 0, y: 0, z: 0 };
  let mapYaw = 0;
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

    // Store map origin and yaw for group transform
    mapOrigin = {
      x: origin.position.x,
      y: origin.position.z,
      z: -origin.position.y,
    };

    const q = new Quaternion(
      origin.orientation.x,
      origin.orientation.y,
      origin.orientation.z,
      origin.orientation.w
    );
    const euler = new Euler().setFromQuaternion(q);
    mapYaw = euler.z;

    // Populate occupancy cells in local grid coordinates
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const flatIndex = y * width + x;
        if (data[flatIndex] === 100) {
          cells.push({
            x: x * resolution,
            y: 0,
            z: -y * resolution,
          });
        }
      }
    }
  }

  onMount(() => {
    if ($rosConnection) {
      mapListener = subscribeToMap(
        $rosConnection,
        (message: OccupancyGridMessage) => {
          updateCellsFromMap(message);
        }
      );
    }
    return () => {
      mapListener?.unsubscribe();
    };
  });
</script>

<!-- ✅ Apply map origin and yaw transform here -->
<T.Group
  position={[mapOrigin.x, mapOrigin.y, mapOrigin.z]}
  rotation={[0, mapYaw, 0]}
>
  {#each cells as cell}
    <T.Mesh position={[cell.x, cell.y, cell.z]} castShadow>
      <T.BoxGeometry args={[cellSize, 1, cellSize]} />
      <T.MeshStandardMaterial color="green" />
    </T.Mesh>
  {/each}
</T.Group>
<!-- This is for saving performance -->
<!-- <InstancedMesh>
    <T.BoxGeometry args={[cellSize, 1, cellSize]} />
    <T.MeshStandardMaterial color="green" />
    {#each cells as cell}
      <Instance position={[cell.x, cell.y, cell.z]} />
    {/each}
  </InstancedMesh> -->
