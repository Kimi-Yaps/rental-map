# Rental Map

A cross-platform property rental app built with React, Ionic, and Supabase. Users can search, list, and manage rental properties with a modern UI and real-time database.

## Features
- Property search with recommendations and autocomplete
- Landlord onboarding and property listing
- Property type selection and filtering
- Supabase backend for data storage and authentication
- Responsive, mobile-friendly UI with Ionic

## Project Structure

```
src/
  App.tsx                # Main app router and Ionic setup
  main.tsx               # React entry point
  setupTests.ts          # Jest setup for testing
  App.test.tsx           # Basic render test
  pages/
    Home.tsx             # Main search and recommendations page
    HomeSearched.tsx     # Search results and property list
    HomeBestFIt.tsx      # Property type best fit selection
    landlordHome.tsx     # Landlord dashboard and entry point
    PropertyType.tsx     # Property type selection page
  theme/
    variables.css        # Ionic theme variables
  components/            # (Add shared components here)
public/
  index.html             # App HTML shell
.env.local               # Environment variables (Supabase keys)
```

## Key Files

- **App.tsx**: Sets up Ionic, routes, and page navigation.
- **Home.tsx**: Main landing page with search, recommendations, and navigation bar.
- **HomeSearched.tsx**: Displays property search results and allows for search recommendations.
- **HomeBestFIt.tsx**: Lets users select the best fit property type.
- **landlordHome.tsx**: Landlord dashboard with a button to list a property.
- **PropertyType.tsx**: Lets landlords select the type of property to list.
- **supabaseConfig.js**: (Recommended) Centralized Supabase client instance for use throughout the app.

## Environment Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Set up environment variables:**
   Create a `.env.local` file with your Supabase project credentials:
   ```
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```
3. **Start the development server:**
   ```bash
   npm run dev
   ```

## Supabase Configuration
- Make sure to enable Row Level Security (RLS) policies for public read access on tables you want to query from the frontend.
- Example policy for `property_addresses`:
  ```sql
  create policy "Allow read for all" on public.property_addresses for select using (true);
  ```

## Testing
- Run tests with:
  ```bash
  npm test
  ```

## Contributing
Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## License
[MIT](LICENSE)
