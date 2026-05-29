@echo off
REM Launch the admin web UI (Next.js). Build first with `npm run build`.
cd /d "%~dp0"
npm run web
pause
