"use client";

import React from "react";
import { 
  BarChart3, FileDown, Filter, TrendingUp, 
  TrendingDown, ShoppingCart, Wallet, Bird,
  Calendar as CalendarIcon, ChevronRight
} from "lucide-react";

export default function ReportsPage() {
  return (
    <div className="p-8 space-y-8 bg-slate-50/50 min-h-screen font-sans text-slate-900">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports Overview</h1>
          <p className="text-slate-500 mt-1">Real-time insights into your poultry production and financial health.</p>
        </div>
        <div className="flex items-center gap-3">
          <LocalButton variant="outline" className="hidden sm:flex">
            <Filter size={16} /> Filters
          </LocalButton>
          <LocalButton variant="primary">
            <FileDown size={16} /> Export Data
          </LocalButton>
        </div>
      </div>

      {/* Filter Bar */}
      <LocalCard>
        <div className="p-4 flex flex-wrap gap-4 items-center">
          <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
            <label className="text-xs font-bold text-slate-400 uppercase ml-1">Date Range</label>
            <div className="flex items-center gap-2">
              <input type="date" className="flex-1 border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none border-slate-200" />
              <span className="text-slate-400">to</span>
              <input type="date" className="flex-1 border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none border-slate-200" />
            </div>
          </div>
          
          <div className="flex flex-col gap-1.5 min-w-[180px]">
            <label className="text-xs font-bold text-slate-400 uppercase ml-1">Farm Location</label>
            <select className="border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none border-slate-200 bg-white">
              <option>All Farms</option>
              <option>Farm A - North Sector</option>
              <option>Farm B - South Sector</option>
            </select>
          </div>

          <div className="flex items-end h-full mt-5">
            <LocalButton variant="secondary" className="w-full sm:w-auto">
              Apply Filters
            </LocalButton>
          </div>
        </div>
      </LocalCard>

      {/* Summary Stat Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Production" value="12,450" unit="Birds" icon={<Bird size={20}/>} color="blue" trend="+12%" isUp={true} />
        <StatCard label="Sales" value="৳ 1.24M" icon={<ShoppingCart size={20}/>} color="emerald" trend="+5.2%" isUp={true} />
        <StatCard label="Expenses" value="৳ 845k" icon={<Wallet size={20}/>} color="orange" trend="-2.1%" isUp={false} />
        <StatCard label="Net Profit" value="৳ 400k" icon={<TrendingUp size={20}/>} color="indigo" trend="+18%" isUp={true} highlight={true} />
      </div>

      {/* Detailed Table Section */}
      <LocalCard className="overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <BarChart3 size={20} className="text-blue-500" /> Detailed Performance Log
          </h3>
          <button className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
            View Analytics <ChevronRight size={16} />
          </button>
        </div>
        <div className="overflow-x-auto bg-white">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 border-b border-slate-100">
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">Date</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px] text-center">Production</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px] text-right">Sales (৳)</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px] text-right">Expenses (৳)</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px] text-right">Profit (৳)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <TableRow date="01 Jan 2026" prod="420" sales="45,000" exp="32,000" profit="13,000" />
              <TableRow date="02 Jan 2026" prod="460" sales="48,000" exp="35,000" profit="13,000" />
              <TableRow date="03 Jan 2026" prod="410" sales="42,500" exp="31,000" profit="11,500" />
            </tbody>
          </table>
        </div>
      </LocalCard>
    </div>
  );
}

/** * LOCAL COMPONENTS 
 * These replace the third-party imports (Card, Button, etc.)
 */

function LocalCard({ children, className = "" }) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function LocalButton({ children, variant = "primary", className = "" }) {
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200",
    secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200",
    outline: "bg-transparent border border-slate-200 text-slate-600 hover:bg-slate-50"
  };

  return (
    <button className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm active:scale-95 ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
}

function StatCard({ label, value, unit, icon, color, trend, isUp, highlight }) {
  const colors = {
    blue: "text-blue-600 bg-blue-50",
    emerald: "text-emerald-600 bg-emerald-50",
    orange: "text-orange-600 bg-orange-50",
    indigo: "text-indigo-600 bg-indigo-50",
  };

  return (
    <LocalCard className={`p-6 transition-all hover:shadow-md ${highlight ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`}>
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-2xl ${colors[color]}`}>{icon}</div>
        <div className={`flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full ${isUp ? 'text-emerald-600 bg-emerald-100' : 'text-rose-600 bg-rose-100'}`}>
          {isUp ? <TrendingUp size={12}/> : <TrendingDown size={12}/>} {trend}
        </div>
      </div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</p>
      <div className="flex items-baseline gap-2 mt-1">
        <h2 className="text-2xl font-black">{value}</h2>
        {unit && <span className="text-slate-400 font-medium text-sm">{unit}</span>}
      </div>
    </LocalCard>
  );
}

function TableRow({ date, prod, sales, exp, profit }) {
  return (
    <tr className="hover:bg-slate-50/80 transition-colors group">
      <td className="px-6 py-4 font-medium text-slate-700 flex items-center gap-2">
        <CalendarIcon size={14} className="text-slate-300 group-hover:text-blue-500" />
        {date}
      </td>
      <td className="px-6 py-4 text-center font-semibold text-slate-600">{prod}</td>
      <td className="px-6 py-4 text-right text-slate-600 font-medium">{sales}</td>
      <td className="px-6 py-4 text-right text-slate-600 font-medium">{exp}</td>
      <td className="px-6 py-4 text-right">
        <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg font-bold">
          {profit}
        </span>
      </td>
    </tr>
  );
}