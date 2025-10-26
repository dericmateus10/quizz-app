import { readFile } from "node:fs/promises";
import { cache } from "react";
import path from "node:path";

const loadPromptInstructions = cache(async () => {
    const filePath = path.join(
        process.cwd(),
        "docs",
        "instrucoes-prompt.md",
    );
    const content = await readFile(filePath, "utf-8");
    return content;
});

export default async function PromptInstructionsPage() {
    const content = await loadPromptInstructions();

    return (
        <main className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-12">
            <header className="space-y-3">
                <p className="text-primary font-semibold uppercase tracking-wide">
                    Documentação
                </p>
                <h1 className="text-4xl font-bold">
                    Diretrizes para geração de itens
                </h1>
                <p className="text-muted-foreground text-lg">
                    Estas orientações detalham como estruturar contexto, comando,
                    alternativas, justificativas e metadados pedagógicos ao gerar
                    quizzes. O conteúdo é carregado diretamente de{" "}
                    <code className="rounded bg-muted px-1 py-0.5">
                        docs/instrucoes-prompt.md
                    </code>
                    .
                </p>
            </header>
            <section className="rounded-lg border bg-card p-6 shadow-sm">
                <pre className="whitespace-pre-wrap text-sm leading-relaxed">
                    {content}
                </pre>
            </section>
        </main>
    );
}
