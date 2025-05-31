<script lang="ts">
  import { T } from "@threlte/core";
  import { onMount } from "svelte";
  import { Euler, Quaternion, Vector3 } from "three";
  import { subscribeToTF } from "../lib/ros/subscriptions";
  import { rosConnection } from "../lib/stores/connectionStore";

  //   let {
  //     controls = $bindable(),
  //   }: {
  //     controls: CC | undefined;
  //   } = $props();

  let {
    robotPosition = $bindable(),
    yaw = $bindable(),
  }: { robotPosition: [number, number, number]; yaw: number } = $props();

  //   export let robotPosition: [number, number, number] = [0, 0, 0];
  //   export let yaw = 0;
  robotPosition = [0, 0, 0];
  yaw = 0;
  let leftWheelTransform: any = null;
  let rightWheelTransform: any = null;
  let leftWheelPosition = $state<[number, number, number]>([0, 0, 0]);
  let leftWheelRotation = $state<[number, number, number]>([0, 0, 0]);

  let rightWheelPosition = $state<[number, number, number]>([0, 0, 0]);
  let rightWheelRotation = $state<[number, number, number]>([0, 0, 0]);
  //   let leftWheelPosition: [number, number, number] = [0, 0, 0];
  //   let leftWheelRotation: [number, number, number] = [0, 0, 0];

  //   let rightWheelPosition: [number, number, number] = [0, 0, 0];
  //   let rightWheelRotation: [number, number, number] = [0, 0, 0];

  function convertTransformToPose(transform: any): {
    position: [number, number, number];
    rotation: [number, number, number];
  } {
    if (!transform) {
      return {
        position: [0, 0, 0],
        rotation: [0, 0, 0],
      };
    }
    const pos = transform.translation;
    const quat = new Quaternion(
      transform.rotation.x,
      transform.rotation.y,
      transform.rotation.z,
      transform.rotation.w
    );
    const euler = new Euler().setFromQuaternion(quat, "ZYX");
    return {
      position: [pos.x, pos.z, pos.y], // ROS to Three.js coords
      rotation: [euler.x, euler.y, euler.z],
    };
  }
  onMount(() => {
    // const ros = connectToROS("ws://192.168.64.2:9090");18.222.63.241

    let mapToOdom: any = null;
    let odomToBase: any = null;
    if ($rosConnection) {
      const tfListener = subscribeToTF($rosConnection, (msg) => {
        for (const t of msg.transforms) {
          if (t.header.frame_id === "map" && t.child_frame_id === "odom") {
            mapToOdom = t.transform;
          } else if (
            t.header.frame_id === "odom" &&
            (t.child_frame_id === "base_footprint" ||
              t.child_frame_id === "base_link")
          ) {
            odomToBase = t.transform;
          } else if (
            t.header.frame_id === "base_link" &&
            t.child_frame_id === "wheel_left_link" // or actual TF frame name for left wheel
          ) {
            leftWheelTransform = t.transform;
            const leftPose = convertTransformToPose(leftWheelTransform);
            leftWheelPosition = leftPose.position;
            leftWheelRotation = leftPose.rotation;
          } else if (
            t.header.frame_id === "base_link" &&
            t.child_frame_id === "wheel_right_link" // or actual TF frame name for right wheel
          ) {
            rightWheelTransform = t.transform;
            const rightPose = convertTransformToPose(rightWheelTransform);
            rightWheelPosition = rightPose.position;
            rightWheelRotation = rightPose.rotation;
          }
        }

        if (mapToOdom && odomToBase) {
          // Compose translation
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

          const fullQuat = mapQuat.clone().multiply(odomQuat);
          const rotatedOdomPos = odomPos.clone().applyQuaternion(mapQuat);
          const mapToBasePos = mapPos.clone().add(rotatedOdomPos);

          // Convert ROS coords -> Three.js coords
          robotPosition = [
            mapToBasePos.x, // ROS X → Three.js X
            mapToBasePos.z, // ROS Z → Three.js Y
            -mapToBasePos.y, // ROS Y → Three.js Z
          ];

          // Get yaw from quaternion
          const euler = new Euler().setFromQuaternion(fullQuat, "ZYX");
          yaw = euler.z;
        }
      });

      return () => tfListener.unsubscribe();
    }
  });
</script>

<T.Group position={robotPosition} rotation={[0, yaw, 0]}>
  <!-- Robot Heading Indicator -->
  <T.Mesh position={[0.2, 0.13, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
    <T.CircleGeometry args={[0.1, 0, 0, Math.PI * 2]} />
    <T.MeshStandardMaterial
      color="blue"
      transparent={true}
      opacity={0.5}
      side={2}
      emissive="blue"
      emissiveIntensity={28}
    />
  </T.Mesh>
  <!-- Robot body -->
  <T.Mesh position={[0, 0.13, 0]} castShadow receiveShadow>
    <T.CylinderGeometry args={[0.13, 0.13, 0.2, 32]} />
    <T.MeshStandardMaterial color="#aaaaaa" />
  </T.Mesh>

  <!-- Left wheel -->
  <T.Mesh position={leftWheelPosition} rotation={leftWheelRotation} castShadow>
    <T.CylinderGeometry args={[0.09, 0.09, 0.03, 8]} />
    <T.MeshStandardMaterial color="#666666" />
  </T.Mesh>

  <!-- Right wheel -->
  <T.Mesh
    position={rightWheelPosition}
    rotation={rightWheelRotation}
    castShadow
  >
    <T.CylinderGeometry args={[0.09, 0.09, 0.03, 10]} />
    <T.MeshStandardMaterial color="#666666" />
  </T.Mesh>
</T.Group>
