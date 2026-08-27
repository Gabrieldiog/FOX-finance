# Plano — Módulo "Ganhos de app"

> **Para quem for executar:** use `superpowers:subagent-driven-development` ou
> `superpowers:executing-plans`. Os passos usam `- [ ]` para acompanhamento.

**Objetivo:** dar ao Fox um painel que responde "vale a pena eu estar rodando?", sem que o
saldo, o resumo, as metas e os relatórios que já existem mudem um centavo.

**Arquitetura:** uma tabela nova aponta 1:1 para a `transaction` que já existe, guardando só o
que não é dinheiro. O dinheiro continua onde sempre esteve. O painel novo fala de "resultado
operacional" e nunca soma com o caixa.

**Stack:** Next.js 16 (App Router, RSC) · Drizzle ORM 0.45 · Postgres/Supabase · Vitest ·
Tailwind v4.

**Brief:** `BRIEF — Fox Finance · Módulo "Ganhos de app"` (recebido em 27/08/2026, colado na
conversa; não está versionado no repo).

---

## Restrições globais

Copiadas do brief, valem para **toda** tarefa deste plano:

- A tabela `transaction` **não muda**. Nenhuma coluna nova, nenhum tipo alterado.
- Saldo, resumo, metas e relatórios entregam **exatamente os mesmos números** de hoje.
- Nada escreve em `householdId`.
- **Nenhum token de cor novo.** A paleta verde-feltro fica. Cor de ação é `--color-brasa`
  (`#f4841f`), que já existe.
- **Nenhuma fonte nova.** As seis famílias já configuradas bastam.
- Texto de interface em português.
- `deletedAt` preenchido não entra em nenhum agregado novo.
- Dinheiro em centavos inteiros, sempre.

---

## PARTE 1 — O que eu encontrei (seção 0.1 do brief)

### 1. Qual ORM?

**Drizzle ORM 0.45.2**, com `postgres-js` por baixo. E um detalhe que muda o plano:

> **Não existem migrations versionadas.** Não há pasta `drizzle/`. O schema é declarado em
> TypeScript (`src/db/*.ts`) e empurrado com `npm run db:push` (`drizzle-kit push`).

Consequência prática: criar tabela nova é editar o TS e rodar `db:push` — não há arquivo `.sql`
para revisar antes. Em produção isso é um comando manual, igual ao `db:seed`.

### 2. Tabelas no singular ou plural? Enums?

**Singular, sempre:** `user`, `session`, `account`, `verification`, `rate_limit`,
`login_attempt`, `category`, `recurring`, `transaction`, `budget`.

**Colunas:** `snake_case` no banco, `camelCase` na propriedade TS.
Ex.: `amountCents: bigint("amount_cents", { mode: "number" })`.

**Enums: o projeto NÃO usa `pgEnum`.** Zero ocorrências. O padrão é `text()` mais uma
`check()` constraint com nome em português:

```ts
type: text("type").notNull(),
// ...
check("transaction_type_valido", sql`${t.type} in ('expense','income','transfer')`),
```

**Tipos numéricos: só `bigint` e `integer`.** Zero `decimal`, `numeric`, `real` ou
`doublePrecision` no projeto inteiro. Isso é uma escolha deliberada — o README diz "dinheiro em
centavos inteiros" —, e ela **conflita com o brief** (ver Conflito C).

### 3. As categorias são globais ou por usuário?

**As duas coisas.** `category.userId` nulo = global (todo mundo vê); preenchido = privada.

**"Corridas", "Combustível" e "Carro" foram criadas como GLOBAIS**, hoje (27/08), no
`scripts/seed.ts`. Logo, a Raíssa também as vê na lista dela — o que é inofensivo, ela
simplesmente não usa.

> ⚠️ **Verificado em produção: o seed NÃO rodou.** Só as 13 categorias antigas estão lá (ver
> Conflito H). Isso deixou de bloquear a Fase B por causa da decisão do Conflito E, mas continua
> valendo rodar.

### 4. Existe tabela de preferências por usuário?

**Não.** Nenhuma tabela de preferência, configuração ou perfil. As dez tabelas listadas acima
são tudo.

→ Os campos de custo da Fase A precisam de **tabela nova**. Isso responde a condicional do brief
na seção 5.1.

### 5. Como as rotas estão organizadas?

App Router, **sem route groups** (zero diretórios `(...)`). Cada rota é uma pasta direta em
`src/app/`:

```
/  /novo  /editar/[id]  /lancamentos  /estatisticas  /metas
/conta  /recorrencias  /privacidade  /entrar  /criar-conta  /raposa-3d
```

APIs em `src/app/api/{auth,export,health,relatorio}`.

Toda página protegida começa igual:

```tsx
const session = await auth.api.getSession({ headers: await headers() });
if (!session) redirect("/entrar");
```

**Onde encaixar:** rotas novas em `/ganhos` (painel) e `/ganhos/ajustes` (custos), seguindo o
padrão de pasta direta. A entrada natural é um link em `/conta`, que já é o menu do app e já
linka `/recorrencias` desse jeito.

---

## PARTE 2 — Conflitos com o brief

O brief manda parar e avisar em vez de adivinhar. São oito. Nenhum é impeditivo: os três
primeiros mudam código, o E e o H foram **resolvidos com verificação**, e o resto é registro.

### Conflito A — "identificadores em inglês, camelCase, como o resto do código" (§1.6)

**Isso está parcialmente errado.** A convenção real do Fox é *por camada*:

| Camada | Idioma | Exemplos reais |
|---|---|---|
| Schema e tabelas | inglês | `transaction`, `amountCents`, `occurredAt` |
| `src/lib/data/*` | inglês, **com exceções** | `createTransaction`, `listCategories` — mas também `resumoDoPeriodo`, `metasComProgresso`, `materializarRecorrencias`, `detalheMes` |
| `src/lib/actions.ts` | **100% português** | `criarLancamento`, `definirMeta`, `excluirRecorrencia` |
| Componentes (arquivo e export) | **100% português** | `item-lancamento.tsx`, `nova-categoria.tsx`, `IconeCategoria` |

