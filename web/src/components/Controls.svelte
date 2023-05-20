<script lang="ts">
  import type { Metadata } from '../types/metadata';

  export let toggleStream: () => void;
  export let isLive: boolean = false;
  export let audio: HTMLAudioElement;

  export let metadata: Metadata;
  export let isSongSaved: boolean;
  export let spotifyToken: string;
  export let saveSong: () => void;

  function spotifyStuff() {
    if (spotifyToken && (!metadata || metadata.type !== 'song')) return;

    saveSong();
  }
</script>

<div class="flex space-x-3 mt-3">
  <button
    class="bg-gray-800 border-none focus:outline-none"
    on:click={toggleStream}
  >
    {#if !isLive}
      <img src="./icons/play_disabled.svg" alt="play" class="w-10 h-auto" />
    {:else if audio.paused}
      <img src="./icons/play.svg" alt="play" class="w-10 h-auto" />
    {:else}
      <img src="./icons/pause.svg" alt="pause" class="w-10 h-auto" />
    {/if}
  </button>

  <button
    class="bg-gray-800 border-none focus:outline-none"
    on:click={spotifyStuff}
  >
    {#if metadata && metadata.type === 'song' && spotifyToken}
      {#if isSongSaved}
        <img
          src="./icons/spotify_favourite.svg"
          alt="spotify"
          class="w-10 h-auto"
        />
      {:else}
        <img src="./icons/spotify.svg" alt="spotify" class="w-10 h-auto" />
      {/if}
    {:else}
      <img
        src="./icons/spotify_disabled.svg"
        alt="spotify"
        class="w-10 h-auto"
      />
    {/if}
  </button>
</div>
