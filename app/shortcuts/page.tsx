import { IterationShell } from "@/components/iterations/iteration-shell"

export const metadata = {
  title: "Keyboard shortcuts - totoneru",
  description: "Keyboard shortcuts for totoneru.",
}

const appShortcuts = [
  {
    keys: ["↑"],
    description: "Move block up in the block editor",
    context: "Block editor",
  },
  {
    keys: ["↓"],
    description: "Move block down in the block editor",
    context: "Block editor",
  },
  {
    keys: ["Escape"],
    description: "Close modal dialogs",
    context: "Global",
  },
  {
    keys: ["Enter"],
    description: "Select focused card rows, prompt cards, buttons, and links",
    context: "Workspace",
  },
  {
    keys: ["Space"],
    description: "Toggle focused checkboxes and expandable controls",
    context: "Workspace",
  },
]

const accessibilityShortcuts = [
  {
    keys: ["Tab"],
    description: "Move focus to next interactive element",
    context: "Global",
  },
  {
    keys: ["Shift", "Tab"],
    description: "Move focus to previous interactive element",
    context: "Global",
  },
  {
    keys: ["Enter"],
    description: "Activate button or link",
    context: "Global",
  },
  {
    keys: ["Space"],
    description: "Toggle checkbox or activate button",
    context: "Global",
  },
]

export default function ShortcutsPage() {
  return (
    <IterationShell docsActive="shortcuts" showHelpToggle={false}>
      <div className="px-4 py-8 text-black sm:px-6 sm:py-12">
        <div className="mx-auto max-w-[900px]">
          <div className="mb-12">
            <p className="mb-2 font-mono text-[11px] font-bold tracking-[0.14em] text-[#757575] uppercase">
              Reference
            </p>
            <h1 className="text-[44px] leading-none font-black tracking-[-0.03em] sm:text-[64px]">
              Keyboard shortcuts
            </h1>
            <p className="mt-4 max-w-2xl text-[18px] leading-[1.5] text-[#4a4a4a]">
              All shortcuts work without modifiers unless noted. Shortcuts are
              disabled while typing in form fields.
            </p>
          </div>

          <ShortcutGroup title="App shortcuts" shortcuts={appShortcuts} />
          <ShortcutGroup
            title="Browser and accessibility"
            shortcuts={accessibilityShortcuts}
            className="mt-8"
          />

          <div className="mt-12 border-2 border-black bg-white p-6">
            <h2 className="mb-4 text-[28px] leading-none font-black">
              Accessibility notes
            </h2>
            <div className="space-y-3 text-[15px] leading-[1.55] text-[#4a4a4a]">
              <p>
                All interactive elements in totoneru are reachable via keyboard.
                The app uses semantic HTML and ARIA attributes where native
                semantics are insufficient.
              </p>
              <ul className="list-disc space-y-1 pl-5">
                <li>Modal dialogs trap focus and can be closed with Escape.</li>
                <li>
                  Form labels are explicitly associated with their controls.
                </li>
                <li>
                  Progress indicators expose their values to screen readers.
                </li>
                <li>
                  Expandable sections announce their expanded/collapsed state.
                </li>
                <li>Color is never the sole means of conveying information.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </IterationShell>
  )
}

function ShortcutGroup({
  title,
  shortcuts,
  className = "",
}: {
  title: string
  shortcuts: Array<{
    keys: string[]
    description: string
    context: string
  }>
  className?: string
}) {
  return (
    <section className={className}>
      <h2 className="mb-3 text-[24px] leading-none font-black">{title}</h2>
      <div className="space-y-2">
        {shortcuts.map((shortcut, index) => (
          <ShortcutRow key={index} shortcut={shortcut} />
        ))}
      </div>
    </section>
  )
}

function ShortcutRow({
  shortcut,
}: {
  shortcut: {
    keys: string[]
    description: string
    context: string
  }
}) {
  return (
    <div className="border-2 border-black bg-white px-5 py-4">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {shortcut.keys.map((key, kidx) => (
            <span key={kidx}>
              <kbd className="border border-black bg-white px-2 py-0.5 font-mono text-[12px] font-bold text-black">
                {key}
              </kbd>
              {kidx < shortcut.keys.length - 1 && (
                <span className="mx-1 text-[#757575]">+</span>
              )}
            </span>
          ))}
        </div>
        <p className="mt-1 text-[15px] text-black">{shortcut.description}</p>
        <p className="text-[12px] text-[#757575]">{shortcut.context}</p>
      </div>
    </div>
  )
}
