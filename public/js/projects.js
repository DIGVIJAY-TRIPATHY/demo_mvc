// Project pages: create / edit / delete a project, add / change / remove members.
// Everything is wrapped in a function so it can't clash with auth.js.
(function () {
  const meta = document.querySelector('meta[name="csrf-token"]');
  const pageBox = document.getElementById("page-message");

  function getToken() {
    return meta ? meta.getAttribute("content") : "";
  }

  async function request(method, url, data) {
    const res = await fetch(url, {
      method,
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": getToken(),
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    let body = {};
    try {
      body = await res.json();
    } catch (e) {
      // response was not JSON
    }
    return { ok: res.ok, status: res.status, body };
  }

  function show(box, text, type, list) {
    if (!box) return;
    box.className = "message " + type;
    box.textContent = "";

    const p = document.createElement("p");
    p.textContent = text;
    box.appendChild(p);

    if (list && list.length) {
      const ul = document.createElement("ul");
      list.forEach((item) => {
        const li = document.createElement("li");
        li.textContent = item.message;
        ul.appendChild(li);
      });
      box.appendChild(ul);
    }
  }

  function errorText(result) {
    if (result.status === 403 && /csrf/i.test(result.body.message || "")) {
      return "Your session expired. Reload the page and try again.";
    }
    return result.body.message || "Something went wrong. Please try again.";
  }

  // Create / edit project form
  // <form data-project-form data-url="/api/projects" data-method="POST" data-redirect="/projects/{id}">
  document.querySelectorAll("form[data-project-form]").forEach((form) => {
    const box = form.querySelector(".message");
    const button = form.querySelector("button[type=submit]");

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      const label = button.textContent;
      button.disabled = true;
      button.textContent = "Please wait...";

      try {
        const result = await request(
          form.dataset.method,
          form.dataset.url,
          data,
        );
        if (result.ok) {
          const id = result.body.project ? result.body.project.id : "";
          window.location.href = form.dataset.redirect.replace("{id}", id);
        } else {
          show(box, errorText(result), "error", result.body.errors);
        }
      } catch (e) {
        show(box, "Could not reach the server.", "error");
      } finally {
        button.disabled = false;
        button.textContent = label;
      }
    });
  });

  // Delete project
  document.querySelectorAll("[data-delete-project]").forEach((button) => {
    button.addEventListener("click", async () => {
      const ok = window.confirm(
        'Delete "' +
          button.dataset.name +
          '"? Its members will be removed too. This cannot be undone.',
      );
      if (!ok) return;

      const result = await request(
        "DELETE",
        "/api/projects/" + button.dataset.id,
      );
      if (result.ok) {
        window.location.href = "/projects";
      } else {
        show(pageBox, errorText(result), "error");
      }
    });
  });

  // Add member
  document.querySelectorAll("form[data-add-member]").forEach((form) => {
    const box = form.querySelector(".message");
    const button = form.querySelector("button[type=submit]");

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      button.disabled = true;

      try {
        const result = await request(
          "POST",
          "/api/projects/" + form.dataset.projectId + "/members",
          data,
        );
        if (result.ok) {
          window.location.reload();
        } else {
          show(box, errorText(result), "error", result.body.errors);
        }
      } catch (e) {
        show(box, "Could not reach the server.", "error");
      } finally {
        button.disabled = false;
      }
    });
  });

  // Change a member's role
  document.querySelectorAll("select[data-member-role]").forEach((select) => {
    select.addEventListener("change", async () => {
      const url =
        "/api/projects/" +
        select.dataset.projectId +
        "/members/" +
        select.dataset.userId;
      const result = await request("PUT", url, { role: select.value });

      if (result.ok) {
        window.location.reload();
      } else {
        show(pageBox, errorText(result), "error");
        select.value = select.dataset.current; // put the old role back
      }
    });
  });

  // Remove a member
  document.querySelectorAll("[data-remove-member]").forEach((button) => {
    button.addEventListener("click", async () => {
      const self = button.dataset.self === "true";
      const ok = window.confirm(
        self
          ? "Leave this project?"
          : "Remove " + button.dataset.name + " from this project?",
      );
      if (!ok) return;

      const url =
        "/api/projects/" +
        button.dataset.projectId +
        "/members/" +
        button.dataset.userId;
      const result = await request("DELETE", url);

      if (result.ok) {
        window.location.href = self ? "/projects" : window.location.pathname;
      } else {
        show(pageBox, errorText(result), "error");
      }
    });
  });
})();
