import express from "express";

const app = express();
app.use(express.json());

let tasks = [
  {
    id: 1,
    taskName: "Develop Login Page",
    assignedTo: "Rahul Sharma",
    status: "Pending",
    priority: "High",
  },
  {
    id: 2,
    taskName: "Design Dashboard",
    assignedTo: "Priya Singh",
    status: "In Progress",
    priority: "Medium",
  },
  {
    id: 3,
    taskName: "Test User Registration",
    assignedTo: "Amit Kumar",
    status: "Completed",
    priority: "Low",
  },
];

app.get("/tasks", (req, res) => {
  res.json(tasks);
});

app.get("/tasks/:id", (req, res) => {
  const task = tasks.find((task) => task.id == req.params.id);
  if (!task) return res.status(404).json({ message: "Task not found" });
  res.json(task);
});

app.post("/tasks", (req, res) => {
  const { id, taskName, assignedTo, status, priority } = req.body || {};

  if (!id || !taskName || !assignedTo || !status || !priority) {
    return res.status(400).json({ message: "Please provide all task details" });
  }
  if (tasks.some((task) => task.id == id)) {
    return res.status(409).json({ message: "Task ID already exists" });
  }

  const newTask = { id, taskName, assignedTo, status, priority };
  tasks.push(newTask);
  res.status(201).json({ message: "Task added successfully", task: newTask });
});

app.put("/tasks/:id", (req, res) => {
  const task = tasks.find((task) => task.id == req.params.id);
  if (!task) return res.status(404).json({ message: "Task not found" });

  const { taskName, assignedTo, status, priority } = req.body || {};
  if (!taskName || !assignedTo || !status || !priority) {
    return res.status(400).json({ message: "Please provide all task details" });
  }

  task.taskName = taskName;
  task.assignedTo = assignedTo;
  task.status = status;
  task.priority = priority;
  res.json({ message: "Task updated successfully", task });
});

app.delete("/tasks/:id", (req, res) => {
  const index = tasks.findIndex((task) => task.id == req.params.id);
  if (index === -1) return res.status(404).json({ message: "Task not found" });

  const deletedTask = tasks.splice(index, 1);
  res.json({ message: "Task deleted successfully", task: deletedTask[0] });
});

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError) {
    return res.status(400).json({ message: "Invalid JSON" });
  }
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});

const PORT = Number(process.env.PORT || 4000);
app.listen(PORT, () => {
  console.log(`Express Server running at http://localhost:${PORT}`);
});
