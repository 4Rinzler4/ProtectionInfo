const fs = require('fs')
const path = require('path')
const { embedMessage, extractMessage } = require('./stego')

const INPUT_FILE = path.join(__dirname, 'test-input.png')
const OUTPUT_FILE = path.join(__dirname, 'test-output.png')

beforeAll(() => {
  const buffer = Buffer.alloc(1024, 128) // 1KB fake file
  fs.writeFileSync(INPUT_FILE, buffer)
})

afterAll(() => {
  fs.unlinkSync(INPUT_FILE)
  fs.unlinkSync(OUTPUT_FILE)
})

test('should embed and extract message correctly', () => {
  const message = 'Hi!'
  embedMessage(INPUT_FILE, OUTPUT_FILE, message)
  const decoded = extractMessage(OUTPUT_FILE, message.length)
  expect(decoded).toBe(message)
})
