# Script to generate simple CC0 wall textures for the 3D board

Add-Type -AssemblyName System.Drawing

$root = Join-Path $PSScriptRoot '..\public\models3d\walls'
New-Item -ItemType Directory -Force -Path $root | Out-Null

function New-Bitmap {
    param(
        [string]$Name,
        [ScriptBlock]$Draw
    )

    $bmp = New-Object System.Drawing.Bitmap 512, 512
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = 'HighQuality'

    & $Draw $bmp $g

    $path = Join-Path $root $Name
    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()

    Write-Output "Generated $path"
}

New-Bitmap -Name 'wall_metal_grid.png' -Draw {
    param($bmp, $g)
    $start = New-Object System.Drawing.Point 0, 0
    $end = New-Object System.Drawing.Point 512, 512
    $bg = New-Object System.Drawing.Drawing2D.LinearGradientBrush -ArgumentList `
        $start, `
        $end, `
        ([System.Drawing.Color]::FromArgb(30, 34, 44)), `
        ([System.Drawing.Color]::FromArgb(12, 14, 20))
    $g.FillRectangle($bg, 0, 0, 512, 512)

    $gridPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(120, 0, 210, 255)), 2
    for ($i = 0; $i -le 512; $i += 64) {
        $g.DrawLine($gridPen, $i, 0, $i, 512)
        $g.DrawLine($gridPen, 0, $i, 512, $i)
    }

    $accentPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(90, 255, 70, 180)), 3
    for ($i = 0; $i -le 512; $i += 128) {
        $g.DrawLine($accentPen, 0, $i + 16, 512, $i + 16)
    }

    $rand = [System.Random]::new()
    for ($i = 0; $i -lt 1500; $i++) {
        $x = $rand.Next(512)
        $y = $rand.Next(512)
        $color = [System.Drawing.Color]::FromArgb($rand.Next(20, 80), 120 + $rand.Next(40), 140 + $rand.Next(40), 160 + $rand.Next(40))
        $bmp.SetPixel($x, $y, $color)
    }
}

New-Bitmap -Name 'wall_concrete_noise.png' -Draw {
    param($bmp, $g)
    $g.Clear([System.Drawing.Color]::FromArgb(86, 86, 90))
    $rand = [System.Random]::new()
    for ($i = 0; $i -lt 6000; $i++) {
        $x = $rand.Next(512)
        $y = $rand.Next(512)
        $tone = 60 + $rand.Next(80)
        $alpha = 40 + $rand.Next(80)
        $bmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, $tone, $tone, $tone))
    }

    $crackPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(70, 40, 40, 40)), 1
    for ($i = 0; $i -lt 6; $i++) {
        $startX = $rand.Next(512)
        $startY = $rand.Next(512)
        for ($s = 0; $s -lt 5; $s++) {
            $endX = [Math]::Min(511, [Math]::Max(0, $startX + $rand.Next(-60, 60)))
            $endY = [Math]::Min(511, [Math]::Max(0, $startY + $rand.Next(-60, 60)))
            $g.DrawLine($crackPen, $startX, $startY, $endX, $endY)
            $startX = $endX
            $startY = $endY
        }
    }
}

New-Bitmap -Name 'wall_neon_stripes.png' -Draw {
    param($bmp, $g)
    $g.Clear([System.Drawing.Color]::FromArgb(18, 20, 28))
    $rand = [System.Random]::new()

    $panelBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(30, 70, 80, 90))
    for ($i = 0; $i -lt 5; $i++) {
        $x = $rand.Next(0, 400)
        $y = $rand.Next(0, 400)
        $w = $rand.Next(120, 260)
        $h = $rand.Next(80, 220)
        $g.FillRectangle($panelBrush, $x, $y, $w, $h)
    }

    $stripePen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(140, 0, 255, 190)), 5
    $offset = 0
    while ($offset -lt 640) {
        $g.DrawLine($stripePen, -40 + $offset, 0, 40 + $offset, 512)
        $offset += 40
    }

    $glowPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(90, 255, 120, 255)), 3
    for ($i = 0; $i -le 512; $i += 96) {
        $g.DrawLine($glowPen, 0, $i, 512, $i)
    }
}
