<script lang="ts">
  import { onMount } from "svelte";
  import { initTeleop, sendCmdVel } from "../lib/ros/teleop";
  import { rosConnection } from "../lib/stores/connectionStore";
  if ($rosConnection) {
    initTeleop($rosConnection);
  }
  const VELOCITY_STEP = 0.26;
  const ANGULAR_STEP = 0.9;

  function handleKeydown(event: KeyboardEvent) {
    switch (event.key) {
      case "ArrowUp":
      case "w":
        sendCmdVel(VELOCITY_STEP, 0);
        break;
      case "ArrowDown":
      case "s":
        sendCmdVel(-VELOCITY_STEP, 0);
        break;
      case "ArrowLeft":
      case "a":
        sendCmdVel(0, ANGULAR_STEP);
        break;
      case "ArrowRight":
      case "d":
        sendCmdVel(0, -ANGULAR_STEP);
        break;
    }
  }

  function handleKeyup() {
    sendCmdVel(0, 0);
  }

  onMount(() => {
    window.addEventListener("keydown", handleKeydown);
    window.addEventListener("keyup", handleKeyup);
    return () => {
      window.removeEventListener("keydown", handleKeydown);
      window.removeEventListener("keyup", handleKeyup);
    };
  });
</script>
