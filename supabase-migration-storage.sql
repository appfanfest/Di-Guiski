-- Migration: Ensure storage buckets exist and are public
-- This creates the 'logos' bucket if it doesn't exist.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('logos', 'logos', true, 5242880, '{image/jpeg,image/png,image/webp}')
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for the bucket
-- Allow public read access
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'logos');

-- Allow authenticated users to upload to 'logos'
CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'logos' AND auth.role() = 'authenticated'
);

-- Allow users to update/delete their own objects
CREATE POLICY "User Control" ON storage.objects FOR ALL USING (
    bucket_id = 'logos' AND (auth.uid())::text = (storage.foldername(name))[1]
);
