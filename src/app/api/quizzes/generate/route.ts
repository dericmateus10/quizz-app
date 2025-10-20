import { streamObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

import { quizSchema } from "@/app/quizzes/new/schema";

const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const DEFAULT_MODEL = "gpt-4o-mini";
const MAX_MARKDOWN_LENGTH = 20_000;

const SYSTEM_PROMPT = `
Você é um assistente que cria quizzes em português brasileiro.
Sempre retorne um JSON que siga rigorosamente o schema com as propriedades:
- title: título do quiz (string).
- description: descrição curta opcional (string).
- questions: array com perguntas. Cada pergunta deve ter:
  - prompt: enunciado da pergunta (string).
  - answers: array de alternativas com pelo menos 2 itens. Cada alternativa possui:
    - text: texto da alternativa (string).
  - correctAnswer: índice (base 0) da alternativa correta dentro do array "answers".
  - imageHint: texto curto sugerindo uma imagem relevante (string, pode ser vazio quando não fizer sentido).

Regras:
- Mantenha coerência com o tema solicitado pelo usuário.
- Garanta que o índice "correctAnswer" corresponda exatamente à alternativa correta.
- As alternativas devem ser concisas e exclusivas entre si.
- Prefira produzir entre 3 e 6 perguntas, a menos que o usuário peça outra quantidade.
 - Não inclua explicações fora do JSON.
 - Para cada pergunta, sugira uma imagem em "imageHint" que ajude o aluno na visualização do problema.
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
            "Gere o quiz solicitado seguindo estritamente o schema fornecido e escrevendo o conteúdo em português do Brasil. Inclua sugestões claras em 'imageHint' para cada pergunta, deixando vazio apenas quando nenhuma imagem fizer sentido.",
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
