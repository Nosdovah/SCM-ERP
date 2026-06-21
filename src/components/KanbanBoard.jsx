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
  getSystemLabel 
}) {
  return (
    <div className="board-columns">
      {processes.map((process, pIndex) => (
        <React.Fragment key={process.id}>
          {pIndex > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', color: 'var(--border-color)', margin: '0 2.5rem', marginTop: '2rem' }}>
              <ChevronRight size={64} />
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{
              fontSize: '1.5rem', 
              fontWeight: '700', 
              color: 'var(--primary-color)',
              paddingLeft: '1rem',
              borderLeft: '6px solid var(--accent-color)'
            }}>
              {process.title}
            </div>
            <div style={{ display: 'flex', gap: '1.5rem', flex: 1 }}>
              {process.stages.map((stage, sIndex) => {
                const stageTasks = filteredTasks.filter(t => t.stage === stage.id);
                return (
                  <div 
                    key={stage.id} 
                    className="board-column animate-fade-in"
                    style={{animationDelay: `${(pIndex * 4 + sIndex) * 0.05}s`}}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(stage.id)}
                  >
                    <div className="column-header" style={{'--col-color': stage.color}}>
                      <div className="column-title">
                        {stage.title}
                        <span className="column-subtitle">{stage.subtitle}</span>
                      </div>
                      <div className="column-badge">{stageTasks.length}</div>
                    </div>
                    <div className="column-body">
                      {stageTasks.map(task => {
                        const sysInfo = getSystemLabel(stage.id);
                        const checkedCount = clarificationChecklist.filter(c => task.checklistState[c.id]).length;
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
                              <span>{checkedCount}/{totalCount} Clarified</span>
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
              })}
            </div>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}
