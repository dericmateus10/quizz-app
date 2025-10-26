# Documentação da Aplicação Quizz App

Este documento descreve o funcionamento da aplicação, os fluxos principais, as integrações com IA e os pontos de atenção para evolução do projeto.

## Visão Geral

- Aplicação web que permite criar quizzes com múltiplas perguntas e alternativas.
- Foco em acelerar a produção de avaliações com ajuda de IA generativa.
- Resultado pode ser exportado em Markdown (download automático) e PDF (via API interna).

## Fluxo do Usuário

1. **Página inicial (`/`)** apresenta um call-to-action para abrir o criador de quizzes e link para a documentação de regras internas.
2. **Criador de quiz (`/quizzes/new`)** exibe:
   - Prompt opcional para geração assistida por IA.
   - Upload opcional de arquivo Markdown que serve de base para a IA.
   - Formulário completo de edição manual (título, descrição, perguntas, alternativas, imagens).
   - Pré-visualização em JSON dos dados retornados pela IA e do payload normalizado.
3. **Downloads**:
   - Botão `Salvar quiz` faz download imediato do conteúdo em Markdown.
   - Botão `Exportar PDF` envia os dados para o endpoint `/api/quizzes/export` e baixa o PDF gerado.

## Arquitetura

### Front-end

- **Next.js 15 (App Router)**: rotas em `src/app`, combinando componentes server/client conforme necessidade de estado.
- **React 19** com `use client` nos componentes interativos.
- **React Hook Form + Zod**: validações centralizadas em `src/app/quizzes/new/schema.ts`.
- **Shadcn UI + Tailwind CSS 4**: UI consistente e theming definido em `src/app/globals.css`.

### APIs internas

- `POST /api/quizzes/generate`: usa AI SDK + OpenAI para gerar quizzes via streaming.
- `POST /api/quizzes/export`: monta PDF com `pdfkit` utilizando fontes locais (`public/fonts`).

### Fluxo de dados

1. Usuário interage com formulário (`CreateQuizForm`).
2. Geração assistida chama `useObject` que envia prompt/Markdown para `/api/quizzes/generate`.
3. Resposta parcial atualiza pré-visualização em JSON; ao finalizar, o formulário é preenchido automaticamente.
4. Ao salvar, os dados normalizados são usados para gerar Markdown localmente e PDF remotamente.

## Tecnologias Principais

| Camada            | Tecnologia                      | Uso principal                                               |
| ----------------- | -------------------------------- | ----------------------------------------------------------- |
| Framework         | Next.js 15 (App Router)          | Renderização híbrida, rotas e APIs internas                 |
| UI                | React 19 + Shadcn UI + Tailwind  | Componentização e estilização utilitária                    |
| Formulários       | React Hook Form + Zod            | Controle e validação de campos, inclusive arrays dinâmicos  |
| IA                | AI SDK (`@ai-sdk/react`, `ai`)   | Streaming de objetos a partir da OpenAI Responses API       |
| Geração de PDFs   | `pdfkit`                         | Renderização de quizzes em formato PDF                      |
| Tipagem           | TypeScript                       | Garantia de tipos em todo o projeto                         |

## Estrutura de Pastas Relevante

```
src/
  app/
    page.tsx                      # Landing page
    quizzes/
      new/                        # Fluxo de criação
        _components/
          create-quiz-form.tsx    # Formulário principal
          question-fields.tsx     # Bloco de perguntas/alternativas
        schema.ts                 # Schemas Zod e helpers
    api/
      quizzes/
        generate/route.ts         # Endpoint de IA
        export/route.ts           # Endpoint de exportação em PDF
    docs/
      regras/page.tsx             # Renderiza REGRAS_PROJETO.md na web
docs/
  REGRAS_PROJETO.md               # Convenções internas
  DOCUMENTACAO.md                 # Documentação da aplicação (este arquivo)
public/
  fonts/Roboto-*.ttf              # Fontes usadas no PDF
```

## Formulário de Quiz

- **Informações gerais**: título (obrigatório) e descrição (opcional).
- **Perguntas dinâmicas**: adiciona/remove blocos com contexto, comando, alternativas, sugestão de imagem e upload de imagem.
- **Alternativas**:
  - Mínimo de duas alternativas por pergunta.
  - Campo `correctAnswer` marca o índice da resposta correta.
  - Alternativas podem ser removidas/adicionadas dinamicamente.
- **Uploads de imagem**:
  - Formatos aceitos: PNG, JPG, GIF, WEBP.
  - Tamanho máximo: 2 MB (`MAX_QUESTION_IMAGE_SIZE`).
  - Imagem é armazenada em Data URL para posterior envio ao PDF.
- **Pré-visualizações**:
  - `Pré-visualização em tempo real`: mostra os dados parciais que chegam da IA.
  - `Pré-visualização do payload`: exibe JSON normalizado gerado a partir do formulário.

## Geração Assistida por IA

- Componente `CreateQuizForm` usa `useObject` para consumir `/api/quizzes/generate`.
- O usuário informa:
  - **Prompt** livre descrevendo tema, nível, quantidade de perguntas, etc.
  - **Arquivo Markdown opcional** (até 512 KB) que serve de base de conhecimento.
