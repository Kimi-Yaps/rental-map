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
  pricing JSONB,
  photos TEXT[],
  videos TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT fk_owner
    FOREIGN KEY (owner_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE
);

-- Add RLS policies
ALTER TABLE rental_drafts ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own drafts
CREATE POLICY "Users can view their own drafts"
  ON rental_drafts FOR SELECT
  USING (auth.uid() = owner_id);

-- Allow users to insert their own drafts
CREATE POLICY "Users can insert their own drafts"
  ON rental_drafts FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Allow users to update their own drafts
CREATE POLICY "Users can update their own drafts"
  ON rental_drafts FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Allow users to delete their own drafts
CREATE POLICY "Users can delete their own drafts"
  ON rental_drafts FOR DELETE
  USING (auth.uid() = owner_id);

-- Create index for owner_id
CREATE INDEX idx_rental_drafts_owner_id ON rental_drafts(owner_id);
