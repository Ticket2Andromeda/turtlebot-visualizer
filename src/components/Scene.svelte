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
  import { activeCamera } from "../lib/stores/activeCamera";
  import OccupancyGrid from "./OccupancyGrid.svelte";
  import PointCloud from "./PointCloud.svelte";
  import Robot from "./Robot.svelte";

  interactivity(); // enables onpointerenter/onpointerleave
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
  // requestAnimationFrame(() => {
  //   controls.saveState();
  // });

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
      intensity={1}
      luminanceThreshold={0.9}
      luminanceSmoothing={0.025}
      height={480}
    />
  </EffectComposer>

  <Grid type="polar" color="#c5bfbf" backgroundColor="#c5bfbf" />
  <T.DirectionalLight
    position={[
      20 * Math.cos((7 * Math.PI) / 8),
      35,
      20 * Math.cos((7 * Math.PI) / 8),
    ]}
    castShadow
  />
  <!-- <EffectComposer> -->
  <!-- <DepthOfFieldEffect
      focusDistance={0}
      focalLength={0.02}
      bokehScale={2}
      height={480}
    /> -->
  <!-- <BloomEffect
      intensity={1}
      luminanceThreshold={0.9}
      luminanceSmoothing={0.025}
      height={480}
    /> -->
  <!-- <SSAOEffect /> -->
  <!-- <VignetteEffect eskil={false} offset={0.1} darkness={1.1} /> -->
  <!-- </EffectComposer> -->

  <!-- <Suspense>
    <Environment
      url="https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/rogland_clear_night_1k.hdr"
    />
  </Suspense> -->
  <Robot bind:robotPosition bind:yaw />
  <PointCloud />
  <OccupancyGrid />
  <!-- Ground -->
  <T.Mesh rotation.x={-pi / 2} receiveShadow>
    <T.CircleGeometry args={[4, 40]} />
    <T.MeshStandardMaterial color="grey" />
  </T.Mesh>
</T.Scene>
// [15, 20, 15] original

<!-- Camera -->
<!-- <T.PerspectiveCamera
    makeDefault
    position={[
      (15 / 3) * Math.cos((7 * Math.PI) / 8),
      20 / 3,
      (15 / 3) * Math.sin((7 * Math.PI) / 8),
    ]}
    oncreate={(ref) => ref.lookAt(0, 0, 0)}
  > -->
<!-- Orbit Controls -->
<!-- <OrbitControls
      minDistance={2}
      maxDistance={12}
      zoomSpeed={5}
      zoomToCursor={true}
    />
  </T.PerspectiveCamera> -->
