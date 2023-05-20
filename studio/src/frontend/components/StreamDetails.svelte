<script lang="ts">
  export let watchers = 0;
  export let startStream: () => void;
  export let endStream: () => void;

  let streaming = false;
  let button: HTMLButtonElement;
  let minutes = 0;
  let seconds = 0;
  let interval;

  function toggleStream() {
    button.blur();

    if (!streaming) {
      startStream();
      streaming = true;
      interval = setInterval(timer, 1000);
    } else {
      endStream();
      streaming = false;
      clearInterval(interval);
      minutes = 0;
      seconds = 0;
    }
  }

  function timer() {
    seconds += 1;
    if (seconds === 60) {
      minutes += 1;
      seconds = 0;
    }
  }
</script>

<section class="grid grid-cols-2">
  <div class="flex flex-col justify-center items-center">
    {#if streaming}
      <h2 class="mb-5 text-2xl font-semibold">
        {`${minutes < 10 ? `0${minutes}` : minutes}:${seconds < 10 ? `0${seconds}` : seconds}`}
      </h2>
    {/if}

    <div class="flex items-center">
      <svg width="30" height="30">
        <circle cx="10" cy="15" r="10" fill="{streaming ? '#EF4444' : 'gray'}"></circle>
      </svg>

      <p class="font-medium">{streaming ? 'ONLINE' : 'OFFLINE'}</p>
    </div>

    <button
      class="{`block border-none  rounded-md py-2 px-3 text-lg font-semibold mt-5 ${
        streaming ? 'bg-red-500' : 'bg-green-500'
      } ${streaming ? 'hover:bg-red-400' : 'hover:bg-green-400'} focus:outline-none`}"
      on:click="{toggleStream}"
      bind:this="{button}">{streaming ? 'End Stream' : 'Start Stream'}</button
    >
  </div>
  <div class="flex items-center justify-center">
    <div class="bg-blue-500 w-96 h-52 rounded-2xl flex flex-col items-center justify-center">
      <h2 class="text-2xl font-bold">Current Watchers:</h2>
      <!-- svelte-ignore missing-declaration -->
      <p class="text-3xl font-semibold mt-3">{watchers}</p>
    </div>
  </div>
</section>
