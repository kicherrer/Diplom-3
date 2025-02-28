# MediaVault

A personal media library application for tracking, discovering, and managing your favorite movies, TV shows, and documentaries.

## Features

- User authentication with Supabase
- Multi-language support (English and Russian)
- Media catalog with TMDb integration
- User profile management
- Personal watchlist and ratings
- Responsive design with dark mode support

## Prerequisites

- Node.js 18.x or later
- npm 9.x or later
- Supabase account
- TMDb API key

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_TMDB_API_KEY=your_tmdb_api_key
```

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## Project Structure

```
├── app/                  # Next.js app directory
├── components/           # React components
├── lib/                  # Utility functions and configurations
│   ├── i18n/            # Internationalization
│   └── supabase.ts      # Supabase client
├── public/              # Static assets
└── types/               # TypeScript type definitions
```

## Technologies Used

- Next.js 13
- React 18
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase
- i18next
- TMDb API

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request