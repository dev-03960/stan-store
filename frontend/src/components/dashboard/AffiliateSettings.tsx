import React from 'react';
import { Percent } from 'lucide-react';

export interface AffiliateConfig {
    enabled: boolean;
    commission_rate: number;
}

interface AffiliateSettingsProps {
    config?: AffiliateConfig;
    onChange: (config: AffiliateConfig) => void;
}

export const AffiliateSettings: React.FC<AffiliateSettingsProps> = ({ config, onChange }) => {
    const isEnabled = config?.enabled || false;
    const rate = config?.commission_rate || 10;

    return (
        <div className="pt-6 border-t border-slate-100">
            <h3 className="text-lg font-bold font-heading mb-4 text-slate-900">Affiliate Program</h3>
            <p className="text-sm text-slate-500 mb-6">
                Turn your biggest fans into your best marketers. Allow others to promote this product and earn a commission on every sale they drive.
            </p>

            <div className={`p-5 rounded-xl border-2 transition-all ${isEnabled ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-200 hover:border-slate-300'}`}>
                <div className="flex items-start justify-between">
                    <div>
                        <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                            <Percent className="w-4 h-4 text-indigo-600" />
                            Enable Affiliate Commissions
                        </h4>
                        <p className="text-sm text-slate-500 mt-1">
                            When enabled, partners can generate tracking links.
                        </p>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={isEnabled}
                            onChange={(e) => onChange({ enabled: e.target.checked, commission_rate: rate })}
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                </div>

                {isEnabled && (
                    <div className="mt-6 pt-5 border-t border-indigo-100/60 animate-in fade-in slide-in-from-top-4 duration-300">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Commission Rate (%)
                        </label>
                        <div className="flex items-center gap-3">
                            <input
                                type="number"
                                min="1"
                                max="100"
                                className="w-24 p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                value={rate}
                                onChange={(e) => onChange({ enabled: true, commission_rate: Number(e.target.value) })}
                            />
                            <span className="text-sm text-slate-500">% of product price</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-2">
                            A minimum rate of 10% is recommended.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
