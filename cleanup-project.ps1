# Script to move unwanted files to a backup directory

# Get current date for backup folder name
$date = Get-Date -Format "yyyy-MM-dd_HH-mm"
$backupDir = "e:\waste dashboard\backup_$date"

# Create backup directory
Write-Host "Creating backup directory: $backupDir" -ForegroundColor Cyan
New-Item -Path $backupDir -ItemType Directory -Force | Out-Null
New-Item -Path "$backupDir\frontend" -ItemType Directory -Force | Out-Null
New-Item -Path "$backupDir\backend" -ItemType Directory -Force | Out-Null

# Frontend files to move
$frontendFiles = @(
    "test-paths.js",
    "config.sample.js"
)

# Backend files to move
$backendFiles = @(
    "check-actual-schema.js",
    "check-and-fix-users.js",
    "check-waste-type.js",
    "test-db-connection.js",
    "test-db.js",
    "seed-data.js",
    "seed-full-data.js",
    "seed-user-data.js",
    "create-test-users.js",
    "init-db.js"
)

# Backend directories with paths to move
$backendPaths = @(
    "utils\author",
    "scripts\reset-passwords.js"
)

# Move frontend files
Write-Host "`nMoving frontend files:" -ForegroundColor Yellow
foreach ($file in $frontendFiles) {
    $source = "e:\waste dashboard\frontend\$file"
    $dest = "$backupDir\frontend\$file"
    
    if (Test-Path $source) {
        Write-Host "Moving $file" -ForegroundColor Green
        Move-Item -Path $source -Destination $dest -Force
    } else {
        Write-Host "$file not found, skipping" -ForegroundColor Gray
    }
}

# Move backend files
Write-Host "`nMoving backend files:" -ForegroundColor Yellow
foreach ($file in $backendFiles) {
    $source = "e:\waste dashboard\backend\$file"
    $dest = "$backupDir\backend\$file"
    
    if (Test-Path $source) {
        Write-Host "Moving $file" -ForegroundColor Green
        Move-Item -Path $source -Destination $dest -Force
    } else {
        Write-Host "$file not found, skipping" -ForegroundColor Gray
    }
}

# Move backend paths (files in subdirectories)
Write-Host "`nMoving backend paths:" -ForegroundColor Yellow
foreach ($path in $backendPaths) {
    $source = "e:\waste dashboard\backend\$path"
    
    # Create the directory structure in the backup
    $parentDir = Split-Path -Path "$backupDir\backend\$path" -Parent
    if (!(Test-Path $parentDir)) {
        New-Item -Path $parentDir -ItemType Directory -Force | Out-Null
    }
    
    $dest = "$backupDir\backend\$path"
    
    if (Test-Path $source) {
        Write-Host "Moving $path" -ForegroundColor Green
        Move-Item -Path $source -Destination $dest -Force
    } else {
        Write-Host "$path not found, skipping" -ForegroundColor Gray
    }
}

Write-Host "`nCleanup complete!" -ForegroundColor Cyan
Write-Host "All unnecessary files have been moved to $backupDir" -ForegroundColor Cyan
Write-Host "You can delete this backup directory once you're sure everything works correctly."