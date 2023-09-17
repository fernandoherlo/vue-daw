<script setup>
  import { ref } from 'vue';
  import * as Tone from 'tone';
  import { logger } from './utils';
  import Piece from './components/Piece.vue';

  const started = ref(false);

  window.generativeMusic = {
    rng: () => Math.random()
  };

const start = async () => {
  await Tone.start();
  Tone.Transport.start();

  started.value = true;
  logger.log('audio is ready');
}

const stop = async () => {
  Tone.Transport.stop();

  started.value = false;
  logger.log('stop audio');
}
</script>

<template>
  <div v-show="started">
    <button v-on:click="stop">Stop transport</button>
    <piece :piece="'enough'" :started="started"></piece>
    <piece :piece="'eno-machine'" :started="started"></piece>
  </div>
  <div v-show="!started">
    <button v-on:click="start">Start</button>
  </div>
</template>

<style scoped>
</style>
