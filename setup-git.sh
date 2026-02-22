#!/bin/bash

# ComicHero - Git Setup Script
# Run this after extracting the project files

echo "🎮 ComicHero - Git Repository Setup"
echo "======================================"
echo ""

# Initialize git repo
echo "📦 Initializing git repository..."
git init

# Add all files
echo "📝 Adding files..."
git add .

# Initial commit
echo "💾 Creating initial commit..."
git commit -m "Initial commit - ComicHero project takeover

- Next.js 16 app with TypeScript
- Comic Vine API integration
- eBay marketplace integration
- PostgreSQL + Prisma ORM
- Collection and want-list management
- Deal scoring algorithm"

echo ""
echo "✅ Git repository initialized!"
echo ""
echo "🚀 Next steps:"
echo "1. Create a new repo on GitHub: https://github.com/new"
echo "   Repository name: ComicHero"
echo "   Description: Comic book collection and deal finder"
echo ""
echo "2. Then run these commands:"
echo "   git remote add origin https://github.com/contentjester-bit/ComicHero.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "3. Read SETUP_GUIDE.md for full setup instructions"
echo ""
