const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, 'models');
const configDir = path.join(__dirname, 'config');

const databaseJs = `const { Sequelize } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../database.sqlite'),
  logging: false
});

module.exports = sequelize;
`;

const indexJs = `const sequelize = require('../config/database');
const User = require('./User');
const File = require('./File');
const Folder = require('./Folder');
const SharedFile = require('./SharedFile');
const SharedFolder = require('./SharedFolder');
const Activity = require('./Activity');

// Associations
User.hasMany(File, { foreignKey: 'owner' });
File.belongsTo(User, { foreignKey: 'owner', as: 'ownerUser' });

User.hasMany(Folder, { foreignKey: 'owner' });
Folder.belongsTo(User, { foreignKey: 'owner', as: 'ownerUser' });

Folder.hasMany(File, { foreignKey: 'folder' });
File.belongsTo(Folder, { foreignKey: 'folder', as: 'folderModel' });

Folder.hasMany(Folder, { foreignKey: 'parent', as: 'childFolders' });
Folder.belongsTo(Folder, { foreignKey: 'parent', as: 'parentFolder' });

File.hasMany(SharedFile, { foreignKey: 'file' });
SharedFile.belongsTo(File, { foreignKey: 'file' });
SharedFile.belongsTo(User, { foreignKey: 'sharedBy', as: 'sharer' });
SharedFile.belongsTo(User, { foreignKey: 'sharedWith', as: 'receiver' });

Folder.hasMany(SharedFolder, { foreignKey: 'folder' });
SharedFolder.belongsTo(Folder, { foreignKey: 'folder' });
SharedFolder.belongsTo(User, { foreignKey: 'sharedBy', as: 'sharer' });
SharedFolder.belongsTo(User, { foreignKey: 'sharedWith', as: 'receiver' });

Activity.belongsTo(User, { foreignKey: 'user' });
Activity.belongsTo(File, { foreignKey: 'target', constraints: false });
Activity.belongsTo(Folder, { foreignKey: 'target', constraints: false });

module.exports = {
  sequelize,
  User,
  File,
  Folder,
  SharedFile,
  SharedFolder,
  Activity
};
`;

const userJs = `const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

class User extends Model {
  async matchPassword(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
  }
  getResetPasswordToken() { return 'token'; }
  generateOtp() {
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    this.otp = otp;
    this.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    return otp;
  }
  matchOtp(submittedOtp) {
    return !!this.otp && this.otp === submittedOtp && this.otpExpires && this.otpExpires > new Date();
  }
  hasEnoughStorage(fileSize) {
    return (this.storageUsed + fileSize) <= this.storageLimit;
  }
  async updateStorageUsed(size) {
    this.storageUsed += size;
    await this.save();
  }
}

User.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING(50), allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM('user', 'admin'), defaultValue: 'user' },
  googleId: { type: DataTypes.STRING, unique: true, allowNull: true },
  avatar: { type: DataTypes.STRING, defaultValue: 'default-avatar.png' },
  storageUsed: { type: DataTypes.FLOAT, defaultValue: 0 },
  storageLimit: { type: DataTypes.FLOAT, defaultValue: 5 * 1024 * 1024 * 1024 },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  isVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
  otp: { type: DataTypes.STRING },
  otpExpires: { type: DataTypes.DATE },
  lastLogin: { type: DataTypes.DATE },
  resetPasswordToken: { type: DataTypes.STRING },
  resetPasswordExpire: { type: DataTypes.DATE },
  tokens: { type: DataTypes.JSON, defaultValue: [] },
  refreshTokens: { type: DataTypes.JSON, defaultValue: [] }
}, {
  sequelize,
  modelName: 'User',
  hooks: {
    beforeSave: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  },
  defaultScope: {
    attributes: { exclude: ['password', 'otp', 'otpExpires', 'resetPasswordToken', 'resetPasswordExpire'] }
  },
  scopes: {
    withPassword: { attributes: {} }
  }
});

module.exports = User;
`;

const fileJs = `const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class File extends Model {
  async softDelete() {
    this.isDeleted = true;
    this.deletedAt = new Date();
    await this.save();
  }
  async restore() {
    this.isDeleted = false;
    this.deletedAt = null;
    await this.save();
  }
}

File.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING(255), allowNull: false },
  originalName: { type: DataTypes.STRING, allowNull: false },
  path: { type: DataTypes.STRING, allowNull: false },
  size: { type: DataTypes.FLOAT, allowNull: false },
  mimeType: { type: DataTypes.STRING, allowNull: false },
  owner: { type: DataTypes.UUID, allowNull: false },
  folder: { type: DataTypes.UUID, allowNull: true },
  isPublic: { type: DataTypes.BOOLEAN, defaultValue: false },
  publicUrl: { type: DataTypes.STRING },
  starred: { type: DataTypes.BOOLEAN, defaultValue: false },
  lastAccessed: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  isDeleted: { type: DataTypes.BOOLEAN, defaultValue: false },
  deletedAt: { type: DataTypes.DATE },
  version: { type: DataTypes.INTEGER, defaultValue: 1 },
  extension: {
    type: DataTypes.VIRTUAL,
    get() { return this.name.split('.').pop(); }
  }
}, { sequelize, modelName: 'File' });

module.exports = File;
`;

