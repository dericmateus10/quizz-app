import { z } from "zod";

export const answerSchema = z.object({
    text: z.string().min(1, "Informe a alternativa"),
});

export const questionSchema = z
    .object({
        prompt: z.string().min(1, "Informe o enunciado da pergunta"),
        answers: z
            .array(answerSchema)
            .min(2, "Adicione pelo menos duas alternativas"),
        correctAnswer: z.number().min(0, "Selecione a alternativa correta"),
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

export type QuizFormValues = z.infer<typeof quizSchema>;
export type QuestionFormValues = z.infer<typeof questionSchema>;

export const createEmptyQuestion = (): QuestionFormValues => ({
    prompt: "",
    answers: [{ text: "" }, { text: "" }],
    correctAnswer: -1,
});
