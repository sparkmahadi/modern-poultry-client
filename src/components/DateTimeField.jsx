import { Calendar } from "lucide-react";

const DateTimeField = ({
    value,
    onChange,
    label = "Date & Time",
    className = "",
}) => {
    return (
        <div className={className}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                </label>
            )}

            <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded border border-slate-200">
                <Calendar className="w-5 h-5 text-slate-400" />

                <input
                    type="datetime-local"
                    value={value || ""}
                    onChange={(e) => onChange(e.target.value)}
                    className="bg-transparent w-full outline-none text-slate-700"
                />
            </div>
        </div>
    );
};

export default DateTimeField;