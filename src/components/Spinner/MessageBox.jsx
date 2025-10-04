// src/components/MessageBox.js
import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { localization } from '../data/localization'; // নিশ্চিত করুন যে এই পাথটি সঠিক আছে

/**
 * MessageBox component displays a customizable modal dialog.
 * It can be used for alerts, confirmations, or displaying custom content.
 *
 * @param {object} props - Component props.
 * @param {function} ref - Ref forwarded from parent to expose imperative handles.
 * @returns {JSX.Element} The MessageBox component.
 */
const MessageBox = forwardRef((props, ref) => {
    const [isVisible, setIsVisible] = useState(false);
    const [message, setMessage] = useState('');
    const [title, setTitle] = useState(localization.messageBox.title);
    const [isConfirm, setIsConfirm] = useState(false);
    const [resolvePromise, setResolvePromise] = useState(null);

    /**
     * Exposes imperative functions to the parent component.
     * `show` displays the message box.
     */
    useImperativeHandle(ref, () => ({
        show: (msg, confirm = false, customTitle = localization.messageBox.title) => {
            setMessage(msg);
            setIsConfirm(confirm);
            setTitle(customTitle);
            setIsVisible(true);
            return new Promise((resolve) => {
                setResolvePromise(() => resolve);
            });
        },
    }));

    /**
     * Handles the confirmation action.
     * Closes the message box and resolves the promise with true.
     */
    const handleConfirm = () => {
        setIsVisible(false);
        if (resolvePromise) {
            resolvePromise(true);
        }
    };

    /**
     * Handles the cancel action.
     * Closes the message box and resolves the promise with false.
     */
    const handleCancel = () => {
        setIsVisible(false);
        if (resolvePromise) {
            resolvePromise(false);
        }
    };

    if (!isVisible) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl transform transition-all duration-300 scale-100">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 border-b pb-2">{title}</h3>
                <p className="text-gray-700 mb-6">{message}</p>
                <div className="flex justify-end space-x-3">
                    {isConfirm && (
                        <button
                            onClick={handleCancel}
                            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
                        >
                            {localization.messageBox.cancelText}
                        </button>
                    )}
                    <button
                        onClick={handleConfirm}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                    >
                        {localization.messageBox.confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
});

export default MessageBox;
