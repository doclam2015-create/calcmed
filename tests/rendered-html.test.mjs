import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

function extractCatalogCounts(source) {
  const file = ts.createSourceFile("clinical-app.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let catalog;
  const visit = (node) => {
    if (ts.isVariableDeclaration(node) && node.name.getText(file) === "catalogSource") catalog = node.initializer;
    ts.forEachChild(node, visit);
  };
  visit(file);
  assert.ok(catalog && ts.isObjectLiteralExpression(catalog), "No se encontró catalogSource");
  return Object.fromEntries(catalog.properties.map((property) => [property.name.text, property.initializer.elements.length]));
}

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("No encontrado", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("renderiza CalcMed con metadatos en español", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<html lang="es"/i);
  assert.match(html, /<title>CalcMed/i);
  assert.match(html, /Calculadoras, scores, algoritmos/i);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|Building your site/i);
});

test("incluye manifiesto, service worker e identidad de la PWA", async () => {
  const [layout, manifest, serviceWorker, clinicalApp] = await Promise.all([
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../public/manifest.webmanifest", import.meta.url), "utf8"),
    readFile(new URL("../public/sw.js", import.meta.url), "utf8"),
    readFile(new URL("../app/clinical-app.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(layout, /applicationName: "CalcMed"/);
  assert.match(layout, /appleWebApp/);
  assert.equal(JSON.parse(manifest).name, "CalcMed");
  assert.match(serviceWorker, /calcmed-v3/);
  assert.match(serviceWorker, /event\.request\.mode === "navigate"/);
  assert.match(clinicalApp, /process\.env\.NODE_ENV === "production"/);
  assert.match(clinicalApp, /serviceWorker\.register\("\/sw\.js", \{ updateViaCache: "none" \}\)/);
  assert.match(clinicalApp, /"Conversión de corticoides": \{/);
  assert.match(clinicalApp, /NIH\/NLM LiverTox/);
  assert.match(clinicalApp, /FUENTES INSTITUCIONALES/);
});

test("explica el significado y la utilidad después de cada resultado clínico", async () => {
  const clinicalApp = await readFile(new URL("../app/clinical-app.tsx", import.meta.url), "utf8");

  assert.match(clinicalApp, /function ExplanationCard/);
  assert.match(clinicalApp, /QUÉ SIGNIFICA/);
  assert.match(clinicalApp, /PARA QUÉ SIRVE/);
  assert.match(clinicalApp, /\{result && <>.*?<ExplanationCard/s);
  assert.match(clinicalApp, /\{scoreComplete && <ExplanationCard/);
  assert.match(clinicalApp, /if \(reference\) return <>.*?<ExplanationCard/s);
});

test("conserva las 267 herramientas y las 25 categorías de las capturas", async () => {
  const clinicalApp = await readFile(new URL("../app/clinical-app.tsx", import.meta.url), "utf8");
  const counts = extractCatalogCounts(clinicalApp);
  const expected = {
    Crecimiento: 10, Conversiones: 3, Renal: 13, Embarazo: 4, "Cuidados críticos": 24,
    Cardiovascular: 4, Fármacos: 13, "Fluidos IV": 5, "Valores sanguíneos": 15,
    Endocrinología: 5, Cirugía: 2, Polisomnografía: 3, Neurología: 8,
    "Gastro y hepatología": 60, Nutrición: 6, Neonatología: 8, Dolor: 1,
    Reumatología: 19, Infecciosas: 9, Obstetricia: 2, Respiratorio: 9, Radiología: 2,
    Psicosocial: 18, Oncología: 18, Hematología: 6,
  };

  assert.deepEqual(counts, expected);
  assert.equal(Object.values(counts).reduce((total, count) => total + count, 0), 267);
});
