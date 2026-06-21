import React, { useState, useEffect } from 'react';
import { LayoutDashboard, ShoppingCart, Settings as SettingsIcon, Bell, Search, User, Filter, Plus, ChevronRight, Activity, X, CheckSquare, BookOpen, LogOut } from 'lucide-react';
import { supabase } from './supabaseClient';
import './index.css';
import { processes, clarificationChecklist, initialTasks, stageRequirements } from './data/constants';
import Auth from './components/Auth';
import Settings from './components/Settings';
import HelpDictionary from './components/HelpDictionary';
import Sidebar from './components/Sidebar';
import TopNav from './components/TopNav';
import OrderDrawer from './components/OrderDrawer';
import TutorialModal from './components/TutorialModal';

function App() {
  const [session, setSession] = useState(null);
  
  const [currentView, setCurrentView] = useState('board'); // 'board' | 'help' | 'settings'
  const [tasks, setTasks] = useState(initialTasks.map(t => ({ ...t, company_name: 'DEFAULT' })));
  const userCompany = session?.user?.user_metadata?.company_name || localStorage.getItem('moai_mock_session_company') || 'DEFAULT';

  useEffect(() => {
    if (!supabase) return;
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!supabase) return;

    const fetchTasks = async () => {
      const { data, error } = await supabase.from('orders').select('*').eq('company_name', userCompany);
      if (error) console.error('Error fetching data:', error);
      else if (data && data.length > 0) setTasks(data);
    };

    fetchTasks();

    const channel = supabase
      .channel('public:orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setTasks(prev => [...prev, payload.new]);
        } else if (payload.eventType === 'UPDATE') {
          setTasks(prev => prev.map(t => t.id === payload.new.id ? payload.new : t));
        } else if (payload.eventType === 'DELETE') {
          setTasks(prev => prev.filter(t => t.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  const [draggedTask, setDraggedTask] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Warning State
  const [warningMsg, setWarningMsg] = useState(null);

  // New Order State
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [newOrderForm, setNewOrderForm] = useState({ title: '', assignee: '', priority: 'Medium' });

  // Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState('All');

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (!session) {
    return <Auth />;
  }

  const handleDragStart = (task) => setDraggedTask(task);
  const handleDragOver = (e) => e.preventDefault();

  const handleDrop = (stageId) => {
    if (draggedTask && draggedTask.stage !== stageId) {
      const reqs = stageRequirements[stageId];
      if (reqs && reqs.length > 0) {
        const missing = reqs.filter(r => !draggedTask.checklistState[r]);
        if (missing.length > 0) {
          const missingTexts = missing.map(m => clarificationChecklist.find(c => c.id === m)?.text);
          const stageName = processes.flatMap(p => p.stages).find(s => s.id === stageId)?.title || 'this stage';
          
          setWarningMsg({
            title: `Cannot move to ${stageName}. Missing prerequisites:`,
            items: missingTexts
          });
          
          if (window.warningTimeout) clearTimeout(window.warningTimeout);
          window.warningTimeout = setTimeout(() => setWarningMsg(null), 15000); // 15 seconds
          
          setDraggedTask(null);
          return;
        }
      }
      const updatedTasks = tasks.map(t => t.id === draggedTask.id ? { ...t, stage: stageId } : t);
      setTasks(updatedTasks);
      
      if (supabase) {
        supabase.from('orders').update({ stage: stageId }).eq('id', draggedTask.id).then(({ error }) => {
          if (error) console.error("Update failed", error);
        });
      }
    }
    setDraggedTask(null);
  };

  const handleCreateOrder = (e) => {
    e.preventDefault();
    const newId = `ORD-${Math.floor(Math.random() * 9000) + 1000}`;
    const newTask = {
      id: newId,
      title: newOrderForm.title || 'New Unnamed Order',
      stage: 'cpo_esta',
      system: 'boq',
      priority: newOrderForm.priority,
      assignee: newOrderForm.assignee || 'Unassigned',
      checklistState: {},
      company_name: userCompany
    };
    setTasks([newTask, ...tasks]);
    setShowNewOrderModal(false);
    setNewOrderForm({ title: '', assignee: '', priority: 'Medium' });

    if (supabase) {
      supabase.from('orders').insert([newTask]).then(({ error }) => {
        if (error) console.error("Insert failed", error);
      });
    }
  };

  const toggleChecklistItem = (orderId, itemId, formData = null) => {
    let updatedTask = null;
    setTasks(tasks.map(t => {
      if (t.id === orderId) {
        let newState;
        if (formData) {
          newState = { completed: true, data: formData };
        } else {
          // simple toggle logic
          const isCurrentlyChecked = !!t.checklistState[itemId];
          newState = !isCurrentlyChecked;
        }
        updatedTask = { ...t, checklistState: { ...t.checklistState, [itemId]: newState } };
        return updatedTask;
      }
      return t;
    }));
    
    if (selectedOrder && selectedOrder.id === orderId) {
      let newState;
      if (formData) {
        newState = { completed: true, data: formData };
      } else {
        const isCurrentlyChecked = !!selectedOrder.checklistState[itemId];
        newState = !isCurrentlyChecked;
      }
      setSelectedOrder(prev => ({ ...prev, checklistState: { ...prev.checklistState, [itemId]: newState } }));
    }

    if (supabase && updatedTask) {
      supabase.from('orders').update({ checklistState: updatedTask.checklistState }).eq('id', orderId).then(({ error }) => {
        if (error) console.error("Checklist update failed", error);
      });
    }
  };

  const getSystemLabel = (stageId) => {
    for (const proc of processes) {
      const stage = proc.stages.find(s => s.id === stageId);
      if (stage) return { label: stage.systemLabel, type: stage.system };
    }
    return { label: 'Unknown', type: 'boq' };
  };

  // Apply filters
  const companyTasks = tasks.filter(t => !t.company_name || t.company_name === userCompany);
  const filteredTasks = companyTasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.assignee.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = filterPriority === 'All' || t.priority === filterPriority;
    return matchesSearch && matchesPriority;
  });

  return (
    <div className="app-container">
      <TutorialModal />
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} />

      {/* Main Content */}
      <main className="main-content">
        {warningMsg && (
          <div style={{
            position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)',
            backgroundColor: '#fee2e2', color: '#991b1b', padding: '1.5rem', 
            borderRadius: '0.5rem', boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
            zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '0.75rem',
            animation: 'fadeIn 0.3s ease', minWidth: '450px', borderLeft: '4px solid #ef4444'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700' }}>
                 <Activity size={20} />
                 {warningMsg.title}
               </div>
               <button onClick={() => setWarningMsg(null)} style={{ background: 'none', border: 'none', color: '#991b1b', cursor: 'pointer', padding: '0.25rem', marginTop: '-4px' }}>
                 <X size={20} />
               </button>
            </div>
            <ul style={{ margin: 0, paddingLeft: '2.5rem', fontSize: '0.875rem', lineHeight: '1.6', fontWeight: '500' }}>
              {warningMsg.items.map((item, i) => (
                <li key={i} style={{ marginBottom: '0.25rem' }}>{item}</li>
              ))}
            </ul>
          </div>
        )}
        <TopNav currentView={currentView} setCurrentView={setCurrentView} handleLogout={handleLogout} session={session} />

        {/* Content Area */}
        <div className="content-area">
          
          {currentView === 'board' && (
            <>
              <div className="metrics-grid">
                <div className="metric-card animate-fade-in" style={{animationDelay: '0.1s'}}>
                  <div className="metric-title">Active Orders <Activity size={16} /></div>
                  <div className="metric-value">{companyTasks.length}</div>
                </div>
                <div className="metric-card animate-fade-in" style={{animationDelay: '0.2s'}}>
                  <div className="metric-title">Planning Phase <Search size={16} /></div>
                  <div className="metric-value">{companyTasks.filter(t => ['cpo_esta','vc_wbs','review_stock','premium_proposal'].includes(t.stage)).length}</div>
                </div>
                <div className="metric-card animate-fade-in" style={{animationDelay: '0.3s'}}>
                  <div className="metric-title">Delivery Phase <ShoppingCart size={16} /></div>
                  <div className="metric-value">{companyTasks.filter(t => ['release_inquiry','po_creation','hub_activities','material_calloff'].includes(t.stage)).length}</div>
                </div>
              </div>

              <div className="board-container">
                <div className="board-header">
                  <h2>Order Pipeline Tracker</h2>
                  <div className="board-actions">
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input 
                        type="text" 
                        placeholder="Search ID, title, assignee..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', width: '200px' }}
                      />
                      <select 
                        value={filterPriority} 
                        onChange={(e) => setFilterPriority(e.target.value)}
                        style={{ padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)' }}
                      >
                        <option value="All">All Priorities</option>
                        <option value="High">High Priority</option>
                        <option value="Medium">Medium Priority</option>
                        <option value="Low">Low Priority</option>
                      </select>
                    </div>
                    <button className="btn btn-primary" onClick={() => setShowNewOrderModal(true)}>
                      <Plus size={16} /> New Order
                    </button>
                  </div>
                </div>

                <div style={{ 
                  backgroundColor: '#eef2ff', 
                  color: '#4f46e5', 
                  padding: '0.75rem 1rem', 
                  borderRadius: '0.5rem', 
                  marginBottom: '1.5rem', 
                  fontSize: '0.875rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  border: '1px solid #c7d2fe'
                }}>
                  <Activity size={16} /> <strong>Tip:</strong> You can drag and drop order cards to move them to the next stage. Click any card to manage its fulfillment checklist!
                </div>

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
              </div>
            </>
          )}

          {currentView === 'help' && <HelpDictionary />}

          {currentView === 'settings' && <Settings />}

        </div>

        {/* Drawer for Order Details */}
        <OrderDrawer 
          selectedOrder={selectedOrder} 
          setSelectedOrder={setSelectedOrder} 
          toggleChecklistItem={toggleChecklistItem} 
        />

        {/* Modal for New Order */}
        {showNewOrderModal && (
          <div className="modal-overlay" onClick={() => setShowNewOrderModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h3>Create New Order</h3>
              <form onSubmit={handleCreateOrder}>
                <div className="form-group">
                  <label>Order Title / Description</label>
                  <input required type="text" placeholder="e.g. Fiber Optic Cable Batch B" value={newOrderForm.title} onChange={e => setNewOrderForm({...newOrderForm, title: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Assignee Name</label>
                  <input required type="text" placeholder="e.g. Jane Doe" value={newOrderForm.assignee} onChange={e => setNewOrderForm({...newOrderForm, assignee: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Priority</label>
                  <select value={newOrderForm.priority} onChange={e => setNewOrderForm({...newOrderForm, priority: e.target.value})}>
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn" style={{border: '1px solid var(--border-color)'}} onClick={() => setShowNewOrderModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Create Order</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default App;
