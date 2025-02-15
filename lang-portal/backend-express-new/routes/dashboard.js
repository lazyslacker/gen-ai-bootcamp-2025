const express = require('express');
const router = express.Router();
const db = require('../db');

/**
 * @swagger
 * /api/dashboard/last_study_session:
 *   get:
 *     summary: Get the last study session
 *     description: Retrieve information about the most recent study session
 *     responses:
 *       200:
 *         description: Last study session details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StudySession'
 *       404:
 *         description: No study sessions found
 */
router.get('/last_study_session', async (req, res) => {
    try {
        const session = await db.asyncGet(`
            SELECT ss.id, ss.group_id, ss.created_at, ss.study_activity_id,
                   g.name as group_name, sa.name as activity_name
            FROM study_sessions ss
            JOIN groups g ON ss.group_id = g.id
            JOIN study_activities sa ON ss.study_activity_id = sa.id
            ORDER BY ss.created_at DESC
            LIMIT 1
        `);
        res.json(session || null);
    } catch (err) {
        console.error('Error getting last study session:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /api/dashboard/study_progress:
 *   get:
 *     summary: Get study progress
 *     description: Retrieve progress statistics for all word groups
 *     responses:
 *       200:
 *         description: Study progress by group
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   group_name:
 *                     type: string
 *                     description: Name of the word group
 *                   words_reviewed:
 *                     type: integer
 *                     description: Number of words reviewed in this group
 *                   correct_count:
 *                     type: integer
 *                     description: Number of correct answers in this group
 */
router.get('/study_progress', async (req, res) => {
    try {
        // Get total words studied and available
        const stats = await db.asyncGet(`
            SELECT 
                COUNT(DISTINCT w.id) as total_available_words,
                COUNT(DISTINCT wri.word_id) as total_words_studied
            FROM words w
            LEFT JOIN word_review_items wri ON w.id = wri.word_id
        `);

        res.json({
            total_words_studied: stats.total_words_studied || 0,
            total_available_words: stats.total_available_words || 0
        });
    } catch (err) {
        console.error('Error getting study progress:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /api/dashboard/quick-stats:
 *   get:
 *     summary: Get quick stats
 *     description: Retrieve quick statistics about the user's learning progress
 *     responses:
 *       200:
 *         description: Quick statistics about the user's learning progress
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success_rate:
 *                   type: number
 *                   description: Success rate percentage
 *                 total_study_sessions:
 *                   type: integer
 *                   description: Total number of study sessions
 *                 total_active_groups:
 *                   type: integer
 *                   description: Total number of active groups
 *                 study_streak_days:
 *                   type: integer
 *                   description: Current study streak in days
 */
router.get('/quick-stats', async (req, res) => {
    try {
        const stats = await db.asyncGet(`
            SELECT 
                ROUND(AVG(CASE WHEN wri.correct THEN 100.0 ELSE 0 END), 2) as success_rate,
                COUNT(DISTINCT ss.id) as total_study_sessions,
                COUNT(DISTINCT g.id) as total_active_groups,
                0 as study_streak_days
            FROM study_sessions ss
            LEFT JOIN word_review_items wri ON wri.study_session_id = ss.id
            CROSS JOIN groups g
        `);

        res.json({
            success_rate: stats.success_rate || 0,
            total_study_sessions: stats.total_study_sessions || 0,
            total_active_groups: stats.total_active_groups || 0,
            study_streak_days: stats.study_streak_days || 0
        });
    } catch (err) {
        console.error('Error getting quick stats:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /api/dashboard/recent-session:
 *   get:
 *     summary: Get most recent study session
 */
router.get('/recent-session', async (req, res) => {
    try {
        const session = await db.asyncGet(`
            SELECT 
                ss.id,
                ss.group_id,
                sa.name as activity_name,
                ss.created_at,
                COUNT(CASE WHEN wri.correct THEN 1 END) as correct_count,
                COUNT(CASE WHEN NOT wri.correct THEN 1 END) as wrong_count
            FROM study_sessions ss
            JOIN study_activities sa ON ss.study_activity_id = sa.id
            LEFT JOIN word_review_items wri ON ss.id = wri.study_session_id
            GROUP BY ss.id
            ORDER BY ss.created_at DESC
            LIMIT 1
        `);
        
        res.json(session);
    } catch (err) {
        console.error('Error getting recent session:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /api/dashboard/stats:
 *   get:
 *     summary: Get study statistics
 */
router.get('/stats', async (req, res) => {
    try {
        const stats = await db.asyncGet(`
            WITH stats AS (
                SELECT 
                    COUNT(DISTINCT w.id) as total_vocabulary,
                    COUNT(DISTINCT wri.word_id) as total_words_studied,
                    COUNT(DISTINCT CASE WHEN wri.correct THEN wri.word_id END) as mastered_words,
                    ROUND(AVG(CASE WHEN wri.correct THEN 1 ELSE 0 END), 2) as success_rate,
                    COUNT(DISTINCT ss.id) as total_sessions,
                    COUNT(DISTINCT ss.group_id) as active_groups
                FROM words w
                LEFT JOIN word_review_items wri ON w.id = wri.word_id
                LEFT JOIN study_sessions ss ON wri.study_session_id = ss.id
            )
            SELECT 
                *,
                COALESCE((
                    SELECT COUNT(DISTINCT DATE(created_at))
                    FROM study_sessions
                    WHERE created_at >= date('now', '-7 days')
                ), 0) as current_streak
            FROM stats
        `);
        
        res.json(stats);
    } catch (err) {
        console.error('Error getting study stats:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router; 