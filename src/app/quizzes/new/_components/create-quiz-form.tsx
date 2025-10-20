"use client";

import { ChangeEvent, useRef, useState } from "react";
import { experimental_useObject as useObject } from "@ai-sdk/react";
import { FileDown, FileText, Loader2, X } from "lucide-react";
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
        context?: string;
        command: string;
        answers: Array<{
            text: string;
            isCorrect: boolean;
        }>;
        imageHint?: string;
        image?: {
            name: string;
            size: number;
            type: string;
        };
    }>;
};

const AI_GENERATION_ENDPOINT = "/api/quizzes/generate";
const MAX_MARKDOWN_FILE_SIZE = 512 * 1024; // 512 KB

const quizValuesToPreview = (values: QuizFormValues): QuizPreview => ({
    title: values.title,
    description: values.description,
    questions: values.questions.map((question) => ({
        context: question.context?.trim() ? question.context : undefined,
        command: question.command,
        answers: question.answers.map((answer, index) => ({
            text: answer.text,
            isCorrect: index === question.correctAnswer,
        })),
        imageHint: question.imageHint?.trim() ? question.imageHint : undefined,
        image: question.image
            ? {
                  name: question.image.name,
                  size: question.image.size,
                  type: question.image.type,
              }
            : undefined,
    })),
});

