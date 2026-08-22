const express = require('express');
const { requireAuth, requireRole } = require('../middlewares/auth');
const {
  listLeaders,
  getLeaderByIdOrSlug,
  createLeader,
  updateLeader,
  deleteLeader,
  toggleNewsTracking,
} = require('../controllers/leaders.controller');

const router = express.Router();

// Public routes
router.get('/', listLeaders);
router.get('/:idOrSlug', getLeaderByIdOrSlug);

// Admin-only management routes
router.post('/', requireAuth, requireRole('admin'), createLeader);
router.patch('/:id', requireAuth, requireRole('admin'), updateLeader);
router.delete('/:id', requireAuth, requireRole('admin'), deleteLeader);
router.patch('/:id/toggle-news', requireAuth, requireRole('admin'), toggleNewsTracking);

module.exports = router;
