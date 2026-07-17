import Link from "next/link";

export default function Privacidade() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-4 px-6 py-8">
      <Link href="/" className="text-sm text-nevoa-fraca transition hover:text-nevoa">
        Voltar
      </Link>
      <h1 className="font-display text-2xl font-semibold tracking-tight">Privacidade</h1>
      <div className="flex flex-col gap-3 text-sm leading-6 text-nevoa-fraca">
        <p>
          O Fox guarda só o necessário pra funcionar: seu nome, seu e-mail e os lançamentos que você
          anota. Nada de CPF, telefone ou endereço.
        </p>
        <p>
          Seus dados são seus. Na tela de Conta você pode <strong className="text-nevoa">exportar tudo</strong> em
          JSON e <strong className="text-nevoa">excluir sua conta</strong> a qualquer momento — a exclusão apaga de
          verdade seus lançamentos e seu cadastro.
        </p>
        <p>
          A senha é guardada com hash forte (Argon2id); ninguém, nem a gente, consegue ver sua senha.
          Os dados ficam num banco em nuvem com criptografia em repouso.
        </p>
        <p>
          Este é um projeto pessoal de portfólio, sem fins comerciais e sem compartilhamento de dados
          com terceiros.
        </p>
      </div>
    </main>
  );
}
