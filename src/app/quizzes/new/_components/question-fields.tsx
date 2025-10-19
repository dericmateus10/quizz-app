"use client";

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

import type { QuizFormValues } from "../schema";

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
                                    onClick={() => answerArray.append({ text: "" })}
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
