const UserRolesEnum = Object.freeze({
  ADMIN: "admin",
  PROJECT_ADMIN: "project_admin",
  MEMBER: "member",
});

const AvailableUserRole = Object.values(UserRolesEnum);

// Roles that can create / edit / delete tasks
const ManagerRoles = Object.freeze([UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN]);

const RoleLabels = Object.freeze({
  admin: "Admin",
  project_admin: "Project admin",
  member: "Member",
});

const TaskStatusEnum = Object.freeze({
  TODO: "todo",
  IN_PROGRESS: "in_progress",
  DONE: "done",
});

const AvailableTaskStatuses = Object.values(TaskStatusEnum);

const TaskStatusLabels = Object.freeze({
  todo: "To do",
  in_progress: "In progress",
  done: "Done",
});

module.exports = {
  UserRolesEnum,
  AvailableUserRole,
  ManagerRoles,
  RoleLabels,
  TaskStatusEnum,
  AvailableTaskStatuses,
  TaskStatusLabels,
};
