'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var fetch = _interopDefault(require('node-fetch'));
var io = _interopDefault(require('socket.io-client'));
var bonjour = _interopDefault(require('nbonjour'));

function getEnv (key) {
  if (typeof process !== 'undefined') return process.env[key]
}

class Room {
  constructor (host) {
    this._host = host || getEnv('LIVING_ROOM_HOST') || 'http://localhost:3000';
    const serviceDefinition = { type: 'http', subtypes: ['livingroom']};

    if (bonjour) {
      this._browser = bonjour.create().find(serviceDefinition, service => {
        const {type, host, port} = service;
        this._host = `${type}://${host}:${port}`;
        console.log(`set new host to ${this._host}`);
        this._socket = io.connect(this._host);
      });
    }

    this._socket = io.connect(this._host);
  }

  /**
   * @param {String | String[]} facts
   * @param {Function} callback
   */
  subscribe (facts, callback) {
    if (typeof facts === 'string') facts = [facts];
    const patternsString = JSON.stringify(facts);
    this._socket.on(patternsString, callback);
    this._socket.emit('subscribe', patternsString);
  }

  /**
   *
   * @param {String} endpoint assert, retract, select
   * @param {[String]} facts
   */
  _request (endpoint, facts, callback) {
    if (!['assert', 'retract', 'select', 'facts'].includes(endpoint)) {
      throw new Error('Unknown endpoint, try assert, retract, select, or facts')
    }

    if (typeof facts === 'string') facts = [facts];

    if (!(endpoint === 'facts' || facts.length)) {
      throw new Error('Please pass at least one fact')
    }

    // Can this return a promise with the result?
    // Does that even make sense?
    if (this._socket.connected) {
      return new Promise((resolve, reject) => {
        this._socket.emit(endpoint, facts, resolve);
      })
    }

    const uri = `${this._host}/${endpoint}`;

    const post = {
      method: 'POST',
      body: JSON.stringify({ facts }),
      headers: { 'Content-Type': 'application/json' }
    };

    return fetch(uri, post)
      .then(response => response.json())
      .catch(error => {
        if (error.code === 'ECONNREFUSED') {
          console.error(`No server listening on ${uri}`);
          console.error(`Try 'npm start' to run a local service`);
        } else {
          consol.error(error);
        }
      })
  }

  assert (facts, callback) {
    return this._request('assert', facts, callback)
  }

  retract (facts, callback) {
    return this._request('retract', facts, callback)
  }

  select (facts, callback) {
    return this._request('select', facts, callback)
  }

  facts () {
    return this._request('facts')
  }
}

module.exports = Room;
//# sourceMappingURL=room.js.map
