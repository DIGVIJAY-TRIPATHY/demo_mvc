projectcamp2/
├── .env                              (yours, never commit)
├── .env.example
├── .gitignore
├── .sequelizerc
├── package.json                      (run: npm install multer)
├── package-lock.json
├── Readme.md                         (out of date)
├── test-db.js
│
├── migrations/
│   ├── 20260101000000-create-users.js
│   ├── 20260102000000-create-projects.js
│   ├── 20260102000001-create-project-members.js
│   └── 20260103000000-create-tasks.js            [NEW]  (tasks, subtasks, task_attachments)
│
├── public/
│   ├── css/
│   │   └── style.css                 [CHANGED]
│   └── js/
│       ├── auth.js
│       ├── projects.js
│       └── tasks.js                  [NEW]
│
├── storage/
│   └── uploads/                      (task attachments, not publicly served)
│       └── .gitkeep
│
├── tests/
│   └── test.mail.js
│
└── src/
    ├── app.js                        [CHANGED]
    ├── server.js
    │
    ├── config/
    │   ├── env.js
    │   ├── mail.js
    │   ├── session.js
    │   └── sequelize-cli.js
    │
    ├── db/
    │   └── sequelize.js
    │
    ├── models/
    │   ├── index.js                  [CHANGED]  (all relations)
    │   ├── user.model.js
    │   ├── project.model.js
    │   ├── project-member.model.js
    │   ├── task.model.js             [NEW]
    │   ├── subtask.model.js          [NEW]
    │   └── task-attachment.model.js  [NEW]
    │
    ├── routes/
    │   ├── auth.routes.js            (API: /api/auth)
    │   ├── project.routes.js         (API: /api/projects)
    │   ├── task.routes.js            [NEW]  (API: /api/projects/:projectId/tasks)
    │   ├── pages.routes.js           (login, register, dashboard...)
    │   ├── project.pages.routes.js   (/projects)
    │   └── task.pages.routes.js      [NEW]  (/projects/:projectId/tasks)
    │
    ├── controllers/
    │   ├── auth.controller.js
    │   ├── project.controller.js
    │   └── task.controller.js        [NEW]
    │
    ├── services/
    │   ├── email.service.js
    │   ├── project.service.js
    │   └── task.service.js           [NEW]
    │
    ├── middlewares/
    │   ├── auth.middleware.js
    │   ├── csrf.middleware.js
    │   ├── error.middleware.js
    │   ├── rate-limit.middleware.js
    │   ├── project.middleware.js     [CHANGED]
    │   └── upload.middleware.js      [NEW]  (multer)
    │
    ├── validators/
    │   ├── auth.validator.js
    │   ├── project.validator.js
    │   └── task.validator.js         [NEW]
    │
    ├── utils/
    │   ├── token.js
    │   ├── session.util.js
    │   ├── http-error.js
    │   ├── constants.js              [CHANGED]
    │   └── upload.util.js            [NEW]
    │
    └── views/
        ├── partials/
        │   ├── header.ejs
        │   └── footer.ejs
        ├── auth/
        │   ├── login.ejs
        │   ├── register.ejs
        │   ├── forgot-password.ejs
        │   ├── reset-password.ejs
        │   ├── resend-verification.ejs
        │   ├── verify-email.ejs
        │   └── change-password.ejs
        ├── dashboard/
        │   └── index.ejs
        ├── projects/
        │   ├── index.ejs
        │   ├── new.ejs
        │   ├── show.ejs              [CHANGED]
        │   └── edit.ejs
        ├── tasks/                    [NEW]
        │   ├── index.ejs
        │   ├── new.ejs
        │   ├── show.ejs
        │   └── edit.ejs
        └── errors/
            ├── 404.ejs
            └── error.ejs