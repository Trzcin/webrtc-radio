<script lang="ts">
  import { onMount } from 'svelte';

  export let sendQuestion: (arg0: string) => void;

  let question = '';
  let asking = false;

  function ask() {
    asking = true;
  }

  function handleSendQuestion() {
    sendQuestion(question);
    question = '';
    asking = false;
  }
</script>

<section class="mt-10">
  {#if asking}
    <form style="width: 100%;" on:submit|preventDefault={handleSendQuestion}>
      <!-- svelte-ignore a11y-autofocus -->
      <input
        type="text"
        bind:value={question}
        on:blur={() => (asking = false)}
        class="py-2 px-3 text-lg rounded-md bg-gray-700 border-none focus:outline-none w-80"
        placeholder="Ask a question..."
        autofocus
      />
    </form>
  {:else}
    <button
      on:click={ask}
      class="bg-green-500 px-5 hover:bg-green-400 py-2 rounded-md font-semibold focus:outline-none"
      >Ask a Question</button
    >
  {/if}
</section>
