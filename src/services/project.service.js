const { fn, col } = require("sequelize");
const { sequelize, User, Project, ProjectMember } = require("../models");
const { UserRolesEnum } = require("../utils/constants");
const { HttpError } = require("../utils/http-error");

function rethrowDuplicate(error) {
  if (error.name === "SequelizeUniqueConstraintError") {
    throw new HttpError(409, "You already have a project with this name");
  }
  throw error;
}

function toProjectJson(project) {
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    createdBy: project.createdBy,
    creator: project.creator
      ? { id: project.creator.id, name: project.creator.name }
      : undefined,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
}

function toMemberJson(member) {
  return {
    userId: member.userId,
    role: member.role,
    joinedAt: member.createdAt,
    user: member.user
      ? { id: member.user.id, name: member.user.name, email: member.user.email }
      : undefined,
  };
}

// All projects the user belongs to, with their role and member count
async function listProjectsForUser(userId) {
  const memberships = await ProjectMember.findAll({
    where: { userId },
    include: [{ model: Project, as: "project" }],
    order: [[{ model: Project, as: "project" }, "createdAt", "DESC"]],
  });

  const projectIds = memberships.map((m) => m.projectId);
  const counts = {};

  if (projectIds.length > 0) {
    const rows = await ProjectMember.findAll({
      attributes: [
        ["project_id", "projectId"],
        [fn("COUNT", col("id")), "count"],
      ],
      where: { projectId: projectIds },
      group: ["project_id"],
      raw: true,
    });
    rows.forEach((row) => {
      counts[row.projectId] = Number(row.count);
    });
  }

  return memberships.map((m) => ({
    id: m.project.id,
    name: m.project.name,
    description: m.project.description,
    role: m.role,
    memberCount: counts[m.projectId] || 1,
    createdAt: m.project.createdAt,
  }));
}

async function getProject(projectId) {
  const project = await Project.findByPk(projectId, {
    include: [{ model: User, as: "creator", attributes: ["id", "name"] }],
  });
  if (!project) throw new HttpError(404, "Project not found");
  return toProjectJson(project);
}

// Creates the project and makes the creator its admin, in one transaction
async function createProject(userId, { name, description }) {
  try {
    const project = await sequelize.transaction(async (transaction) => {
      const created = await Project.create(
        { name, description: description || null, createdBy: userId },
        { transaction },
      );
      await ProjectMember.create(
        { projectId: created.id, userId, role: UserRolesEnum.ADMIN },
        { transaction },
      );
      return created;
    });
    return toProjectJson(project);
  } catch (error) {
    return rethrowDuplicate(error);
  }
}

async function updateProject(projectId, { name, description }) {
  const project = await Project.findByPk(projectId);
  if (!project) throw new HttpError(404, "Project not found");

  try {
    project.name = name;
    project.description = description || null;
    await project.save();
  } catch (error) {
    rethrowDuplicate(error);
  }
  return toProjectJson(project);
}

async function deleteProject(projectId) {
  const project = await Project.findByPk(projectId);
  if (!project) throw new HttpError(404, "Project not found");
  // project_members rows are removed by the database (ON DELETE CASCADE)
  await project.destroy();
}

async function listMembers(projectId) {
  const members = await ProjectMember.findAll({
    where: { projectId },
    include: [{ model: User, as: "user", attributes: ["id", "name", "email"] }],
    order: [["createdAt", "ASC"]],
  });
  return members.map(toMemberJson);
}

async function addMember(projectId, email, role) {
  const user = await User.findOne({
    where: { email: email.trim().toLowerCase() },
  });
  if (!user) {
    throw new HttpError(404, "No registered user with that email");
  }

  const existing = await ProjectMember.findOne({
    where: { projectId, userId: user.id },
  });
  if (existing) {
    throw new HttpError(409, "That user is already a member of this project");
  }

  const member = await ProjectMember.create({
    projectId,
    userId: user.id,
    role,
  });
  member.user = user;
  return toMemberJson(member);
}

// A project must always keep at least one admin
async function assertNotLastAdmin(projectId, membership) {
  if (membership.role !== UserRolesEnum.ADMIN) return;

  const admins = await ProjectMember.count({
    where: { projectId, role: UserRolesEnum.ADMIN },
  });
  if (admins <= 1) {
    throw new HttpError(400, "A project must have at least one admin");
  }
}

async function findMembership(projectId, userId) {
  const membership = await ProjectMember.findOne({
    where: { projectId, userId },
  });
  if (!membership) throw new HttpError(404, "Member not found in this project");
  return membership;
}

async function changeMemberRole(projectId, userId, role) {
  const membership = await findMembership(projectId, userId);

  if (role !== UserRolesEnum.ADMIN) {
    await assertNotLastAdmin(projectId, membership);
  }

  membership.role = role;
  await membership.save();
  return { userId, role };
}

async function removeMember(projectId, userId) {
  const membership = await findMembership(projectId, userId);
  await assertNotLastAdmin(projectId, membership);
  await membership.destroy();
}

module.exports = {
  listProjectsForUser,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  listMembers,
  addMember,
  changeMemberRole,
  removeMember,
};
