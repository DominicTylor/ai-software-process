# Delivery Control Plane — Design (Срез 1)

Дата: 2026-06-06
Статус: согласован, готов к плану реализации
Базируется на: `github.com/DominicTylor/ai-software-process` (канон процесса)

## 1. Видение

Локальный персональный **delivery control plane** — UI поверх master-репозитория
процесса AI-Native Software Delivery. UI не «обёртка над чатом», а **вид над
фактами git + forge**: он вычисляет delivery-состояние из артефактов и git,
ведёт каждый change vector к мержу.

Канон прямо предусматривает этот инструмент:

> «A dashboard, if and when one exists, is a view over those facts —
> never a separate source of truth.» (`process.md` § State and workflow)

Базовые принципы канона, которым мы подчиняемся:
- **State is computed from git (branches + PRs + CI), never from a status field.**
- **Acceptance criteria — это commented executable tests**, не проза в Markdown.
- **Decision history — в структурированных git-коммитах**, не в файлах.
- **Master perimeter** (Stories, frameworks, constitution) выше **code perimeter**,
  awareness асимметричен: master никогда не «дотягивается» в код-репы.

Наш инструмент — **master-perimeter tooling**: читает только master-периметр
(`stories/`, `frameworks/`, `constitution.md`, git master-репы и, later, его forge
PR). В код-репы он не заглядывает — это держит нас в рамках канона.

## 2. Где живёт инструмент

**Форк `ai-software-process`**, инструмент встраивается в существующее
pnpm-монорепо как новые workspace-пакеты/apps. Dashboard едет вместе с каноном.

Существующая конфигурация репы, которую расширяем:
- `pnpm-workspace.yaml`: сейчас `frameworks/*`, `demo` → добавляем `packages/*`, `apps/*`.
- Нейминг пакетов: конвенция `@canon/*` (есть `@canon/e2e-framework`).
- `type: module` (ESM), Node `>=24`, TypeScript `6.x`,
  `moduleResolution: Bundler`, `strict`, `noUncheckedIndexedAccess` (из `tsconfig.base.json`).

Инструмент по умолчанию наблюдает **сам этот репозиторий** как target
(master-периметр), а путь к target задаётся конфигом — можно нацелить и на другой
master-репо.

## 3. Доменная модель (канон)

- **Change vector = `(branch, PR)`** против master-репы — единица in-flight работы,
  которую наблюдаем, кому-то принадлежащую, гейтируемую. Это и есть «ветка = тикет».
  Вектор может трогать любое число файлов.
- **Story** — папка `stories/<grouping>/<slug>/` с `user-spec.md` и гейт-папками
  `e2e/ perf/ security/ a11y/`. Описывает **только текущее поведение**.
- **user-spec.md** — YAML-frontmatter (`title`, `slug`, `enforces`, `affects`),
  валидируется JSON-схемой `templates/story/user-spec.schema.json`. AC в спеке НЕТ.
- **Acceptance criteria = commented-тесты** в гейт-папках: natural-language
  комментарии `// #` + код под ними в одном файле.
- **Decision history — git-коммиты** формата `behavior:` (Why/Considered/Chose/Affects),
  теги `decision/*`; enforced `commit-msg`-хуком.
- **Frameworks** — `frameworks/<kind>/` в корне master-периметра (bilateral contract:
  глаголы персон ↔ селекторы/PageObjects). Сейчас есть только `frameworks/e2e`.
- **Состояние всё derived**: из наличия/содержимого артефактов + git (+ forge later).
  Никаких статус-полей и `status.json`.

## 4. Состояние вектора: два слоя

### Слой A — canonical vector state (git + forge)

Каноническая таблица состояний (`process.md` § State and workflow):

| Branch | PR | Vector state |
|---|---|---|
| нет (не было / влита в main) | — | Не существует / изменение Live |
| есть, PR нет | — | Private WIP |
| есть, PR draft/closed | Draft/Closed | Всё ещё Private WIP (итерация) |
| есть, PR open не-draft | Open | Under review |
| есть, PR open + approvals + CI green | Open | Ready to merge |
| влита | Merged | Live |

### Слой B — readiness-сигналы (derived, информационные)

Дополнительно показываем готовность артефактов внутри вектора (см. §5).
Это не подменяет canonical state — это то, что помогает понять «что осталось».

## 5. Readiness-сигналы (выводимы локально, срез 1)

Для каждого вектора — diff к `main` → затронутые пути, далее по затронутым Story:

| Сигнал | Из чего выводим |
|---|---|
| story touched | путь под `stories/<...>/` |
| spec present | наличие `user-spec.md` |
| spec valid | frontmatter ↔ JSON-схема (ajv) + ошибки |
| scenarios present (per kind) | файлы в `e2e/ perf/ security/ a11y/` (`perf` = `*.k6.ts`) |
| scenario scaffold vs implemented | парс тестов: `test.todo(`/`test.skip(` = scaffold, `test(` = реализован 🔑 |
| frameworks touched | пути под `frameworks/**` |
| constitution touched | `constitution.md` |
| behavioral commits well-formed | `git log main..branch`: `behavior:`-коммиты имеют все секции |
| candidate owners | `.github/CODEOWNERS` × затронутые пути |

## 6. Охват среза 1 (local-only)

