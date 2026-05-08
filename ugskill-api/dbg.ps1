$ErrorActionPreference = 'Stop'
try {
  $login = Invoke-RestMethod -Method POST -Uri 'http://localhost:4000/api/v1/auth/login' -ContentType 'application/json' -Body '{"email":"admin@ugskill.com","password":"Admin@123"}'
  $token = $login.data.accessToken
  Write-Host "Token OK"
} catch {
  Write-Host "Login failed:" $_.Exception.Message
  exit
}

$body = '{"title":"Debug Test","durationMinutes":60}'
Write-Host "Sending POST /exams with body: $body"
try {
  $r = Invoke-WebRequest -Method POST -Uri 'http://localhost:4000/api/v1/exams' -ContentType 'application/json' -Headers @{Authorization="Bearer $token"} -Body $body
  Write-Host "SUCCESS ($($r.StatusCode)):"
  $r.Content
} catch {
  $code = $_.Exception.Response.StatusCode.Value__
  $detail = $_.ErrorDetails.Message
  Write-Host "FAILED ($code):"
  Write-Host $detail
}
