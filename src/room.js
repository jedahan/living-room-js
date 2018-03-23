'use strict'

/**
 * Creates a new http client to a roomdb instance
 *
 * @param {uri} location Location to connect (defaults to localhost:3000)
 */
import fetch from 'node-fetch'
import io from 'socket.io-client'

function getEnv (key) {
  if (typeof process !== 'undefined') return process.env[key]
}

// represents the intention to select all facts from the database
const all = Symbol('all')

export default class Room {
  constructor (uri) {
    this.uri = uri || getEnv('LIVING_ROOM_URI') || 'http://localhost:3000'
    this._sockets = new Map([['_general', io.connect(this.uri)]])
    this._data = null
    this._endpoint = null
  }

  subscribe (facts) {
    const subscriptionName = facts.toString()
    if (this._sockets.has(subscriptionName)) {
      return this._sockets.get(subscriptionName)
    }

    const socket = io.connect(this.uri)
    socket.emit('subscribe', facts)

    this._sockets.set(subscriptionName, socket)
    return {
      on(callback) {
        socket.on('assertions', callback)
        socket.on('retractions', callback)
      },
      unsubscribe() {
        socket.emit('unsubscribe', subscriptionName)
      }
    }
  }

  _db () {
    if (!(this._data || this._endpoint)) {
      throw new Error(`please set _data and _endpoint using assert(), retract(), or select()`)
    }
    const socket = this._sockets.get('_general')

    if (socket.connected && (
          this._endpoint == 'assert'
        ||this._endpoint == 'retract' )) {
      socket.emit(this._endpoint, [this._data])
    } else {
      return this._post()
    }
  }

  _post () {
    const endpoint = this.uri + '/' + this._endpoint

    const post = {
      method: 'POST',
      body: JSON.stringify(this._data),
      headers: { 'Content-Type': 'application/json' }
    }

    return fetch(endpoint, post)
      .then(response => {
        this._data = null
        this._endpoint = null
        return response
      })
  }

  facts () {
    this._data = {}
    this._endpoint = 'facts'
    this._db()
  }

  select (fact) {
    this._data = {fact}
    this._endpoint = 'select'
    return this
  }

  doAll (callbackFn) {
    this._db()
      .then( _ => _.json() )
      .then( json => {
        const {assertions} = json
        callbackFn(assertions)
      })
  }

  do (callbackFn) {
    this._db()
      .then( _ => _.json() )
      .then( json => {
        const {assertions} = json
        assertsions.forEach(callbackFn)
      })
  }

  assert (fact) {
    this._data = {fact}
    this._endpoint = 'assert'
    this._db()
    return this
  }

  retract (fact) {
    this._data = {fact}
    this._endpoint = 'retract'
    this._db()
    return this
  }
}