A regra observada: **quanto mais perto do banco, mais inglês; quanto mais perto da tela, mais
português.**

**Proponho seguir a convenção real, não a do brief:** schema e data layer em inglês (com nome
em português quando o conceito é do domínio, como o Fox já faz), actions e componentes em
português. Escrever `createRideDetail` na data layer e `criarGanhoDeApp` na action.

### Conflito B — `platform` como enum (§6.1)

O brief pede `enum: UBER | NOVE_NOVE | ...`. O projeto **não usa `pgEnum`**.

**Proponho** seguir o padrão da casa — `text()` + `check()` — e usar ids minúsculos, como o
catálogo fechado de `FORMAS_PAGAMENTO` em `src/lib/categorias.ts` já faz
(`pix`, `dinheiro`, `cartao`, `outro`):

```ts
platform: text("platform").notNull(),
check("ride_platform_valida", sql`${t.platform} in ('uber','99','ifood','rappi','mercado_livre','loggi','outro')`),
```

Isso também resolve o `NOVE_NOVE` esquisito: vira `'99'`, que é o nome real do app.

### Conflito C — `decimal(7,1)` para km e `decimal(6,2)` para litros (§6.1, §7.1)

**O Fox não tem uma única coluna decimal.** Só `bigint` e `integer`. É a mesma disciplina do
"centavos inteiros": nada de ponto flutuante em dado persistido. Além disso, o `decimal` do
Drizzle volta como **string** em JS, o que espalharia `Number(...)` por toda a camada de
cálculo.

**Proponho inteiros escalados**, com a unidade no nome da coluna:

| Brief | Proposta | Por quê |
|---|---|---|
| `km decimal(7,1)` | `distanceMeters integer` | precisão de 1 m, sem float; exibe dividindo por 1000 |
| `liters decimal(6,2)` | `milliliters integer` | precisão de 1 ml |
| `kmPerLiter decimal(6,2)` | `kmPerLiterCenti integer` | 30 km/l → `3000` |
| `depreciationFactor decimal(3,2)` | `depreciationFactorCenti integer` | 0,60 → `60` |

### Conflito D — "o arquivo de decisões que o projeto já usa" (§9)

**Não existe.** Não há `DECISOES.md`, `DECISIONS.md` nem pasta `docs/`.

**Proponho criar `DECISOES.md` na raiz**, na Tarefa 1, já com as decisões deste plano.

### Conflito E — como identificar "a categoria Corridas" (§6.2) — **RESOLVIDO**

O brief diz "quando `type = 'income'` **e** a categoria for Corridas, revele o bloco extra".
Verifiquei e **não vamos ancorar em categoria nenhuma**, por três motivos que se somam:

1. **A categoria não existe em produção.** Verifiquei ao vivo (ver Conflito H): o seed nunca
   rodou lá. Ancorar na categoria deixaria a Fase B dependente de um comando manual.
2. **Nome é frágil.** Nada impede alguém de criar uma categoria privada chamada "Corridas", e
   renomear a global quebraria o módulo em silêncio.
3. **A âncora já existe e é melhor:** quem marca um lançamento como "de app" é a **existência
   do `rideDetail`**, com sua `platform`. A categoria nunca precisou ser a fonte da verdade.

**Decisão:** o bloco extra aparece quando `type === 'income'`, atrás de um toggle discreto
*"Foi corrida de app?"* que lembra a última escolha. A categoria fica livre — quem quiser usar
"Corridas" usa, quem preferir outra também. O painel lê `rideDetail`, não categoria.

Isso é uma divergência de comportamento em relação ao §6.2, então está registrada aqui de
propósito. Ganho: nenhuma mudança na tabela `category`, e a Fase B deixa de depender do seed.

### Conflito F — "Fase A: zero impacto no que existe" (§4)

Quase verdade. A Fase A não toca em nenhuma **tabela**, mas precisa de um **link de entrada** —
senão a tela existe e ninguém acha (foi exatamente o que aconteceu com o botão de apagar).

**Proponho** uma linha em `/conta`, idêntica à que já linka `/recorrencias`. Uma inserção de 6
linhas em `src/app/conta/page.tsx`, sem alterar comportamento nenhum.

### Conflito G — "as fontes ficam, seis famílias já configuradas" (§1.5)

Correto, e vou respeitar. Só registro: **a Inter é órfã** — auditei hoje e ela não pinta um
único caractere, custando 48 KB de preload em toda página. Não faz parte deste módulo; fica
anotado para um PR separado.

### Conflito H — o seed nunca rodou em produção — **VERIFICADO**

Testei ao vivo em `fox-finance.vercel.app`: criei uma conta temporária, li as categorias que a
produção serve e apaguei a conta depois (confirmado com HTTP 401 na credencial apagada).

Resultado: **as 13 categorias antigas estão lá; `Corridas`, `Combustível` e `Carro` não.**
O código do PR #32 está no ar, mas o `npm run db:seed` é comando manual e não foi executado.

Com a decisão do Conflito E isso **deixou de bloquear** a Fase B. Continua valendo rodar, para
quem quiser categorizar como "Corridas":

```bash
DATABASE_URL="<pooler do Supabase>" npm run db:seed
# esperado: criadas 3 categorias globais (16 no total)
```

---

## PARTE 3 — Estrutura de arquivos

### Fase A

