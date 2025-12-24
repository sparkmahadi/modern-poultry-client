import React from 'react';

const DashboardSummaryCards = ({ stats }) => {
  // Destructure with default values to prevent errors if stats is undefined
  const {
    activeBatches = 0,
    activeChicks = 0,
    completedBatches = 0,
    completedChicks = 0,
    readyChicks = 0
  } = stats || {};

  const metrics = [
    { 
      title: 'Active Batches', 
      value: activeBatches.toLocaleString(), 
      color: 'bg-blue-600', 
      icon: '🐔' 
    },
    { 
      title: 'Completed Batches', 
      value: completedBatches.toLocaleString(), 
      color: 'bg-green-600', 
      icon: '✅' 
    },
    { 
      title: 'Active Chicks', 
      value: activeChicks.toLocaleString(), 
      color: 'bg-indigo-600', 
      icon: '🐣' 
    },
    { 
      title: 'Ready (Next 3 Days)', 
      value: readyChicks.toLocaleString(), 
      color: 'bg-yellow-500', 
      icon: '⏳' 
    },
    { 
      title: 'Completed Chicks', 
      value: completedChicks.toLocaleString(), 
      color: 'bg-orange-500', 
      icon: '📊' 
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
      {metrics.map((metric) => (
        <div 
          key={metric.title} 
          className={`${metric.color} text-white p-6 rounded-xl shadow-lg transform transition duration-300 hover:scale-[1.02] flex flex-col justify-between`}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium uppercase tracking-wider opacity-90">{metric.title}</h3>
            <span className="text-2xl">{metric.icon}</span>
          </div>
          <p className="text-3xl font-extrabold mt-4">{metric.value}</p>
        </div>
      ))}
    </div>
  );
};

export default DashboardSummaryCards;