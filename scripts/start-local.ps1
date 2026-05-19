# Start Broadway PM locally (API :3000 + web :3001)
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

function Stop-Port($port) {
  $line = netstat -ano | Select-String ":$port\s+.*LISTENING" | Select-Object -First 1
  if ($line) {
    $pid = ($line -split '\s+')[-1]
    if ($pid -match '^\d+$') {
      Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
      Write-Host "Freed port $port (PID $pid)"
      Start-Sleep -Seconds 1
    }
  }
}

Write-Host "Starting Broadway Property Management..."
Stop-Port 3001
Stop-Port 3000

$backend = Start-Process powershell -ArgumentList @(
  '-NoExit', '-Command',
  "cd '$root\backend'; Write-Host 'Backend http://localhost:3000' -ForegroundColor Green; npm run start:dev"
) -PassThru

Start-Sleep -Seconds 3

$frontend = Start-Process powershell -ArgumentList @(
  '-NoExit', '-Command',
  "cd '$root\frontend'; Write-Host 'Frontend http://localhost:3001' -ForegroundColor Green; npm run dev"
) -PassThru

Write-Host ""
Write-Host "Opened two terminals:" -ForegroundColor Cyan
Write-Host "  Backend  -> http://localhost:3000"
Write-Host "  Frontend -> http://localhost:3001/login"
Write-Host ""
Write-Host "Wait ~15 seconds, then open: http://localhost:3001/login"
Write-Host "Demo sign-in: owner@demo-landlord.rw / Demo2026!"
Write-Host "(Run 'node scripts/seed-demo-staging.js' in backend folder if login fails)"
