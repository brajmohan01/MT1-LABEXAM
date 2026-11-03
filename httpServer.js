import http from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const PORT = Number(process.env.PORT ?? 3000);
const publicDirectory = path.join(path.dirname(fileURLToPath(import.meta.url)), "public");
const tasks = [
  {
    id: 1,
    taskName: "Develop Login Page",
    assignedTo: "Rahul Sharma",
    status: "Pending",
  },
  {
    id: 2,
    taskName: "Design Dashboard",
    assignedTo: "Priya Singh",
    status: "In Progress",
  },
  {
    id: 3,
    taskName: "Test User Registration",
    assignedTo: "Amit Kumar",
    status: "Completed",
  },
];

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
}

function sendText(response, statusCode, body, contentType = "text/plain; charset=utf-8") {
  response.writeHead(statusCode, { "Content-Type": contentType });
  response.end(body);
}

async function readJsonBody(request) {
  let body = "";

  for await (const chunk of request) {
    body += chunk;
    if (body.length > 1_000_000) {
      const error = new Error("Request body is too large");
      error.statusCode = 413;
      throw error;
    }
  }

  try {
    return JSON.parse(body);
  } catch {
    const error = new Error("Request body contains invalid JSON");
    error.statusCode = 400;
    throw error;
  }
}

const server = http.createServer(async (request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host ?? "localhost"}`);
  const { pathname } = requestUrl;

  if (request.method === "GET" && pathname === "/") {
    return sendText(
      response,
      200,
      "<!doctype html><html><head><title>Employee Task Management</title></head><body><h1>Welcome to Employee Task Management</h1></body></html>",
      "text/html; charset=utf-8",
    );
  }

  if (request.method === "GET" && pathname === "/tasks") {
    return sendJson(response, 200, tasks);
  }

  if (request.method === "POST" && pathname === "/add-task") {
    try {
      const task = await readJsonBody(request);
      if (!task || typeof task !== "object" || Array.isArray(task)) {
        return sendJson(response, 400, { message: "Request body must be a JSON object" });
      }

      const requiredFields = ["id", "taskName", "assignedTo", "status"];
      const missingFields = requiredFields.filter(
        (field) => !Object.hasOwn(task, field),
      );
      const invalidFields = ["taskName", "assignedTo", "status"].filter(
        (field) =>
          Object.hasOwn(task, field) &&
          (typeof task[field] !== "string" || task[field].trim().length === 0),
      );
      const invalidId =
        Object.hasOwn(task, "id") &&
        ((typeof task.id !== "number" && typeof task.id !== "string") ||
          String(task.id).trim().length === 0);

      if (
        missingFields.length > 0 ||
        invalidFields.length > 0 ||
        invalidId
      ) {
        return sendJson(response, 400, {
          message: "Invalid task details",
          ...(missingFields.length > 0 && { missingFields }),
          ...((invalidFields.length > 0 || invalidId) && {
            invalidFields: [...invalidFields, ...(invalidId ? ["id"] : [])],
          }),
        });
      }

      if (tasks.some((existingTask) => String(existingTask.id) === String(task.id))) {
        return sendJson(response, 409, { message: "A task with this ID already exists" });
      }

      const newTask = {
        id: task.id,
        taskName: task.taskName.trim(),
        assignedTo: task.assignedTo.trim(),
        status: task.status.trim(),
      };
      tasks.push(newTask);
      return sendJson(response, 201, {
        message: "Task added successfully",
        task: newTask,
      });
    } catch (error) {
      if (error.statusCode) {
        return sendJson(response, error.statusCode, { message: error.message });
      }
      console.error("Failed to process POST /add-task:", error);
      return sendJson(response, 500, { message: "Internal server error" });
    }
  }

  if (request.method === "GET" && pathname === "/about") {
    return sendText(
      response,
      200,
      "Employee Task Management application built with Node.js HTTP and FS modules.",
    );
  }

  if (request.method === "GET" && pathname === "/home") {
    try {
      const html = await readFile(path.join(publicDirectory, "index.html"), "utf8");
      return sendText(response, 200, html, "text/html; charset=utf-8");
    } catch (error) {
      console.error("Failed to read public/index.html:", error);
      return sendText(response, 500, "Unable to load the home page.");
    }
  }

  return sendJson(response, 404, { message: "Route not found" });
});

server.listen(PORT, () => {
  console.log(`HTTP Server running at http://localhost:${PORT}`);
});

server.on("error", (error) => {
  console.error(`HTTP server failed to start: ${error.message}`);
  process.exitCode = 1;
});