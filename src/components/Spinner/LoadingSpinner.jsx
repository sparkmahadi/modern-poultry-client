// src/components/LoadingSpinner.js
import React from 'react';

/**
 * LoadingSpinner component displays a simple animated spinner.
 * It's used to indicate that content is being loaded or an operation is in progress.
 *
 * @returns {JSX.Element} The LoadingSpinner component.
 */
const LoadingSpinner = () => {
    return (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
        </div>
    );
};

export default LoadingSpinner;
