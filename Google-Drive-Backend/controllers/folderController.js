// folderController.js
const { Folder, File } = require('../models');
const s3Service = require('../services/s3Service');
const { createActivity } = require('../services/activityService');
const { Op } = require('sequelize');

// Create a new folder
exports.createFolder = async (req, res) => {
  try {
    const { name, parentId } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Folder name is required' });
    }

    let path = name;
    if (parentId) {
      const parentFolder = await Folder.findOne({ where: { id: parentId, owner: req.user.id } });
      if (!parentFolder) {
        return res.status(404).json({ message: 'Parent folder not found' });
      }
      path = `${parentFolder.path}/${name}`;
    }

    const folder = await Folder.create({
      name,
      path,
      owner: req.user.id,
      parent: parentId || null
    });

    await createActivity(req.user.id, 'create_folder', folder.id, 'Folder');

    res.status(201).json({ message: 'Folder created successfully', folder });
  } catch (error) {
    res.status(500).json({ message: 'Error creating folder', error: error.message });
  }
};

// Get all folders for a user
exports.getUserFolders = async (req, res) => {
  try {
    const { parentId } = req.query;
    const query = { owner: req.user.id, isDeleted: false };
    if (parentId) {
      query.parent = parentId;
    } else {
      query.parent = null; // Root folders
    }

    const folders = await Folder.findAll({ where: query, order: [['name', 'ASC']] });
    res.json(folders);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching folders', error: error.message });
  }
};

// Get a single folder
exports.getFolder = async (req, res) => {
  try {
    const folder = await Folder.findOne({ where: { id: req.params.id, owner: req.user.id } });
    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }
    res.json(folder);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching folder', error: error.message });
  }
};

// Update folder details
exports.updateFolder = async (req, res) => {
  try {
    const { name } = req.body;
    const folder = await Folder.findOne({ where: { id: req.params.id, owner: req.user.id } });

    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }

    if (name) {
      const oldPath = folder.path;
      const newPath = folder.path.replace(folder.name, name);
      folder.name = name;
      folder.path = newPath;
      await folder.save();

      // For SQLite we'll just fetch all subfolders and files and update them in js
      const subfolders = await Folder.findAll({ where: { path: { [Op.like]: `${oldPath}/%` } } });
      for (let sf of subfolders) {
        sf.path = sf.path.replace(`${oldPath}/`, `${newPath}/`);
        await sf.save();
      }

      const files = await File.findAll({ where: { path: { [Op.like]: `${oldPath}/%` } } });
      for (let f of files) {
        f.path = f.path.replace(`${oldPath}/`, `${newPath}/`);
        await f.save();
      }
    }

    await createActivity(req.user.id, 'rename', folder.id, 'Folder');

    res.json({ message: 'Folder updated successfully', folder });
  } catch (error) {
    res.status(500).json({ message: 'Error updating folder', error: error.message });
  }
};

// Delete a folder (soft delete)
exports.deleteFolder = async (req, res) => {
  try {
    const folder = await Folder.findOne({ where: { id: req.params.id, owner: req.user.id, isDeleted: false } });

    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }

    const deletedAt = new Date();

    await Folder.update({ isDeleted: true, deletedAt }, { where: { path: { [Op.like]: `${folder.path}/%` } } });
    await File.update({ isDeleted: true, deletedAt }, { where: { path: { [Op.like]: `${folder.path}/%` } } });

    folder.isDeleted = true;
    folder.deletedAt = deletedAt;
    await folder.save();

    await createActivity(req.user.id, 'trash', folder.id, 'Folder');

    res.json({ message: 'Folder and its contents moved to trash' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting folder', error: error.message });
  }
};

// Restore a folder
exports.restoreFolder = async (req, res) => {
  try {
    const folder = await Folder.findOne({ where: { id: req.params.id, owner: req.user.id, isDeleted: true } });

    if (!folder) {
      return res.status(404).json({ message: 'Folder not found in trash' });
    }

    await Folder.update({ isDeleted: false, deletedAt: null }, { where: { path: { [Op.like]: `${folder.path}/%` } } });
    await File.update({ isDeleted: false, deletedAt: null }, { where: { path: { [Op.like]: `${folder.path}/%` } } });

    folder.isDeleted = false;
    folder.deletedAt = null;
    await folder.save();

    await createActivity(req.user.id, 'restore', folder.id, 'Folder');

    res.json({ message: 'Folder restored successfully', folder });
  } catch (error) {
    res.status(500).json({ message: 'Error restoring folder', error: error.message });
  }
};

// Permanently delete a folder
exports.permanentlyDeleteFolder = async (req, res) => {
  try {
    const folder = await Folder.findOne({ where: { id: req.params.id, owner: req.user.id } });

    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }

    const filesToDelete = await File.findAll({ where: { path: { [Op.like]: `${folder.path}/%` } } });
    await Promise.all(filesToDelete.map(f => s3Service.deleteFile(f.path).catch(() => {})));

    await Folder.destroy({ where: { path: { [Op.like]: `${folder.path}/%` } } });
    await File.destroy({ where: { path: { [Op.like]: `${folder.path}/%` } } });
    await Folder.destroy({ where: { id: folder.id } });

    await createActivity(req.user.id, 'delete_folder', folder.id, 'Folder');

    res.json({ message: 'Folder and its contents permanently deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error permanently deleting folder', error: error.message });
  }
};

// Toggle star on a folder
exports.toggleStarFolder = async (req, res) => {
  try {
    const folder = await Folder.findOne({ where: { id: req.params.id, owner: req.user.id, isDeleted: false } });
    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }
    folder.starred = !folder.starred;
    await folder.save();
    await createActivity(req.user.id, folder.starred ? 'star' : 'unstar', folder.id, 'Folder');
    res.json({ message: 'Folder updated successfully', folder });
  } catch (error) {
    res.status(500).json({ message: 'Error starring folder', error: error.message });
  }
};

// Get trashed folders for a user
exports.getTrashedFolders = async (req, res) => {
  try {
    const folders = await Folder.findAll({ where: { owner: req.user.id, isDeleted: true }, order: [['deletedAt', 'DESC']] });
    res.json(folders);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching trashed folders', error: error.message });
  }
};

// Get starred folders for a user
exports.getStarredFolders = async (req, res) => {
  try {
    const folders = await Folder.findAll({ where: { owner: req.user.id, isDeleted: false, starred: true }, order: [['name', 'ASC']] });
    res.json(folders);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching starred folders', error: error.message });
  }
};

// Search folders
exports.searchFolders = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const folders = await Folder.findAll({
      where: {
        owner: req.user.id,
        isDeleted: false,
        name: { [Op.like]: `%${query}%` }
      },
      order: [['name', 'ASC']]
    });

    res.json(folders);
  } catch (error) {
    res.status(500).json({ message: 'Error searching folders', error: error.message });
  }
};

// Get folder contents (subfolders and files)
exports.getFolderContents = async (req, res) => {
  try {
    const folderId = req.params.id;
    const folder = await Folder.findOne({ where: { id: folderId, owner: req.user.id, isDeleted: false } });

    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }

    const subfolders = await Folder.findAll({ where: { parent: folderId, isDeleted: false }, order: [['name', 'ASC']] });
    const files = await File.findAll({ where: { folder: folderId, isDeleted: false }, order: [['name', 'ASC']] });

    res.json({
      folder,
      contents: { subfolders, files }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching folder contents', error: error.message });
  }
};