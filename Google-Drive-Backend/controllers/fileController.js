// fileController.js
const { File, Folder, SharedFile } = require('../models');
const { upload } = require('../config/multer');
const s3Service = require('../services/s3Service');
const { createActivity } = require('../services/activityService');
const { Op } = require('sequelize');

// Upload a file
exports.uploadFile = [
  upload.single('file'),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    try {
      const { folderId } = req.body;
      const folder = folderId ? await Folder.findByPk(folderId) : null;
      if (folderId && !folder) {
        return res.status(404).json({ message: 'Folder not found' });
      }
      const { key } = await s3Service.uploadFile(req.file, req.user.id);
      const file = await File.create({
        name: req.file.originalname,
        originalName: req.file.originalname,
        path: key,
        size: req.file.size,
        mimeType: req.file.mimetype,
        owner: req.user.id,
        folder: folder ? folder.id : null
      });
      await createActivity(req.user.id, 'upload', file.id, 'File');
      res.status(201).json({
        message: 'File uploaded successfully',
        file: {
          id: file.id,
          name: file.name,
          path: file.path,
          size: file.size,
          mimeType: file.mimeType
        }
      });
    } catch (error) {
      console.error('File upload error:', error);
      res.status(500).json({ message: 'Error uploading file', error: error.message });
    }
  }
];

// Get all files for a user
exports.getUserFiles = async (req, res) => {
  try {
    const { folderId } = req.query;
    const query = { owner: req.user.id, isDeleted: false };
    if (folderId) {
      query.folder = folderId;
    }
    const files = await File.findAll({ where: query, order: [['createdAt', 'DESC']] });
    res.json(files);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching files', error: error.message });
  }
};

// Get a single file
exports.getFile = async (req, res) => {
  try {
    const file = await File.findOne({ where: { id: req.params.id, owner: req.user.id } });
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }
    res.json(file);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching file', error: error.message });
  }
};

// Update file details
exports.updateFile = async (req, res) => {
  try {
    const { name } = req.body;
    const file = await File.findOne({ where: { id: req.params.id, owner: req.user.id } });
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }
    if (name) file.name = name;
    await file.save();
    await createActivity(req.user.id, 'rename', file.id, 'File');
    res.json({ message: 'File updated successfully', file });
  } catch (error) {
    res.status(500).json({ message: 'Error updating file', error: error.message });
  }
};

// Delete a file (soft delete — moves it to trash)
exports.deleteFile = async (req, res) => {
  try {
    const file = await File.findOne({ where: { id: req.params.id, owner: req.user.id, isDeleted: false } });
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }
    file.isDeleted = true;
    file.deletedAt = new Date();
    await file.save();
    await createActivity(req.user.id, 'trash', file.id, 'File');
    res.json({ message: 'File moved to trash' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting file', error: error.message });
  }
};

// Restore a file from trash
exports.restoreFile = async (req, res) => {
  try {
    const file = await File.findOne({ where: { id: req.params.id, owner: req.user.id, isDeleted: true } });
    if (!file) {
      return res.status(404).json({ message: 'File not found in trash' });
    }
    file.isDeleted = false;
    file.deletedAt = null;
    await file.save();
    await createActivity(req.user.id, 'restore', file.id, 'File');
    res.json({ message: 'File restored successfully', file });
  } catch (error) {
    res.status(500).json({ message: 'Error restoring file', error: error.message });
  }
};

// Permanently delete a file (only reachable from trash)
exports.permanentlyDeleteFile = async (req, res) => {
  try {
    const file = await File.findOne({ where: { id: req.params.id, owner: req.user.id } });
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }
    await s3Service.deleteFile(file.path).catch(() => {});
    await File.destroy({ where: { id: file.id } });
    await createActivity(req.user.id, 'delete', file.id, 'File');
    res.json({ message: 'File permanently deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error permanently deleting file', error: error.message });
  }
};

// Toggle star on a file
exports.toggleStarFile = async (req, res) => {
  try {
    const file = await File.findOne({ where: { id: req.params.id, owner: req.user.id, isDeleted: false } });
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }
    file.starred = !file.starred;
    await file.save();
    await createActivity(req.user.id, file.starred ? 'star' : 'unstar', file.id, 'File');
    res.json({ message: 'File updated successfully', file });
  } catch (error) {
    res.status(500).json({ message: 'Error starring file', error: error.message });
  }
};

// Get trashed files for a user
exports.getTrashedFiles = async (req, res) => {
  try {
    const files = await File.findAll({ where: { owner: req.user.id, isDeleted: true }, order: [['deletedAt', 'DESC']] });
    res.json(files);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching trashed files', error: error.message });
  }
};

// Get starred files for a user
exports.getStarredFiles = async (req, res) => {
  try {
    const files = await File.findAll({ where: { owner: req.user.id, isDeleted: false, starred: true }, order: [['updatedAt', 'DESC']] });
    res.json(files);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching starred files', error: error.message });
  }
};

// Get recently modified files for a user
exports.getRecentFiles = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const files = await File.findAll({
      where: { owner: req.user.id, isDeleted: false },
      order: [['updatedAt', 'DESC']],
      limit
    });
    res.json(files);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching recent files', error: error.message });
  }
};

// Get total storage used by a user's non-deleted files
exports.getStorageUsage = async (req, res) => {
  try {
    const files = await File.findAll({ where: { owner: req.user.id, isDeleted: false }, raw: true });
    let usedBytes = 0;
    files.forEach(f => { usedBytes += (f.size || 0); });
    res.json({ usedBytes, fileCount: files.length });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching storage usage', error: error.message });
  }
};

// Search files
exports.searchFiles = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }
    const files = await File.findAll({
      where: {
        owner: req.user.id,
        isDeleted: false,
        name: { [Op.like]: `%${query}%` }
      },
      order: [['createdAt', 'DESC']]
    });
    res.json(files);
  } catch (error) {
    res.status(500).json({ message: 'Error searching files', error: error.message });
  }
};

// Generate a short-lived S3 pre-signed download/view URL.
exports.getDownloadUrl = async (req, res) => {
  try {
    const file = await File.findByPk(req.params.id);
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }
    const isOwner = file.owner === req.user.id;
    if (!isOwner) {
      const share = await SharedFile.findOne({ where: { file: file.id, sharedWith: req.user.id } });
      if (!share) {
        return res.status(403).json({ message: 'Not authorized to access this file' });
      }
    }
    const mode = req.query.mode === 'view' ? 'view' : 'download';
    const downloadUrl = await s3Service.getSignedUrl(file.path, {
      responseContentType: file.mimeType,
      responseContentDisposition: mode === 'view' ? 'inline' : `attachment; filename="${file.name}"`
    });
    res.json({ downloadUrl });
  } catch (error) {
    res.status(500).json({ message: 'Error generating download URL', error: error.message });
  }
};