| Arquivo | Responsabilidade |
|---|---|
| **Criar** `DECISOES.md` | registro das decisões (Conflito D) |
| **Modificar** `src/db/app-schema.ts` | tabela `costSetting` |
| **Criar** `src/lib/data/custos.ts` | ler/gravar a configuração, escopado por `sessionUserId` |
| **Criar** `src/lib/data/custos.test.ts` | isolamento entre contas + defaults |
| **Criar** `src/lib/custo-por-km.ts` | **funções puras**, sem banco: as fórmulas do brief §5.2 |
| **Criar** `src/lib/custo-por-km.test.ts` | as fórmulas + todos os casos de borda do §5.2 |
| **Modificar** `src/lib/actions.ts` | `salvarCustos(raw)` |
| **Criar** `src/app/ganhos/ajustes/page.tsx` | tela dos campos de custo |
| **Criar** `src/app/ganhos/ajustes/forma-custos.tsx` | client component do formulário |
| **Criar** `src/app/ganhos/vale-a-pena/page.tsx` | a calculadora |
| **Criar** `src/app/ganhos/vale-a-pena/calculadora.tsx` | client component, reage ao digitar |
| **Modificar** `src/app/conta/page.tsx` | link de entrada (Conflito F) |

`custo-por-km.ts` fica **separado** de `custos.ts` de propósito: um é matemática pura e
testável sem banco, o outro é acesso a dados. É o mesmo corte que o projeto já faz entre
`src/lib/relatorio.ts` (puro) e `src/lib/data/transactions.ts` (banco).

### Fases B e C — esboço

Detalho quando a Fase A for aprovada e estiver no ar. O brief manda parar no fim de cada fase,
e ele mesmo diz que se a Fase A resolver, você para ali — detalhar agora seria trabalho jogado
fora. O contorno:

- **Fase B:** `rideDetail` em `app-schema.ts`; `src/lib/data/corridas.ts`; bloco condicional em
  `src/app/novo/forma-lancamento.tsx`; painel em `src/app/ganhos/page.tsx`.
- **Fase C:** `fuelDetail`; `src/lib/data/abastecimento.ts` com a calibração de tanque a tanque;
  aviso de consumo atualizado; toggle para voltar ao manual.

---

## PARTE 4 — Fase A, tarefa por tarefa

### Task 1: Registrar as decisões

**Arquivos:** Criar `DECISOES.md`

- [ ] **Passo 1: Criar o arquivo com as decisões dos Conflitos A, B, C e E**

```markdown
# Decisões

## 2026-08-27 — Módulo Ganhos de app

**Idioma dos identificadores.** Schema e camada de dados em inglês; server actions e
componentes em português. É a convenção que o Fox já pratica, não a do brief.

**Enums.** `text` + `check`, como as outras tabelas. O projeto não usa `pgEnum`.

**Números não-monetários.** Inteiros escalados com a unidade no nome (`distanceMeters`,
`milliliters`, `kmPerLiterCenti`), nunca `decimal`. Motivo: o Drizzle devolve `decimal` como
string, e o projeto inteiro evita ponto flutuante em dado persistido.

**Taxas versus dinheiro.** Custo por km é uma *taxa* e é calculada em ponto flutuante na
memória. Só o resultado final em dinheiro é arredondado para centavo inteiro, com
`Math.round`, e nunca antes.
```

- [ ] **Passo 2: Commit**

```bash
git add DECISOES.md
git commit -m "docs: registrar decisoes do modulo de ganhos de app"
```

---

### Task 2: A matemática, isolada e testada

**Arquivos:**
- Criar: `src/lib/custo-por-km.ts`
- Test: `src/lib/custo-por-km.test.ts`

**Interfaces:**
- Consome: nada (função pura, sem import do projeto)
- Produz: `type Custos`, `custoVariavelPorKm(c: Custos): number`,
  `custoFixoPorDia(c: Custos): number`,
  `avaliarRota(c: Custos, r: Rota): Veredito`

Este arquivo **não importa `@/db`**. É matemática pura, roda em teste sem banco nenhum —
igual a `src/lib/relatorio.ts`.

- [ ] **Passo 1: Escrever os testes que falham**

