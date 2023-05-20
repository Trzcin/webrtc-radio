<script lang="ts">
  import { onMount } from 'svelte';
  import { clickOutside } from '../utils/clickOutside';
  import { setVolume } from '../utils/setVolume';
  import { generateMediaStream } from '../utils/generateMediaStream';

  let availbableMics: MediaDeviceInfo[] = [];
  let selectedMics: MediaDeviceInfo[] = [];
  let deviceSelection: boolean = false;
  let gainNodes: { [key: string]: GainNode } = {};
  let trebleFilter: BiquadFilterNode;
  let midFilter: BiquadFilterNode;
  let bassFilter: BiquadFilterNode;

  export let stream: MediaStream;
  export let peerConnections: { [key: string]: RTCPeerConnection };

  $: {
    [stream, gainNodes, bassFilter, midFilter, trebleFilter] = generateMediaStream(
      selectedMics,
      stream,
      bassFilter,
      midFilter,
      trebleFilter,
      peerConnections
    );
  }

  onMount(async () => {
    getMics();
    navigator.mediaDevices.ondevicechange = getMics;
  });

  async function getMics() {
    availbableMics = await navigator.mediaDevices.enumerateDevices();
    availbableMics = availbableMics.filter((device) => device.kind === 'audioinput' && !selectedMics.includes(device));
  }

  function addMicInput(selectedMic: MediaDeviceInfo) {
    deviceSelection = false;
    selectedMics = [...selectedMics, selectedMic];
    availbableMics = availbableMics.filter((device) => device.deviceId !== selectedMic.deviceId);

    updateStream();
  }

  function removeMicInput(mic: MediaDeviceInfo) {
    selectedMics = selectedMics.filter((device) => device.deviceId !== mic.deviceId);
    availbableMics = [...availbableMics, mic];

    updateStream();
  }

  function updateStream() {
    [stream, gainNodes, bassFilter, midFilter, trebleFilter] = generateMediaStream(
      selectedMics,
      stream,
      bassFilter,
      midFilter,
      trebleFilter,
      peerConnections
    );
  }
</script>

<section class="px-10">
  <h1 class="text-center text-xl font-bold">Microphones</h1>

  <div class="space-y-5 w-2/3 mx-auto mt-5">
    {#each selectedMics as mic}
      <div class="flex items-center justify-between">
        <p>{mic.label}</p>

        <div class="flex items-center">
          <img src="./icons/volume.svg" alt="volume" class="ml-8" />
          <!-- svelte-ignore missing-declaration -->
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            class="ml-4 slider"
            value="1"
            on:change="{(e) => setVolume(e, mic.deviceId, gainNodes)}"
          />
        </div>

        <button
          class="p-3 bg-red-500 border-none rounded-md hover:bg-red-400 ml-8 focus:outline-none"
          on:click="{() => removeMicInput(mic)}"
        >
          <img src="./icons/delete.svg" alt="delete" />
        </button>
      </div>
    {/each}

    {#if deviceSelection}
      <!-- svelte-ignore missing-declaration -->
      <div
        class="bg-gray-900 w-full rounded-md text-lg p-5"
        use:clickOutside
        on:click_outside="{() => (deviceSelection = false)}"
      >
        {#each availbableMics as mic}
          <button
            class="bg-gray-900 hover:bg-gray-700 py-2 px-3 w-full rounded-md focus:outline-none text-left"
            on:click="{() => addMicInput(mic)}">{mic.label}</button
          >
        {/each}
      </div>
    {:else}
      <button
        class="w-full py-2 bg-gray-900 rounded-md hover:bg-gray-700 focus:outline-none text-xl font-bold"
        on:click="{() => (deviceSelection = true)}"
      >
        +
      </button>
    {/if}
  </div>

  <!-- {#if trebleFilter && midFilter && bassFilter}
      <div class="col-span-2 pl-16">
        <h1 class="text-center text-lg font-semibold">Equalizer</h1>

        <label for="treble" class="block mt-5">Treble:</label>
        <input
          type="range"
          name="treble"
          class="slider mt-3 w-60"
          min="0"
          max="2"
          step="0.1"
          bind:value="{trebleFilter.gain.value}"
        />

        <label for="mid" class="block mt-5">Mid:</label>
        <input
          type="range"
          name="mid"
          class="slider mt-3 w-60"
          min="0"
          max="2"
          step="0.1"
          bind:value="{midFilter.gain.value}"
        />

        <label for="bass" class="block mt-5">Bass:</label>
        <input
          type="range"
          name="bass"
          class="slider mt-3 w-60"
          min="0"
          max="2"
          step="0.1"
          bind:value="{bassFilter.gain.value}"
        />
      </div>
    {/if} -->
</section>
