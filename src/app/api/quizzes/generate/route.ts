import { streamObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

import { quizSchema } from "@/app/quizzes/new/schema";

const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const DEFAULT_MODEL = "gpt-5-mini";

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

Regras:
- Mantenha coerência com o tema solicitado pelo usuário.
- Garanta que o índice "correctAnswer" corresponda exatamente à alternativa correta.
- As alternativas devem ser concisas e exclusivas entre si.
- Prefira produzir entre 3 e 6 perguntas, a menos que o usuário peça outra quantidade.
- Não inclua explicações fora do JSON.
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

    if (!prompt) {
        return new Response(
            JSON.stringify({
                error: "Informe um prompt válido para gerar o quiz.",
            }),
            {
                status: 400,
                headers: { "Content-Type": "application/json" },
            },
        );
    }

    try {
        const modelId = process.env.OPENAI_MODEL || DEFAULT_MODEL;

        const result = await streamObject({
            model: openai.responses(modelId),
            schema: quizSchema,
            mode: "json",
            system: SYSTEM_PROMPT,
            prompt: `Instruções do usuário: ${prompt}`,
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
