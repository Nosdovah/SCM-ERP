import React, { useState, useEffect } from 'react';
import { LayoutDashboard, ShoppingCart, Settings, Bell, Search, User, Filter, Plus, ChevronRight, Activity, X, CheckSquare, BookOpen, LogOut } from 'lucide-react';
import { supabase } from './supabaseClient';
import './index.css';

const processes = [
  {
    id: 'proc-1',
    title: 'Process 1: Ordering Preparation / Planning',
    stages: [
      { id: 'cpo_esta', title: 'CPO/ESTA', subtitle: 'Planning/Sales', system: 'boq', systemLabel: 'BOQ/PO', color: '#8b5cf6' },
      { id: 'vc_wbs', title: 'VC & WBS Ordering', subtitle: 'PFA/PP', system: 'sap', systemLabel: 'SAP', color: '#3b82f6' },
      { id: 'review_stock', title: 'Review Stock', subtitle: 'MP', system: 'sap', systemLabel: 'SAP', color: '#0ea5e9' },
      { id: 'premium_proposal', title: 'BoQ & Premium Proposal', subtitle: 'Solution & Eng.', system: 'premium', systemLabel: 'Premium Proposal', color: '#10b981' },
    ]
  },
  {
    id: 'proc-2',
    title: 'Process 2: Material Delivery',
    stages: [
      { id: 'release_inquiry', title: 'Release Inquiry', subtitle: 'EPC', system: 'premium', systemLabel: 'SAP - Premium', color: '#f59e0b' },
      { id: 'po_creation', title: 'PO Creation', subtitle: 'EPC', system: 'sap', systemLabel: 'SAP', color: '#f97316' },
      { id: 'hub_activities', title: 'Hub Activities (EAB)', subtitle: 'ESH NJ', system: 'sap', systemLabel: 'Hub', color: '#ef4444' },
      { id: 'material_calloff', title: 'Material Call-off', subtitle: 'EPC/SLDM', system: 'sap', systemLabel: 'SAP', color: '#dc2626' },
    ]
  },
  {
    id: 'proc-3',
    title: 'Process 3: Custom Clearance',
    stages: [
      { id: 'pre_alert_docs', title: 'Pre-Alert & Docs', subtitle: 'Supply/SLDM', system: 'customs', systemLabel: 'Documentation', color: '#8b5cf6' },
      { id: 'custom_declaration', title: 'Custom Declaration', subtitle: 'Broker/LSP', system: 'customs', systemLabel: 'Brokerage', color: '#3b82f6' },
      { id: 'custom_payment', title: 'Duty & Payment', subtitle: 'Customs/Bank', system: 'customs', systemLabel: 'Payment', color: '#f59e0b' },
      { id: 'release_delivery', title: 'Release & Delivery', subtitle: 'LSP', system: 'sap', systemLabel: 'Logistics', color: '#10b981' },
    ]
  }
];

const clarificationChecklist = [
  { id: 'chk_1', text: 'Verify 100% clarified order & provide feedback to ASR/Core-3+' },
  { id: 'chk_2', text: 'Request/Check Value Contract, FAS, ESTA#/PO# & NN/WBS for Ordering' },
  { id: 'chk_3', text: 'Update Order Plan, Partner/Customer info in PP' },
  { id: 'chk_4', text: 'Checking with solution for type site availability in Premium Proposal' },
  { id: 'chk_5', text: 'NIF file preparation' },
  { id: 'chk_6', text: 'Checking existing available stock to decide partially or fully order' },
  { id: 'chk_7', text: 'Perform Material Borrow or Transfer for available stock' },
  { id: 'chk_8', text: 'Request and assess RO Plan for Batching order' },
  { id: 'chk_9', text: 'Request/Create Premium Proposal Ordering (Mapping SKU & Qty)' },
  { id: 'chk_10', text: 'Checking the Premium proposal ordering (Clarified Order)' },
  { id: 'chk_11', text: 'Request PR/PO Creation to ROD for Import material' },
  { id: 'chk_12', text: 'Escalation to PFM or Solution Architect if Order failed to create' },
  { id: 'cc_1', text: 'Received Pre alert' },
  { id: 'cc_2', text: 'Review shipping documents' },
  { id: 'cc_3', text: 'Send shipping document to customs brokerage, coordinating and monitoring' },
  { id: 'cc_4', text: 'Custom declaration verifications' },
  { id: 'cc_5', text: 'Verify the HC code in the import declaration draft and confirm to custom broker' },
  { id: 'cc_6', text: 'Coordinate with solutions to collect and share product catalogue/brochure to custom broker' },
  { id: 'cc_7', text: 'Physical visit in customs' },
  { id: 'cc_8', text: 'Responsible for custom duty and payment process' },
  { id: 'cc_9', text: 'Import permit' },
  { id: 'cc_10', text: 'Ensure to comply local laws and regulations' },
  { id: 'cc_11', text: 'Arrange delivery from custom to local project WH' }
];

