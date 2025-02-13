const express = require('express');
const router = express.Router();
const db = require('../db');
const { validate, rules } = require('../middleware/validation');

/**
 * @swagger
 * /api/system/health:
 *   get:
 *     summary: Check system health
 *     description: Check the health status of the API and its dependencies
 *     responses:
 *       200:
 *         description: System health status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [healthy, unhealthy]
 *                 database:
 *                   type: object
 *                   properties:
 *                     connected:
 *                       type: boolean
 *                     foreign_keys_enabled:
 *                       type: boolean
 *                     tables:
 *                       type: object
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */

/**
 * @swagger
 * /api/system/stats:
 *   get:
 *     summary: Get system statistics
 *     description: Retrieve usage statistics about words, groups, and study sessions
 *     responses:
 *       200:
 *         description: System statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 words:
 *                   type: object
 *                   properties:
 *                     total_words:
 *                       type: integer
 *                     unique_words:
 *                       type: integer
 *                 groups:
 *                   type: object
 *                   properties:
 *                     total_groups:
 *                       type: integer
 *                     avg_words_per_group:
 *                       type: number
 *                 study_sessions:
 *                   type: object
 *                   properties:
 *                     total_sessions:
 *                       type: integer
 *                     groups_studied:
 *                       type: integer
 *                     activities_used:
 *                       type: integer
 */

// GET /api/system/stats - Get system statistics
router.get('/system/stats', async (req, res) => {
    try {
        const stats = await Promise.all([
            // Word stats
            db.asyncGet(`
                SELECT 
                    COUNT(*) as total_words,
                    COUNT(DISTINCT w.id) as unique_words
                FROM words w
            `),
            // Group stats
            db.asyncGet(`
                SELECT 
                    COUNT(*) as total_groups,
                    AVG(word_count) as avg_words_per_group
                FROM (
                    SELECT g.id, COUNT(wg.word_id) as word_count
                    FROM groups g
                    LEFT JOIN words_groups wg ON g.id = wg.group_id
                    GROUP BY g.id
                ) group_counts
            `),
            // Study stats
            db.asyncGet(`
                SELECT 
                    COUNT(*) as total_sessions,
                    COUNT(DISTINCT group_id) as groups_studied,
                    COUNT(DISTINCT study_activity_id) as activities_used
                FROM study_sessions
            `),
            // Review stats
            db.asyncGet(`
                SELECT 
                    COUNT(*) as total_reviews,
                    SUM(CASE WHEN correct THEN 1 ELSE 0 END) as correct_reviews,
                    ROUND(AVG(CASE WHEN correct THEN 1.0 ELSE 0.0 END) * 100, 2) as accuracy_percentage
                FROM word_review_items
            `)
        ]);

        res.json({
            words: stats[0],
            groups: stats[1],
            study_sessions: stats[2],
            reviews: stats[3]
        });
    } catch (err) {
        console.error('Error getting system stats:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/system/health - Check system health
router.get('/system/health', async (req, res) => {
    try {
        // Check database connection
        await db.asyncGet('SELECT 1');

        // Check if all tables exist
        const tables = await db.asyncAll(`
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name NOT LIKE 'sqlite_%'
        `);

        const requiredTables = [
            'words', 'groups', 'words_groups', 
            'study_sessions', 'study_activities', 
            'word_review_items'
        ];

        const missingTables = requiredTables.filter(
            table => !tables.find(t => t.name === table)
        );

        // Check foreign key constraints
        const foreignKeys = await db.asyncGet('PRAGMA foreign_keys');

        res.json({
            status: 'healthy',
            database: {
                connected: true,
                foreign_keys_enabled: foreignKeys.foreign_keys === 1,
                tables: {
                    required: requiredTables.length,
                    present: tables.length,
                    missing: missingTables
                }
            },
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error('Health check failed:', err);
        res.status(503).json({
            status: 'unhealthy',
            error: err.message,
            timestamp: new Date().toISOString()
        });
    }
});

// POST /api/system/vacuum - Optimize database
router.post('/system/vacuum', validate(rules.vacuum), async (req, res) => {
    try {
        await db.asyncRun('VACUUM');
        res.json({ message: 'Database optimized successfully' });
    } catch (err) {
        console.error('Error optimizing database:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/reset_history - Clear study history but keep words and groups
router.post('/reset_history', async (req, res) => {
    try {
        await db.asyncRun('BEGIN TRANSACTION');
        await db.asyncRun('DELETE FROM word_review_items');
        await db.asyncRun('DELETE FROM study_sessions');
        await db.asyncRun('COMMIT');

        res.json({
            success: true,
            message: 'Study history has been reset'
        });
    } catch (err) {
        await db.asyncRun('ROLLBACK');
        console.error('Error resetting history:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/full_reset - Reset everything to initial state
router.post('/full_reset', async (req, res) => {
    try {
        await db.asyncRun('BEGIN TRANSACTION');
        await db.asyncRun('DELETE FROM word_review_items');
        await db.asyncRun('DELETE FROM study_sessions');
        await db.asyncRun('DELETE FROM words_groups');
        await db.asyncRun('DELETE FROM words');
        await db.asyncRun('DELETE FROM groups');
        await db.asyncRun('DELETE FROM study_activities');
        await db.asyncRun('COMMIT');

        res.json({
            success: true,
            message: 'System has been fully reset'
        });
    } catch (err) {
        await db.asyncRun('ROLLBACK');
        console.error('Error performing full reset:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router; 