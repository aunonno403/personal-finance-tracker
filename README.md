# Personal Finance Tracker

A full-featured personal finance application built with Next.js 14, React, TypeScript, and Tailwind CSS. Track income and expenses, visualize spending patterns, manage budgets, and authenticate with multi-user isolation.

## Features

- Dashboard with real-time financial summary
- Transaction management (add, edit, delete, search, filter)
- Budget tracking with configurable thresholds
- Analytics with category distribution and monthly trends
- User authentication with secure password hashing
- Per-user data isolation via MongoDB
- CSV import and export with preview editing
- Import history with undo functionality
- Responsive design for mobile and desktop

## Tech Stack

- **Next.js 14.2.5** - React framework with API routes
- **React 18** - UI library
- **TypeScript 5** - Type safety
- **Tailwind CSS 3.4** - Styling
- **MongoDB** - Cloud database (Atlas)
- **shadcn/ui** - UI components
- **Recharts** - Data visualization
- **date-fns** - Date utilities

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- MongoDB Atlas account (for production/cloud)

### Local Development

```bash
git clone https://github.com/aunonno403/personal-finance-tracker.git
cd personal-finance-tracker
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

This app is production-ready and designed for Vercel with MongoDB Atlas as the database backend.

For complete deployment instructions, see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md).

### Quick deployment checklist:
1. Set up MongoDB Atlas cluster
2. Configure environment variables in Vercel
3. Push code to GitHub
4. Deploy via Vercel
5. Run data migration if needed

## Documentation

- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Production deployment with MongoDB and Vercel
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - API reference
- [progression_plan.md](./progression_plan.md) - Implementation roadmap

## Development Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm start        # Run production server
npm run lint     # Run ESLint
```

## Project Structure

```
src/
├── app/                       # Next.js app router
│   ├── api/                   # API routes
│   ├── page.tsx               # Dashboard
│   └── login/                 # Authentication
├── components/                # React components
├── lib/                       # Utilities and types
└── middleware.ts              # Route protection
```

## Key Features

- **Authentication**: Secure login/register with MongoDB-backed sessions
- **Multi-user**: Each user sees only their own transactions
- **CSV Import/Export**: Bulk operations with preview and validation
- **Real-time Dashboard**: Summary, analytics, and budget overview
- **Responsive UI**: Works on mobile, tablet, and desktop

## Environment Variables

```env
DB_TYPE=mongodb
MONGODB_URI=mongodb://...
MONGODB_DB_NAME=Finance_Manager_Project
```

For local JSON mode, omit `DB_TYPE` or set it to a non-mongodb value.

## License

MIT



---

Last updated: April 30, 2026
