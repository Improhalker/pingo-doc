import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

const root = fileURLToPath(new URL('../', import.meta.url))
const palettes = {
  light: { surface: '#FFFFFF', border: '#E7E0EC', text: '#241B2B', muted: '#756A7C', primary: '#5B2A86', secondary: '#594A91', soft: '#F0E8F7', accent: '#85520D', yellow: '#FBBF24' },
  dark: { surface: '#241B2D', border: '#45364F', text: '#F6F0FA', muted: '#C5B8CE', primary: '#D1AEF2', secondary: '#9F8FE5', soft: '#3B2752', accent: '#F7C477', yellow: '#FBBF24' },
}

// Synthetic integers are chart coordinates, not production monetary arithmetic.
const months = ['Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out']
const receipts = [100, 145, 130, 180, 155, 210]
const payments = [65, 100, 90, 115, 125, 145]
const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
const weekly = [90, 145, 112, 190, 155, 70, 30]
const categories = [{ label: 'Pessoal', percent: 45 }, { label: 'Operação', percent: 30 }, { label: 'Serviços', percent: 25 }]

const esc = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
function text(p, x, y, value, size = 14, fill = p.text, extra = '') {
  return `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" ${extra}>${esc(value)}</text>`
}
function shell(p, title, subtitle, body, description) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="420" viewBox="0 0 720 420" role="img" aria-labelledby="title description">
<title id="title">${title} — referência PingoFin</title><desc id="description">${description} Dados sintéticos para referência visual.</desc>
<style>text{font-family:Arial,Helvetica,sans-serif;font-variant-numeric:tabular-nums} .series{stroke-linecap:round;stroke-linejoin:round}</style>
<g id="card"><rect x="1" y="1" width="718" height="418" rx="16" fill="${p.surface}" stroke="${p.border}"/></g>
<g id="heading">${text(p, 32, 43, title, 24, p.text, 'font-weight="700"')}${text(p, 32, 69, subtitle, 14, p.muted)}</g>
${body}
<g id="disclaimer">${text(p, 32, 392, 'Dados ilustrativos · sem vínculo com organização', 13, p.muted)}</g></svg>\n`
}
function grid(p, labels, maxLabel) {
  return [0, 1, 2, 3].map((n) => {
    const y = 320 - n * 60
    return `<line x1="72" y1="${y}" x2="682" y2="${y}" stroke="${p.border}" stroke-dasharray="4 6"/>${text(p, 58, y + 5, `${n * maxLabel} mil`, 12, p.muted, 'text-anchor="end"')}`
  }).join('') + labels.map((label, i) => text(p, 84 + i * (574 / (labels.length - 1)), 349, label, 13, p.muted, 'text-anchor="middle"')).join('')
}
function lines(p) {
  const points = (series) => series.map((v, i) => `${84 + i * 114.8},${320 - v * 0.75}`).join(' ')
  const body = `<g id="summary">${text(p, 32, 112, 'R$ 21.000,00', 30, p.text, 'font-weight="700"')}${text(p, 33, 133, 'Recebimentos em outubro · exemplo', 13, p.muted)}</g>
<g id="legend"><circle cx="424" cy="102" r="5" fill="${p.primary}"/>${text(p, 437, 107, 'Recebido', 13)}<line x1="550" y1="102" x2="567" y2="102" stroke="${p.secondary}" stroke-width="3" stroke-dasharray="4 3"/>${text(p, 578, 107, 'Pago', 13)}</g>
<g id="grid">${grid(p, months, 8)}</g>
<g id="series-recebido"><polyline class="series" points="${points(receipts)}" fill="none" stroke="${p.primary}" stroke-width="4"/>${receipts.map((v, i) => `<circle cx="${84 + i * 114.8}" cy="${320 - v * 0.75}" r="5" fill="${p.surface}" stroke="${p.primary}" stroke-width="3"/>`).join('')}</g>
<g id="series-pago"><polyline class="series" points="${points(payments)}" fill="none" stroke="${p.secondary}" stroke-width="3" stroke-dasharray="8 6"/></g>`
  return shell(p, 'Entradas e saídas', 'Mai–Out 2026 · recebimentos e pagamentos efetivos · exemplo', body, 'Recebimentos de maio a outubro: 10, 14,5, 13, 18, 15,5 e 21 mil reais; pagamentos: 6,5, 10, 9, 11,5, 12,5 e 14,5 mil reais. Linhas com marcadores e tracejado distinguem séries.')
}
function bars(p) {
  const body = `<g id="summary">${text(p, 32, 112, 'R$ 7.920,00', 30, p.text, 'font-weight="700"')}${text(p, 33, 133, 'Total recebido · exemplo', 13, p.muted)}</g>
