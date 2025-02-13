const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/study_activities - Get all study activities
router.get('/', async (req, res) => {
    try {
        const activities = await db.asyncAll('SELECT * FROM study_activities');
        res.json({ items: activities });
    } catch (err) {
        console.error('Error getting study activities:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/study_activities/:id - Get a specific study activity
router.get('/:id', async (req, res) => {
    try {
        const activity = await db.asyncGet(
            'SELECT * FROM study_activities WHERE id = ?',
            [req.params.id]
        );
        
        if (!activity) {
            return res.status(404).json({
                error: 'Study activity not found',
                activity_id: req.params.id
            });
        }
        
        res.json(activity);
    } catch (err) {
        console.error('Error getting study activity:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/study_activities/:id/study_sessions - Get study sessions for an activity
router.get('/:id/study_sessions', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const perPage = parseInt(req.query.per_page) || 10;
        const offset = (page - 1) * perPage;

        // Get total count
        const countResult = await db.asyncGet(`
            SELECT COUNT(*) as count 
            FROM study_sessions ss
            WHERE ss.study_activity_id = ?
        `, [req.params.id]);
        const totalCount = countResult.count;

        // Get paginated sessions
        const sessions = await db.asyncAll(`
            SELECT 
                ss.id,
                ss.group_id,
                g.name as group_name,
                ss.created_at,
                COUNT(wri.id) as review_items_count
            FROM study_sessions ss
            JOIN groups g ON g.id = ss.group_id
            LEFT JOIN word_review_items wri ON wri.study_session_id = ss.id
            WHERE ss.study_activity_id = ?
            GROUP BY ss.id
            ORDER BY ss.created_at DESC
            LIMIT ? OFFSET ?
        `, [req.params.id, perPage, offset]);

        res.json({
            items: sessions.map(session => ({
                id: session.id,
                group_id: session.group_id,
                group_name: session.group_name,
                start_time: session.created_at,
                end_time: session.created_at,  // For now, just use the same time
                review_items_count: session.review_items_count
            })),
            total: totalCount,
            page: page,
            per_page: perPage,
            total_pages: Math.ceil(totalCount / perPage)
        });
    } catch (err) {
        console.error('Error getting study sessions for activity:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router; 