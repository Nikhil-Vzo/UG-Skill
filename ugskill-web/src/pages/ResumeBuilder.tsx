import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Plus, Trash2, FileText, User, Briefcase, GraduationCap, Code as CodeIcon, Save } from 'lucide-react';
import { Card } from '../components/ui/Card';

interface ResumeData {
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    summary: string;
  };
  education: Array<{ id: string; school: string; degree: string; year: string }>;
  experience: Array<{ id: string; company: string; role: string; duration: string; description: string }>;
  projects: Array<{ id: string; name: string; description: string; techStack: string }>;
  skills: string;
}

export const ResumeBuilder = () => {
  const [data, setData] = useState<ResumeData>({
    personalInfo: {
      fullName: 'John Doe',
      email: 'john@example.com',
      phone: '+1 234 567 8900',
      location: 'New York, NY',
      summary: 'Passionate software engineer with 3+ years of experience building scalable web applications.'
    },
    education: [{ id: '1', school: 'University of Technology', degree: 'B.S. Computer Science', year: '2019 - 2023' }],
    experience: [{ id: '1', company: 'Tech Corp', role: 'Frontend Developer', duration: '2023 - Present', description: 'Developed high-performance web applications using React and TypeScript.' }],
    projects: [{ id: '1', name: 'E-commerce Platform', description: 'Built a full-stack e-commerce solution serving 10k+ users.', techStack: 'React, Node.js, MongoDB' }],
    skills: 'JavaScript, TypeScript, React, Node.js, SQL, AWS'
  });

  const [activeTab, setActiveTab] = useState<'personal' | 'education' | 'experience' | 'projects' | 'skills'>('personal');

  const updatePersonalInfo = (field: keyof ResumeData['personalInfo'], value: string) => {
    setData(prev => ({ ...prev, personalInfo: { ...prev.personalInfo, [field]: value } }));
  };

  const addItem = (section: 'education' | 'experience' | 'projects', emptyItem: any) => {
    setData(prev => ({ ...prev, [section]: [...prev[section], { id: Date.now().toString(), ...emptyItem }] }));
  };

  const updateItem = (section: 'education' | 'experience' | 'projects', id: string, field: string, value: string) => {
    setData(prev => ({
      ...prev,
      [section]: prev[section].map((item: any) => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const removeItem = (section: 'education' | 'experience' | 'projects', id: string) => {
    setData(prev => ({ ...prev, [section]: prev[section].filter((item: any) => item.id !== id) }));
  };

  const InputField = ({ label, value, onChange, placeholder = '', multiline = false }: any) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
      <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={4}
          style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: 'var(--text-high)', resize: 'vertical' }}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: 'var(--text-high)' }}
        />
      )}
    </div>
  );

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 80px)', gap: '2rem', padding: '1rem' }}>
      {/* LEFT PANE - Editor */}
      <Card style={{ flex: '1', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.1)', background: 'rgba(20, 20, 25, 0.6)', backdropFilter: 'blur(20px)' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-highest)' }}>Resume Builder</h2>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: 'var(--text-low)' }}>Craft your professional story</p>
          </div>
          <button style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
            <Save size={18} /> Save Progress
          </button>
        </div>

        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', padding: '0 1rem' }}>
          {[
            { id: 'personal', icon: User, label: 'Personal' },
            { id: 'education', icon: GraduationCap, label: 'Education' },
            { id: 'experience', icon: Briefcase, label: 'Experience' },
            { id: 'projects', icon: CodeIcon, label: 'Projects' },
            { id: 'skills', icon: FileText, label: 'Skills' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem', background: 'none', border: 'none',
                color: activeTab === tab.id ? 'var(--primary-glow)' : 'var(--text-low)',
                borderBottom: `2px solid ${activeTab === tab.id ? 'var(--primary-glow)' : 'transparent'}`,
                cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s'
              }}
            >
              <tab.icon size={18} /> {tab.label}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
              {activeTab === 'personal' && (
                <div>
                  <InputField label="Full Name" value={data.personalInfo.fullName} onChange={(v: string) => updatePersonalInfo('fullName', v)} />
                  <InputField label="Email" value={data.personalInfo.email} onChange={(v: string) => updatePersonalInfo('email', v)} />
                  <InputField label="Phone" value={data.personalInfo.phone} onChange={(v: string) => updatePersonalInfo('phone', v)} />
                  <InputField label="Location" value={data.personalInfo.location} onChange={(v: string) => updatePersonalInfo('location', v)} />
                  <InputField label="Professional Summary" value={data.personalInfo.summary} onChange={(v: string) => updatePersonalInfo('summary', v)} multiline />
                </div>
              )}

              {activeTab === 'education' && (
                <div>
                  {data.education.map((edu) => (
                    <div key={edu.id} style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '12px', marginBottom: '1rem', position: 'relative', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <button onClick={() => removeItem('education', edu.id)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer' }}><Trash2 size={18} /></button>
                      <InputField label="School / University" value={edu.school} onChange={(v: string) => updateItem('education', edu.id, 'school', v)} />
                      <InputField label="Degree" value={edu.degree} onChange={(v: string) => updateItem('education', edu.id, 'degree', v)} />
                      <InputField label="Year" value={edu.year} onChange={(v: string) => updateItem('education', edu.id, 'year', v)} />
                    </div>
                  ))}
                  <button onClick={() => addItem('education', { school: '', degree: '', year: '' })} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-high)', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '8px', cursor: 'pointer', width: '100%', justifyContent: 'center' }}>
                    <Plus size={18} /> Add Education
                  </button>
                </div>
              )}

              {activeTab === 'experience' && (
                <div>
                  {data.experience.map((exp) => (
                    <div key={exp.id} style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '12px', marginBottom: '1rem', position: 'relative', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <button onClick={() => removeItem('experience', exp.id)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer' }}><Trash2 size={18} /></button>
                      <InputField label="Company" value={exp.company} onChange={(v: string) => updateItem('experience', exp.id, 'company', v)} />
                      <InputField label="Role" value={exp.role} onChange={(v: string) => updateItem('experience', exp.id, 'role', v)} />
                      <InputField label="Duration" value={exp.duration} onChange={(v: string) => updateItem('experience', exp.id, 'duration', v)} />
                      <InputField label="Description" value={exp.description} onChange={(v: string) => updateItem('experience', exp.id, 'description', v)} multiline />
                    </div>
                  ))}
                  <button onClick={() => addItem('experience', { company: '', role: '', duration: '', description: '' })} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-high)', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '8px', cursor: 'pointer', width: '100%', justifyContent: 'center' }}>
                    <Plus size={18} /> Add Experience
                  </button>
                </div>
              )}

              {activeTab === 'projects' && (
                <div>
                  {data.projects.map((proj) => (
                    <div key={proj.id} style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '12px', marginBottom: '1rem', position: 'relative', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <button onClick={() => removeItem('projects', proj.id)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer' }}><Trash2 size={18} /></button>
                      <InputField label="Project Name" value={proj.name} onChange={(v: string) => updateItem('projects', proj.id, 'name', v)} />
                      <InputField label="Tech Stack" value={proj.techStack} onChange={(v: string) => updateItem('projects', proj.id, 'techStack', v)} />
                      <InputField label="Description" value={proj.description} onChange={(v: string) => updateItem('projects', proj.id, 'description', v)} multiline />
                    </div>
                  ))}
                  <button onClick={() => addItem('projects', { name: '', description: '', techStack: '' })} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-high)', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '8px', cursor: 'pointer', width: '100%', justifyContent: 'center' }}>
                    <Plus size={18} /> Add Project
                  </button>
                </div>
              )}

              {activeTab === 'skills' && (
                <div>
                  <InputField label="Skills (comma separated)" value={data.skills} onChange={(v: string) => setData(prev => ({ ...prev, skills: v }))} multiline />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </Card>

      {/* RIGHT PANE - Preview */}
      <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', background: 'rgba(255, 255, 255, 0.1)', color: 'var(--text-high)', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
            <Download size={18} /> Download PDF
          </button>
        </div>
        
        <div style={{ flex: 1, background: '#fff', borderRadius: '8px', padding: '2rem', overflowY: 'auto', color: '#1a1a1a', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
          {/* Resume A4 Layout */}
          <div style={{ maxWidth: '800px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
            <header style={{ borderBottom: '2px solid #3b82f6', paddingBottom: '1rem', marginBottom: '1.5rem', textAlign: 'center' }}>
              <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '2.5rem', color: '#1e293b', textTransform: 'uppercase', letterSpacing: '2px' }}>{data.personalInfo.fullName || 'YOUR NAME'}</h1>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', color: '#64748b', fontSize: '0.9rem' }}>
                <span>{data.personalInfo.email}</span>
                {data.personalInfo.phone && <span>• {data.personalInfo.phone}</span>}
                {data.personalInfo.location && <span>• {data.personalInfo.location}</span>}
              </div>
            </header>

            {data.personalInfo.summary && (
              <section style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#3b82f6', textTransform: 'uppercase', fontSize: '1.1rem', letterSpacing: '1px' }}>Professional Summary</h3>
                <p style={{ margin: 0, color: '#334155', lineHeight: 1.6 }}>{data.personalInfo.summary}</p>
              </section>
            )}

            {data.experience.length > 0 && (
              <section style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ margin: '0 0 1rem 0', color: '#3b82f6', textTransform: 'uppercase', fontSize: '1.1rem', letterSpacing: '1px' }}>Experience</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {data.experience.map(exp => (
                    <div key={exp.id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b' }}>{exp.role}</h4>
                        <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 600 }}>{exp.duration}</span>
                      </div>
                      <div style={{ color: '#475569', fontWeight: 500, marginBottom: '0.5rem' }}>{exp.company}</div>
                      <p style={{ margin: 0, color: '#334155', lineHeight: 1.6 }}>{exp.description}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {data.education.length > 0 && (
              <section style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ margin: '0 0 1rem 0', color: '#3b82f6', textTransform: 'uppercase', fontSize: '1.1rem', letterSpacing: '1px' }}>Education</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {data.education.map(edu => (
                    <div key={edu.id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b' }}>{edu.school}</h4>
                        <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 600 }}>{edu.year}</span>
                      </div>
                      <div style={{ color: '#475569' }}>{edu.degree}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {data.projects.length > 0 && (
              <section style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ margin: '0 0 1rem 0', color: '#3b82f6', textTransform: 'uppercase', fontSize: '1.1rem', letterSpacing: '1px' }}>Projects</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {data.projects.map(proj => (
                    <div key={proj.id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b' }}>{proj.name}</h4>
                        <span style={{ fontSize: '0.85rem', color: '#3b82f6', background: '#eff6ff', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>{proj.techStack}</span>
                      </div>
                      <p style={{ margin: '0.5rem 0 0 0', color: '#334155', lineHeight: 1.6 }}>{proj.description}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {data.skills && (
              <section>
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#3b82f6', textTransform: 'uppercase', fontSize: '1.1rem', letterSpacing: '1px' }}>Skills</h3>
                <p style={{ margin: 0, color: '#334155', lineHeight: 1.6 }}>{data.skills}</p>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
