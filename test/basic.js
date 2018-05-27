const test = require(`ava`)
const fetch = require(`node-fetch`)
const { LivingRoomService } = require(`@living-room/service-js`)
const Room = require(`../build/room`)

test.beforeEach(async t => {
  const service = new LivingRoomService({verbose: true})
  const { port } = await service.listen()
  t.context.room = new Room(`http://localhost:${port}`)
  t.context.assert = async assert => {
    const opts = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({facts: [{assert}]})
    }
    console.dir(`asserting to ${t.context.room._host}`)
    return fetch(`${t.context.room._host}/messages`, opts).then(response => response.json())
  }
})

test.afterEach.always(async t => {
  const { room } = t.context
  const opts = {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  }
  const facts = await fetch(`${room._host}/facts`, opts).then(response => response.json())
  t.is(facts.assertions.length, 1)
})

// this leaks context to other tests...
test(`await assert`, async t => {
  t.plan(1)
  const { room } = t.context
  const { facts } = await t.context.assert(`hello`)
  t.deepEqual(facts, [{assert: `hello`}])
  room.select(`$word`).then(result => {
    t.deepEqual(result, [{
      word: { word: `hello` }
    }])
  })
})

test(`no callback subscribe`, t => {
  t.plan(2)
  return new Promise((resolve, reject) => {
    const { room } = t.context
    room.subscribe(`$what callback assert`, ({assertions, retractions}) => {
      t.deepEqual(assertions, [{what: `no`}])
      t.deepEqual(retractions, [])
      resolve()
    })

    t.context.assert(`no callback assert`)
  })
})

/*
test(`no callback assert`, t => {
  t.plan(1)
  const { room } = t.context
  return new Promise((resolve, reject) => {
    room.on(`$what callback assert`, ({what}) => {
      t.is(what, `no`)
      resolve()
    })

    room.assert(`no callback assert`)
  })
})

test(`multiple asserts`, t => {
  t.plan(5)
  const { room } = t.context
  const animal = new Set([
    `party`,
    `car`,
    `animal`,
    `blue`,
    `me`
  ])

  const asserts = Array.from(animal.values())
    .map(what => ({ assert: `animal ${what}` }))

  return new Promise((resolve, reject) => {
    room.on(`animal $what`, ({what}) => {
      t.true(animal.delete(what))
      if (animal.size === 0) resolve()
    })

    room
       .assert(`animal party`)
       .assert(`animal car`)
       .assert(`animal animal`)

    room
       .assert(`animal blue`)
       .assert(`animal me`)
   })
})

test(`once only gets called for existing assertions`, t => {
  const { room } = t.context
  const asserts = new Set([ `first`, `second` ])
  t.plan(2)
  let times = false

  const number = ({number}) => {
    if (times) return
    t.true([`first`, `second`].includes(number))
    times = true
  }

  room.on(`$number`, number)

  room
    .assert(`first`)
    .assert(`second`)

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      room.assert(`third`).then(resolve)
    })
  })
})

test(`called for all assertions`, t => {
  const { room } = t.context
  let asserts = new Set([ `first`, `second`, `third` ])
  t.plan(asserts.size)

  const what = ({what}) => {
    t.true(asserts.delete(what))
  }

  room.on(`$what`, what)

  room
    .assert(`first`)
    .assert(`second`)

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      room.assert(`third`)
        .then(() => {
          t.is(asserts.size, 0)
          //room.off(`$what`, what)
          resolve()
        })
    }, 150)
  })
})

test('setImmediate clears calls a second time', t => {
  const { room } = t.context
  let times = 0
  const processed = response => {
    if (times === 0) {
      t.deepEqual(response, {facts: [{assert: 'this'}, {assert: 'is'}, {assert: 'cool'}]})
    } else {
      t.deepEqual(response, {facts: [{assert: 'like'}, {assert: 'the'}, {assert: 'coolest'}]})
    }
    times++
  }

  room.on('$processed', processed)

  room
    .assert('this')
    .assert('is')
    .assert('cool')
    .then()

  return new Promise((resolve, reject) => {
    room
      .assert('like')
      .assert('the')
      .assert('coolest')
      .then(response=> {
        t.is(response, {facts: [{assert: `like`}, {assert: `the`}, {assert: `coolest`}]})
        resolve()
      })
  })
})
*/
