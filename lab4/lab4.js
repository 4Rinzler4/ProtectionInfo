const fs = require('fs');
const { PNG } = require('pngjs');

const BITS_PER_PIXEL = 2; 
const LENGTH_BITS = 32; 
const PIXELS_FOR_LENGTH = Math.ceil(LENGTH_BITS / BITS_PER_PIXEL);

function textToBytesUTF8(text) {
  return Buffer.from(String(text), 'utf8');
}

function bytesToBitArray(buf) {
  const bits = [];
  for (let i = 0; i < buf.length; i++) {
    const byte = buf[i];
    for (let b = 7; b >= 0; b--) {
      bits.push((byte >> b) & 1);
    }
  }
  return bits;
}

function bitArrayToBytes(bits) {
  const bytes = [];
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j++) {
      const bit = bits[i + j] ?? 0;
      byte = (byte << 1) | bit;
    }
    bytes.push(byte & 0xFF);
  }
  return Buffer.from(bytes);
}

function writeBitsFromEnd(pixelsBuffer, startPixelIndex, bitsArr) {
  let bitIndex = 0;
  for (let p = startPixelIndex; p >= 0 && bitIndex < bitsArr.length; p--) {
    const byteOffset = p * 4; // RGBA
    // blue channel at offset + 2
    const blueOffset = byteOffset + 2;
    // беремо наступні 2 біти (MSB-first)
    const b1 = bitsArr[bitIndex++] ?? 0;
    const b2 = bitsArr[bitIndex++] ?? 0;
    // створимо 2-бітне число: (b1 << 1) | b2
    const twoBits = (b1 << 1) | b2;
    // очистимо 2 молодших біти синього і поставимо twoBits
    pixelsBuffer[blueOffset] = (pixelsBuffer[blueOffset] & 0xFC) | twoBits;
  }
  if (bitIndex < bitsArr.length) throw new Error('Недостатньо пікселів для запису всіх бітів');
}

/**
 * Зчитує countBits біт, починаючи з кінця (startPixelIndex вниз).
 * Повертає масив біт у тій же послідовності, як записували.
 */
function readBitsFromEnd(pixelsBuffer, startPixelIndex, countBits) {
  const bits = [];
  let bitsRead = 0;
  for (let p = startPixelIndex; p >= 0 && bitsRead < countBits; p--) {
    const blueOffset = p * 4 + 2;
    const twoBits = pixelsBuffer[blueOffset] & 0x03; // 2 LSB
    // twoBits: старший біт = (twoBits >> 1) & 1, молодший = twoBits & 1
    bits.push((twoBits >> 1) & 1);
    bitsRead++;
    if (bitsRead < countBits) {
      bits.push(twoBits & 1);
      bitsRead++;
    }
  }
  if (bitsRead < countBits) throw new Error('Недостатньо пікселів для зчитування');
  return bits;
}

/**
 * Encode: вбудовує повідомлення в PNG (blue LSB2) з кінця.
 */
