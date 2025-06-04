<script lang="ts">
  import { T, useTask, useThrelte } from "@threlte/core";
  import { Grid, interactivity } from "@threlte/extras";
  // Environment, Suspense
  import type CC from "camera-controls";
  import { onMount, tick } from "svelte";
  import { PerspectiveCamera, Vector3 } from "three";
  import { EffectComposer } from "threlte-postprocessing";
  import { BloomEffect } from "threlte-postprocessing/effects";
  import CameraControls from "../lib/cameraControls";
  import { appPalette } from "../lib/colors";
  import { activeCamera } from "../lib/stores/activeCamera";
  import OccupancyGrid from "./OccupancyGrid.svelte";
  import PointCloud from "./PointCloud.svelte";
  import Robot from "./Robot.svelte";

  interactivity();
  let robotPosition = $state<[number, number, number]>([0, 0, 0]);
  let yaw = $state<number>(0);

  const { dom, invalidate, renderer, scene } = useThrelte();
  let {
    controls = $bindable(),
  }: {
    controls: CC | undefined;
  } = $props();
  let sceneReady = $state(false);
  const camera = new PerspectiveCamera();
  controls = new CameraControls(dom, camera);
  const pi = Math.PI;
  let rotation = 0;

  $effect(() => {
    return () => {
      controls.dispose();
    };
  });

  controls.setPosition(
    (15 / 3) * Math.cos((7 * Math.PI) / 8),
    20 / 3,
    (15 / 3) * Math.sin((7 * Math.PI) / 8)
  );
  controls.minDistance = 1;
  controls.maxDistance = 12;
  controls.dollySpeed = 1;
  controls.maxPolarAngle = Math.PI / 2;

  useTask((delta) => {
    if (controls.update(delta)) {
      invalidate();
    }

    const distanceBehind = 1;
    const heightAbove = 1;
    rotation += delta;
    if ($activeCamera === "robot" && robotPosition) {
      // Target the robot from above or behind
      const [x, y, z] = robotPosition;
      const offset = new Vector3(0, 0, -distanceBehind * 1)
        .applyAxisAngle(new Vector3(0, 1, 0), yaw + Math.PI / 2)
        .add(new Vector3(0, heightAbove, 0)); // behind based on yaw
      const target = new Vector3(x, y, z);
      const cameraPos = target.clone().add(offset);

      controls.setLookAt(
        cameraPos.x,
        cameraPos.y,
        cameraPos.z,
        target.x,
        target.y + 0.5,
        target.z,
        true // enable smooth transition
      );
    }
  });

  onMount(async () => {
    await tick();
    controls.saveState();
    sceneReady = true;
  });
</script>

<T.Scene>
  <T is={camera} makeDefault />

  <T.Color attach="background" args={["#1a1a1a"]} />

  <EffectComposer>
    <BloomEffect
      intensity={0.1}
      luminanceThreshold={0.1}
      luminanceSmoothing={0.025}
      height={10}
    />
  </EffectComposer>
  <Grid
    type="polar"
    sectionColor={appPalette.gridLines}
    cellColor={appPalette.gridLines}
    backgroundColor={appPalette.background}
    backgroundOpacity={0.75}
    infiniteGrid={true}
    fadeDistance={200}
    fadeStrength={20}
  />

  <T.DirectionalLight
    position={[
      20 * Math.cos((7 * Math.PI) / 8),
      35,
      20 * Math.cos((7 * Math.PI) / 8),
    ]}
    castShadow
  />

  <Robot bind:robotPosition bind:yaw />
  <PointCloud />
  <OccupancyGrid />
  <!-- Ground -->
  <T.Mesh position.y={-0.01} rotation.x={-pi / 2} receiveShadow>
    <T.CircleGeometry args={[4, 40]} />
    <T.MeshStandardMaterial color="grey" />
  </T.Mesh>
</T.Scene>
