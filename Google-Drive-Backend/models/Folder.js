const { DataTypes, Model, Op } = require('sequelize');
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
