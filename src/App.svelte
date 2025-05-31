<script lang="ts">
  import { Canvas } from "@threlte/core";
  import type CC from "camera-controls";

  import { Button as FbButton, Modal, Progressbar } from "flowbite-svelte";
  import { onMount } from "svelte";
  import { Button, Pane } from "svelte-tweakpane-ui";
  import CameraSensor from "./components/CameraSensor.svelte";
  import Scene from "./components/Scene.svelte";
  import TeleopController from "./components/TeleopController.svelte";
  import {
    establishConnectionPlaceholder,
    spawnTurtlebot,
  } from "./lib/ros/connection";
  import { activeCamera } from "./lib/stores/activeCamera";
  import {
    rosConnection,
    turtlebotSpawnStatus,
  } from "./lib/stores/connectionStore";

  let defaultModalVisible = $state(false);
  let controls = $state<CC>();
  let enabled = $state(true);
  let turtlebotSpawnProgress = $state(0);

  // let robotConnected
  let estimatedTime = $state(600);
  let estimatedRemainingTime = $state(0);
  let currentTime: number;
  let remainingTime: number;
  let timerInterval: any;

  let step = $state(0);

  const steps = [
    {
      title: "Get started",
      content: [
        `To start an instance press "Spawn Turtlebot" below to start the application.
    This typically takes 3-5 minutes for an instance to spawn and be used with
    the app.`,
        `Turtlebot is a simulated robot using Gazebo simulation. This project demos
    controlling a robot and visualizing its world creation through its occupancy
    map using SLAM techniques as it creates lidar`,
      ],
    },
    {
      title: "About Project",
      content: [
        "This project visualizes occupancy maps using SLAM...",
        "It integrates ROS, WebSockets, and 3D rendering via Threlte...",
      ],
    },
    {
      title: "Controls",
      content: [
        "Use WASD keys or on-screen buttons to move the robot...",
        "You can view the lidar scan in the occupancy grid...",
      ],
    },
  ];

  $effect(() => {
    if (controls !== undefined) {
      controls.enabled = enabled;
      console.log("controls enabled");
    }
  });
  onMount(() => {
    defaultModalVisible = true;
  });

  function startProgressBarTimer(durationInSeconds: number) {
    estimatedTime = durationInSeconds;
    // remainingTime.set(durationInSeconds);
    currentTime = Date.now();

    if (timerInterval) clearInterval(timerInterval);

    timerInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - currentTime) / 1000);

      remainingTime = Math.max(estimatedTime - elapsed, 0);
      estimatedRemainingTime = Math.floor(remainingTime / 60);
      // console.log("estimatedTime", estimatedTime);
      // console.log("remaining", remainingTime);
      // console.log("elapsed", elapsed);
      console.log("durationInSeconds", durationInSeconds);
      turtlebotSpawnProgress = Math.round(100 * (elapsed / durationInSeconds));
      // console.log("math", turtlebotSpawnProgress);
      if (remainingTime === 0 || $rosConnection !== null) {
        turtlebotSpawnProgress = 100;
        clearInterval(timerInterval);
      }
    }, 1000);
  }
</script>

<Modal
  title={steps[step].title}
  bind:open={defaultModalVisible}
  outsideclose={false}
  dismissable={false}
  size="lg"
