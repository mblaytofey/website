/**
 * Puzzle Database Module
 * Handles fetching daily puzzles from Supabase
 *
 * SETUP INSTRUCTIONS:
 * 1. Create a free Supabase account at https://supabase.com
 * 2. Create a new project
 * 3. Create the 'puzzles' table (see schema below)
 * 4. Update SUPABASE_URL and SUPABASE_ANON_KEY below
 * 5. Enable Row Level Security and add a policy for public read access
 *
 * TABLE SCHEMA (run in Supabase SQL Editor):
 *
 * CREATE TABLE puzzles (
 *     id SERIAL PRIMARY KEY,
 *     puzzle_date DATE UNIQUE NOT NULL,
 *     clue1_hint TEXT NOT NULL,
 *     clue1_answer TEXT NOT NULL,
 *     clue2_hint TEXT NOT NULL,
 *     clue2_answer TEXT NOT NULL,
 *     clue3_hint TEXT NOT NULL,
 *     clue3_answer TEXT NOT NULL,
 *     link_hint TEXT NOT NULL,
 *     link_answer TEXT NOT NULL,
 *     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
 * );
 *
 * -- Enable Row Level Security
 * ALTER TABLE puzzles ENABLE ROW LEVEL SECURITY;
 *
 * -- Allow public read access (for the web app)
 * CREATE POLICY "Allow public read access" ON puzzles
 *     FOR SELECT USING (true);
 *
 * -- Create index for faster date lookups
 * CREATE INDEX idx_puzzles_date ON puzzles(puzzle_date);
 */

