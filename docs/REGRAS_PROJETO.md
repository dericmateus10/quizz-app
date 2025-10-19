# Regras do Projeto

Documento vivo com orientações para desenvolvimento colaborativo do Quizz App. Sempre que novas práticas forem adotadas, atualize esta página.

## Fluxo de trabalho

- **Branch principal:** `main` deve permanecer estável e sempre pronta para produção.
- **Branches de feature:** nomeie como `feature/<descricao-curta>`. Use `fix/`, `refactor/` ou `chore/` para outros tipos de mudanças.
- **Pull Requests:** associe a issue correspondente, descreva claramente o objetivo e liste verificações executadas (build, testes, screenshots, etc.).

## Commits

- Utilize o padrão [Conventional Commits](https://www.conventionalcommits.org/pt-br/v1.0.0/) (ex.: `feat: adiciona fluxo de perguntas`).
- Commits devem ser pequenos, focados e conter descrição clara do impacto.
- Evite `commit --amend` após o código ser revisado para não dificultar o histórico.

## Estilo de código

- **TypeScript:** habilite `strict` sempre que possível ao criar arquivos. Prefira tipos explícitos em props e retornos de hooks.
- **React / Next.js:** aproveite componentes server-side por padrão; use client components somente quando precisar de estado ou interações no navegador.
- **Tailwind CSS:** padronize estilos usando utilitários; abstraia com componentes somente quando padrões se repetirem muito.
- **ShadCN UI:** mantenha os componentes gerados em `src/components/ui`; alterações globais devem ser feitas via tokens/variáveis. Para personalizações extensas, copie o componente para fora da pasta `ui` e documente a decisão.
- **Acessibilidade:** garanta `aria-*`, labels e contraste adequados em novos componentes.

## Qualidade e testes

- Execute `pnpm build` antes de abrir PR para garantir que a aplicação compila sem erros.
- Assim que a camada de testes for adicionada, torne a execução dos testes parte obrigatória do checklist.
- Documente cenários de teste manual relevantes na descrição do PR.

## Revisões

- Toda alteração deve passar por pelo menos uma revisão.
- Responda aos comentários diretamente na thread, detalhando a solução escolhida ou justificando exceções.
- Prefira merge com squash para manter o histórico linear.

## Gestão de dependências

- Priorize `pnpm` para instalar pacotes. Se usar outro gerenciador, atualize todos os arquivos de lock correspondentes.
- Mantenha dependências atualizadas periodicamente; ao subir versões maiores, documente impactos no README.

## Segurança e boas práticas

- Jamais faça commit de chaves, senhas ou dados sensíveis. Use variáveis de ambiente e `.env.local`, nunca commitado.
- Revise permissões de bibliotecas externas e avalie licenças antes de adicionar novas dependências.
- Garanta que novas rotas ou APIs façam validação de entrada e tratem erros de forma controlada.

## Documentação

- Atualize o README e demais arquivos em `docs/` sempre que novas funcionalidades, decisões arquiteturais ou processos forem definidos.
- Mantenha changelog ou release notes quando as versões começarem a ser cortadas.

## Dúvidas

Centralize discussões no repositório (issues ou discussões). Em caso de definições urgentes, registre a decisão posteriormente para manter rastreabilidade.
