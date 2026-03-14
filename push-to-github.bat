@echo off
echo 🚀 Pushing Asset Manager to GitHub...
echo.
echo 1. Make sure you have created a GitHub repository
echo 2. Replace YOUR_USERNAME in the commands below
echo.
echo Creating GitHub repository...
echo.
echo Go to https://github.com/new
echo Repository name: asset-manager
echo Description: MCA Attendance Management System
echo Make it Public or Private
echo Click "Create repository"
echo.
echo Copy the repository URL (HTTPS)
echo.
pause
echo.
echo Adding remote origin...
git remote add origin https://github.com/parthashamrma/asset-manager.git
echo Pushing to GitHub...
git push -u origin main
echo.
echo ✅ Successfully pushed to GitHub!
echo Your Asset Manager is now live on GitHub!
echo.
pause
