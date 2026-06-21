import React, { useState, useEffect } from 'react';
import { Activity, LayoutDashboard, CheckSquare, BookOpen, Bell, ChevronRight, ChevronLeft, X } from 'lucide-react';

export default function TutorialModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('moai_tutorial_completed');
    if (!hasSeenTutorial) {
      setIsOpen(true);
    }
  }, []);

  const completeTutorial = () => {
    localStorage.setItem('moai_tutorial_completed', 'true');
    setIsOpen(false);
  };

  const steps = [
    {
      title: "Welcome to MOAI ERP",
      desc: "Your complete End-to-End Supply Chain Management System. Let's take a quick tour to help you get started.",
      icon: <Activity size={64} color="var(--primary-color)" />
    },
    {
      title: "The Kanban Workflow",
      desc: "Track orders visually. Drag and drop cards across different stages. Each column represents a phase in the supply chain with its specific role (like Planning, EPC, or Logistics).",
      icon: <LayoutDashboard size={64} color="#3b82f6" />
    },
    {
      title: "Order Details & Checklist",
      desc: "Click on any order card to open its drawer. Track the 100% Clarified Order Checklist, mark items as complete, and view overall fulfillment progress.",
      icon: <CheckSquare size={64} color="#10b981" />
    },
    {
      title: "Dictionary & Help",
      desc: "Confused by an acronym like CPO, WBS, or GR/GI? Use the Dictionary tab on the left sidebar to access process definitions and terminology.",
      icon: <BookOpen size={64} color="#f59e0b" />
    },
    {
      title: "Notifications & Profile",
      desc: "Manage your account settings and stay updated with system notifications via the top right corner. You're all set!",
      icon: <Bell size={64} color="#ef4444" />
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 9999 }}>
      <div className="modal" style={{ maxWidth: '500px', textAlign: 'center', padding: '3rem 2rem' }}>
        <button 
          onClick={completeTutorial} 
          style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
        >
          <X size={24} />
        </button>
        
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'center' }}>
          {steps[currentStep].icon}
        </div>
        
        <h2 style={{ marginBottom: '1rem', color: 'var(--text-main)' }}>{steps[currentStep].title}</h2>
        <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '2.5rem', minHeight: '80px' }}>
          {steps[currentStep].desc}
        </p>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {steps.map((_, idx) => (
              <div 
                key={idx} 
                style={{ 
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%', 
                  backgroundColor: idx === currentStep ? 'var(--primary-color)' : '#e2e8f0',
                  transition: 'background-color 0.3s'
                }} 
              />
            ))}
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            {currentStep > 0 && (
              <button className="btn" style={{ border: '1px solid var(--border-color)', backgroundColor: 'white', color: 'var(--text-main)' }} onClick={() => setCurrentStep(prev => prev - 1)}>
                <ChevronLeft size={16} /> Back
              </button>
            )}
            
            {currentStep < steps.length - 1 ? (
              <button className="btn btn-primary" onClick={() => setCurrentStep(prev => prev + 1)}>
                Next <ChevronRight size={16} />
              </button>
            ) : (
              <button className="btn btn-primary" onClick={completeTutorial}>
                Get Started
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
