"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("project_members", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      project_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "projects", key: "id" },
        onDelete: "CASCADE",
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
      },
      role: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: "member",
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex(
      "project_members",
      ["project_id", "user_id"],
      {
        unique: true,
        name: "project_members_project_user_unique",
      },
    );
    await queryInterface.addIndex("project_members", ["user_id"], {
      name: "project_members_user_id_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("project_members");
  },
};
