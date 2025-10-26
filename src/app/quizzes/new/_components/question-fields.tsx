"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { Image as ImageIcon, Plus, Trash2 } from "lucide-react";
import { useFieldArray, type UseFormReturn } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";

import {
    BLOOM_LEVELS,
    DIFFICULTY_LEVELS,
    MAX_QUESTION_IMAGE_SIZE,
    type QuizFormValues,
} from "../schema";

type QuestionFieldsProps = {
    form: UseFormReturn<QuizFormValues>;
    questionIndex: number;
    onRemove: () => void;
    canRemove: boolean;
};

export function QuestionFields({
    form,
    questionIndex,
    onRemove,
    canRemove,
}: QuestionFieldsProps) {
    const answerArray = useFieldArray({
        control: form.control,
        name: `questions.${questionIndex}.answers`,
    });

    const [imageError, setImageError] = useState<string | null>(null);
    const imageInputRef = useRef<HTMLInputElement | null>(null);

    const image = form.watch(`questions.${questionIndex}.image`);
    const knowledgeValues =
        form.watch(`questions.${questionIndex}.knowledgeObjects`) ?? [];
    const competencyValues =
        form.watch(`questions.${questionIndex}.competencies`) ?? [];

    const appendKnowledge = () => {
        form.setValue(
            `questions.${questionIndex}.knowledgeObjects`,
            [...knowledgeValues, ""],
            { shouldDirty: true },
        );
    };

    const removeKnowledge = (index: number) => {
        if (knowledgeValues.length <= 1) {
            return;
        }

        const next = knowledgeValues.filter(
            (_, itemIndex) => itemIndex !== index,
        );
        form.setValue(`questions.${questionIndex}.knowledgeObjects`, next, {
            shouldDirty: true,
            shouldValidate: true,
        });
    };

    const appendCompetency = () => {
        form.setValue(
            `questions.${questionIndex}.competencies`,
            [...competencyValues, ""],
            { shouldDirty: true },
        );
    };

    const removeCompetency = (index: number) => {
        if (competencyValues.length <= 1) {
            return;
        }

        const next = competencyValues.filter(
            (_, itemIndex) => itemIndex !== index,
        );
        form.setValue(`questions.${questionIndex}.competencies`, next, {
            shouldDirty: true,
            shouldValidate: true,
        });
    };

    const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        if (!file) {
            form.setValue(`questions.${questionIndex}.image`, undefined, {
                shouldDirty: true,
            });
            setImageError(null);
            return;
        }

        if (!file.type.startsWith("image/")) {
            setImageError("Envie apenas arquivos de imagem (PNG, JPG, etc.).");
            if (imageInputRef.current) {
                imageInputRef.current.value = "";
            }
            return;
        }

        if (file.size > MAX_QUESTION_IMAGE_SIZE) {
            setImageError(
                `Imagem muito grande. Limite de ${(MAX_QUESTION_IMAGE_SIZE / (1024 * 1024)).toFixed(1)} MB.`,
            );
            if (imageInputRef.current) {
                imageInputRef.current.value = "";
            }
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            const dataUrl = reader.result as string;
            form.setValue(
                `questions.${questionIndex}.image`,
                {
                    name: file.name,
                    dataUrl,
                    size: file.size,
                    type: file.type,
                },
                { shouldDirty: true },
            );
            setImageError(null);
        };
        reader.onerror = () => {
            setImageError("Não foi possível ler o arquivo. Tente novamente.");
            if (imageInputRef.current) {
                imageInputRef.current.value = "";
            }
        };

        reader.readAsDataURL(file);
    };

    const handleRemoveImage = () => {
        form.setValue(`questions.${questionIndex}.image`, undefined, {
            shouldDirty: true,
        });
        if (imageInputRef.current) {
            imageInputRef.current.value = "";
        }
        setImageError(null);
    };

    useEffect(() => {
        if (!image) {
            setImageError(null);
            if (imageInputRef.current) {
                imageInputRef.current.value = "";
            }
        }
    }, [image]);

    return (
        <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                <div>
                    <CardTitle>{`Pergunta ${questionIndex + 1}`}</CardTitle>
                    <CardDescription>
                        Contextualize o item, defina metadados pedagógicos e
                        escreva alternativas com justificativas.
                    </CardDescription>
                </div>
                {canRemove && (
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onRemove}
                        className="text-destructive hover:text-destructive"
                    >
                        Remover
                    </Button>
                )}
            </CardHeader>
            <CardContent className="space-y-6">
                <FormField
                    control={form.control}
                    name={`questions.${questionIndex}.context`}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Contexto (enunciado)</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Apresente o cenário profissional ou a situação-problema que dá sentido ao item."
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                            <p className="text-muted-foreground/80 mt-1 text-xs">
                                Utilize um único parágrafo objetivo. Deixe em
                                branco apenas quando a questão não exigir
                                contextualização.
                            </p>
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name={`questions.${questionIndex}.command`}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Comando</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Instrua o aluno de forma direta e impessoal sobre o que precisa ser analisado ou respondido."
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name={`questions.${questionIndex}.capacity`}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Capacidade avaliada</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="Ex.: Interpretar diagramas de rede para identificar falhas."
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name={`questions.${questionIndex}.difficulty`}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nível de dificuldade</FormLabel>
                            <FormControl>
                                <RadioGroup
                                    value={field.value}
                                    onValueChange={field.onChange}
                                    className="flex flex-wrap gap-3"
                                >
                                    {DIFFICULTY_LEVELS.map((level) => {
                                        const inputId = `question-${questionIndex}-difficulty-${level}`;
                                        return (
                                            <div
                                                key={level}
                                                className="flex items-center gap-2 rounded-md border border-border/60 px-3 py-2"
                                            >
                                                <RadioGroupItem
                                                    value={level}
                                                    id={inputId}
                                                />
                                                <label
                                                    htmlFor={inputId}
                                                    className="text-sm font-medium"
                                                >
                                                    {level}
                                                </label>
                                            </div>
                                        );
                                    })}
                                </RadioGroup>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-3">
                        <FormLabel>Objetos de conhecimento</FormLabel>
                        <div className="space-y-3">
                            {knowledgeValues.map((_, index) => (
                                <div
                                    key={`knowledge-${questionIndex}-${index}`}
                                    className="flex items-start gap-2"
                                >
                                    <FormField
                                        control={form.control}
                                        name={`questions.${questionIndex}.knowledgeObjects.${index}`}
                                        render={({ field }) => (
                                            <FormItem className="flex-1">
                                                <FormControl>
                                                    <Input
                                                        placeholder="Ex.: Conceitos de eletrônica analógica"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    {knowledgeValues.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={() =>
                                                removeKnowledge(index)
                                            }
                                            className="mt-1 text-destructive hover:text-destructive"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            <span className="sr-only">
                                                Remover objeto
                                            </span>
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={appendKnowledge}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Adicionar objeto
                        </Button>
                        <p className="text-muted-foreground/80 text-xs">
                            Liste os conteúdos necessários para resolver o item.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <FormLabel>Competências avaliadas</FormLabel>
                        <div className="space-y-3">
                            {competencyValues.map((_, index) => (
                                <div
                                    key={`competency-${questionIndex}-${index}`}
                                    className="flex items-start gap-2"
                                >
                                    <FormField
                                        control={form.control}
                                        name={`questions.${questionIndex}.competencies.${index}`}
                                        render={({ field }) => (
                                            <FormItem className="flex-1">
                                                <FormControl>
                                                    <Input
                                                        placeholder="Ex.: Planejar ações de manutenção corretiva"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    {competencyValues.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={() =>
                                                removeCompetency(index)
                                            }
                                            className="mt-1 text-destructive hover:text-destructive"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            <span className="sr-only">
                                                Remover competência
                                            </span>
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={appendCompetency}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Adicionar competência
                        </Button>
                        <p className="text-muted-foreground/80 text-xs">
                            Descreva as competências que o estudante mobiliza ao
                            resolver o item.
                        </p>
                    </div>
                </div>

                <FormField
                    control={form.control}
                    name={`questions.${questionIndex}.cognitiveLevels`}
                    render={({ field }) => {
                        const current = Array.isArray(field.value)
                            ? field.value
                            : [];
                        const toggleLevel = (
                            level: (typeof BLOOM_LEVELS)[number],
                        ) => {
                            const isActive = current.includes(level);
                            const next = isActive
                                ? current.filter((item) => item !== level)
                                : [...current, level];
                            field.onChange(next);
                        };

                        return (
                            <FormItem>
                                <FormLabel>
                                    Níveis cognitivos (Taxonomia de Bloom)
                                </FormLabel>
                                <FormControl>
                                    <div className="flex flex-wrap gap-2">
                                        {BLOOM_LEVELS.map((level) => {
                                            const isActive =
                                                current.includes(level);
                                            return (
                                                <Button
                                                    key={level}
                                                    type="button"
                                                    variant={
                                                        isActive
                                                            ? "default"
                                                            : "outline"
                                                    }
                                                    onClick={() =>
                                                        toggleLevel(level)
                                                    }
                                                >
                                                    {level}
                                                </Button>
                                            );
                                        })}
                                    </div>
                                </FormControl>
                                <FormMessage />
                                <p className="text-muted-foreground/80 mt-1 text-xs">
                                    Escolha pelo menos um nível compatível com a
                                    habilidade exigida.
                                </p>
                            </FormItem>
                        );
                    }}
                />

                <FormField
                    control={form.control}
                    name={`questions.${questionIndex}.imageHint`}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Sugestão de imagem</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Ex.: Fluxograma simplificado do processo de soldagem."
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                            <p className="text-muted-foreground/80 mt-1 text-xs">
                                Indique um recurso visual que auxilie o aluno na
                                interpretação do comando.
                            </p>
                        </FormItem>
                    )}
                />

                <div className="space-y-3">
                    <FormLabel>Imagem da pergunta (opcional)</FormLabel>
                    <Input
                        ref={imageInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/gif,image/webp"
                        onChange={handleImageChange}
                    />
                    <p className="text-muted-foreground text-xs">
                        Formatos suportados: PNG, JPG, GIF, WEBP. Tamanho
                        máximo:{" "}
                        {(MAX_QUESTION_IMAGE_SIZE / (1024 * 1024)).toFixed(1)}{" "}
                        MB.
                    </p>
                    {imageError && (
                        <p className="text-sm text-destructive">{imageError}</p>
                    )}
                    {image && (
                        <div className="flex items-start gap-3 rounded-md border bg-muted/40 p-3">
                            <div className="flex items-center justify-center overflow-hidden rounded-md border bg-background">
                                <img
                                    src={image.dataUrl}
                                    alt={image.name}
                                    className="h-24 w-24 object-cover"
                                />
                            </div>
                            <div className="flex-1 space-y-1 text-sm">
                                <p className="font-medium flex items-center gap-1">
                                    <ImageIcon className="h-4 w-4" />
                                    {image.name}
                                </p>
                                <p className="text-muted-foreground text-xs">
                                    {(image.size / 1024).toFixed(0)} KB ·{" "}
                                    {image.type}
                                </p>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive hover:text-destructive"
                                    onClick={handleRemoveImage}
                                >
                                    <Trash2 className="mr-1 h-4 w-4" />
                                    Remover imagem
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                <FormField
                    control={form.control}
                    name={`questions.${questionIndex}.correctAnswer`}
                    render={({ field }) => (
                        <FormItem className="space-y-4">
                            <FormLabel>Alternativas e justificativas</FormLabel>
                            <FormControl>
                                <RadioGroup
                                    value={
                                        field.value !== undefined &&
                                        field.value >= 0
                                            ? String(field.value)
                                            : ""
                                    }
                                    onValueChange={(value) =>
                                        field.onChange(Number(value))
                                    }
                                    className="space-y-4"
                                >
                                    {answerArray.fields.map(
                                        (answer, answerIndex) => {
                                            const letter = String.fromCharCode(
                                                65 + answerIndex,
                                            );
                                            return (
                                                <div
                                                    key={answer.id}
                                                    className="flex gap-3 rounded-md border border-border/60 p-4"
                                                >
                                                    <RadioGroupItem
                                                        value={String(
                                                            answerIndex,
                                                        )}
                                                        id={`question-${questionIndex}-answer-${answerIndex}`}
                                                        aria-label={`Marcar alternativa ${letter} como correta`}
                                                        className="mt-1"
                                                    />
                                                    <div className="flex-1 space-y-3">
                                                        <div className="grid gap-2">
                                                            <FormField
                                                                control={
                                                                    form.control
                                                                }
                                                                name={`questions.${questionIndex}.answers.${answerIndex}.text`}
                                                                render={({
                                                                    field: answerField,
                                                                }) => (
                                                                    <FormItem>
                                                                        <FormLabel className="text-sm font-medium">
                                                                            {`Alternativa ${letter}`}
                                                                        </FormLabel>
                                                                        <FormControl>
                                                                            <Input
                                                                                placeholder="Digite o texto da alternativa"
                                                                                {...answerField}
                                                                            />
                                                                        </FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )}
                                                            />
                                                            <FormField
                                                                control={
                                                                    form.control
                                                                }
                                                                name={`questions.${questionIndex}.answers.${answerIndex}.justification`}
                                                                render={({
                                                                    field: justificationField,
                                                                }) => (
                                                                    <FormItem>
                                                                        <FormLabel className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                                                            Justificativa
                                                                        </FormLabel>
                                                                        <FormControl>
                                                                            <Textarea
                                                                                placeholder="Descreva por que esta alternativa é correta ou qual equívoco ela representa."
                                                                                className="min-h-20"
                                                                                {...justificationField}
                                                                            />
                                                                        </FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        },
                                    )}
                                </RadioGroup>
                            </FormControl>
                            <FormMessage />
                            <p className="text-muted-foreground/80 text-xs">
                                Mantenha quatro alternativas distintas.
                                Selecione a correta e descreva as justificativas
                                do gabarito e dos distratores.
                            </p>
                        </FormItem>
                    )}
                />
            </CardContent>
        </Card>
    );
}
