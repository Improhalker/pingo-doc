import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const group = fileURLToPath(new URL('../../', import.meta.url))
const history = JSON.parse(
  fs.readFileSync(
    path.join(group, 'pingo-front-crm/data/agent-changes.json'),
    'utf8',
  ),
)
let checked = 0
function inspect(directory) {
  for (const item of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, item.name)
    if (item.isDirectory()) inspect(file)
    else if (/\.(js|json|html|map)$/.test(item.name)) {
      const text = fs.readFileSync(file, 'utf8')
      if (history.changes.some((change) => text.includes(change.id)))
        throw new Error(
          'Registro privado em artefato público: ' + path.relative(group, file),
        )
      checked++
    }
  }
}
for (const directory of [
  'pingo-front-crm/.output/public',
  'pingo-landingpage/dist',
])
  inspect(path.join(group, directory))
console.log(
  'Artefatos públicos sem registros privados: ' +
    checked +
    ' arquivos conferidos.',
)
