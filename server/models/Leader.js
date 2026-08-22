const mongoose = require('mongoose');

const leaderSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    role: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: [
        'state_leadership',
        'national_leadership',
        'cabinet_ministers',
        'members_parliament',
        'assembly_members',
        'district_incharge',
        'youth_wing',
        'women_wing',
        'other',
      ],
      default: 'state_leadership',
      index: true,
    },
    photoUrl: {
      type: String,
      default: '',
      trim: true,
    },
    bio: {
      type: String,
      default: '',
      trim: true,
    },
    constituency: {
      type: String,
      default: '',
      trim: true,
    },
    district: {
      type: String,
      default: '',
      trim: true,
    },
    trackInNews: {
      type: Boolean,
      default: true,
      index: true,
    },
    searchKeywords: {
      type: String,
      default: '',
      trim: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    socialLinks: {
      twitter: { type: String, default: '' },
      facebook: { type: String, default: '' },
      instagram: { type: String, default: '' },
      website: { type: String, default: '' },
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

leaderSchema.index({ name: 'text', role: 'text', constituency: 'text', district: 'text' });

module.exports = mongoose.model('Leader', leaderSchema);
