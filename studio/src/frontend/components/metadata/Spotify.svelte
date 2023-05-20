<script lang="ts">
  import type { Metadata } from '../../types/metadata';
  import type { Song } from '../../types/song';
  import { searchSpotify } from '../../utils/searchSpotify';

  export let metadata: Metadata;
  export let spotifyToken: string;

  let querry = '';
  let songs: Song[] = [];

  async function search() {
    if (!spotifyToken) return;
    if (!querry) {
      songs = [];
      return;
    }

    songs = await searchSpotify(querry, spotifyToken);
  }

  function selectSong(song: Song) {
    metadata = { type: 'song', ...song };
  }
</script>

<div class="relative rounded-md shadow-sm">
  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
    <img src="./icons/spotify.png" alt="spotify" class="w-8 h-auto" />
  </div>

  <form on:submit|preventDefault="{search}">
    <input
      type="text"
      class="bg-gray-800 border-none block w-full rounded-md py-4 pl-14 text-lg focus:outline-none focus:ring-1 focus:ring-green-400"
      placeholder="Search Spotify..."
      spellcheck="false"
      bind:value="{querry}"
    />
  </form>
</div>

<div class="w-full mt-10">
  {#each songs as song}
    <button
      class="border-none w-full flex items-center bg-gray-900 text-left focus:outline-none hover:bg-gray-800 p-3 rounded-md"
      on:click="{() => selectSong(song)}"
    >
      <img src="{song.imgSm}" alt="song" class="w-16 h-auto" />
      <p class="ml-5"><span class="block text-lg font-semibold">{song.title}</span> {song.artist}</p>
    </button>
  {/each}
</div>
