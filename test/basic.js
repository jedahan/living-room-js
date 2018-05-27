const test = require(`ava`)
const fetch = require(`node-fetch`)
const { LivingRoomService } = require(`@living-room/service-js`)
const Room = require(`../build/room`)

test.beforeEach(async t => {
  const service = new LivingRoomService()
  const { port } = await service.listen({verbose: false})
  t.context.room = new Room(`http://localhost:${port}`)
})

test.afterEach.always(async t => {
  const facts = await fetch(`${t.context.room._host}/facts`).then(response => response.json())
  t.is(facts.assertions.length, 1)
  // the two tests we run should have separate data!
})

test(`await assert`, async t => {
  t.plan(2)
  const { room } = t.context
  const { facts } = await room.assert(`hello`)
  t.deepEqual(facts, [{assert: `hello`}])
  return room.select(`$word`).then(result => {
    t.deepEqual(result, [{
      word: { word: `hello` }
    }])
  })
})

test(`no callback subscribe`, t => {
  t.plan(2)
  const { room } = t.context
  return new Promise((resolve, reject) => {
    room.subscribe(`$what callback assert`, ({assertions, retractions}) => {
      t.deepEqual(assertions, [{what: `no`}])
      t.deepEqual(retractions, [])
      resolve()
    })

    room.assert(`no callback assert`)
  })
})
