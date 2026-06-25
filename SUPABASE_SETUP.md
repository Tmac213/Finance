# Supabase Setup Guide

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login.
2. Create a new project.
3. Wait for the project to be set up.

## 2. Get Project Credentials

1. In your Supabase dashboard, go to Settings > API.
2. Copy the "Project URL" and "anon public" key.
3. Update your `.env.local` file:
   ```
   VITE_SUPABASE_URL=your_project_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

## 3. Set Up Database Schema

1. In your Supabase dashboard, go to the SQL Editor.
2. Run the SQL from `supabase-schema.sql` to create tables, policies, and indexes.

## 4. Configure GitHub OAuth

1. Go to [GitHub Developer Settings](https://github.com/settings/developers).
2. Create a new OAuth App:
   - Application name: Mint Mosaic Hub
   - Homepage URL: `http://localhost:5173` (for development) or your production URL
   - Authorization callback URL: `https://your-project-ref.supabase.co/auth/v1/callback`
3. Copy the Client ID and Client Secret.

4. In Supabase dashboard, go to Authentication > Providers.
5. Enable GitHub provider.
6. Paste the Client ID and Client Secret.
7. Save.

## 5. Test the Integration

1. Run your app: `npm run dev`
2. Click "Login with GitHub" in the sidebar.
3. Authorize the app on GitHub.
4. You should be logged in and data should sync with Supabase.

## Notes

- Data is isolated per user via Row Level Security.
- If you encounter issues, check the browser console and Supabase logs.
- For production, update the OAuth callback URL and environment variables.
