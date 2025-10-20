import { Buffer } from "node:buffer";
import { existsSync } from "node:fs";
import path from "node:path";

import PDFDocument from "pdfkit";

import { quizSchema } from "@/app/quizzes/new/schema";

export const runtime = "nodejs";

const formatDate = () =>
    new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date());

const slugify = (value: string) =>
    value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "quiz";

const sanitizeText = (value: string) =>
    value
        .normalize("NFKC")
        .replace(/[\u2190-\u21FF\u27A1\u2794\u279C\u27BD\u27F5-\u27FF]/g, "->")
        .replace(/\u2022/g, "-")
        .replace(
            // remove emojis / pictographs
            /[\p{Extended_Pictographic}\p{Emoji_Presentation}]/gu,
            "",
        )
        .replace(/\s+/g, " ")
        .trim();

export async function POST(req: Request) {
    const body = await req.json().catch(() => null);
    const parsed = quizSchema.safeParse(body);

    if (!parsed.success) {
        return new Response(
            JSON.stringify({
                error: "Dados do quiz inválidos para exportação.",
            }),
            {
                status: 400,
                headers: { "Content-Type": "application/json" },
            },
        );
    }

    const quiz = parsed.data;

    try {
        const fontsDir = path.join(process.cwd(), "public", "fonts");
        const regularFontPath = path.join(fontsDir, "Roboto-Regular.ttf");
        const boldFontPath = path.join(fontsDir, "Roboto-Bold.ttf");

        if (!existsSync(regularFontPath) || !existsSync(boldFontPath)) {
            return new Response(
                JSON.stringify({
                    error: "Fontes necessárias não foram encontradas em public/fonts.",
                }),
                {
                    status: 500,
                    headers: { "Content-Type": "application/json" },
                },
            );
        }

        const doc = new PDFDocument({
            size: "A4",
            margin: 50,
            font: regularFontPath,
        });
        const chunks: Buffer[] = [];

        doc.on("data", (chunk: Buffer) => {
            chunks.push(chunk);
        });

        const docEnd = new Promise<void>((resolve, reject) => {
            doc.on("end", () => resolve());
            doc.on("error", (error: unknown) => reject(error));
        });

        doc.registerFont("QuizRegular", regularFontPath);
        doc.registerFont("QuizBold", boldFontPath);

        doc.font("QuizBold")
            .fontSize(20)
            .text(sanitizeText(quiz.title || "Quiz"), {
                align: "center",
            });

        if (quiz.description?.trim()) {
            doc.moveDown();
            doc.font("QuizRegular")
                .fontSize(12)
                .text(sanitizeText(quiz.description.trim()), {
                    align: "center",
                });
        }

        doc.moveDown(1);
        doc.font("QuizRegular")
            .fontSize(10)
            .text(`Gerado em ${formatDate()}`, { align: "center" });

        doc.moveDown(1.5);
        doc.font("QuizRegular")
            .fontSize(12)
            .text(
                "Instruções: marque a alternativa correta para cada questão.",
            );

        quiz.questions.forEach((question, questionIndex) => {
            doc.moveDown(1.2);
            doc.font("QuizBold")
                .fontSize(14)
                .text(`Questão ${questionIndex + 1}`);

            doc.moveDown(0.35);
            doc.font("QuizRegular")
                .fontSize(12)
                .text(sanitizeText(question.prompt));

            doc.moveDown(0.5);
            question.answers.forEach((answer, answerIndex) => {
                const letter = String.fromCharCode(65 + answerIndex);
                doc.font("QuizRegular").text(
                    `${letter}) ${sanitizeText(answer.text)}`,
                    {
                        indent: 16,
                    },
                );
            });

            doc.moveDown(0.7);
            doc.font("QuizRegular").text(
                "Resposta: __________________________",
            );
        });

        doc.end();
        await docEnd;

        const pdfBuffer = Buffer.concat(chunks);
        const filename = `${slugify(quiz.title)}.pdf`;

        return new Response(pdfBuffer, {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="${filename}"`,
            },
        });
    } catch (error) {
        console.error("Quiz PDF export error:", error);

        return new Response(
            JSON.stringify({
                error: "Não foi possível exportar o quiz para PDF. Tente novamente em instantes.",
            }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            },
        );
    }
}
