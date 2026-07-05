# EdgeProp Daily Digest — Windows Task Scheduler entry point
# This runs on your PC (residential IP), bypassing EdgeProp's cloud IP block.
# Task Scheduler runs this at 8am daily with no apps open.

$ErrorActionPreference = "Stop"
$dir = "C:\Users\czp82\Downloads\vin-obsidian-workflows\edgeprop-crm"
$log = "$dir\scripts\scrape.log"

try {
    Set-Location $dir

    # Load env vars from .env.local
    Get-Content .env.local | Where-Object { $_ -match "^[A-Z_]+=.+" } | ForEach-Object {
        $k, $v = $_ -split "=", 2
        [Environment]::SetEnvironmentVariable($k, $v.Trim(), "Process")
    }

    # Run the digest (scrape last 5 pages + email + WhatsApp)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Add-Content $log "`n=== $timestamp ==="
    npx tsx scripts/daily-digest.ts --max-pages 5 2>&1 | Tee-Object -Append $log

    # Commit and push updated leads to GitHub (triggers Vercel deploy)
    git config user.name "EdgeProp Bot"
    git config user.email "bot@edgeprop-crm"
    git add data/leads.json data/leads.ts data/checkpoint.json
    $status = git diff --staged --quiet; if (-not $?) {
        $date = Get-Date -Format "yyyy-MM-dd"
        git commit -m "Daily digest $date`: auto-update leads"
        git push
        Add-Content $log "Pushed to GitHub"
    } else {
        Add-Content $log "No changes to push"
    }

} catch {
    $msg = "ERROR: $_"
    Write-Error $msg
    Add-Content $log $msg
    exit 1
}
