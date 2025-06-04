<script lang="ts">
  import { Canvas } from "@threlte/core";
  import type CC from "camera-controls";

  import { Button as FbButton, Modal, Progressbar } from "flowbite-svelte";
  import { onMount } from "svelte";
  import { Button, Element, Pane, Separator } from "svelte-tweakpane-ui";
  import CameraSensor from "./components/CameraSensor.svelte";
  import Scene from "./components/Scene.svelte";
  import TeleopController from "./components/TeleopController.svelte";
  import { establishConnection, spawnTurtlebot } from "./lib/ros/connection";
  import { activeCamera } from "./lib/stores/activeCamera";
  import {
    remainingSessionTime,
    rosConnection,
    turtlebotSpawnStatus as turtlebotStatus,
  } from "./lib/stores/connectionStore";

  let controls = $state<CC>();
  let enabled = $state(true);

  let turtlebotSpawnProgress = $state(0);
  let estimatedTime = $state(600);
  let estimatedRemainingTime = $state(0);
  let currentTime: number;
  let remainingTime: number;
  let timerInterval: any;

  let remainingSessionTimeString = $state<string>("10:00");
  let remainingSessionTimeInterval: any;

  let isModalVisible = $state(false);
  let modalStep = $state(1);

  const modalSteps = [
    {
      title: `Session Ended`,
      content: [
        `Thank you for exploring this ROS turtlebot demonstration!`,
        `To run another simulation or return to the start page, click 'Return' below.`,
      ],
    },
    {
      title: "Get started",
      content: [
        `This application demonstrates real-time robotic mapping and visualization using SLAM techniques as the robot explores the world.`,
        `To begin, click 'Spawn Turtlebot'. This will launch a simulated Turtlebot instance in Gazebo which will take up to 2 minutes to fully initialize and to begin publishing data.`,
        `Once spawned, you can control the robot and watch as it builds its world through an occupancy map.`,
      ],
    },
    {
      title: "About Project",
      content: [
        `This application showcases the integration of “Robot Operating System” (ROS) for robot control and internal data relay, WebSockets for peer-to-peer communication enabling real-time teleoperation of the turtlebot, and finally 3D rendering utilizing Threlte.js, Three.js and Svelte.`,
        `Explore a real-time visualization of “Simultaneous Localization and Mapping” (SLAM), a technique robots use to build an occupancy grid of its environment.`,
        `SLAM works by using lidar data that is processed as a “point cloud”, which is then used by the robot to dynamically construct the world around it, as well as the robot’s position in it. `,
        `In this visualization you’ll notice green structures which represent the dynamically generated occupancy map. As the robot moves you’ll see the blue point-clouds representing lidar scans, helping the robot discern between obstacles and free space.`,
      ],
    },
    {
      title: "Controls",
      content: [
        `Control the robot using WASD or arrow keys on your keyboard for directional movement.`,
        `Adjust your perspective using the 'Camera Controls' panel in the top right to explore the scene. <strong>Scene</strong> will show the full map. <strong>Follow</strong> to view the robot in a third person angle. <strong>Camera</strong> to view from the turtlebot’s camera sensor`,
      ],
    },
  ];

  $effect(() => {
    if (controls !== undefined) {
      controls.enabled = enabled;
      console.log("controls enabled");
    }
  });
  $effect(() => {
    if ($turtlebotStatus === "terminated") {
      modalStep = 0;
      isModalVisible = true;
    }
  });

  onMount(() => {
    isModalVisible = true;
  });

  function startProgressBarTimer(durationInSeconds: number) {
    estimatedTime = durationInSeconds;
    currentTime = Date.now();

    if (timerInterval) clearInterval(timerInterval);

    timerInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - currentTime) / 1000);

      remainingTime = Math.max(estimatedTime - elapsed, 0);
      estimatedRemainingTime = Math.floor(remainingTime / 60);
      turtlebotSpawnProgress = Math.round(100 * (elapsed / durationInSeconds));

      if (remainingTime === 0 || $rosConnection !== null) {
        turtlebotSpawnProgress = 100;
        clearInterval(timerInterval);
      }
    }, 1000);
  }

  function startSessionTimer() {
    const ttl = localStorage.getItem("uuidTTL");
    let timeRemaining = 0;
    if (ttl) {
      timeRemaining = new Date(ttl).getTime() - Date.now();
      remainingSessionTime.set(timeRemaining > 0 ? timeRemaining : 0);
    }

    remainingSessionTimeInterval = setInterval(() => {
      timeRemaining -= 1000;
      timeRemaining = Math.max(timeRemaining, 0);
      remainingSessionTime.set(timeRemaining);
      const minutes = Math.floor(timeRemaining / 60000);
      const seconds = Math.floor((timeRemaining / 1000) % 60);
      if (seconds >= 10) {
        remainingSessionTimeString = `${minutes}:${seconds}`;
      } else {
        remainingSessionTimeString = `${minutes}:0${seconds}`;
      }
      if (timeRemaining <= 0 || $turtlebotStatus === "terminated") {
        clearInterval(remainingSessionTimeInterval);
      }
    }, 1000);
  }
