# Configurações para Deploy na Azure
# Configurar variáveis de ambiente específicas para produção

# Informações do App Service
$RESOURCE_GROUP = "AutolivTouchScreen-RG"
$APP_NAME = "autoliv-touchscreen-api"
$LOCATION = "Brazil South"

# Variáveis de Ambiente para Configurar no App Service
$env_vars = @{
    "NODE_ENV"                  = "production"
    "PORT"                      = "8080"
    "DB_SERVER"                 = "digitals-documents-sql.database.windows.net"
    "DB_DATABASE"               = "digitals-documents-db"
    "DB_USER"                   = "" # PREENCHER
    "DB_PASSWORD"               = "" # PREENCHER  
    "API_LEADING2LEAN_KEY"      = "" # PREENCHER
    "API_LEADING2LEAN_BASE_URL" = "https://autoliv-mx.leading2lean.com"
    "JWT_SECRET"                = "" # PREENCHER (gerar aleatório)
    "CORS_ORIGIN"               = "https://brave-water-0e3f7b110.azurestaticapps.net"
}

Write-Host "📋 Configurações para o App Service: $APP_NAME" -ForegroundColor Cyan
Write-Host "Resource Group: $RESOURCE_GROUP" -ForegroundColor Yellow
Write-Host "Location: $LOCATION" -ForegroundColor Yellow
Write-Host ""
Write-Host "⚠️  ATENÇÃO: Configure as variáveis de ambiente no Azure Portal:" -ForegroundColor Red
Write-Host "   App Service → Configuration → Application settings" -ForegroundColor White
Write-Host ""

foreach ($key in $env_vars.Keys) {
    $value = $env_vars[$key]
    if ($value -eq "") {
        Write-Host "   $key = [PREENCHER]" -ForegroundColor Red
    }
    else {
        Write-Host "   $key = $value" -ForegroundColor Green
    }
}