const PuzzleDB = (function() {
    'use strict';

    // ============================================
    // CONFIGURATION - Update these values
    // ============================================

    const CONFIG = {
        // Replace with your Supabase project URL
        SUPABASE_URL: 'YOUR_SUPABASE_URL',

        // Replace with your Supabase anon/public key
        SUPABASE_ANON_KEY: 'YOUR_SUPABASE_ANON_KEY',

        // Table name in Supabase
        TABLE_NAME: 'puzzles',

        // Cache duration in milliseconds (1 hour)
        CACHE_DURATION: 60 * 60 * 1000
    };

    // ============================================
    // PRIVATE METHODS
    // ============================================

    /**
     * Gets today's date in YYYY-MM-DD format
     * @returns {string} Date string
     */
    function getDateString(date = new Date()) {
        return date.toISOString().split('T')[0];
    }

    /**
     * Checks if the database is configured
     * @returns {boolean}
     */
    function isConfigured() {
        return CONFIG.SUPABASE_URL !== 'YOUR_SUPABASE_URL' &&
               CONFIG.SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY';
    }

    /**
     * Fetches puzzle from Supabase for a specific date
     * @param {string} dateStr - Date in YYYY-MM-DD format
     * @returns {Promise<object|null>} Puzzle data or null
     */
    async function fetchPuzzleFromDB(dateStr) {
        if (!isConfigured()) {
            console.warn('PuzzleDB: Supabase not configured. Using fallback puzzles.');
            return null;
        }

        const url = `${CONFIG.SUPABASE_URL}/rest/v1/${CONFIG.TABLE_NAME}?puzzle_date=eq.${dateStr}&select=*`;

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'apikey': CONFIG.SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data && data.length > 0) {
                return transformDBPuzzle(data[0]);
            }

            return null;
        } catch (error) {
            console.error('PuzzleDB: Error fetching puzzle:', error);
            return null;
        }
    }

    /**
     * Transforms database row into puzzle format
     * @param {object} row - Database row
     * @returns {object} Puzzle object
     */
    function transformDBPuzzle(row) {
        return {
            date: row.puzzle_date,
            clues: [
                { hint: row.clue1_hint, answer: row.clue1_answer },
                { hint: row.clue2_hint, answer: row.clue2_answer },
                { hint: row.clue3_hint, answer: row.clue3_answer }
            ],
            link: { hint: row.link_hint, answer: row.link_answer }
        };
    }

    /**
     * Gets cached puzzle if valid
     * @returns {object|null} Cached puzzle or null
     */
    function getCachedPuzzle() {
        try {
            const cached = localStorage.getItem('puzzleCache');
            if (!cached) return null;

            const { puzzle, timestamp, date } = JSON.parse(cached);
            const now = Date.now();
            const today = getDateString();

            // Check if cache is still valid (same day and not expired)
            if (date === today && (now - timestamp) < CONFIG.CACHE_DURATION) {
                return puzzle;
            }

            return null;
        } catch (error) {
            console.error('PuzzleDB: Error reading cache:', error);
            return null;
        }
    }

    /**
     * Caches puzzle data
     * @param {object} puzzle - Puzzle to cache
     */
    function cachePuzzle(puzzle) {
        try {
            const cacheData = {
                puzzle: puzzle,
                timestamp: Date.now(),
                date: getDateString()
            };
            localStorage.setItem('puzzleCache', JSON.stringify(cacheData));
        } catch (error) {
            console.error('PuzzleDB: Error caching puzzle:', error);
        }
    }

    // ============================================
    // FALLBACK PUZZLES
    // Used when database is not configured or unavailable
    // ============================================

    const FALLBACK_PUZZLES = [
        {
            clues: [
                { hint: "A round fruit that keeps the doctor away", answer: "apple" },
                { hint: "A company founded by Steve Jobs", answer: "apple" },
                { hint: "The Big _____ (nickname for New York City)", answer: "apple" }
            ],
            link: { hint: "What word connects all three clues?", answer: "apple" }
        },
        {
            clues: [
                { hint: "Earth's natural satellite", answer: "moon" },
                { hint: "To show your backside in public", answer: "moon" },
                { hint: "_____ River (a famous song)", answer: "moon" }
            ],
            link: { hint: "What word connects all three clues?", answer: "moon" }
        },
        {
            clues: [
                { hint: "A playing card with a single pip", answer: "ace" },
                { hint: "A serve that can't be returned in tennis", answer: "ace" },
                { hint: "_____ Ventura (Jim Carrey movie)", answer: "ace" }
            ],
            link: { hint: "What word connects all three clues?", answer: "ace" }
        },
        {
            clues: [
                { hint: "The organ that pumps blood", answer: "heart" },
                { hint: "The center or core of something", answer: "heart" },
                { hint: "A suit in a deck of cards", answer: "heart" }
            ],
            link: { hint: "What word connects all three clues?", answer: "heart" }
        },
        {
            clues: [
                { hint: "A celestial body that shines at night", answer: "star" },
                { hint: "A famous celebrity", answer: "star" },
                { hint: "A shape with five points", answer: "star" }
            ],
            link: { hint: "What word connects all three clues?", answer: "star" }
        },
        {
            clues: [
                { hint: "The joint connecting the arm to the hand", answer: "wrist" },
                { hint: "Where you wear a watch", answer: "wrist" },
                { hint: "_____ band (a type of bracelet)", answer: "wrist" }
            ],
            link: { hint: "What word connects all three clues?", answer: "wrist" }
        },
        {
            clues: [
                { hint: "A type of tree that produces acorns", answer: "oak" },
                { hint: "A strong and durable wood for furniture", answer: "oak" },
                { hint: "_____ Island (NFL Raiders' former stadium)", answer: "oak" }
            ],
            link: { hint: "What word connects all three clues?", answer: "oak" }
        }
    ];

    /**
     * Gets a fallback puzzle based on the date
     * @param {string} dateStr - Date string
     * @returns {object} Puzzle object
     */
    function getFallbackPuzzle(dateStr) {
        let hash = 0;
        for (let i = 0; i < dateStr.length; i++) {
            const char = dateStr.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        const index = Math.abs(hash) % FALLBACK_PUZZLES.length;
        return { ...FALLBACK_PUZZLES[index], isFallback: true };
    }

    // ============================================
    // PUBLIC API
    // ============================================

    return {
        /**
         * Gets today's puzzle (from DB or fallback)
         * @returns {Promise<object>} Puzzle object
         */
        async getTodaysPuzzle() {
            const today = getDateString();

            // Check cache first
            const cached = getCachedPuzzle();
            if (cached) {
                console.log('PuzzleDB: Using cached puzzle');
                return cached;
            }

            // Try to fetch from database
            const dbPuzzle = await fetchPuzzleFromDB(today);
            if (dbPuzzle) {
                console.log('PuzzleDB: Using puzzle from database');
                cachePuzzle(dbPuzzle);
                return dbPuzzle;
            }

            // Fall back to hardcoded puzzles
            console.log('PuzzleDB: Using fallback puzzle');
            const fallback = getFallbackPuzzle(today);
            return fallback;
        },

        /**
         * Gets puzzle for a specific date
         * @param {string} dateStr - Date in YYYY-MM-DD format
         * @returns {Promise<object>} Puzzle object
         */
        async getPuzzleByDate(dateStr) {
            const dbPuzzle = await fetchPuzzleFromDB(dateStr);
            if (dbPuzzle) {
                return dbPuzzle;
            }
            return getFallbackPuzzle(dateStr);
        },

        /**
         * Checks if database is properly configured
         * @returns {boolean}
         */
        isConfigured: isConfigured,

        /**
         * Gets the current date string
         * @returns {string}
         */
        getDateString: getDateString,

        /**
         * Clears the puzzle cache
         */
        clearCache() {
            localStorage.removeItem('puzzleCache');
        },

        /**
         * Configuration object (for debugging)
         */
        getConfig() {
            return {
                url: CONFIG.SUPABASE_URL.substring(0, 20) + '...',
                configured: isConfigured()
            };
        }
    };
})();

// Export for module systems (optional)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PuzzleDB;
}
