# বাকির খাতা (Baki Khata)

**Local-first PWA** for small shop owners, tuition teachers, and freelancers in Bangladesh to track customer dues (বাকি) and payments.

- 100% client-side (IndexedDB via Dexie.js)
- Fully offline after first load
- Installable on Android / iOS
- Complete Bengali UI + Bengali digits (০-৯)
- PDF receipt generation
- WhatsApp reminder deep-link
- JSON backup / restore

## Status

🚧 **Under active development**  
Core data layer + types + formatters are ready. UI, PWA, PDF, and full features coming next.

## Tech Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- Dexie.js (IndexedDB)
- next-pwa
- jsPDF
- date-fns

## Local Development

```bash
npm install
npm run dev
```

## License

MIT
