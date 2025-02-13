const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/words - Retrieve paginated words list
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const itemsPerPage = parseInt(req.query.per_page) || 100;
        const offset = (page - 1) * itemsPerPage;

        // Get total count
        const countResult = await db.asyncGet('SELECT COUNT(*) as count FROM words');
        const totalCount = countResult.count;

        // Get paginated words
        const words = await db.asyncAll(
            'SELECT * FROM words LIMIT ? OFFSET ?',
            [itemsPerPage, offset]
        );

        res.json({
            items: words,
            pagination: {
                current_page: page,
                per_page: itemsPerPage,
                total_pages: Math.ceil(totalCount / itemsPerPage),
                total_items: totalCount
            }
        });
    } catch (err) {
        console.error('Error getting words:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router; 