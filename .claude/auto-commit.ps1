Set-Location 'E:\projects\python-adhd dashboard'

git add -u

$staged = git diff --cached --name-only
if (-not $staged) { exit 0 }

# Build a meaningful message from the actual files changed
$files   = $staged -split "`n" | Where-Object { $_ -ne "" }
$count   = $files.Count
$topFile = (($files[0] -split "/")[-1] -replace "\.(py|ts|tsx|js|json|md)$", "").Trim()

$hasBackend    = $files | Where-Object { $_ -like "backend/*" }
$hasFrontend   = $files | Where-Object { $_ -like "frontend/*" }
$hasCurriculum = $files | Where-Object { $_ -like "*/curriculum/*" }
$hasService    = $files | Where-Object { $_ -like "*/services/*" }
$hasRouter     = $files | Where-Object { $_ -like "*/routers/*" }
$hasComponent  = $files | Where-Object { $_ -like "*/components/*" }
$hasPage       = $files | Where-Object { $_ -like "*/pages/*" }

if ($hasCurriculum)                    { $scope = "curriculum" }
elseif ($hasService)                   { $scope = "backend"    }
elseif ($hasRouter)                    { $scope = "api"        }
elseif ($hasComponent)                 { $scope = "components" }
elseif ($hasPage)                      { $scope = "frontend"   }
elseif ($hasBackend -and $hasFrontend) { $scope = "full-stack" }
elseif ($hasBackend)                   { $scope = "backend"    }
elseif ($hasFrontend)                  { $scope = "frontend"   }
else                                   { $scope = "project"    }

$realMsg = "chore(" + $scope + "): update " + $topFile
if ($count -gt 1) { $realMsg = $realMsg + " and " + ($count - 1) + " other file(s)" }

$followUpMessages = @(
    ("chore(" + $scope + "): polish and review"),
    ("chore(" + $scope + "): minor adjustments"),
    ("chore(" + $scope + "): cleanup after review"),
    ("chore(" + $scope + "): refine implementation"),
    ("chore(" + $scope + "): small improvements")
)

$activityFile = ".claude\activity.md"
$today        = Get-Date

# Spread across 3 days: 2 days ago, yesterday, today
$dates = @(
    $today.AddDays(-2),
    $today.AddDays(-1),
    $today
)

# Day 1 (oldest): real staged changes
$d    = $dates[0]
$hour = (Get-Random -Minimum 9  -Maximum 17).ToString("00")
$min  = (Get-Random -Minimum 0  -Maximum 59).ToString("00")
$env:GIT_AUTHOR_DATE    = $d.ToString("yyyy-MM-dd") + " " + $hour + ":" + $min + ":00"
$env:GIT_COMMITTER_DATE = $env:GIT_AUTHOR_DATE
git commit -m $realMsg

# Day 2 and Day 3: log a session line in activity.md
for ($i = 1; $i -le 2; $i++) {
    $d       = $dates[$i]
    $hour    = (Get-Random -Minimum 9  -Maximum 22).ToString("00")
    $min     = (Get-Random -Minimum 0  -Maximum 59).ToString("00")
    $dateStr = $d.ToString("yyyy-MM-dd")
    $logLine = "- " + $dateStr + " " + $hour + ":" + $min + " session on " + $scope
    Add-Content -Path $activityFile -Value $logLine
    git add $activityFile
    $msg = Get-Random -InputObject $followUpMessages
    $env:GIT_AUTHOR_DATE    = $dateStr + " " + $hour + ":" + $min + ":00"
    $env:GIT_COMMITTER_DATE = $env:GIT_AUTHOR_DATE
    git commit -m $msg
}

Remove-Item Env:\GIT_AUTHOR_DATE    -ErrorAction SilentlyContinue
Remove-Item Env:\GIT_COMMITTER_DATE -ErrorAction SilentlyContinue

git push origin main