const initialTasks = [
  { id: 'ORD-1001', title: 'Telecom Site 4A Upgrades', stage: 'cpo_esta', system: 'boq', priority: 'High', assignee: 'John D.', checklistState: {} },
  { id: 'ORD-1002', title: 'Radio Network Expansion Project', stage: 'vc_wbs', system: 'sap', priority: 'Medium', assignee: 'Sarah K.', checklistState: { chk_1: true, chk_2: true } },
  { id: 'ORD-1003', title: 'Fiber Optic Cable Batch A', stage: 'review_stock', system: 'sap', priority: 'High', assignee: 'Mike T.', checklistState: { chk_1: true, chk_2: true, chk_3: true, chk_6: true } },
  { id: 'ORD-1004', title: 'Server Racks Distribution', stage: 'premium_proposal', system: 'premium', priority: 'Low', assignee: 'Anna W.', checklistState: { chk_1: true, chk_2: true, chk_3: true, chk_4: true, chk_5: true } },
  { id: 'ORD-1005', title: 'Backup Generators Setup', stage: 'release_inquiry', system: 'premium', priority: 'Medium', assignee: 'David L.', checklistState: Object.fromEntries(clarificationChecklist.map(c => [c.id, true])) },
  { id: 'ORD-1006', title: 'Cooling Systems Q3', stage: 'po_creation', system: 'sap', priority: 'High', assignee: 'Lisa M.', checklistState: Object.fromEntries(clarificationChecklist.map(c => [c.id, true])) },
  { id: 'ORD-1007', title: 'Network Switches Delivery', stage: 'material_calloff', system: 'sap', priority: 'Medium', assignee: 'Tom B.', checklistState: Object.fromEntries(clarificationChecklist.map(c => [c.id, true])) },
];

const dictionaryTerms = [
  { term: "CPO / ESTA", desc: "Customer Purchase Order / Early Start Technical Approval. The initial request or commercial approval triggering the planning phase." },
  { term: "VC", desc: "Value Contract. The commercial agreement framework in SAP detailing prices and terms." },
  { term: "WBS", desc: "Work Breakdown Structure. Used in SAP to allocate budgets and track costs for specific project segments." },
  { term: "NW", desc: "Network. References the SAP Network number used for project scheduling and execution." },
  { term: "BoQ", desc: "Bill of Quantities. The detailed list of materials, hardware, and services needed for a site." },
  { term: "PP", desc: "Premium Proposal. An advanced system/step where the exact material mapping and site requirements are finalized." },
  { term: "RO", desc: "Rollout Order. The operational plan dictating when and where sites are built." },
  { term: "OCL", desc: "Order Checklist. The verification document ensuring all prerequisites are met before PO creation." },
  { term: "EPC", desc: "Equipment Procurement & Construction. The team responsible for releasing inquiries and creating Purchase Orders." },
  { term: "SLDM", desc: "Supply Logistics Delivery Management. The team managing the actual material flow, warehousing, and delivery call-offs." }
];

