<script setup>
  import { ref, watch } from 'vue';

  const props = defineProps({
    playing: Boolean,
    total: {
      type: Number,
      default: 0
    }
  });

  let idInterval;
  const widthProgressBar = ref(0);
  const loop = ref(500);

  const progressBar = () => {
    clearInterval(idInterval);
    idInterval = setInterval(() => {
      widthProgressBar.value = (loop.value * 100) / props.total;

      loop.value = loop.value + 500;
      if (loop.value >= props.total) {
        loop.value = 0;
      }
    }, 500);
  };

  const play = async () => {
    widthProgressBar.value = 0;
    loop.value = 500;
    progressBar();
  };

  const stop = () => {
    clearInterval(idInterval);
  };

  watch(
    () => props.playing,
    (playing) => {
      if (!playing) {
        stop();
      } else {
        play();
      }
    }
  );
</script>

<template>
  <div
    class="progressBar"
    :style="`width: ${widthProgressBar}%;`"
  />
</template>

<style scoped>
  .progressBar {
    height: 20px;
    background-color: aquamarine;
  }
</style>
