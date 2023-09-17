<script setup>
  import { ref } from 'vue';
  import * as Tone from 'tone';
  import { logger } from './utils';
  import EditorArea from './components/EditorArea.vue';

  const started = ref(false);

  window.generativeMusic = {
    rng: () => Math.random()
  };

const start = async () => {
  await Tone.start();
  Tone.Transport.start();

  started.value = true;
  logger.log('audio is ready');
};

const stop = async () => {
  Tone.Transport.stop();

  started.value = false;
  logger.log('stop audio');
};
</script>

<template>
  <div v-if="started">
    <button @click="stop">
      Stop transport
    </button>
    <editor-area :started="started" />
  </div>
  <div v-else>
    <button @click="start">
      Start
    </button>
  </div>
</template>

<style scoped>
</style>
