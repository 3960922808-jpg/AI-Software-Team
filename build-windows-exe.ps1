# Requires PyInstaller: python -m pip install pyinstaller
Set-Location $PSScriptRoot
python -m PyInstaller --noconfirm --clean --windowed --name "AI Software Team" desktop_app.py
