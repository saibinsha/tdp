const { asyncHandler } = require('../utils/asyncHandler');
const { AppError } = require('../utils/AppError');
const Work = require('../models/Work');

const createWork = asyncHandler(async (req, res) => {
  const { title, description, category, location, priority } = req.body;
  if (!title || !String(title).trim()) throw new AppError('Work title is required', 400);
  if (!description || !String(description).trim()) throw new AppError('Work description is required', 400);
  if (!location || !String(location).trim()) throw new AppError('Location is required', 400);

  const doc = await Work.create({
    user: req.user._id,
    title: String(title).trim(),
    description: String(description).trim(),
    category: category ? String(category).trim() : 'General',
    location: String(location).trim(),
    priority: ['Low', 'Medium', 'High', 'Urgent'].includes(priority) ? priority : 'Medium',
    status: 'Open',
  });

  const populated = await doc.populate('user', 'name membershipId profilePicture');
  res.status(201).json({ ok: true, work: populated });
});

const listWorks = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, category, q } = req.query;

  const p = Math.max(1, parseInt(page, 10) || 1);
  const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

  const filter = {};
  if (status) filter.status = status;
  if (category) filter.category = category;
  if (q) {
    filter.$or = [
      { title: { $regex: String(q), $options: 'i' } },
      { description: { $regex: String(q), $options: 'i' } },
      { location: { $regex: String(q), $options: 'i' } },
    ];
  }

  const [items, total] = await Promise.all([
    Work.find(filter)
      .populate('user', 'name membershipId profilePicture')
      .sort({ createdAt: -1 })
      .skip((p - 1) * l)
      .limit(l),
    Work.countDocuments(filter),
  ]);

  res.json({ ok: true, page: p, limit: l, total, items });
});

const updateWork = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const work = await Work.findById(id);
  if (!work) throw new AppError('Work not found', 404);

  const isOwner = String(work.user) === String(req.user._id);
  if (!isOwner && req.user.role !== 'admin') throw new AppError('Forbidden', 403);

  const allowed = ['title', 'description', 'status', 'category', 'location', 'priority'];
  for (const k of allowed) {
    if (req.body[k] !== undefined) work[k] = req.body[k];
  }

  if (req.body.status !== undefined) {
    if (req.body.status === 'Found') work.foundAt = new Date();
    if (req.body.status !== 'Found') work.foundAt = null;
  }

  await work.save();
  res.json({ ok: true, work });
});

const deleteWork = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const work = await Work.findById(id);
  if (!work) throw new AppError('Work not found', 404);

  const isOwner = String(work.user) === String(req.user._id);
  if (!isOwner && req.user.role !== 'admin') throw new AppError('Forbidden', 403);

  await Work.deleteOne({ _id: work._id });
  res.json({ ok: true });
});

module.exports = { createWork, listWorks, updateWork, deleteWork };
