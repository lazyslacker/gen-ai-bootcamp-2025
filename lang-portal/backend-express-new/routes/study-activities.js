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

// GET /api/study-activities/:id/study_sessions
router.get('/:id/study_sessions', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const sessions = await db.asyncAll(`
            SELECT ss.*, g.name as group_name
            FROM study_sessions ss
            JOIN groups g ON ss.group_id = g.id
            WHERE ss.study_activity_id = ?
            ORDER BY ss.created_at DESC
            LIMIT ? OFFSET ?
        `, [req.params.id, limit, offset]);

        const total = await db.asyncGet(
            'SELECT COUNT(*) as count FROM study_sessions WHERE study_activity_id = ?',
            [req.params.id]
        );

        res.json({
            items: sessions,
            pagination: {
                page,
                limit,
                total: total.count
            }
        });
    } catch (err) {
        console.error('Error getting study sessions:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router; 