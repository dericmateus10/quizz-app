import { CreateQuizForm } from "./_components/create-quiz-form";

export default function CreateQuizPage() {
    return (
        <div className="mx-auto grid w-full max-w-5xl gap-8 pb-16">
            <div>
                <h1 className="text-3xl font-semibold">Criar novo quiz</h1>
                <p className="text-muted-foreground mt-2">
                    Monte quizzes com múltiplas perguntas e alternativas.
                    Selecione qual delas é a correta em cada pergunta.
                </p>
            </div>

            <CreateQuizForm />
        </div>
    );
}
