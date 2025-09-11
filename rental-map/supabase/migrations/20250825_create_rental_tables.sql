-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create rental_drafts table
CREATE TABLE IF NOT EXISTS rental_drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  property_type TEXT,
  title TEXT,
  description TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  bathrooms INTEGER,
  size_sqft NUMERIC,
  bedrooms JSONB,
  amenities JSONB,
  pricetype JSONB,  -- Changed from pricing to pricetype
  photos TEXT[],
  videos TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT fk_owner
    FOREIGN KEY (owner_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE
);

-- Create properties table if not exists
CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description TEXT,
  address TEXT NOT NULL,
  property_type TEXT NOT NULL,
  bathrooms INT4 NOT NULL,
  bedrooms JSONB NOT NULL DEFAULT '{}',
  pricetype JSONB NOT NULL DEFAULT '{}',
  photos TEXT[] DEFAULT ARRAY[]::TEXT[],
  videos TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for rental_drafts
ALTER TABLE rental_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own drafts"
  ON rental_drafts FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own drafts"
  ON rental_drafts FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own drafts"
  ON rental_drafts FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own drafts"
  ON rental_drafts FOR DELETE
  USING (auth.uid() = owner_id);

-- Add RLS policies for properties
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all properties"
  ON properties FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own properties"
  ON properties FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own properties"
  ON properties FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own properties"
  ON properties FOR DELETE
  USING (auth.uid() = owner_id);

-- Create indexes
CREATE INDEX idx_rental_drafts_owner_id ON rental_drafts(owner_id);
CREATE INDEX idx_properties_owner_id ON properties(owner_id);
CREATE INDEX idx_properties_is_available ON properties(is_available);
