import React from 'react';

const DashboardSummaryCards = () => {
  const metrics = [
    { title: 'Active Batches', value: 7, color: 'bg-blue-500', icon: '🐔' },
    { title: 'Completed Batches', value: 45, color: 'bg-green-500', icon: '✅' },
    { title: 'Total Chicks Assigned', value: '45,000', color: 'bg-indigo-500', icon: '🐣' },
    { title: 'Hens Ready for Sale', value: '2,500', color: 'bg-yellow-500', icon: '💰' },
    { title: 'Mortality Rate', value: '6.8%', color: 'bg-red-500', icon: '📉' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
      {metrics.map((metric) => (
        <div key={metric.title} className={`${metric.color} text-white p-6 rounded-xl shadow-lg transform transition duration-300 hover:scale-[1.02]`}>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium opacity-80">{metric.title}</h3>
            <span className="text-3xl">{metric.icon}</span>
          </div>
          <p className="text-4xl font-extrabold mt-2">{metric.value}</p>
        </div>
      ))}
    </div>
  );
};

export default DashboardSummaryCards;   