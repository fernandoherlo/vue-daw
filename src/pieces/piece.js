import { Destination, context } from 'tone';
import * as pieces from './index';
import samples from './samples.json';

const data = {
  context,
  sampleLibrary: {
    request: () => new Promise((resolve, reject) => {
      resolve(samples);
    })
  },
  destination: Destination
};

const execute = async (piece) => {
  const [deactivate, schedule] = await pieces[piece](data);
  const end = schedule();
  return [end, deactivate]; 
}

export default execute;
