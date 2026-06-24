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
    <div className="board-columns">
      {/* Main Linear Processes (1 - 4) */}
      {processes.slice(0, 4).map((process, pIndex) => (
        <React.Fragment key={process.id}>
          {pIndex > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', color: 'var(--border-color)', margin: '0 1.5rem', marginTop: '2rem' }}>
              <ChevronRight size={48} />
            </div>
          )}
          <div id={`tour-${process.id}`} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{
              fontSize: '1.25rem', 
              fontWeight: '700', 
              color: 'var(--primary-color)',
              paddingLeft: '0.75rem',
              borderLeft: '5px solid var(--accent-color)'
            }}>
              {language === 'id' ? (process.titleID || process.title) : (process.titleEN || process.title)}
            </div>
            <div style={{ display: 'flex', gap: '1.25rem', flex: 1 }}>
              {process.stages.map((stage, sIndex) => renderStage(stage, pIndex, sIndex))}
            </div>
          </div>
        </React.Fragment>
      ))}

      {/* Separator to Conditional Branches */}
      <div style={{ display: 'flex', alignItems: 'center', color: 'var(--border-color)', margin: '0 1.5rem', marginTop: '2rem' }}>
        <ChevronRight size={48} />
      </div>

      {/* Parallel Conditional Branches (Process 5 & 6 Stacked Vertically) */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '2rem', 
        borderLeft: '2px dashed rgba(79, 70, 229, 0.3)', 
        paddingLeft: '1.5rem',
        justifyContent: 'center'
      }}>
        <div style={{ 
          fontSize: '0.8rem', 
          fontWeight: '800', 
          color: 'var(--accent-color)', 
          letterSpacing: '0.08em', 
          textTransform: 'uppercase' 
        }}>
          {language === 'id' ? 'Cabang Alur Kondisional' : 'Conditional Flow Branches'}
        </div>

        {[processes[4], processes[5]].map((process, idx) => (
          <div 
            key={process.id} 
            id={`tour-${process.id}`} 
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '0.75rem',
              padding: '1rem',
              backgroundColor: 'rgba(79, 70, 229, 0.02)',
              borderRadius: '0.75rem',
              border: '1px solid rgba(79, 70, 229, 0.08)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
            }}
          >
            <div style={{
              fontSize: '1.05rem', 
              fontWeight: '700', 
              color: 'var(--primary-color)',
              paddingLeft: '0.5rem',
              borderLeft: '4px solid var(--accent-color)'
            }}>
              {language === 'id' ? (process.titleID || process.title) : (process.titleEN || process.title)}
            </div>
            <div style={{ display: 'flex', gap: '1.25rem' }}>
              {process.stages.map((stage, sIndex) => renderStage(stage, 4 + idx, sIndex))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
