const mongoose = require('mongoose');

const AppSettingSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, default: 'global', index: true },
    allowUserRegistration: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AppSetting', AppSettingSchema);
