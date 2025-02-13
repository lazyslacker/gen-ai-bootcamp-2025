const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/dashboard/last_study_session
router.get('/last_study_session', async (req, res) => {
    try {
        const session = await db.asyncGet(`
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
            LIMIT 1
        `);

        if (!session) {
            return res.json({ session: null });
        }

        res.json({
            session: {
                id: session.id,
                group_id: session.group_id,
                group_name: session.group_name,
                activity_id: session.activity_id,
                activity_name: session.activity_name,
                start_time: session.created_at,
                end_time: session.created_at,
                review_items_count: session.review_items_count
            }
        });
    } catch (err) {
        console.error('Error getting last study session:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/dashboard/study_progress
router.get('/study_progress', async (req, res) => {
    try {
        const progress = await db.asyncAll(`
            SELECT 
                g.id as group_id,
                g.name as group_name,
                COUNT(DISTINCT w.id) as total_words,
                COUNT(DISTINCT CASE WHEN wri.correct = 1 THEN w.id END) as mastered_words
            FROM groups g
            JOIN words_groups wg ON g.id = wg.group_id
            JOIN words w ON w.id = wg.word_id
            LEFT JOIN word_review_items wri ON wri.word_id = w.id
            GROUP BY g.id
        `);

        res.json({
            items: progress.map(group => ({
                group_id: group.group_id,
                group_name: group.group_name,
                total_words: group.total_words,
                mastered_words: group.mastered_words,
                progress_percentage: Math.round((group.mastered_words / group.total_words) * 100)
            }))
        });
    } catch (err) {
        console.error('Error getting study progress:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/dashboard/quick-stats
router.get('/quick-stats', async (req, res) => {
    try {
        const stats = await db.asyncGet(`
            SELECT
                COUNT(DISTINCT ss.id) as total_sessions,
                COUNT(DISTINCT wri.id) as total_reviews,
                COUNT(DISTINCT CASE WHEN wri.correct = 1 THEN wri.id END) as correct_reviews,
                COUNT(DISTINCT w.id) as total_words
            FROM study_sessions ss
            LEFT JOIN word_review_items wri ON wri.study_session_id = ss.id
            CROSS JOIN words w
        `);

        res.json({
            total_sessions: stats.total_sessions,
            total_reviews: stats.total_reviews,
            accuracy_percentage: Math.round((stats.correct_reviews / stats.total_reviews) * 100) || 0,
            total_words: stats.total_words
        });
    } catch (err) {
        console.error('Error getting quick stats:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router; 