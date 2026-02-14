param(
    [Parameter(ValueFromRemainingArguments=$true)]
    [string[]]$CommandArgs
)

$envFile = Join-Path $PSScriptRoot ".env"

if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#")) {
            if ($line -match '^\s*([^=]+)\s*=\s*(.*)$') {
                $key = $matches[1].Trim()
                $value = $matches[2].Trim()
                if ($key -and $value) {
                    [Environment]::SetEnvironmentVariable($key, $value, "Process")
                }
            }
        }
    }
    Write-Host "✓ Environment variables loaded from .env file" -ForegroundColor Green
} else {
    Write-Host "⚠ Warning: .env file not found at $envFile" -ForegroundColor Yellow
    Write-Host "  Please create a .env file with your AWS credentials:" -ForegroundColor Yellow
    Write-Host "  REMOTION_AWS_ACCESS_KEY_ID=your-access-key" -ForegroundColor Yellow
    Write-Host "  REMOTION_AWS_SECRET_ACCESS_KEY=your-secret-key" -ForegroundColor Yellow
    exit 1
}

if ($CommandArgs.Count -gt 0) {
    $command = $CommandArgs -join " "
    Write-Host "Executing: $command" -ForegroundColor Cyan
    Invoke-Expression $command
} else {
    Write-Host "Usage: .\lambda-env.ps1 <remotion-command>" -ForegroundColor Cyan
    Write-Host "Examples:" -ForegroundColor Cyan
    Write-Host "  .\lambda-env.ps1 npx remotion lambda policies validate" -ForegroundColor White
    Write-Host "  .\lambda-env.ps1 npx remotion lambda functions deploy" -ForegroundColor White
    Write-Host "  .\lambda-env.ps1 npx remotion lambda quotas" -ForegroundColor White
}
