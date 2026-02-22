import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Loader2, ArrowLeft, ChevronDown, ChevronRight, PlayCircle, FileText, Paperclip, CheckCircle } from 'lucide-react';
import { getPurchasedCourse } from '../../lib/api/buyer';
import type { Lesson } from '../../lib/api/products';
import ReactMarkdown from 'react-markdown';

export const CoursePlayer = () => {
    const { productId } = useParams<{ productId: string }>();
    const navigate = useNavigate();

    const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
    const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
    const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());

    const { data: course, isLoading, error } = useQuery({
        queryKey: ['buyer-course', productId],
        queryFn: () => getPurchasedCourse(productId!),
        enabled: !!productId,
        retry: 1
    });

    // Auto-select first lesson on load
    useEffect(() => {
        if (course?.modules && course.modules.length > 0 && !activeLesson) {
            // Find first module with lessons
            for (const mod of course.modules) {
                if (mod.lessons && mod.lessons.length > 0) {
                    setActiveLesson(mod.lessons[0]);
                    setExpandedModules(new Set([mod.id]));
                    break;
                }
            }
        }
    }, [course, activeLesson]);

    const toggleModule = (moduleId: string) => {
        const next = new Set(expandedModules);
        if (next.has(moduleId)) next.delete(moduleId);
        else next.add(moduleId);
        setExpandedModules(next);
    };

    const toggleCompletion = (lessonId: string) => {
        const next = new Set(completedLessons);
        if (next.has(lessonId)) next.delete(lessonId);
        else next.add(lessonId);
        setCompletedLessons(next);
        // In a real app, this would hit an API endpoint to save progress permanently
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (error || !course) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md">
                    <div className="w-16 h-16 bg-red-50 text-red-500 flex items-center justify-center rounded-full mx-auto mb-4">
                        <ArrowLeft className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-bold font-heading mb-2">Access Denied</h2>
                    <p className="text-slate-600 mb-6">You either haven't purchased this course or the creator has un-published it.</p>
                    <button
                        onClick={() => navigate('/purchases')}
                        className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition"
                    >
                        Back to Library
                    </button>
                </div>
            </div>
        );
    }

    const renderLessonIcon = (type: string) => {
        switch (type) {
            case 'video': return <PlayCircle className="w-4 h-4" />;
            case 'text': return <FileText className="w-4 h-4" />;
            case 'attachment': return <Paperclip className="w-4 h-4" />;
            default: return <FileText className="w-4 h-4" />;
        }
    };

    const renderContent = () => {
        if (!activeLesson) return (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <PlayCircle className="w-16 h-16 mb-4 opacity-50" />
                <p>Select a lesson from the curriculum</p>
            </div>
        );

        return (
            <div className="max-w-4xl mx-auto w-full pb-24">
                {activeLesson.type === 'video' && (
                    <div className="bg-black aspect-video rounded-xl overflow-hidden mb-8 shadow-lg relative">
                        {/* Assuming the content is a direct presigned URL / MP4 stream. If it's a Youtube embed, we'd use an iframe. */}
                        {activeLesson.content.includes('youtube.com') || activeLesson.content.includes('vimeo.com') ? (
                            <iframe
                                src={activeLesson.content}
                                className="w-full h-full border-0 absolute top-0 left-0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        ) : (
                            <video
                                src={activeLesson.content}
                                controls
                                className="w-full h-full object-contain"
                                controlsList="nodownload"
                                onEnded={() => setCompletedLessons(prev => new Set(prev).add(activeLesson.id))}
                            />
                        )}
                    </div>
                )}

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
                    <div className="flex justify-between items-start mb-6 pb-6 border-b border-slate-100">
                        <div>
                            <h1 className="text-3xl font-bold font-heading text-slate-900 mb-2">{activeLesson.title}</h1>
                            <div className="flex items-center text-sm font-medium text-slate-500 gap-4">
                                <span className="uppercase tracking-wider">{activeLesson.type}</span>
                                {activeLesson.duration_minutes && <span>{activeLesson.duration_minutes} min</span>}
                            </div>
                        </div>

                        <button
                            onClick={() => toggleCompletion(activeLesson.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-colors border ${completedLessons.has(activeLesson.id)
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'
                                }`}
                        >
                            <CheckCircle className={`w-5 h-5 ${completedLessons.has(activeLesson.id) ? 'text-emerald-500' : 'text-slate-400'}`} />
                            {completedLessons.has(activeLesson.id) ? 'Completed' : 'Mark Complete'}
                        </button>
                    </div>

                    <div className="prose prose-slate max-w-none">
                        {activeLesson.type === 'text' && (
                            <ReactMarkdown>{activeLesson.content}</ReactMarkdown>
                        )}

                        {activeLesson.type === 'attachment' && (
                            <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-6 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-indigo-100 flex items-center justify-center rounded-lg text-indigo-600">
                                        <Paperclip className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-900">Downloadable Resource</h3>
                                        <p className="text-sm text-slate-600">Required material for this lesson</p>
                                    </div>
                                </div>
                                <a
                                    href={activeLesson.content}
                                    download
                                    target="_blank"
                                    rel="noreferrer"
                                    className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition"
                                >
                                    Download
                                </a>
                            </div>
                        )}

                        {activeLesson.type === 'video' && !activeLesson.content.includes('youtube.com') && (
                            <p className="text-slate-600 italic mt-8">Watch the video above for this lesson. Notes will appear here if the creator updates the course.</p>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // Calculate generic progress
    const totalLessons = course.modules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0);
    const progressPercent = totalLessons === 0 ? 0 : Math.round((completedLessons.size / totalLessons) * 100);

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
            {/* Sidebar Curriculum */}
            <aside className="w-80 border-r border-slate-200 bg-white flex flex-col shrink-0">
                <div className="p-4 border-b border-slate-100">
                    <button
                        onClick={() => navigate('/purchases')}
                        className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors mb-4"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
                    </button>
                    <h2 className="text-lg font-bold font-heading text-slate-900 leading-tight">Course Viewer</h2>

                    <div className="mt-4">
                        <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1">
                            <span>Your Progress</span>
                            <span>{progressPercent}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                    {course.modules.length === 0 && (
                        <div className="text-sm text-slate-500 text-center p-4">No modules found.</div>
                    )}
                    {course.modules.map((mod, index) => {
                        const isExpanded = expandedModules.has(mod.id);
                        return (
                            <div key={mod.id} className="border border-slate-200 rounded-lg overflow-hidden">
                                <button
                                    onClick={() => toggleModule(mod.id)}
                                    className="w-full flex items-center p-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                                >
                                    <div className="mr-3 text-slate-400">
                                        {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                                    </div>
                                    <div className="flex-1 text-sm font-bold text-slate-800">
                                        <span className="text-slate-400 font-medium mr-2">{(index + 1).toString().padStart(2, '0')}</span>
                                        {mod.title}
                                    </div>
                                    <div className="text-xs text-slate-400 font-medium">{mod.lessons?.length || 0} Lessons</div>
                                </button>

                                {isExpanded && (
                                    <div className="bg-white">
                                        {mod.lessons?.map((les, lIndex) => {
                                            const isSelected = activeLesson?.id === les.id;
                                            const isCompleted = completedLessons.has(les.id);
                                            return (
                                                <button
                                                    key={les.id}
                                                    onClick={() => setActiveLesson(les)}
                                                    className={`w-full flex items-center p-3 text-sm text-left border-l-2 transition-all group ${isSelected
                                                        ? 'border-indigo-600 bg-indigo-50 text-indigo-900'
                                                        : 'border-transparent text-slate-600 hover:bg-slate-50'
                                                        }`}
                                                >
                                                    <div className="w-6 h-6 shrink-0 flex items-center justify-center mr-3">
                                                        {isCompleted ? (
                                                            <CheckCircle className="w-5 h-5 text-emerald-500" />
                                                        ) : (
                                                            <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-indigo-400' : 'bg-slate-300 group-hover:bg-slate-400'}`} />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 truncate pr-2">
                                                        {(lIndex + 1)}. {les.title}
                                                    </div>
                                                    <div className={`${isSelected ? 'text-indigo-600' : 'text-slate-400'}`}>
                                                        {renderLessonIcon(les.type)}
                                                    </div>
                                                </button>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto bg-slate-50/50">
                <div className="p-8 h-full">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
};