function encodePng(inputPath, outputPath, message) {
  const data = fs.readFileSync(inputPath);
  const img = PNG.sync.read(data);
  const numPixels = img.width * img.height;

  // Перетворюємо повідомлення в біти
  const msgBytes = textToBytesUTF8(message);
  const msgBits = bytesToBitArray(msgBytes);
  const msgBitsCount = msgBits.length;

  // Потрібні пікселі: на довжину (msgBitsCount) + LENGTH_BITS (32)
  const totalBitsNeeded = msgBitsCount + LENGTH_BITS;
  const pixelsNeeded = Math.ceil(totalBitsNeeded / BITS_PER_PIXEL);

  if (pixelsNeeded > numPixels) {
    throw new Error(`Занадто мало пікселів (${numPixels}) для вбудування. Потрібно ${pixelsNeeded}.`);
  }

  // Копіюємо дані, щоб модифікувати
  const outImg = new PNG({ width: img.width, height: img.height });
  img.data.copy(outImg.data);

  const lastPixelIndex = numPixels - 1;

  // 1) спочатку записуємо довжину повідомлення (в байтах) у останні PIXELS_FOR_LENGTH пікселів
  const msgLenBytes = msgBytes.length >>> 0; // 32-bit unsigned
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(msgLenBytes, 0); // big-endian (будь-який порядок — консистентно)
  const lenBits = bytesToBitArray(lenBuf);
  // Запишемо lenBits саме у кінці
  writeBitsFromEnd(outImg.data, lastPixelIndex, lenBits);

  // 2) Потім записуємо повідомлення бітами перед довжиною.
  // Стартова позиція: lastPixelIndex - PIXELS_FOR_LENGTH
  const startForMsgLastPixel = lastPixelIndex - PIXELS_FOR_LENGTH;
  if (startForMsgLastPixel < 0 && msgBits.length > 0) {
    throw new Error('Недостатньо місця для повідомлення перед довжиною.');
  }
  // Записуємо msgBits починаючи від startForMsgLastPixel назад
  if (msgBits.length > 0) {
    writeBitsFromEnd(outImg.data, startForMsgLastPixel, msgBits);
  }

  // Записуємо PNG
  const bufferOut = PNG.sync.write(outImg);
  fs.writeFileSync(outputPath, bufferOut);
  console.log(`Вбудовано повідомлення (${msgBytes.length} байт) у ${outputPath}`);
}

/**
 * Decode: читає повідомлення з PNG.
 */
function decodePng(inputPath) {
  const data = fs.readFileSync(inputPath);
  const img = PNG.sync.read(data);
  const numPixels = img.width * img.height;
  const lastPixelIndex = numPixels - 1;

  // 1) Зчитуємо LENGTH_BITS з кінця
  const lenBits = readBitsFromEnd(img.data, lastPixelIndex, LENGTH_BITS);
  const lenBuf = bitArrayToBytes(lenBits); // має бути 4 байти
  const msgLenBytes = lenBuf.readUInt32BE(0);

  // Скільки біт потрібно для повідомлення:
  const msgBitsCount = msgLenBytes * 8;
  const pixelsForMsg = Math.ceil(msgBitsCount / BITS_PER_PIXEL);
  const startForMsgLastPixel = lastPixelIndex - PIXELS_FOR_LENGTH;

  if (startForMsgLastPixel - pixelsForMsg + 1 < 0 && msgBitsCount > 0) {
    throw new Error('Значення довжини більші, ніж може бути прочитано — можливо, немає повідомлення.');
  }

  // Зчитуємо msgBitsCount біт, починаючи перед довжиною
  const msgBits = readBitsFromEnd(img.data, startForMsgLastPixel, msgBitsCount);
  const msgBuf = bitArrayToBytes(msgBits);
  // Обрізаємо до точної довжини байт
  const finalBuf = msgBuf.slice(0, msgLenBytes);
  const text = finalBuf.toString('utf8');
  return { length: msgLenBytes, text, raw: finalBuf };
}

if (require.main === module) {
  const argv = process.argv.slice(2);
  if (argv.length < 2) {
    console.log('Usage:\n  node stego-png.js encode input.png output.png "secret message"\n  node stego-png.js decode input.png');
    process.exit(1);
  }
  const cmd = argv[0];
  try {
    if (cmd === 'encode') {
      const [ , input, output, ...rest] = argv;
      const msg = rest.join(' ');
      encodePng(input, output, msg);
    } else if (cmd === 'decode') {
      const [ , input] = argv;
      const res = decodePng(input);
      console.log('Decoded length (bytes):', res.length);
      console.log('Decoded text:', res.text);
    } else {
      console.log('Unknown command', cmd);
    }
  } catch (e) {
    console.error('Error:', e.message);
  }
}

module.exports = { encodePng, decodePng };
