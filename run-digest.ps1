# EdgeProp Daily Digest - one run per day, max once
# Two Task Scheduler entries call this script:
#   1. "EdgeProp Daily Digest" - daily at 10:00
#   2. "EdgeProp Digest Catch-up" - at logon with -CatchUp: covers days
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

# Claim the day's run slot immediately — a second simultaneous instance will
# hit the flag check at the top and exit before doing any work.
Set-Content $flagFile $today

Set-Location $dir

# Load env vars from .env.local
Get-Content .env.local | Where-Object { $_ -match "^[A-Z_]+=.+" } | ForEach-Object {
    $parts = $_ -split "=", 2
    [Environment]::SetEnvironmentVariable($parts[0].Trim(), $parts[1].Trim(), "Process")
}

Add-Content $log "`n=== $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') ==="

try {
    npx tsx scripts/daily-digest.ts --max-pages 5 2>&1 | Tee-Object -Append $log

    # Enrich contact details for up to 30 new companies per day
    Add-Content $log "--- Contact enrichment ---"
    npx tsx scripts/enrich-contacts.ts --limit 30 2>&1 | Tee-Object -Append $log

    # Commit and push new leads + enriched contacts to GitHub -> Vercel auto-deploys
    git config user.name "EdgeProp Bot"
    git config user.email "bot@edgeprop-crm"
    $pullOut = git pull --ff-only 2>&1
    Add-Content $log "git pull: $pullOut"
    if ($LASTEXITCODE -ne 0) {
        Add-Content $log "WARNING: git pull failed (exit $LASTEXITCODE) - skipping push this run"
    } else {
        git add data/leads.json data/leads.ts data/checkpoint.json data/contact-cache.json
        git diff --staged --quiet
        if ($LASTEXITCODE -ne 0) {
            git commit -m "Daily digest $today`: auto-update leads" 2>&1 | Add-Content $log
            $pushOut = git push 2>&1
            Add-Content $log "git push: $pushOut (exit $LASTEXITCODE)"
            if ($LASTEXITCODE -ne 0) {
                Add-Content $log "ERROR: git push failed - CRM will not update until push succeeds"
            }
        } else {
            Add-Content $log "No new leads staged - skipping commit"
        }
    }

} catch {
    Add-Content $log "ERROR: $_"
}
