@echo off
title מערכת סקרים - הפעלה
chcp 65001 > nul

echo ==========================================
echo   מערכת סקרים - איגוד מנהלי אגפי החינוך
echo ==========================================
echo.

:: בדיקת Python
python --version > nul 2>&1
if errorlevel 1 (
    echo שגיאה: Python לא מותקן. הורידי מ https://python.org
    pause
    exit /b 1
)

:: בדיקת Node.js
node --version > nul 2>&1
if errorlevel 1 (
    echo שגיאה: Node.js לא מותקן. הורידי מ https://nodejs.org
    pause
    exit /b 1
)

:: התקנת תלויות Python אם צריך
echo [1/3] בודק תלויות Python...
cd /d "%~dp0backend"
python -m pip install -r requirements.txt -q
echo        סיום.

:: התקנת תלויות Node אם צריך
echo [2/3] בודק תלויות Node.js...
cd /d "%~dp0frontend"
if not exist "node_modules" (
    npm install -q
)
echo        סיום.

:: הפעלת הבקאנד בחלון נפרד
echo [3/3] מפעיל שרתים...
cd /d "%~dp0backend"
start "Backend - FastAPI" cmd /k "title Backend ^& python -m uvicorn app.main:app --reload --port 8000"

:: המתנה קצרה לפני הפעלת הפרונטאנד
timeout /t 2 /nobreak > nul

:: הפעלת הפרונטאנד בחלון נפרד
cd /d "%~dp0frontend"
start "Frontend - React" cmd /k "title Frontend ^& npm run dev"

:: המתנה לפני פתיחת הדפדפן
timeout /t 4 /nobreak > nul

echo.
echo ==========================================
echo   האתר פועל!
echo   כתובת: http://localhost:5173
echo   אימייל: shelleykeren@gmail.com
echo   סיסמה: changeme123
echo ==========================================
echo.

:: פתיחת הדפדפן
start "" "http://localhost:5173"

echo ניתן לסגור חלון זה. השרתים ימשיכו לרוץ בחלונות הנפרדים.
pause
