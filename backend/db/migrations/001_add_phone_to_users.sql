-- Migration: Add phone column to users table
-- Description: Add phone field to users table for storing resident phone numbers

-- Check if column exists, if not add it
ALTER TABLE users ADD COLUMN phone VARCHAR(15) DEFAULT NULL AFTER email;