```ts
import { expect, test, describe } from "vitest";
import { custoVariavelPorKm, custoFixoPorDia, avaliarRota, type Custos } from "./custo-por-km";

// Padrão do brief §5.1: R$ 6,00/l, 30 km/l, 15 centavos/km de manutenção,
// moto de R$ 0 (sem depreciação), meta de R$ 25,00/h.
const PADRAO: Custos = {
  fuelPriceCents: 600,
  kmPerLiterCenti: 3000,
  maintenanceCentsPerKm: 15,
  vehicleValueCents: 0,
  vehicleLifetimeKm: 100000,
  depreciationFactorCenti: 60,
  fixedCostCentsPerMonth: 0,
  workedDaysPerMonth: 22,
  targetCentsPerHour: 2500,
  includeReturnTrip: true,
};

describe("custoVariavelPorKm", () => {
  test("soma combustível, manutenção e depreciação", () => {
    // 600 / 30 = 20 de combustível + 15 de manutenção + 0 de depreciação
    expect(custoVariavelPorKm(PADRAO)).toBeCloseTo(35, 6);
  });

  test("inclui a depreciação quando a moto tem valor", () => {
    // (1_000_000 centavos x 0,60) / 100_000 km = 6 centavos por km
    const c = { ...PADRAO, vehicleValueCents: 1_000_000 };
    expect(custoVariavelPorKm(c)).toBeCloseTo(41, 6);
  });

  test("kmPerLiter zero não vira Infinity nem NaN", () => {
    const c = { ...PADRAO, kmPerLiterCenti: 0 };
    const r = custoVariavelPorKm(c);
    expect(Number.isFinite(r)).toBe(true);
    expect(r).toBe(15); // só manutenção; o combustível é ignorado, não explode
  });

  test("vehicleLifetimeKm zero não vira Infinity", () => {
    const c = { ...PADRAO, vehicleValueCents: 1_000_000, vehicleLifetimeKm: 0 };
    expect(Number.isFinite(custoVariavelPorKm(c))).toBe(true);
  });
});

describe("custoFixoPorDia", () => {
  test("divide o custo fixo do mês pelos dias trabalhados", () => {
    const c = { ...PADRAO, fixedCostCentsPerMonth: 22000, workedDaysPerMonth: 22 };
    expect(custoFixoPorDia(c)).toBeCloseTo(1000, 6);
  });

  test("workedDaysPerMonth zero devolve zero, não Infinity", () => {
    const c = { ...PADRAO, fixedCostCentsPerMonth: 22000, workedDaysPerMonth: 0 };
    expect(custoFixoPorDia(c)).toBe(0);
  });
});

describe("avaliarRota", () => {
  test("conta o km de volta quando includeReturnTrip", () => {
    // 2 km até o cliente + 10 da rota + 10 de volta = 22 km x 35 = 770 centavos
    const v = avaliarRota(PADRAO, { kmAtePartida: 2, kmDaRota: 10, minutos: 30, ofertaCents: 2000 });
    expect(v.custoCents).toBe(770);
    expect(v.sobraCents).toBe(1230);
  });

  test("sem o km de volta o custo cai", () => {
    const c = { ...PADRAO, includeReturnTrip: false };
    // 2 + 10 = 12 km x 35 = 420
    const v = avaliarRota(c, { kmAtePartida: 2, kmDaRota: 10, minutos: 30, ofertaCents: 2000 });
    expect(v.custoCents).toBe(420);
  });

  test("calcula o por-hora e a razão contra a meta", () => {
    // sobra 1230 em 30 min = 2460/h; meta 2500 -> 98,4%
    const v = avaliarRota(PADRAO, { kmAtePartida: 2, kmDaRota: 10, minutos: 30, ofertaCents: 2000 });
    expect(v.porHoraCents).toBe(2460);
    expect(v.razao).toBeCloseTo(0.984, 3);
    expect(v.veredito).toBe("LIMITE");
  });

  test("as três faixas do veredito", () => {
    const base = { kmAtePartida: 0, kmDaRota: 10, minutos: 60 };
    // 20 km x 35 = 700 de custo
    expect(avaliarRota(PADRAO, { ...base, ofertaCents: 1000 }).veredito).toBe("RECUSA"); // 300/h = 12%
    expect(avaliarRota(PADRAO, { ...base, ofertaCents: 2700 }).veredito).toBe("LIMITE"); // 2000/h = 80%
    expect(avaliarRota(PADRAO, { ...base, ofertaCents: 3200 }).veredito).toBe("ACEITA"); // 2500/h = 100%
  });

  test("oferta menor que o custo dá sobra negativa e RECUSA", () => {
    const v = avaliarRota(PADRAO, { kmAtePartida: 0, kmDaRota: 10, minutos: 30, ofertaCents: 100 });
    expect(v.sobraCents).toBeLessThan(0);
    expect(v.veredito).toBe("RECUSA");
  });

  test("minutos zero não vira Infinity", () => {
    const v = avaliarRota(PADRAO, { kmAtePartida: 0, kmDaRota: 10, minutos: 0, ofertaCents: 5000 });
    expect(Number.isFinite(v.porHoraCents)).toBe(true);
    expect(Number.isFinite(v.razao)).toBe(true);
  });

  test("km total zero: custo zero, sem divisão por zero", () => {
    const v = avaliarRota(PADRAO, { kmAtePartida: 0, kmDaRota: 0, minutos: 30, ofertaCents: 1000 });
    expect(v.custoCents).toBe(0);
    expect(v.sobraCents).toBe(1000);
  });

  test("a razão trava em 2 para o indicador, mas o valor exato continua disponível", () => {
    const v = avaliarRota(PADRAO, { kmAtePartida: 0, kmDaRota: 1, minutos: 10, ofertaCents: 10000 });
    expect(v.razao).toBeGreaterThan(2);
    expect(v.razaoNoIndicador).toBe(2);
  });
});
```

- [ ] **Passo 2: Rodar e ver falhar**

Rodar: `npx vitest run src/lib/custo-por-km.test.ts`
Esperado: FALHA com "Failed to resolve import ./custo-por-km"

- [ ] **Passo 3: Implementar**

```ts
// Matemática do módulo de ganhos. Puro: não importa banco, não lê relógio.
// Testável sem infraestrutura, igual a src/lib/relatorio.ts.
//
// Sobre unidades: dinheiro é centavo inteiro, como no resto do Fox. Mas custo
// POR KM é uma taxa, não um valor — ela vive em ponto flutuante aqui dentro e
// só vira centavo inteiro (com Math.round) quando o resultado é dinheiro de
// verdade. Arredondar a taxa antes acumularia erro a cada quilômetro.

export type Custos = {
  fuelPriceCents: number;
  kmPerLiterCenti: number;
  maintenanceCentsPerKm: number;
  vehicleValueCents: number;
  vehicleLifetimeKm: number;
  depreciationFactorCenti: number;
  fixedCostCentsPerMonth: number;
  workedDaysPerMonth: number;
  targetCentsPerHour: number;
  includeReturnTrip: boolean;
};

export type Rota = {
  kmAtePartida: number;
  kmDaRota: number;
  minutos: number;
  ofertaCents: number;
};

export type NomeVeredito = "RECUSA" | "LIMITE" | "ACEITA";

export type Veredito = {
  kmTotal: number;
  custoCents: number;
  sobraCents: number;
  porHoraCents: number;
  razao: number;
  razaoNoIndicador: number;
  veredito: NomeVeredito;
};

// Divisão que nunca devolve Infinity nem NaN. Denominador zerado significa
// "esse dado não foi preenchido", e um dado que falta vale zero — nunca
// infinito, que contaminaria a conta inteira e apareceria como R$ NaN na tela.
function dividir(a: number, b: number): number {
  return b === 0 ? 0 : a / b;
}

export function custoVariavelPorKm(c: Custos): number {
  const kmPorLitro = c.kmPerLiterCenti / 100;
  const combustivel = dividir(c.fuelPriceCents, kmPorLitro);
  const depreciacao = dividir(
    (c.vehicleValueCents * c.depreciationFactorCenti) / 100,
    c.vehicleLifetimeKm,
  );
  return combustivel + c.maintenanceCentsPerKm + depreciacao;
}

export function custoFixoPorDia(c: Custos): number {
  return dividir(c.fixedCostCentsPerMonth, c.workedDaysPerMonth);
}

// Teto do indicador visual: acima disso a agulha satura e a tela mostra "200%+".
// O valor exato continua em `razao`, para a linha de resumo.
const TETO_DO_INDICADOR = 2;

export function avaliarRota(c: Custos, r: Rota): Veredito {
  // Esquecer o km de volta é o erro que faz a conta mentir: uma rota que
  // termina longe custa o dobro do que parece.
  const kmTotal = r.kmAtePartida + r.kmDaRota + (c.includeReturnTrip ? r.kmDaRota : 0);
  const custoCents = Math.round(kmTotal * custoVariavelPorKm(c));
  const sobraCents = r.ofertaCents - custoCents;
  const porHoraCents = Math.round(dividir(sobraCents, r.minutos / 60));
  const razao = dividir(porHoraCents, c.targetCentsPerHour);

  const veredito: NomeVeredito = razao >= 1 ? "ACEITA" : razao >= 0.7 ? "LIMITE" : "RECUSA";

  return {
    kmTotal,
    custoCents,
    sobraCents,
    porHoraCents,
    razao,
    razaoNoIndicador: Math.min(Math.max(razao, 0), TETO_DO_INDICADOR),
    veredito,
  };
}
```

