# Fox Finance

Gestão financeira pessoal. Anotar um gasto ou um ganho tem que ser mais rápido que rabiscar num papel, e o resumo da semana e do mês tem que se entender num relance. É isso que o Fox Finance faz: simples de usar por fora, seguro de verdade por dentro.

Projeto de portfólio com uso real — poucas contas, cada pessoa com o próprio dinheiro, dados privados de gente de verdade. Por isso a segurança aqui não é enfeite: é requisito.

**Ao vivo:** [fox-finance.vercel.app](https://fox-finance.vercel.app)

## O que faz

- **Lançar em segundos.** Uma tela de "valor primeiro", com teclado de centavos e categoria num toque. No caso comum, é digitar o valor e salvar.
- **Resumo que responde na hora.** "Sobrou ou faltou?" em um número, o trio entrou / saiu / saldo, e para onde o dinheiro foi — alternando entre semana e mês.
- **Cada um no seu canto.** Contas separadas e privadas: ninguém vê o dinheiro de ninguém.

## Segurança (o centro do projeto)

- **Autenticação madura, não caseira.** Sessão guardada no banco (revogável), senha com Argon2id; cadastro aberto, com cada conta totalmente isolada das outras.
- **Isolamento por usuário.** Todo dado é lido pelo `user_id` da sessão, nunca por um id vindo do cliente — e um teste prova que uma conta não alcança a da outra.
- **Trava de força bruta.** 5 senhas erradas seguidas bloqueiam o login da conta por 10 minutos — mesmo que o ataque venha distribuído de vários IPs. Coberto por teste de integração.
- **Senha fácil não entra.** O cadastro barra as senhas mais vazadas do mundo (dicionário com reforço BR), sequências de teclado e senhas parecidas com o próprio e-mail — com o motivo explicado na tela.
- **Robô não passa do formulário.** Honeypot nos formulários de entrar/criar conta, e rate limit por IP persistido no banco (janela sobrevive ao serverless da Vercel), mais apertado nos endpoints de auth.
- **SQL injection não morde.** Toda consulta é parametrizada pelo ORM — e um teste tenta injetar `DROP TABLE` de verdade pra provar que vira texto inofensivo.
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

No ar e em evolução, backend antes do frontend. Já de pé: a **autenticação** e o **isolamento de dados por usuário** (com testes provando que uma conta não vê a da outra), o **lançamento** (tela "valor primeiro") e o **resumo** da semana/mês — "Sobrou/Faltou", com o quanto entrou, saiu e para onde foi —, **editar e excluir** lançamentos, **LGPD** (exportar em JSON e excluir a conta de verdade), um **PWA instalável**, o **endurecimento de segurança** (trava de força bruta, dicionário de senhas fáceis, honeypot e rate limit no banco), e agora a **identidade Fox Finance**: verde e branco, a raposa mascote que segue o mouse e reage ao formulário, tipografia Baloo 2 + Nunito + Inter, tema claro e escuro, e responsividade cuidada pro iPhone (safe-area, sem zoom em input, teclado tratado). **No ar** — o passo a passo de deploy está no [DEPLOY.md](DEPLOY.md).
