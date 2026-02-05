-- Migration: Remove allowed_emails table (legacy whitelist system)
-- This table is no longer needed as we moved to activation code system

-- Drop table and related objects
DROP TABLE IF EXISTS public.allowed_emails CASCADE;

-- Note: This will also drop any triggers, indexes, or policies associated with this table
