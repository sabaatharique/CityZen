const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Citizen = sequelize.define('Citizen', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    fullName: { type: DataTypes.STRING },
    ward: { type: DataTypes.STRING },
    isAnonymous: { type: DataTypes.BOOLEAN, defaultValue: true },
  }, {
    tableName: 'citizens',
    underscored: true,
  });

  Citizen.associate = (models) => {
    Citizen.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
  };

  return Citizen;
};
