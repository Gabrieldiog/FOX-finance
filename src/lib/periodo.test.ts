import { expect, test } from "vitest";
import { lerPeriodo } from "./periodo";

test.each([
  ["semana", "total", "semana"],
  [undefined, "total", "total"],
  ["lixo", "semana", "semana"],
  [undefined, "lixo", "mes"],
  [undefined, undefined, "mes"],
])("url %s com cookie %s abre em %s", (url, cookie, esperado) => {
  expect(lerPeriodo(url, cookie)).toBe(esperado);
});
