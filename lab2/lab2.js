const ALPHANUM = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const FILLER = "X";

function normalizeKeyword(kw) {
  kw = String(kw || "").toUpperCase();
  let seen = new Set();
  let out = "";
  for (const ch of kw) {
    if (/^[A-Z0-9]$/.test(ch) && !seen.has(ch)) {
      seen.add(ch);
      out += ch;
    }
  }
  return out;
}

function buildSquare(keyword = "") {
  const norm = normalizeKeyword(keyword);
  const used = new Set(norm);
  let out = norm;
  for (const ch of ALPHANUM) {
    if (!used.has(ch)) {
      out += ch;
      used.add(ch);
    }
    if (out.length === 36) break;
  }
  return out.slice(0, 36);
}

function squareTo2D(sq) {
  const rows = [];
  for (let r = 0; r < 6; r++) {
    rows.push(sq.slice(r * 6, r * 6 + 6).split(""));
  }
  return rows;
}

function findPos(square2D, ch) {
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 6; c++) {
      if (square2D[r][c] === ch) return [r, c];
    }
  }
  return [-1, -1];
}

function preprocessPlaintext(plaintext, filler = FILLER) {

  const clean = String(plaintext)
    .toUpperCase()
    .split("")
    .filter(c => /^[A-Z0-9]$/.test(c))
    .join("");

  const bigrams = [];
  let i = 0;
  while (i < clean.length) {
    const a = clean[i];
    const b = clean[i + 1];

    if (!b) {
      bigrams.push(a + filler);
      i += 1;
    } else if (a === b) {
      bigrams.push(a + filler);
      i += 1;
    } else {
      bigrams.push(a + b);
      i += 2;
    }
  }
  return bigrams;
}

function encryptTwoSquare6x6(plaintext, key1, key2) {
  if (!key2) key2 = (key1 || "").split("").reverse().join("");
  const sq1 = squareTo2D(buildSquare(key1));
  const sq2 = squareTo2D(buildSquare(key2));
  const bigrams = preprocessPlaintext(plaintext, FILLER);
  const out = [];

  for (const pair of bigrams) {
    const a = pair[0], b = pair[1];
    const [r1, c1] = findPos(sq1, a);
    const [r2, c2] = findPos(sq2, b);
    if (r1 === -1 || r2 === -1) {
      throw new Error(`Character not in square: ${pair}`);
    }
    const cA = sq1[r1][c2]; 
    const cB = sq2[r2][c1]; 
    out.push(cA + cB);
  }

  return out.join("");
}


function decryptTwoSquare6x6(ciphertext, key1, key2) {
  if (!key2) key2 = (key1 || "").split("").reverse().join("");
  const sq1 = squareTo2D(buildSquare(key1));
  const sq2 = squareTo2D(buildSquare(key2));

  const clean = String(ciphertext).toUpperCase().split("").filter(c => /^[A-Z0-9]$/.test(c)).join("");
  if (clean.length % 2 !== 0) {
    throw new Error("Ciphertext length must be even (pairs).");
  }
  const out = [];
  for (let i = 0; i < clean.length; i += 2) {
    const A = clean[i], B = clean[i + 1];
    const [r1, cAcol] = findPos(sq1, A);
    const [r2, cBcol] = findPos(sq2, B);
    if (r1 === -1 || r2 === -1) throw new Error(`Character not found in squares: ${A}${B}`);
    const p1 = sq1[r1][cBcol];
    const p2 = sq2[r2][cAcol];
    out.push(p1 + p2);
  }
  return out.join("");
}


const key = "SECRET2025";
const plaintext = "HELLO WORLD 123";

const ciphertext = encryptTwoSquare6x6(plaintext, key);
console.log("Key (1):", key);
console.log("Left square:\n", squareTo2D(buildSquare(key)).map(r=>r.join(" ")).join("\n"));
console.log("Right square (reversed key):\n", squareTo2D(buildSquare(key.split("").reverse().join(""))).map(r=>r.join(" ")).join("\n"));
console.log("Plaintext:", plaintext);
console.log("Prepared bigrams:", preprocessPlaintext(plaintext));
console.log("Ciphertext:", ciphertext);

const recovered = decryptTwoSquare6x6(ciphertext, key);
console.log("Decrypted:", recovered);

const keyL = "BLUE";
const keyR = "ORANGE99";
const pt2 = "ATTACK AT 1200";
const ct2 = encryptTwoSquare6x6(pt2, keyL, keyR);
console.log("\nKeys:", keyL, keyR);
console.log("Plain:", pt2);
console.log("Bigrams:", preprocessPlaintext(pt2));
console.log("Cipher:", ct2);
console.log("Dec:", decryptTwoSquare6x6(ct2, keyL, keyR));
