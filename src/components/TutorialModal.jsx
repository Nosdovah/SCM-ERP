import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, X } from 'lucide-react';

export default function TutorialModal({ forceOpen, setForceOpen, currentView, setCurrentView, language }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState(null);

  const steps = [
    {
      titleEN: "Welcome to MOAI ERP",
      titleID: "Selamat Datang di MOAI ERP",
      descEN: "Your complete End-to-End Supply Chain Management System. Let's take a quick interactive tour of the features.",
      descID: "Sistem Manajemen Rantai Pasokan (SCM) End-to-End lengkap Anda. Mari ikuti tur interaktif cepat dari fitur-fiturnya.",
      selector: null,
      placement: 'center',
      view: 'board'
    },
    {
      titleEN: "Navigation Panel",
      titleID: "Panel Navigasi Utama",
      descEN: "Use the sidebar to jump between modules: Supply Chain Kanban, Master Data Setup, Analytics, and Help.",
      descID: "Gunakan sidebar untuk berpindah modul: Kanban Rantai Pasokan, Pengaturan Data Induk, Analitik, dan Bantuan.",
      selector: '#tour-sidebar',
      placement: 'right',
      view: 'board'
    },
    {
      titleEN: "KPI Dashboard",
      titleID: "Dasbor Kinerja Utama (KPI)",
      descEN: "Monitor supply chain performance, active orders, completion rates, and average lead times in real-time.",
      descID: "Pantau performa rantai pasokan, pesanan aktif, rasio penyelesaian, dan rata-rata waktu tunggu secara real-time.",
      selector: '#tour-metrics-container',
      placement: 'bottom',
      view: 'board'
    },
    {
      titleEN: "Initiate New Order",
      titleID: "Buat Pesanan Baru",
      descEN: "Click here to add a new order, specify product SKUs, priority levels, quantity, and assignees.",
      descID: "Klik di sini untuk membuat pesanan baru, tentukan SKU produk, tingkat prioritas, kuantitas, dan penanggung jawab.",
      selector: '#tour-new-order-btn',
      placement: 'left',
      view: 'board'
    },
    {
      titleEN: "Fulfillment Pipeline",
      titleID: "Saluran Papan Kerja Kanban",
      descEN: "Manage active orders by dragging and dropping cards across pipeline stages. Each stage requires completing specific documentation checklist tasks.",
      descID: "Kelola pesanan aktif dengan menyeret dan melepas kartu di sepanjang tahapan. Setiap tahap mengharuskan penyelesaian daftar periksa dokumen.",
      selector: '#tour-kanban-board',
      placement: 'top',
      view: 'board'
    },
    {
      titleEN: "Master Data Management",
      titleID: "Manajemen Data Induk",
      descEN: "Configure and register items, SKUs, pricing, initial stocks, and Suppliers before starting fulfillment orders.",
      descID: "Konfigurasikan dan daftarkan barang, SKU, harga, stok awal, dan Pemasok sebelum memulai pesanan pemenuhan.",
      selector: '#tour-sidebar-master',
      placement: 'right',
      view: 'master_data'
    },
    {
      titleEN: "Lead Time Analytics",
      titleID: "Analitik Waktu Tunggu",
      descEN: "Identify operational bottlenecks and view lead time performance across the entire supply chain phases.",
      descID: "Identifikasi hambatan operasional dan lihat kinerja waktu tunggu (lead time) di seluruh fase rantai pasokan.",
      selector: '#tour-sidebar-analytics',
      placement: 'right',
      view: 'analytics'
    },
    {
      titleEN: "Official User Manual",
      titleID: "Buku Panduan & Glosarium",
      descEN: "Lookup SCM acronyms (CPO, VC, WBS, GR/GI) and access the complete user manual documentation anytime.",
      descID: "Cari singkatan SCM (CPO, VC, WBS, GR/GI) dan akses dokumentasi lengkap panduan pengguna kapan saja.",
      selector: '#tour-sidebar-help',
      placement: 'right',
      view: 'help'
    },
    {
      titleEN: "Profile & Language Switcher",
      titleID: "Pengaturan Profil & Bahasa",
      descEN: "Switch between English and Indonesian, check notifications, and manage profile configurations here.",
      descID: "Beralih antara Bahasa Inggris dan Indonesia, periksa notifikasi, dan kelola konfigurasi profil di sini.",
      selector: '#tour-top-profile',
      placement: 'bottom',
      view: 'board'
    }
  ];

  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('moai_tutorial_completed');
    if (!hasSeenTutorial) {
      setIsOpen(true);
    }
  }, []);

  useEffect(() => {
    if (forceOpen) {
      setIsOpen(true);
      setCurrentStep(0);
      if (setForceOpen) setForceOpen(false);
    }
  }, [forceOpen, setForceOpen]);

  const calculateRect = () => {
    const step = steps[currentStep];
    if (!step || !step.selector) {
      setTargetRect(null);
      return;
    }
    const el = document.querySelector(step.selector);
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height
      });
    } else {
      setTargetRect(null);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const step = steps[currentStep];
    if (step.view && step.view !== currentView) {
      if (setCurrentView) {
        setCurrentView(step.view);
      }
      const timer = setTimeout(() => {
        calculateRect();
      }, 350);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        calculateRect();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [currentStep, currentView, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener('resize', calculateRect);
    return () => window.removeEventListener('resize', calculateRect);
  }, [isOpen, currentStep]);

  const completeTutorial = () => {
    localStorage.setItem('moai_tutorial_completed', 'true');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  const currentStepData = steps[currentStep];

  const getPointerStyle = () => {
    if (!targetRect) return { display: 'none' };
    const margin = 12;
    const size = 32;
    
    switch (currentStepData.placement) {
      case 'bottom':
        return {
          position: 'fixed',
          top: targetRect.top + targetRect.height + margin,
          left: targetRect.left + targetRect.width / 2 - size / 2,
          width: size,
          height: size,
          transform: 'rotate(180deg)',
          animation: 'bounceUp 1.5s infinite',
          zIndex: 9999,
        };
      case 'top':
        return {
          position: 'fixed',
          top: targetRect.top - size - margin,
          left: targetRect.left + targetRect.width / 2 - size / 2,
          width: size,
          height: size,
          animation: 'bounceDown 1.5s infinite',
          zIndex: 9999,
        };
      case 'right':
        return {
          position: 'fixed',
          top: targetRect.top + targetRect.height / 2 - size / 2,
          left: targetRect.left + targetRect.width + margin,
          width: size,
          height: size,
          transform: 'rotate(90deg)',
          animation: 'bounceLeft 1.5s infinite',
          zIndex: 9999,
        };
      case 'left':
        return {
          position: 'fixed',
          top: targetRect.top + targetRect.height / 2 - size / 2,
          left: targetRect.left - size - margin,
          width: size,
          height: size,
          transform: 'rotate(-90deg)',
          animation: 'bounceRight 1.5s infinite',
          zIndex: 9999,
        };
      default:
        return { display: 'none' };
    }
  };

  const getTooltipStyle = () => {
    if (!targetRect) {
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '450px',
        maxWidth: '90vw',
        zIndex: 9999,
        backgroundColor: 'white',
        padding: '2.5rem 2rem',
        borderRadius: '1rem',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        border: '1px solid var(--border-color)',
        textAlign: 'center',
      };
    }

    const margin = 48;
    const tooltipWidth = 340;
    const tooltipHeight = 180;
    
    let top = 0;
    let left = 0;
    
    switch (currentStepData.placement) {
      case 'bottom':
        top = targetRect.top + targetRect.height + margin;
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
        break;
      case 'top':
        top = targetRect.top - tooltipHeight - margin;
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
        break;
      case 'right':
        top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
        left = targetRect.left + targetRect.width + margin;
        break;
      case 'left':
        top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
        left = targetRect.left - tooltipWidth - margin;
        break;
      default:
        top = '50%';
        left = '50%';
        break;
    }
    
    if (left < 20) left = 20;
    if (left + tooltipWidth > window.innerWidth - 20) {
      left = window.innerWidth - tooltipWidth - 20;
    }
    if (top < 20) top = 20;
    if (top + tooltipHeight > window.innerHeight - 20) {
      top = window.innerHeight - tooltipHeight - 20;
    }

    return {
      position: 'fixed',
      top,
      left,
      width: `${tooltipWidth}px`,
      zIndex: 9999,
      backgroundColor: 'white',
      padding: '1.5rem',
      borderRadius: '0.75rem',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
      border: '1px solid var(--border-color)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    };
  };

  return (
    <>
      <style>{`
        @keyframes bounceUp {
          0%, 100% { transform: translateY(0) rotate(180deg); }
          50% { transform: translateY(8px) rotate(180deg); }
        }
        @keyframes bounceDown {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes bounceLeft {
          0%, 100% { transform: translateX(0) rotate(90deg); }
          50% { transform: translateX(8px) rotate(90deg); }
        }
        @keyframes bounceRight {
          0%, 100% { transform: translateX(0) rotate(-90deg); }
          50% { transform: translateX(-8px) rotate(-90deg); }
        }
      `}</style>

      {/* Spotlight Overlay */}
      {targetRect ? (
        <div style={{
          position: 'fixed',
          top: targetRect.top - 8,
          left: targetRect.left - 8,
          width: targetRect.width + 16,
          height: targetRect.height + 16,
          borderRadius: '8px',
          boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.75)',
          border: '3px solid var(--primary-color)',
          zIndex: 9998,
          pointerEvents: 'none',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }} />
      ) : (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          zIndex: 9998,
          transition: 'all 0.3s ease'
        }} />
      )}

      {/* Target Pointer Arrow */}
      <div style={getPointerStyle()}>
        <svg viewBox="0 0 24 24" width="32" height="32" stroke="var(--primary-color)" strokeWidth="2.5" fill="var(--primary-color)" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.2))' }}>
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <polyline points="19 12 12 19 5 12"></polyline>
        </svg>
      </div>

      {/* Floating Tooltip Card */}
      <div style={getTooltipStyle()}>
        <button 
          onClick={completeTutorial} 
          style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
          title={language === 'id' ? "Lewati Tur" : "Skip Tour"}
        >
          <X size={20} />
        </button>

        <h3 style={{ 
          fontSize: '1.1rem', 
          fontWeight: '700', 
          color: 'var(--primary-color)', 
          marginBottom: '0.5rem',
          paddingRight: '1.5rem',
          textAlign: targetRect ? 'left' : 'center'
        }}>
          {language === 'id' ? currentStepData.titleID : currentStepData.titleEN}
        </h3>
        
        <p style={{ 
          fontSize: '0.875rem', 
          color: 'var(--text-main)', 
          lineHeight: '1.5', 
          marginBottom: '1.5rem',
          textAlign: targetRect ? 'left' : 'center'
        }}>
          {language === 'id' ? currentStepData.descID : currentStepData.descEN}
        </p>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '500' }}>
            {currentStep + 1} / {steps.length}
          </span>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {currentStep > 0 && (
              <button 
                style={{ 
                  padding: '0.35rem 0.75rem', 
                  border: '1px solid var(--border-color)', 
                  backgroundColor: 'white', 
                  borderRadius: '0.375rem', 
                  color: 'var(--text-main)',
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  cursor: 'pointer'
                }} 
                onClick={() => setCurrentStep(prev => prev - 1)}
              >
                <ChevronLeft size={14} /> {language === 'id' ? 'Kembali' : 'Back'}
              </button>
            )}
            
            {currentStep < steps.length - 1 ? (
              <button 
                className="btn btn-primary" 
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                onClick={() => setCurrentStep(prev => prev + 1)}
              >
                {language === 'id' ? 'Lanjut' : 'Next'} <ChevronRight size={14} />
              </button>
            ) : (
              <button 
                className="btn btn-primary" 
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                onClick={completeTutorial}
              >
                {language === 'id' ? 'Selesai' : 'Get Started'}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

