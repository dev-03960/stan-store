import React from 'react';
import type { AvailabilityWindow } from '../../lib/api/store';
import { Plus, Trash2 } from 'lucide-react';

interface CoachingSettingsProps {
    duration_minutes: number;
    timezone: string;
    cancellation_window_hours: number;
    availability: AvailabilityWindow[];
    onChange: (updates: Partial<{
        duration_minutes: number;
        timezone: string;
        cancellation_window_hours: number;
        availability: AvailabilityWindow[];
    }>) => void;
}

const DAYS_OF_WEEK = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

export const CoachingSettings: React.FC<CoachingSettingsProps> = ({
    duration_minutes,
    timezone,
    cancellation_window_hours,
    availability,
    onChange
}) => {

    const handleAddWindow = () => {
        onChange({
            availability: [...(availability || []), { day_of_week: 1, start_time: '09:00', end_time: '17:00' }]
        });
    };

    const handleRemoveWindow = (index: number) => {
        const updated = [...(availability || [])];
        updated.splice(index, 1);
        onChange({ availability: updated });
    };

    const handleWindowChange = (index: number, field: keyof AvailabilityWindow, value: any) => {
        const updated = [...(availability || [])];
        updated[index] = { ...updated[index], [field]: value };
        onChange({ availability: updated });
    };

    return (
        <div className="space-y-6 mt-6 border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900">Coaching & Schedule Settings</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Duration (Minutes)</label>
                    <select
                        value={duration_minutes || 30}
                        onChange={(e) => onChange({ duration_minutes: parseInt(e.target.value) })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                    >
                        <option value={15}>15 Minutes</option>
                        <option value={30}>30 Minutes</option>
                        <option value={45}>45 Minutes</option>
                        <option value={60}>60 Minutes</option>
                        <option value={90}>90 Minutes</option>
                        <option value={120}>2 Hours</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Timezone</label>
                    <select
                        value={timezone || Intl.DateTimeFormat().resolvedOptions().timeZone}
                        onChange={(e) => onChange({ timezone: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                    >
                        <option value="America/Los_Angeles">Pacific Time (PT)</option>
                        <option value="America/Denver">Mountain Time (MT)</option>
                        <option value="America/Chicago">Central Time (CT)</option>
                        <option value="America/New_York">Eastern Time (ET)</option>
                        <option value="UTC">UTC</option>
                        <option value="Europe/London">London</option>
                        <option value="Asia/Kolkata">India Standard Time (IST)</option>
                        <option value="Australia/Sydney">Sydney</option>
                        {/* More timezones can be added here, grabbing users local default is best */}
                        {Intl.DateTimeFormat().resolvedOptions().timeZone && (
                            <option value={Intl.DateTimeFormat().resolvedOptions().timeZone}>
                                {Intl.DateTimeFormat().resolvedOptions().timeZone} (Local)
                            </option>
                        )}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Cancellation Window (Hours)</label>
                    <input
                        type="number"
                        min="0"
                        value={cancellation_window_hours || 24}
                        onChange={(e) => onChange({ cancellation_window_hours: parseInt(e.target.value) })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                    />
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700">Weekly Availability</label>
                    <button
                        type="button"
                        onClick={handleAddWindow}
                        className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-500"
                    >
                        <Plus size={16} className="mr-1" /> Add Window
                    </button>
                </div>

                {(!availability || availability.length === 0) && (
                    <p className="text-sm text-gray-500 italic">No availability set. Add a window to allow bookings.</p>
                )}

                {availability?.map((window, index) => (
                    <div key={index} className="flex items-center gap-3 bg-gray-50 p-3 rounded-md">
                        <select
                            value={window.day_of_week}
                            onChange={(e) => handleWindowChange(index, 'day_of_week', parseInt(e.target.value))}
                            className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                        >
                            {DAYS_OF_WEEK.map((day, i) => (
                                <option key={i} value={i}>{day}</option>
                            ))}
                        </select>

                        <input
                            type="time"
                            value={window.start_time}
                            onChange={(e) => handleWindowChange(index, 'start_time', e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                        />
                        <span className="text-gray-500">to</span>
                        <input
                            type="time"
                            value={window.end_time}
                            onChange={(e) => handleWindowChange(index, 'end_time', e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                        />

                        <button
                            type="button"
                            onClick={() => handleRemoveWindow(index)}
                            className="text-red-500 hover:text-red-700 p-2"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};
