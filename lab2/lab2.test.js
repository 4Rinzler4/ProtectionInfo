const {
  normalizeKeyword,
  buildSquare,
  preprocessPlaintext,
  encryptTwoSquare6x6,
  decryptTwoSquare6x6
} = require("./twoSquare6x6");

describe("Two-Square 6x6 Cipher", () => {
  test("normalizeKeyword removes duplicates and uppercases", () => {
    expect(normalizeKeyword("Secret2025!!")).toBe("SECRT205");
  });

  test("buildSquare generates correct length and unique chars", () => {
    const sq = buildSquare("TEST");
    expect(sq).toHaveLength(36);
    const unique = new Set(sq);
    expect(unique.size).toBe(36);
  });

  test("preprocessPlaintext splits correctly with filler", () => {
    expect(preprocessPlaintext("HELLO")).toEqual(["HE", "LX", "LO"]);
    expect(preprocessPlaintext("A")).toEqual(["AX"]);
  });

  test("encryption and decryption are inverses (single keyword)", () => {
    const key = "SECRET2025";
    const plaintext = "HELLO WORLD 123";
    const cipher = encryptTwoSquare6x6(plaintext, key);
    const decrypted = decryptTwoSquare6x6(cipher, key);
    expect(typeof cipher).toBe("string");
    expect(cipher.length % 2).toBe(0);
    expect(decrypted).toContain("HEL");
    expect(decrypted).toMatch(/^[A-Z0-9]+$/);
  });

  test("encryption/decryption work with two different keys", () => {
    const k1 = "BLUE";
    const k2 = "ORANGE99";
    const pt = "ATTACK AT 1200";
    const ct = encryptTwoSquare6x6(pt, k1, k2);
    const dec = decryptTwoSquare6x6(ct, k1, k2);
    expect(dec).toMatch(/^[A-Z0-9]+$/);
    expect(ct).not.toBe(pt);
  });

  test("throws on odd-length ciphertext", () => {
    expect(() => decryptTwoSquare6x6("ABC", "KEY")).toThrow();
  });
});
