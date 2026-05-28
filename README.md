# Module 3 Product Mix Notes Template

This is a modular, plug-and-play HTML study template for IIM Kozhikode BMS notes.

## How the template is structured

- `index.html` — stable page skeleton. Do not edit for normal note updates.
- `styles.css` — stable visual system. Edit only for design changes.
- `app.js` — stable rendering, search, filters, flashcards, exam bank, and diagnostics.
- `notes-data.js` — the only file your friend should normally edit.

## Plug-and-play rule

Each concept is one Lego block inside `window.NOTES_DATA.concepts`.

Add a new concept by copying an existing concept object in `notes-data.js`, changing the `id`, and filling the sections.

Every concept can include:

- `conceptSnapshot`
- `bigPicture`
- `textbookPerspective`
- `professorExpectation`
- `studentExplanation`
- `managerPov`
- `consumerPov`
- `indianContext`
- `globalContext`
- `frameworks`
- `examples`
- `caseConnections`
- `quantitative`
- `examToolkit`
- `quickRevision`
- `advancedInsight`
- `connections`

## Debugging model

Open the page in a browser and click `Diagnostics`.

The diagnostics panel shows:

- missing required fields
- duplicate concept IDs
- missing recommended master-template sections
- unknown source IDs
- invalid syllabus statuses

Also open the browser console for the full object:

```js
window.NOTES_DATA
```

## Data health rules

Use stable IDs:

```js
id: "product-mix-dimensions"
```

Do not use duplicate IDs.

Use only these checklist statuses:

```js
"covered"
"partial"
"missing"
"supplementary"
```

Use only these exam priorities:

```js
"High"
"Medium"
"Low"
```

Recommended content types:

```js
"core"
"supplementary"
"case"
"exam"
```

## How to preview locally

From this folder, run:

```bash
python3 -m http.server 8082
```

Then open:

```text
http://localhost:8082
```

You can also open `index.html` directly, but a local server is cleaner.

## Workflow for your friend

1. Add every file used into `sourceMap`.
2. Update `syllabusChecklist`.
3. Add concepts one by one inside `concepts`.
4. Refresh the browser.
5. Open `Diagnostics`.
6. Fix every warning or error shown.
7. Use search and filters to verify the concept appears correctly.
8. Print or export to PDF only after diagnostics are clean.

## Safety principle

If something is not in the provided material, label it clearly as general marketing context or unclear from provided material. Do not present unsupported content as course-backed fact.
