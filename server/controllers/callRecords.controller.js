const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { Readable } = require('stream');

const { asyncHandler } = require('../utils/asyncHandler');
const { AppError } = require('../utils/AppError');
const CallRecord = require('../models/CallRecord');
const { getCloudinary2 } = require('../config/cloudinary2');

const recordingUploader = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
});

function uploadBufferToCloudinary(cld, buffer, options) {
  return new Promise((resolve, reject) => {
    let uploader;
    if (cld && cld.uploader && cld.uploader.upload_stream) {
      uploader = cld.uploader;
    } else if (cld && cld.upload && cld.upload) {
      uploader = cld;
    }

    if (!uploader || !uploader.upload_stream) {
      return reject(new Error('Cloudinary is not configured'));
    }

    const stream = uploader.upload_stream(options, (err, result) => {
      if (err) return reject(err);
      return resolve(result);
    });

    Readable.from(buffer).pipe(stream);
  });
}

const uploadCallRecording = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError('File required', 400);

  const {
    callId,
    scope,
    kind,
    fromUserId,
    toUserId,
    groupId,
    startedAt,
    endedAt,
    durationSec,
    mimeType,
  } = req.body || {};

  if (!callId) throw new AppError('callId is required', 400);
  if (scope !== 'private' && scope !== 'group') throw new AppError('scope must be private or group', 400);
  if (kind !== 'audio' && kind !== 'video') throw new AppError('kind must be audio or video', 400);

  let fileData = null;

  try {
    const cld = getCloudinary2();
    if (cld) {
      const folder = process.env.CLOUDINARY_CALL_RECORDS_FOLDER || 'tdp-call-records';
      const result = await uploadBufferToCloudinary(cld, req.file.buffer, {
        folder,
        resource_type: 'video',
      });
      fileData = {
        url: result.secure_url || result.url,
        publicId: result.public_id,
        bytes: result.bytes || req.file.size || 0,
        format: result.format || 'webm',
        resourceType: result.resource_type || 'video',
      };
    }
  } catch (cldErr) {
    console.warn('[CallRecording] Cloudinary upload failed, falling back to local file storage:', cldErr.message);
  }

  if (!fileData) {
    // Local storage fallback
    const uploadDir = path.join(process.cwd(), 'uploads', 'recordings');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const ext = req.file.mimetype && req.file.mimetype.includes('ogg') ? 'ogg' : 'webm';
    const filename = `call-${callId}-${Date.now()}.${ext}`;
    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, req.file.buffer);

    fileData = {
      url: `/uploads/recordings/${filename}`,
      publicId: filename,
      bytes: req.file.size || req.file.buffer.length,
      format: ext,
      resourceType: 'video',
    };
  }

  const doc = await CallRecord.create({
    callId: String(callId),
    scope,
    kind,
    uploader: req.user._id,
    fromUser: fromUserId || undefined,
    toUser: toUserId || undefined,
    groupId: groupId || undefined,
    startedAt: startedAt ? new Date(startedAt) : undefined,
    endedAt: endedAt ? new Date(endedAt) : undefined,
    durationSec: durationSec !== undefined && durationSec !== null ? Number(durationSec) : undefined,
    mimeType: mimeType ? String(mimeType) : String(req.file.mimetype || ''),
    file: fileData,
  });

  res.status(201).json({ ok: true, record: doc });
});

const listCallRecordsAdmin = asyncHandler(async (req, res) => {
  const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 50));

  const items = await CallRecord.find({})
    .populate('uploader', 'name membershipId profilePicture role')
    .populate('fromUser', 'name membershipId profilePicture role')
    .populate('toUser', 'name membershipId profilePicture role')
    .sort({ createdAt: -1 })
    .limit(limit);

  res.json({ ok: true, items });
});

const deleteCallRecord = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const doc = await CallRecord.findByIdAndDelete(id);
  if (!doc) throw new AppError('Record not found', 404);
  res.json({ ok: true });
});

module.exports = {
  recordingUploader,
  uploadCallRecording,
  listCallRecordsAdmin,
  deleteCallRecord,
};
