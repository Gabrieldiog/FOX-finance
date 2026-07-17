# Deploy (Vercel + Supabase)

O Fox é um app Next.js; a Vercel detecta tudo sozinha. O único cuidado é a conexão com o Postgres no serverless.

## 1. Banco (Supabase)

Em produção, use a **connection string do POOLER** (transaction mode), não a conexão direta — a Vercel é serverless e a direta esgota conexão rápido. No painel do Supabase: **Project Settings → Database → Connection string → Transaction** (porta `6543`, host `...pooler.supabase.com`).

O código já usa `prepare: false` + `max: 1`, que é o que o pooler transaction exige.

## 2. Vercel

1. **Importe** o repositório `FOX-finance` na Vercel (o framework Next.js é auto-detectado, sem config).
2. Em **Settings → Environment Variables**, defina:

| Variável | Valor |
|---|---|
| `DATABASE_URL` | a string do **pooler** do Supabase (transaction, `6543`) |
| `BETTER_AUTH_SECRET` | um segredo forte — gere com `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | a URL de produção (ex.: `https://fox-finance.vercel.app`) |
| `ALLOWED_EMAILS` | os e-mails que podem criar conta, separados por vírgula |

3. **Deploy.**

## 3. Depois do deploy

- As categorias globais só precisam ser semeadas **uma vez por banco**. Se o banco de produção for o mesmo do desenvolvimento, elas já estão lá; se for um banco novo, rode:
  `DATABASE_URL="<string do pooler>" node --experimental-strip-types scripts/seed.ts`
- As pessoas convidadas criam a conta em `/criar-conta` (só quem estiver em `ALLOWED_EMAILS`).

## Pendências conscientes (pós-lançamento)

- Verificação de e-mail (Resend) e rate limit de login mais apertado.
- RLS no Postgres como 2ª camada (hoje o isolamento é aplicacional e coberto por teste).
