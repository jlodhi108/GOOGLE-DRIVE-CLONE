// services/searchService.js
const { File, Folder } = require('../models');
const { Op } = require('sequelize');

const searchService = {
  // Search for files and folders
  search: async (userId, query, options = {}) => {
    const { type, sortBy, sortOrder, limit = 20, page = 1 } = options;
    const skip = (page - 1) * limit;

    const baseQuery = {
      owner: userId,
      name: { [Op.like]: `%${query}%` }
    };

    const orderOptions = [];
    if (sortBy) {
      orderOptions.push([sortBy, sortOrder === 'desc' ? 'DESC' : 'ASC']);
    } else {
      orderOptions.push(['name', 'ASC']);
    }

    try {
      let files = [];
      let folders = [];
      let totalCount = 0;
      let folderCount = 0;

      if (!type || type === 'file') {
        files = await File.findAll({
          where: baseQuery,
          attributes: ['id', 'name', 'path', 'size', 'mimeType', 'createdAt', 'updatedAt'],
          order: orderOptions,
          offset: skip,
          limit,
          raw: true
        });
        totalCount = await File.count({ where: baseQuery });
      }

      if (!type || type === 'folder') {
        folders = await Folder.findAll({
          where: baseQuery,
          attributes: ['id', 'name', 'path', 'createdAt', 'updatedAt'],
          order: orderOptions,
          offset: skip,
          limit,
          raw: true
        });
        folderCount = await Folder.count({ where: baseQuery });
      }

      return {
        results: [...files, ...folders],
        totalCount: totalCount + folderCount,
        page,
        limit
      };
    } catch (error) {
      console.error('Search error:', error);
      throw new Error('Search operation failed');
    }
  },

  // Advanced search with filters
  advancedSearch: async (userId, criteria) => {
    const { query, type, mimeType, sizeRange, dateRange, tags } = criteria;

    let baseQuery = { owner: userId };

    if (query) {
      baseQuery.name = { [Op.like]: `%${query}%` };
    }

    if (mimeType) {
      baseQuery.mimeType = { [Op.like]: `%${mimeType}%` };
    }

    if (sizeRange && (sizeRange.min || sizeRange.max)) {
      baseQuery.size = {};
      if (sizeRange.min) baseQuery.size[Op.gte] = sizeRange.min;
      if (sizeRange.max) baseQuery.size[Op.lte] = sizeRange.max;
    }

    if (dateRange && (dateRange.start || dateRange.end)) {
      baseQuery.createdAt = {};
      if (dateRange.start) baseQuery.createdAt[Op.gte] = new Date(dateRange.start);
      if (dateRange.end) baseQuery.createdAt[Op.lte] = new Date(dateRange.end);
    }

    try {
      const results = await File.findAll({
        where: baseQuery,
        attributes: ['id', 'name', 'path', 'size', 'mimeType', 'createdAt', 'updatedAt'],
        order: [['createdAt', 'DESC']],
        raw: true
      });

      return results;
    } catch (error) {
      console.error('Advanced search error:', error);
      throw new Error('Advanced search operation failed');
    }
  },

  // Suggest completions for search queries
  suggestCompletions: async (userId, partialQuery, limit = 5) => {
    try {
      const files = await File.findAll({
        where: { owner: userId, name: { [Op.like]: `${partialQuery}%` } },
        attributes: ['name'],
        limit,
        raw: true
      });

      const folders = await Folder.findAll({
        where: { owner: userId, name: { [Op.like]: `${partialQuery}%` } },
        attributes: ['name'],
        limit,
        raw: true
      });

      const suggestions = [...files, ...folders]
        .map(item => item.name)
        .slice(0, limit);

      return suggestions;
    } catch (error) {
      console.error('Suggestion error:', error);
      throw new Error('Failed to get search suggestions');
    }
  },

  // Search within a specific folder
  searchInFolder: async (userId, folderId, query) => {
    try {
      const folder = await Folder.findOne({ where: { id: folderId, owner: userId } });
      if (!folder) {
        throw new Error('Folder not found');
      }

      const files = await File.findAll({
        where: {
          owner: userId,
          folder: folderId,
          name: { [Op.like]: `%${query}%` }
        },
        attributes: ['id', 'name', 'path', 'size', 'mimeType', 'createdAt', 'updatedAt'],
        raw: true
      });

      const folders = await Folder.findAll({
        where: {
          owner: userId,
          parent: folderId,
          name: { [Op.like]: `%${query}%` }
        },
        attributes: ['id', 'name', 'path', 'createdAt', 'updatedAt'],
        raw: true
      });

      return { files, folders };
    } catch (error) {
      console.error('Folder search error:', error);
      throw new Error('Search within folder failed');
    }
  }
};

module.exports = searchService;