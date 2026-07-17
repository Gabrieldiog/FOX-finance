// Barreira contra senha fácil no cadastro. A ideia não é irritar ninguém com
// regras de "maiúscula + símbolo" (que geram Senha@123), e sim recusar o que
// todo ataque de dicionário testa primeiro: as senhas mais usadas do mundo,
// sequências de teclado e variações do próprio e-mail.

// Compilado das listas públicas de senhas mais vazadas (NordPass/SecLists),
// com reforço no que o Brasil mais usa. Tudo minúsculo — a comparação normaliza.
const COMUNS = new Set([
  // numéricas
  "12345678", "123456789", "1234567890", "12345678910", "87654321", "987654321",
  "0123456789", "01234567", "11111111", "22222222", "33333333", "44444444",
  "55555555", "66666666", "77777777", "88888888", "99999999", "00000000",
  "12341234", "12344321", "11223344", "12121212", "10203040", "102030",
  "12301230", "14725836", "147258369", "159753159", "789456123", "123123123",
  "112233445", "1122334455", "123321123", "11112222", "010203", "01020304",
  "01012000", "01012001", "10101010", "20202020", "123454321", "1234512345",
  // teclado
  "qwertyui", "qwertyuiop", "qwerty123", "1q2w3e4r", "1q2w3e4r5t", "q1w2e3r4",
  "asdfghjk", "asdfghjkl", "zxcvbnm1", "1qaz2wsx", "qazwsxedc", "asdf1234",
  "abcd1234", "abc12345", "a1b2c3d4", "aaaabbbb", "qweasdzxc", "poiuytre",
  // globais
  "password", "password1", "password123", "passw0rd", "p@ssw0rd", "iloveyou",
  "sunshine", "princess", "welcome1", "football", "baseball", "superman",
  "batman123", "trustno1", "letmein1", "whatever", "computer", "internet",
  "starwars", "pokemon1", "michael1", "jordan23", "master123", "dragon123",
  "monkey123", "shadow123", "killer123", "hello123", "freedom1", "charlie1",
  // BR
  "senha123", "senha1234", "minhasenha", "senhasecreta", "senhaforte", "senhanova",
  "mudar123", "123mudar", "mudar@123", "trocar123", "brasil123", "brasil2026",
  "brasilbrasil", "flamengo", "flamengo1", "flamengo123", "corinthians",
  "palmeiras", "saopaulo1", "vasco1898", "cruzeiro1", "gremio123", "santos123",
  "botafogo1", "atletico1", "internacional", "fluminense", "meninadeouro",
  "futebol1", "futebol123", "amorzinho", "meuamor123", "amordaminhavida",
  "princesa1", "princesinha", "gatinha1", "docinho1", "vidaloka1", "familia123",
  "felicidade", "esperanca", "saudade1", "coracao1", "borboleta", "estrela1",
  "jesuscristo", "jesus123", "deusefiel", "deusebom", "deusnocomando",
  "smsdeus1", "abencoado", "gratidao1", "fevereiro", "primavera", "carnaval1",
  "bandeirante", "salvador1", "fortaleza", "curitiba1", "brasilia1", "maravilha",
  // nomes comuns BR + sufixo clássico
  "gabriel123", "maria123", "jose1234", "joao1234", "ana12345", "pedro123",
  "lucas123", "julia123", "mariana1", "fernanda1", "carlos123", "paulo123",
  "rafael123", "amanda123", "bruna123", "felipe123", "gustavo1", "leticia1",
  "rodrigo1", "vanessa1", "patricia1", "juliana1", "camila123", "daniel123",
  "marcos123", "bruno123", "thiago123", "aline123", "andre123", "sandra123",
]);

// Fileiras de teclado e alfabeto: pega "abcdefgh", "qwertyuio" e afins
// que não estejam na lista acima.
const CORRIDAS = [
  "qwertyuiop", "poiuytrewq",
  "asdfghjkl", "lkjhgfdsa",
  "zxcvbnm", "mnbvcxz",
  "abcdefghijklmnopqrstuvwxyz", "zyxwvutsrqponmlkjihgfedcba",
  "1234567890", "0987654321",
];

function soDigitosEmSequencia(s: string): boolean {
  if (!/^\d+$/.test(s)) return false;
  let asc = true;
  let desc = true;
  for (let i = 1; i < s.length; i++) {
    const d = s.charCodeAt(i) - s.charCodeAt(i - 1);
    if (d !== 1) asc = false;
    if (d !== -1) desc = false;
  }
  return asc || desc;
}

/**
 * Retorna o motivo (em pt-BR, pronto pra mostrar) se a senha for fraca,
 * ou null se ela passar. Não substitui o mínimo de 8 caracteres do Better
 * Auth — roda depois dele.
 */
export function senhaFraca(senha: string, email?: string): string | null {
  const s = senha.toLowerCase().trim();

  if (COMUNS.has(s)) {
    return "Essa senha está entre as mais usadas do mundo — é a primeira que testam. Escolha outra.";
  }
  if (/^(.)\1+$/.test(s) || /^(.{1,4})\1+$/.test(s)) {
    return "Senha feita de repetição é fácil de adivinhar. Escolha outra.";
  }
  if (soDigitosEmSequencia(s) || CORRIDAS.some((c) => c.includes(s))) {
    return "Senha em sequência (tipo 12345678 ou abcdefgh) é fácil de adivinhar. Escolha outra.";
  }
  if (email) {
    const e = email.toLowerCase().trim();
    const local = e.split("@")[0];
    if (s === e || (local.length >= 4 && s.includes(local))) {
      return "A senha não pode ser parecida com o seu e-mail.";
    }
  }
  return null;
}
