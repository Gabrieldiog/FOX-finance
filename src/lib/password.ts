import { hash, verify, type Options } from "@node-rs/argon2";

// Argon2id com os parâmetros recomendados pela OWASP (2025): 19 MiB, 2 iterações,
// 1 lane. Leve o bastante pra rodar em serverless e forte o bastante pra senha.
const opts: Options = {
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
  outputLen: 32,
  algorithm: 2, // Argon2id
};

export async function hashPassword(password: string) {
  return hash(password, opts);
}

export async function verifyPassword({ password, hash: digest }: { password: string; hash: string }) {
  return verify(digest, password, opts);
}
