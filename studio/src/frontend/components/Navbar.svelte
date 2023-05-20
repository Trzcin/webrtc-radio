<script lang="ts">
  import { clickOutside } from '../utils/clickOutside';

  export let port: number;

  let showSettings = false;

  function minimize() {
    //@ts-ignore
    window.ipc.send('window', 'minimize');
  }

  function maximize() {
    //@ts-ignore
    window.ipc.send('window', 'maximize');
  }

  function close() {
    //@ts-ignore
    window.ipc.send('window', 'close');
  }
</script>

<nav class="app-bar w-screen bg-gray-900 flex items-center sticky top-0">
  <div class="flex flex-1 justify-start items-center mr-auto">
    <button class="app-btn" on:click="{() => (showSettings = !showSettings)}">
      <img src="./icons/settings.svg" alt="settings-icon" />
    </button>

    {#if showSettings}
      <div
        class="absolute left-0 bg-gray-900 py-5 px-6"
        style="top: 50px;"
        use:clickOutside
        on:click_outside="{() => (showSettings = false)}"
      >
        <p class="font-semibold">Server port</p>
        <input
          type="text"
          placeholder="3000"
          class="w-full text-lg bg-gray-800 focus:outline-none focus:ring-1 focus:ring-green-400 border-none rounded-md mt-3"
          bind:value="{port}"
        />
      </div>
    {/if}
  </div>

  <h1 class="title flex flex-1 justify-center items-center text-lg font-semibold">WebRTC Radio Studio</h1>

  <div class="flex flex-1 items-center justify-end ml-auto">
    <button class="app-btn" on:click="{minimize}">
      <img src="./icons/minimize.svg" alt="minimize" class="w-5 h-auto" />
    </button>

    <button class="app-btn" on:click="{maximize}">
      <img src="./icons/maximize.svg" alt="maximize" class="w-5 h-auto" />
    </button>

    <button class="app-btn" on:click="{close}">
      <img src="./icons/close.svg" alt="close" class="w-5 h-auto" />
    </button>
  </div>
</nav>