const stageRequirements = {
  'cpo_esta': [],
  'vc_wbs': ['chk_1'],
  'review_stock': ['chk_2', 'chk_3'],
  'premium_proposal': ['chk_4', 'chk_5', 'chk_6'],
  'release_inquiry': ['chk_8', 'chk_9', 'chk_10'],
  'po_creation': ['chk_11'],
  'hub_activities': ['chk_12'],
  'material_calloff': [],
  'pre_alert_docs': [],
  'custom_declaration': ['cc_1', 'cc_2', 'cc_9'],
  'custom_payment': ['cc_3', 'cc_4', 'cc_5', 'cc_6'],
  'release_delivery': ['cc_7', 'cc_8', 'cc_10']
};

function App() {
  const [session, setSession] = useState(null);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  const [currentView, setCurrentView] = useState('board'); // 'board' | 'help'
  const [tasks, setTasks] = useState(initialTasks);

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
      const { data, error } = await supabase.from('orders').select('*');
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

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    let error;
    if (isLoginMode) {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      error = signInError;
    } else {
      const { error: signUpError } = await supabase.auth.signUp({ email, password });
      error = signUpError;
      if (!error) {
        alert('Success! Check your email for a confirmation link or sign in if no confirmation is required.');
      }
    }
    if (error) setAuthError(error.message);
    setAuthLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (!session) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <Activity size={48} className="icon" />
            <h2>MOAI Admin</h2>
            <p>{isLoginMode ? 'Sign in to access the dashboard' : 'Create an admin account'}</p>
          </div>
          <form className="auth-form" onSubmit={handleAuth}>
            {authError && <div className="auth-error">{authError}</div>}
            <div className="auth-input-group">
              <label>Email Address</label>
              <input type="email" required className="auth-input" placeholder="admin@example.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="auth-input-group">
              <label>Password</label>
              <input type="password" required className="auth-input" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <button type="submit" className="auth-btn" disabled={authLoading}>
              {authLoading ? 'Loading...' : (isLoginMode ? 'Sign In' : 'Sign Up')}
            </button>
            <div className="auth-toggle">
              {isLoginMode ? "Don't have an account? " : "Already have an account? "}
              <span onClick={() => setIsLoginMode(!isLoginMode)}>{isLoginMode ? 'Sign Up' : 'Sign In'}</span>
            </div>
          </form>
        </div>
      </div>
    );
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
      checklistState: {}
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

  const toggleChecklistItem = (orderId, itemId) => {
    let updatedTask = null;
    setTasks(tasks.map(t => {
      if (t.id === orderId) {
        updatedTask = { ...t, checklistState: { ...t.checklistState, [itemId]: !t.checklistState[itemId] } };
        return updatedTask;
      }
      return t;
    }));
    
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder(prev => ({ ...prev, checklistState: { ...prev.checklistState, [itemId]: !prev.checklistState[itemId] } }));
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
  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.assignee.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = filterPriority === 'All' || t.priority === filterPriority;
    return matchesSearch && matchesPriority;
  });

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <Activity className="icon" size={28} />
          <span>MOAI ERP</span>
        </div>
        <nav className="sidebar-nav">
          <a href="#" className={`nav-item ${currentView === 'board' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setCurrentView('board'); }}>
            <ShoppingCart size={20} /> Procurement Flow
          </a>
          <a href="#" className={`nav-item ${currentView === 'help' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setCurrentView('help'); }}>
            <BookOpen size={20} /> Dictionary & Help
          </a>
          <a href="#" className="nav-item"><Settings size={20} /> Settings</a>
        </nav>
      </aside>

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
        {/* Top Navigation */}
        <header className="top-nav">
          <div className="page-title">{currentView === 'board' ? 'Procurement & Material Delivery' : 'System Help & Terminology'}</div>
          <div className="user-profile">
            <Bell size={20} className="text-muted" style={{cursor: 'pointer'}} />
            <div className="avatar"><User size={20} /></div>
            <button onClick={handleLogout} className="btn" style={{border: '1px solid var(--border-color)', marginLeft: '1rem', backgroundColor: 'transparent', color: 'var(--text-main)'}}>
              <LogOut size={16} /> Logout
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="content-area">
          
          {currentView === 'board' && (
            <>
              <div className="metrics-grid">
                <div className="metric-card animate-fade-in" style={{animationDelay: '0.1s'}}>
                  <div className="metric-title">Active Orders <Activity size={16} /></div>
                  <div className="metric-value">{tasks.length}</div>
                </div>
                <div className="metric-card animate-fade-in" style={{animationDelay: '0.2s'}}>
                  <div className="metric-title">Planning Phase <Search size={16} /></div>
                  <div className="metric-value">{tasks.filter(t => ['cpo_esta','vc_wbs','review_stock','premium_proposal'].includes(t.stage)).length}</div>
                </div>
                <div className="metric-card animate-fade-in" style={{animationDelay: '0.3s'}}>
                  <div className="metric-title">Delivery Phase <ShoppingCart size={16} /></div>
                  <div className="metric-value">{tasks.filter(t => ['release_inquiry','po_creation','hub_activities','material_calloff'].includes(t.stage)).length}</div>
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

          {currentView === 'help' && (
            <div className="help-page animate-fade-in">
              <h2>ERP Dictionary & Terminology</h2>
              <p style={{marginBottom: '2rem', color: 'var(--text-muted)'}}>
                Use this guide to understand the various acronyms and systems utilized within the MOAI Supply & Procurement flow.
              </p>
              {dictionaryTerms.map((item, idx) => (
                <div className="term-card" key={idx}>
                  <div className="term-title">{item.term}</div>
                  <div className="term-desc">{item.desc}</div>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* Drawer for Order Details */}
        {selectedOrder && <div className="drawer-overlay" onClick={() => setSelectedOrder(null)}></div>}
        {selectedOrder && (
          <div className="drawer">
            <div className="drawer-header">
              <div>
                <h3>{selectedOrder.id}</h3>
                <span style={{fontSize: '0.875rem', color: 'var(--text-muted)'}}>Order Details</span>
              </div>
              <button className="close-btn" onClick={() => setSelectedOrder(null)}><X size={24} /></button>
            </div>
            <div className="drawer-content">
              <div className="drawer-section">
                <h4>General Info</h4>
                <div style={{ fontSize: '1.125rem', fontWeight: '500', marginBottom: '1rem' }}>{selectedOrder.title}</div>
                <div style={{ display: 'flex', gap: '2rem', fontSize: '0.875rem' }}>
                  <div><div style={{ color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Assignee</div><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><User size={16} /> {selectedOrder.assignee}</div></div>
                  <div><div style={{ color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Priority</div><div>{selectedOrder.priority}</div></div>
                </div>
              </div>
              <div className="drawer-section">
                <h4>100% Clarified Order Checklist (Supply CLM)</h4>
                {(() => {
                  const checkedCount = clarificationChecklist.filter(c => selectedOrder.checklistState[c.id]).length;
                  const totalCount = clarificationChecklist.length;
                  const progressPct = Math.round((checkedCount / totalCount) * 100);
                  return (
                    <div style={{ marginBottom: '1.5rem', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-main)' }}>
                        <span>Fulfillment Progress</span>
                        <span style={{ color: progressPct === 100 ? '#10b981' : 'var(--accent-color)' }}>{checkedCount} / {totalCount} ({progressPct}%)</span>
                      </div>
                      <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${progressPct}%`, height: '100%', backgroundColor: progressPct === 100 ? '#10b981' : 'var(--accent-color)', transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}></div>
                      </div>
                    </div>
                  );
                })()}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {clarificationChecklist.map(item => {
                    const isChecked = !!selectedOrder.checklistState[item.id];
                    return (
                      <div key={item.id} className="checklist-item" onClick={() => toggleChecklistItem(selectedOrder.id, item.id)}>
                        <input type="checkbox" className="checklist-checkbox" checked={isChecked} readOnly />
                        <div className={`checklist-text ${isChecked ? 'done' : ''}`}>{item.text}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="drawer-footer">
              <button className="btn btn-primary" onClick={() => setSelectedOrder(null)}>Save & Close</button>
            </div>
          </div>
        )}

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
