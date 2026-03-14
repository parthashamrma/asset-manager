# 🐙 GitHub Setup Guide

## 📋 Prerequisites
- Git installed on your system
- GitHub account created
- Command Prompt/PowerShell ready

## ⚙️ Git Configuration (Run Once)
```bash
# Set your name
git config --global user.name "Your Name"

# Set your email
git config --global user.email "your.email@example.com"
```

## 🚀 Push to GitHub Steps

### Step 1: Initialize Repository
```bash
# Navigate to your project folder
cd "C:\Users\Parth\OneDrive\Desktop\Asset-Manager"

# Initialize Git repository
git init

# Add all files
git add .

# Make first commit
git commit -m "Initial commit - Asset Manager ready for deployment"
```

### Step 2: Create GitHub Repository
1. Go to [github.com](https://github.com)
2. Click "New repository"
3. Repository name: `asset-manager`
4. Description: `MCA Attendance Management System`
5. Make it Public or Private
6. Click "Create repository"
7. Copy the repository URL (HTTPS)

### Step 3: Push to GitHub
```bash
# Add remote (replace with your URL)
git remote add origin https://github.com/YOUR_USERNAME/asset-manager.git

# Push to GitHub
git push -u origin main
```

## 🎯 Alternative: GitHub Desktop (Easier)
1. Download [GitHub Desktop](https://desktop.github.com/)
2. Install and sign in
3. File → Add Local Repository
4. Select: `C:\Users\Parth\OneDrive\Desktop\Asset-Manager`
5. Commit changes: "Ready for deployment"
6. Publish repository: Create new repository on GitHub

## 📝 Files to Exclude
Create `.gitignore` file to exclude unnecessary files:
```
# Dependencies
node_modules/
npm-debug.log*

# Build outputs
dist/
build/

# Environment variables
.env
.env.local
.env.production

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db
```

## 🔐 Important Notes
- Never commit `.env` files (contains secrets)
- Don't commit `node_modules/` folder
- Make sure your database credentials are secure
- Use `.gitignore` to exclude sensitive files

## ✅ After Push
- Your code will be on GitHub
- Ready for Netlify deployment
- Can collaborate with others
- Version history maintained
