const projectService = require("../services/project.service");

// Express 5 forwards thrown errors (including HttpError) to errorHandler.

async function getProjects(req, res) {
  const projects = await projectService.listProjectsForUser(req.session.userId);
  return res.status(200).json({ success: true, projects });
}

async function getProject(req, res) {
  const project = await projectService.getProject(req.projectId);
  return res
    .status(200)
    .json({ success: true, project, role: req.projectMember.role });
}

async function createProject(req, res) {
  const project = await projectService.createProject(
    req.session.userId,
    req.body,
  );
  return res.status(201).json({
    success: true,
    message: "Project created successfully",
    project,
  });
}

async function updateProject(req, res) {
  const project = await projectService.updateProject(req.projectId, req.body);
  return res.status(200).json({
    success: true,
    message: "Project updated successfully",
    project,
  });
}

async function deleteProject(req, res) {
  await projectService.deleteProject(req.projectId);
  return res
    .status(200)
    .json({ success: true, message: "Project deleted successfully" });
}

async function getMembers(req, res) {
  const members = await projectService.listMembers(req.projectId);
  return res.status(200).json({ success: true, members });
}

async function addMember(req, res) {
  const member = await projectService.addMember(
    req.projectId,
    req.body.email,
    req.body.role,
  );
  return res.status(201).json({
    success: true,
    message: "Member added successfully",
    member,
  });
}

async function updateMemberRole(req, res) {
  const member = await projectService.changeMemberRole(
    req.projectId,
    req.targetUserId,
    req.body.role,
  );
  return res.status(200).json({
    success: true,
    message: "Member role updated successfully",
    member,
  });
}

async function removeMember(req, res) {
  await projectService.removeMember(req.projectId, req.targetUserId);
  return res
    .status(200)
    .json({ success: true, message: "Member removed successfully" });
}

module.exports = {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  getMembers,
  addMember,
  updateMemberRole,
  removeMember,
};
