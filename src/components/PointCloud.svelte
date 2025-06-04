<script lang="ts">
  import { T } from "@threlte/core";
  import { Instance, InstancedMesh } from "@threlte/extras";
  import { onMount } from "svelte";
  import { Quaternion, Vector3 } from "three";
  import { appPalette } from "../lib/colors";
  import {
    subscribeToPointCloud,
    subscribeToTF,
  } from "../lib/ros/subscriptions";
  import { rosConnection } from "../lib/stores/connectionStore";

  let mapToOdom: any = null;
  let odomToBase: any = null;
  let points: { x: number; y: number; z: number }[] = [];
  let pointCloudListener: any;

  let lastUpdate = 0;
  const updateInterval = 1;

  interface LaserScanMessage {
    angle_min: number;
    angle_max: number;
    angle_increment: number;
    range_min: number;
    range_max: number;
    ranges: number[];
    intensities: number[];
  }

  let tfListener: any;

  function handleTFMessage(msg: any) {
    for (const t of msg.transforms) {
      if (t.header.frame_id === "map" && t.child_frame_id === "odom") {
        mapToOdom = t.transform;
      } else if (
        t.header.frame_id === "odom" &&
        (t.child_frame_id === "base_link" ||
          t.child_frame_id === "base_footprint")
      ) {
        odomToBase = t.transform;
      }
    }
  }
  function updatePointsFromLaserScan(message: LaserScanMessage) {
    const now = Date.now();
    if (now - lastUpdate >= updateInterval) {
      lastUpdate = now;

      const { angle_min, angle_increment, range_min, range_max, ranges } =
        message;
      const newPoints = [];

      if (!(mapToOdom && odomToBase)) return;

      // Translations
      const mapPos = new Vector3(
        mapToOdom.translation.x,
        mapToOdom.translation.y,
        mapToOdom.translation.z
      );
      const odomPos = new Vector3(
        odomToBase.translation.x,
        odomToBase.translation.y,
        odomToBase.translation.z
      );

      // Rotations
      const mapQuat = new Quaternion(
        mapToOdom.rotation.x,
        mapToOdom.rotation.y,
        mapToOdom.rotation.z,
        mapToOdom.rotation.w
      );
      const odomQuat = new Quaternion(
        odomToBase.rotation.x,
        odomToBase.rotation.y,
        odomToBase.rotation.z,
        odomToBase.rotation.w
      );

      // Compose transform
      const fullQuat = mapQuat.clone().multiply(odomQuat);
      const rotatedOdomPos = odomPos.clone().applyQuaternion(mapQuat);
      const mapToBasePos = mapPos.clone().add(rotatedOdomPos);

      for (let i = 0; i < ranges.length; i++) {
        const range = ranges[i];
        if (
          !isFinite(range) ||
          isNaN(range) ||
          range < range_min ||
          range > range_max
        ) {
          continue;
        }

        const angle = angle_min + i * angle_increment;

        // In base_link frame (flat 2D scan)
        const localPoint = new Vector3(
          range * Math.cos(angle),
          range * Math.sin(angle),
          0
        );

        // Transform into map frame
        const worldPoint = localPoint
          .clone()
          .applyQuaternion(fullQuat)
          .add(mapToBasePos);

        newPoints.push({
          x: worldPoint.x,
          y: worldPoint.z,
          z: -worldPoint.y,
        });
      }

      points = newPoints;
    }
  }

  onMount(() => {
    if ($rosConnection) {
      pointCloudListener = subscribeToPointCloud(
        $rosConnection,
        (message: any) => {
          updatePointsFromLaserScan(message);
        }
      );
      tfListener = subscribeToTF($rosConnection, handleTFMessage);
    }

    return () => {
      pointCloudListener?.unsubscribe();
      tfListener?.unsubscribe();
    };
  });
</script>

<InstancedMesh frustumCulled={false}>
  <T.SphereGeometry args={[0.12, 8, 8]} />
  <T.MeshStandardMaterial
    color={appPalette.pointcloud}
    transparent
    opacity={0.3}
    emissive={appPalette.pointcloud}
    emissiveIntensity={3}
  />
  {#each points as point}
    <Instance position={[point.x, point.y + 0.1, point.z]} />
  {/each}
</InstancedMesh>
