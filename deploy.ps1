# Script de Deploy Rápido para Azure
# Execute: .\deploy.ps1 [frontend|backend|all]

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("frontend", "backend", "all")]
    [string]$Target = "all"
)

Write-Host "🚀 Iniciando deploy na Azure..." -ForegroundColor Cyan
Write-Host "Alvo: $Target" -ForegroundColor Yellow
Write-Host ""

function Deploy-Frontend {
    Write-Host "📦 Fazendo build do Frontend..." -ForegroundColor Green
    npm run build
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erro no build do frontend" -ForegroundColor Red
        return $false
    }
    
    Write-Host "✅ Build concluído!" -ForegroundColor Green
    Write-Host ""
    Write-Host "ℹ️  Para deploy do frontend:" -ForegroundColor Cyan
    Write-Host "   1. Faça commit e push das mudanças para 'main'" -ForegroundColor White
    Write-Host "   2. GitHub Actions fará o deploy automaticamente" -ForegroundColor White
    Write-Host "   3. Ou use: az staticwebapp deploy --name autoliv-touchscreen-frontend --source ./dist" -ForegroundColor White
    return $true
}

function Deploy-Backend {
    Write-Host "📦 Preparando Backend para deploy..." -ForegroundColor Green
    
    Push-Location backend
    
    # Verificar se package-lock.json existe
    if (!(Test-Path "package-lock.json")) {
        Write-Host "⚠️  Gerando package-lock.json..." -ForegroundColor Yellow
        npm install
    }
    
    Pop-Location
    
    Write-Host "✅ Backend preparado!" -ForegroundColor Green
    Write-Host ""
    Write-Host "ℹ️  Para deploy do backend:" -ForegroundColor Cyan
    Write-Host "   1. Faça commit e push de mudanças em 'backend/' para 'main'" -ForegroundColor White
    Write-Host "   2. GitHub Actions fará o deploy automaticamente" -ForegroundColor White
    Write-Host "   3. Ou use: cd backend && az webapp deploy --resource-group AutolivTouchScreen-RG --name autoliv-touchscreen-backend --src-path ." -ForegroundColor White
    return $true
}

function Check-AzureCLI {
    try {
        az --version | Out-Null
        return $true
    } catch {
        Write-Host "❌ Azure CLI não encontrado!" -ForegroundColor Red
        Write-Host "   Instale em: https://aka.ms/installazurecliwindows" -ForegroundColor Yellow
        return $false
    }
}

function Show-DeployInfo {
    Write-Host ""
    Write-Host "📋 Informações de Deploy:" -ForegroundColor Cyan
    Write-Host "─────────────────────────────────────────" -ForegroundColor Gray
    Write-Host "Frontend:" -ForegroundColor Green
    Write-Host "  • Tipo: Azure Static Web Apps" -ForegroundColor White
    Write-Host "  • Workflow: .github/workflows/azure-static-web-apps-brave-water-0e3f7b110.yml" -ForegroundColor White
    Write-Host "  • Build cmd: npm run build" -ForegroundColor White
    Write-Host "  • Output: dist/" -ForegroundColor White
    Write-Host ""
    Write-Host "Backend:" -ForegroundColor Green
    Write-Host "  • Tipo: Azure App Service (Node.js)" -ForegroundColor White
    Write-Host "  • Workflow: .github/workflows/azure-backend-deploy.yml" -ForegroundColor White
    Write-Host "  • Runtime: Node.js 20.x" -ForegroundColor White
    Write-Host ""
    Write-Host "📝 Secrets necessários no GitHub:" -ForegroundColor Cyan
    Write-Host "  Frontend:" -ForegroundColor Yellow
    Write-Host "    - AZURE_STATIC_WEB_APPS_API_TOKEN_BRAVE_WATER_0E3F7B110" -ForegroundColor White
    Write-Host "    - VITE_BACKEND_URL" -ForegroundColor White
    Write-Host "    - VITE_MSAL_CLIENT_ID" -ForegroundColor White
    Write-Host "    - VITE_MSAL_AUTHORITY" -ForegroundColor White
    Write-Host ""
    Write-Host "  Backend:" -ForegroundColor Yellow
    Write-Host "    - AZURE_WEBAPP_PUBLISH_PROFILE" -ForegroundColor White
    Write-Host ""
    Write-Host "📚 Ver guia completo: DEPLOY_AZURE.md" -ForegroundColor Cyan
}

# Main
$success = $true

if ($Target -eq "frontend" -or $Target -eq "all") {
    if (!(Deploy-Frontend)) {
        $success = $false
    }
}

if ($Target -eq "backend" -or $Target -eq "all") {
    if (!(Deploy-Backend)) {
        $success = $false
    }
}

Show-DeployInfo

if ($success) {
    Write-Host ""
    Write-Host "✅ Preparação concluída!" -ForegroundColor Green
    Write-Host "   Próximo passo: git add . && git commit -m 'Deploy' && git push" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "❌ Houve erros durante a preparação" -ForegroundColor Red
    exit 1
}
