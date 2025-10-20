# Quizz App

Aplicação web de quiz construída com Next.js 15, React 19 e Tailwind CSS 4. O projeto está em fase inicial e serve como base para evoluir rapidamente para uma experiência de perguntas e respostas customizável.

## Visão geral

- **Stack:** Next.js (App Router), React, TypeScript, Tailwind CSS e ShadCN UI.
- **Renderização:** componentes React server/client conforme a necessidade de estado.
- **Estilos:** utilitários do Tailwind definidos em `src/app/globals.css`.
- **Empacotamento:** Turbopack habilitado por padrão para desenvolvimento (`next dev --turbopack`).

## Requisitos

- Node.js 20 LTS (ou superior compatível com Next.js 15).
- PNPM 9+ (recomendado; o arquivo `pnpm-lock.yaml` já está versionado).

## Instalação e execução

```bash
pnpm install     # instala dependências
pnpm dev         # levanta o servidor em http://localhost:3000
```

Outros scripts úteis:

- `pnpm build` – gera a versão de produção.
- `pnpm start` – executa o servidor em modo produção após o build.

> Caso prefira npm, ajuste os comandos (`npm install`, `npm run dev`, etc.). Use apenas um gerenciador de pacotes por vez para evitar conflitos de lockfile.

### Variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto com:

```bash
OPENAI_API_KEY=...
# Opcional: sobrescreve o modelo padrão (gpt-4o-mini)
OPENAI_MODEL=gpt-4o-mini
```

- `OPENAI_API_KEY`: chave pessoal da OpenAI com permissão para usar o modelo desejado (Responses API com streaming).
- `OPENAI_MODEL` (opcional): informe outro modelo compatível com streaming caso queira alterar o padrão. Se o modelo não suportar streaming, a aplicação exibirá um erro orientando o ajuste.

Após alterar o `.env.local`, reinicie o servidor de desenvolvimento.

## Estrutura do projeto

```
src/
  app/
    layout.tsx     # layout raiz usando App Router
    page.tsx       # landing com atalhos de navegação
    quizzes/
      new/
        _components/
          create-quiz-form.tsx  # formulário de criação usando React Hook Form + shadcn/ui
          question-fields.tsx   # bloco reutilizável de perguntas e alternativas
        schema.ts               # esquemas Zod e defaults do formulário
        page.tsx                # rota que orquestra o formulário e layout
    api/
      quizzes/
        generate/route.ts       # endpoint que usa AI SDK + OpenAI para gerar quizzes via streaming
        export/route.ts         # gera PDF objetivo com o conteúdo do quiz
    docs/
      regras/
        page.tsx   # exibe docs/REGRAS_PROJETO.md na aplicação
  components/
    ui/            # componentes gerados pelo ShadCN UI
  globals.css      # estilos compartilhados em Tailwind
docs/
  REGRAS_PROJETO.md
public/
  ...              # ícones, imagens e manifestos da aplicação
```

- Componentes compartilhados futuros devem ficar em `src/components`.
- Recursos estáticos (imagens, ícones) residem em `public/`.
- Scripts de automação ou utilitários podem ser organizados em `scripts/` quando necessários.

## Desenvolvimento

1. Crie uma branch a partir da `main` seguindo a convenção descrita nas [regras do projeto](docs/REGRAS_PROJETO.md).
2. Implemente novas telas ou lógicas em componentes desacoplados e reutilizáveis.
3. Documente comportamentos relevantes no README ou em arquivos específicos em `docs/`.
4. Execute os scripts de verificação antes de abrir merge requests. No momento, priorize `pnpm build` para garantir que o projeto continua compilando.

## Geração de quizzes com IA

A tela de criação de quiz (`/quizzes/new`) conta com um prompt acima do formulário. Ao enviar instruções, a aplicação:

- Usa o hook `useObject` do AI SDK para acompanhar o streaming da resposta.
- Exibe um painel de progresso e uma pré-visualização parcial enquanto o modelo “pensa”.
- Preenche automaticamente o formulário ao final, permitindo ajustes manuais e download do markdown.
- Aceita um arquivo `.md` opcional de até 512 KB; o conteúdo serve como base para as perguntas geradas.
- Exporta o quiz preenchido para PDF (botão “Exportar PDF”), ideal para aplicações como provas objetivas impressas.
- Sugere, para cada pergunta, uma imagem relevante via campo `imageHint` e permite anexar arquivos (PNG/JPG/GIF/WEBP até 2 MB) diretamente no formulário.

O endpoint responsável (`/api/quizzes/generate`) utiliza `streamObject` com o modelo configurado via `OPENAI_MODEL`. Certifique-se de que sua organização OpenAI está verificada, que o modelo suporta streaming de objetos e que o arquivo enviado (quando houver) esteja dentro do limite suportado.

Para exportar o PDF, a aplicação chama `/api/quizzes/export`, que valida os dados do formulário e monta um documento A4 com título, descrição, perguntas numeradas, alternativas (A-D, etc.), espaço para respostas e (quando houver) imagens anexadas e sugestões.
Os arquivos de fonte usados na geração (`public/fonts/Roboto-Regular.ttf` e `public/fonts/Roboto-Bold.ttf`) já estão versionados; mantenha-os no repositório para evitar erros de font no PDF.

## Tailwind CSS

O Tailwind 4 não requer o arquivo `tailwind.config.js` para a maioria dos casos simples. Ajustes adicionais podem ser feitos via `postcss.config.mjs` se necessários. Utilize classes utilitárias para manter consistência de design.

## Componentes ShadCN UI

- Inicialize o kit com `pnpm dlx shadcn@latest init -y` (executar apenas uma vez).
- Adicione novos componentes com `pnpm dlx shadcn@latest add <componente>`; os arquivos serão gerados em `src/components/ui`.
- Mantenha tokens de tema e variações no arquivo `src/app/globals.css` ou em camadas específicas, seguindo a documentação oficial.
- Sempre que atualizar tokens de cor ou tipografia, valide o impacto em modo claro/escuro.

## Documentação e regras

As regras de contribuição, convenções de nomenclatura e checklist para PRs estão documentadas em [`docs/REGRAS_PROJETO.md`](docs/REGRAS_PROJETO.md). Mantenha esse documento atualizado sempre que novas práticas forem adotadas.

## Roadmap inicial sugerido

- Definir o modelo de dados do quiz (perguntas, alternativas, tempos).
- Implementar fluxo básico de perguntas e respostas com feedback visual.
- Persistir progresso do usuário usando storage local ou API.
- Adicionar testes automatizados (unitários e e2e) assim que a base funcional estiver estável.

Contribuições são bem-vindas! Atualize este README com quaisquer decisões arquiteturais ou ferramentas adicionadas ao projeto.
