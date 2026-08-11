// activityController.js

const { Activity, User } = require('../models');
const { Op, fn, col } = require('sequelize');

// Log an activity
exports.logActivity = async (req, res) => {
  try {
    const { action, targetId, targetType } = req.body;

    if (!action || !targetId || !targetType) {
      return res.status(400).json({ message: 'Action, targetId, and targetType are required' });
    }

    const activity = await Activity.create({
      user: req.user.id,
      action,
      target: targetId,
      targetModel: targetType
    });

    res.status(201).json({ message: 'Activity logged successfully', activity });
  } catch (error) {
    res.status(500).json({ message: 'Error logging activity', error: error.message });
  }
};

// Get user's activities
exports.getUserActivities = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const activities = await Activity.findAll({
      where: { user: req.user.id },
      order: [['createdAt', 'DESC']],
      offset: skip,
      limit
    });

    const totalActivities = await Activity.count({ where: { user: req.user.id } });

    res.json({
      activities,
      currentPage: page,
      totalPages: Math.ceil(totalActivities / limit),
      totalActivities
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching activities', error: error.message });
  }
};

// Get activity details
exports.getActivityDetails = async (req, res) => {
  try {
    const activity = await Activity.findByPk(req.params.id, {
      include: [{ model: User, attributes: ['name', 'email'] }]
    });

    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    if (activity.user !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to view this activity' });
    }

    res.json(activity);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching activity details', error: error.message });
  }
};

// Delete an activity
exports.deleteActivity = async (req, res) => {
  try {
    const activity = await Activity.findByPk(req.params.id);

    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    if (activity.user !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this activity' });
    }

    await Activity.destroy({ where: { id: req.params.id } });

    res.json({ message: 'Activity deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting activity', error: error.message });
  }
};

// Get activities for admin (assuming admin role exists)
exports.getAdminActivities = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const userId = req.query.userId;
    const skip = (page - 1) * limit;

    let query = {};
    if (userId) {
      query.user = userId;
    }

    const activities = await Activity.findAll({
      where: query,
      order: [['createdAt', 'DESC']],
      offset: skip,
      limit,
      include: [{ model: User, attributes: ['name', 'email'] }]
    });

    const totalActivities = await Activity.count({ where: query });

    res.json({
      activities,
      currentPage: page,
      totalPages: Math.ceil(totalActivities / limit),
      totalActivities
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching admin activities', error: error.message });
  }
};

// Get activity statistics for admin, optionally scoped to a specific user
exports.getAdminActivityStatistics = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const startDate = new Date(req.query.startDate);
    const endDate = new Date(req.query.endDate);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date range' });
    }

    const match = {
      createdAt: { [Op.between]: [startDate, endDate] }
    };
    if (req.query.userId) {
      match.user = req.query.userId;
    }

    const stats = await Activity.findAll({
      where: match,
      attributes: [
        ['action', 'id'],
        [fn('COUNT', col('action')), 'count']
      ],
      group: ['action'],
      raw: true
    });

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching admin activity statistics', error: error.message });
  }
};

// Get the most recent activities for the current user
exports.getRecentActivities = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const activities = await Activity.findAll({
      where: { user: req.user.id },
      order: [['createdAt', 'DESC']],
      limit
    });
    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching recent activities', error: error.message });
  }
};

// Get activities recorded against a specific file/folder resource
exports.getResourceActivities = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = { user: req.user.id, target: req.params.resourceId };

    const activities = await Activity.findAll({
      where: query,
      order: [['createdAt', 'DESC']],
      offset: skip,
      limit
    });

    const totalActivities = await Activity.count({ where: query });

    res.json({
      activities,
      currentPage: page,
      totalPages: Math.ceil(totalActivities / limit),
      totalActivities
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching resource activities', error: error.message });
  }
};

// Get activities filtered by action type
exports.getActivitiesByType = async (req, res) => {
  try {
    const { activityType } = req.params;
    const allowedActions = ['upload', 'download', 'delete', 'share', 'unshare', 'create_folder', 'delete_folder', 'rename', 'trash', 'restore', 'star', 'unstar'];

    if (!allowedActions.includes(activityType)) {
      return res.status(400).json({ message: `Invalid activity type. Must be one of: ${allowedActions.join(', ')}` });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = { user: req.user.id, action: activityType };

    const activities = await Activity.findAll({
      where: query,
      order: [['createdAt', 'DESC']],
      offset: skip,
      limit
    });

    const totalActivities = await Activity.count({ where: query });

    res.json({
      activities,
      currentPage: page,
      totalPages: Math.ceil(totalActivities / limit),
      totalActivities
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching activities by type', error: error.message });
  }
};

// Export the current user's activities as CSV
exports.exportActivities = async (req, res) => {
  try {
    const query = { user: req.user.id };

    if (req.query.startDate || req.query.endDate) {
      query.createdAt = {};
      if (req.query.startDate && req.query.endDate) {
        query.createdAt = { [Op.between]: [new Date(req.query.startDate), new Date(req.query.endDate)] };
      } else if (req.query.startDate) {
        query.createdAt[Op.gte] = new Date(req.query.startDate);
      } else if (req.query.endDate) {
        query.createdAt[Op.lte] = new Date(req.query.endDate);
      }
    }

    const activities = await Activity.findAll({
      where: query,
      order: [['createdAt', 'DESC']],
      raw: true
    });

    const header = 'id,action,targetModel,target,status,createdAt\n';
    const rows = activities.map(a => [
      a.id,
      a.action,
      a.targetModel,
      a.target,
      a.status,
      new Date(a.createdAt).toISOString()
    ].join(',')).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="activities.csv"');
    res.send(header + rows);
  } catch (error) {
    res.status(500).json({ message: 'Error exporting activities', error: error.message });
  }
};

// Mark an activity as read
exports.markActivityAsRead = async (req, res) => {
  try {
    const activity = await Activity.findByPk(req.params.id);

    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    if (activity.user !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this activity' });
    }

    activity.isRead = true;
    await activity.save();

    res.json({ message: 'Activity marked as read', activity });
  } catch (error) {
    res.status(500).json({ message: 'Error marking activity as read', error: error.message });
  }
};

// Get count of unread activities for the current user
exports.getUnreadActivityCount = async (req, res) => {
  try {
    const count = await Activity.count({ where: { user: req.user.id, isRead: false } });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching unread activity count', error: error.message });
  }
};

// Get activity statistics
exports.getActivityStatistics = async (req, res) => {
  try {
    const startDate = new Date(req.query.startDate);
    const endDate = new Date(req.query.endDate);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date range' });
    }

    const stats = await Activity.findAll({
      where: {
        user: req.user.id,
        createdAt: { [Op.between]: [startDate, endDate] }
      },
      attributes: [
        ['action', 'id'],
        [fn('COUNT', col('action')), 'count']
      ],
      group: ['action'],
      raw: true
    });

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching activity statistics', error: error.message });
  }
};