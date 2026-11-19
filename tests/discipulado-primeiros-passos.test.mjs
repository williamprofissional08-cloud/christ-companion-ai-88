import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const source = JSON.parse(
  readFileSync(new URL("../docs/courses/primeiros-passos-com-cristo/curriculo.json", import.meta.url), "utf8"),
);
const { course, modules, lessons, content_blocks: blocks, exercises } = source;
const required = [
  "introducao",
  "leitura",
  "contexto",
  "interpretacao",
  "conexao_cristo",
  "reflexao",
  "desafio",
  "exercicio",
  "oracao",
];

test("trilha gratuita para novos convertidos, em oito módulos", () => {
  assert.equal(course.slug, "primeiros-passos-com-cristo-da-conversao-a-vida-transformada");
  assert.equal(course.level, "iniciante");
  assert.equal(course.tier, "free");
  assert.equal(modules.length, 8);
  assert.deepEqual(modules.map((m) => m.order_index), [1, 2, 3, 4, 5, 6, 7, 8]);
});

test("24 aulas únicas, com referência bíblica e ordenação de três por módulo", () => {
  assert.equal(lessons.length, 24);
  assert.equal(new Set(lessons.map((l) => l.id)).size, 24);
  assert.equal(new Set(lessons.map((l) => l.slug)).size, 24);
  for (const module of modules) {
    const inModule = lessons.filter((l) => l.module_id === module.id);
    assert.equal(inModule.length, 3, module.title);
    assert.deepEqual(inModule.map((l) => l.order_index), [1, 2, 3]);
    for (const lesson of inModule) {
      assert.ok(lesson.passage?.trim(), lesson.title);
      assert.ok(lesson.summary?.trim(), lesson.title);
    }
  }
});

test("cada aula inclui nove blocos editoriais na sequência certa", () => {
  assert.equal(blocks.length, 216);
  assert.equal(new Set(blocks.map((b) => b.id)).size, 216);
  for (const lesson of lessons) {
    const sections = blocks.filter((b) => b.lesson_id === lesson.id);
    assert.deepEqual(sections.map((b) => b.kind), required, lesson.title);
    assert.deepEqual(sections.map((b) => b.order_index), [1, 2, 3, 4, 5, 6, 7, 8, 9]);
    for (const section of sections) {
      assert.ok(section.body?.trim(), lesson.title + " / " + section.kind);
      assert.ok(section.scripture_refs?.length, lesson.title + " / " + section.kind);
    }
  }
});

test("24 exercícios interativos, cada um com três campos de aplicação", () => {
  assert.equal(exercises.length, 24);
  assert.equal(new Set(exercises.map((e) => e.lesson_id)).size, 24);
  assert.ok(exercises.every((e) => e.status === "published"));
  for (const exercise of exercises) {
    assert.equal(exercise.fields.length, 3);
    assert.ok(exercise.instructions?.trim());
    assert.ok(lessons.some((l) => l.id === exercise.lesson_id));
  }
});
