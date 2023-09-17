<script setup>
  import { ref, watch } from 'vue';
  import * as Tone from 'tone';
  import factory from '../pieces/factory';

  const props = defineProps(['piece', 'started'])
  const playing = ref(false);

  let end, deactivate;

  const play = async () => {
    playing.value = true;
    [end, deactivate] = await factory(props.piece);
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
  <hr>
</template>

<style scoped>
</style>
