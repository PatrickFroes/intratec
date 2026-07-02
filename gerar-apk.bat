@echo off
setlocal
echo ============================================
echo      GERADOR DE APK - SHOPPING INTRANET      
echo ============================================

echo [1/6] Verificando dependencias do Capacitor...
if not exist "node_modules\@capacitor\core" (
    echo Instalando @capacitor/core...
    call npm install @capacitor/core
)
if not exist "node_modules\@capacitor\cli" (
    echo Instalando @capacitor/cli...
    call npm install -D @capacitor/cli
)
if not exist "node_modules\@capacitor\android" (
    echo Instalando @capacitor/android...
    call npm install -D @capacitor/android
)

echo [2/6] Verificando plataforma Android...
if not exist "android" (
    echo Adicionando plataforma Android...
    call npx cap add android
    if %ERRORLEVEL% NEQ 0 (
        echo ERRO: Falha ao adicionar plataforma Android.
        pause
        exit /b %ERRORLEVEL%
    )
)

echo [3/6] Instalando dependencias do projeto...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERRO: Falha no npm install.
    pause
    exit /b %ERRORLEVEL%
)

echo [4/6] Construindo o projeto Web...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ERRO: Falha no build do Next.js.
    pause
    exit /b %ERRORLEVEL%
)

echo [5/6] Sincronizando com Android...
call npx cap sync android
if %ERRORLEVEL% NEQ 0 (
    echo ERRO: Falha no sync do Capacitor.
    pause
    exit /b %ERRORLEVEL%
)

echo [6/6] Abrindo Android Studio...
echo.
echo ============================================
echo SUCESSO! O Android Studio sera aberto.
echo PARA GERAR O APK:
echo 1. Aguarde o carregamento (Gradle Sync) na barra inferior.
echo 2. Va no menu: Build -^> Build Bundle(s) / APK(s) -^> Build APK(s)
echo 3. O apk estara em: android/app/build/outputs/apk/debug/
echo ============================================
echo.
call npx cap open android

pause
