import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import ClassSelection from "./components/ClassSelection";
import SubjectSelection from "./components/SubjectSelection";
import LessonSelection from "./components/LessonSelection";
import Leaderboard from "./components/Leaderboard";
import Quiz from "./components/Quiz";
import SignUp from "./components/SignUp"; 
import CertificatePage from "./components/CertificatePage";
import DashboardPage from "./components/DashboardPage";
import MyCertificatesPage from "./components/MyCertificatesPage";


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/class" element={<ClassSelection />} />
        <Route path="/subject" element={<SubjectSelection />} />
        <Route path="/lesson" element={<LessonSelection />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/certificate" element={<CertificatePage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/certificates" element={<MyCertificatesPage />} />
      </Routes>
    </Router>
  );
}

export default App;

