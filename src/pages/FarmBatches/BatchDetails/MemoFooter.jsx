// MemoFooter.jsx
import React from "react";

const inputClass =
  "border border-gray-300 rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition duration-150 ease-in-out print:border-none print:bg-white";

const MemoFooter = ({ t, total, paidAmount, setPaidAmount, due, handleSave }) => {
  return (
    <div className="p-6 bg-white">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
        {/* Left: Notes & Action Buttons */}
        <div className="flex-1">
          <label className="text-sm font-semibold block mb-1 text-gray-700">{t.notes}</label>
          <textarea placeholder="e.g., Delivery instructions, warranty info..." className={`${inputClass} h-24 print:h-12 print:text-sm print:opacity-80`} />

          <div className="mt-6 flex gap-3 no-print">
            <button
              onClick={handleSave}
              className="bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg hover:bg-green-700 font-bold transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              {t.save}
            </button>

            <button
              onClick={() => window.print()}
              className="border border-gray-300 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-100 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m0 0v1a2 2 0 002 2h6a2 2 0 002-2v-1m0 0H7m7 0H7m4 0v-4"></path></svg>
              {t.print}
            </button>
          </div>
        </div>

        {/* Right: Totals Block - Clearly Highlighted */}
        <div className="w-full md:w-80 bg-blue-50 border border-blue-200 rounded-xl p-5 shadow-inner self-start">
          {/* Total */}
          <div className="flex justify-between items-center text-xl font-bold text-gray-700 pb-3 border-b border-blue-100">
            <span>{t.total}</span>
            <span>৳ {Number(total.toFixed(2)).toLocaleString()}</span>
          </div>

          {/* Paid Amount */}
          <div className="flex justify-between items-center my-3">
            <label className="font-medium text-gray-600 text-lg">{t.paid}</label>
            <div className="w-36">
              <input
                type="number"
                min="0"
                value={paidAmount}
                onChange={(e) => setPaidAmount(Number(e.target.value || 0))}
                className="border border-gray-300 rounded-lg px-2 py-1 text-right w-full font-semibold print:border-none print:bg-blue-50"
              />
            </div>
          </div>

          {/* Due Amount */}
          <div className={`flex justify-between items-center pt-3 border-t-2 ${due > 0 ? 'border-red-500' : 'border-green-500'}`}>
            <div className="text-xl font-extrabold text-gray-800">{t.due}</div>
            <div className={`text-2xl font-extrabold ${due > 0 ? 'text-red-600' : 'text-green-600'}`}>
              ৳ {Number(due.toFixed(2)).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Signature area */}
      <div className="mt-12 grid grid-cols-2 gap-10 text-gray-600">
        <div className="text-center border-t border-gray-400 pt-3 text-sm font-medium">{t.signCustomer}</div>
        <div className="text-center border-t border-gray-400 pt-3 text-sm font-medium">{t.signSeller}</div>
      </div>
    </div>
  );
};

export default MemoFooter;