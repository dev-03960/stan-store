import React from 'react';

const StoreSkeleton: React.FC = () => {
    return (
        <div className="min-h-screen bg-slate-50 pb-20 animate-pulse">
            <main className="container mx-auto px-4 max-w-3xl">
                {/* Header Skeleton */}
                <div className="flex flex-col items-center text-center py-8 px-4 max-w-2xl mx-auto">
                    <div className="w-24 h-24 rounded-full bg-slate-200 mb-4 border-2 border-slate-100" />
                    <div className="h-8 w-48 bg-slate-200 rounded mb-2" />
                    <div className="h-4 w-64 bg-slate-200 rounded mb-6" />

                    <div className="flex gap-4 mb-2">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="w-9 h-9 rounded-full bg-slate-200" />
                        ))}
                    </div>
                </div>

                {/* Products Skeleton */}
                <div className="mt-6 space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="block w-full max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                            <div className="flex p-4 items-center gap-4">
                                <div className="w-20 h-20 rounded-lg bg-slate-200 flex-shrink-0" />

                                <div className="flex-1 min-w-0 space-y-2">
                                    <div className="h-6 w-3/4 bg-slate-200 rounded" />
                                    <div className="h-4 w-1/2 bg-slate-200 rounded" />
                                    <div className="h-5 w-16 bg-slate-200 rounded" />
                                </div>

                                <div className="flex-shrink-0 flex flex-col items-end gap-3">
                                    <div className="h-6 w-16 bg-slate-200 rounded" />
                                    <div className="w-9 h-9 rounded-full bg-slate-200" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default StoreSkeleton;
