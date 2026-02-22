# ComicHero - Setup Guide for New Maintainer

Welcome! You're now taking over as the main developer for ComicHero. Here's everything you need to get started.

## 🎯 What is ComicHero?

ComicHero is a web app that helps comic collectors:
- Search for comics via Comic Vine API
- Track their collection
- Create want lists
- Find deals on eBay
- Score listings to identify the best prices

**Tech Stack:**
- Next.js 16 (App Router)
- React 19
- TypeScript
- PostgreSQL + Prisma ORM
- Tailwind CSS 4
- Recharts for data visualization

---

## 🚀 Quick Start

### 1. Push to Your GitHub Account

```bash
# Navigate to the project
cd ComicHero

# Initialize git
git init
git add .
git commit -m "Initial commit - taking over ComicHero project"

# Create a new repo on GitHub (github.com/new)
# Name it: ComicHero
# Then push:
git remote add origin https://github.com/contentjester-bit/ComicHero.git
git branch -M main
git push -u origin main
```

### 2. Set Up Environment Variables

Create a `.env` file in the root:

```env
# Required
DATABASE_URL=postgresql://user:password@localhost:5432/comichero

# Comic Vine API (get free key at comicvine.gamespot.com/api)
COMIC_VINE_API_KEY=your_api_key_here

# Optional - eBay API (for price checking)
EBAY_CLIENT_ID=your_ebay_client_id
EBAY_CLIENT_SECRET=your_ebay_client_secret
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Set Up Database

```bash
# Run Prisma migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate
```

### 5. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
ComicHero/
├── src/
│   ├── app/                    # Next.js pages & API routes
│   │   ├── (search)/          # Search pages (character, issue, key-issues)
│   │   ├── api/               # Backend API endpoints
│   │   ├── collection/        # User's comic collection
│   │   ├── want-list/         # Comics user wants to buy
│   │   └── settings/          # App settings
│   ├── components/            # React components
│   │   ├── comics/           # Comic-specific components
│   │   ├── listings/         # eBay listing components
│   │   ├── search/           # Search forms
│   │   └── want-list/        # Want list components
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Core business logic
│   │   ├── comicvine/       # Comic Vine API client
│   │   ├── ebay/            # eBay API client
│   │   ├── scoring/         # Deal scoring algorithm
│   │   ├── cache/           # Caching layer
│   │   └── parser/          # Listing parser
│   └── types/               # TypeScript types
├── prisma/                   # Database schema & migrations
└── tests/                    # Test files (Vitest)
```

---

## 🔑 Key Features to Understand

### 1. Comic Search
- `/character` - Search for characters
- `/issue` - Search for specific issues
- `/key-issues` - Browse important issues

### 2. Collection Management
- Add comics to your collection
- View collection statistics
- Track which issues you own

### 3. Want List
- Create a want list of comics
- Get notified of deals
- Track prices over time

### 4. Deal Scoring
The app scores eBay listings based on:
- Price vs average market value
- Seller reputation
- Shipping costs
- Item condition

### 5. API Integrations
- **Comic Vine**: Comic metadata, covers, issue details
- **eBay**: Price checking and marketplace listings

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Watch mode (runs on file changes)
npm run test:watch
```

---

## 🎨 Customization Ideas

Here are some features you might want to add:
- **Authentication**: User accounts with Auth0 or NextAuth
- **Price alerts**: Email/SMS when deals are found
- **Mobile app**: React Native version
- **Social features**: Share collections, follow other collectors
- **Advanced analytics**: Price trends, collection value over time
- **Bulk import**: Import from CSV or other comic tracking apps
- **Grading support**: Track CGC/CBCS graded comics

---

## 📝 Development Workflow

1. **Create a feature branch**: `git checkout -b feature/your-feature-name`
2. **Make changes**: Edit code, add tests
3. **Test**: Run `npm test` and `npm run dev` to verify
4. **Commit**: `git commit -m "Add: your feature description"`
5. **Push**: `git push origin feature/your-feature-name`
6. **Deploy**: Merge to main when ready

---

## 🐛 Common Issues

### Database Connection Errors
- Make sure PostgreSQL is running
- Check your `DATABASE_URL` in `.env`
- Run `npx prisma migrate dev` to update schema

### API Rate Limits
- Comic Vine: 200 requests/hour (free tier)
- eBay: Varies by developer tier
- Consider implementing caching (already built in `src/lib/cache/`)

### Build Errors
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again
- Clear Next.js cache: `rm -rf .next`

---

## 📚 Useful Commands

```bash
# Development
npm run dev              # Start dev server
npm run build           # Build for production
npm start               # Run production build

# Database
npx prisma studio       # Visual database editor
npx prisma migrate dev  # Create migration
npx prisma db push      # Push schema changes (dev only)

# Testing
npm test                # Run tests once
npm run test:watch      # Watch mode

# Linting
npm run lint           # Check for issues
```

---

## 🤝 Need Help?

- Check the original CONTRIBUTING.md for project philosophy
- Review the `/tests` folder for usage examples
- Comic Vine API docs: https://comicvine.gamespot.com/api/documentation
- Next.js docs: https://nextjs.org/docs

---

## 🎉 Next Steps

1. ✅ Push code to your GitHub
2. ✅ Set up local development environment
3. ✅ Get API keys (Comic Vine is essential)
4. ✅ Run the app locally and explore
5. 🚀 Start building your first feature!

Good luck with the project! You've got a solid foundation to build from.
