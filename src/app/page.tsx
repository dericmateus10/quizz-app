import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
    return (
        <main className="mx-auto flex min-h-[calc(100vh-120px)] max-w-3xl flex-col justify-center gap-8 px-6 py-12">
            <div className="space-y-4 text-center md:text-left">
                <p className="text-primary font-semibold tracking-wide">
                    Bem-vindo ao Quizz App
                </p>
                <h1 className="text-4xl font-bold leading-tight md:text-5xl">
                    Crie quizzes dinâmicos em minutos
                </h1>
                <p className="text-muted-foreground text-lg">
                    Organize perguntas e alternativas, defina a resposta correta
                    e compartilhe com sua equipe. Comece criando um novo quiz ou
                    consulte a documentação do projeto para alinhar processos.
                </p>
            </div>

            <div className="flex flex-wrap justify-center gap-3 md:justify-start">
                <Button asChild size="lg">
                    <Link href="/quizzes/new">Começar agora</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                    <Link href="/docs/regras">Regras do projeto</Link>
                </Button>
            </div>
        </main>
    );
}
