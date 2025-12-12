const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('citizen', 'authority', 'admin'),
      allowNull: false,
      defaultValue: 'citizen',
    },
    fullName: { type: DataTypes.STRING },
    firebaseUid: { type: DataTypes.STRING },
  }, {
    tableName: 'users',
    underscored: true,
  });

  return User;
};
