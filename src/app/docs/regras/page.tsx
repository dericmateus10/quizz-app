import { readFile } from "node:fs/promises";
import { cache } from "react";
import path from "node:path";

const loadRules = cache(async () => {
  const filePath = path.join(process.cwd(), "docs", "REGRAS_PROJETO.md");
  const content = await readFile(filePath, "utf-8");
  return content;
});

export default async function ProjectRulesPage() {
  const content = await loadRules();

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-12">
      <header className="space-y-3">
        <p className="text-primary font-semibold uppercase tracking-wide">
          Documentação
        </p>
        <h1 className="text-4xl font-bold">Regras do Projeto</h1>
        <p className="text-muted-foreground text-lg">
          Consulta rápida das convenções de contribuição definidas em{" "}
          <code className="rounded bg-muted px-1 py-0.5">docs/REGRAS_PROJETO.md</code>.
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
