const { DataTypes, Model } = require('sequelize');
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
