import React, { useState, useEffect } from 'react';

const EmployeeList = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Replace this URL with your actual MERN backend endpoint (e.g., 'http://localhost:5000/api/employees')
  const API_URL = 'https://jsonplaceholder.typicode.com/users'; 

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Failed to fetch data');
        
        const data = await response.json();
        // Mapping data to match your UI columns
        setEmployees(data); 
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  if (loading) return <div className="p-10 text-blue-600 font-semibold">Loading data...</div>;
  if (error) return <div className="p-10 text-red-500">Error: {error}</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-normal text-center text-gray-800 mb-8">
          Employees List
        </h1>

        <div className="overflow-hidden rounded-xl shadow-sm border border-gray-200">
          <table className="min-w-full bg-white text-left border-collapse">
            {/* Table Header */}
            <thead className="bg-gray-200 text-gray-700">
              <tr>
                <th className="px-4 py-3 font-medium">SL</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Address</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 font-medium">Duration</th>
                <th className="px-4 py-3 font-medium text-center">Salary</th>
                <th className="px-4 py-3 font-medium text-center">Leaves</th>
                <th className="px-4 py-3 font-medium text-center">Penalty</th>
                <th className="px-4 py-3 font-medium text-center">Performance</th>
                <th className="px-4 py-3 font-medium text-center">Bonuses</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-gray-100">
              {employees.map((emp, index) => (
                <tr 
                  key={emp.id} 
                  className={index % 2 === 0 ? 'bg-white' : 'bg-gray-100'}
                >
                  <td className="px-4 py-4 text-gray-600">{index + 1}</td>
                  <td className="px-4 py-4 text-gray-800 font-medium">{emp.name}</td>
                  <td className="px-4 py-4 text-gray-600 text-sm">{emp.address?.city || 'N/A'}</td>
                  <td className="px-4 py-4 text-gray-600 text-sm">2023-01-10</td>
                  <td className="px-4 py-4 text-gray-600 text-sm">1.5 Years</td>
                  <td className="px-4 py-4 text-gray-600 text-center">$4,500</td>
                  <td className="px-4 py-4 text-gray-600 text-center">12</td>
                  <td className="px-4 py-4 text-gray-600 text-center">$0</td>
                  <td className="px-4 py-4 text-gray-600 text-center">Excellent</td>
                  <td className="px-4 py-4 text-gray-600 text-center">$500</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EmployeeList;