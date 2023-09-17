import * as Tone from 'tone';
import {
  createPrerenderableSampler,
  wrapActivate,
  toss,
} from '@generative-music/utilities';
import { sampleNames } from '../apoapsis.gfm.manifest.json';
import gainAdjustments from '../../../normalize/gain.json';

const pianoNotes = toss(['C', 'E', 'G', 'B'], [3, 4, 5]);
const violinNotes = toss(['C', 'E', 'G', 'B'], [2, 3, 4]);

const activate = async ({ sampleLibrary, onProgress }) => {
  const samples = await sampleLibrary.request(Tone.context, sampleNames);

  const getPianoDestination = () =>
    Promise.resolve(
      new Tone.Freeverb({ roomSize: 0.9, wet: 0.5 }).toDestination()
    );
  const getViolinDestination = () =>
    Promise.resolve(
      new Tone.Freeverb({ roomSize: 0.8, wet: 0.5 }).toDestination()
    );

  const reversePiano = await createPrerenderableSampler({
    notes: pianoNotes,
    samples,
    sourceInstrumentName: 'vsco2-piano-mf',
    renderedInstrumentName: 'apoapsis__vsco2-piano-mf',
    sampleLibrary,
    additionalRenderLength: 1,
    getDestination: getPianoDestination,
    onProgress: val => onProgress(val * 0.5),
    reverse: true,
  });

  const violins = await createPrerenderableSampler({
    notes: violinNotes,
    samples,
    sourceInstrumentName: 'vsco2-violins-susvib',
    renderedInstrumentName: 'apoapsis__vsco2-violins-susvib',
    sampleLibrary,
    additionalRenderLength: 1,
    getDestination: getViolinDestination,
    onProgress: val => onProgress(val * 0.5 + 0.5),
    bufferSourceOptions: {
      fadeOut: 8,
      curve: 'linear',
    },
  });

  const violinVol = new Tone.Volume(-25);

  violins.connect(violinVol);

  const schedule = ({ destination }) => {
    violinVol.connect(destination);
    const delay1 = new Tone.FeedbackDelay({
      feedback: 0.7,
      delayTime: 0.2,
      wet: 0.5,
    });
    const delay2Time = window.generativeMusic.rng() * 10 + 20;
    const delay2 = new Tone.FeedbackDelay({
      feedback: 0.6,
      delayTime: delay2Time,
      maxDelay: delay2Time,
      wet: 0.5,
    });

    reversePiano.chain(delay1, delay2, destination);

    violinNotes.forEach(note => {
      Tone.Transport.scheduleRepeat(
        () => violins.triggerAttack(note, '+1'),
        window.generativeMusic.rng() * 120 + 60,
        `+${window.generativeMusic.rng() * 15 + 15}`
      );
    });

    const intervals = pianoNotes.map(() => window.generativeMusic.rng() * 30 + 30);
    const minInterval = Math.min(...intervals);
    pianoNotes.forEach((note, i) => {
      const intervalTime = intervals[i];
      Tone.Transport.scheduleRepeat(
        () => reversePiano.triggerAttack(note, '+1'),
        intervalTime,
        intervalTime - minInterval
      );
    });

    return () => {
      reversePiano.releaseAll(0);
      violins.releaseAll(0);
      [delay1, delay2].forEach(node => node.dispose());
    };
  };

  const deactivate = () => {
    [violins, reversePiano].forEach(node => node.dispose());
  };

  return [deactivate, schedule];
};

const GAIN_ADJUSTMENT = gainAdjustments['apoapsis'];

export default wrapActivate(activate, { gain: GAIN_ADJUSTMENT });
