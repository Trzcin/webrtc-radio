<script lang="ts">
  import type { Metadata } from '../../types/metadata';

  export let metadata: Metadata;

  let text = '';
  let img = '';

  function pushCustomMetadata() {
    metadata = { type: 'custom', text, img };
  }
</script>

<form on:submit|preventDefault="{pushCustomMetadata}">
  <input
    type="text"
    placeholder="Type Some Text..."
    class="w-full text-lg bg-gray-800 focus:outline-none focus:ring-1 focus:ring-green-400 border-none rounded-md"
    spellcheck="false"
    bind:value="{text}"
  />

  <input
    type="text"
    placeholder="Image Url..."
    class="w-full text-lg bg-gray-800 focus:outline-none focus:ring-1 focus:ring-green-400 border-none rounded-md mt-5"
    spellcheck="false"
    bind:value="{img}"
  />

  <button type="submit" class="mt-5 bg-green-500 px-3 py-2 text-lg font-semibold rounded-md hover:bg-green-400"
    >Set Custom Metadata</button
  >
</form>
