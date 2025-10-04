import React from 'react';

const BudgetSelectionModal = ({setShowBudgetSelectionModal, budgetSelectionLoading, budgetSelectionError, availableBudgets, handleSelectBudgetForPlan}) => {
    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                    <h3 className="text-xl font-bold text-gray-800">Select a Budget to Link Consumption Plan</h3>
                    <button
                        onClick={() => setShowBudgetSelectionModal(false)}
                        className="text-gray-500 hover:text-gray-700 text-2xl font-semibold p-2 rounded-full hover:bg-gray-100"
                    >
                        &times;
                    </button>
                </div>

                {budgetSelectionLoading && <p className="text-center text-gray-600">Loading budgets...</p>}
                {budgetSelectionError && <p className="text-red-600 mb-4">{budgetSelectionError}</p>}
                {!budgetSelectionLoading && availableBudgets.length === 0 && (
                    <p className="text-center text-gray-600">No budgets found. Please create a budget first.</p>
                )}

                {!budgetSelectionLoading && availableBudgets.length > 0 && (
                    <ul className="space-y-4">
                        {availableBudgets.map(budget => (
                            <li key={budget._id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center">
                                <div className="mb-3 md:mb-0">
                                    <h3 className="text-lg font-bold text-gray-800">{budget.budgetName} ({new Date(budget.period.startDate).toLocaleDateString()} - {new Date(budget.period.endDate).toLocaleDateString()})</h3>
                                    <p className="text-gray-600 text-sm">Overall Budget: <span className="font-semibold text-green-700">${budget.overallBudgetAmount.toFixed(2)}</span></p>
                                    <p className="text-gray-600 text-sm">Allocated: <span className="font-semibold text-blue-700">${budget.overallAllocatedAmount.toFixed(2)}</span> | Utilized: <span className="font-semibold text-red-700">${budget.overallUtilizedAmount.toFixed(2)}</span></p>
                                    <p className="text-gray-600 text-sm">Remaining to Allocate: <span className="font-semibold text-indigo-700">${(budget.overallBudgetAmount - budget.overallAllocatedAmount).toFixed(2)}</span> | Remaining to Utilize: <span className="font-semibold text-orange-700">${(budget.overallAllocatedAmount - budget.overallUtilizedAmount).toFixed(2)}</span></p>
                                </div>
                                <div className="flex space-x-2 w-full md:w-auto justify-end">
                                    <button
                                        onClick={() => handleSelectBudgetForPlan(budget._id)}
                                        className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2.5 px-4 rounded-md text-sm transition duration-200 ease-in-out shadow-sm"
                                    >
                                        Select
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default BudgetSelectionModal;