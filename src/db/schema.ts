// As tabelas de autenticação (user, session, account, verification) são geradas
// pelo Better Auth em auth-schema.ts. As tabelas do Fox (transações, categorias)
// vivem em app-schema.ts, sempre escopadas por usuário.
export * from "./auth-schema";
export * from "./app-schema";
