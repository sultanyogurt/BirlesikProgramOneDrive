@echo off
where npm >nul 2>nul
if errorlevel 1 (
  echo HATA: Node.js/NPM yok. https://nodejs.org adresinden Node.js 18+ kur.
  pause
  exit /b 1
)
npm install
npm start
