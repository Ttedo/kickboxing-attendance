import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import logo from "./logo192.png";

function App() {
  const [students, setStudents] = useState(() => {
    const saved = localStorage.getItem("students");
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      // 🛠️ Поправяме липсващи данни
      return parsed.map((s) => ({
        name: s.name || "",
        dates: Array.isArray(s.dates) ? s.dates : [],
        totalFee: typeof s.totalFee === "number" ? s.totalFee : 60,
      }));
    } catch {
      return [];
    }
  });

  const [inputNames, setInputNames] = useState("");

  useEffect(() => {
    localStorage.setItem("students", JSON.stringify(students));
  }, [students]);

  const handleAddStudents = () => {
    const namesArray = inputNames
      .split(",")
      .map((name) => name.trim())
      .filter((name) => name !== "");
    const newStudents = namesArray.map((name) => ({
      name,
      dates: [],
      totalFee: 60,
    }));
    setStudents([...students, ...newStudents]);
    setInputNames("");
  };

  const handleAddAbsence = (index) => {
    const newStudents = [...students];
    const student = newStudents[index];
    const date = new Date().toLocaleDateString();

    if (!student.dates.includes(date)) {
      student.dates.push(date);
      student.totalFee = Math.max(0, student.totalFee - 10);
      setStudents(newStudents);
    } else {
      alert("Отсъствието за днес вече е отбелязано!");
    }
  };

  const handleDeleteStudent = (index) => {
    const newStudents = students.filter((_, i) => i !== index);
    setStudents(newStudents);
  };

  const handleExport = () => {
    const data = students.map((s) => ({
      Име: s.name,
      "Брой отсъствия": s.dates.length,
      "Дати на отсъствия": s.dates.join(", "),
      "Оставаща такса (лв)": s.totalFee,
      "Общо присъствия (брой)": Math.max(0, 6 - s.dates.length),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Masaru");
    XLSX.writeFile(wb, "Masaru деца и крайна сума.xlsx");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#063a1a] to-[#0d3b24] text-white flex flex-col items-center p-6 font-sans transition-all duration-500">
      {/* 🔥 Лого с анимация */}
      <img
  src={logo}
  alt="Masaru Logo"
  className="w-28 mb-3 mt-2 motion-safe:animate-float"
  style={{ animationDuration: "4s" }}
/>

      {/* 🔥 Заглавие */}
      <h1 className="text-3xl font-bold text-yellow-400 mb-6 text-center animate-pulse">
        Masaru Team SHKOLO
      </h1>

      {/* 🔥 Поле за въвеждане */}
      <div className="flex flex-col sm:flex-row items-center gap-3 mb-6 w-full max-w-lg">
        <input
          type="text"
          value={inputNames}
          onChange={(e) => setInputNames(e.target.value)}
          placeholder="Въведи децата"
          className="p-3 w-full rounded-lg text-black focus:outline-none shadow-md"
        />
        <button
          onClick={handleAddStudents}
          className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-6 py-3 rounded-lg shadow-lg transition-transform transform hover:scale-110 active:scale-95"
        >
          ➕ Добави
        </button>
      </div>

      {/* 🔥 Карти на учениците */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
        {students.map((student, index) => (
          <div
            key={index}
            className="bg-green-800 rounded-2xl p-5 shadow-lg border border-green-600 transition-all transform hover:scale-105 hover:shadow-yellow-400/40"
          >
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-bold text-yellow-300 animate-pulse">
                {student.name}
              </h2>
              <button
                onClick={() => handleDeleteStudent(index)}
                className="text-red-400 hover:text-red-600 text-sm transition-transform hover:scale-125"
              >
                ❌
              </button>
            </div>

            <p>💸 Обща такса: 60 лв</p>
            <p>📉 Оставаща сума: {student.totalFee} лв</p>
            <p>📅 Отсъствия: {student.dates.length}</p>

            <div className="flex flex-wrap gap-2 mt-2">
              {student.dates.map((date, i) => (
                <span
                  key={i}
                  className="bg-yellow-400 text-black px-2 py-1 rounded-md text-sm shadow-md"
                >
                  {date}
                </span>
              ))}
            </div>

            <button
              onClick={() => handleAddAbsence(index)}
              className="mt-4 bg-yellow-400 hover:bg-yellow-500 text-black px-4 py-2 rounded-lg font-semibold transition-transform transform hover:scale-105 w-full shadow-lg"
            >
              📅 Отбележи отсъствие
            </button>
          </div>
        ))}
      </div>

      {/* 🔥 Експорт бутон */}
      {students.length > 0 && (
        <button
          onClick={handleExport}
          className="mt-8 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-8 py-3 rounded-lg shadow-xl transition-transform transform hover:scale-110"
        >
          📊 Експорт в Excel
        </button>
      )}

      {/* 🔥 Footer */}
      <footer className="mt-10 text-sm text-gray-400 text-center">
        Created by Teodor Popovski;)
      </footer>
    </div>
  );
}

export default App;