"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { Image as ImageIcon, Trash2 } from "lucide-react";

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
import { useFieldArray, type UseFormReturn } from "react-hook-form";

import { MAX_QUESTION_IMAGE_SIZE, type QuizFormValues } from "../schema";

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

    const removeAnswer = (answerIndex: number) => {
        answerArray.remove(answerIndex);
        const selected = form.getValues(
            `questions.${questionIndex}.correctAnswer`,
        );

        if (selected === answerIndex) {
            form.setValue(`questions.${questionIndex}.correctAnswer`, -1, {
                shouldValidate: true,
            });
        } else if (selected > answerIndex) {
            form.setValue(
                `questions.${questionIndex}.correctAnswer`,
                selected - 1,
                { shouldValidate: true },
            );
        }
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
                        Defina o enunciado e as alternativas desta pergunta.
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
            <CardContent className="space-y-5">
                <FormField
                    control={form.control}
                    name={`questions.${questionIndex}.prompt`}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Enunciado</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Digite a pergunta que será apresentada aos participantes."
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name={`questions.${questionIndex}.imageHint`}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>
                                Sugestão de imagem (gerada pela IA)
                            </FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Ex.: Foto de um diagrama da pirâmide do conhecimento."
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                            <p className="text-muted-foreground/80 mt-1 text-xs">
                                Use este texto como referência para anexar uma
                                imagem que complemente a pergunta.
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
                        {(MAX_QUESTION_IMAGE_SIZE / (1024 * 1024)).toFixed(1)}
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
                        <FormItem className="space-y-3">
                            <FormLabel>Alternativas</FormLabel>
                            <FormControl>
                                <RadioGroup
                                    value={
                                        field.value !== undefined &&
                                        field.value >= 0
                                            ? String(field.value)
                                            : ""
                                    }
                                    onValueChange={(value) => {
                                        const parsed = Number(value);
                                        field.onChange(parsed);
                                    }}
                                    className="grid gap-4"
                                >
                                    {answerArray.fields.map(
                                        (answer, answerIndex) => (
                                            <div
                                                key={answer.id}
                                                className="flex items-start gap-3 rounded-md border border-border/60 p-4"
                                            >
                                                <RadioGroupItem
                                                    value={String(answerIndex)}
                                                    id={`question-${questionIndex}-answer-${answerIndex}`}
                                                    aria-label={`Marcar alternativa ${answerIndex + 1} como correta`}
                                                    className="mt-1"
                                                />
                                                <div className="flex-1 space-y-2">
                                                    <FormField
                                                        control={form.control}
                                                        name={`questions.${questionIndex}.answers.${answerIndex}.text`}
                                                        render={({
                                                            field: answerField,
                                                        }) => (
                                                            <FormItem>
                                                                <FormLabel className="text-sm font-medium">
                                                                    Alternativa{" "}
                                                                    {answerIndex +
                                                                        1}
                                                                </FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        placeholder="Digite a alternativa"
                                                                        {...answerField}
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                                {answerArray.fields.length >
                                                    2 && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        onClick={() =>
                                                            removeAnswer(
                                                                answerIndex,
                                                            )
                                                        }
                                                        className="text-destructive hover:text-destructive"
                                                    >
                                                        Remover
                                                    </Button>
                                                )}
                                            </div>
                                        ),
                                    )}
                                </RadioGroup>
                            </FormControl>
                            <FormMessage />
                            <div className="-mx-4 mt-2 flex justify-between px-4">
                                <span className="text-muted-foreground/80 text-xs">
                                    Marque uma alternativa como correta.
                                </span>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() =>
                                        answerArray.append({ text: "" })
                                    }
                                >
                                    Nova alternativa
                                </Button>
                            </div>
                        </FormItem>
                    )}
                />
            </CardContent>
        </Card>
    );
}
