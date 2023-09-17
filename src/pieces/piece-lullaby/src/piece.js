import {
  getContext,
  Transport,
  Reverb,
  Gain,
  Filter,
  ToneBufferSource,
  AutoFilter,
} from 'tone';
import {
  wrapActivate,
  createPitchShiftedSampler,
  createPrerenderableBuffers,
} from '@generative-music/utilities';
import { sampleNames } from '../piece.gfm.manifest.json';
import gainAdjustments from '../../../normalize/gain.json';

const playProgression = piano => {
  piano.triggerAttack('C4', `+${1 + window.generativeMusic.rng() * 0.1 - 0.05}`);
  piano.triggerAttack('G4', `+${1 + window.generativeMusic.rng() * 0.1 - 0.05}`);
  const t2 = 6 + window.generativeMusic.rng() * 6;
  piano.triggerAttack('C4', `+${t2 + window.generativeMusic.rng() * 0.1 - 0.05}`);
  piano.triggerAttack('A4', `+${t2 + window.generativeMusic.rng() * 0.1 - 0.05}`);
  const t3 = t2 + 1 + window.generativeMusic.rng() * 4;

  if (window.generativeMusic.rng() < 0.9) {
    piano.triggerAttack('C4', `+${t3 + window.generativeMusic.rng() * 0.1 - 0.05}`);
    piano.triggerAttack('F4', `+${t3 + window.generativeMusic.rng() * 0.1 - 0.05}`);
  }

  const now = new Date();
  const minutes = now.getMinutes();

  if (window.generativeMusic.rng() < minutes / 60) {
    piano.triggerAttack('C6', `+${1 + window.generativeMusic.rng()}`);
  }

  if (window.generativeMusic.rng() < 0.2) {
    piano.triggerAttack('E6', `+${1 + window.generativeMusic.rng() * t2}`);
  }

  if (window.generativeMusic.rng() < (minutes % 3) / 3) {
    piano.triggerAttack('A6', `+${t2 + window.generativeMusic.rng()}`);
  }

  if (window.generativeMusic.rng() < (60 - minutes) / 60) {
    piano.triggerAttack('C7', `+${t3 + window.generativeMusic.rng()}`);
  }

  Transport.scheduleOnce(() => {
    playProgression(piano);
  }, `+${t3 + window.generativeMusic.rng() * 10 + 5}`);
};

const activate = async ({ sampleLibrary, onProgress }) => {
  const samples = await sampleLibrary.request(getContext(), sampleNames);
  const pianos = await Promise.all([
    createPitchShiftedSampler({
      samplesByNote: samples['vsco2-piano-mf'],
      pitchShift: -12,
    }),
    createPitchShiftedSampler({
      samplesByNote: samples['vsco2-piano-mf'],
      pitchShift: -24,
    }),
  ]);

  const birdBuffers = await createPrerenderableBuffers({
    samples,
    sampleLibrary,
    sourceInstrumentName: 'birds',
    renderedInstrumentName: 'lullaby__birds',
    getDestination: () => new Reverb(15).toDestination().generate(),
    onProgress: val => onProgress(val / 2),
  });

  const birdBuffer = birdBuffers.get(0);

  const activeSources = [];

  const playBirdSnippet = ({ destination }) => {
    const startTime = window.generativeMusic.rng() * (birdBuffer.duration - 6);
    const duration = Math.max(
      6,
      window.generativeMusic.rng() * (birdBuffer.duration - startTime)
    );
    const playbackRate = window.generativeMusic.rng() * 0.1 + 0.1;
    const source = new ToneBufferSource(birdBuffer).set({
      fadeIn: 3,
      fadeOut: 3,
      onended: () => {
        const index = activeSources.indexOf(source);
        if (index > -1) {
          activeSources.splice(index, 1);
        }
      },
      playbackRate,
    });
    activeSources.push(source);
    source.connect(destination);
    source.start('+1', startTime, duration / playbackRate, 0.33);
    Transport.scheduleOnce(() => {
      playBirdSnippet({ destination });
    }, `+${duration + window.generativeMusic.rng() * 5}`);
  };

  if (samples['explosion']) {
    samples['explosion'][0].reverse = true;
  }

  const explosionBuffers = await createPrerenderableBuffers({
    samples,
    sampleLibrary,
    sourceInstrumentName: 'explosion',
    renderedInstrumentName: 'lullaby__explosion',
    getDestination: () => new Reverb(15).toDestination().generate(),
    onProgress: val => onProgress(val / 2 + 0.5),
  });

  const explosionGain = new Gain(0.05);
  const lowpass = new Filter(200).connect(explosionGain);
  const explosionBuffer = explosionBuffers.get(0);

  const playReverseExplosion = () => {
    const explosionSource = new ToneBufferSource(explosionBuffer)
      .set({
        playbackRate: window.generativeMusic.rng() * 0.1 + 0.05,
        fadeOut: 3,
        onended: () => {
          const index = activeSources.indexOf(explosionSource);
          if (index > -1) {
            activeSources.splice(index, 1);
          }
        },
      })
      .connect(lowpass);
    activeSources.push(explosionSource);
    explosionSource.start();

    Transport.scheduleOnce(() => {
      playReverseExplosion();
    }, `+${window.generativeMusic.rng() * 100 + 60}`);
  };

  const schedule = ({ destination }) => {
    explosionGain.connect(destination);
    const pianoAutoFilters = pianos.map(piano => {
      const autoFilter = new AutoFilter(0.01 * window.generativeMusic.rng() + 0.005).connect(
        destination
      );
      autoFilter.start();
      piano.connect(autoFilter);
      playProgression(piano);
      return autoFilter;
    });
    playBirdSnippet({ destination });
    playReverseExplosion();

    return () => {
      pianos.forEach(piano => {
        piano.releaseAll(0);
      });
      activeSources.forEach(source => {
        source.stop(0);
      });
      pianoAutoFilters.forEach(autoFilter => {
        autoFilter.dispose();
      });
    };
  };

  const deactivate = () => {
    pianos
      .concat(activeSources)
      .concat([birdBuffers, explosionBuffers])
      .forEach(node => {
        node.dispose();
      });
  };

  return [deactivate, schedule];
};

const GAIN_ADJUSTMENT = gainAdjustments['lullaby'];

export default wrapActivate(activate, { gain: GAIN_ADJUSTMENT });
