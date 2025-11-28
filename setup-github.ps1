# GitHub Repository Setup Script
# Run this after creating your GitHub repository

param(
    [Parameter(Mandatory=$true)]
    [string]$RepositoryUrl
)

Write-Host "Setting up GitHub remote..." -ForegroundColor Green

# Extract repository name and owner from URL
if ($RepositoryUrl -match "github\.com[:/](.+)/(.+)\.git") {
    $owner = $matches[1]
    $repo = $matches[2]
    Write-Host "Detected repository: $owner/$repo" -ForegroundColor Cyan
} else {
    Write-Host "Invalid GitHub URL format. Expected: https://github.com/owner/repo.git" -ForegroundColor Red
    exit 1
}

# Check if remote already exists
$existingRemote = git remote get-url origin 2>$null
if ($existingRemote) {
    Write-Host "Remote 'origin' already exists: $existingRemote" -ForegroundColor Yellow
    $overwrite = Read-Host "Do you want to update it? (y/n)"
    if ($overwrite -eq 'y') {
        git remote set-url origin $RepositoryUrl
        Write-Host "Remote updated successfully!" -ForegroundColor Green
    } else {
        Write-Host "Keeping existing remote." -ForegroundColor Yellow
    }
} else {
    git remote add origin $RepositoryUrl
    Write-Host "Remote 'origin' added successfully!" -ForegroundColor Green
}

# Verify remote
Write-Host "`nVerifying remote configuration..." -ForegroundColor Cyan
git remote -v

# Push to GitHub
Write-Host "`nReady to push! Run the following command:" -ForegroundColor Green
Write-Host "git push -u origin main" -ForegroundColor Yellow

$pushNow = Read-Host "`nDo you want to push now? (y/n)"
if ($pushNow -eq 'y') {
    Write-Host "Pushing to GitHub..." -ForegroundColor Cyan
    git push -u origin main
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`nSuccessfully pushed to GitHub!" -ForegroundColor Green
        Write-Host "Repository URL: https://github.com/$owner/$repo" -ForegroundColor Cyan
    } else {
        Write-Host "`nPush failed. Please check your GitHub credentials." -ForegroundColor Red
        Write-Host "You may need to authenticate using:" -ForegroundColor Yellow
        Write-Host "  - GitHub CLI: gh auth login" -ForegroundColor Yellow
        Write-Host "  - Or use a personal access token" -ForegroundColor Yellow
    }
}

