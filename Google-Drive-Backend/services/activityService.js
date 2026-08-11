// services/activityService.js

const { Activity, User } = require('../models');
const { Op, fn, col } = require('sequelize');

const activityService = {
  // Log a new activity
  createActivity: async (userId, action, targetId, targetModel, details = {}) => {
    try {
      const activity = await Activity.create({
        user: userId,
        action,
        target: targetId,
        targetModel,
        details
      });
      return activity;
    } catch (error) {
      console.error('Activity logging error:', error);
      throw new Error('Failed to log activity');
    }
  },

  // Get user activities with pagination
  getUserActivities: async (userId, options = {}) => {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = options;
    const skip = (page - 1) * limit;

    try {
      const activities = await Activity.findAll({
        where: { user: userId },
        order: [[sortBy, sortOrder === 'desc' ? 'DESC' : 'ASC']],
        offset: skip,
        limit,
        raw: true
      });

      const totalCount = await Activity.count({ where: { user: userId } });

      return {
        activities,
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount
      };
    } catch (error) {
      console.error('Get user activities error:', error);
      throw new Error('Failed to retrieve user activities');
    }
  },

  // Get activity details
  getActivityDetails: async (activityId, userId) => {
    try {
      const activity = await Activity.findOne({
        where: { id: activityId, user: userId },
        include: [{ model: User, attributes: ['name', 'email'] }],
        raw: true
      });

      if (!activity) {
        throw new Error('Activity not found');
      }

      return activity;
    } catch (error) {
      console.error('Get activity details error:', error);
      throw new Error('Failed to retrieve activity details');
    }
  },

  // Delete an activity
  deleteActivity: async (activityId, userId) => {
    try {
      const deletedCount = await Activity.destroy({ where: { id: activityId, user: userId } });
      if (deletedCount === 0) {
        throw new Error('Activity not found or user not authorized');
      }
    } catch (error) {
      console.error('Delete activity error:', error);
      throw new Error('Failed to delete activity');
    }
  },

  // Get activity statistics
  getActivityStatistics: async (userId, startDate, endDate) => {
    try {
      const stats = await Activity.findAll({
        where: {
          user: userId,
          createdAt: { [Op.between]: [new Date(startDate), new Date(endDate)] }
        },
        attributes: [
          ['action', 'id'],
          [fn('COUNT', col('action')), 'count']
        ],
        group: ['action'],
        raw: true
      });

      return stats;
    } catch (error) {
      console.error('Get activity statistics error:', error);
      throw new Error('Failed to retrieve activity statistics');
    }
  },

  // Get admin activities
  getAdminActivities: async (options = {}) => {
    const { page = 1, limit = 20, userId, action } = options;
    const skip = (page - 1) * limit;

    let query = {};
    if (userId) query.user = userId;
    if (action) query.action = action;

    try {
      const activities = await Activity.findAll({
        where: query,
        order: [['createdAt', 'DESC']],
        offset: skip,
        limit,
        include: [{ model: User, attributes: ['name', 'email'] }],
        raw: true
      });

      const totalCount = await Activity.count({ where: query });

      return {
        activities,
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount
      };
    } catch (error) {
      console.error('Get admin activities error:', error);
      throw new Error('Failed to retrieve admin activities');
    }
  },

  // Get recent activities
  getRecentActivities: async (userId, limit = 10) => {
    try {
      const activities = await Activity.findAll({
        where: { user: userId },
        order: [['createdAt', 'DESC']],
        limit,
        raw: true
      });

      return activities;
    } catch (error) {
      console.error('Get recent activities error:', error);
      throw new Error('Failed to retrieve recent activities');
    }
  },

  // Get activities for a specific resource
  getResourceActivities: async (resourceId, options = {}) => {
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    try {
      const activities = await Activity.findAll({
        where: { target: resourceId },
        order: [['createdAt', 'DESC']],
        offset: skip,
        limit,
        include: [{ model: User, attributes: ['name', 'email'] }],
        raw: true
      });

      const totalCount = await Activity.count({ where: { target: resourceId } });

      return {
        activities,
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount
      };
    } catch (error) {
      console.error('Get resource activities error:', error);
      throw new Error('Failed to retrieve resource activities');
    }
  },

  // Export activities
  exportActivities: async (userId, startDate, endDate, format = 'csv') => {
    try {
      const activities = await Activity.findAll({
        where: {
          user: userId,
          createdAt: { [Op.between]: [new Date(startDate), new Date(endDate)] }
        },
        order: [['createdAt', 'DESC']],
        raw: true
      });

      if (format === 'csv') {
        return convertToCSV(activities);
      } else if (format === 'json') {
        return JSON.stringify(activities);
      } else {
        throw new Error('Unsupported export format');
      }
    } catch (error) {
      console.error('Export activities error:', error);
      throw new Error('Failed to export activities');
    }
  }
};

// Helper function to convert activities to CSV format
function convertToCSV(activities) {
  const header = 'Date,Action,Target\n';
  const rows = activities.map(a => 
    `${a.createdAt},${a.action},${a.targetModel}:${a.target}\n`
  ).join('');
  return header + rows;
}

module.exports = activityService;