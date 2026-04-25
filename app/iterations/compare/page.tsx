import Link from "next/link"

export const metadata = {
  title: "Compare UI Iterations — totoneru",
}

export default function CompareIterationsPage() {
  return (
    <main className="min-h-svh bg-white text-black">
      <header className="border-b-2 border-black px-4 py-3">
        <div className="mx-auto flex max-w-[1800px] flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[#757575]">
              totoneru UI review
            </p>
            <h1 className="text-[26px] font-black leading-none tracking-[-0.02em]">
              Iteration A / Chosen B
            </h1>
          </div>
          <div className="flex gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.1em]">
            <Link className="border-2 border-black px-3 py-2 hover:bg-black hover:text-white" href="/iterations/a">
              Open A
            </Link>
            <Link className="border-2 border-black px-3 py-2 hover:bg-black hover:text-white" href="/iterations/b">
              Open B
            </Link>
            <Link className="border-2 border-black bg-black px-3 py-2 text-white hover:bg-white hover:text-black" href="/">
              Open chosen
            </Link>
          </div>
        </div>
      </header>

      <section className="grid h-[calc(100svh-74px)] grid-cols-1 md:grid-cols-2">
        <PreviewFrame title="Iteration A" src="/iterations/a" />
        <PreviewFrame title="Chosen B" src="/" />
      </section>
    </main>
  )
}

function PreviewFrame({ title, src }: { title: string; src: string }) {
  return (
    <div className="flex min-h-[70svh] flex-col border-b-2 border-black md:border-b-0 md:border-r-2">
      <div className="flex items-center justify-between border-b-2 border-black bg-black px-3 py-2 text-white">
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em]">
          {title}
        </p>
        <Link className="font-mono text-[11px] uppercase tracking-[0.1em] underline" href={src}>
          Full view
        </Link>
      </div>
      <iframe
        title={title}
        src={src}
        className="h-full w-full flex-1 bg-white"
      />
    </div>
  )
}
