// Task pages: create / edit / delete tasks, change status, subtasks, attachments.
// Wrapped in a function so it can't clash with auth.js or projects.js.
(function () {
  const meta = document.querySelector('meta[name="csrf-token"]');
  const pageBox = document.getElementById("page-message");

  function getToken() {
    return meta ? meta.getAttribute("content") : "";
  }

  // payload can be a plain object (sent as JSON) or FormData (sent as multipart, for files)
  async function request(method, url, payload) {
    const isForm = payload instanceof FormData;
    const headers = { "x-csrf-token": getToken() };
    if (payload && !isForm) headers["Content-Type"] = "application/json";

    const res = await fetch(url, {
      method,
      credentials: "same-origin",
      headers,
      body: payload ? (isForm ? payload : JSON.stringify(payload)) : undefined,
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

  // Create / edit task form (sent as FormData so files can be included)
  // <form data-task-form data-url="..." data-method="POST" data-redirect="/projects/1/tasks/{id}">
  document.querySelectorAll("form[data-task-form]").forEach((form) => {
    const box = form.querySelector(".message");
    const button = form.querySelector("button[type=submit]");

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const label = button.textContent;
      button.disabled = true;
      button.textContent = "Please wait...";

      try {
        const result = await request(form.dataset.method, form.dataset.url, new FormData(form));
        if (result.ok) {
          const id = result.body.task ? result.body.task.id : "";
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

  // Status dropdown on the task page
  document.querySelectorAll("select[data-task-status]").forEach((select) => {
    select.addEventListener("change", async () => {
      const result = await request("PUT", select.dataset.url, { status: select.value });
      if (result.ok) {
        window.location.reload();
      } else {
        show(pageBox, errorText(result), "error");
        select.value = select.dataset.current;
      }
    });
  });

  // Delete task
  document.querySelectorAll("[data-delete-task]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!window.confirm('Delete "' + button.dataset.name + '"? Its subtasks and files will be removed too.')) return;

      const result = await request("DELETE", button.dataset.url);
      if (result.ok) {
        window.location.href = button.dataset.redirect;
      } else {
        show(pageBox, errorText(result), "error");
      }
    });
  });

  // Add subtask
  document.querySelectorAll("form[data-add-subtask]").forEach((form) => {
    const box = form.querySelector(".message");

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      const result = await request("POST", form.dataset.url, data);

      if (result.ok) {
        window.location.reload();
      } else {
        show(box, errorText(result), "error", result.body.errors);
      }
    });
  });

  // Tick / untick a subtask
  document.querySelectorAll("input[data-subtask-toggle]").forEach((box) => {
    box.addEventListener("change", async () => {
      const result = await request("PUT", box.dataset.url, { isCompleted: box.checked });
      if (result.ok) {
        window.location.reload();
      } else {
        box.checked = !box.checked;
        show(pageBox, errorText(result), "error");
      }
    });
  });

  // Delete subtask / attachment (same behaviour, different wording)
  function bindDelete(selector, question) {
    document.querySelectorAll(selector).forEach((button) => {
      button.addEventListener("click", async () => {
        if (!window.confirm(question)) return;

        const result = await request("DELETE", button.dataset.url);
        if (result.ok) {
          window.location.reload();
        } else {
          show(pageBox, errorText(result), "error");
        }
      });
    });
  }

  bindDelete("[data-delete-subtask]", "Delete this subtask?");
  bindDelete("[data-delete-attachment]", "Delete this file?");
})();
