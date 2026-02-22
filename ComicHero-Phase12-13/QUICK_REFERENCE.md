# ComicHero - Quick Reference

## 🚀 Most Used Commands

```bash
npm run dev              # Start dev server (http://localhost:3000)
npm test                 # Run tests
npx prisma studio       # Database GUI
git status              # Check what changed
git add . && git commit -m "message" && git push
```

## 📂 Where Things Are

```
Key Files:
src/app/page.tsx                    → Homepage
src/app/api/comicvine/search/route.ts → Comic search API
src/lib/comicvine/client.ts         → Comic Vine API client
src/lib/ebay/client.ts              → eBay API client
src/lib/scoring/deal-scorer.ts      → Deal scoring logic
prisma/schema.prisma                → Database schema
```

## 🔧 Environment Variables

```env
DATABASE_URL=postgresql://...        # Required
COMIC_VINE_API_KEY=...              # Required - get at comicvine.gamespot.com/api
EBAY_CLIENT_ID=...                  # Optional
EBAY_CLIENT_SECRET=...              # Optional
```

## 🎯 App Features (Current)

✅ Search comics by issue, character, or key issues
✅ Browse Comic Vine database with cover art
✅ Create and manage want list
✅ Track comic collection
✅ eBay integration (if API keys configured)
✅ Deal scoring algorithm
✅ Caching layer for API calls

## 💡 Feature Ideas (Future)

- [ ] User authentication
- [ ] Price alerts
- [ ] Collection value tracking
- [ ] Social sharing
- [ ] Mobile app
- [ ] Bulk import/export
- [ ] Grading support (CGC/CBCS)
- [ ] Advanced analytics

## 🐛 Troubleshooting

**Database issues?**
→ `npx prisma migrate dev`

**API not working?**
→ Check `.env` file has COMIC_VINE_API_KEY

**Build errors?**
→ Delete `node_modules` and `.next`, run `npm install`

**Port 3000 in use?**
→ `kill -9 $(lsof -ti:3000)` or use `PORT=3001 npm run dev`

## 📞 Support

- Original repo: github.com/craigde/ComicHero (for reference)
- Your repo: github.com/contentjester-bit/ComicHero (after setup)
- Comic Vine API: comicvine.gamespot.com/api/documentation
- Next.js docs: nextjs.org/docs
