<script lang="ts">
  import { onMount } from "svelte";
  import { subscribeToCameraSensor } from "../lib/ros/subscriptions";
  import { rosConnection } from "../lib/stores/connectionStore";
  let cameraSensorListener: any;

  let imageSrc: any;
  let cameraReady = false;

  onMount(() => {
    if ($rosConnection) {
      cameraSensorListener = subscribeToCameraSensor(
        $rosConnection,
        (msg: any) => {
          imageSrc = `data:image/jpeg;base64,${msg.data}`;
          cameraReady = true;
        }
      );
    }
    return () => {
      cameraSensorListener.unsubscribe();
    };
  });
</script>

{#if cameraReady}
  <img src={imageSrc} alt="TurtleBot Camera" class="camera-feed" />
{:else}
  <p class="loading">Waiting for camera feed...</p>
{/if}

<style>
  .camera-feed {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    object-fit: cover;
    z-index: 0;
  }

  .loading {
    position: absolute;
    color: white;
    top: 2rem;
    left: 2rem;
    z-index: 0;
  }
</style>
