import * as Tone from 'tone';
import {
  createSampler,
  wrapActivate,
  getRandomNumberBetween,
  toss,
  invert,
  major9th,
} from '@generative-music/utilities';
import { sampleNames } from '../eno-machine.gfm.manifest.json';
import gainAdjustments from '../../../normalize/gain.json';

const OCTAVES = [3, 4, 5];
const MIN_REPEAT_S = 20;
const MAX_REPEAT_S = 60;
const NOTES = toss(invert(major9th('Db'), 1), OCTAVES);

const getPiano = samples => createSampler(samples['vsco2-piano-mf']);

const activate = async ({ sampleLibrary }) => {
  const samples = await sampleLibrary.request(Tone.context, sampleNames);
  const piano = await getPiano(samples);

  const schedule = ({ destination }) => {
    piano.connect(destination);
    NOTES.forEach(note => {
      const interval = getRandomNumberBetween(MIN_REPEAT_S, MAX_REPEAT_S);
      const delay = getRandomNumberBetween(0, MAX_REPEAT_S - MIN_REPEAT_S);
      const playNote = () => piano.triggerAttack(note, '+1');
      Tone.Transport.scheduleRepeat(playNote, interval, `+${delay}`);
    });

    return () => {
      piano.releaseAll(0);
    };
  };

  const deactivate = () => {
    piano.dispose();
  };

  return [deactivate, schedule];
};

const GAIN_ADJUSTMENT = gainAdjustments['eno-machine'];

export default wrapActivate(activate, { gain: GAIN_ADJUSTMENT });
