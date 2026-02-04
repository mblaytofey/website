# Daily Puzzle Game - Database Setup Guide

This guide explains how to set up and manage the daily puzzle database using Supabase.

## Overview

The puzzle game pulls daily puzzles from a Supabase database. Each puzzle has:
- **3 clues** with hints and answers
- **1 link** that connects all three clues

Puzzles are scheduled by date, allowing you to prepare content in advance.

## Quick Start

### 1. Create a Supabase Account

1. Go to [supabase.com](https://supabase.com)
2. Sign up for a free account
3. Create a new project (remember your database password)

### 2. Create the Puzzles Table

1. Go to the SQL Editor in your Supabase dashboard
2. Run this SQL to create the table:

```sql
-- Create the puzzles table
CREATE TABLE puzzles (
    id SERIAL PRIMARY KEY,
    puzzle_date DATE UNIQUE NOT NULL,
    clue1_hint TEXT NOT NULL,
    clue1_answer TEXT NOT NULL,
    clue2_hint TEXT NOT NULL,
    clue2_answer TEXT NOT NULL,
    clue3_hint TEXT NOT NULL,
    clue3_answer TEXT NOT NULL,
    link_hint TEXT NOT NULL,
    link_answer TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE puzzles ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for the web app)
CREATE POLICY "Allow public read access" ON puzzles
    FOR SELECT USING (true);

-- Create index for faster date lookups
CREATE INDEX idx_puzzles_date ON puzzles(puzzle_date);
```

### 3. Configure the Web App

1. Open `js/puzzle-db.js`
2. Find the `CONFIG` section at the top
3. Replace the placeholder values:

```javascript
const CONFIG = {
    SUPABASE_URL: 'https://your-project-id.supabase.co',
    SUPABASE_ANON_KEY: 'your-anon-key-here',
    // ...
};
```

**Where to find these values:**
- Go to your Supabase project dashboard
- Click "Settings" → "API"
- Copy the "Project URL" and "anon public" key

### 4. Add Your First Puzzle

Using the Supabase Table Editor:

1. Go to "Table Editor" in your dashboard
2. Select the `puzzles` table
3. Click "Insert Row"
4. Fill in the fields:

| Field | Example Value |
|-------|---------------|
| puzzle_date | 2024-01-15 |
| clue1_hint | A round fruit that keeps the doctor away |
| clue1_answer | apple |
| clue2_hint | A company founded by Steve Jobs |
| clue2_answer | apple |
| clue3_hint | The Big _____ (nickname for NYC) |
| clue3_answer | apple |
| link_hint | What word connects all three clues? |
| link_answer | apple |

Or use SQL:

```sql
INSERT INTO puzzles (
    puzzle_date,
    clue1_hint, clue1_answer,
    clue2_hint, clue2_answer,
    clue3_hint, clue3_answer,
    link_hint, link_answer
) VALUES (
    '2024-01-15',
    'A round fruit that keeps the doctor away', 'apple',
    'A company founded by Steve Jobs', 'apple',
    'The Big _____ (nickname for NYC)', 'apple',
    'What word connects all three clues?', 'apple'
);
```

## Adding Multiple Puzzles

### Bulk Insert via SQL

```sql
INSERT INTO puzzles (
    puzzle_date,
    clue1_hint, clue1_answer,
    clue2_hint, clue2_answer,
    clue3_hint, clue3_answer,
    link_hint, link_answer
) VALUES
    ('2024-01-16', 'Earth''s natural satellite', 'moon', 'To show your backside', 'moon', '_____ River (song)', 'moon', 'What connects them?', 'moon'),
    ('2024-01-17', 'A playing card with one pip', 'ace', 'An unreturnable tennis serve', 'ace', '_____ Ventura (movie)', 'ace', 'What connects them?', 'ace'),
    ('2024-01-18', 'The organ that pumps blood', 'heart', 'The core of something', 'heart', 'A suit in cards', 'heart', 'What connects them?', 'heart');
```

### Import from CSV

1. Create a CSV file with headers matching the table columns
2. In Supabase Table Editor, click "Import data from CSV"
3. Upload your file

## Best Practices

### Puzzle Design Tips

1. **Varied difficulty**: Mix easy hints with tricky ones
2. **Clear hints**: Avoid ambiguous wording
3. **Single-word answers**: Keep answers to one word when possible
4. **Test your puzzles**: Verify hints lead logically to answers

### Scheduling Tips

1. **Schedule ahead**: Add puzzles for the next 30+ days
2. **Check for gaps**: Query for missing dates:

```sql
-- Find missing dates in the next 30 days
WITH date_series AS (
    SELECT generate_series(
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '30 days',
        '1 day'
    )::date AS check_date
)
SELECT check_date
FROM date_series
LEFT JOIN puzzles ON puzzle_date = check_date
WHERE puzzle_date IS NULL;
```

3. **View upcoming puzzles**:

```sql
SELECT puzzle_date, link_answer as theme
FROM puzzles
WHERE puzzle_date >= CURRENT_DATE
ORDER BY puzzle_date
LIMIT 14;
```

## Fallback Behavior

If the database is unavailable or not configured:

1. The app displays a brief error message
2. A fallback puzzle from the built-in set is used
3. The fallback is deterministic (same puzzle for same date)
4. Users can still play the game normally

## Troubleshooting

### "Could not load puzzle" message

1. Check browser console for errors
2. Verify Supabase URL and API key are correct
3. Confirm the table exists and has data for today's date
4. Check RLS policies allow public SELECT

### Puzzle not updating

1. Clear browser cache/localStorage
2. Call `PuzzleDB.clearCache()` in browser console
3. Verify the correct date puzzle exists in database

### CORS errors

Supabase handles CORS automatically. If you see CORS errors:
1. Check you're using the correct project URL
2. Ensure you're using HTTPS

## Security Notes

- The `anon` key is safe to use in client-side code
- Row Level Security ensures only SELECT is allowed
- Answers are visible in network requests (by design for this game type)
- For answer protection, consider server-side validation (requires backend)

## Database Schema Reference

```
puzzles
├── id (SERIAL, PRIMARY KEY)
├── puzzle_date (DATE, UNIQUE, NOT NULL)
├── clue1_hint (TEXT, NOT NULL)
├── clue1_answer (TEXT, NOT NULL)
├── clue2_hint (TEXT, NOT NULL)
├── clue2_answer (TEXT, NOT NULL)
├── clue3_hint (TEXT, NOT NULL)
├── clue3_answer (TEXT, NOT NULL)
├── link_hint (TEXT, NOT NULL)
├── link_answer (TEXT, NOT NULL)
└── created_at (TIMESTAMPTZ, DEFAULT NOW())
```
