const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect("mongodb://127.0.0.1:27017/quiz-app", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoose.connection.once("open", () => {
  console.log("✅ Connected to MongoDB");
});

// Schemas
const StudentSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  rollNumber: String,
  password: String,
});
const Student = mongoose.model("Student", StudentSchema);

const QuestionSchema = new mongoose.Schema({
  class: String,
  subject: String,
  chapter: String,
  question: String,
  options: [String],
  answer: String,
});
const Question = mongoose.model("Question", QuestionSchema);

const ResultSchema = new mongoose.Schema({
  studentRollNumber: String,
  studentName: String,
  class: String,
  subject: String,
  chapter: String,
  score: Number,
  timeTaken: Number,
  createdAt: { type: Date, default: Date.now },
});
const Result = mongoose.model("Result", ResultSchema);

// Routes

// 🔐 Login
app.post("/api/login", async (req, res) => {
  const { role, identifier, password } = req.body;

  if (role === "student") {
    const student = await Student.findOne({ rollNumber: identifier });
    if (!student || student.password !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    return res.json({
      message: "Login successful",
      firstName: student.firstName,
      lastName: student.lastName,
    });
  }

  if (role === "admin") {
    if (identifier === "admin" && password === "admin123") {
      return res.json({ message: "Admin login successful" });
    }
    return res.status(401).json({ message: "Invalid admin credentials" });
  }

  res.status(400).json({ message: "Invalid role" });
});

// 📝 Signup
app.post("/api/signup", async (req, res) => {
  const { firstName, lastName, rollNumber, password } = req.body;

  const existing = await Student.findOne({ rollNumber });
  if (existing) return res.status(400).json({ message: "Roll number already exists" });

  const student = new Student({ firstName, lastName, rollNumber, password });
  await student.save();
  res.json({ message: "Signup successful" });
});

// 📋 Get Questions
app.get("/api/questions", async (req, res) => {
  const { class: cls, subject, chapter } = req.query;
  const questions = await Question.find({ class: cls, subject, chapter });
  res.json(questions);
});

// ✅ Save Result (replace only if better)
app.post("/api/results", async (req, res) => {
  const { studentRollNumber, class: cls, subject, chapter, score, timeTaken } = req.body;
  const student = await Student.findOne({ rollNumber: studentRollNumber });
  const studentName = student ? `${student.firstName} ${student.lastName}` : studentRollNumber;

  const existing = await Result.findOne({ studentRollNumber, class: cls, subject, chapter });

  if (!existing || score > existing.score) {
    await Result.findOneAndUpdate(
      { studentRollNumber, class: cls, subject, chapter },
      {
        studentRollNumber,
        studentName,
        class: cls,
        subject,
        chapter,
        score,
        timeTaken,
        createdAt: new Date(),
      },
      { upsert: true }
    );
  }

  res.json({ message: "Result saved" });
});

// 🏆 Leaderboard (based on best scores)
app.get("/api/leaderboard", async (req, res) => {
  const { class: cls, subject, chapter } = req.query;

  try {
    const results = await Result.aggregate([
      {
        $match: {
          ...(cls && { class: cls }),
          ...(subject && { subject }),
          ...(chapter && { chapter }),
        },
      },
      { $sort: { score: -1, timeTaken: 1 } },
      {
        $group: {
          _id: "$studentRollNumber",
          class: { $first: "$class" },
          subject: { $first: "$subject" },
          chapter: { $first: "$chapter" },
          bestScore: { $first: "$score" },
          bestTime: { $first: "$timeTaken" },
        },
      },
      { $sort: { bestScore: -1, bestTime: 1 } },
    ]);

    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch leaderboard" });
  }
});

// 🧾 Get CURRENT quiz result (for certificate)
app.get("/api/result/current", async (req, res) => {
  const { rollNumber, class: cls, subject, chapter } = req.query;

  try {
    const result = await Result.findOne({
      studentRollNumber: rollNumber,
      class: cls,
      subject,
      chapter,
    });

    if (!result) return res.status(404).json({ message: "No result found" });
    res.json(result);
  } catch (err) {
    console.error("Error fetching current result:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// 🎓 Student Info
app.get("/api/student", async (req, res) => {
  const rollNumber = req.query.rollNumber;
  try {
    const student = await Student.findOne({ rollNumber });
    if (!student) return res.status(404).json({ message: "Student not found" });
    res.json(student);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});
// 🔄 Get all results for student (for MyCertificates page)
app.get("/api/results/all", async (req, res) => {
  const { rollNumber } = req.query;
  try {
    const results = await Result.find({ studentRollNumber: rollNumber });
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch results" });
  }
});

// Start server
const PORT = 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
