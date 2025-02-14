const express = require('express');
const router = express.Router();
const db = require('../db');

/**
 * @swagger
 * /api/study-activities:
 *   get:
 *     summary: Get all study activities
 *     description: Retrieve a list of available study activities
 *     responses:
 *       200:
 *         description: List of study activities
 */
router.get('/', async (req, res) => {
    try {
        const activities = await db.asyncAll(`
            SELECT 
                id,
                name as title,
                description,
                thumbnail_url as preview_url,
                launch_url
            FROM study_activities
        `);
        
        res.json(activities);
    } catch (err) {
        console.error('Error getting study activities:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/study-activities/:id
router.get('/:id', async (req, res) => {
    try {
        const activity = await db.asyncGet(
            'SELECT * FROM study_activities WHERE id = ?',
            [req.params.id]
        );
        if (!activity) {
            return res.status(404).json({ error: 'Activity not found' });
        }
        res.json(activity);
    } catch (err) {
        console.error('Error getting study activity:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/study-activities/:id/sessions
router.get('/:id/sessions', async (req, res) => {
    try {
        const { id } = req.params;
        const page = parseInt(req.query.page) || 1;
        const perPage = parseInt(req.query.per_page) || 10;
        const offset = (page - 1) * perPage;

        // First check if activity exists
        const activity = await db.asyncGet(
            'SELECT id FROM study_activities WHERE id = ?',
            [id]
        );

        if (!activity) {
            return res.status(404).json({
                error: 'Study activity not found',
                activity_id: id
            });
        }

        const sessions = await db.asyncAll(`
            SELECT 
                ss.id,
                ss.created_at,
                ss.group_id,
                g.name as group_name,
                COUNT(wri.id) as review_count,
                SUM(CASE WHEN wri.correct THEN 1 ELSE 0 END) as correct_count
            FROM study_sessions ss
            JOIN groups g ON ss.group_id = g.id
            LEFT JOIN word_review_items wri ON ss.id = wri.study_session_id
            WHERE ss.study_activity_id = ?
            GROUP BY ss.id
            ORDER BY ss.created_at DESC
            LIMIT ? OFFSET ?
        `, [id, perPage, offset]);

        const total = await db.asyncGet(
            'SELECT COUNT(*) as count FROM study_sessions WHERE study_activity_id = ?',
            [id]
        );

        res.json({
            items: sessions,
            total: total.count,
            page,
            per_page: perPage,
            total_pages: Math.ceil(total.count / perPage)
        });
    } catch (err) {
        console.error('Error getting activity sessions:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /api/study-activities/{id}/launch:
 *   get:
 *     summary: Launch a study activity
 *     description: Get launch configuration for a study activity
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Activity ID
 *     responses:
 *       200:
 *         description: Activity launch configuration
 *       404:
 *         description: Activity not found
 */
router.get('/:id/launch', async (req, res) => {
    try {
        const { id } = req.params;

        // First check if activity exists
        const activity = await db.asyncGet(`
            SELECT 
                id,
                name as title,
                description,
                thumbnail_url as preview_url,
                launch_url
            FROM study_activities 
            WHERE id = ?
        `, [id]);

        if (!activity) {
            return res.status(404).json({
                error: 'Study activity not found',
                activity_id: id
            });
        }

        // Get available groups for this activity
        const groups = await db.asyncAll(`
            SELECT 
                g.id,
                g.name,
                COUNT(DISTINCT w.id) as word_count
            FROM groups g
            JOIN words_groups wg ON g.id = wg.group_id
            JOIN words w ON wg.word_id = w.id
            GROUP BY g.id
            HAVING word_count > 0
            ORDER BY g.name
        `);

        res.json({
            activity,
            groups,
            config: {
                min_words_required: 5,
                max_session_duration: 3600, // 1 hour in seconds
                default_group_id: groups[0]?.id
            }
        });
    } catch (err) {
        console.error('Error getting activity launch config:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router; 