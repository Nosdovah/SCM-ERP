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
import Analytics from './components/Analytics';
import MasterData from './components/MasterData';
import KanbanBoard from './components/KanbanBoard';
import DashboardMetrics from './components/DashboardMetrics';
import NewOrderModal from './components/NewOrderModal';
import RevertModal from './components/RevertModal';

function App() {
  const [session, setSession] = useState(null);
  const [language, setLanguage] = useState('en');
  
  const [currentView, setCurrentView] = useState('board'); // 'board' | 'help' | 'settings' | 'analytics' | 'master_data'
  const [tasks, setTasks] = useState(initialTasks.map(t => ({ ...t, company_name: 'DEFAULT' })));
  const [masterItems, setMasterItems] = useState([]);
  const userCompany = session?.user?.user_metadata?.company_name || 'NOT ASSIGNED';
  const userRole = session?.user?.user_metadata?.role || 'Admin';

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
    if (!supabase || userCompany === 'NOT ASSIGNED') return;

    const fetchTasks = async () => {
      const { data, error } = await supabase.from('orders').select('*').eq('company_name', userCompany);
      if (error) console.error('Error fetching data:', error);
      else if (data) setTasks(data);
    };

    fetchTasks();


    const channel = supabase
      .channel('public:orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setTasks(prev => {
            if (prev.find(t => t.id === payload.new.id)) return prev;
            const newItem = payload.new;
            if (typeof newItem.checklistState === 'string') {
              try { newItem.checklistState = JSON.parse(newItem.checklistState); } catch (e) {}
            }
            return [...prev, newItem];
          });
        } else if (payload.eventType === 'UPDATE') {
          setTasks(prev => prev.map(t => {
            if (t.id === payload.new.id) {
              const updated = { ...t, ...payload.new };
              if (typeof updated.checklistState === 'string') {
                try {
                  updated.checklistState = JSON.parse(updated.checklistState);
                } catch (e) {
                  console.error('Failed to parse checklistState in UPDATE event', e);
                }
              }
              return updated;
            }
            return t;
          }));
        } else if (payload.eventType === 'DELETE') {
          setTasks(prev => prev.filter(t => t.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userCompany]);
  const [draggedTask, setDraggedTask] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Warning State
  const [warningMsg, setWarningMsg] = useState(null);

  const [forceTutorial, setForceTutorial] = useState(false);

  // New Order State
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [newOrderForm, setNewOrderForm] = useState({ title: '', assignee: '', priority: 'Medium', quantity: '', orderType: 'import' });

  // Revert Order State
  const [revertPrompt, setRevertPrompt] = useState(null);

  // Fetch master items when modal opens
  useEffect(() => {
    if (showNewOrderModal && supabase) {
      supabase.from('items').select('name, stock_on_hand').eq('company_name', userCompany).then(({ data }) => {
        if (data) setMasterItems(data);
      });
    }
  }, [showNewOrderModal, userCompany]);

  // Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState('All');

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (!session) {
    return <Auth />;
  }

  const logAudit = async (orderId, action, details = {}) => {
    if (!supabase) return;
    const userEmail = session?.user?.email || 'Unknown User';
    const logEntry = {
      order_id: orderId,
      user_email: userEmail,
      action: action,
      details: details,
      company_name: userCompany
    };
    supabase.from('order_history').insert([logEntry]).then(({ error }) => {
      if (error) console.error("Audit log failed", error);
    });
  };

  const handleDragStart = (task) => setDraggedTask(task);
  const handleDragOver = (e) => e.preventDefault();

  const handleDrop = (stageId) => {
    if (draggedTask && draggedTask.stage !== stageId) {
      if (userRole === 'Viewer') {
        alert('RBAC Error: Viewers cannot modify tasks.');
        setDraggedTask(null);
        return;
      }

      // Check process-level permissions
      const targetProcess = processes.find(p => p.stages.some(s => s.id === stageId));
      if (targetProcess && userRole !== 'Admin') {
        if (targetProcess.id === 'proc-1' && userRole !== 'Procurement') {
          alert('RBAC Error: Only Procurement or Admin can manage Ordering Preparation.');
          setDraggedTask(null); return;
        }
        if (targetProcess.id === 'proc-3' && userRole !== 'Customs') {
          alert('RBAC Error: Only Customs or Admin can manage Custom Clearance.');
          setDraggedTask(null); return;
        }
        if (targetProcess.id === 'proc-4' && userRole !== 'Warehouse') {
          alert('RBAC Error: Only Warehouse or Admin can manage WH Management.');
          setDraggedTask(null); return;
        }
        if (targetProcess.id === 'proc-5' && userRole !== 'Logistics') {
          alert('RBAC Error: Only Logistics or Admin can manage Last Mile Delivery.');
          setDraggedTask(null); return;
        }
      }

      const reqs = stageRequirements[stageId];
      
      // Determine if backward movement
      const flatStages = processes.flatMap(p => p.stages.map(s => s.id));
      const currentIndex = flatStages.indexOf(draggedTask.stage);
      const targetIndex = flatStages.indexOf(stageId);

      // Exception: 3PP (Proc 6) going back to WH (Proc 4) is a normal forward local flow
      const isLocalReturnToWH = 
        processes[5].stages.some(s => s.id === draggedTask.stage) && 
        processes[3].stages.some(s => s.id === stageId);

      if (targetIndex < currentIndex && !isLocalReturnToWH) {
        setRevertPrompt({ task: draggedTask, targetStage: stageId });
        setDraggedTask(null);
        return;
      }

      if (reqs && reqs.length > 0) {
        const missing = reqs.filter(r => !draggedTask.checklistState[r]);
        if (missing.length > 0) {
          const missingTexts = missing.map(m => {
            const c = clarificationChecklist.find(x => x.id === m);
            return c ? (language === 'id' ? (c.textID || c.text) : (c.textEN || c.text)) : 'Unknown checklist item';
          });
          const targetStage = processes.flatMap(p => p.stages).find(s => s.id === stageId);
          const stageName = targetStage ? (language === 'id' ? (targetStage.titleID || targetStage.title) : (targetStage.titleEN || targetStage.title)) : 'this stage';
          
          setWarningMsg({
            title: language === 'id' ? `Tidak dapat memindahkan ke ${stageName}. Prasyarat kurang:` : `Cannot move to ${stageName}. Missing prerequisites:`,
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
          if (error) {
            console.error("Update failed", error);
            alert("Failed to update stage in database: " + error.message);
          } else {
            // Inventory Management: Auto-increment stock if order reaches warehouse / delivery completion
            if (stageId === 'wh_inbound' || stageId === 'tpp_delivery') {
              supabase.from('items')
                .select('id, stock_on_hand')
                .eq('name', draggedTask.title)
                .eq('company_name', userCompany)
                .single()
                .then(({ data, error: fetchErr }) => {
                  if (data && !fetchErr) {
                    const newStock = (data.stock_on_hand || 0) + (draggedTask.quantity || 1);
                    supabase.from('items').update({ stock_on_hand: newStock }).eq('id', data.id).then(({ error: updateErr }) => {
                       if (!updateErr) {
                         console.log(`Inventory auto-incremented for ${draggedTask.title}. New stock: ${newStock}`);
                       }
                    });
                  }
                });
            }
          }
        });
        
        const stageName = processes.flatMap(p => p.stages).find(s => s.id === stageId)?.title || stageId;
        logAudit(draggedTask.id, 'Moved Stage', { to: stageName, stageId: stageId });
      }
    }
    setDraggedTask(null);
  };

  const handleConfirmRevert = async (reasonText) => {
    if (!revertPrompt) return;
    const { task, targetStage } = revertPrompt;
    
    // Optimistic UI update
    const updatedTasks = tasks.map(t => t.id === task.id ? { ...t, stage: targetStage } : t);
    setTasks(updatedTasks);
    if (selectedOrder && selectedOrder.id === task.id) {
      setSelectedOrder(prev => ({ ...prev, stage: targetStage }));
    }
    
    if (supabase) {
      supabase.from('orders').update({ stage: targetStage }).eq('id', task.id).then(({ error }) => {
        if (error) {
          console.error("Update failed", error);
          alert("Failed to revert stage in database: " + error.message);
        }
      });
      
      const stageName = processes.flatMap(p => p.stages).find(s => s.id === targetStage)?.title || targetStage;
      logAudit(task.id, 'Reverted Stage', { to: stageName, stageId: targetStage, reason: reasonText });
    }
    setRevertPrompt(null);
  };

  const handleUpdateOrderStage = (task, stageId) => {
    if (userRole === 'Viewer') {
      alert('RBAC Error: Viewers cannot modify tasks.');
      return;
    }

    // Check process-level permissions
    const targetProcess = processes.find(p => p.stages.some(s => s.id === stageId));
    if (targetProcess && userRole !== 'Admin') {
      if (targetProcess.id === 'proc-1' && userRole !== 'Procurement') {
        alert('RBAC Error: Only Procurement or Admin can manage Ordering Preparation.');
        return;
      }
      if (targetProcess.id === 'proc-3' && userRole !== 'Customs') {
        alert('RBAC Error: Only Customs or Admin can manage Custom Clearance.');
        return;
      }
      if (targetProcess.id === 'proc-4' && userRole !== 'Warehouse') {
        alert('RBAC Error: Only Warehouse or Admin can manage WH Management.');
        return;
      }
      if (targetProcess.id === 'proc-5' && userRole !== 'Logistics') {
        alert('RBAC Error: Only Logistics or Admin can manage Last Mile Delivery.');
        return;
      }
    }

    const reqs = stageRequirements[stageId];
    
    // Determine if backward movement
    const flatStages = processes.flatMap(p => p.stages.map(s => s.id));
    const currentIndex = flatStages.indexOf(task.stage);
    const targetIndex = flatStages.indexOf(stageId);

    // Exception: 3PP (Proc 6) going back to WH (Proc 4) is a normal forward local flow
    const isLocalReturnToWH = 
      processes[5].stages.some(s => s.id === task.stage) && 
      processes[3].stages.some(s => s.id === stageId);

    if (targetIndex < currentIndex && !isLocalReturnToWH) {
      setRevertPrompt({ task: task, targetStage: stageId });
      return;
    }

    if (reqs && reqs.length > 0) {
      const missing = reqs.filter(r => !task.checklistState[r]);
      if (missing.length > 0) {
        const missingTexts = missing.map(m => {
          const c = clarificationChecklist.find(x => x.id === m);
          return c ? (language === 'id' ? (c.textID || c.text) : (c.textEN || c.text)) : 'Unknown checklist item';
        });
        const targetStageObj = processes.flatMap(p => p.stages).find(s => s.id === stageId);
        const stageName = targetStageObj ? (language === 'id' ? (targetStageObj.titleID || targetStageObj.title) : (targetStageObj.titleEN || targetStageObj.title)) : 'this stage';
        
        setWarningMsg({
          title: language === 'id' ? `Tidak dapat memindahkan ke ${stageName}. Prasyarat kurang:` : `Cannot move to ${stageName}. Missing prerequisites:`,
          items: missingTexts
        });
        
        if (window.warningTimeout) clearTimeout(window.warningTimeout);
        window.warningTimeout = setTimeout(() => setWarningMsg(null), 15000); // 15 seconds
        return;
      }
    }

    // Direct Forward Update
    const updatedTasks = tasks.map(t => t.id === task.id ? { ...t, stage: stageId } : t);
    setTasks(updatedTasks);
    if (selectedOrder && selectedOrder.id === task.id) {
      setSelectedOrder(prev => ({ ...prev, stage: stageId }));
    }
    
    if (supabase) {
      supabase.from('orders').update({ stage: stageId }).eq('id', task.id).then(({ error }) => {
        if (error) {
          console.error("Update failed", error);
          alert("Failed to update stage in database: " + error.message);
        } else {
          // Inventory Management: Auto-increment stock if order reaches warehouse / delivery completion
          if (stageId === 'wh_inbound' || stageId === 'tpp_delivery') {
            supabase.from('items')
              .select('id, stock_on_hand')
              .eq('name', task.title)
              .eq('company_name', userCompany)
              .single()
              .then(({ data, error: fetchErr }) => {
                if (data && !fetchErr) {
                  const newStock = (data.stock_on_hand || 0) + (task.quantity || 1);
                  supabase.from('items').update({ stock_on_hand: newStock }).eq('id', data.id).then(({ error: updateErr }) => {
                     if (!updateErr) {
                       console.log(`Inventory auto-incremented for ${task.title}. New stock: ${newStock}`);
                     }
                  });
                }
              });
          }
        }
      });
      
      const stageName = processes.flatMap(p => p.stages).find(s => s.id === stageId)?.title || stageId;
      logAudit(task.id, 'Moved Stage', { to: stageName, stageId: stageId });
    }
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    if (userRole === 'Viewer') {
      alert('RBAC Error: Viewers cannot create orders.');
      return;
    }
    
    // Redundancy check
    const isDuplicate = tasks.some(t => t.title.trim().toLowerCase() === newOrderForm.title.trim().toLowerCase());
    if (isDuplicate) {
      if (!window.confirm(`Warning: An order titled "${newOrderForm.title}" already exists. Are you sure you want to create a duplicate?`)) {
        return; // Stop creation if user cancels
      }
    }

    const newId = `ORD-${Math.floor(Math.random() * 9000) + 1000}`;
    const newTask = {
      id: newId,
      title: newOrderForm.title || 'New Unnamed Order',
      stage: newOrderForm.orderType === 'local' ? 'tpp_request' : 'cpo_esta',
      system: 'boq',
      priority: newOrderForm.priority,
      assignee: newOrderForm.assignee || 'Unassigned',
      checklistState: {},
      company_name: userCompany,
      quantity: newOrderForm.quantity || 1
    };
    
    // Optimistic UI update
    setTasks([newTask, ...tasks]);
    setShowNewOrderModal(false);
    setNewOrderForm({ title: '', assignee: '', priority: 'Medium', quantity: '', orderType: 'import' });

    if (supabase) {
      try {
        const { error } = await supabase.from('orders').insert([newTask]);
        if (error) {
          console.error("Insert failed", error);
          alert(`DATABASE ERROR: Failed to save the new order. Your database schema might be out of date. Details: ${error.message}`);
          // Revert optimistic update
          setTasks(prev => prev.filter(t => t.id !== newId));
        } else {
          logAudit(newId, 'Created Order', { title: newTask.title, assignee: newTask.assignee });
        }
      } catch (err) {
        alert("Unexpected error: " + err.message);
      }
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (userRole !== 'Admin') {
      alert('RBAC Error: Only Admins can delete orders.');
      return;
    }
    if (!window.confirm("Are you sure you want to delete this order? This action cannot be undone.")) return;
    
    const taskToDelete = tasks.find(t => t.id === orderId);
    
    // Optimistic UI update
    setTasks(tasks.filter(t => t.id !== orderId));
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder(null);
    }

    if (supabase) {
      try {
        const { error } = await supabase.from('orders').delete().eq('id', orderId);
        if (error) {
          console.error("Delete failed", error);
          alert(`DATABASE ERROR: Failed to delete order. Details: ${error.message}`);
          // Revert optimistic update
          if (taskToDelete) setTasks(prev => [...prev, taskToDelete]);
        } else {
          // Also explicitly delete history to clear analytics
          await supabase.from('order_history').delete().eq('order_id', orderId);
          logAudit(orderId, 'Deleted Order');
        }
      } catch (err) {
        alert("Unexpected error: " + err.message);
      }
    }
  };

  const toggleChecklistItem = (orderId, itemId, formData = null) => {
    if (userRole === 'Viewer') {
      alert('RBAC Error: Viewers cannot modify checklists.');
      return;
    }
    
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
      
      const itemText = clarificationChecklist.find(c => c.id === itemId)?.text || itemId;
      const status = formData ? 'Completed with Data' : 'Toggled';
      logAudit(orderId, 'Updated Checklist', { item: itemText, status: status, data: formData });
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
      <TutorialModal forceOpen={forceTutorial} setForceOpen={setForceTutorial} currentView={currentView} setCurrentView={setCurrentView} language={language} />
      <TopNav currentView={currentView} setCurrentView={setCurrentView} handleLogout={handleLogout} session={session} language={language} setLanguage={setLanguage} />
      
      <div className="app-body">
        <Sidebar currentView={currentView} setCurrentView={setCurrentView} language={language} />

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

        {/* Content Area */}
        <div className="content-area">
          {currentView === 'help' ? <HelpDictionary language={language} onOpenTutorial={() => setForceTutorial(true)} /> :
           currentView === 'settings' ? <Settings session={session} language={language} /> :
           currentView === 'analytics' ? <Analytics session={session} language={language} /> :
           currentView === 'master_data' ? <MasterData session={session} language={language} /> :
           (
            <>
              <div id="tour-metrics-container">
                <DashboardMetrics companyTasks={companyTasks} language={language} />
              </div>

              <div className="board-container">
                <div className="board-header">
                  <h2>{language === 'id' ? 'Pelacak Saluran Pesanan' : 'Order Pipeline Tracker'}</h2>
                  <div className="board-actions">
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input 
                        type="text" 
                        placeholder={language === 'id' ? 'Cari ID, judul, penanggung jawab...' : 'Search ID, title, assignee...'} 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', width: '200px' }}
                      />
                      <select 
                        value={filterPriority} 
                        onChange={(e) => setFilterPriority(e.target.value)}
                        style={{ padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)' }}
                      >
                        <option value="All">{language === 'id' ? 'Semua Prioritas' : 'All Priorities'}</option>
                        <option value="High">{language === 'id' ? 'Prioritas Tinggi' : 'High Priority'}</option>
                        <option value="Medium">{language === 'id' ? 'Prioritas Sedang' : 'Medium Priority'}</option>
                        <option value="Low">{language === 'id' ? 'Prioritas Rendah' : 'Low Priority'}</option>
                      </select>
                    </div>
                    <button className="btn btn-primary" id="tour-new-order-btn" onClick={() => setShowNewOrderModal(true)}>
                      <Plus size={16} /> {language === 'id' ? 'Pesanan Baru' : 'New Order'}
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
                  <Activity size={16} /> <strong>{language === 'id' ? 'Tip:' : 'Tip:'}</strong> {language === 'id' ? 'Anda dapat menarik dan melepas kartu pesanan untuk memindahkannya ke tahap berikutnya. Klik kartu mana saja untuk mengelola checklist pemenuhannya!' : 'You can drag and drop order cards to move them to the next stage. Click any card to manage its fulfillment checklist!'}
                </div>

                <div id="tour-kanban-board">
                  <KanbanBoard 
                    processes={processes}
                    filteredTasks={filteredTasks}
                    handleDragOver={handleDragOver}
                    handleDrop={handleDrop}
                    handleDragStart={handleDragStart}
                    setSelectedOrder={setSelectedOrder}
                    getSystemLabel={getSystemLabel}
                    language={language}
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Drawer for Order Details */}
        <OrderDrawer 
          selectedOrder={selectedOrder} 
          setSelectedOrder={setSelectedOrder} 
          toggleChecklistItem={toggleChecklistItem} 
          handleDeleteOrder={handleDeleteOrder}
          language={language}
          onUpdateOrderStage={handleUpdateOrderStage}
        />

        {/* Modal for New Order */}
        <NewOrderModal 
          showNewOrderModal={showNewOrderModal}
          setShowNewOrderModal={setShowNewOrderModal}
          newOrderForm={newOrderForm}
          setNewOrderForm={setNewOrderForm}
          handleCreateOrder={handleCreateOrder}
          masterItems={masterItems}
          language={language}
        />

        {/* Modal for Reverting Order */}
        <RevertModal
          revertPrompt={revertPrompt}
          setRevertPrompt={setRevertPrompt}
          handleConfirmRevert={handleConfirmRevert}
          language={language}
        />
      </main>
      </div>
    </div>
  );
}

export default App;
