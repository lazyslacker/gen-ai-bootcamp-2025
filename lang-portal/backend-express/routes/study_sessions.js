const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/study_sessions - Get paginated study sessions
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const perPage = parseInt(req.query.per_page) || 10;
        const offset = (page - 1) * perPage;

        // Get total count
        const countResult = await db.asyncGet(`
            SELECT COUNT(*) as count 
            FROM study_sessions ss
            JOIN groups g ON g.id = ss.group_id
            JOIN study_activities sa ON sa.id = ss.study_activity_id
        `);
        const totalCount = countResult.count;

        // Get paginated sessions with review counts
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
            GROUP BY ss.id
            ORDER BY ss.created_at DESC
            LIMIT ? OFFSET ?
        `, [perPage, offset]);

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
        console.error('Error getting study sessions:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/study_sessions - Create a new study session
router.post('/', async (req, res) => {
    try {
        const { group_id, study_activity_id } = req.body;

        // Validate required fields
        if (!group_id || !study_activity_id) {
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['group_id', 'study_activity_id']
            });
        }

        // Validate field types
        if (!Number.isInteger(group_id) || !Number.isInteger(study_activity_id)) {
            return res.status(400).json({
                error: 'Invalid field types',
                required: {
                    group_id: 'integer',
                    study_activity_id: 'integer'
                }
            });
        }

        // Validate group exists
        const group = await db.asyncGet('SELECT id FROM groups WHERE id = ?', [group_id]);
        if (!group) {
            return res.status(404).json({
                error: 'Group not found',
                group_id: group_id
            });
        }

        // Validate study activity exists
        const activity = await db.asyncGet(
            'SELECT id FROM study_activities WHERE id = ?',
            [study_activity_id]
        );
        if (!activity) {
            return res.status(404).json({
                error: 'Study activity not found',
                study_activity_id: study_activity_id
            });
        }

        // Insert new study session
        const result = await db.asyncRun(
            'INSERT INTO study_sessions (group_id, study_activity_id) VALUES (?, ?)',
            [group_id, study_activity_id]
        );

        // Get the created session
        const session = await db.asyncGet(`
            SELECT 
                ss.id,
                ss.group_id,
                g.name as group_name,
                sa.id as activity_id,
                sa.name as activity_name,
                ss.created_at
            FROM study_sessions ss
            JOIN groups g ON g.id = ss.group_id
            JOIN study_activities sa ON sa.id = ss.study_activity_id
            WHERE ss.id = ?
        `, [result.lastID]);

        res.status(201).json(session);
    } catch (err) {
        console.error('Error creating study session:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/study_sessions/:id/words/:word_id/review - Record a word review
router.post('/:session_id/words/:word_id/review', async (req, res) => {
    try {
        const { session_id, word_id } = req.params;
        const { correct } = req.body;

        // Validate correct field
        if (typeof correct !== 'boolean') {
            return res.status(400).json({
                error: 'Invalid field type',
                required: {
                    correct: 'boolean'
                }
            });
        }

        // Validate session exists and get its group
        const session = await db.asyncGet(
            'SELECT ss.id, ss.group_id FROM study_sessions ss WHERE ss.id = ?',
            [session_id]
        );
        if (!session) {
            return res.status(404).json({
                error: 'Study session not found',
                session_id: session_id
            });
        }

        // Validate word exists and belongs to session's group
        const word = await db.asyncGet(`
            SELECT w.id 
            FROM words w
            JOIN words_groups wg ON w.id = wg.word_id 
            WHERE w.id = ? AND wg.group_id = ?
        `, [word_id, session.group_id]);
        
        if (!word) {
            return res.status(404).json({
                error: 'Word not found or not in session group',
                word_id: word_id,
                group_id: session.group_id
            });
        }

        // Insert review record
        await db.asyncRun(
            'INSERT INTO word_review_items (word_id, study_session_id, correct) VALUES (?, ?, ?)',
            [word_id, session_id, correct]
        );

        res.status(201).json({
            success: true,
            word_id: parseInt(word_id),
            study_session_id: parseInt(session_id),
            correct: correct,
            created_at: new Date().toISOString()
        });
    } catch (err) {
        console.error('Error recording word review:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router; 