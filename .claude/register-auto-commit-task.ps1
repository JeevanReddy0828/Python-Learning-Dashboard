# Run this once as Administrator to register the daily auto-commit task
$script = "E:\projects\python-adhd dashboard\.claude\auto-commit.ps1"
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -NonInteractive -ExecutionPolicy Bypass -File `"$script`""
$t1 = New-ScheduledTaskTrigger -Daily -At "10:00AM"
$t2 = New-ScheduledTaskTrigger -Daily -At "1:00PM"
$t3 = New-ScheduledTaskTrigger -Daily -At "5:00PM"
$t4 = New-ScheduledTaskTrigger -Daily -At "9:00PM"
$settings = New-ScheduledTaskSettingsSet -ExecutionTimeLimit (New-TimeSpan -Minutes 2) -StartWhenAvailable
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Highest
Register-ScheduledTask -TaskName "PyLearn-AutoCommit" -Action $action -Trigger @($t1,$t2,$t3,$t4) -Settings $settings -Principal $principal -Force
Write-Host "Done. PyLearn-AutoCommit task registered for 10am, 1pm, 5pm, 9pm daily."
