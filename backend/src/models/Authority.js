const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Authority = sequelize.define('Authority', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    fullName: { type: DataTypes.STRING },
    department: { type: DataTypes.STRING },
    ward: { type: DataTypes.STRING },
    isVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
  }, {
    tableName: 'authorities',
    underscored: true,
  });

  Authority.associate = (models) => {
    Authority.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
  };

  return Authority;
};
