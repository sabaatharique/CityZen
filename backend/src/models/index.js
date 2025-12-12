const sequelize = require('../config/database');
const fs = require('fs');
const path = require('path');

const db = {};

// Load models in the folder
fs.readdirSync(__dirname)
  .filter((file) => file !== 'index.js' && file.endsWith('.js'))
  .forEach((file) => {
    const modelDef = require(path.join(__dirname, file));
    const model = modelDef(sequelize);
    db[model.name] = model;
  });

// Run associations if defined
Object.keys(db).forEach((modelName) => {
  if (typeof db[modelName].associate === 'function') {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = require('sequelize');

module.exports = db;
