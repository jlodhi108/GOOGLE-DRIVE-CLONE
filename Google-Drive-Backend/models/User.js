const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

class User extends Model {
  async matchPassword(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
  }
  getResetPasswordToken() { return 'token'; }
  generateOtp() {
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    this.otp = otp;
    this.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    return otp;
  }
  matchOtp(submittedOtp) {
    return !!this.otp && this.otp === submittedOtp && this.otpExpires && this.otpExpires > new Date();
  }
  hasEnoughStorage(fileSize) {
    return (this.storageUsed + fileSize) <= this.storageLimit;
  }
  async updateStorageUsed(size) {
    this.storageUsed += size;
    await this.save();
  }
}

User.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING(50), allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM('user', 'admin'), defaultValue: 'user' },
  googleId: { type: DataTypes.STRING, unique: true, allowNull: true },
  avatar: { type: DataTypes.STRING, defaultValue: 'default-avatar.png' },
  storageUsed: { type: DataTypes.FLOAT, defaultValue: 0 },
  storageLimit: { type: DataTypes.FLOAT, defaultValue: 5 * 1024 * 1024 * 1024 },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  isVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
  otp: { type: DataTypes.STRING },
  otpExpires: { type: DataTypes.DATE },
  lastLogin: { type: DataTypes.DATE },
  resetPasswordToken: { type: DataTypes.STRING },
  resetPasswordExpire: { type: DataTypes.DATE },
  tokens: {
    type: DataTypes.JSON,
    defaultValue: [],
    get() {
      const val = this.getDataValue('tokens');
      if (typeof val === 'string') {
        try { return JSON.parse(val); } catch (e) { return []; }
      }
      return val || [];
    }
  },
  refreshTokens: {
    type: DataTypes.JSON,
    defaultValue: [],
    get() {
      const val = this.getDataValue('refreshTokens');
      if (typeof val === 'string') {
        try { return JSON.parse(val); } catch (e) { return []; }
      }
      return val || [];
    }
  }
}, {
  sequelize,
  modelName: 'User',
  hooks: {
    beforeSave: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  },
  defaultScope: {
    attributes: { exclude: ['password', 'otp', 'otpExpires', 'resetPasswordToken', 'resetPasswordExpire'] }
  },
  scopes: {
    withPassword: { attributes: {} }
  }
});

module.exports = User;
