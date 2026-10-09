# PingoFin — símbolo v1, navbar e favicon

Versão escolhida pelo usuário em 06/10/2026: gota roxa, ponta amarela curvada, olhos expressivos e sorriso. O arquivo mestre é a primeira proposta desta conversa, preservada integralmente. As exportações apenas redimensionam a imagem e empacotam o ICO; não regeneram nem redesenham o símbolo.

## Arquivos

| Arquivo                                 | Dimensão         | Uso                                                    |
| --------------------------------------- | ---------------- | ------------------------------------------------------ |
| `pingofin-symbol-v1.png`                | 1280 × 1280      | Mestre raster aprovado como direção visual             |
| `exports/pingofin-navbar-v1.png`        | 128 × 128        | Símbolo compacto para navegação, exibido em 32–48 px   |
| `exports/pingofin-navbar-v1@2x.png`     | 256 × 256        | Mesmo símbolo em resolução dupla                       |
| `exports/favicon-v1.ico`                | 16, 32, 48 e 256 | Favicon com quatro frames PNG transparentes            |
| `exports/favicon-v1-{16,32,48,256}.png` | Conforme o nome  | Alternativas PNG e inspeção por tamanho                |
| `source.json`                           | —                | Procedência, prompt original, seleção e hash do mestre |

Todos os PNGs têm canal alfa. O rosto, as cores e as margens da versão aprovada permanecem iguais em todas as exportações. Não aplicar filtros CSS, inversão, sombra ou recorte circular à imagem. O arquivo é raster; ainda não é um SVG nem um desenho vetorial com cores HEX garantidas. A uniformização dos preenchimentos e a paleta exata ficam para a construção vetorial posterior, preservando a forma escolhida.

## Uso no CRM e na landing

Os dois projetos recebem o mesmo pacote público em `public/brand/` (no CRM, `frontend/public/brand/`) e uma cópia em `public/favicon.ico`, descoberta automaticamente pelos navegadores. A cópia de fontes da landing fica em `assets/brand/`. Não há dependência de caminhos locais entre as aplicações.

Para declarar explicitamente o favicon no head:

```html
<link
  rel="icon"
  href="/brand/favicon-v1.ico"
  sizes="16x16 32x32 48x48 256x256"
/>
<link
  rel="icon"
  type="image/png"
  sizes="32x32"
  href="/brand/favicon-v1-32.png"
/>
```

Para colocar o símbolo ao lado do nome existente na navbar:

```html
<img
  src="/brand/pingofin-navbar-v1.png"
  srcset="/brand/pingofin-navbar-v1@2x.png 2x"
  width="40"
  height="40"
  alt=""
/>
```

Usar `object-fit: contain` e reservar largura/altura. Quando o nome PingoFin já aparece ao lado, `alt=""` evita repetição; quando o símbolo é o único conteúdo de um link, dar ao link um nome acessível, como “PingoFin — início”. A tipografia do nome permanece HTML existente, sem wordmark gerado. O mesmo PNG colorido serve sobre superfícies claras e escuras; nenhuma variante monocromática foi criada.

Esta entrega organiza os assets e disponibiliza `/favicon.ico`; não altera componentes de navegação nem o layout dos projetos. A referência Wiser orientou somente a relação entre personagem e símbolo. Nenhum asset dela foi utilizado.

## Reexportar no Windows

Na raiz do CRM, com PowerShell e System.Drawing disponíveis:

```powershell
./scripts/export-brand-assets.ps1
```

O comando usa exclusivamente o mestre local e reexporta arquivos em `docs/assets/brand/exports/`. Depois copiar esses arquivos para as pastas públicas dos dois projetos. Não exige uma nova geração por IA ou instalação de dependências. Preservar a prancha oficial em `docs/assets/pingo-referencia.jpg` e os mascotes individuais existentes.

## Conferência desta entrega

O SHA256 do mestre copiado foi comparado com o PNG original da geração. Foram conferidos dimensões, canal ARGB, cantos transparentes e os quatro frames do ICO, idênticos aos PNGs correspondentes. As prévias de 128 e 32 px foram inspecionadas visualmente. Em 16 px há redução natural dos detalhes dos olhos; não foi inventada uma geometria alternativa.
