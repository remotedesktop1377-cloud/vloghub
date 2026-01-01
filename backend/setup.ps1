# ================================
# One-click Python backend setup
# ================================

Write-Host "🔍 Checking Python version..."

$pythonVersion = python --version 2>$null

if (-not $pythonVersion) {
    Write-Error "❌ Python not found. Install Python 3.10 first."
    exit 1
}

if ($pythonVersion -notmatch "3\.10") {
    Write-Error "❌ Python 3.10 required. Found: $pythonVersion"
    exit 1
}

Write-Host "✅ Python OK:" $pythonVersion

# Create venv if missing
if (-not (Test-Path "venv")) {
    Write-Host "📦 Creating virtual environment..."
    python -m venv venv
} else {
    Write-Host "ℹ️ venv already exists"
}

# Activate venv
Write-Host "⚡ Activating virtual environment..."
& .\venv\Scripts\Activate.ps1

# Upgrade pip tools
Write-Host "⬆️ Upgrading pip..."
python -m pip install --upgrade pip setuptools wheel

# Install dependencies
if (Test-Path "requirements.txt") {
    Write-Host "📚 Installing dependencies..."
    pip install -r requirements.txt
} else {
    Write-Warning "⚠️ requirements.txt not found"
}

Write-Host "✅ Setup complete!"
Write-Host "Run: python -m uvicorn main:app --reload"
