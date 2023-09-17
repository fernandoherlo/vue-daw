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
    started.value = true;

    // Iniciar el transporte de Tone.js para que la música se reproduzca
    Tone.Transport.start();

    logger.log('audio is ready');
  }
</script>

<template>
  <div v-if="!started">
    <button v-on:click="start">Start</button>
  </div>
  <template v-else>
    <piece :piece="'enough'"></piece>
    <piece :piece="'eno-machine'"></piece>
  </template>
</template>

<style scoped>
</style>
