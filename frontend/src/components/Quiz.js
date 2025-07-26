import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../App.css";

export default function QuizPage() {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState("");
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [timeTaken, setTimeTaken] = useState(0);

  const navigate = useNavigate();
  const location = useLocation();

  const params = new URLSearchParams(location.search);
  const selectedClass = params.get("class");
  const selectedSubject = params.get("subject");
  const selectedChapter = params.get("chapter");

  const rollNumber = localStorage.getItem("rollNumber");

  const timerRef = useRef(null);

  useEffect(() => {
  fetch(
    `http://localhost:4000/api/questions?class=${selectedClass}&subject=${selectedSubject}&chapter=${selectedChapter}`
  )
    .then((res) => res.json())
    .then((data) => {
      // Shuffle the questions
      const shuffledQuestions = shuffleArray(data).map(q => ({
        ...q,
        options: shuffleArray(q.options), // also shuffle options of each question
      }));
      setQuestions(shuffledQuestions);
    })
    .catch((err) => console.error("Failed to load questions:", err));
}, [selectedClass, selectedSubject, selectedChapter]);

function shuffleArray(array) {
  return array
    .map(value => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);
}


  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeTaken((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, []);

  const handleSelect = (opt) => {
    setSelected(opt);
  };

  const handleNext = () => {
    if (selected === questions[currentIndex].answer) {
      setScore((prev) => prev + 1);
    }

    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelected("");
    } else {
      clearInterval(timerRef.current); // ⬅️ stop timer
      // Submit result
      fetch("http://localhost:4000/api/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentRollNumber: rollNumber,
          score: selected === questions[currentIndex].answer ? score + 1 : score,
          class: selectedClass,
          subject: selectedSubject,
          chapter: selectedChapter,
          timeTaken,
        }),
      })
        .then(() => setShowResult(true))
        .catch((err) => console.error("Failed to save result:", err));
    }
  };

  if (questions.length === 0) return <p>Loading questions...</p>;

  if (showResult) {
    return (
      <div className="container">
        <div className="quiz-box">
          <h2>🎉 Quiz Completed!</h2>
          <p>
            Your Score: {score} / {questions.length}
          </p>
          <p>Time Taken: {timeTaken} seconds</p>
          <button className="page-button" onClick={() => navigate("/dashboard")}>
            Go to Home
          </button>
          <button
            className="page-button"
            style={{ marginLeft: "10px" }}
            onClick={() => navigate("/leaderboard")}
          >
            View Leaderboard
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <div className="container">
      <div className="quiz-box">
        <h2>Quiz</h2>
        <p>
          Time: {timeTaken} seconds
        </p>
        <p>
          <strong>Q{currentIndex + 1}:</strong> {currentQuestion.question}
        </p>

        <div className="options-container">
          {currentQuestion.options.map((opt, index) => (
            <button
              key={index}
              className={`option-btn ${selected === opt ? "selected" : ""}`}
              onClick={() => handleSelect(opt)}
            >
              {opt}
            </button>
          ))}
        </div>

        <button
          className="page-button"
          onClick={handleNext}
          disabled={!selected}
        >
          {currentIndex === questions.length - 1 ? "Finish" : "Next"}
        </button>
      </div>
    </div>
  );
}