<g id="grid">${grid(p, days, 1)}</g>
<g id="series-semana">${weekly.map((v, i) => `<rect x="${64 + i * (574 / 6)}" y="${320 - v * 0.6}" width="40" height="${v * 0.6}" rx="6" fill="${i === 3 ? p.secondary : p.primary}"/>${text(p, 84 + i * (574 / 6), 309 - v * 0.6, `R$ ${v * 10}`, 12, p.muted, 'text-anchor="middle"')}`).join('')}</g>`
  return shell(p, 'Recebimentos na semana', '28 set–4 out 2026 · por data de recebimento · exemplo', body, 'De segunda a domingo: 900, 1450, 1120, 1900, 1550, 700 e 300 reais; total de 7920 reais.')
}
function donut(p) {
  const colors = [p.primary, p.secondary, p.accent]
  let offset = 0
  const arcs = categories.map((category, i) => {
    const arc = `<circle r="92" cx="185" cy="228" fill="none" stroke="${colors[i]}" stroke-width="34" pathLength="100" stroke-dasharray="${category.percent} ${100 - category.percent}" stroke-dashoffset="${-offset}" transform="rotate(-90 185 228)"/>`
    offset += category.percent
    return arc
  }).join('')
  const body = `<g id="donut-base"><circle cx="185" cy="228" r="92" fill="none" stroke="${p.soft}" stroke-width="34"/></g><g id="series-categorias">${arcs}</g>
<g id="summary">${text(p, 185, 222, 'R$ 8.000', 26, p.text, 'font-weight="700" text-anchor="middle"')}${text(p, 185, 248, 'Pagamentos', 14, p.muted, 'text-anchor="middle"')}</g>
<g id="legend">${categories.map((c, i) => `<rect x="350" y="${153 + i * 64}" width="12" height="12" rx="3" fill="${colors[i]}"/>${text(p, 376, 166 + i * 64, c.label, 17)}${text(p, 666, 166 + i * 64, `${c.percent}%`, 18, p.text, 'text-anchor="end" font-weight="700"')}${text(p, 376, 188 + i * 64, ['R$ 3.600,00', 'R$ 2.400,00', 'R$ 2.000,00'][i], 14, p.muted)}`).join('')}</g>`
  return shell(p, 'Despesas por categoria', 'Outubro 2026 · participação nos pagamentos · exemplo', body, 'Pessoal: 45%, 3600 reais; Operação: 30%, 2400 reais; Serviços: 25%, 2000 reais; total: 8000 reais.')
}
for (const [theme, p] of Object.entries(palettes)) {
  for (const [id, render] of [['fluxo-caixa', lines], ['recebimentos-semana', bars], ['despesas-categoria', donut]]) {
    for (const directory of ['docs/referencias-visuais/graficos', '../pingo-front-crm/public/referencias/graficos']) {
      await mkdir(join(root, directory), { recursive: true })
      await writeFile(join(root, directory, `${id}-${theme}.svg`), render(p))
    }
  }
}
console.log('6 SVGs gerados em docs/referencias-visuais/graficos e ../pingo-front-crm/public/referencias/graficos.')

