import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
const docRoot = fileURLToPath(new URL('../', import.meta.url))
const group = path.resolve(docRoot, '..')
const sources = path.resolve(group, '..')
const inventory = JSON.parse(
  fs.readFileSync(
    path.join(docRoot, 'migration/source-inventory.json'),
    'utf8',
  ),
)
const hash = (p) =>
  crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')
const isAdapted = (target) =>
  /^(pingo-front-crm\/(package.json|.gitattributes|data\/agent-changes.json|scripts\/|tests\/agent-changes-gate.test.ts|eslint.config.mjs|.prettierignore)|pingo-back-crm\/(.gitignore|.gitattributes|README.md|scripts\/configure-local.ps1|infra\/compose.yaml)|pingo-doc\/(AGENTS.md|CLAUDE.md|.gitattributes|docs\/.*\.md|docs\/referencias-visuais\/manifest.json|scripts\/(generate-visual-references.mjs|sync-visual-references.ps1))|pingo-landingpage\/(DIRECAO_VISUAL_LANDING_PAGE.md|.gitattributes|README.md|AGENTS.md|.gitignore))$/.test(
    target,
  )
const result = {
  checked: 0,
  identical: 0,
  adapted: [],
  missing: [],
  unexpectedDifferences: [],
  changedSources: [],
}
for (const file of inventory.files) {
  const source = path.join(sources, file.source),
    target = path.join(group, file.target)
  result.checked++
  if (!fs.existsSync(target)) {
    result.missing.push(file.target)
    continue
  }
  if (
    fs.existsSync(source) &&
    hash(source) !== file.sha256 &&
    file.source !== 'sistemafinanceiro/frontend/data/agent-changes.json'
  )
    result.changedSources.push(file.source)
  if (hash(target) === file.sha256) result.identical++
  else if (
    isAdapted(file.target) ||
    file.target.startsWith('pingo-front-crm/scripts/')
  )
    result.adapted.push(file.target)
  else result.unexpectedDifferences.push(file.target)
}
console.log(JSON.stringify(result, null, 2))
if (
  result.missing.length ||
  result.unexpectedDifferences.length ||
  result.changedSources.length
)
  process.exitCode = 1
