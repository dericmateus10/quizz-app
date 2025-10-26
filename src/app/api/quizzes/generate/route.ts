import { streamObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

import { quizSchema } from "@/app/quizzes/new/schema";

const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const DEFAULT_MODEL = "gpt-4o-mini";
const MAX_MARKDOWN_LENGTH = 20_000;

const SYSTEM_PROMPT = `
Você é um especialista na elaboração de itens avaliativos para cursos técnicos brasileiros.
Sempre retorne um JSON que respeite rigorosamente o schema fornecido, contendo:
- title: título do quiz (string).
- course: curso técnico avaliado (string).
- description: descrição opcional (string).
- questions: lista de itens. Cada item precisa trazer:
  - context: parágrafo objetivo apresentando o cenário profissional da questão (string; vazio somente se não houver contexto necessário).
  - command: instrução clara e impessoal alinhada ao contexto (string).
  - answers: exatamente quatro alternativas, cada uma como objeto com:
      - text: texto curto e exclusivo da alternativa (string).
      - justification: explicação breve.
        Para a alternativa correta, detalhe tecnicamente por que ela é correta.
        Para cada distrator, descreva o raciocínio equivocado plausível do estudante.
  - correctAnswer: índice (base 0) da alternativa correta, coerente com o array "answers".
  - imageHint: sugestão de imagem relacionada ao contexto (string; vazio apenas quando não fizer sentido).
  - capacity: capacidade avaliada no item (string).
  - difficulty: nível de dificuldade, escolha entre "Fácil", "Médio" ou "Difícil".
  - knowledgeObjects: lista com ao menos um objeto de conhecimento relacionado (array de strings).
  - competencies: lista com ao menos uma competência mobilizada (array de strings).
  - cognitiveLevels: lista com níveis cognitivos escolhidos entre ["Lembrar","Entender","Aplicar","Analisar","Avaliar","Criar"].

Diretrizes de redação:
- Traga situações factíveis do cotidiano profissional, focadas na capacidade avaliada.
- Evite textos longos, frases negativas ou termos absolutos (sempre, nunca, totalmente, etc.).
- Nunca utilize comandos como “É correto afirmar que”, “Assinale a alternativa correta”, “Qual das alternativas...”.
- Mantenha linguagem técnica, direta e em português do Brasil, sem erros gramaticais.
- Garanta coerência completa entre contexto, comando, alternativas e justificativas.
- Não inclua conteúdo fora do JSON.
- Sempre que possível, sugira uma imagem que ajude na interpretação do item.
- Produza entre 3 e 6 questões, salvo instrução diferente do usuário.
`.trim();

export async function POST(req: Request) {
    if (!process.env.OPENAI_API_KEY) {
        return new Response(
            JSON.stringify({
                error: "OPENAI_API_KEY não configurada.",
            }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            },
        );
    }

    const body = await req.json().catch(() => null);
    const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
    const markdownRaw = typeof body?.markdown === "string" ? body.markdown : "";
    const markdown = markdownRaw.trim();

    if (!prompt && !markdown) {
        return new Response(
            JSON.stringify({
                error: "Forneça um prompt de instrução ou envie um arquivo Markdown para gerar o quiz.",
            }),
            {
                status: 400,
                headers: { "Content-Type": "application/json" },
            },
        );
    }

    try {
        const modelId = process.env.OPENAI_MODEL || DEFAULT_MODEL;

        const limitedMarkdown =
            markdown.length > MAX_MARKDOWN_LENGTH
                ? markdown.slice(0, MAX_MARKDOWN_LENGTH)
                : markdown;

        const promptSections: string[] = [];

        if (prompt) {
            promptSections.push(`Instruções do usuário:\n${prompt}`);
        }

        if (limitedMarkdown) {
            let markdownSection = `Conteúdo base em Markdown:\n${limitedMarkdown}`;
            if (markdown.length > MAX_MARKDOWN_LENGTH) {
                markdownSection += `\n\n[Observação: conteúdo original truncado para ${MAX_MARKDOWN_LENGTH} caracteres.]`;
            }
            promptSections.push(markdownSection);
        }

        promptSections.push(
            "Gere o quiz solicitado seguindo estritamente o schema fornecido e escrevendo o conteúdo em português do Brasil. Informe o campo 'course' alinhado ao curso técnico ou eixo tecnológico solicitado pelo usuário. Cada item deve conter contexto coerente, comando impessoal, quatro alternativas exclusivas com justificativas diferenciadas e metadados pedagógicos completos (capacidade, dificuldade, objetos de conhecimento, competências e níveis cognitivos compatíveis com a Taxonomia de Bloom).",
        );

        const composedPrompt = promptSections.join("\n\n");

        const result = await streamObject({
            model: openai.responses(modelId),
            schema: quizSchema,
            mode: "json",
            system: SYSTEM_PROMPT,
            prompt: composedPrompt,
        });

        return result.toTextStreamResponse();
    } catch (error) {
        console.error("AI quiz generation error:", error);

        if (
            error instanceof Error &&
            "statusCode" in error &&
            (error as { statusCode?: number }).statusCode === 400
        ) {
            return new Response(
                JSON.stringify({
                    error: "O modelo configurado não aceita streaming. Ajuste a variável OPENAI_MODEL para um modelo compatível, como gpt-4o-mini.",
                }),
                {
                    status: 400,
                    headers: { "Content-Type": "application/json" },
                },
            );
        }

        return new Response(
            JSON.stringify({
                error: "Não foi possível gerar o quiz automaticamente. Tente novamente em instantes.",
            }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            },
        );
    }
}
