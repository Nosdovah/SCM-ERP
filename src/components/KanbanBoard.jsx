import React from 'react';
import { ChevronRight, CheckSquare, User } from 'lucide-react';
import { clarificationChecklist } from '../data/constants';

export default function KanbanBoard({ 
  processes, 
  filteredTasks, 
  handleDragOver, 
  handleDrop, 
  handleDragStart, 
  setSelectedOrder, 
  getSystemLabel,
  language
}) {
  
  const renderStage = (stage, pIndex, sIndex) => {
    const stageTasks = filteredTasks.filter(t => t.stage === stage.id);
    const sysInfo = getSystemLabel(stage.id);
    
    return (
      <div 
        key={stage.id} 
        className="board-column animate-fade-in"
        style={{ animationDelay: `${(pIndex * 4 + sIndex) * 0.05}s` }}
        onDragOver={handleDragOver}
        onDrop={() => handleDrop(stage.id)}
      >
        <div className="column-header" style={{ '--col-color': stage.color }}>
          <div className="column-title">
            {language === 'id' ? (stage.titleID || stage.title) : (stage.titleEN || stage.title)}
            <span className="column-subtitle">{language === 'id' ? (stage.subtitleID || stage.subtitle) : (stage.subtitleEN || stage.subtitle)}</span>
          </div>
          <div className="column-badge">{stageTasks.length}</div>
        </div>
        <div className="column-body">
          {stageTasks.map(task => {
            const checkedCount = clarificationChecklist.filter(c => task.checklistState && task.checklistState[c.id]).length;
            const totalCount = clarificationChecklist.length;
            
            return (
              <div 
                key={task.id} 
                className="task-card"
                draggable
                onDragStart={() => handleDragStart(task)}
                onClick={() => setSelectedOrder(task)}
              >
                <div className="task-id">{task.id}</div>
                <div className="task-title">{task.title}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <CheckSquare size={12} />
                  <span>{checkedCount}/{totalCount} {language === 'id' ? 'Terklarifikasi' : 'Clarified'}</span>
                </div>
                <div className="task-meta">
                  <span className={`task-system sys-${sysInfo.type}`}>
                    {sysInfo.label}
                  </span>
                  <div className="task-assignee">
                    <User size={12} /> {task.assignee}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="board-columns" style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(2, max-content)',
      gap: '2rem',
      paddingBottom: '2rem',
      alignItems: 'start'
    }}>
      {processes.map((process, idx) => {
        const isConditional = idx >= 4;
        return (
          <div 
            key={process.id} 
            id={`tour-${process.id}`} 
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '1rem',
              padding: '1.5rem',
              backgroundColor: isConditional ? 'rgba(79, 70, 229, 0.02)' : 'white',
              borderRadius: '0.75rem',
              border: isConditional ? '1px solid rgba(79, 70, 229, 0.08)' : '1px solid var(--border-color)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
            }}
          >
            <div style={{
              fontSize: '1.1rem', 
              fontWeight: '700', 
              color: isConditional ? 'var(--primary-color)' : 'var(--text-main)',
              paddingLeft: '0.75rem',
              borderLeft: `4px solid ${isConditional ? 'var(--accent-color)' : 'var(--border-color)'}`
            }}>
              {isConditional && (
                <div style={{ 
                  fontSize: '0.75rem', 
                  fontWeight: '800', 
                  color: 'var(--accent-color)', 
                  letterSpacing: '0.05em', 
                  textTransform: 'uppercase',
                  marginBottom: '0.25rem'
                }}>
                  {language === 'id' ? 'Alur Kondisional' : 'Conditional Flow'}
                </div>
              )}
              {language === 'id' ? (process.titleID || process.title) : (process.titleEN || process.title)}
            </div>
            <div style={{ display: 'flex', gap: '1.25rem' }}>
              {process.stages.map((stage, sIndex) => renderStage(stage, idx, sIndex))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
