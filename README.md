# Rental Map

A cross-platform property rental app built with React, Ionic, and Supabase. Users can search, list, and manage rental properties with a modern UI and real-time database.

## Features
- Property search with recommendations and autocomplete
- Landlord onboarding and property listing
- Multi-step property creation process
- Interactive map for location selection
- Supabase backend for data storage
- Responsive, mobile-friendly UI with Ionic

## Project Structure

```
src/
  App.tsx                # Main app router and Ionic setup
  main.tsx               # React entry point
  pages/
    Home.tsx             # Main search and recommendations page
    HomeSearched.tsx     # Search results and property list
    landlordHome.tsx     # Landlord dashboard and entry point
    PropertyType.tsx     # Property type selection page
    HomeBestFIt.tsx      # Home type selection page
    LocationStepPage.tsx # Step 1 of property creation (Location)
    AmenitiesStepPage.tsx# Step 2 of property creation (Amenities)
    FinalReviewPage.tsx  # Final step of property creation (Review)
  components/
    DataConvertion.tsx   # Data conversion logic for Supabase
    DbCrud.tsx           # Database CRUD operations
    PublishPropertyButton.tsx # Button to publish a property
    SearchbarWithSuggestions.tsx # Searchbar with autocomplete
  theme/
    variables.css        # Ionic theme variables
public/
  index.html             # App HTML shell
.env.local               # Environment variables (Supabase keys)
```

## Key Files

- **App.tsx**: Sets up Ionic, routes, and page navigation.
- **landlordHome.tsx**: The starting point for a landlord to list a property.
- **PropertyType.tsx**: Allows the user to select a property type (Home, Hotel, Unique).
- **HomeBestFIt.tsx**: Allows the user to select the type of "Home" property.
- **LocationStepPage.tsx**: Step 1 of the property creation process, handles the property's location.
- **AmenitiesStepPage.tsx**: Step 2 of the property creation process, handles the property's amenities.
- **FinalReviewPage.tsx**: The final step of the property creation process, displays a summary of the property.
- **PublishPropertyButton.tsx**: A reusable button that handles the actual publishing of the property to Supabase.
- **DataConvertion.tsx**: Contains the logic to convert the client-side rental draft data into the format required by the Supabase database schema.
- **supabaseConfig.ts**: Centralized Supabase client instance for use throughout the app.

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
- Example policy for `properties`:
  ```sql
  create policy "Allow read for all" on public.properties for select using (true);
  ```