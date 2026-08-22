const express = require('express');

const { requireAuth, requireRole } = require('../middlewares/auth');
const {
  recordingUploader,
  uploadCallRecording,
  listCallRecordsAdmin,
  deleteCallRecord,
} = require('../controllers/callRecords.controller');

const router = express.Router();

router.post('/upload', requireAuth, recordingUploader.single('file'), uploadCallRecording);
router.get('/', requireAuth, requireRole('admin'), listCallRecordsAdmin);
router.delete('/:id', requireAuth, requireRole('admin'), deleteCallRecord);

module.exports = router;
