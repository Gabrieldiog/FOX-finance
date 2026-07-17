// As tabelas de autenticação (user, session, account, verification) são geradas
// pelo Better Auth em auth-schema.ts. As tabelas do Fox (transações, categorias)
// entram aqui no T03, sempre escopadas por usuário.
export * from "./auth-schema";
