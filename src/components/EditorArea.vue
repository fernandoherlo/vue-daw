<script setup>
  import { ref, watch } from 'vue';
  import Composer from '../services/Composer';
  import ProgressBar from './ProgressBar.vue';

  const props = defineProps({
    started: Boolean
  });
  const playing = ref(false);
  const dataSynth = ref(`
asdasd
p(enough)
asdasd
asdasd
p(enoMachine)
asdasd
  `);

  const composer = new Composer(playing.value, dataSynth.value);

  const play = async () => {
    playing.value = true;
    composer.play();
  };

  const stop = () => {
    playing.value = false;
    composer.stop();
  };

  const end = () => {
    playing.value = false;
    composer.end();
  };

  watch(
    () => props.started,
    (started) => {
      if (!started) {
        end();
      } else {
        play();
      }
    }
  );

  watch(
    dataSynth,
    (value) => {
      composer.setValue(value);
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
  <progress-bar
    :playing="playing"
    :total="composer.getLoopTime()"
  />
  <textarea v-model="dataSynth" />
</template>

<style scoped>
  textarea {
    position: fixed;
    top: 100px;
    bottom:0;
    left: 0;
    right: 0;
    height: 100%;
    width: 100%;
    font-size: 3em;
  }
</style>
