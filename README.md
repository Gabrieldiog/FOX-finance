# Fox

Gestão financeira pessoal. Anotar um gasto ou um ganho tem que ser mais rápido que rabiscar num papel, e o resumo da semana e do mês tem que se entender num relance. É isso que o Fox faz: simples de usar por fora, seguro de verdade por dentro.

Projeto de portfólio com uso real — poucas contas, cada pessoa com o próprio dinheiro, dados privados de gente de verdade. Por isso a segurança aqui não é enfeite: é requisito.

**Ao vivo:** em breve (em construção).

## O que faz

- **Lançar em segundos.** Uma tela de "valor primeiro", com teclado de centavos e categoria num toque. No caso comum, é digitar o valor e salvar.
- **Resumo que responde na hora.** "Sobrou ou faltou?" em um número, o trio entrou / saiu / saldo, e para onde o dinheiro foi — alternando entre semana e mês.
- **Cada um no seu canto.** Contas separadas e privadas: ninguém vê o dinheiro de ninguém.

## Segurança (o centro do projeto)

- **Autenticação madura, não caseira.** Sessão guardada no banco (revogável), senha com Argon2id, cadastro por convite.
- **Isolamento por usuário.** Todo dado é lido pelo `user_id` da sessão, nunca por um id vindo do cliente — e um teste prova que uma conta não alcança a da outra.
- **Dinheiro em centavos inteiros**, validação sempre no servidor, segredos fora do código.
- **LGPD proporcional.** Coleta mínima (só o necessário), com exportar e excluir a conta de verdade.

## Stack

Next.js (App Router, TypeScript) · Better Auth · PostgreSQL · Drizzle ORM · Vercel · Resend (e-mail).

Banco próprio e isolado — dado financeiro privado não se mistura com nenhum outro serviço.

## Rodando local

Precisa de Node e de uma connection string do Postgres (Supabase).

```bash
cp .env.example .env.local          # cole a DATABASE_URL do Supabase e gere um segredo: openssl rand -base64 32
npm install
npm run dev                         # http://localhost:3000
```

Health check em `GET /api/health`.

## Status

Em construção, backend antes do frontend. Já de pé: o esqueleto, a validação de ambiente, o health check, a **autenticação**, o **isolamento de dados por usuário** (com testes provando que uma conta não vê a da outra), e agora o **lançamento** (tela "valor primeiro") o **resumo** da semana/mês — "Sobrou/Faltou", com o quanto entrou, saiu e para onde foi —, **editar e excluir** lançamentos (com a lista dos últimos no dashboard), **LGPD** — exportar seus dados em JSON e excluir a conta de verdade (com política curta) —, um **PWA instalável** (vai pra tela inicial do celular como app), e agora o **visual profissional**: a identidade Fox (grafite quente + âmbar, tipografia Fraunces + Hanken Grotesk), tema claro e escuro, e as animações — o saldo sobe contando ao abrir. **Pronto pra publicar** — o passo a passo está no [DEPLOY.md](DEPLOY.md).