</script>

<Modal
  title={modalSteps[modalStep].title}
  bind:open={isModalVisible}
  outsideclose={false}
  dismissable={false}
  size="lg"
>
  {#each modalSteps[modalStep].content as paragraph}
    <p class="text-base leading-relaxed text-gray-500 dark:text-gray-400">
      {@html paragraph}
    </p>
  {/each}

  {#snippet footer()}
    {#if modalStep === 0}
      <FbButton
        color="blue"
        onclick={() => {
          modalStep++;
          $turtlebotStatus = "notStarted";
        }}>Return</FbButton
      >
    {:else if modalStep === 1}
      {#if $turtlebotStatus === "notStarted"}
        <FbButton
          color="green"
          onclick={async () => {
            $turtlebotStatus = "inProgress";
            startProgressBarTimer(160);

            try {
              await spawnTurtlebot();
              establishConnection();
            } catch (e) {
              console.error("Turtlebot spawn or DNS resolution failed:", e);
              $turtlebotStatus = "notStarted";
            }
          }}>Spawn Turtlebot</FbButton
        >
      {:else if $turtlebotStatus === "complete"}
        <FbButton
          color="green"
          disabled={$turtlebotStatus !== "complete"}
          onclick={() => {
            isModalVisible = false;
            startSessionTimer();
            turtlebotSpawnProgress = 0;
          }}>Start!</FbButton
        >
      {/if}
      <FbButton color="blue" onclick={() => modalStep++}>Next</FbButton>
      {#if $turtlebotStatus !== "notStarted"}
        <div class="w-full max-w-full block">
          <Progressbar
            progress={turtlebotSpawnProgress}
            color={$turtlebotStatus === "complete" ? "green" : "blue"}
            labelOutside={$turtlebotStatus === "complete"
              ? "Robot is ready!"
              : `Estimated time ${estimatedRemainingTime} minute(s)`}
          ></Progressbar>
        </div>
      {/if}
    {:else if modalStep === 2}
      <FbButton color="gray" onclick={() => modalStep--}>Back</FbButton>
      <FbButton color="blue" onclick={() => modalStep++}>Next</FbButton>
      <div class="w-full max-w-full block">
        {#if $turtlebotStatus !== "notStarted"}
          <Progressbar
            progress={turtlebotSpawnProgress}
            color={$turtlebotStatus === "complete" ? "green" : "blue"}
            labelOutside={$turtlebotStatus === "complete"
              ? "Robot is ready!"
              : `Estimated time ${estimatedRemainingTime} minutes`}
          ></Progressbar>
        {/if}
      </div>
    {:else}
      <FbButton color="gray" onclick={() => modalStep--}>Back</FbButton>
      <FbButton
        color="green"
        disabled={$turtlebotStatus !== "complete"}
        onclick={() => {
          isModalVisible = false;
        }}>Start!</FbButton
      >
      {#if $turtlebotStatus !== "notStarted"}
        <div class="w-full max-w-full block">
          <Progressbar
            progress={turtlebotSpawnProgress}
            color={$turtlebotStatus === "complete" ? "green" : "blue"}
            labelOutside={$turtlebotStatus === "complete"
              ? "Robot is ready!"
              : `Estimated time ${estimatedRemainingTime} minutes`}
          ></Progressbar>
        </div>
      {/if}
    {/if}
  {/snippet}
</Modal>

<Pane title="Camera Controls" position="fixed">
  <Element>
    <div style="color:white;">Estimated Time: {remainingSessionTimeString}</div>
  </Element>
  <Separator />
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

<style>
  :global(canvas) {
    display: block;
  }

  .canvas-wrapper {
    position: fixed;
    inset: 0;
  }
</style>
