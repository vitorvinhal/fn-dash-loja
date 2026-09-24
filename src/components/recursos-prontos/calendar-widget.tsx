"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CalendarWidgetProps {
  selectedDate: Date | null;
  onSelect: (date: Date | null) => void;
}

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const DAY_NAMES = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export function CalendarWidget({ selectedDate, onSelect }: CalendarWidgetProps) {
  const today = new Date();
  const [viewMonth, setViewMonth] = useState(selectedDate?.getMonth() ?? today.getMonth());
  const [viewYear, setViewYear] = useState(selectedDate?.getFullYear() ?? today.getFullYear());

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  const cells = useMemo(() => {
    const result: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) result.push(null);
    for (let d = 1; d <= daysInMonth; d++) result.push(d);
    return result;
  }, [firstDay, daysInMonth]);

  const prev = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };

  const next = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  const selectDay = (day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    onSelect(d);
  };

  const isToday = (day: number) =>
    day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();

  const isSelected = (day: number) =>
    selectedDate && day === selectedDate.getDate() && viewMonth === selectedDate.getMonth() && viewYear === selectedDate.getFullYear();

  return (
    <div className="cal-widget">
      <div className="cal-widget__header">
        <button onClick={prev} className="cal-widget__nav" aria-label="Mês anterior">
          <ChevronLeft size={16} />
        </button>
        <span className="cal-widget__title">{MONTH_NAMES[viewMonth]} {viewYear}</span>
        <button onClick={next} className="cal-widget__nav" aria-label="Próximo mês">
          <ChevronRight size={16} />
        </button>
      </div>
      <div className="cal-widget__grid">
        {DAY_NAMES.map((d) => (
          <div key={d} className="cal-widget__weekday">{d}</div>
        ))}
        {cells.map((day, i) => (
          <div
            key={i}
            className={`cal-widget__day ${day ? "cal-widget__day--in-month" : ""} ${day && isToday(day) ? "cal-widget__day--today" : ""} ${day && isSelected(day) ? "cal-widget__day--selected" : ""}`}
            onClick={() => day && selectDay(day)}
          >
            {day}
          </div>
        ))}
      </div>
      {selectedDate && (
        <button className="cal-widget__clear" onClick={() => onSelect(null)}>
          Limpar filtro
        </button>
      )}
    </div>
  );
}
