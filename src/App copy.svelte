<script lang="ts">
  import { Canvas } from "@threlte/core";
  import type CC from "camera-controls";
  import { Modal } from "flowbite-svelte";
  import { Button, Pane } from "svelte-tweakpane-ui";
  import CameraSensor from "./components/CameraSensor.svelte";
  import Scene from "./components/Scene.svelte";
  import TeleopController from "./components/TeleopController.svelte";
  import { connectToROS } from "./lib/ros/connection";
  import { initTeleop } from "./lib/ros/teleop";
  import { activeCamera } from "./lib/stores/activeCamera";
  let defaultModal = true;
  // Initialize once on load
  let ros = connectToROS();
  initTeleop(ros);

  let controls = $state<CC>();

  let scrollingModal = $state(true);

  let connected = false;

  let enabled = $state(true);
  $effect(() => {
    if (controls !== undefined) {
      controls.enabled = enabled;
      console.log("controls enabled");
    }
  });
</script>

{#if !connected}
  <Modal title="Terms of Service" bind:open={defaultModal} autoclose>
    <p class="text-base leading-relaxed text-gray-500 dark:text-gray-400">
      With less than a month to go before the European Union enacts new consumer
      privacy laws for its citizens, companies around the world are updating
      their terms of service agreements to comply.
    </p>
    <p class="text-base leading-relaxed text-gray-500 dark:text-gray-400">
      The European Union’s General Data Protection Regulation (G.D.P.R.) goes
      into effect on May 25 and is meant to ensure a common set of data rights
      in the European Union. It requires organizations to notify users as soon
      as possible of high-risk data breaches that could personally affect them.
    </p>

    {#snippet footer()}
      <Button onclick={() => alert('Handle "success"')}>I accept</Button>
      <Button color="alternative">Decline</Button>
    {/snippet}
  </Modal>
{:else}
  <Pane title="Camera Controls" position="fixed">
    <!-- <Button
    title="Reset"
    on:click={() => {
      activeCamera.set("scene");
      controls?.reset(true);
    }}
  />
  <Button -->
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

  {#if $activeCamera === "sensor"}
    <CameraSensor />
  {:else}
    <div class="canvas-wrapper">
      <Canvas>
        <Scene bind:controls />
      </Canvas>
    </div>
  {/if}

  <!-- <div class="canvas-wrapper">
  <Canvas>
    <Scene bind:controls />
  </Canvas>
</div> -->

  <!-- Invisible keyboard listener -->
  <TeleopController />
{/if}

<style>
  html,
  body,
  :global(body) {
    background-color: #1a1a1a;
  }

  #app {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  :global(canvas) {
    display: block;
  }

  .canvas-wrapper {
    position: fixed;
    inset: 0;
  }

  .ui-overlay {
    position: absolute;
    top: 1rem;
    left: 1rem;
    background: rgba(179, 31, 31, 0.7);
    padding: 1rem;
    border-radius: 0.5rem;
    color: white;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    z-index: 1;
  }

  .ui-overlay button {
    background: #1e90ff;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 0.25rem;
    color: white;
    cursor: pointer;
  }

  .ui-overlay button:hover {
    background: #0d75d8;
  }
</style>