- O endpoint limita o conteúdo do Markdown a 20.000 caracteres antes de enviar ao modelo (`MAX_MARKDOWN_LENGTH`).
- A resposta é transmitida via streaming e validada pelo `quizSchema`. Ao finalizar, o formulário é preenchido com os dados completos.
- Possíveis erros informados ao usuário:
  - Prompt/arquivo ausentes.
  - Falhas de autenticação com OpenAI (chave inválida ou modelo não compatível com streaming).
  - Problemas de rede ou limitações do modelo.

### Prompt do sistema

O arquivo `generate/route.ts` define um prompt de sistema que reforça:

- Responder sempre em JSON aderente ao `quizSchema`.
- Manter coerência com o tema e índices corretos para `correctAnswer`.
- Fornecer `imageHint` sugestivo para cada pergunta.

## Exportações

### Download em Markdown

- Acionado ao enviar o formulário (`Salvar quiz`).
- Gera arquivo `.md` estruturado com título, descrição, blocos de perguntas, alternativas marcadas e metadados de imagem.
- Arquivo é baixado diretamente pelo navegador (uso de `Blob` + `URL.createObjectURL`).

### Exportação para PDF

- Botão `Exportar PDF` valida o formulário e envia JSON para `/api/quizzes/export`.
- Restrições:
  - Fontes `Roboto-Regular.ttf` e `Roboto-Bold.ttf` devem existir em `public/fonts`.
  - Caso a validação falhe, o endpoint retorna erro 400.
  - Em falha de geração, retorna 500 com mensagem tratada.
- PDF inclui:
  - Cabeçalho com título, descrição e data/hora de geração (formato `pt-BR`).
  - Instruções iniciais e cada questão numerada.
  - Contexto (quando informado), comando e alternativas com letras A, B, C...
  - Imagens centralizadas (quando enviadas) com ajuste proporcional máximo de 240px de altura.

## Endpoints

### `POST /api/quizzes/generate`

- **Autenticação**: requer `OPENAI_API_KEY` configurada no ambiente.
- **Body JSON**:

  ```json
  {
    "prompt": "string opcional",
    "markdown": "conteúdo markdown opcional"
  }
  ```

- **Respostas**:
  - `200 OK` (stream): objetos parciais seguindo `quizSchema`.
  - `400 Bad Request`: ausência de prompt/markdown ou modelo sem suporte a streaming.
  - `500 Internal Server Error`: problemas com a IA ou chave ausente.

### `POST /api/quizzes/export`

- **Body JSON**: deve seguir exatamente `quizSchema`. O front envia dados serializados via `form.getValues()`.
- **Respostas**:
  - `200 OK`: retorna PDF (`Content-Type: application/pdf`) com `Content-Disposition` para download.
  - `400 Bad Request`: dados inválidos de acordo com Zod.
  - `500 Internal Server Error`: falha ao localizar fontes ou gerar o PDF.

## Validações e Limites

- `quizSchema` garante:
  - Título obrigatório.
  - Pelo menos uma pergunta.
  - Cada pergunta com comando obrigatório, mínimo de duas alternativas e `correctAnswer` dentro do intervalo.
  - Contexto limitado a 1.500 caracteres; sugestão de imagem até 400 caracteres.
- Uploads:
  - Markdown: 512 KB no cliente; 20.000 caracteres enviados à IA.
  - Imagens: 2 MB por pergunta.

## Configuração e Variáveis de Ambiente

- Necessário criar `.env.local` com:

  ```
  OPENAI_API_KEY=chave-da-openai
  OPENAI_MODEL=gpt-4o-mini # opcional, padrão já configurado
  ```

- Caso `OPENAI_MODEL` não seja informado, usa `gpt-4o-mini`. Deve suportar `Responses API` com streaming de objetos.

## Scripts Disponíveis (`package.json`)

- `pnpm dev`: inicia ambiente de desenvolvimento com Turbopack.
- `pnpm build`: gera build de produção (Turbopack).
- `pnpm start`: executa servidor Next.js já compilado.

## Estilo e Componentização

- Tailwind 4 com `@layer base` configura tokens utilizando espaço de cor OKLCH.
- Tema claro/escuro controlado por classes `.dark`.
- Componentes Shadcn UI ficam em `src/components/ui`; personalizados podem evoluir para `src/components`.
- Animações utilitárias disponíveis via `tw-animate-css`.

## Documentação Complementar

- Convenções de contribuição, fluxo de PRs e regras internas estão em `docs/REGRAS_PROJETO.md` e acessíveis via `/docs/regras`.

## Próximos Passos Recomendados

- Adicionar persistência (ex.: banco ou API externa) para armazenar quizzes gerados.
- Implementar testes unitários e de integração quando fluxos adicionais forem introduzidos.
- Criar monitoramento para falhas de geração/exportação (ex.: logging estruturado, alertas).
- Oferecer página pública de listagem/execução de quizzes para usuários finais.
