# EdgeProp Daily Digest — one run per day, max once
# Two Task Scheduler entries call this script:
#   1. "EdgeProp Daily Digest" — daily at 10:00
#   2. "EdgeProp Digest Catch-up" — at logon with -CatchUp: covers days
#      (weekends) when the machine was off at 10:00. Before 10am it exits
#      so weekday logins don't send early; after 10am it catches up.
param([switch]$CatchUp)

$dir = "C:\Users\czp82\Downloads\vin-obsidian-workflows\edgeprop-crm"
$log = "$dir\scripts\scrape.log"
$flagFile = "$dir\scripts\.last-run-date"
$today = (Get-Date).ToString("yyyy-MM-dd")

# Skip if already ran today
if ((Test-Path $flagFile) -and (Get-Content $flagFile) -eq $today) {
    exit 0
}

# Catch-up runs only fire after the 10:00 slot has been missed
if ($CatchUp -and (Get-Date).Hour -lt 10) {
    exit 0
}

Set-Location $dir

# Load env vars from .env.local
Get-Content .env.local | Where-Object { $_ -match "^[A-Z_]+=.+" } | ForEach-Object {
    $parts = $_ -split "=", 2
    [Environment]::SetEnvironmentVariable($parts[0].Trim(), $parts[1].Trim(), "Process")
}

Add-Content $log "`n=== $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') ==="

try {
    npx tsx scripts/daily-digest.ts --max-pages 5 2>&1 | Tee-Object -Append $log

    # Commit and push new leads to GitHub → Vercel auto-deploys
    git config user.name "EdgeProp Bot"
    git config user.email "bot@edgeprop-crm"
    git pull --rebase 2>&1 | Out-Null
    git add data/leads.json data/leads.ts data/checkpoint.json
    $diff = git diff --staged --quiet; if (-not $?) {
        git commit -m "Daily digest $today`: auto-update leads" 2>&1 | Out-Null
        git push 2>&1 | Out-Null
        Add-Content $log "Pushed to GitHub"
    }

    # Mark today as done
    Set-Content $flagFile $today

} catch {
    Add-Content $log "ERROR: $_"
}
