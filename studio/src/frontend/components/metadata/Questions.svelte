<script lang="ts">
  import type { Metadata } from '../../types/metadata';

  export let metadata: Metadata;
  export let questions: string[];

  function answer(question: string) {
    metadata = { type: 'question', text: question };
    questions = questions.filter((val) => val !== question);
  }
</script>

<div class="w-full space-y-9">
  <!-- svelte-ignore missing-declaration -->
  {#each questions as question}
    <div class="w-full flex justify-between items-center">
      <p>{question}</p>

      <button
        class="bg-green-500 py-2 px-3 rounded-md text-lg font-semibold whitespace-nowrap ml-5"
        on:click="{() => answer(question)}">Answer Live</button
      >
    </div>
  {/each}
</div>
