export type HelpDocItem = {
  id: string
  title: string
  summary: string
  data: string
  privacy: string
  prerequisites: string
  output: string
  failures: string
}

export type HelpDocPage = {
  eyebrow: string
  title: string
  items: HelpDocItem[]
}

export const HELP_DOCS: Record<string, HelpDocPage> = {
  "/": {
    eyebrow: "Documentation",
    title: "Landing page",
    items: [
      {
        id: "overview",
        title: "Product overview",
        summary: "Explains what totoneru does and sends users into the deck workspace.",
        data: "Reads no deck or API-key data.",
        privacy: "No user content is uploaded. Analytics remains consent-gated.",
        prerequisites: "None.",
        output: "Navigation to the decks workflow.",
        failures: "If navigation fails, use the top nav link for Decks.",
      },
    ],
  },
  "/decks": {
    eyebrow: "Documentation",
    title: "Add words and decks",
    items: [
      {
        id: "manual-words",
        title: "Manual words",
        summary: "Add expression-only words without importing a deck.",
        data: "Stores expression text, export targets, template choice, and generated fields in IndexedDB.",
        privacy: "Manual words stay in the browser unless you export or send them to an AI provider.",
        prerequisites: "None.",
        output: "Standalone CSV/APKG export targets, imported-deck targets, or both.",
        failures: "Empty expressions are ignored. Browser storage clearing removes saved words.",
      },
      {
        id: "deck-import",
        title: "Deck import",
        summary: "Imports .apkg files and reads collection.anki21b in a Web Worker.",
        data: "Stores an original backup and parsed deck summary in IndexedDB.",
        privacy: "Deck files are parsed locally and never uploaded.",
        prerequisites: "Modern Anki .apkg using collection.anki21b.",
        output: "An active deck workspace with note types, sample cards, media summary, and mappings.",
        failures: "Older collection formats are rejected with a clear message.",
      },
    ],
  },
  "/tools": {
    eyebrow: "Documentation",
    title: "Tools",
    items: [
      {
        id: "mapping",
        title: "Field mapping",
        summary: "Assign roles such as expression, reading, meaning, sentence, and translation to deck fields.",
        data: "Reads parsed note type fields and sample note content.",
        privacy: "Mapping changes stay in IndexedDB.",
        prerequisites: "An imported deck.",
        output: "Role mappings used by templates, transformations, AI prompts, and export.",
        failures: "Low-confidence suggestions should be reviewed manually.",
      },
      {
        id: "templates",
        title: "Templates and preview",
        summary: "Choose built-in card templates and compare original versus transformed output.",
        data: "Reads sample cards and template HTML.",
        privacy: "Preview rendering uses sandboxed iframes.",
        prerequisites: "An imported deck with renderable templates.",
        output: "A non-destructive preview of reordered/transformed fields.",
        failures: "Some complex Anki templates may not render with full Anki parity.",
      },
      {
        id: "transformations",
        title: "Built-in transformations",
        summary: "Clean HTML, normalize fields, and optionally generate furigana.",
        data: "Reads selected field values and roles.",
        privacy: "Runs locally; kuromoji tokenization happens in a Web Worker.",
        prerequisites: "An imported deck and field mappings.",
        output: "Previewed or staged transformed field values.",
        failures: "Furigana may be slow on first tokenizer load.",
      },
    ],
  },
  "/ai": {
    eyebrow: "Documentation",
    title: "AI transformation",
    items: [
      {
        id: "api-keys",
        title: "API keys",
        summary: "Save OpenAI-compatible or Anthropic keys for direct browser-to-provider requests.",
        data: "Stores endpoint, provider, model, label, and API key in IndexedDB.",
        privacy: "Keys are not sent to totoneru servers. Requests go directly to the selected provider.",
        prerequisites: "A provider API key.",
        output: "An active AI configuration for prompt runs.",
        failures: "Provider CORS, invalid keys, or model names can fail requests.",
      },
      {
        id: "prompts",
        title: "Prompt library",
        summary: "Select curated prompts or create custom prompts using field-role variables.",
        data: "Reads mapped sample fields for interpolation.",
        privacy: "Only prompt content and selected field values are sent when you run an AI request.",
        prerequisites: "An imported deck for sample interpolation.",
        output: "Prompt previews, single-sample results, dry-runs, and staged batch results.",
        failures: "Missing mappings produce empty variables.",
      },
      {
        id: "batch",
        title: "Dry-run and batch",
        summary: "Run a sample dry-run before applying AI/built-in transformations to all sample notes.",
        data: "Reads parsed notes and transformation settings.",
        privacy: "AI-enabled batches send only prompt payloads to the selected provider.",
        prerequisites: "A selected prompt for AI batches.",
        output: "Staged changes that can be retried, discarded, or exported.",
        failures: "Rate limits and provider failures are isolated per card.",
      },
    ],
  },
  "/export": {
    eyebrow: "Documentation",
    title: "Export",
    items: [
      {
        id: "manual-export",
        title: "Standalone manual export",
        summary: "Export manual words to CSV or a new Anki .apkg without importing a deck.",
        data: "Reads manual words targeted for standalone export.",
        privacy: "Export runs locally and downloads a local file.",
        prerequisites: "At least one manual word with standalone target enabled.",
        output: "CSV or collection.anki21b-based APKG.",
        failures: "Empty word lists produce empty/no-op exports.",
      },
      {
        id: "deck-export",
        title: "Imported deck export",
        summary: "Writes staged transformations and targeted manual words into a copy of the imported deck.",
        data: "Reads original backup, mappings, transformations, staged batch changes, and manual words targeted to deck.",
        privacy: "The original backup is never mutated.",
        prerequisites: "An imported deck.",
        output: "A transformed APKG plus verification status.",
        failures: "Missing backup data or unsupported schema blocks export.",
      },
    ],
  },
}

