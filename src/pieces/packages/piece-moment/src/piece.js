import * as Tone from 'tone';
import {
  createPrerenderableSampler,
  wrapActivate,
  getPitchClass,
  getOctave,
} from '@generative-music/utilities';
import { sampleNames } from '../moment.gfm.manifest.json';
import gainAdjustments from '../../../normalize/gain.json';

const NOTES = ['C2', 'E2', 'G2', 'C3', 'E3', 'G3', 'C4', 'E4', 'G4'];

const activate = async ({ sampleLibrary, onProgress }) => {
  const samples = await sampleLibrary.request(Tone.context, sampleNames);

  const basePrerenderableOpts = {
    samples,
    sampleLibrary,
    notes: NOTES,
    getDestination: () =>
      new Tone.Reverb(10)
        .set({ wet: 0.5 })
        .toDestination()
        .generate(),
  };

  const guitar = await createPrerenderableSampler(
    Object.assign({}, basePrerenderableOpts, {
      sourceInstrumentName: 'acoustic-guitar',
      renderedInstrumentName: 'moment__acoustic-guitar',
      onProgress: val => onProgress(val * 0.33),
    })
  );

  const hum1 = await createPrerenderableSampler(
    Object.assign({}, basePrerenderableOpts, {
      sourceInstrumentName: 'alex-hum-1',
      renderedInstrumentName: 'moment__alex-hum-1',
      onProgress: val => onProgress(val * 0.33 + 0.33),
    })
  );

  const hum2 = await createPrerenderableSampler(
    Object.assign({}, basePrerenderableOpts, {
      sourceInstrumentName: 'alex-hum-1',
      renderedInstrumentName: 'moment__alex-hum-2',
      onProgress: val => onProgress(val * 0.33 + 0.66),
    })
  );

  const compressor = new Tone.Compressor();
  const humVolume = new Tone.Volume(-15).connect(compressor);

  [hum1, hum2].forEach(humSampler => {
    humSampler.set({
      attack: 3,
      release: 3,
      curve: 'linear',
    });
    humSampler.connect(humVolume);
  });

  const lastHumTime = new Map();
  const playHums = note => {
    const now = Tone.now();
    if (!lastHumTime.has(note) || now - lastHumTime.get(note) > 30) {
      [hum1, hum2].forEach(humSampler =>
        humSampler.triggerAttackRelease(note, window.generativeMusic.rng() + 4)
      );
      lastHumTime.set(note, now);
    }
  };

  const schedule = ({ destination }) => {
    guitar.connect(destination);
    compressor.connect(destination);
    const firstDelays = NOTES.map(
      note =>
        window.generativeMusic.rng() *
        20 *
        (getPitchClass(note) === 'E' ? 3 : 1)
    );
    const minFirstDelay = Math.min(...firstDelays);

    NOTES.forEach((note, i) => {
      const pc = getPitchClass(note);
      const play = (
        time = (window.generativeMusic.rng() * 20 + 5) * (pc === 'E' ? 3 : 1)
      ) => {
        Tone.Transport.scheduleOnce(() => {
          const octave = getOctave(note);
          if (
            (octave === 3 || (octave === 2 && pc === 'G')) &&
            window.generativeMusic.rng() < 0.1
          ) {
            playHums(note);
          } else if (window.generativeMusic.rng() < 0.1) {
            playHums('E3');
          }
          guitar.triggerAttack(note);
          play();
        }, `+${time}`);
      };
      play(firstDelays[i] - minFirstDelay);
    });

    return () => {
      [guitar, hum1, hum2].forEach(sampler => {
        sampler.releaseAll(0);
      });
    };
  };

  const deactivate = () => {
    [guitar, hum1, hum2, compressor, humVolume].forEach(node => node.dispose());
  };

  return [deactivate, schedule];
};

const GAIN_ADJUSTMENT = gainAdjustments['moment'];

export default wrapActivate(activate, { gain: GAIN_ADJUSTMENT });
