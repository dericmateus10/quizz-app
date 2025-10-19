"use client";

import { useState } from "react";
import { experimental_useObject as useObject } from "@ai-sdk/react";
import { Loader2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import {
    createEmptyQuestion,
    quizSchema,
    type QuizFormValues,
} from "../schema";
import { QuestionFields } from "./question-fields";

type QuizPreview = {
    title: string;
    description?: string;
    questions: Array<{
        prompt: string;
        answers: Array<{
            text: string;
            isCorrect: boolean;
        }>;
    }>;
};

const AI_GENERATION_ENDPOINT = "/api/quizzes/generate";

const quizValuesToPreview = (values: QuizFormValues): QuizPreview => ({
    title: values.title,
    description: values.description,
    questions: values.questions.map((question) => ({
        prompt: question.prompt,
        answers: question.answers.map((answer, index) => ({
            text: answer.text,
            isCorrect: index === question.correctAnswer,
        })),
    })),
});

const generateQuizMarkdown = (quiz: QuizPreview) => {
    const lines: string[] = [`# ${quiz.title.trim() || "Quiz"}`];

    if (quiz.description?.trim()) {
        lines.push("", quiz.description.trim());
    }

    quiz.questions.forEach((question, index) => {
        lines.push("", `## Pergunta ${index + 1}`, question.prompt.trim());

        question.answers.forEach((answer) => {
            const prefix = answer.isCorrect ? "- [x]" : "- [ ]";
            lines.push(`${prefix} ${answer.text.trim()}`);
        });
    });

    lines.push(
        "",
        "---",
        "Arquivo gerado automaticamente pelo criador de quizzes.",
    );

    return lines.join("\n");
};

const downloadQuizMarkdown = (quiz: QuizPreview) => {
    if (typeof window === "undefined") {
        return;
    }

    const markdown = generateQuizMarkdown(quiz);
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const slug =
        quiz.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "") || "quiz";

    link.href = url;
    link.download = `${slug}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

export function CreateQuizForm() {
    const [prompt, setPrompt] = useState("");
    const [preview, setPreview] = useState<QuizPreview | null>(null);

    const form = useForm<QuizFormValues>({
        resolver: zodResolver(quizSchema),
        defaultValues: {
            title: "",
            description: "",
            questions: [createEmptyQuestion()],
        },
        mode: "onBlur",
    });

    const questionArray = useFieldArray({
        control: form.control,
        name: "questions",
    });

    const {
        object: aiQuiz,
        submit: requestQuizGeneration,
        isLoading: isGenerating,
        error: aiGenerationError,
        stop: stopAiGeneration,
        clear: clearAiState,
    } = useObject<typeof quizSchema, QuizFormValues, { prompt: string }>({
        api: AI_GENERATION_ENDPOINT,
        schema: quizSchema,
        onFinish: ({ object }) => {
            if (!object) {
                return;
            }

            form.reset(object);
            questionArray.replace(object.questions);
            form.clearErrors();
            setPreview(quizValuesToPreview(object));
        },
    });

    const aiPreviewJson =
        aiQuiz && Object.keys(aiQuiz).length > 0
            ? JSON.stringify(aiQuiz, null, 2)
            : null;

    const handleGenerateQuiz = () => {
        const trimmedPrompt = prompt.trim();

        if (!trimmedPrompt) {
            return;
        }

        clearAiState();
        requestQuizGeneration({ prompt: trimmedPrompt });
    };

    const handleSubmit = (values: QuizFormValues) => {
        const normalizedQuiz = quizValuesToPreview(values);

        setPreview(normalizedQuiz);
        downloadQuizMarkdown(normalizedQuiz);
    };

    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader className="space-y-3">
                    <CardTitle>Gerar quiz com IA</CardTitle>
                    <CardDescription>
                        Escreva um prompt descrevendo tema, nível de
                        dificuldade, quantidade de perguntas e alternativas
                        desejadas. A IA vai preencher o formulário
                        automaticamente.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Textarea
                        value={prompt}
                        onChange={(event) => setPrompt(event.target.value)}
                        placeholder="Ex.: Crie um quiz avançado sobre JavaScript com 5 perguntas, 4 alternativas cada, indique a resposta correta e traga uma breve descrição."
                        className="min-h-32"
                    />
                    {isGenerating && (
                        <div className="flex items-center gap-2 rounded-md border border-dashed border-muted-foreground/40 bg-muted/40 p-3 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>
                                A IA está analisando o prompt e montando o
                                quiz...
                            </span>
                        </div>
                    )}
                    {aiGenerationError && (
                        <p className="text-sm text-destructive">
                            {aiGenerationError.message ||
                                "Não foi possível gerar o quiz automaticamente."}
                        </p>
                    )}
                    <div className="flex items-center justify-end gap-2">
                        {isGenerating && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => stopAiGeneration()}
                            >
                                Cancelar
                            </Button>
                        )}
                        <Button
                            type="button"
                            onClick={handleGenerateQuiz}
                            disabled={!prompt.trim() || isGenerating}
                        >
                            {isGenerating && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Gerar com IA
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Form {...form}>
                <form
                    className="grid gap-6"
                    onSubmit={form.handleSubmit(handleSubmit)}
                    noValidate
                >
                    <Card>
                        <CardHeader className="space-y-3">
                            <CardTitle>Informações do quiz</CardTitle>
                            <CardDescription>
                                Defina título e descrição. Você pode editar
                                estes dados depois.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Título</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Ex.: Quiz de JavaScript"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Descrição (opcional)
                                        </FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Explique o objetivo do quiz ou dê instruções rápidas."
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    <div className="grid gap-5">
                        {questionArray.fields.map((question, questionIndex) => (
                            <QuestionFields
                                key={question.id}
                                form={form}
                                questionIndex={questionIndex}
                                onRemove={() =>
                                    questionArray.remove(questionIndex)
                                }
                                canRemove={questionArray.fields.length > 1}
                            />
                        ))}

                        <div>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() =>
                                    questionArray.append(createEmptyQuestion())
                                }
                            >
                                Adicionar pergunta
                            </Button>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Button type="submit">Salvar quiz</Button>
                    </div>
                </form>
            </Form>

            {aiPreviewJson && (
                <Card>
                    <CardHeader>
                        <CardTitle>Pré-visualização em tempo real</CardTitle>
                        <CardDescription>
                            Dados recebidos da IA enquanto o quiz é gerado.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <pre className="bg-muted text-muted-foreground/80 max-h-64 overflow-auto rounded-md p-4 text-sm">
                            {aiPreviewJson}
                        </pre>
                    </CardContent>
                </Card>
            )}

            {preview && (
                <Card>
                    <CardHeader>
                        <CardTitle>Pré-visualização do payload</CardTitle>
                        <CardDescription>
                            Resultado normalizado gerado a partir do formulário.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <pre className="bg-muted text-muted-foreground/80 max-h-64 overflow-auto rounded-md p-4 text-sm">
                            {JSON.stringify(preview, null, 2)}
                        </pre>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