- [ ] **Passo 4: Rodar e ver passar**

Rodar: `npx vitest run src/lib/custo-por-km.test.ts`
Esperado: PASSA, 13 testes.

- [ ] **Passo 5: Commit**

```bash
git add src/lib/custo-por-km.ts src/lib/custo-por-km.test.ts
git commit -m "feat(ganhos): matematica de custo por km e veredito de rota, com testes"
```

---

### Task 3: A tabela de configuração

**Arquivos:**
- Modificar: `src/db/app-schema.ts` (acrescentar ao fim)
- Criar: `src/lib/data/custos.ts`
- Test: `src/lib/data/custos.test.ts`

**Interfaces:**
- Consome: `Custos` de `src/lib/custo-por-km.ts` (Task 2)
- Produz: `getCustos(sessionUserId): Promise<Custos>` — devolve os defaults quando não há linha;
  `setCustos(sessionUserId, parcial): Promise<void>`

- [ ] **Passo 1: Acrescentar a tabela ao schema**

```ts
// Configuração de custo de quem roda de app. Uma linha por usuário — o user_id
// é a própria chave primária, então não existe duplicata possível.
// Nada aqui é obrigatório no primeiro acesso: quem nunca abriu os ajustes usa
// os defaults e o app já funciona.
export const costSetting = pgTable(
  "cost_setting",
  {
    userId: text("user_id")
      .primaryKey()
      .references(() => user.id, { onDelete: "cascade" }),
    fuelPriceCents: integer("fuel_price_cents").notNull().default(600),
    // Centésimos de km/l: 30 km/l vira 3000. Inteiro escalado em vez de
    // decimal, pela mesma razão que o dinheiro é centavo (ver DECISOES.md).
    kmPerLiterCenti: integer("km_per_liter_centi").notNull().default(3000),
    maintenanceCentsPerKm: integer("maintenance_cents_per_km").notNull().default(15),
    vehicleValueCents: bigint("vehicle_value_cents", { mode: "number" }).notNull().default(0),
    vehicleLifetimeKm: integer("vehicle_lifetime_km").notNull().default(100000),
    depreciationFactorCenti: integer("depreciation_factor_centi").notNull().default(60),
    fixedCostCentsPerMonth: bigint("fixed_cost_cents_per_month", { mode: "number" })
      .notNull()
      .default(0),
    workedDaysPerMonth: integer("worked_days_per_month").notNull().default(22),
    targetCentsPerHour: integer("target_cents_per_hour").notNull().default(2500),
    includeReturnTrip: boolean("include_return_trip").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    check("cost_preco_nao_negativo", sql`${t.fuelPriceCents} >= 0`),
    check("cost_consumo_nao_negativo", sql`${t.kmPerLiterCenti} >= 0`),
    check("cost_dias_validos", sql`${t.workedDaysPerMonth} between 0 and 31`),
    check("cost_fator_valido", sql`${t.depreciationFactorCenti} between 0 and 100`),
  ],
);
```

- [ ] **Passo 2: Escrever o teste que falha**

```ts
import { afterAll, beforeAll, expect, test } from "vitest";
import { inArray } from "drizzle-orm";
import { client, db } from "@/db";
import { user } from "@/db/schema";
import { getCustos, setCustos } from "./custos";

const A = "xcusto-user-a";
const B = "xcusto-user-b";

beforeAll(async () => {
  await db.delete(user).where(inArray(user.id, [A, B]));
  await db.insert(user).values([
    { id: A, name: "A", email: "xcusto-a@fox.test", emailVerified: true },
    { id: B, name: "B", email: "xcusto-b@fox.test", emailVerified: true },
  ]);
});

afterAll(async () => {
  await db.delete(user).where(inArray(user.id, [A, B]));
  await client.end();
});

test("quem nunca configurou nada recebe os defaults, sem linha no banco", async () => {
  const c = await getCustos(A);
  expect(c.fuelPriceCents).toBe(600);
  expect(c.kmPerLiterCenti).toBe(3000);
  expect(c.targetCentsPerHour).toBe(2500);
  expect(c.includeReturnTrip).toBe(true);
});

test("salvar cria a linha; salvar de novo atualiza, não duplica", async () => {
  await setCustos(A, { fuelPriceCents: 649 });
  expect((await getCustos(A)).fuelPriceCents).toBe(649);

  await setCustos(A, { fuelPriceCents: 715, targetCentsPerHour: 3000 });
  const c = await getCustos(A);
  expect(c.fuelPriceCents).toBe(715);
  expect(c.targetCentsPerHour).toBe(3000);
  // campo não enviado continua no default
  expect(c.maintenanceCentsPerKm).toBe(15);
});

test("um usuário não lê nem sobrescreve a configuração do outro", async () => {
  await setCustos(A, { fuelPriceCents: 999 });
  // B continua no default, sem enxergar nada de A
  expect((await getCustos(B)).fuelPriceCents).toBe(600);

  await setCustos(B, { fuelPriceCents: 111 });
  expect((await getCustos(A)).fuelPriceCents).toBe(999);
  expect((await getCustos(B)).fuelPriceCents).toBe(111);
});
```

