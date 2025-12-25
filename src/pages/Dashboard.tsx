import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Clock, Layout, FileText, ArrowRight, MoreHorizontal, Trash2 } from 'lucide-react';
import { saveProject, deleteProjectData } from '../utils/db';
import { useUI } from '../context/UIContext';
import { motion, AnimatePresence } from 'framer-motion';

// Mock template data for selection
const TEMPLATES = [
  {
    id: 'classic-cover',
    name: 'Classic Editorial',
    category: 'Cover',
    description: 'Traditional layout with hero imagery and bold serif headlines.',
    previewColor: 'bg-[#FAF9F4]',
    previewImage: '/magazine/previews/classic.png'
  },
  {
    id: 'impact-bold',
    name: 'Impact Bold',
    category: 'Cover',
    description: 'Full-bleed imagery with high-contrast typography.',
    previewColor: 'bg-slate-50',
    previewImage: '/magazine/previews/impact.png'
  },
  {
    id: 'cinematic',
    name: 'Cinematic 16:9',
    category: 'Cover',
    description: 'Letterboxed 16:9 frame for epic scenic photography.',
    previewColor: 'bg-slate-50',
    previewImage: '/magazine/previews/cinematic.png'
  },
  {
    id: 'blueprint',
    name: 'Industrial Blueprint',
    category: 'Cover',
    description: 'Engineering style with grids, technical labels and monospace.',
    previewColor: 'bg-slate-50',
    previewImage: '/magazine/previews/blueprints.png'
  },
  {
    id: 'tabloid',
    name: 'Tabloid News',
    category: 'Cover',
    description: 'Aggressive, skewed typography with bold highlight blocks.',
    previewColor: 'bg-slate-50',
    previewImage: '/magazine/previews/tabloid.png'
  },
  {
    id: 'typography',
    name: 'Typographic Poster',
    category: 'Cover',
    description: 'Clean Swiss-style layout focusing on massive text graphics.',
    previewColor: 'bg-slate-50',
    previewImage: '/magazine/previews/typography.png'
  },
  {
    id: 'classic-article',
    name: 'Modern Split',
    category: 'Article',
    description: 'Optimized dual-column bilingual reading experience.',
    previewColor: 'bg-slate-50',
    previewImage: '/magazine/previews/modern.png'
  },
];

const RECENT_PROJECTS_KEY = 'magazine_recent_projects';

