"use strict";

module.exports = function(sequelize, DataTypes) {
  var Client = sequelize.define('Client', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    secret: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    software_id: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    software_version: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    ip: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIP: true
      }
    },
    registration_type: {
      type: DataTypes.ENUM,
      allowNull: false,
      values: ['dynamic', 'static'],
      defaultValue: 'dynamic',
      validate: {
        notEmpty: true
      }
    },
    redirect_uri: { //TODO: Move to its own table
      type: DataTypes.STRING
    }
  }, {
    underscored: true,

    associate: function(models) {
      Client.hasMany(models.PairingCode);
      Client.hasMany(models.AccessToken);
      Client.belongsTo(models.User);
    }
  });

  return Client;
};
