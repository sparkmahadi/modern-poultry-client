import React, { useState, useEffect } from 'react';

const ReportsFilterBar = ({ onFilterChange, initialMonth }) => {
  // Mode: 'month' or 'range'
  const [filterMode, setFilterMode] = useState('month');
  
  // Default to current year-month (e.g. "2026-10")
  const [selectedMonth, setSelectedMonth] = useState(
    initialMonth || new Date().toISOString().slice(0, 7)
  );

  const [dateRange, setDateRange] = useState({
    from: '',
    to: ''
  });

  // Calculate Start & End of a given YYYY-MM string
  const getMonthDateBoundaries = (yearMonthStr) => {
    const [year, month] = yearMonthStr.split('-').map(Number);
    // month is 1-indexed (1 = Jan, 12 = Dec)
    const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
    
    return {
      from: startDate.toISOString().split('T')[0],
      to: endDate.toISOString().split('T')[0]
    };
  };

  // Trigger filter change whenever state updates
  useEffect(() => {
    if (filterMode === 'month' && selectedMonth) {
      const bounds = getMonthDateBoundaries(selectedMonth);
      onFilterChange({
        mode: 'month',
        month: selectedMonth,
        from: bounds.from,
        to: bounds.to
      });
    } else if (filterMode === 'range' && dateRange.from && dateRange.to) {
      onFilterChange({
        mode: 'range',
        from: dateRange.from,
        to: dateRange.to
      });
    }
  }, [filterMode, selectedMonth, dateRange]);

  // Quick Preset Helper
  const applyPresetMonth = (offsetMonths = 0) => {
    const target = new Date();
    target.setMonth(target.getMonth() + offsetMonths);
    const yyyyMm = target.toISOString().slice(0, 7);
    setFilterMode('month');
    setSelectedMonth(yyyyMm);
  };

  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-4 mb-6">
      {/* Mode Selector & Quick Presets */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setFilterMode('month')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              filterMode === 'month'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            By Month
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('range')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              filterMode === 'range'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Custom Range
          </button>
        </div>

        {/* Quick Month Shortcuts */}
        {filterMode === 'month' && (
          <div className="flex items-center gap-1.5 ml-2">
            <button
              type="button"
              onClick={() => applyPresetMonth(0)}
              className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-medium"
            >
              This Month
            </button>
            <button
              type="button"
              onClick={() => applyPresetMonth(-1)}
              className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-medium"
            >
              Last Month
            </button>
            <button
              type="button"
              onClick={() => applyPresetMonth(-2)}
              className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-medium"
            >
              2 Months Ago
            </button>
          </div>
        )}
      </div>

      {/* Date Pickers */}
      <div className="flex items-center gap-3">
        {filterMode === 'month' ? (
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold uppercase text-slate-400">
              Select Month:
            </label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="border border-slate-200 bg-white rounded-xl px-3 py-1.5 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-400 uppercase">From:</span>
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, from: e.target.value }))
                }
                className="border border-slate-200 bg-white rounded-xl px-2.5 py-1.5 text-xs text-slate-800 outline-none"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-400 uppercase">To:</span>
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, to: e.target.value }))
                }
                className="border border-slate-200 bg-white rounded-xl px-2.5 py-1.5 text-xs text-slate-800 outline-none"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsFilterBar;