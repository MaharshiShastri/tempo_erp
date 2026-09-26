$ComposeDirectory = "D:\DATA\Downloads\tempo_erp-main\tempo_erp-main"

$StartTime = [TimeSpan]::Parse("09:35")
$StopTime  = [TimeSpan]::Parse("18:27")

Set-Location $ComposeDirectory

Write-Host ""
Write-Host "============================================================"
Write-Host "        Tempo Server Automatic Schedule Started"
Write-Host "============================================================"
Write-Host "Server subah 09:35 AM se shaam 06:27 PM tak available rahega."
Write-Host "Office hours ke bahar server automatically band ho jayega."
Write-Host "============================================================"
Write-Host ""

while ($true) {
    $Now = Get-Date
    $CurrentTime = $Now.TimeOfDay
    $Running = docker compose ps --status running -q 2>$null

    if ($CurrentTime -ge $StartTime -and $CurrentTime -lt $StopTime) {

        if (-not $Running) {
            Write-Host ""
            Write-Host "[$Now] Server abhi band hai."
            Write-Host "[$Now] Office hours chal rahe hain, isliye server start kiya ja raha hai..."
            
            docker compose up -d

            Write-Host "[$(Get-Date)] Server start ho gaya. Ab team ise use kar sakti hai."
            Write-Host ""
        }
        else {
            Write-Host "[$Now] Sab theek hai - server chal raha hai."
            Write-Host "[$Now] Office hours khatam hone par server automatically band ho jayega."
        }

        # Normal check every 2 minutes
        Start-Sleep -Seconds 120
    }
    else {

        if ($Running) {
            Write-Host ""
            Write-Host "[$Now] Office hours khatam ho gaye hain."
            Write-Host "[$Now] Server ko ab band kiya jayega."
            Write-Host "[$Now] 30 seconds ruk rahe hain, taaki agar koi last-minute change ho to check kar sakein..."

            Start-Sleep -Seconds 30

            # Time dobara check karo
            $Now = Get-Date
            $CurrentTime = $Now.TimeOfDay

            if ($CurrentTime -lt $StartTime -or $CurrentTime -ge $StopTime) {
                Write-Host ""
                Write-Host "[$Now] Office hours abhi bhi khatam hain."
                Write-Host "[$Now] Server ko band kiya ja raha hai..."
                
                docker compose down

                Write-Host "[$(Get-Date)] Server safely band ho gaya."
                Write-Host "[$(Get-Date)] Kal 09:35 AM par automatically dobara start ho jayega."
                Write-Host ""
            }
            else {
                Write-Host ""
                Write-Host "[$Now] Lagta hai office hours dobara start ho gaye hain."
                Write-Host "[$Now] Server ko band nahi kiya. Server chalu rahega."
                Write-Host ""
            }
        }
        else {
            Write-Host "[$Now] Abhi office hours nahi hain."
            Write-Host "[$Now] Server pehle se band hai, kuch karne ki zarurat nahi."
            Write-Host "[$Now] Agla check 2 minutes baad hoga."
        }

        Start-Sleep -Seconds 120
    }
}