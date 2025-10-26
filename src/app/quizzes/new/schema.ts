import { z } from "zod";

export const MAX_QUESTION_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB

export const BLOOM_LEVELS = [
    "Lembrar",
    "Entender",
    "Aplicar",
    "Analisar",
    "Avaliar",
    "Criar",
] as const;

export const DIFFICULTY_LEVELS = ["Fácil", "Médio", "Difícil"] as const;

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

const stringListSchema = (label: string) =>
    z
        .array(z.string().trim().min(1, `Informe ${label}`))
        .min(1, `Adicione pelo menos um ${label}`);

export const answerSchema = z.object({
    text: z.string().min(1, "Informe a alternativa"),
    justification: z.string().min(1, "Descreva a justificativa da alternativa"),
});

export const questionSchema = z
    .object({
        context: z.string().max(1500, "Contexto muito longo").optional(),
        command: z.string().min(1, "Informe o comando da pergunta"),
        answers: z
            .array(answerSchema)
            .length(4, "Cada item deve conter exatamente quatro alternativas"),
        correctAnswer: z
            .number()
            .min(0, "Selecione a alternativa correta")
            .max(3, "Selecione a alternativa correta"),
        imageHint: z
            .string()
            .max(400, "Sugestão de imagem muito longa")
            .optional(),
        image: questionImageSchema.optional(),
        capacity: z.string().min(1, "Informe a capacidade avaliada"),
        difficulty: z
            .enum(DIFFICULTY_LEVELS)
            .describe("Selecione o nível de dificuldade"),
        knowledgeObjects: stringListSchema(
            "objeto de conhecimento relacionado",
        ),
        competencies: stringListSchema("competência"),
        cognitiveLevels: z
            .array(z.enum(BLOOM_LEVELS))
            .min(1, "Selecione ao menos um nível cognitivo"),
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
    course: z.string().min(1, "Informe o curso técnico avaliado"),
    description: z.string().optional(),
    questions: z.array(questionSchema).min(1, "Crie pelo menos uma pergunta"),
});

export type QuizFormValues = z.input<typeof quizSchema>;
export type QuestionFormValues = z.input<typeof questionSchema>;

const createEmptyAnswer = (): QuestionFormValues["answers"][number] => ({
    text: "",
    justification: "",
});

export const createEmptyQuestion = (): QuestionFormValues => ({
    context: "",
    command: "",
    answers: [
        createEmptyAnswer(),
        createEmptyAnswer(),
        createEmptyAnswer(),
        createEmptyAnswer(),
    ],
    correctAnswer: -1,
    imageHint: "",
    capacity: "",
    difficulty: "Médio",
    knowledgeObjects: [""],
    competencies: [""],
    cognitiveLevels: [],
});
