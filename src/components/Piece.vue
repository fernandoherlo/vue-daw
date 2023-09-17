<script setup>
  import { ref, defineProps } from 'vue';
  import * as Tone from 'tone';
  import piece from '../pieces/piece';

  const props = defineProps(['piece'])
  const playing = ref(false);

  let end, deactivate;

  const play = async () => {
    playing.value = true;
    [end, deactivate] = await piece(props.piece);
  };

  const stop = () => {
    playing.value = false;
    end();
    deactivate();
  };
</script>

<template>
  <button v-on:click="play" v-if="!playing">Play</button>
  <button v-on:click="stop" v-else>Stop</button>
</template>

<style scoped>
</style>
