import React, { useState, useEffect } from "react";

// Kickboxing Attendance Tracker
// Един файлен React компонент. Използва TailwindCSS за стилизиране.
// Функции:
// - Добавяне и изтриване на спортисти
// - Избиране на месец/година
// - Маркиране на отсъствия ден по ден (toggle)
// - Визуална месечна таблица (ред по спортист, колони — дни)
// - Запазване в localStorage
// - Експорт на CSV и изчистване на месеца

const STORAGE_KEY = "kb_attendance_v1";

function monthKey(year, month) {
  return `${year}-${String(month).padStart(2, "0")}`; // e.g. 2025-10
}

function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate(); // month: 1-12
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export default function KickboxingAttendanceTracker() {
  // students: [{id, name}]
  const [students, setStudents] = useState([]);
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1); // 1-12
  // attendance: { "YYYY-MM": { studentId: [dayNumbers...] } }
  const [attendance, setAttendance] = useState({});
  const [newName, setNewName] = useState("");

  // load from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setStudents(parsed.students || []);
        setAttendance(parsed.attendance || {});
        if (parsed.view) {
          setYear(parsed.view.year || year);
          setMonth(parsed.view.month || month);
        }
      }
    } catch (e) {
      console.warn("Не можа да се зареди localStorage", e);
    }
  }, []);

  // save to localStorage on changes
  useEffect(() => {
    const payload = { students, attendance, view: { year, month } };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [students, attendance, year, month]);

  // helper to get attendance array for student for current month
  function getStudentDays(studentId) {
    const key = monthKey(year, month);
    const m = attendance[key] || {};
    return new Set(m[studentId] || []);
  }

  function toggleDay(studentId, day) {
    const key = monthKey(year, month);
    setAttendance(prev => {
      const copy = { ...prev };
      copy[key] = { ...(copy[key] || {}) };
      const arr = new Set(copy[key][studentId] || []);
      if (arr.has(day)) {
        arr.delete(day);
      } else {
        arr.add(day);
      }
      copy[key][studentId] = Array.from(arr).sort((a, b) => a - b);
      return copy;
    });
  }

  function addStudent() {
    const name = newName.trim();
    if (!name) return;
    const id = uid();
    setStudents(prev => [...prev, { id, name }]);
    setNewName("");
  }

  function removeStudent(id) {
    setStudents(prev => prev.filter(s => s.id !== id));
    // also remove attendance data for this student across months
    setAttendance(prev => {
      const copy = {};
      for (const k of Object.keys(prev)) {
        const monthObj = { ...prev[k] };
        delete monthObj[id];
        copy[k] = monthObj;
      }
      return copy;
    });
  }

  function clearMonth() {
    const key = monthKey(year, month);
    setAttendance(prev => {
      const copy = { ...prev };
      copy[key] = {};
      return copy;
    });
  }

  function exportCSV() {
    const key = monthKey(year, month);
    const days = daysInMonth(year, month);
    const header = ["Name", ...Array.from({ length: days }, (_, i) => i + 1)].join(",");
    const rows = students.map(s => {
      const set = new Set((attendance[key] && attendance[key][s.id]) || []);
      const dayCols = Array.from({ length: days }, (_, i) => (set.has(i + 1) ? "ABS" : ""));
      return [s.name, ...dayCols].join(",");
    });
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance_${key}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const days = daysInMonth(year, month);

  // Simple month/year selector helpers
  function prevMonth() {
    let y = year;
    let m = month - 1;
    if (m < 1) {
      m = 12; y -= 1;
    }
    setYear(y); setMonth(m);
  }
  function nextMonth() {
    let y = year;
    let m = month + 1;
    if (m > 12) {
      m = 1; y += 1;
    }
    setYear(y); setMonth(m);
  }

  return (
    <div className="p-4 max-w-full">
      <h1 className="text-2xl font-bold mb-4">Kickboxing - Управление на присъствия</h1>

      <div className="flex gap-4 mb-4 items-center">
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="px-3 py-1 rounded bg-gray-200">◀</button>
          <div className="font-medium">{monthKey(year, month)}</div>
          <button onClick={nextMonth} className="px-3 py-1 rounded bg-gray-200">▶</button>
        </div>

        <div className="flex gap-2 items-center">
          <label className="text-sm">Година</label>
          <input type="number" value={year} onChange={e => setYear(Number(e.target.value))} className="w-20 p-1 border rounded" />
          <label className="text-sm">Месец</label>
          <input type="number" min={1} max={12} value={month} onChange={e => setMonth(Number(e.target.value))} className="w-16 p-1 border rounded" />
        </div>

        <div className="ml-auto flex gap-2">
          <button onClick={exportCSV} className="px-3 py-1 rounded bg-blue-500 text-white">Експорт CSV</button>
          <button onClick={clearMonth} className="px-3 py-1 rounded bg-red-500 text-white">Изчисти месец</button>
        </div>
      </div>

      <div className="flex gap-6">
        <div className="w-64">
          <h2 className="font-semibold mb-2">Спортисти</h2>
          <div className="flex gap-2 mb-2">
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Име" className="flex-1 p-2 border rounded" />
            <button onClick={addStudent} className="px-3 py-2 bg-green-500 text-white rounded">Добави</button>
          </div>

          <div className="space-y-2">
            {students.length === 0 && <div className="text-sm text-gray-500">Няма добавени спортисти. Добави отдясно.</div>}
            {students.map(s => (
              <div key={s.id} className="flex items-center justify-between p-2 border rounded">
                <div>{s.name}</div>
                <div className="flex gap-2">
                  <button onClick={() => removeStudent(s.id)} className="text-sm px-2 py-1 bg-red-400 rounded text-white">Изтрий</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <h2 className="font-semibold mb-2">Таблица - кликни за да маркираш отсъствие</h2>
          <div className="text-xs text-gray-600 mb-2">ABS = отсъствие</div>

          <div className="overflow-auto border rounded">
            <table className="min-w-max w-full table-auto">
              <thead>
                <tr>
                  <th className="p-2 sticky left-0 bg-white z-10">Име</th>
                  {Array.from({ length: days }).map((_, i) => (
                    <th key={i} className="p-1 text-center">{i + 1}</th>
                  ))}
                  <th className="p-2">Общо</th>
                </tr>
              </thead>
              <tbody>
                {students.map(s => {
                  const set = getStudentDays(s.id);
                  return (
                    <tr key={s.id} className="border-t hover:bg-gray-50">
                      <td className="p-2 sticky left-0 bg-white z-0">{s.name}</td>
                      {Array.from({ length: days }).map((_, i) => {
                        const day = i + 1;
                        const isAbs = set.has(day);
                        return (
                          <td key={i} className="p-1 text-center">
                            <button onClick={() => toggleDay(s.id, day)} className={`px-2 py-1 rounded ${isAbs ? 'bg-red-400 text-white' : 'bg-gray-100'}`}>
                              {isAbs ? 'ABS' : ''}
                            </button>
                          </td>
                        );
                      })}
                      <td className="p-2 text-center">{set.size}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <div>Запазване: localStorage (локално в браузъра). Ако искаш синхронизация между устройства, мога да добавя прост бекенд / Google Sheets интеграция.</div>
        <div className="mt-2">Съвети: можеш да промениш стила, да добавиш роли (треньор/спорт), и да пазиш бележки за всеки ден/спортсмен.</div>
      </div>
    </div>
  );
}
