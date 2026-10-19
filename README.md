project-camp/
├── src/
│   ├── app.js
│   ├── server.js
│   ├── config/
│   │   ├── database.js
│   │   └── mail.js
│   ├── models/
│   │   ├── index.js
│   │   ├── user.model.js
│   │   ├── project.model.js
│   │   ├── project-member.model.js
│   │   ├── task.model.js
│   │   ├── subtask.model.js
│   │   ├── note.model.js
│   │   ├── email-verification-token.model.js
│   │   └── password-reset-token.model.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── project.routes.js
│   │   ├── task.routes.js
│   │   ├── note.routes.js
│   │   └── healthcheck.routes.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── project.controller.js
│   │   ├── task.controller.js
│   │   └── note.controller.js
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── email.service.js
│   │   ├── project.service.js
│   │   ├── task.service.js
│   │   └── note.service.js
│   ├── middlewares/
│   │   ├── auth.middleware.js
│   │   ├── role.middleware.js
│   │   ├── validator.middleware.js
│   │   ├── upload.middleware.js
│   │   └── error.middleware.js
│   ├── validators/
│   ├── utils/
│   └── views/
│       ├── layouts/
│       ├── partials/
│       ├── auth/
│       ├── dashboard/
│       ├── projects/
│       ├── tasks/
│       ├── notes/
│       └── errors/
├── public/
│   ├── css/
│   ├── js/
│   └── images/
├── tests/
├── migrations/
├── .env
├── .env.example
├── .gitignore
└── package.json