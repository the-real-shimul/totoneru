import { copyFileSync, mkdirSync, readdirSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const dictSrc = join(root, "node_modules", "kuromoji", "dict")
const dictDst = join(root, "public", "dict")
const jsSrc = join(root, "node_modules", "kuromoji", "build", "kuromoji.js")
const jsDst = join(root, "public", "kuromoji.js")

mkdirSync(dictDst, { recursive: true })

for (const file of readdirSync(dictSrc)) {
  copyFileSync(join(dictSrc, file), join(dictDst, file))
}

copyFileSync(jsSrc, jsDst)

console.log("kuromoji assets copied to public/")