- [ ] **Passo 3: Rodar e ver falhar**

Rodar: `npx vitest run src/lib/data/custos.test.ts`
Esperado: FALHA com "Failed to resolve import ./custos"

- [ ] **Passo 4: Implementar a camada de dados**

```ts
import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { costSetting } from "@/db/schema";
import type { Custos } from "@/lib/custo-por-km";

// REGRA DE OURO do projeto: sessionUserId vem SEMPRE da sessão no servidor.

// Os mesmos defaults declarados no schema, repetidos aqui de propósito: quem
// nunca abriu os ajustes não tem linha nenhuma no banco, e mesmo assim o app
// precisa calcular. Sem isto, a calculadora exigiria um cadastro antes de
// responder qualquer coisa.
export const CUSTOS_PADRAO: Custos = {
  fuelPriceCents: 600,
  kmPerLiterCenti: 3000,
  maintenanceCentsPerKm: 15,
  vehicleValueCents: 0,
  vehicleLifetimeKm: 100000,
  depreciationFactorCenti: 60,
  fixedCostCentsPerMonth: 0,
  workedDaysPerMonth: 22,
  targetCentsPerHour: 2500,
  includeReturnTrip: true,
};

export async function getCustos(sessionUserId: string): Promise<Custos> {
  const [row] = await db
    .select()
    .from(costSetting)
    .where(eq(costSetting.userId, sessionUserId))
    .limit(1);
  if (!row) return { ...CUSTOS_PADRAO };
  return {
    fuelPriceCents: row.fuelPriceCents,
    kmPerLiterCenti: row.kmPerLiterCenti,
    maintenanceCentsPerKm: row.maintenanceCentsPerKm,
    vehicleValueCents: row.vehicleValueCents,
    vehicleLifetimeKm: row.vehicleLifetimeKm,
    depreciationFactorCenti: row.depreciationFactorCenti,
    fixedCostCentsPerMonth: row.fixedCostCentsPerMonth,
    workedDaysPerMonth: row.workedDaysPerMonth,
    targetCentsPerHour: row.targetCentsPerHour,
    includeReturnTrip: row.includeReturnTrip,
  };
}

export async function setCustos(
  sessionUserId: string,
  parcial: Partial<Custos>,
): Promise<void> {
  await db
    .insert(costSetting)
    .values({ userId: sessionUserId, ...parcial })
    .onConflictDoUpdate({
      target: costSetting.userId,
      set: { ...parcial, updatedAt: new Date() },
    });
}
```

- [ ] **Passo 5: Empurrar o schema para o banco local e rodar o teste**

```bash
DATABASE_URL="postgresql://postgres:fox@127.0.0.1:55432/fox" npx drizzle-kit push --force
npx vitest run src/lib/data/custos.test.ts
```
Esperado: PASSA, 3 testes.

- [ ] **Passo 6: Commit**

```bash
git add src/db/app-schema.ts src/lib/data/custos.ts src/lib/data/custos.test.ts
git commit -m "feat(ganhos): tabela cost_setting e camada de dados escopada por usuario"
```

---

### Task 4: Provar que nada do que já existe mudou

Esta tarefa é o aceite mais importante do brief e vem **antes** da interface, de propósito:
se a tabela nova quebrar algum agregado antigo, é aqui que aparece.

**Arquivos:** Criar `src/lib/data/nao-regressao.test.ts`

- [ ] **Passo 1: Escrever o teste**

```ts
import { afterAll, beforeAll, expect, test } from "vitest";
import { inArray } from "drizzle-orm";
import { client, db } from "@/db";
import { user } from "@/db/schema";
import { createTransaction } from "./transactions";
import { resumoDoPeriodo } from "./summary";
import { setCustos } from "./custos";

const U = "xnaoreg-user";

beforeAll(async () => {
  await db.delete(user).where(inArray(user.id, [U]));
  await db.insert(user).values({ id: U, name: "N", email: "xnaoreg@fox.test", emailVerified: true });
});

afterAll(async () => {
  await db.delete(user).where(inArray(user.id, [U]));
  await client.end();
});

test("configurar custos NÃO altera o resumo do Fox", async () => {
  await createTransaction(U, { type: "income", amountCents: 18700, occurredAt: new Date() });
  await createTransaction(U, { type: "expense", amountCents: 6000, occurredAt: new Date() });

  const antes = await resumoDoPeriodo(U, "mes");

  // O módulo novo grava a configuração dele...
  await setCustos(U, { fuelPriceCents: 715, targetCentsPerHour: 3000 });

  // ...e o caixa continua idêntico. Custo por km é OPERACIONAL, nunca entra aqui.
  const depois = await resumoDoPeriodo(U, "mes");
  expect(depois.entrou).toBe(antes.entrou);
  expect(depois.saiu).toBe(antes.saiu);
  expect(depois.saldo).toBe(antes.saldo);
  expect(depois.saldo).toBe(12700); // 18700 - 6000, o número real
});

test("uma transação sem nenhum detalhe do módulo novo continua funcionando", async () => {
  const tx = await createTransaction(U, {
    type: "income",
    amountCents: 5000,
    occurredAt: new Date(),
  });
  expect(tx.id).toBeTruthy();
  const r = await resumoDoPeriodo(U, "mes");
  expect(r.entrou).toBe(23700); // 18700 + 5000
});
```

- [ ] **Passo 2: Rodar**

