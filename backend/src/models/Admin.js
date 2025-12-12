const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Admin = sequelize.define('Admin', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    fullName: { type: DataTypes.STRING },
  }, {
    tableName: 'admins',
    underscored: true,
  });

  Admin.associate = (models) => {
    Admin.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
  };

  return Admin;
};
