$certName = "Autoliv Touch Screen"
$exePath = "release-packager\AutolivTouchScreen-win32-x64\AutolivTouchScreen.exe"

# Check if certificate exists
$cert = Get-ChildItem Cert:\CurrentUser\My | Where-Object { $_.Subject -eq "CN=$certName" }

if (-not $cert) {
    Write-Host "Criando certificado auto-assinado..."
    $cert = New-SelfSignedCertificate -Type CodeSigningCert -Subject "CN=$certName" -CertStoreLocation Cert:\CurrentUser\My
    Write-Host "Certificado criado: $($cert.Thumbprint)"
}
else {
    Write-Host "Certificado encontrado: $($cert.Thumbprint)"
}

if (Test-Path $exePath) {
    Write-Host "Assinando executável..."
    Set-AuthenticodeSignature -Certificate $cert -FilePath $exePath
    Write-Host "Executável assinado com sucesso!"

    # Export public certificate
    $certPath = "release-packager\AutolivTouchScreen-win32-x64\AutolivTouchScreen.cer"
    Export-Certificate -Cert $cert -FilePath $certPath -Type CERT
    Write-Host "Certificado exportado para: $certPath"

    # Create install script
    $batPath = "release-packager\AutolivTouchScreen-win32-x64\instalar-certificado.bat"
    $batContent = @"
@echo off
echo Solicitando privilegios de administrador...
>nul 2>&1 "%SYSTEMROOT%\system32\cacls.exe" "%SYSTEMROOT%\system32\config\system"
if '%errorlevel%' NEQ '0' (
    echo Solicitando permissao...
    goto UACPrompt
) else ( goto gotAdmin )

:UACPrompt
    echo Set UAC = CreateObject^("Shell.Application"^) > "%temp%\getadmin.vbs"
    echo UAC.ShellExecute "%~s0", "", "", "runas", 1 >> "%temp%\getadmin.vbs"
    "%temp%\getadmin.vbs"
    exit /B

:gotAdmin
    if exist "%temp%\getadmin.vbs" ( del "%temp%\getadmin.vbs" )
    pushd "%CD%"
    CD /D "%~dp0"

echo Instalando certificado Autoliv Touch Screen...
certutil -addstore "Root" AutolivTouchScreen.cer
if %errorlevel% equ 0 (
    echo.
    echo Certificado instalado com sucesso!
    echo Agora voce pode executar o AutolivTouchScreen.exe sem avisos de editor desconhecido.
) else (
    echo.
    echo Erro ao instalar certificado.
)
pause
"@
    Set-Content -Path $batPath -Value $batContent
    Write-Host "Script de instalação criado em: $batPath"

}
else {
    Write-Error "Executável não encontrado em: $exePath"
}
