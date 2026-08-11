const { DataTypes, Model } = require('sequelize');
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
