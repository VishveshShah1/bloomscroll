@echo off
REM ── Bloomscroll one-step deploy ────────────────────────────────────────────
REM Double-click this file (or run it in a terminal). It uses the portable
REM Node that was installed at C:\Users\vishv\tools\node, so you don't need a
REM system Node install.
REM
REM First run only: it will ask you to log in to Vercel (opens your browser),
REM then "Link to existing project?" -> choose Yes -> pick "bloomscroll".
REM Every run after that is just: double-click -> live.
REM ---------------------------------------------------------------------------

setlocal
set "PATH=C:\Users\vishv\tools\node;%PATH%"
cd /d "%~dp0"

echo.
echo === Bloomscroll -> Vercel (production) ===
echo.

REM Log in if needed (no-op if already logged in)
call npx --yes vercel@latest whoami >nul 2>&1 || call npx --yes vercel@latest login

REM Deploy the current folder to production
call npx --yes vercel@latest --prod

echo.
echo === Done. The URL printed above is your live site. ===
echo.
pause