Rodar: `npx vitest run src/lib/data/nao-regressao.test.ts`
Esperado: PASSA, 2 testes.

- [ ] **Passo 3: Rodar a suíte INTEIRA, para provar que nada quebrou**

```bash
DATABASE_URL="postgresql://postgres:fox@127.0.0.1:55432/fox" \
BETTER_AUTH_SECRET="segredo-so-de-teste-local-0123456789" \
BETTER_AUTH_URL="http://localhost:3111" npx vitest run
```
Esperado: 100% verde, incluindo os 33 testes que já existiam.

- [ ] **Passo 4: Commit**

```bash
git add src/lib/data/nao-regressao.test.ts
git commit -m "test(ganhos): provar que o caixa do Fox nao muda com o modulo novo"
```

---

### Task 5: A tela de ajustes de custo

**Arquivos:**
- Modificar: `src/lib/actions.ts`
- Criar: `src/app/ganhos/ajustes/page.tsx`
- Criar: `src/app/ganhos/ajustes/forma-custos.tsx`

**Interfaces:**
- Consome: `getCustos`, `setCustos` (Task 3)
- Produz: server action `salvarCustos(raw: unknown)` que devolve
  `{ ok: true } | { ok: false, erro: string }` — o mesmo formato de retorno que
  todas as actions do Fox já usam

- [ ] **Passo 1: A server action, seguindo o padrão de `src/lib/actions.ts`**

```ts
const custosSchema = z.object({
  fuelPriceCents: z.number().int().min(0).max(100_000),
  kmPerLiterCenti: z.number().int().min(0).max(20_000),
  maintenanceCentsPerKm: z.number().int().min(0).max(10_000),
  vehicleValueCents: z.number().int().min(0).max(100_000_000_00),
  vehicleLifetimeKm: z.number().int().min(1).max(2_000_000),
  depreciationFactorCenti: z.number().int().min(0).max(100),
  fixedCostCentsPerMonth: z.number().int().min(0).max(100_000_000_00),
  workedDaysPerMonth: z.number().int().min(1).max(31),
  targetCentsPerHour: z.number().int().min(0).max(1_000_000),
  includeReturnTrip: z.boolean(),
});

export async function salvarCustos(raw: unknown) {
  const userId = await sessaoUserId();
  if (!userId) return { ok: false as const, erro: "Não autenticado." };

  const parsed = custosSchema.safeParse(raw);
  if (!parsed.success) return { ok: false as const, erro: "Dados inválidos." };

  try {
    await setCustos(userId, parsed.data);
  } catch {
    return { ok: false as const, erro: "Não foi possível salvar." };
  }

  revalidatePath("/ganhos/ajustes");
  revalidatePath("/ganhos/vale-a-pena");
  return { ok: true as const };
}
```

- [ ] **Passo 2: A página server component**

Segue o mesmo cabeçalho e as mesmas classes de `src/app/metas/page.tsx` — mesmo `<main>`,
mesmo header com "← Voltar", mesmos tokens (`bg-feltro`, `text-creme`, `border-pauta`).

- [ ] **Passo 3: O formulário client**

Todo campo de dinheiro com `inputMode="decimal"`, aceitando vírgula, e formatação por
`formatBRL` de `src/lib/format.ts` — que já existe e já usa `pt-BR`. Alvos de toque de 44px,
como o resto do app.

Mostra, ao vivo, o custo por km resultante: *"Cada km te custa R$ 0,35"*. É o número que dá
sentido a todos os campos acima.

- [ ] **Passo 4: Rodar o build**

Rodar: `npm run build`
Esperado: sem erro e sem warning novo de TypeScript.

- [ ] **Passo 5: Commit**

```bash
git add src/lib/actions.ts "src/app/ganhos/ajustes"
git commit -m "feat(ganhos): tela de ajustes de custo por km"
```

---

### Task 6: A calculadora "vale a pena?"

**Arquivos:**
- Criar: `src/app/ganhos/vale-a-pena/page.tsx`
- Criar: `src/app/ganhos/vale-a-pena/calculadora.tsx`

**Interfaces:**
- Consome: `getCustos` (Task 3), `avaliarRota` (Task 2)

O server component busca os custos **uma vez** e passa para o client. A partir daí a
calculadora é 100% local: reage a cada tecla sem ida ao servidor, porque `avaliarRota` é pura.

- [ ] **Passo 1: Três campos e o veredito**

Valor oferecido, distância, minutos. Sem botão de calcular.

- [ ] **Passo 2: O indicador — decidido por medição**

O brief deixou a **forma** por minha conta e fixou a regra: as três faixas têm que sobreviver
em escala de cinza. Medi os tokens atuais e a restrição §1.4 ("nenhum token de cor novo")
**não sobrevive ao teste**:

| Veredito | Token atual | OKLCH L | Em cinza |
|---|---|---|---|
| RECUSA | `--color-alerta` | 0,710 | 33,4% |
| LIMITE | `--color-brasa` | 0,724 | 35,8% |
| ACEITA | `--color-brilho` | 0,760 | 47,4% |

RECUSA e LIMITE diferem em **0,014 de luminosidade**. O contraste entre o extremo claro e o
escuro é **1,37:1**, quando o mínimo para distinguir elementos gráficos é 3:1. Em cinza, as
duas primeiras faixas são a mesma cor — exatamente o defeito que o brief manda evitar.

**Decisão, em duas camadas que se somam:**

**(a) Três tokens de arco com a luminosidade separada, mantendo os matizes da paleta.** Isto
diverge do §1.4, e diverge de propósito: o objetivo daquela regra é preservar a identidade
verde-feltro, e ela fica preservada — os matizes são exatamente os de `alerta` (33,4°),
`brasa` (55,3°) e `brilho` (154,2°). Só a luminosidade muda. Os valores saíram de uma busca
que maximiza o pior par adjacente:

