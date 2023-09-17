import * as Tone from 'tone';
import {
  wrapActivate,
  createPrerenderableSampler,
  createPrerenderableBufferArray,
} from '@generative-music/utilities';
import { sampleNames } from '../townsend.gfm.manifest.json';
import gainAdjustments from '../../../normalize/gain.json';

const FLUTE_NOTES = ['C3', 'C4', 'G3', 'G4'];

const activate = async ({ sampleLibrary, onProgress }) => {
  const samples = await sampleLibrary.request(Tone.context, sampleNames);

  const flute = await createPrerenderableSampler({
    samples,
    sampleLibrary,
    notes: FLUTE_NOTES,
    sourceInstrumentName: 'vsco2-flute-susvib',
    renderedInstrumentName: 'townsend__vsco2-flute-susvib',
    additionalRenderLength: 2,
    getDestination: () => new Tone.Reverb(50).toDestination().generate(),
    onProgress: val => onProgress(val * 0.2),
  });

  const guitarBuffers = await createPrerenderableBufferArray({
    samples,
    sampleLibrary,
    sourceInstrumentName: 'acoustic-guitar-chords-cmaj',
    renderedInstrumentName: 'townsend__acoustic-guitar-chords-cmaj',
    additionalRenderLength: 0.5,
    getDestination: () =>
      Promise.resolve(
        new Tone.Freeverb({
          roomSize: 0.5,
          dampening: 5000,
          wet: 0.2,
        }).toDestination()
      ),
    onProgress: val => onProgress(val * 0.8 + 0.2),
  });

  const fluteGain = new Tone.Gain();
  flute.connect(fluteGain);
  const intervalTimes = FLUTE_NOTES.map(() => window.generativeMusic.rng() * 10 + 5);
  const shortestInterval = Math.min(...intervalTimes);
  const limiter = new Tone.Limiter();
  const activeSources = [];

  const playRandomChord = lastChord => {
    const nextChords = guitarBuffers.filter(chord => chord !== lastChord);
    const randomChord =
      nextChords[Math.floor(window.generativeMusic.rng() * nextChords.length)];
    const source = new Tone.ToneBufferSource(randomChord).connect(limiter);
    activeSources.push(source);
    source.onended = () => {
      const i = activeSources.indexOf(source);
      if (i >= 0) {
        activeSources.splice(i, 1);
      }
    };
    source.start('+1');
    Tone.Transport.scheduleOnce(() => {
      playRandomChord(randomChord);
    }, `+${window.generativeMusic.rng() * 10 + 5}`);
  };

  const schedule = ({ destination }) => {
    fluteGain.connect(destination);
    limiter.connect(destination);
    const fluteGainLfo = new Tone.LFO({
      frequency: window.generativeMusic.rng() / 100,
      min: 0,
      max: 0.2,
    });
    fluteGainLfo.connect(fluteGain.gain);
    fluteGainLfo.start();

    const delay = new Tone.FeedbackDelay({
      delayTime: 1,
      feedback: 0.7,
      maxDelay: 1,
    });
    fluteGain.connect(delay);

    FLUTE_NOTES.forEach((note, i) => {
      Tone.Transport.scheduleRepeat(
        () => flute.triggerAttack(note, '+1'),
        intervalTimes[i],
        intervalTimes[i] - shortestInterval
      );
    });

    Tone.Transport.scheduleOnce(() => {
      playRandomChord();
    }, window.generativeMusic.rng() * 5 + 5);

    return () => {
      fluteGainLfo.stop();
      fluteGainLfo.dispose();
      delay.dispose();
      flute.releaseAll(0);
      activeSources.forEach(source => {
        source.stop(0);
      });
    };
  };

  const deactivate = () => {
    guitarBuffers
      .concat([flute, fluteGain, limiter])
      .forEach(node => node.dispose());
  };

  return [deactivate, schedule];
};

const GAIN_ADJUSTMENT = gainAdjustments['townsend'];

export default wrapActivate(activate, { gain: GAIN_ADJUSTMENT });
