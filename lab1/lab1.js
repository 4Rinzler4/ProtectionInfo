// Українська абетка (велика і мала)
const UKR_UP = [
  "А",
  "Б",
  "В",
  "Г",
  "Ґ",
  "Д",
  "Е",
  "Є",
  "Ж",
  "З",
  "И",
  "І",
  "Ї",
  "Й",
  "К",
  "Л",
  "М",
  "Н",
  "О",
  "П",
  "Р",
  "С",
  "Т",
  "У",
  "Ф",
  "Х",
  "Ц",
  "Ч",
  "Ш",
  "Щ",
  "Ь",
  "Ю",
  "Я",
];
const UKR_LOW = UKR_UP.map((c) => c.toLowerCase());

/**
 * caesarUkr - шифр Цезаря для української абетки
 * @param {string} text - вхідний текст
 * @param {number} shift - зсув (за замовчуванням 3)
 * @returns {{encoded: string, codes: number[]}} - закодований рядок і масив кодів символів
 */
function caesarUkr(text, shift = 3) {
  // приведемо зсув в діапазон [0, алфавіт-1]
  const n = UKR_UP.length;
  const s = ((shift % n) + n) % n;

  let out = "";
  const codes = [];

  for (const ch of text) {
    if (UKR_UP.includes(ch)) {
      const idx = UKR_UP.indexOf(ch);
      const newCh = UKR_UP[(idx + s) % n];
      out += newCh;
      codes.push(newCh.codePointAt(0));
    } else if (UKR_LOW.includes(ch)) {
      const idx = UKR_LOW.indexOf(ch);
      const newCh = UKR_LOW[(idx + s) % n];
      out += newCh;
      codes.push(newCh.codePointAt(0));
    } else {
      out += ch;
      codes.push(ch.codePointAt(0));
    }
  }

  return { encoded: out, codes };
}

// --- Приклади ---
const input = "Привіт, світе!";
const result = caesarUkr(input, 3);
console.log("Вхід:", input);
console.log("Закодовано:", result.encoded);
console.log("Коди символів (десяткові):", result.codes.join(" "));
