param(
    [string]$Branch = "",
    [string]$Remote = "",
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

# When invoked via a git alias, these env vars can point nested git calls
# at an invalid repository path. Clear them for this script process.
Remove-Item Env:GIT_DIR -ErrorAction SilentlyContinue
Remove-Item Env:GIT_WORK_TREE -ErrorAction SilentlyContinue
Remove-Item Env:GIT_PREFIX -ErrorAction SilentlyContinue

$repoRoot = ""
try {
    $repoRoot = (& git rev-parse --show-toplevel 2>$null).Trim()
}
catch {
    $repoRoot = ""
}

if (-not $repoRoot) {
    # Fallback to script parent so alias works even if invoked outside repo cwd.
    $repoRoot = Split-Path -Parent $PSScriptRoot
}

if (-not (Test-Path (Join-Path $repoRoot ".git"))) {
    Write-Error "Unable to locate a git repository root."
    exit 1
}

if (-not $Branch) {
    $Branch = (& git -C $repoRoot rev-parse --abbrev-ref HEAD).Trim()
}

if (-not $Branch -or $Branch -eq "HEAD") {
    Write-Error "Unable to detect a valid branch. Pass -Branch explicitly."
    exit 1
}

$remotes = @()
$originUrl = (& git -C $repoRoot remote get-url origin 2>$null)
if ($LASTEXITCODE -eq 0 -and $originUrl) {
    $remotes += [pscustomobject]@{ Name = "origin"; Url = $originUrl.Trim() }
}

$personalUrl = (& git -C $repoRoot remote get-url personal 2>$null)
if ($LASTEXITCODE -eq 0 -and $personalUrl) {
    $remotes += [pscustomobject]@{ Name = "personal"; Url = $personalUrl.Trim() }
}

if ($remotes.Count -eq 0) {
    Write-Error "No configured remotes found. Expected at least origin or personal."
    exit 1
}

$selectedRemote = $Remote

if (-not $selectedRemote) {
    Write-Host "Select target repository to push branch '$Branch':"
    for ($i = 0; $i -lt $remotes.Count; $i++) {
        $idx = $i + 1
        Write-Host "[$idx] $($remotes[$i].Name) -> $($remotes[$i].Url)"
    }

    $choice = Read-Host "Enter number or remote name (q to cancel)"
    if ($choice -match '^(q|quit|exit)$') {
        Write-Host "Push cancelled."
        exit 0
    }

    if ($choice -match '^\d+$') {
        $index = [int]$choice - 1
        if ($index -lt 0 -or $index -ge $remotes.Count) {
            Write-Error "Invalid selection index: $choice"
            exit 1
        }
        $selectedRemote = $remotes[$index].Name
    }
    else {
        $selectedRemote = $choice.Trim()
    }
}

$selected = $remotes | Where-Object { $_.Name -eq $selectedRemote } | Select-Object -First 1
if (-not $selected) {
    Write-Error "Remote '$selectedRemote' is not configured in this repository."
    exit 1
}

$pushArgs = @("push", $selected.Name, $Branch)
if ($DryRun) {
    $pushArgs += "--dry-run"
}

Write-Host "Pushing branch '$Branch' to '$($selected.Name)'..."
& git -C $repoRoot @pushArgs
exit $LASTEXITCODE
