import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, GripVertical, Settings, Trash2, FileText, Paperclip, ChevronDown, ChevronRight, PlayCircle, Loader2 } from 'lucide-react';
import { getCourse, createModule, deleteModule, deleteLesson, reorderCourseStructure } from '../../lib/api/products';
import type { Module, Lesson } from '../../lib/api/products';
import { LessonModal } from './LessonModal';

interface CourseBuilderProps {
    productId: string;
}

export const CourseBuilder: React.FC<CourseBuilderProps> = ({ productId }) => {
    const queryClient = useQueryClient();
    const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

    // Modal state
    const [lessonModal, setLessonModal] = useState<{
        isOpen: boolean;
        moduleId: string;
        lesson?: Lesson; // If undefined, creating new
    }>({ isOpen: false, moduleId: '' });

    const { data: course, isLoading } = useQuery({
        queryKey: ['course', productId],
        queryFn: () => getCourse(productId),
        retry: 1, // Will fail fast if no course structure exists yet
    });

    const createModMutation = useMutation({
        mutationFn: (title: string) => createModule(productId, title, course?.modules.length || 0),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['course', productId] }),
    });

    const deleteModMutation = useMutation({
        mutationFn: (moduleId: string) => deleteModule(productId, moduleId),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['course', productId] }),
    });

    const reorderMutation = useMutation({
        mutationFn: (newModules: Module[]) => reorderCourseStructure(productId, newModules),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['course', productId] }),
    });

    const deleteLesMutation = useMutation({
        mutationFn: ({ moduleId, lessonId }: { moduleId: string, lessonId: string }) => deleteLesson(productId, moduleId, lessonId),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['course', productId] }),
    });

    const toggleModule = (moduleId: string) => {
        const next = new Set(expandedModules);
        if (next.has(moduleId)) next.delete(moduleId);
        else next.add(moduleId);
        setExpandedModules(next);
    };

    const handleAddModule = () => {
        const title = window.prompt("Enter module title:");
        if (title) createModMutation.mutate(title);
    };

    const handleDragEnd = (result: any) => {
        if (!result.destination || !course) return;
        const { source, destination, type } = result;

        // Clone the deep course structure to avoid direct mutation
        const newModules = JSON.parse(JSON.stringify(course.modules));

        if (type === 'module') {
            const [removed] = newModules.splice(source.index, 1);
            newModules.splice(destination.index, 0, removed);
            // Re-assign sort orders
            newModules.forEach((m: any, idx: number) => m.sort_order = idx);
        } else if (type === 'lesson') {
            const sourceModIdx = newModules.findIndex((m: any) => m.id === source.droppableId);
            const destModIdx = newModules.findIndex((m: any) => m.id === destination.droppableId);

            if (sourceModIdx !== -1 && destModIdx !== -1) {
                const [removed] = newModules[sourceModIdx].lessons.splice(source.index, 1);
                newModules[destModIdx].lessons.splice(destination.index, 0, removed);
                // Re-assign sort orders
                newModules[sourceModIdx].lessons.forEach((l: any, idx: number) => l.sort_order = idx);
                if (sourceModIdx !== destModIdx) {
                    newModules[destModIdx].lessons.forEach((l: any, idx: number) => l.sort_order = idx);
                }
            }
        }

        // Optimistically update cache and fire mutation
        queryClient.setQueryData(['course', productId], { ...course, modules: newModules });
        reorderMutation.mutate(newModules);
    };

    if (isLoading) return <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;

    const modules = course?.modules || [];

    return (
        <div className="space-y-4">
            <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="course-modules" type="module">
                    {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                            {modules.map((mod, index) => {
                                const isExpanded = expandedModules.has(mod.id);
                                return (
                                    <Draggable key={mod.id} draggableId={mod.id} index={index}>
                                        {(provided) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                className="border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm"
                                            >
                                                {/* Module Header */}
                                                <div className="flex items-center p-3 bg-slate-50 border-b border-slate-100 group">
                                                    <div {...provided.dragHandleProps} className="p-1.5 text-slate-400 hover:text-slate-600 cursor-grab active:cursor-grabbing">
                                                        <GripVertical className="w-5 h-5" />
                                                    </div>
                                                    <button onClick={() => toggleModule(mod.id)} className="flex items-center p-1 text-slate-500 hover:text-slate-800 transition-colors">
                                                        {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                                                    </button>
                                                    <div className="ml-2 font-medium text-slate-800 flex-1">{mod.title}</div>

                                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setLessonModal({ isOpen: true, moduleId: mod.id }); }}
                                                            className="text-indigo-600 hover:text-indigo-800 p-1 flex items-center text-xs font-semibold uppercase tracking-wider bg-indigo-50 hover:bg-indigo-100 rounded px-2"
                                                        >
                                                            <Plus className="w-3 h-3 mr-1" /> Add Lesson
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); if (confirm('Delete module and all its lessons?')) deleteModMutation.mutate(mod.id); }}
                                                            className="text-red-400 hover:text-red-600 p-1"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Lessons List within Module */}
                                                {isExpanded && (
                                                    <Droppable droppableId={mod.id} type="lesson">
                                                        {(provided) => (
                                                            <div {...provided.droppableProps} ref={provided.innerRef} className="p-2 min-h-[50px] bg-slate-50">
                                                                {mod.lessons?.length === 0 && (
                                                                    <div className="text-center p-4 text-sm text-slate-500 border-2 border-dashed border-slate-200 rounded mt-1">
                                                                        No lessons yet. Click "Add Lesson".
                                                                    </div>
                                                                )}
                                                                {mod.lessons?.map((les, lIndex) => (
                                                                    <Draggable key={les.id} draggableId={les.id} index={lIndex}>
                                                                        {(provided, snapshot) => (
                                                                            <div
                                                                                ref={provided.innerRef}
                                                                                {...provided.draggableProps}
                                                                                className={`flex items-center p-2 mb-2 bg-white border outline-none rounded-md shadow-sm transition-shadow ${snapshot.isDragging ? 'shadow-lg border-indigo-300 ring-2 ring-indigo-500/20' : 'border-slate-200 hover:border-slate-300'}`}
                                                                            >
                                                                                <div {...provided.dragHandleProps} className="p-1 mr-2 text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing">
                                                                                    <GripVertical className="w-4 h-4" />
                                                                                </div>
                                                                                <div className="text-slate-400 mr-3">
                                                                                    {les.type === 'video' && <PlayCircle className="w-4 h-4 text-indigo-500" />}
                                                                                    {les.type === 'text' && <FileText className="w-4 h-4 text-emerald-500" />}
                                                                                    {les.type === 'attachment' && <Paperclip className="w-4 h-4 text-orange-400" />}
                                                                                </div>
                                                                                <div className="flex-1 font-medium text-sm text-slate-700">{les.title}</div>
                                                                                <div className="text-xs text-slate-400 mr-4 font-medium uppercase tracking-wider">{les.type}</div>

                                                                                <div className="flex bg-slate-50 rounded-md border border-slate-100">
                                                                                    <button onClick={(e) => { e.stopPropagation(); setLessonModal({ isOpen: true, moduleId: mod.id, lesson: les }); }} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors border-r border-slate-100 rounded-l-md"><Settings className="w-4 h-4" /></button>
                                                                                    <button onClick={(e) => { e.stopPropagation(); if (confirm('Delete lesson?')) deleteLesMutation.mutate({ moduleId: mod.id, lessonId: les.id }); }} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors rounded-r-md"><Trash2 className="w-4 h-4" /></button>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </Draggable>
                                                                ))}
                                                                {provided.placeholder}
                                                            </div>
                                                        )}
                                                    </Droppable>
                                                )}
                                            </div>
                                        )}
                                    </Draggable>
                                );
                            })}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>

            <button
                onClick={handleAddModule}
                className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 font-medium hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all flex items-center justify-center gap-2"
            >
                <Plus className="w-5 h-5" />
                Add New Module
            </button>

            {lessonModal.isOpen && (
                <LessonModal
                    productId={productId}
                    moduleId={lessonModal.moduleId}
                    lesson={lessonModal.lesson}
                    onClose={() => setLessonModal({ isOpen: false, moduleId: '' })}
                />
            )}
        </div>
    );
};
