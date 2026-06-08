import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import SurveyBuilder from "./pages/SurveyBuilder";
import SurveyAnalytics from "./pages/SurveyAnalytics";
import SurveyForm from "./pages/SurveyForm";
import SurveyDone from "./pages/SurveyDone";

function PrivateRoute({ children }: { children: React.ReactElement }) {
  return localStorage.getItem("token") ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/s/:slug" element={<SurveyForm />} />
        <Route path="/s/:slug/done" element={<SurveyDone />} />
        <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/builder" element={<PrivateRoute><SurveyBuilder /></PrivateRoute>} />
        <Route path="/analytics/:slug" element={<PrivateRoute><SurveyAnalytics /></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
