try {
  $response = Invoke-RestMethod -Uri "http://127.0.0.1:8080/v1/models" -ErrorAction Stop
  Write-Host "Model server reachable" -ForegroundColor Green
} catch {
  Write-Host "Model server unreachable" -ForegroundColor Red
}
