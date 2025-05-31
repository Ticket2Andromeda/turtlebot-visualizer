<script lang="ts">
  export let onClick: () => void;
</script>

<button class="reset-button" on:click={onClick}> Reset Camera </button>

<style>
  .reset-button {
    position: fixed;
    top: 10px;
    left: 10px;
    z-index: 10;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    border: none;
    padding: 0.5em 0.8em;
    border-radius: 4px;
    cursor: pointer;
  }

  .reset-button:hover {
    background: rgba(255, 255, 255, 0.2);
  }
</style>