**Срез 1 = read-only дашборд, входы только локальный git + файлы.** Запуска
процессов/тестов нет; forge не подключён.

**Доступно:**
- список векторов = веток (`git branch [-a]`),
- canonical state в подмножестве: **Live** (влита в `main`) / **Private WIP**
  (есть ветка, PR неизвестен),
- все readiness-сигналы из §5,
- кандидаты-владельцы из CODEOWNERS,
- next-action подсказки, выведенные из readiness (напр. «scenarios — scaffold →
  Implement scenarios», «spec invalid → Fix frontmatter»). Кнопки **информационные**.

**`unknown` до следующих срезов:**
- Under review / Ready to merge, статус PR, CI-чеки, approvals → **срез 3 (forge)**;
- фактический pass/fail тестов и перфа (исполнение) → **срез 2**.

UI явно маркирует такие гейты как `unknown / needs GitHub` или `needs execution`,
а не выдаёт зелёный/красный.

## 7. Архитектура (расширение монорепо)

```
packages/
  cp-contracts/   общие TS-типы (Vector, VectorState, Story, GateKind,
                  ReadinessSignal, NextAction)
  cp-core/        движок состояний — ЧИСТЫЙ, без IO (facts → vector view)
  cp-git/         git-reader: simple-git, ветки, diff к main, чтение по ref,
                  git log (decision-формат), merged-флаг
  cp-spec/        парсеры артефактов: frontmatter+ajv, детект гейтов,
                  scaffold/implemented, CODEOWNERS-матчинг
apps/
  cp-server/      Fastify: API + раздача SPA (+ socket.io-каркас на будущее)
  cp-web/         React + Vite + shadcn
```

**Поток данных:**
```
запрос
  → cp-git:   ветки + diff к main + git log + merged-флаг
  → cp-spec:  по затронутым путям → spec/гейты/scaffold/owners (facts)
  → cp-core:  facts → { vectorState, readiness[], nextAction }  (чистая функция)
  → API:      сериализация
  → cp-web:   рендер
```

**Принцип изоляции:** `cp-core` — чистая функция без IO, исчерпывающе
юнит-тестируемая. Источники фактов (git/forge) — снаружи и нормализуются перед
ядром. Так forge-факты (срез 3) и execution-факты (срез 2) **доливаются в слой
фактов без переписывания ядра**.

## 8. API и Frontend

**API (`cp-server`):**
- `GET /api/vectors` → список векторов: state, readiness, nextAction, owners.
- `GET /api/vectors/:branch` → детально: затронутые Story, разбор сигналов,
  сводка diff, behavioral-коммиты.

**Frontend (`cp-web`):**
- Грид карточек векторов: бейдж canonical-state, readiness-чеклист
  (`ok / scaffold / missing / unknown`), кандидаты-владельцы, next-action.
- Детальная страница вектора: затронутые Story, по каждой — спека (валидна?),
  гейты по kind с пометкой scaffold/implemented, сводка diff, decision-коммиты.

## 9. Тестирование

- `cp-core`: юнит-тесты по фикстурам фактов, **исчерпывающе по состояниям и
  комбинациям readiness** (здесь — TDD).
- `cp-git`/`cp-spec`: тесты против временного фикстур-git-репо (создаём в тестах:
  ветки, коммиты в `behavior:`-формате, story-папки, scaffold/implemented тесты).
- Сам инструмент — тоже Story в каноне: можно завести `stories/.../control-plane/`
  с e2e-сценариями нашего дашборда (дробится позже, не в срезе 1).

## 10. «Подготовить всё» и Roadmap

**Подготовка тулчейна (часть bootstrap, без исполнения в срезе 1):**
- скелет `frameworks/perf` (k6) рядом с `frameworks/e2e`; при необходимости
  `frameworks/security`, `frameworks/a11y`;
- UI/`cp-spec` единообразно работают со всеми kind гейтов (`e2e/perf/security/a11y`)
  с самого начала, чтобы перф/секьюрити «доливались» без переделок.

**Срез 2 — исполнение:** воркеры + `spawn`/`node-pty`, прогон Playwright и k6,
стриминг логов через socket.io, заполнение execution pass/fail.

**Срез 3 — forge/GitHub:** PR/CI/approvals через `gh`/GitHub API + Checks API
(читаем результаты канонических воркфлоу: `spec-validation`, `e2e`, `commit-format`,
`ai-review`). Закрывает слой A до `Under review / Ready to merge` и доводит до мержа.
Источники доливаются в факты, `cp-core` не меняется.

## 11. Открытые конвенции (добить в плане)

Большинство выведено из канона; осталось зафиксировать детали детекта:
- точные правила парса `test.todo`/`test.skip`/`test` (учёт `test.describe`,
  вложенности, закомментированных блоков);
- маппинг файла гейта на kind по пути (`*/e2e/*`, `*/perf/*.k6.ts`, `*/security/*`,
  `*/a11y/*`) и крайние случаи;
- алгоритм diff-к-main (merge-base vs three-dot) и группировка путей в Story по slug;
- разбор `behavioral`-коммита (какие секции обязательны, как трактовать non-behavior
  коммиты) для сигнала «well-formed»;
- парсер `CODEOWNERS` (glob-семантика, последнее совпадение выигрывает).
