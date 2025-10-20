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

const dataUrlToBuffer = (dataUrl: string) => {
    const match = dataUrl.match(/^data:(.+);base64,(.+)$/);
    if (!match) {
        return null;
    }

    try {
        return Buffer.from(match[2], "base64");
    } catch {
        return null;
    }
};

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
            const imageBuffer =
                question.image?.dataUrl &&
                dataUrlToBuffer(question.image.dataUrl);

            const maxWidth =
                doc.page.width - doc.page.margins.left - doc.page.margins.right;
            const availableHeight = doc.page.height - doc.page.margins.bottom;

            let imageMetadata: {
                width: number;
                height: number;
                x: number;
            } | null = null;

            if (imageBuffer) {
                try {
                    const baseImage = (
                        doc as unknown as {
                            openImage: (src: Buffer) => {
                                width: number;
                                height: number;
                            };
                        }
                    ).openImage(imageBuffer);
                    const maxHeight = 240;
                    const widthScale = maxWidth / baseImage.width;
                    const heightScale = maxHeight / baseImage.height;
                    const scale = Math.min(1, widthScale, heightScale);
                    const drawWidth = baseImage.width * scale;
                    const drawHeight = baseImage.height * scale;
                    const x =
                        doc.page.margins.left + (maxWidth - drawWidth) / 2;

                    imageMetadata = {
                        width: drawWidth,
                        height: drawHeight,
                        x,
                    };
                } catch (error) {
                    console.error("Quiz PDF image metadata error:", error);
                }
            }

            const estimatedHeight =
                70 +
                question.answers.length * 24 +
                (question.context?.trim() ? 40 : 0) +
                (imageMetadata ? imageMetadata.height + 30 : 0) +
                26;

            if (doc.y + estimatedHeight > availableHeight) {
                doc.addPage({ margin: doc.page.margins.left });
                doc.font("QuizRegular");
            }

            doc.moveDown(1.2);
            doc.font("QuizBold")
                .fontSize(14)
                .text(`Questão ${questionIndex + 1}`);

            if (question.context?.trim()) {
                doc.moveDown(0.35);
                doc.font("QuizBold").fontSize(12).text("Contexto:", {
                    continued: true,
                });
                doc.font("QuizRegular")
                    .fontSize(12)
                    .text(` ${sanitizeText(question.context)}`);
            }

            if (imageBuffer && imageMetadata) {
                try {
                    const currentAvailableHeight =
                        doc.page.height - doc.page.margins.bottom;
                    if (
                        doc.y + imageMetadata.height + 20 >
                        currentAvailableHeight
                    ) {
                        doc.addPage({ margin: doc.page.margins.left });
                        doc.font("QuizRegular");
                    }

                    doc.moveDown(0.6);
                    const startY = doc.y;
                    doc.image(imageBuffer, imageMetadata.x, startY, {
                        width: imageMetadata.width,
                    });
                    doc.y = startY + imageMetadata.height;
                    doc.moveDown(0.6);
                } catch (error) {
                    console.error("Quiz PDF image render error:", error);
                }
            }

            doc.moveDown(0.35);
            doc.font("QuizBold").fontSize(12).text("Comando:", {
                continued: true,
            });
            doc.font("QuizRegular")
                .fontSize(12)
                .text(` ${sanitizeText(question.command)}`);

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

            doc.moveDown(1);
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
