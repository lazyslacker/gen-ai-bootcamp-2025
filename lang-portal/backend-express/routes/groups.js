const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/groups - Get all groups
router.get('/', async (req, res) => {
    try {
        const groups = await db.asyncAll('SELECT * FROM groups');
        res.json({ items: groups });
    } catch (err) {
        console.error('Error getting groups:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/groups/:id - Get a specific group
router.get('/:id', async (req, res) => {
    try {
        const group = await db.asyncGet(
            'SELECT * FROM groups WHERE id = ?',
            [req.params.id]
        );
        
        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }
        
        res.json(group);
    } catch (err) {
        console.error('Error getting group:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/groups/:id/words - Get words in a group
router.get('/:id/words', async (req, res) => {
    try {
        const words = await db.asyncAll(`
            SELECT w.* 
            FROM words w
            JOIN words_groups wg ON w.id = wg.word_id
            WHERE wg.group_id = ?
        `, [req.params.id]);
        
        res.json({ items: words });
    } catch (err) {
        console.error('Error getting group words:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/groups/:id/study_sessions - Get study sessions for a group
router.get('/:id/study_sessions', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const perPage = parseInt(req.query.per_page) || 10;
        const offset = (page - 1) * perPage;

        // Get total count
        const countResult = await db.asyncGet(`
            SELECT COUNT(*) as count 
            FROM study_sessions ss
            WHERE ss.group_id = ?
        `, [req.params.id]);
        const totalCount = countResult.count;

        // Get paginated sessions
        const sessions = await db.asyncAll(`
            SELECT 
                ss.id,
                ss.group_id,
                g.name as group_name,
                sa.id as activity_id,
                sa.name as activity_name,
                ss.created_at,
                COUNT(wri.id) as review_items_count
            FROM study_sessions ss
            JOIN groups g ON g.id = ss.group_id
            JOIN study_activities sa ON sa.id = ss.study_activity_id
            LEFT JOIN word_review_items wri ON wri.study_session_id = ss.id
            WHERE ss.group_id = ?
            GROUP BY ss.id
            ORDER BY ss.created_at DESC
            LIMIT ? OFFSET ?
        `, [req.params.id, perPage, offset]);

        res.json({
            items: sessions.map(session => ({
                id: session.id,
                group_id: session.group_id,
                group_name: session.group_name,
                activity_id: session.activity_id,
                activity_name: session.activity_name,
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
        console.error('Error getting study sessions for group:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router; 