import { expect, test } from "vitest";
import { senhaFraca } from "./senha-fraca";

test("senhas do dicionário são recusadas", () => {
  expect(senhaFraca("12345678")).toMatch(/mais usadas/);
  expect(senhaFraca("senha123")).toMatch(/mais usadas/);
  expect(senhaFraca("SENHA123")).toMatch(/mais usadas/); // maiúscula não engana
  expect(senhaFraca("flamengo123")).toMatch(/mais usadas/);
  expect(senhaFraca("password")).toMatch(/mais usadas/);
});

test("sequências e repetições são recusadas", () => {
  expect(senhaFraca("aaaaaaaa")).toMatch(/repetição/);
  expect(senhaFraca("xyzwxyzw")).toMatch(/repetição/);
  expect(senhaFraca("12341234")).toMatch(/repetição|mais usadas/);
  expect(senhaFraca("23456789")).toMatch(/sequência/);
  expect(senhaFraca("98765432")).toMatch(/sequência/);
  expect(senhaFraca("abcdefgh")).toMatch(/sequência/);
  expect(senhaFraca("qwertyui")).toMatch(/sequência|mais usadas/);
});

test("senha parecida com o e-mail é recusada", () => {
  expect(senhaFraca("mariana2024", "mariana@gmail.com")).toMatch(/e-mail/);
  expect(senhaFraca("gabriel.silva", "gabriel.silva@fox.com")).toMatch(/e-mail/);
  // e-mail de outra pessoa não interfere
  expect(senhaFraca("mariana2024", "outra@gmail.com")).toBeNull();
});

test("senha razoável passa", () => {
  expect(senhaFraca("cavalo-verde-cafe-77")).toBeNull();
  expect(senhaFraca("MinhaGata Comeu 3 Paes!")).toBeNull();
  expect(senhaFraca("tr4b4lh0 n0 fox", "ana@fox.com")).toBeNull();
});
