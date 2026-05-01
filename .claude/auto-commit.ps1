# Spread today's work across 2-4 backdated commits so GitHub graph stays green
Set-Location 'E:\projects\python-adhd dashboard'

git add -u

$staged = git diff --cached --name-only
if (-not $staged) { exit 0 }

# Pick a random spread: 2, 3, or 4 days
$spread = Get-Random -Minimum 2 -Maximum 5
$today = Get-Date

$messages = @(
    "refactor: clean up component logic",
    "fix: minor bug fixes and improvements",
    "chore: update dependencies and configs",
    "feat: improve UI responsiveness",
    "fix: resolve edge case in data handling",
    "refactor: simplify service layer",
    "chore: code cleanup and formatting",
    "feat: enhance user experience",
    "fix: address feedback from review",
    "chore: update project configuration"
)

$activityFile = ".claude\activity.md"

# First commit (oldest day) gets the real staged changes
$daysBack = $spread - 1
$hour = (Get-Random -Minimum 9 -Maximum 18).ToString("00")
$min  = (Get-Random -Minimum 0  -Maximum 59).ToString("00")
$commitDate = $today.AddDays(-$daysBack).ToString("yyyy-MM-dd") + " ${hour}:${min}:00"
$msg = $messages | Get-Random
$env:GIT_AUTHOR_DATE = $commitDate
$env:GIT_COMMITTER_DATE = $commitDate
git commit -m $msg

# Subsequent commits: append a line to activity.md to have something to commit
for ($i = $daysBack - 1; $i -ge 0; $i--) {
    $hour = (Get-Random -Minimum 9 -Maximum 22).ToString("00")
    $min  = (Get-Random -Minimum 0 -Maximum 59).ToString("00")
    $commitDate = $today.AddDays(-$i).ToString("yyyy-MM-dd") + " ${hour}:${min}:00"
    $displayDate = $today.AddDays(-$i).ToString("yyyy-MM-dd")
    Add-Content -Path $activityFile -Value "- $displayDate ${hour}:${min} session"
    git add $activityFile
    $msg = $messages | Get-Random
    $env:GIT_AUTHOR_DATE = $commitDate
    $env:GIT_COMMITTER_DATE = $commitDate
    git commit -m $msg
}

Remove-Item Env:\GIT_AUTHOR_DATE    -ErrorAction SilentlyContinue
Remove-Item Env:\GIT_COMMITTER_DATE -ErrorAction SilentlyContinue

git push origin main
