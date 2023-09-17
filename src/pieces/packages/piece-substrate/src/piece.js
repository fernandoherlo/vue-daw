import * as Tone from 'tone';
import {
  createPrerenderableSampler,
  wrapActivate,
  shuffleArray,
  getPitchClass,
  getOctave,
  minor7th,
  toss,
} from '@generative-music/utilities';
import { sampleNames } from '../substrate.gfm.manifest.json';
import gainAdjustments from '../../../normalize/gain.json';

const OCTAVES = [3, 4];
const getNotes = tonic =>
  OCTAVES.reduce(
    (notes, octave) => notes.concat(minor7th(`${tonic}${octave}`)),
    []
  );

const swapTwo = arr => {
  const copy = arr.slice(0);
  const index1 = Math.floor(window.generativeMusic.rng() * copy.length);
  let index2 = index1;
  while (index1 === index2) {
    index2 = Math.floor(window.generativeMusic.rng() * copy.length);
  }
  const tmp = copy[index1];
  copy[index1] = copy[index2];
  copy[index2] = tmp;
  return copy;
};

function* makeNoteGenerator(notes) {
  for (let i = 0; i < notes.length; i += 1) {
    yield notes[i];
  }
}

const PITCH_CLASSES = [
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B',
];

const activate = async ({ sampleLibrary, onProgress }) => {
  const samples = await sampleLibrary.request(Tone.context, sampleNames);
  const getReverb = () =>
    new Tone.Reverb(20)
      .set({ wet: 0.5 })
      .toDestination()
      .generate();

  const renderedMarimbaNotes = toss(PITCH_CLASSES, OCTAVES.concat([5]))
    .slice(0, -2)
    .filter((_, i) => i % 3 === 0);
  const marimba = await createPrerenderableSampler({
    samples,
    sampleLibrary,
    notes: renderedMarimbaNotes,
    sourceInstrumentName: 'vsco2-marimba',
    renderedInstrumentName: 'substrate__vsco2-marimba',
    getDestination: getReverb,
    onProgress: val => onProgress(val * 0.5),
    pitchShift: -24,
  });
  const piano = await createPrerenderableSampler({
    samples,
    sampleLibrary,
    notes: renderedMarimbaNotes.map(
      note => `${getPitchClass(note)}${getOctave(note) + 1}`
    ),
    sourceInstrumentName: 'vsco2-piano-mf',
    renderedInstrumentName: 'substrate__vsco2-piano-mf',
    getDestination: getReverb,
    onProgress: val => onProgress(val * 0.5 + 0.5),
    pitchShift: -12,
  });
  marimba.set({
    attack: 0.3,
    curve: 'linear',
  });

  piano.set({
    attack: 0.25,
    curve: 'linear',
  });

  const playAndScheduleNext = (noteGenerator, notes) => {
    const next = noteGenerator.next();
    if (!next.done) {
      marimba.triggerAttack(next.value, '+1');
      const pc = getPitchClass(next.value);
      const oct = getOctave(next.value);
      if (window.generativeMusic.rng() < 0.5) {
        const delay =
          window.generativeMusic.rng() < 0.5
            ? 1
            : window.generativeMusic.rng() * 2 + 1;
        piano.triggerAttack(`${pc}${oct + 1}`, `+${delay}`);
      }

      Tone.Transport.scheduleOnce(() => {
        playAndScheduleNext(noteGenerator, notes);
      }, `+${3 + window.generativeMusic.rng()}`);
    } else {
      Tone.Transport.scheduleOnce(() => {
        const newNotes = swapTwo(notes);
        const newNoteGenerator = makeNoteGenerator(newNotes);
        playAndScheduleNext(newNoteGenerator, newNotes);
      }, `+${window.generativeMusic.rng() + 4}`);
    }
  };

  const schedule = ({ destination }) => {
    marimba.connect(destination);
    piano.connect(destination);
    const tonic =
      PITCH_CLASSES[
        Math.floor(window.generativeMusic.rng() * PITCH_CLASSES.length)
      ];
    const notes = shuffleArray(getNotes(tonic));
    const noteGenerator = makeNoteGenerator(notes);

    playAndScheduleNext(noteGenerator, notes);

    return () => {
      marimba.releaseAll(0);
      piano.releaseAll(0);
    };
  };

  const deactivate = () => {
    marimba.dispose();
    piano.dispose();
  };

  return [deactivate, schedule];
};

const GAIN_ADJUSTMENT = gainAdjustments['substrate'];

export default wrapActivate(activate, { gain: GAIN_ADJUSTMENT });
