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
        const progress = await db.asyncAll(`
            SELECT 
                g.name as group_name,
                COUNT(DISTINCT wri.word_id) as words_reviewed,
                SUM(CASE WHEN wri.correct THEN 1 ELSE 0 END) as correct_count
            FROM groups g
            LEFT JOIN study_sessions ss ON g.id = ss.group_id
            LEFT JOIN word_review_items wri ON ss.id = wri.study_session_id
            GROUP BY g.id, g.name
        `);
        res.json(progress);
    } catch (err) {
        console.error('Error getting study progress:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router; 