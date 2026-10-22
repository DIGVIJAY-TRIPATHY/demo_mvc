const { DataTypes } = require("sequelize");
const { sequelize } = require("../db/sequelize");

const SENSITIVE_ATTRIBUTES = [
  "passwordHash",
  "emailVerificationTokenHash",
  "emailVerificationExpiresAt",
  "passwordResetTokenHash",
  "passwordResetExpiresAt",
];

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: { isEmail: true },
      set(value) {
        this.setDataValue(
          "email",
          typeof value === "string" ? value.trim().toLowerCase() : value,
        );
      },
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "password_hash",
    },
    emailVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: "email_verified",
    },
    emailVerificationTokenHash: {
      type: DataTypes.STRING(64),
      allowNull: true,
      field: "email_verification_token_hash",
    },
    emailVerificationExpiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "email_verification_expires_at",
    },
    passwordResetTokenHash: {
      type: DataTypes.STRING(64),
      allowNull: true,
      field: "password_reset_token_hash",
    },
    passwordResetExpiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "password_reset_expires_at",
    },
  },
  {
    tableName: "users",
    timestamps: true,
    underscored: true,
    // Unique index declared here (not `unique: true` on the column) and the
    // table is managed by migrations, so no duplicate constraints get created.
    indexes: [{ unique: true, fields: ["email"] }],
    defaultScope: {
      attributes: { exclude: SENSITIVE_ATTRIBUTES },
    },
  },
);

module.exports = { User };
