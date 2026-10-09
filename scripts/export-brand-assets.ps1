param(
    [string]$SourcePath = (Join-Path $PSScriptRoot '../docs/assets/brand/pingofin-symbol-v1.png'),
    [string]$OutputDirectory = (Join-Path $PSScriptRoot '../docs/assets/brand/exports')
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$source = [System.Drawing.Bitmap]::FromFile([System.IO.Path]::GetFullPath($SourcePath))
try {
    if ($source.Width -ne $source.Height) { throw 'O símbolo mestre deve ser quadrado.' }
    New-Item -ItemType Directory -Path $OutputDirectory -Force | Out-Null
    $exports = @(
        @{ Name = 'pingofin-navbar-v1.png'; Size = 128 },
        @{ Name = 'pingofin-navbar-v1@2x.png'; Size = 256 },
        @{ Name = 'favicon-v1-16.png'; Size = 16 },
        @{ Name = 'favicon-v1-32.png'; Size = 32 },
        @{ Name = 'favicon-v1-48.png'; Size = 48 },
        @{ Name = 'favicon-v1-256.png'; Size = 256 }
    )
    foreach ($export in $exports) {
        $bitmap = [System.Drawing.Bitmap]::new($export.Size, $export.Size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
        $attributes = [System.Drawing.Imaging.ImageAttributes]::new()
        try {
            $graphics.Clear([System.Drawing.Color]::Transparent)
            $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
            $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
            $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
            $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
            $attributes.SetWrapMode([System.Drawing.Drawing2D.WrapMode]::TileFlipXY)
            $rectangle = [System.Drawing.Rectangle]::new(0, 0, $export.Size, $export.Size)
            $graphics.DrawImage($source, $rectangle, 0, 0, $source.Width, $source.Height, [System.Drawing.GraphicsUnit]::Pixel, $attributes)
            $bitmap.Save((Join-Path $OutputDirectory $export.Name), [System.Drawing.Imaging.ImageFormat]::Png)
        } finally {
            $attributes.Dispose()
            $graphics.Dispose()
            $bitmap.Dispose()
        }
    }

    # ICO with independently encoded transparent PNG frames; no redesign or palette conversion.
    $sizes = @(16, 32, 48, 256)
    $frames = @($sizes | ForEach-Object { ,([System.IO.File]::ReadAllBytes((Join-Path $OutputDirectory "favicon-v1-$_.png"))) })
    $stream = [System.IO.File]::Create((Join-Path $OutputDirectory 'favicon-v1.ico'))
    $writer = [System.IO.BinaryWriter]::new($stream)
    try {
        $writer.Write([uint16]0)
        $writer.Write([uint16]1)
        $writer.Write([uint16]$sizes.Count)
        $offset = 6 + 16 * $sizes.Count
        for ($index = 0; $index -lt $sizes.Count; $index++) {
            $dimension = if ($sizes[$index] -eq 256) { 0 } else { $sizes[$index] }
            $writer.Write([byte]$dimension)
            $writer.Write([byte]$dimension)
            $writer.Write([byte]0)
            $writer.Write([byte]0)
            $writer.Write([uint16]1)
            $writer.Write([uint16]32)
            $writer.Write([uint32]$frames[$index].Length)
            $writer.Write([uint32]$offset)
            $offset += $frames[$index].Length
        }
        foreach ($frame in $frames) { $writer.Write([byte[]]$frame) }
    } finally {
        $writer.Dispose()
        $stream.Dispose()
    }
} finally {
    $source.Dispose()
}
Write-Output "Exportados navbar PNG 128/256 px e favicon ICO 16/32/48/256 px em $OutputDirectory"
