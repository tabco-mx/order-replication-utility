@echo off
REM Launch the admin UI. Double-click or run from a prompt.
cd /d "%~dp0"
node --env-file-if-exists=.env apps\ui\dist\server.js
pause