const generateQuizMarkdown = (quiz: QuizPreview) => {
    const lines: string[] = [`# ${quiz.title.trim() || "Quiz"}`];

    if (quiz.description?.trim()) {
        lines.push("", quiz.description.trim());
    }

    quiz.questions.forEach((question, index) => {
        lines.push("", `## Pergunta ${index + 1}`);

        if (question.context?.trim()) {
            lines.push(`Contexto: ${question.context.trim()}`);
        }

        lines.push(`Comando: ${question.command.trim()}`);

        question.answers.forEach((answer) => {
            const prefix = answer.isCorrect ? "- [x]" : "- [ ]";
            lines.push(`${prefix} ${answer.text.trim()}`);
        });

        if (question.imageHint?.trim()) {
            lines.push("", `Sugestão de imagem: ${question.imageHint.trim()}`);
        }

        if (question.image) {
            lines.push(
                `Imagem anexada: ${question.image.name} (${question.image.type}, ${(question.image.size / 1024).toFixed(0)} KB)`,
            );
        }
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
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [prompt, setPrompt] = useState("");
    const [preview, setPreview] = useState<QuizPreview | null>(null);
    const [markdownFile, setMarkdownFile] = useState<{
        name: string;
        content: string;
    } | null>(null);
    const [fileError, setFileError] = useState<string | null>(null);
    const [generationInputError, setGenerationInputError] = useState<
        string | null
    >(null);
    const [isExportingPdf, setIsExportingPdf] = useState(false);
    const [pdfError, setPdfError] = useState<string | null>(null);

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
    } = useObject<
        typeof quizSchema,
        QuizFormValues,
        { prompt?: string; markdown?: string }
    >({
        api: AI_GENERATION_ENDPOINT,
        schema: quizSchema,
        onFinish: ({ object }) => {
            if (!object) {
                return;
            }

            const normalizedObject: QuizFormValues = {
                ...object,
                questions: object.questions.map((question) => ({
                    ...question,
                    context: question.context ?? "",
                })),
            };

            form.reset(normalizedObject);
            questionArray.replace(normalizedObject.questions);
            form.clearErrors();
            setPreview(quizValuesToPreview(normalizedObject));
        },
    });

    const aiPreviewJson =
        aiQuiz && Object.keys(aiQuiz).length > 0
            ? JSON.stringify(aiQuiz, null, 2)
            : null;

    const handleGenerateQuiz = () => {
        const trimmedPrompt = prompt.trim();

        if (!trimmedPrompt && !markdownFile) {
            setGenerationInputError(
                "Informe um prompt ou selecione um arquivo Markdown para gerar o quiz.",
            );
            return;
        }

        setGenerationInputError(null);
        setPdfError(null);
        clearAiState();
        requestQuizGeneration({
            prompt: trimmedPrompt || undefined,
            markdown: markdownFile?.content || undefined,
        });
    };

    const handleSubmit = (values: QuizFormValues) => {
        const normalizedQuiz = quizValuesToPreview(values);

        setPreview(normalizedQuiz);
        downloadQuizMarkdown(normalizedQuiz);
        setPdfError(null);
    };

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        if (!file) {
            setMarkdownFile(null);
            setFileError(null);
            return;
        }

        if (file.size > MAX_MARKDOWN_FILE_SIZE) {
            setMarkdownFile(null);
            setFileError(
                "O arquivo é muito grande. Selecione um arquivo de até 512 KB.",
            );
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
            return;
        }

        const isMarkdown =
            file.type === "text/markdown" ||
            file.type === "text/plain" ||
            file.name.toLowerCase().endsWith(".md") ||
            file.name.toLowerCase().endsWith(".markdown");

        if (!isMarkdown) {
            setMarkdownFile(null);
            setFileError("Use um arquivo .md ou .markdown.");
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            setMarkdownFile({
                name: file.name,
                content: (reader.result as string) ?? "",
            });
            setFileError(null);
            setGenerationInputError(null);
            setPdfError(null);
        };
        reader.onerror = () => {
            setMarkdownFile(null);
            setFileError("Não foi possível ler o arquivo. Tente novamente.");
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        };
        reader.readAsText(file);
    };

    const handleRemoveFile = () => {
        setMarkdownFile(null);
        setFileError(null);
        setGenerationInputError(null);
        setPdfError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleExportPdf = async () => {
        const isValid = await form.trigger();

        if (!isValid) {
            setPdfError(
                "Corrija os erros do formulário antes de exportar o PDF.",
            );
            return;
        }

        const values = form.getValues();

        try {
            setPdfError(null);
            setIsExportingPdf(true);

            const response = await fetch("/api/quizzes/export", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(values),
            });

            if (!response.ok) {
                let message = "Não foi possível gerar o PDF.";
                try {
                    const data = await response.json();
                    if (data?.error) {
                        message = data.error;
                    }
                } catch (error) {
                    // ignore parsing errors
                }
                throw new Error(message);
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const slug =
                values.title
                    .trim()
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/^-+|-+$/g, "") || "quiz";

            const link = document.createElement("a");
            link.href = url;
            link.download = `${slug}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            setPdfError(
                error instanceof Error
                    ? error.message
                    : "Não foi possível gerar o PDF.",
            );
        } finally {
            setIsExportingPdf(false);
        }
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
                        onChange={(event) => {
                            setPrompt(event.target.value);
                            if (generationInputError) {
                                setGenerationInputError(null);
                            }
                        }}
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
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                            Arquivo Markdown (opcional)
                        </label>
                        <Input
                            ref={fileInputRef}
                            type="file"
                            accept=".md,.markdown,text/markdown,text/plain"
                            onChange={handleFileChange}
                        />
                        {markdownFile && (
                            <div className="flex items-center justify-between rounded-md border bg-card p-2 text-sm">
                                <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    <span className="font-medium">
                                        {markdownFile.name}
                                    </span>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleRemoveFile}
                                >
                                    <X className="mr-1 h-4 w-4" />
                                    Remover
                                </Button>
                            </div>
                        )}
                        {fileError && (
                            <p className="text-sm text-destructive">
                                {fileError}
                            </p>
                        )}
                    </div>
                    {aiGenerationError && (
                        <p className="text-sm text-destructive">
                            {aiGenerationError.message ||
                                "Não foi possível gerar o quiz automaticamente."}
                        </p>
                    )}
                    {generationInputError && (
                        <p className="text-sm text-destructive">
                            {generationInputError}
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
                            disabled={
                                (prompt.trim().length === 0 && !markdownFile) ||
                                isGenerating
                            }
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

                    <div className="flex flex-wrap items-center justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleExportPdf}
                            disabled={isExportingPdf}
                        >
                            {isExportingPdf ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <FileDown className="mr-2 h-4 w-4" />
                            )}
                            Exportar PDF
                        </Button>
                        <Button type="submit">Salvar quiz</Button>
                    </div>
                    {pdfError && (
                        <p className="text-right text-sm text-destructive">
                            {pdfError}
                        </p>
                    )}
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
