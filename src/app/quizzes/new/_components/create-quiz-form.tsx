"use client";

import { useState } from "react";
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

    const handleSubmit = (values: QuizFormValues) => {
        const normalizedQuiz: QuizPreview = {
            title: values.title,
            description: values.description,
            questions: values.questions.map((question) => ({
                prompt: question.prompt,
                answers: question.answers.map((answer, index) => ({
                    text: answer.text,
                    isCorrect: index === question.correctAnswer,
                })),
            })),
        };

        setPreview(normalizedQuiz);
        downloadQuizMarkdown(normalizedQuiz);
    };

    return (
        <div className="grid gap-6">
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