>
  {#each steps[step].content as paragraph}
    <p class="text-base leading-relaxed text-gray-500 dark:text-gray-400">
      {paragraph}
    </p>
  {/each}
  <!-- <p class="text-base leading-relaxed text-gray-500 dark:text-gray-400">
    To start an instance press "Spawn Turtlebot" below to start the application.
    This typically takes 3-5 minutes for an instance to spawn and be used with
    the app.
  </p>
  <p class="text-base leading-relaxed text-gray-500 dark:text-gray-400">
    Turtlebot is a simulated robot using Gazebo simulation. This project demos
    controlling a robot and visualizing its world creation through its occupancy
    map using SLAM techniques as it creates lidar
  </p> -->
  {#snippet footer()}
    {#if step === 0}
      {#if $turtlebotSpawnStatus === "notStarted"}
        <FbButton
          color="green"
          onclick={() => {
            spawnTurtlebot();
            establishConnectionPlaceholder();
            $turtlebotSpawnStatus = "inProgress";
            startProgressBarTimer(30);
          }}>Spawn Robot</FbButton
        >
      {:else if $turtlebotSpawnStatus === "complete"}
        <FbButton
          color="green"
          disabled={$turtlebotSpawnStatus !== "complete"}
          onclick={() => {
            defaultModalVisible = false;
          }}>Start!</FbButton
        >
      {/if}
      <FbButton color="blue" onclick={() => step++}>Next</FbButton>
      {#if $turtlebotSpawnStatus !== "notStarted"}
        <div class="w-full max-w-full block">
          <Progressbar
            progress={turtlebotSpawnProgress}
            color={$turtlebotSpawnStatus === "complete" ? "green" : "blue"}
            labelOutside={$turtlebotSpawnStatus === "complete"
              ? "Robot is ready!"
              : `Estimated time ${estimatedRemainingTime} minutes`}
          ></Progressbar>
        </div>
      {/if}
    {:else if step === 1}
      <FbButton color="gray" onclick={() => step--}>Back</FbButton>
      <FbButton color="blue" onclick={() => step++}>Next</FbButton>
      <div class="w-full max-w-full block">
        {#if $turtlebotSpawnStatus !== "notStarted"}
          <Progressbar
            progress={turtlebotSpawnProgress}
            color={$turtlebotSpawnStatus === "complete" ? "green" : "blue"}
            labelOutside={$turtlebotSpawnStatus === "complete"
              ? "Robot is ready!"
              : `Estimated time ${estimatedRemainingTime} minutes`}
          ></Progressbar>
        {/if}
      </div>
    {:else}
      <FbButton color="gray" onclick={() => step--}>Back</FbButton>
      <FbButton
        color="green"
        disabled={$turtlebotSpawnStatus !== "complete"}
        onclick={() => {
          defaultModalVisible = false;
        }}>Start!</FbButton
      >
      {#if $turtlebotSpawnStatus !== "notStarted"}
        <div class="w-full max-w-full block">
          <Progressbar
            progress={turtlebotSpawnProgress}
            color={$turtlebotSpawnStatus === "complete" ? "green" : "blue"}
            labelOutside={$turtlebotSpawnStatus === "complete"
              ? "Robot is ready!"
              : `Estimated time ${estimatedRemainingTime} minutes`}
          ></Progressbar>
        </div>
      {/if}
    {/if}
  {/snippet}
  <!-- {#snippet footer()}
    <FbButton
      onclick={() => {
        defaultModalVisible = false;
        console.log("Default Mode", defaultModalVisible);
      }}>Spawn Turtlebot</FbButton
    >
    <FbButton color="alternative">Decline</FbButton>
  {/snippet} -->
</Modal>

<Pane title="Camera Controls" position="fixed">
  <Button
    title="Reset"
    on:click={() => {
      activeCamera.set("scene");
      controls?.reset(true);
    }}
  />
  <Button
    title="Scene"
    on:click={() => {
      activeCamera.set("scene");
      controls?.reset(true);
    }}
  />
  <Button
    title="Follow"
    on:click={() => {
      activeCamera.set("robot");
    }}
  />
  <Button
    title="Camera"
    on:click={() => {
      activeCamera.set("sensor");
    }}
  />
</Pane>
<!-- <div class="ui-overlay">
  <button
    onclick={() => {
      activeCamera.set("scene");
      controls?.reset(true);
    }}>Reset</button
  >
  <button
    onclick={() => {
      activeCamera.set("scene");
      controls?.reset(true);
    }}>Scene</button
  >
  <button
    onclick={() => {
      activeCamera.set("robot");
    }}>Follow</button
  >
  <button
    onclick={() => {
      activeCamera.set("sensor");
    }}>Camera Sensor</button
  >
</div> -->
{#if $rosConnection !== null}
  <TeleopController />
  <div class="canvas-wrapper">
    <Canvas>
      {#if $activeCamera !== "sensor"}
        <Scene bind:controls />
      {/if}
    </Canvas>
  </div>

  {#if $activeCamera === "sensor"}
    <CameraSensor />
  {/if}
{/if}

<!-- {#if $activeCamera === "sensor"}
  <CameraSensor />
{:else}
  <div class="canvas-wrapper">
    <Canvas>
      <Scene bind:controls />
    </Canvas>
  </div>
{/if} -->

<!-- <div class="canvas-wrapper">
  <Canvas>
    <Scene bind:controls />
  </Canvas>
</div> -->

<!-- Invisible keyboard listener -->

<style>
  :global(body) {
    background-color: #1a1a1a;
  }
  /* 
  #app {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
  } */

  :global(canvas) {
    display: block;
  }

  .canvas-wrapper {
    position: fixed;
    inset: 0;
  }
</style>
