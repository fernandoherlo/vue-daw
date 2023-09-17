import { logger } from '../utils';
import factory from '../pieces/factory';

export default class Composer {
  static get LOOP_TIME () {
    return 3000;
  }

  constructor (playing, value) {
    this._playing = playing;
    this._idInterval = null;
    this._pieces = {};
  
    this._value = value;
    if (this._playing) {
      this._init();
    }
  }

  setValue (value) {
    this._value = value;
  }

  getLoopTime () {
    return Composer.LOOP_TIME;
  }

  _init () {
    clearInterval(this._idInterval);
    let commandsFounded = [];
    let lastCommandsFounded = [];
  
    this._idInterval = setInterval(() => {
      if (!this._value) {
        return;
      }
      commandsFounded = [];
    
      try {
        const commands = this._value.split('\n');
        const regexPiece = new RegExp('^p\\((.*)\\)$', 'gm');

        commands.forEach(command => {
          let foundPiece;
          while ((foundPiece = regexPiece.exec(command)) !== null) {
            if (foundPiece.index === regexPiece.lastIndex) {
              regexPiece.lastIndex++;
          }
            if(foundPiece[1]) {
              commandsFounded.push(foundPiece[1]);

              if (!this._pieces[foundPiece[1]]) {
                this._createPiece(foundPiece[1]);
              }
            }
          }
        });

        let intersection = lastCommandsFounded.filter(x => !commandsFounded.includes(x));

        intersection.forEach((piece) => {
          this._deletePiece(piece);
        });

        lastCommandsFounded = commandsFounded;
      } catch (e) {
        logger.error(e);
      }
    }, Composer.LOOP_TIME);
  }

  async _createPiece (piece) {
    const [end, deactivate, schedule] = await factory(piece);

    this._pieces[piece] = { end, deactivate, schedule };
  }

  async _deletePiece (piece) {
    this._pieces[piece].end();

    delete this._pieces[piece];
  }

  play () {
    this._init();
    this._playing = true;

    Object.keys(this._pieces).forEach((piece) => {
      this._pieces[piece].end();
      this._pieces[piece].end = this._pieces[piece].schedule();
    });
  }

  stop () {
    clearInterval(this._idInterval);
    this._playing = false;

    Object.keys(this._pieces).forEach((piece) => {
      this._pieces[piece].end();
    });
  }

  end () {
    clearInterval(this._idInterval);
    this._playing = false;

    Object.keys(this._pieces).forEach((piece) => {
      this._pieces[piece].end();
      this._pieces[piece].deactivate();

      delete this._pieces[piece];
    });
  }
}
