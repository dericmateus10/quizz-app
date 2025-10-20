import { z } from "zod";

export const MAX_QUESTION_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB

const questionImageSchema = z.object({
    name: z.string().min(1, "Informe o nome da imagem"),
    dataUrl: z
        .string()
        .min(1, "Imagem inválida")
        .refine(
            (value) => value.startsWith("data:image/"),
            "Apenas imagens são suportadas",
        ),
    size: z
        .number()
        .int()
        .nonnegative()
        .max(MAX_QUESTION_IMAGE_SIZE, "Imagem muito grande"),
    type: z.string().min(1, "Tipo de mídia inválido"),
});

export const answerSchema = z.object({
    text: z.string().min(1, "Informe a alternativa"),
});

export const questionSchema = z
    .object({
        context: z.string().max(1500, "Contexto muito longo").optional(),
        command: z.string().min(1, "Informe o comando da pergunta"),
        answers: z
            .array(answerSchema)
            .min(2, "Adicione pelo menos duas alternativas"),
        correctAnswer: z.number().min(0, "Selecione a alternativa correta"),
        imageHint: z
            .string()
            .max(400, "Sugestão de imagem muito longa")
            .optional(),
        image: questionImageSchema.optional(),
    })
    .superRefine((question, ctx) => {
        if (question.correctAnswer >= question.answers.length) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Selecione a alternativa correta",
                path: ["correctAnswer"],
            });
        }
    });

export const quizSchema = z.object({
    title: z.string().min(1, "Informe o título do quiz"),
    description: z.string().optional(),
    questions: z.array(questionSchema).min(1, "Crie pelo menos uma pergunta"),
});

export type QuizFormValues = z.input<typeof quizSchema>;
export type QuestionFormValues = z.input<typeof questionSchema>;

export const createEmptyQuestion = (): QuestionFormValues => ({
    context: "",
    command: "",
    answers: [{ text: "" }, { text: "" }],
    correctAnswer: -1,
    imageHint: "",
});
