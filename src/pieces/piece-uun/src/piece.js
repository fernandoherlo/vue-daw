import * as Tone from 'tone';
import {
  createSampler,
  transpose,
  wrapActivate,
} from '@generative-music/utilities';
import { sampleNames } from '../uun.gfm.manifest.json';
import gainAdjustments from '../../../normalize/gain.json';

function* makeNoteGenerator(notes) {
  for (
    let i = 0;
    i < notes.length;
    i === notes.length - 1 ? (i = 0) : (i += 1)
  ) {
    yield notes[i];
  }
}

const trillNoteSets = [['D5', 'C5'], ['D#5', 'D5'], ['F5', 'D#5']];

const trillGenerators = trillNoteSets.map(notes => makeNoteGenerator(notes));

const activate = async ({ sampleLibrary }) => {
  const samples = await sampleLibrary.request(Tone.context, sampleNames);
  const piano = await createSampler(samples['vsco2-piano-mf']);
  const splatterNotes = transposeUp => {
    const multiplier = Math.pow(window.generativeMusic.rng(), 2) * 0.5 + 0.01;
    ['C3', 'D#3', 'G3', 'A#3', 'D4']
      .map(note => (transposeUp ? transpose(note, 5) : note))
      .forEach((note, i) => {
        piano.triggerAttack(
          note,
          `+${1 + multiplier * i + window.generativeMusic.rng() / 50 - 0.01}`
        );
      });
  };

  const trillNotes = transposeUp => {
    const trillerGeneratorIndex = Math.floor(
      window.generativeMusic.rng() * trillGenerators.length
    );
    const trillGenerator = trillGenerators[trillerGeneratorIndex];

    const trill = Array.from({
      length: Math.ceil(window.generativeMusic.rng() * 8) + 12,
    })
      .map(() => trillGenerator.next().value)
      .map(note =>
        transposeUp && trillGenerator !== 3 ? transpose(note, 5) : note
      );
    const upper = window.generativeMusic.rng() * 0.5 + 0.4;
    const lower = window.generativeMusic.rng() * 0.1 + 0.2;
    const getNoteWaitTime = x =>
      -4 * (lower - upper) * Math.pow(x, 2) + 4 * (lower - upper) * x + upper;
    const lastTrillTime = (window.generativeMusic.rng() < 0.5
      ? trill
      : trill.reverse()
    ).reduce((lastNoteTime, note, i) => {
      const noteTime = lastNoteTime + getNoteWaitTime(i / (trill.length - 1));
      piano.triggerAttack(
        note,
        `+${noteTime + window.generativeMusic.rng() / 50 - 0.01}`,
        0.5
      );
      return noteTime;
    }, 1 - upper);

    return lastTrillTime;
  };

  const playMoment = () => {
    const up = window.generativeMusic.rng() < 0.5;
    splatterNotes(up);
    const lastTrillTime = trillNotes(up);

    Tone.Transport.scheduleOnce(() => {
      playMoment();
    }, `+${window.generativeMusic.rng() * 5 + lastTrillTime - 0.5}`);
  };

  const schedule = ({ destination }) => {
    piano.connect(destination);
    playMoment();
    return () => {
      piano.releaseAll(0);
    };
  };

  const deactivate = () => {
    piano.dispose();
  };

  return [deactivate, schedule];
};

const GAIN_ADJUSTMENT = gainAdjustments['uun'];

export default wrapActivate(activate, { gain: GAIN_ADJUSTMENT });
