<script setup>
  import { ref, defineProps, watch } from 'vue';
  import * as Tone from 'tone';
  import piece from '../pieces/piece';

  const props = defineProps(['piece', 'started'])
  const playing = ref(false);

  let end, deactivate;

  const play = async () => {
    playing.value = true;
    [end, deactivate] = await piece(props.piece);
  };

  const stop = () => {
    playing.value = false;
    if (end) {
      end();
    }
    if (deactivate) {
      deactivate();
    }
  };

  watch(
    () => props.started,
    (started) => {
      if (!started) {
        stop();
      }
    }
  );
</script>

<template>
  <button v-on:click="play" v-if="!playing">Play</button>
  <button v-on:click="stop" v-else>Stop</button>
</template>

<style scoped>
</style>
