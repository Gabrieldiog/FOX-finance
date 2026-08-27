# Decisões

Registro das escolhas que não são óbvias pelo código, com o motivo. Quem chegar depois lê
aqui em vez de adivinhar.

## 2026-08-27 — Módulo "Ganhos de app"

### Idioma dos identificadores

Schema e camada de dados em inglês; server actions e componentes em português. É a convenção
que o Fox já pratica — `createTransaction` na `src/lib/data/`, `criarLancamento` em
`actions.ts`, `item-lancamento.tsx` nos componentes. A regra observada é: quanto mais perto do
banco, mais inglês; quanto mais perto da tela, mais português.

O brief pedia "tudo em inglês", mas isso não descrevia o repositório.

### Enums

`text` mais uma `check()` constraint, como as outras tabelas. O projeto não usa `pgEnum` em
lugar nenhum, e o catálogo fechado de formas de pagamento (`src/lib/categorias.ts`) já
estabelece esse padrão com ids minúsculos.

### Números que não são dinheiro

Inteiros escalados, com a unidade no nome — `distanceMeters`, `milliliters`,
`kmPerLiterCenti` — nunca `decimal`.

Dois motivos: o Drizzle devolve `decimal` como **string**, o que espalharia `Number(...)` por
toda a camada de cálculo; e o projeto inteiro evita ponto flutuante em dado persistido, pela
mesma razão que o dinheiro é centavo inteiro.

### Taxas versus dinheiro

Custo por km é uma **taxa**, não um valor, e vive em ponto flutuante na memória. Só o
resultado final em dinheiro é arredondado para centavo inteiro, com `Math.round`, e nunca
antes: arredondar a taxa acumularia erro a cada quilômetro.

### O que marca um lançamento como "de app"

A existência do `rideDetail`, **não a categoria**.

O brief propunha usar a categoria "Corridas" como âncora. Três coisas desaconselham: a
categoria é global e alguém pode criar uma privada com o mesmo nome; renomear a global
quebraria o módulo em silêncio; e a categoria nem existia em produção quando isto foi escrito
(o `db:seed` é comando manual e não tinha rodado).

A plataforma no `rideDetail` já responde a pergunta melhor. A categoria fica livre — quem
quiser usar "Corridas" usa, quem preferir outra também.

### As cores do veredito

Três tokens novos, com os matizes da paleta preservados e só a luminosidade separada.

Isto **contraria a letra** da restrição "nenhum token de cor novo", de propósito. Os tokens que
existem dão contraste de **1,37:1** entre as faixas em escala de cinza (`alerta` L=0,710,
`brasa` L=0,724, `brilho` L=0,760) — o mínimo para distinguir elementos gráficos é 3:1. Em
cinza, RECUSA e LIMITE são a mesma cor, e o medidor deixa de informar exatamente para quem tem
daltonismo vermelho-verde.

O espírito da regra — manter a identidade verde-feltro — fica preservado: os matizes continuam
sendo os de `alerta` (33,4°), `brasa` (55,3°) e `brilho` (154,2°).

```
--veredito-recusa: oklch(0.41 0.15 33.4)    a mais escura
--veredito-limite: oklch(0.79 0.14 55.3)    a mais clara
--veredito-aceita: oklch(0.56 0.13 154.2)   intermediária
```

Isso sobe o pior par para 2,17:1. Como ainda fica abaixo de 3:1 — teto físico com três matizes
fixos dentro do sRGB —, o preenchimento entra como segunda camada: sólido, listrado e vazado.
Some a cor inteira e as três continuam distinguíveis.

### Cor de arco não serve como cor de texto

Medido: os tons do arco sobre a superfície do card dão **3,18:1** (aceita) e **1,46:1**
(recusa) — ilegíveis como texto, que precisa de 4,5:1.

Isso importa para quando o módulo financeiro precisar de `--lucro` e `--custo`: eles **não**
podem reusar os tons de arco. O Fox já tem `--color-brilho` e `--color-alerta`, que são as
versões claras e já são o que ele usa hoje para valores que entram e saem. São essas.

A regra geral: preencher uma área grande e escrever uma palavra sobre fundo escuro pedem
luminosidades diferentes da mesma cor.
