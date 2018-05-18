#!/usr/bin/env node
/// A node.js commandline example

const printHelp = () => {
  console.error(`
  Assert, retract, or select facts from a living room server

  Note the backslashes are important for escaping bash quoting

  Assert a new fact

      room assert "Gorog the barbarian is at (0.5, 0.7)"

  Select a fact

      room select "\$who the \$what is at (\$x, \$y)"

  Retract a fact

      room retract "Gorog the barbarian is at (0.5, 0.7)"

  Subscribe to changes (press enter to exit)

      room subscribe "\$who the \$what is at (\$x, \$y)"
  `)
}

if (process.argv.length < 2) process.exit(printHelp())

const Room = require('../build/room.js')
const room = new Room() // Defaults to http://localhost:3000

const facts = process.argv.slice(3)[0]
const verbose = ['--verbose', '-v'].some(
  arg => process.argv.indexOf(arg) !== -1
)

async function main () {
  switch (process.argv[2]) {
    case 'assert':
      return room.assert(facts).then(console.log)
    case 'retract':
      return room.retract(facts).then(console.log)
    case 'select':
      return room
        .select(facts)
        .then(({ assertions }) => console.log(assertions))
    case 'subscribe':
      room.subscribe(facts, console.log)
      process.stdin.on('data', () => process.exit())
      break
    default:
      return printHelp()
  }
}

main()
  .catch(err => {
    let code = err.code || 'Error'
    console.error(`${code}: ${err.message}`)
    if (verbose) {
      console.error(err.stack)
    }
  })
  .then(process.exit)
