Set-Location 'E:\projects\python-adhd dashboard'

git add -u

$staged = git diff --cached --name-only
if (-not $staged) { exit 0 }

# Build a commit message from the actual files changed
$files = $staged -split "`n" | Where-Object { $_ -ne "" }
$count = $files.Count

# Detect what kind of change it is from the file paths
$hasBackend  = $files | Where-Object { $_ -like "backend/*" }
$hasFrontend = $files | Where-Object { $_ -like "frontend/*" }
$hasCurriculum = $files | Where-Object { $_ -like "*/curriculum/*" }
$hasService  = $files | Where-Object { $_ -like "*/services/*" }
$hasRouter   = $files | Where-Object { $_ -like "*/routers/*" }
$hasComponent = $files | Where-Object { $_ -like "*/components/*" }
$hasPage     = $files | Where-Object { $_ -like "*/pages/*" }

if ($hasCurriculum)        { $scope = "curriculum" }
elseif ($hasService)       { $scope = "backend" }
elseif ($hasRouter)        { $scope = "api" }
elseif ($hasComponent)     { $scope = "components" }
elseif ($hasPage)          { $scope = "frontend" }
elseif ($hasBackend -and $hasFrontend) { $scope = "full-stack" }
elseif ($hasBackend)       { $scope = "backend" }
elseif ($hasFrontend)      { $scope = "frontend" }
else                       { $scope = "project" }

# Summarise the top changed file for context
$topFile = ($files[0] -split "/")[-1] -replace "\.(py|ts|tsx|js)$", ""
$msg = "chore($scope): update $topFile"
if ($count -gt 1) { $msg += " and $($count - 1) other file(s)" }

$env:GIT_AUTHOR_DATE    = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
$env:GIT_COMMITTER_DATE = $env:GIT_AUTHOR_DATE

git commit -m $msg

Remove-Item Env:\GIT_AUTHOR_DATE    -ErrorAction SilentlyContinue
Remove-Item Env:\GIT_COMMITTER_DATE -ErrorAction SilentlyContinue

git push origin main
