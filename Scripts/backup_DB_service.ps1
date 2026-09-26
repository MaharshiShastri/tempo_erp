$ErrorActionPreference = "Stop"

# ============================================================
# PostgreSQL Tools
# ============================================================

$PgBin = "C:\Program Files\PostgreSQL\18\bin"
$PgDump = Join-Path $PgBin "pg_dump.exe"
$PgRestore = Join-Path $PgBin "pg_restore.exe"


# ============================================================
# Source Database
# ============================================================

$SourceHost = "192.168.0.148"
$SourcePort = "5432"
$SourceDb = "tempo_erp"
$SourceUser = "postgres"
$SourcePassword = "TempoInstruments"


# ============================================================
# Target Database
# ============================================================

$TargetHost = "localhost"
$TargetPort = "5433"
$TargetDb = "tempo_erp_backup"
$TargetUser = "postgres"
$TargetPassword = "TempoInstruments"


# ============================================================
# Backup Directories
# ============================================================

$BackupRoot = "C:\TempoBackup"
$DumpDir = Join-Path $BackupRoot "tmp"
$LogDir = Join-Path $BackupRoot "logs"


# ============================================================
# Prepare Directories
# ============================================================

New-Item -ItemType Directory -Force -Path $BackupRoot | Out-Null
New-Item -ItemType Directory -Force -Path $DumpDir | Out-Null
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null


# ============================================================
# File Names
# ============================================================

$TimeStamp = Get-Date -Format "yyyyMMdd_HHmmss"

$DumpFile = Join-Path `
    $DumpDir `
    "tempo_erp_$TimeStamp.dump"

$LogFile = Join-Path `
    $LogDir `
    "tempo_erp_$TimeStamp.log"


# ============================================================
# Logging
# ============================================================

function Write-Log {
    param(
        [string]$Message
    )

    $Time = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $Line = "[$Time] $Message"

    Write-Host $Line

    Add-Content `
        -Path $LogFile `
        -Value $Line
}


# ============================================================
# 30 Second Countdown
# ============================================================

function Show-Countdown {
    param(
        [int]$Seconds = 30
    )

    Write-Host ""
    Write-Host "============================================================"
    Write-Host "This window will close automatically."
    Write-Host "You have $Seconds seconds to review the output."
    Write-Host "============================================================"
    Write-Host ""

    for ($i = $Seconds; $i -gt 0; $i--) {

        Write-Host "`rClosing in $i seconds...   " -NoNewline

        Start-Sleep -Seconds 1
    }

    Write-Host ""
    Write-Host "Closing..."
}


# ============================================================
# Failure Handling
# ============================================================

function Fail-Backup {
    param(
        [string]$Message
    )

    Write-Log ""
    Write-Log "============================================================"
    Write-Log "BACKUP FAILED"
    Write-Log "============================================================"
    Write-Log $Message
    Write-Log "============================================================"

    # Clear password before waiting
    $env:PGPASSWORD = $null

    # Keep terminal visible for 30 seconds
    Show-Countdown 30

    exit 1
}


# ============================================================
# Start
# ============================================================

Write-Log "============================================================"
Write-Log "Tempo ERP Daily Database Backup"
Write-Log "============================================================"

Write-Log "Started: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Log "Source: $SourceHost`:$SourcePort / $SourceDb"
Write-Log "Target: $TargetHost`:$TargetPort / $TargetDb"
Write-Log "Dump: $DumpFile"
Write-Log ""


# ============================================================
# Check PostgreSQL Tools
# ============================================================

if (-not (Test-Path $PgDump)) {
    Fail-Backup "pg_dump.exe was not found at: $PgDump"
}

if (-not (Test-Path $PgRestore)) {
    Fail-Backup "pg_restore.exe was not found at: $PgRestore"
}

Write-Log "PostgreSQL client tools found."


# ============================================================
# Create Dump
# ============================================================

Write-Log ""
Write-Log "Starting pg_dump..."
Write-Log "Creating temporary dump file..."

try {

    $env:PGPASSWORD = $SourcePassword

    & $PgDump `
        --host=$SourceHost `
        --port=$SourcePort `
        --username=$SourceUser `
        --dbname=$SourceDb `
        --format=custom `
        --blobs `
        --no-owner `
        --no-privileges `
        --file="$DumpFile"

    if ($LASTEXITCODE -ne 0) {
        Fail-Backup "pg_dump failed."
    }

}
catch {

    Fail-Backup "pg_dump execution failed: $($_.Exception.Message)"

}


# ============================================================
# Verify Dump
# ============================================================

if (-not (Test-Path $DumpFile)) {

    Fail-Backup `
        "pg_dump reported success but dump file was not generated."

}

$DumpSize = (Get-Item $DumpFile).Length

if ($DumpSize -le 0) {

    Remove-Item $DumpFile -Force

    Fail-Backup `
        "Dump file was created but is empty."

}

$DumpSizeMB = [math]::Round($DumpSize / 1MB, 2)

Write-Log "pg_dump completed successfully."
Write-Log "Dump size: $DumpSizeMB MB"


# ============================================================
# Restore to Target
# ============================================================

Write-Log ""
Write-Log "Starting restore..."
Write-Log "Target Database: $TargetDb"

try {

    $env:PGPASSWORD = $TargetPassword

    & $PgRestore `
        --host=$TargetHost `
        --port=$TargetPort `
        --username=$TargetUser `
        --dbname=$TargetDb `
        --clean `
        --if-exists `
        --no-owner `
        --no-privileges `
        --exit-on-error `
        "$DumpFile"

    if ($LASTEXITCODE -ne 0) {

        Fail-Backup @"
pg_restore failed.

The temporary dump has been preserved for troubleshooting:

$DumpFile
"@

    }

}
catch {

    Fail-Backup @"
pg_restore execution failed:

$($_.Exception.Message)

The temporary dump has been preserved:

$DumpFile
"@

}


# ============================================================
# Restore Successful
# ============================================================

Write-Log ""
Write-Log "Restore completed successfully."


# ============================================================
# Delete Temporary Dump
# ============================================================

try {

    Remove-Item $DumpFile -Force

    Write-Log "Temporary dump deleted."

}
catch {

    Write-Log "WARNING: Could not delete temporary dump."
    Write-Log "Dump remains at: $DumpFile"

}


# ============================================================
# SUCCESS
# ============================================================

Write-Log ""
Write-Log "============================================================"
Write-Log "BACKUP SUCCESSFUL"
Write-Log "============================================================"

Write-Log "Source  : $SourceHost`:$SourcePort/$SourceDb"
Write-Log "Target  : $TargetHost`:$TargetPort/$TargetDb"
Write-Log "Finished: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"

Write-Log "============================================================"


# ============================================================
# Clear Password
# ============================================================

$env:PGPASSWORD = $null


# ============================================================
# Keep Terminal Open for 30 Seconds
# ============================================================

Show-Countdown 30

exit 0