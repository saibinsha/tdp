const AppSetting = require('../models/AppSetting');

async function getAppSettings() {
  return AppSetting.findOneAndUpdate(
    { key: 'global' },
    { $setOnInsert: { key: 'global', allowUserRegistration: true } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

async function getAppSettingsReadOnly() {
  return AppSetting.findOne({ key: 'global' });
}

async function setAllowUserRegistration(allowUserRegistration) {
  return AppSetting.findOneAndUpdate(
    { key: 'global' },
    { $set: { allowUserRegistration: Boolean(allowUserRegistration) }, $setOnInsert: { key: 'global' } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

module.exports = { getAppSettings, getAppSettingsReadOnly, setAllowUserRegistration };
