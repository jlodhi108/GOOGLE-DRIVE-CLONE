const { DataTypes, Model } = require('sequelize');
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
