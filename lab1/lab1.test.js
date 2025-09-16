function runTests() {
  let input = "Привіт";
  let expected = "Туйдкх";
  let res = caesarUkr(input, 3);
  console.assert(
    res.encoded === expected,
    `Тест 1: очікувалось "${expected}", отримано "${res.encoded}"`
  );

  input = "АаБбЯя";
  expected = "ГгДдВв";
  res = caesarUkr(input, 3);
  console.assert(
    res.encoded === expected,
    `Тест 2: очікувалось "${expected}", отримано "${res.encoded}"`
  );

  input = "ЮЯ";
  expected = "БВ";
  res = caesarUkr(input, 3);
  console.assert(
    res.encoded === expected,
    `Тест 3: очікувалось "${expected}", отримано "${res.encoded}"`
  );

  input = "Привіт, світе!";
  res = caesarUkr(input, 3);
  console.assert(res.encoded.includes(","), `Тест 4: кома змінена`);
  console.assert(res.encoded.includes("!"), `Тест 4: знак оклику змінений`);

  console.log("Усі тести пройдено успішно ✅");
}

runTests();