```css
--veredito-recusa: oklch(0.41 0.15 33.4);   /* #891a00 — a mais escura */
--veredito-limite: oklch(0.79 0.14 55.3);   /* #ffa15c — a mais clara  */
--veredito-aceita: oklch(0.56 0.13 154.2);  /* #1d8a50 — intermediária */
```

Pior par adjacente: **2,17:1** (contra 1,37:1 hoje). RECUSA↔LIMITE chega a 4,73:1.

**(b) Forma, porque só a cor não fecha.** Mesmo otimizado, 2,17:1 ainda fica abaixo de 3:1 —
é um teto físico, com três matizes fixos e croma alto dentro do sRGB. Então a segunda camada
não é enfeite:

| Veredito | Preenchimento |
|---|---|
| RECUSA | sólido |
| LIMITE | listrado a 45° |
| ACEITA | vazado, com contorno grosso |

Padrão sobrevive a escala de cinza, a daltonismo e a sol na tela. Some a cor inteira e as três
continuam distintas.

**(c) A palavra**, grande, que o brief já pede — a terceira redundância.

Detalhe de acabamento: no estado vazado, o texto usa a própria cor do contorno, não a cor de
fundo, senão fica escuro sobre escuro.

- [ ] **Passo 3: As duas linhas de resumo, fixas**

```
sobra R$ 109,32  ·  R$ 72,88 por hora
custo R$ 20,68  ·  292% da meta
```

Duas linhas fixas, para não quebrar mal em 360px. Acima de 200% o indicador satura e o texto
mostra `200%+` — mas a linha de resumo continua com o valor exato, como o brief pede.

- [ ] **Passo 4: A linha que separa operacional de caixa**

Texto secundário, obrigatório pelo §3:

> *Estimativa por km rodado. Não é o seu saldo — o abastecimento entra no saldo no dia em que
> você pagou.*

- [ ] **Passo 5: Verificar em 360px e rodar o build**

```bash
npm run build
```
Mais uma passada em viewport de 360px sem scroll horizontal, e conferir que nenhum input dá
zoom no iOS (`font-size` ≥ 16px, que `globals.css` já garante).

- [ ] **Passo 6: Commit**

```bash
git add "src/app/ganhos/vale-a-pena"
git commit -m "feat(ganhos): calculadora vale a pena, reagindo ao digitar"
```

---

### Task 7: A porta de entrada

**Arquivos:** Modificar `src/app/conta/page.tsx`

- [ ] **Passo 1: Um link igual ao de `/recorrencias`, que já está lá**

```tsx
<Link
  href="/ganhos/vale-a-pena"
  className="flex h-13 items-center justify-between rounded-xl border border-pauta bg-feltro-alto px-4 font-medium text-creme transition hover:border-brilho/50 active:scale-[.98]"
>
  Vale a pena essa corrida?
  <span className="font-serif text-brilho">→</span>
</Link>
```

- [ ] **Passo 2: Build, e conferir a Fase A inteira num navegador**

```bash
npm run build
```

- [ ] **Passo 3: Commit e abrir o PR**

```bash
git add src/app/conta/page.tsx
git commit -m "feat(ganhos): entrada para a calculadora na tela de conta"
```

---

## PARTE 5 — Aceite da Fase A

Do §8 do brief, só o que a Fase A alcança:

- [ ] Saldo, resumo, metas e relatórios com os mesmos números — **provado na Task 4**
- [ ] `transaction` sem nenhuma coluna nova
- [ ] Nenhuma escrita em `householdId`
- [ ] Isolamento entre contas testado na tabela nova — **Task 3**
- [ ] Nenhum token de cor novo · nenhuma fonte nova *(pendente da decisão da Task 6, Passo 2)*
- [ ] Faixas do veredito distinguíveis em escala de cinza
- [ ] Nenhum número com ponto decimal (reusa `src/lib/format.ts`, que já é `pt-BR`)
- [ ] Nenhum input causa zoom no iOS
- [ ] Alvos de toque ≥ 44×44px
- [ ] Casos de borda testados: `kmPerLiter=0`, `minutos=0`, `workedDays=0`, oferta < custo,
      `kmTotal=0` — **Task 2**
- [ ] Em nenhuma tela o resultado operacional aparece como "saldo"
- [ ] `npm run build` sem erro nem warning novo

Itens do §8 que só as Fases B e C alcançam, e que **não** valem como aceite agora: detalhe
órfão impossível, soft delete fora dos agregados novos, transação sem detalhe funcionando.

---

## PARTE 6 — As quatro dúvidas, resolvidas

Nenhuma ficou em aberto. Três foram decididas por verificação, uma por medição.

| # | Dúvida | Resolução |
|---|---|---|
| 1 | Como marcar um lançamento "de app"? | **Pela existência do `rideDetail`**, não por categoria. Toggle "Foi corrida de app?" no formulário. Não mexe em `category`, e não depende do seed. (Conflito E) |
| 2 | Tokens novos ou redundância por forma? | **Os dois.** Medi: os tokens atuais dão 1,37:1 em cinza. Três tokens de arco com matiz preservado sobem para 2,17:1, e a forma cobre o resto. (Task 6, Passo 2) |
| 3 | O seed já rodou em produção? | **Não.** Verificado ao vivo: só as 13 categorias antigas existem. Deixou de bloquear por causa da decisão 1. (Conflito H) |
| 4 | Sigo a convenção real do repo? | **Sim.** A do §1.6 não bate com o código. Schema e data layer em inglês, actions e componentes em português. (Conflitos A, B, C) |

A única divergência do brief que quero deixar em destaque, porque é deliberada: **os três
tokens de cor do veredito contrariam a letra do §1.4.** Cumprir "nenhum token novo" e
"distinguível em cinza" ao mesmo tempo é impossível — os tokens que existem dão 1,37:1. Preservei
o espírito da regra (identidade verde-feltro, matizes intactos) e abri mão da letra. Se preferir
o contrário, é só dizer: fico só na camada de forma e o arco usa os tokens atuais.

Nada de código foi editado. Aguardando o "pode ir".
