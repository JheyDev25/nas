@echo off
cd /d "%~dp0"
title Vibe Tindahan - Smart Business Management System
echo ====================================================
echo 🛍️  Vibe Tindahan – Smart Business Management System
echo 🏪  Ang Maaasahang POS at Imbentaryo ng Tindahan
echo ====================================================
echo.
echo Starting Vibe Tindahan server...
if exist "C:\Program Files\nodejs\node.exe" (
    "C:\Program Files\nodejs\node.exe" server/server.js
) else (
    node server/server.js
)
pause