const folderJs = `const { DataTypes, Model, Op } = require('sequelize');
const sequelize = require('../config/database');

class Folder extends Model {
  async getFullPath() {
    let fullPath = this.name;
    let currentFolder = this;
    while (currentFolder.parent) {
      currentFolder = await Folder.findByPk(currentFolder.parent);
      if (!currentFolder) break;
      fullPath = currentFolder.name + '/' + fullPath;
    }
    return fullPath;
  }
}

Folder.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING(255), allowNull: false },
  path: { type: DataTypes.STRING, allowNull: false },
  owner: { type: DataTypes.UUID, allowNull: false },
  parent: { type: DataTypes.UUID, allowNull: true },
  isRoot: { type: DataTypes.BOOLEAN, defaultValue: false },
  color: { type: DataTypes.STRING, defaultValue: '#000000' },
  isShared: { type: DataTypes.BOOLEAN, defaultValue: false },
  starred: { type: DataTypes.BOOLEAN, defaultValue: false },
  sharedWith: { type: DataTypes.JSON, defaultValue: [] },
  isDeleted: { type: DataTypes.BOOLEAN, defaultValue: false },
  deletedAt: { type: DataTypes.DATE }
}, { sequelize, modelName: 'Folder' });

module.exports = Folder;
`;

const sharedFileJs = `const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class SharedFile extends Model {
  hasExpired() {
    return this.expiresAt && this.expiresAt < new Date();
  }
  async incrementAccessCount() {
    this.accessCount += 1;
    this.lastAccessed = new Date();
    await this.save();
  }
}

SharedFile.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  file: { type: DataTypes.UUID, allowNull: false },
  sharedBy: { type: DataTypes.UUID, allowNull: false },
  sharedWith: { type: DataTypes.UUID, allowNull: false },
  permissions: { type: DataTypes.ENUM('read', 'write', 'admin'), defaultValue: 'read' },
  expiresAt: { type: DataTypes.DATE },
  accessCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  lastAccessed: { type: DataTypes.DATE },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  shareLink: { type: DataTypes.STRING, unique: true },
  password: { type: DataTypes.STRING }
}, { sequelize, modelName: 'SharedFile' });

module.exports = SharedFile;
`;

const sharedFolderJs = `const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class SharedFolder extends Model {
  hasExpired() {
    return this.expiresAt && this.expiresAt < new Date();
  }
  async incrementAccessCount() {
    this.accessCount += 1;
    this.lastAccessed = new Date();
    await this.save();
  }
}

SharedFolder.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  folder: { type: DataTypes.UUID, allowNull: false },
  sharedBy: { type: DataTypes.UUID, allowNull: false },
  sharedWith: { type: DataTypes.UUID, allowNull: false },
  permissions: { type: DataTypes.ENUM('read', 'write', 'admin'), defaultValue: 'read' },
  expiresAt: { type: DataTypes.DATE },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  shareLink: { type: DataTypes.STRING, unique: true },
  password: { type: DataTypes.STRING },
  includeSubfolders: { type: DataTypes.BOOLEAN, defaultValue: true },
  lastAccessed: { type: DataTypes.DATE },
  accessCount: { type: DataTypes.INTEGER, defaultValue: 0 }
}, { sequelize, modelName: 'SharedFolder' });

module.exports = SharedFolder;
`;

const activityJs = `const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Activity extends Model {
  anonymize() {
    if (this.ip) this.ip = this.ip.split('.').slice(0, 2).join('.') + '.xxx.xxx';
    this.userAgent = 'Anonymized';
    return this;
  }
}

Activity.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user: { type: DataTypes.UUID, allowNull: false },
  action: { type: DataTypes.STRING, allowNull: false },
  target: { type: DataTypes.UUID, allowNull: false },
  targetModel: { type: DataTypes.STRING, allowNull: false },
  details: { type: DataTypes.JSON },
  ip: { type: DataTypes.STRING },
  userAgent: { type: DataTypes.STRING },
  status: { type: DataTypes.STRING, defaultValue: 'success' },
  errorMessage: { type: DataTypes.STRING },
  isRead: { type: DataTypes.BOOLEAN, defaultValue: false }
}, { sequelize, modelName: 'Activity' });

module.exports = Activity;
`;

fs.writeFileSync(path.join(configDir, 'database.js'), databaseJs);
fs.writeFileSync(path.join(modelsDir, 'index.js'), indexJs);
fs.writeFileSync(path.join(modelsDir, 'User.js'), userJs);
fs.writeFileSync(path.join(modelsDir, 'File.js'), fileJs);
fs.writeFileSync(path.join(modelsDir, 'Folder.js'), folderJs);
fs.writeFileSync(path.join(modelsDir, 'SharedFile.js'), sharedFileJs);
fs.writeFileSync(path.join(modelsDir, 'SharedFolder.js'), sharedFolderJs);
fs.writeFileSync(path.join(modelsDir, 'Activity.js'), activityJs);

console.log('Models rewritten');
