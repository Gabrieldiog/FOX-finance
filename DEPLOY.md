# Deploy (Vercel + Supabase)

O Fox é um app Next.js; a Vercel detecta tudo sozinha. O único cuidado é a conexão com o Postgres no serverless.

## 1. Banco (Supabase)

Em produção, use a **connection string do POOLER** (transaction mode), não a conexão direta — a Vercel é serverless e a direta esgota conexão rápido. No painel do Supabase: **Project Settings → Database → Connection string → Transaction** (porta `6543`, host `...pooler.supabase.com`).

O código usa `prepare: true` + `max: 3` + `fetch_types: false` (ver os comentários em `src/db/index.ts`). O Supavisor aceita prepared statements em transaction mode, e é isso que mantém o pipelining ligado — com `prepare: false`, quatro queries em paralelo custavam 8,5 idas ao banco em vez de 1,1.

**A região importa mais que tudo.** O `vercel.json` fixa a função em `gru1` (São Paulo), do lado do banco em `sa-east-1`. Antes disso a função rodava em `iad1` (Washington) e cada query cruzava o continente. Se um dia você mudar a região do banco, mude a do `vercel.json` junto — dá pra conferir pelo header `X-Vercel-Id`, que deve mostrar `gru1::gru1`.

## 2. Vercel

1. **Importe** o repositório `FOX-finance` na Vercel (o framework Next.js é auto-detectado, sem config).
2. Em **Settings → Environment Variables**, defina:

| Variável | Valor |
|---|---|
| `DATABASE_URL` | a string do **pooler** do Supabase (transaction, `6543`) |
| `BETTER_AUTH_SECRET` | um segredo forte — gere com `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | a URL de produção (ex.: `https://fox-finance.vercel.app`) |

3. **Deploy.**

## 3. Depois do deploy

- As categorias globais só precisam ser semeadas **uma vez por banco**. Se o banco de produção for o mesmo do desenvolvimento, elas já estão lá; se for um banco novo, rode:
  `DATABASE_URL="<string do pooler>" node --experimental-strip-types scripts/seed.ts`
- Qualquer pessoa cria a conta em `/criar-conta` — cada uma com seu espaço isolado das outras.

## Pendências conscientes (pós-lançamento)

- Verificação de e-mail (Resend).
- RLS no Postgres como 2ª camada (hoje o isolamento é aplicacional e coberto por teste).
- Considerar o firewall da Vercel (Attack Challenge Mode) se aparecer flood de verdade.
