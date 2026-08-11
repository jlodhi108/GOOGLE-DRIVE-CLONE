const sequelize = require('../config/database');
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