export default function Dashboard() {
  const navigate = useNavigate();
  const { alert, confirm } = useUI();
  const [recentProjects, setRecentProjects] = useState<any[]>([]);
  const [isTemplatesExpanded, setIsExpanded] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem(RECENT_PROJECTS_KEY);
    if (saved) {
      setRecentProjects(JSON.parse(saved));
    }
  }, []);

  const handleImportProject = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const project = JSON.parse(event.target?.result as string);
        const projectId = `proj-${Date.now()}`;
        
        // 1. Save full project data to IndexedDB
        await saveProject(projectId, {
          ...project,
          id: projectId,
          lastEdited: new Date().toISOString()
        });

        // 2. Update summary index
        const projectSummary = {
          id: projectId,
          title: project.pages?.[0]?.titleEn || 'Imported Project',
          date: new Date().toLocaleDateString(),
          type: project.pages?.[0]?.layoutId || project.pages?.[0]?.type || 'Imported'
        };

        const updated = [projectSummary, ...recentProjects];
        setRecentProjects(updated);
        localStorage.setItem(RECENT_PROJECTS_KEY, JSON.stringify(updated.slice(0, 10)));
        
        // Navigate to the editor immediately
        navigate(`/editor/${projectId}`);
      } catch (err) {
        console.error("Import failed:", err);
        alert("Import Error", "Failed to import project. Invalid file format.");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCreateNew = (templateId: string) => {
    const newProjectId = `proj-${Date.now()}`;
    navigate(`/editor/${newProjectId}?template=${templateId}`);
  };

  const deleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    confirm(
      "Delete Project",
      "Are you sure you want to delete this project? This action cannot be undone.",
      async () => {
        const updated = recentProjects.filter(p => p.id !== id);
        setRecentProjects(updated);
        localStorage.setItem(RECENT_PROJECTS_KEY, JSON.stringify(updated));
        await deleteProjectData(id);
      }
    );
  };

  const visibleTemplates = isTemplatesExpanded ? TEMPLATES : TEMPLATES.slice(0, 4);

  return (
    <div className="min-h-screen bg-[#F8F9FC] font-sans text-slate-800">
      <nav className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#264376] rounded-lg flex items-center justify-center text-white font-black shadow-lg shadow-[#264376]/20 text-xs">M</div>
          <span className="font-black text-lg tracking-widest text-slate-900 uppercase">MagaEditor</span>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-8 py-12 space-y-16">
        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-black uppercase tracking-widest flex items-center gap-3">
              <Plus className="text-[#264376]" size={20} />
              New Project
            </h2>
            {TEMPLATES.length > 4 && (
              <button 
                onClick={() => setIsExpanded(!isTemplatesExpanded)}
                className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[#264376] hover:bg-[#264376]/5 rounded-xl transition-all"
              >
                {isTemplatesExpanded ? 'Show Less' : `View All Templates (${TEMPLATES.length})`}
                <ArrowRight size={14} className={`transition-transform duration-300 ${isTemplatesExpanded ? '-rotate-90' : 'rotate-0'}`} />
              </button>
            )}
          </div>

          <motion.div 
            initial="hidden"
            animate="visible"
            variants={{
              visible: { transition: { staggerChildren: 0.05 } }
            }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {visibleTemplates.map((template) => (
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 }
                }}
                key={template.id}
                onClick={() => handleCreateNew(template.id)}
                className="group bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 cursor-pointer flex flex-col h-[420px]"
              >
                <div className={`h-[320px] ${template.previewColor} relative border-b border-slate-50 flex items-center justify-center overflow-hidden`}>
                  {/* Type Badge */}
                  <div className="absolute top-4 left-4 z-20">
                    <span className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest shadow-sm ${
                      template.category === 'Cover' ? 'bg-slate-900 text-white' : 'bg-blue-600 text-white'
                    }`}>
                      {template.category}
                    </span>
                  </div>

                  {/* Floating Page Preview */}
                  <div className="relative w-44 h-[248px] bg-white rounded-sm shadow-2xl overflow-hidden transform rotate-[-2deg] group-hover:rotate-0 group-hover:scale-105 transition-all duration-700 border border-slate-100/50">
                    {template.previewImage ? (
                      <img 
                        src={template.previewImage} 
                        className="w-full h-full object-cover object-top opacity-95 group-hover:opacity-100 transition-all" 
                        alt={template.name}
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-50/50 flex flex-col gap-3 p-4">
                        <div className="h-3 w-full bg-slate-200 rounded-full" />
                        <div className="h-3 w-2/3 bg-slate-200 rounded-full" />
                        <div className="mt-auto h-24 w-full bg-slate-100 rounded" />
                      </div>
                    )}
                  </div>

                  {/* Overlay Button */}
                  <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/5 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <span className="bg-white text-[#264376] px-6 py-2.5 rounded-full shadow-2xl text-[10px] font-black uppercase tracking-widest scale-90 group-hover:scale-100 transition-transform">Use Template</span>
                  </div>
                </div>
                <div className="p-6 flex-1 flex flex-col justify-center">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-black text-xs uppercase tracking-widest text-slate-900">{template.name}</h3>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed line-clamp-2 font-medium italic">{template.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Clock className="text-slate-300" size={20} />
              <h2 className="text-xl font-black uppercase tracking-widest text-slate-900">Recent Works</h2>
            </div>
            
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#264376] hover:bg-slate-50 hover:border-[#264376]/30 transition-all shadow-sm active:scale-95"
            >
              <FileText size={14} />
              Import Project
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".wdzmaga" 
              onChange={handleImportProject} 
            />
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {recentProjects.length > 0 ? (
              <div className="divide-y divide-slate-50">
                <AnimatePresence initial={false}>
                  {recentProjects.map((project, idx) => (
                    <motion.div 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: idx * 0.03 }}
                      key={project.id} 
                      onClick={() => navigate(`/editor/${project.id}`)}
                      className="group flex items-center justify-between p-5 hover:bg-slate-50/50 transition-all cursor-pointer"
                    >
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-xl bg-[#264376]/5 text-[#264376] flex items-center justify-center group-hover:bg-[#264376] group-hover:text-white transition-all duration-500">
                        <FileText size={24} />
                      </div>
                      <div>
                        <h4 className="font-black text-sm text-slate-900 group-hover:text-[#264376] transition-colors tracking-tight">{project.title}</h4>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Edited {project.date}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-200" />
                          <span className="text-[10px] font-black text-[#264376] uppercase tracking-widest opacity-60">{project.type}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all">
                      <button className="p-2 text-slate-300 hover:text-red-500 rounded-xl hover:bg-red-50 transition-all">
                        <Trash2 size={18} onClick={(e) => deleteProject(project.id, e)} />
                      </button>
                      <div className="p-2 text-[#264376]">
                        <ArrowRight size={20} />
                      </div>
                    </div>
                  </motion.div>
                ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="p-20 text-center flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-200">
                  <Layout size={32} />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">Your creative journey starts here</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}