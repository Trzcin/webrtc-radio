<script lang="ts">
  import Spotify from './metadata/Spotify.svelte';
  import Custom from './metadata/Custom.svelte';
  import Questions from './metadata/Questions.svelte';
  import type { Metadata } from '../types/metadata';

  type Tab = 'Spotify Song' | 'Custom Metadata' | 'Questions';

  export let metadata: Metadata;
  export let spotifyToken: string;
  export let questions: string[];

  let currentTab: Tab = 'Spotify Song';
</script>

<section class="flex flex-col items-center w-full mt-5 ">
  <h1 class="text-xl font-bold">Current Metadata</h1>
  {#if metadata}
    {#if metadata.type === 'custom'}
      {#if metadata.img}
        <img src="{metadata.img}" alt="metadata" class="w-72 h-auto block mt-7" />
      {/if}

      <h2 class="mt-5 text-lg font-semibold">{metadata.text}</h2>
    {:else if metadata.type === 'question'}
      <h1 class="text-lg">Question from listener:</h1>
      <h2 class="mt-5 text-lg font-semibold">{metadata.text}</h2>
    {:else}
      <img src="{metadata.imgXl}" alt="song" class="mt-7 block" />
      <h2 class="mt-5 text-lg font-semibold">{metadata.title}</h2>
      <h3 class="mt-5 text-lg">{metadata.artist}</h3>
    {/if}
  {:else}
    <img src="./img/music.jpg" alt="metadata" class="w-72 h-auto block mt-7" />
    <h2 class="mt-5 text-lg font-semibold">WebRTC Radio</h2>
  {/if}

  <div class="mt-10 w-full grid grid-cols-3">
    <button
      class="tab-btn"
      class:bg-gray-900="{currentTab == 'Spotify Song'}"
      class:border-b-4="{currentTab == 'Spotify Song'}"
      class:border-solid="{currentTab == 'Spotify Song'}"
      class:border-green-500="{currentTab == 'Spotify Song'}"
      on:click="{() => (currentTab = 'Spotify Song')}">Spotify Song</button
    >
    <button
      class="tab-btn"
      class:bg-gray-900="{currentTab == 'Custom Metadata'}"
      class:border-b-4="{currentTab == 'Custom Metadata'}"
      class:border-solid="{currentTab == 'Custom Metadata'}"
      class:border-green-500="{currentTab == 'Custom Metadata'}"
      on:click="{() => (currentTab = 'Custom Metadata')}">Custom Metadata</button
    >
    <button
      class="tab-btn"
      class:bg-gray-900="{currentTab == 'Questions'}"
      class:border-b-4="{currentTab == 'Questions'}"
      class:border-solid="{currentTab == 'Questions'}"
      class:border-green-500="{currentTab == 'Questions'}"
      on:click="{() => (currentTab = 'Questions')}">Questions</button
    >
  </div>

  <div class="bg-gray-900 py-10 w-full px-10 flex-grow">
    {#if currentTab === 'Spotify Song'}
      <!-- svelte-ignore -->
      <Spotify bind:metadata bind:spotifyToken />
    {:else if currentTab === 'Custom Metadata'}
      <!-- svelte-ignore missing-declaration -->
      <Custom bind:metadata />
    {:else}
      <!-- svelte-ignore missing-declaration -->
      <Questions bind:metadata bind:questions />
    {/if}
  </div>
</section>
