// Sends the auth forms to the JSON API and shows the result on the page.
const csrfMeta = document.querySelector('meta[name="csrf-token"]');

function getToken() {
  return csrfMeta ? csrfMeta.getAttribute("content") : "";
}

function setToken(value) {
  if (csrfMeta && value) csrfMeta.setAttribute("content", value);
}

function showMessage(box, text, type, list) {
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

async function postJson(url, data) {
  const res = await fetch(url, {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      "x-csrf-token": getToken(),
    },
    body: JSON.stringify(data || {}),
  });

  let body = {};
  try {
    body = await res.json();
  } catch (e) {
    // response was not JSON
  }

  if (body.csrfToken) setToken(body.csrfToken);
  return { ok: res.ok, status: res.status, body };
}

function failureText(result) {
  if (result.status === 403 && /csrf/i.test(result.body.message || "")) {
    return "Your session expired. Reload the page and try again.";
  }
  return result.body.message || "Something went wrong. Please try again.";
}

// Forms: <form data-api="/api/auth/login" data-redirect="/dashboard">
document.querySelectorAll("form[data-api]").forEach((form) => {
  const box = form.querySelector(".message");
  const button = form.querySelector("button[type=submit]");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const data = Object.fromEntries(new FormData(form).entries());
    const newPassword = data.password !== undefined ? data.password : data.newPassword;

    if (data.confirmPassword !== undefined && data.confirmPassword !== newPassword) {
      showMessage(box, "Passwords do not match.", "error");
      return;
    }

    const label = button.textContent;
    button.disabled = true;
    button.textContent = "Please wait...";
    try {
      const result = await postJson(form.dataset.api, data);

      if (result.ok) {
        showMessage(box, result.body.message, "success");
        if (form.dataset.clear === "true") form.reset();
        if (form.dataset.redirect) {
          const delay = Number(form.dataset.delay || 0);
          setTimeout(() => {
            window.location.href = form.dataset.redirect;
          }, delay);
        }
      } else {
        showMessage(box, failureText(result), "error", result.body.errors);
      }
    } catch (e) {
      showMessage(box, "Could not reach the server.", "error");
    } finally {
      button.disabled = false;
      button.textContent = label;
    }
  });
});

// Logout button in the header
const logoutButton = document.querySelector("[data-logout]");
if (logoutButton) {
  logoutButton.addEventListener("click", async () => {
    const result = await postJson("/api/auth/logout");
    if (result.ok) {
      window.location.href = "/login";
    } else {
      window.location.reload();
    }
  });
}

// Verify email page: the link from the email opens /verify-email?token=..&email=..
const verifyBox = document.querySelector("[data-verify]");
if (verifyBox) {
  const params = new URLSearchParams({
    token: verifyBox.dataset.token,
    email: verifyBox.dataset.email,
  });

  fetch("/api/auth/verify-email?" + params.toString(), { credentials: "same-origin" })
    .then(async (res) => {
      const body = await res.json().catch(() => ({}));
      showMessage(
        verifyBox,
        body.message || "Could not verify your email.",
        res.ok ? "success" : "error",
      );
    })
    .catch(() => showMessage(verifyBox, "Could not reach the server.", "error"));
}

// Show / hide button on every password field
document.querySelectorAll('input[type="password"]').forEach((input) => {
  const wrap = document.createElement("div");
  wrap.className = "pw-wrap";
  input.parentNode.insertBefore(wrap, input);
  wrap.appendChild(input);

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "pw-toggle";
  toggle.textContent = "Show";
  toggle.addEventListener("click", () => {
    const hidden = input.type === "password";
    input.type = hidden ? "text" : "password";
    toggle.textContent = hidden ? "Hide" : "Show";
  });
  wrap.appendChild(toggle);
});
