<script setup>
  import { ref, watch } from 'vue';
  import factory from '../pieces/factory';

  const props = defineProps({
    started: Boolean,
    piece: {
      type: String,
      default: ''
    }
  });
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
  <button
    v-if="!playing"
    @click="play"
  >
    Play
  </button>
  <button
    v-else
    @click="stop"
  >
    Stop
  </button>
  <hr>
</template>

<style scoped>
</style>
