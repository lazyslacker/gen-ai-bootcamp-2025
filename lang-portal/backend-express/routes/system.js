const express = require('express');
const router = express.Router();
const db = require('../db');

// POST /api/reset_history - Reset study history
router.post('/reset_history', async (req, res) => {
    try {
        // First delete all word review items since they have foreign key constraints
        await db.asyncRun('DELETE FROM word_review_items');
        
        // Then delete all study sessions
        await db.asyncRun('DELETE FROM study_sessions');
        
        res.json({ message: 'Study history cleared successfully' });
    } catch (err) {
        console.error('Error resetting history:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/full_reset - Reset entire database
router.post('/full_reset', async (req, res) => {
    try {
        // Delete in order to respect foreign key constraints
        await db.asyncRun('DELETE FROM word_review_items');
        await db.asyncRun('DELETE FROM study_sessions');
        await db.asyncRun('DELETE FROM words_groups');
        await db.asyncRun('DELETE FROM words');
        await db.asyncRun('DELETE FROM groups');
        await db.asyncRun('DELETE FROM study_activities');
        
        res.json({ message: 'Database reset successfully' });
    } catch (err) {
        console.error('Error performing full reset:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router; 