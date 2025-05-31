<script lang="ts">
  import { T } from "@threlte/core";
  import { onMount } from "svelte";
  import { Quaternion, Vector3 } from "three";
  import {
    subscribeToPointCloud,
    subscribeToTF,
  } from "../lib/ros/subscriptions";
  import { rosConnection } from "../lib/stores/connectionStore";

  let mapToOdom: any = null;
  let odomToBase: any = null;
  let points: { x: number; y: number; z: number }[] = [];
  let pointCloudListener: any;
  // This is a manual offset if there's time adjust PC <-> with /initialpose
  const pointOffset = {
    x: -2.07,
    y: -0.45,
    z: 0,
  };
  // const pointOffset = {
  //   x: -2.07,
  //   y: -0.45,
  //   z: 0,
  // };

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

  let transform = {
    translation: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
  };

  let tfListener: any;

  // function handleTFMessage(msg: any) {
  //   for (const t of msg.transforms) {
  //     if (t.header.frame_id === "map" && t.child_frame_id === "base_link") {
  //       transform = t.transform;
  //       break;
  //     }
  //   }
  // }

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

        // Convert ROS → Threlte (X, Z, Y)
        newPoints.push({
          x: worldPoint.x,
          y: worldPoint.z,
          z: -worldPoint.y,
        });
      }

      points = newPoints; // <-- THIS LINE WAS MISSING
    }
  }

  // function updatePointsFromLaserScan(message: LaserScanMessage) {
  //     const now = Date.now();
  //     if (now - lastUpdate >= updateInterval) {
  //       lastUpdate = now;

  //       const { angle_min, angle_increment, range_min, range_max, ranges } =
  //         message;

  //       const newPoints = [];

  //       // Convert quaternion rotation into Euler (roll, pitch, yaw)
  //       const q = new Quaternion(
  //         transform.rotation.x,
  //         transform.rotation.y,
  //         transform.rotation.z,
  //         transform.rotation.w
  //       );
  //       const euler = new Euler().setFromQuaternion(q);
  //       const theta = euler.z; // yaw rotation (not .y — that's pitch!)

  //       for (let i = 0; i < ranges.length; i++) {
  //         const range = ranges[i];
  //         if (
  //           !isFinite(range) ||
  //           isNaN(range) ||
  //           range < range_min ||
  //           range > range_max
  //         ) {
  //           continue;
  //         }

  //         const angle = angle_min + i * angle_increment;

  //         // Local laser frame
  //         const localX = range * Math.cos(angle);
  //         const localZ = range * Math.sin(angle);
  //         const localY = 0;

  //         // Apply yaw rotation
  //         const rotatedX = localX * Math.cos(theta) - localZ * Math.sin(theta);
  //         const rotatedZ = localX * Math.sin(theta) + localZ * Math.cos(theta);

  //         // Translate into map frame
  //         const globalX = rotatedX + transform.translation.x + pointOffset.x;
  //         const globalZ = rotatedZ + transform.translation.y + pointOffset.y; // ROS Z → Svelte Y
  //         const globalY = transform.translation.z + pointOffset.z; // ROS Y → Svelte Z

  //         newPoints.push({ x: globalX, y: globalY, z: globalZ });
  //       }

  //       points = newPoints;
  //     }
  //   }
  // function updatePointsFromLaserScan(message: LaserScanMessage) {
  //   const now = Date.now();
  //   if (now - lastUpdate >= updateInterval) {
  //     lastUpdate = now;

  //     const { angle_min, angle_increment, range_min, range_max, ranges } =
  //       message;

  //     const newPoints = [];

  //     // Convert quaternion rotation into Euler (roll, pitch, yaw)
  //     const q = new Quaternion(
  //       transform.rotation.x,
  //       transform.rotation.y,
  //       transform.rotation.z,
  //       transform.rotation.w
  //     );
  //     const euler = new Euler().setFromQuaternion(q);
  //     const theta = euler.z; // yaw rotation (not .y — that's pitch!)

  //     for (let i = 0; i < ranges.length; i++) {
  //       const range = ranges[i];
  //       if (
  //         !isFinite(range) ||
  //         isNaN(range) ||
  //         range < range_min ||
  //         range > range_max
  //       ) {
  //         continue;
  //       }

  //       const angle = angle_min + i * angle_increment;

  //       // Local laser frame
  //       const localX = range * Math.cos(angle);
  //       const localZ = range * Math.sin(angle);
  //       const localY = 0;

  //       // Apply yaw rotation
  //       const rotatedX = localX * Math.cos(theta) - localZ * Math.sin(theta);
  //       const rotatedZ = localX * Math.sin(theta) + localZ * Math.cos(theta);

  //       // Translate into map frame
  //       const globalX = rotatedX + transform.translation.x + pointOffset.x;
  //       const globalZ = rotatedZ + transform.translation.y + pointOffset.y; // ROS Z → Svelte Y
  //       const globalY = transform.translation.z + pointOffset.z; // ROS Y → Svelte Z

  //       newPoints.push({ x: globalX, y: globalY, z: globalZ });
  //     }

  //     points = newPoints;
  //   }
  // }

  // function updatePointsFromLaserScan(message: LaserScanMessage) {
  //   const now = Date.now();
  //   console.log("calling update points");
  //   if (now - lastUpdate >= updateInterval) {
  //     console.log("inside if statement");

  //     lastUpdate = now;
  //     const { angle_min, angle_increment, range_min, range_max, ranges } =
  //       message;

  //     const newPoints = [];

  //     for (let i = 0; i < ranges.length; i++) {
  //       const range = ranges[i];
  //       if (
  //         !isFinite(range) ||
  //         isNaN(range) ||
  //         range < range_min ||
  //         range > range_max
  //       ) {
  //         continue;
  //       }

  //       const angle = angle_min + i * angle_increment;
  //       const x = range * Math.cos(angle);
  //       const z = range * Math.sin(angle);
  //       const y = 0; // Assuming scan is on the ground plane

  //       newPoints.push({ x, y, z });
  //     }

  //     points = newPoints;
  //     console.log("Pointcloud updated new points", newPoints);
  //   }
  // }

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

{#each points as point}
  <T.Mesh position={[point.x, point.y, point.z]}>
    <T.SphereGeometry args={[0.12, 8, 8]} />
    <T.MeshStandardMaterial
      color={0x46affa}
      transparent
      opacity={0.3}
      emissive="blue"
      emissiveIntensity={3}
    />
  </T.Mesh>
{/each}
