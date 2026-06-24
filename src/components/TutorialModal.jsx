import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, X } from 'lucide-react';

export default function TutorialModal({ forceOpen, setForceOpen, currentView, setCurrentView, language }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState(null);

  const steps = [
    {
      titleEN: "MOAI ERP: End-to-End SCM Guide",
      titleID: "MOAI ERP: Panduan SCM End-to-End",
      descEN: "Welcome! This interactive guide will walk you through the actual business logic of each SCM process step on our Kanban board, with detailed real-world examples.",
      descID: "Selamat datang! Panduan interaktif ini akan membawa Anda membedah logika bisnis sesungguhnya di setiap tahapan SCM pada papan Kanban, lengkap dengan contoh kasus detail.",
      selector: null,
      placement: 'center',
      view: 'board'
    },
    {
      titleEN: "Process 1: Ordering Preparation & Planning",
      titleID: "Proses 1: Persiapan & Perencanaan Pesanan",
      descEN: "Here, project orders are initiated and verified against contracts. Before moving to Process 2, you must enter commercial details (Value Contract #, WBS Project Code, and ESTA PO).\n\n💡 Example: Sourcing a motherboard for site XYZ requires linking VC-100293 and project code WBS-XYZ-99. Without these, the pipeline blocks further progression.",
      descID: "Di sini, pesanan proyek diinisiasi dan diperiksa kelayakannya. Sebelum kartu dapat ditarik ke Proses 2, Anda wajib melengkapi data kontrak komersial (Value Contract/VC, kode proyek WBS, dan nomor ESTA PO).\n\n💡 Contoh: Pengadaan motherboard untuk proyek XYZ mewajibkan Anda mengisi nomor kontrak VC-100293 dan kode proyek WBS-XYZ-99. Tanpa data ini, sistem akan memblokir pesanan.",
      selector: '#tour-proc-1',
      placement: 'right',
      view: 'board'
    },
    {
      titleEN: "Process 2: Material Delivery (Supplier PO)",
      titleID: "Proses 2: Pengiriman Material (Logistik Supplier)",
      descEN: "Once planned, the EPC team issues a formal Purchase Order (PO) to the global supplier. The vendor processes the order and provides pre-alert shipping details.\n\n💡 Example: For imports, the user must upload the Delivery Order (DO) and Packing List as official shipping proofs before proceeding to customs.",
      descID: "Setelah perencanaan disetujui, tim EPC menerbitkan Purchase Order (PO) resmi ke supplier global. Pemasok memproses barang dan mengirimkan berkas pengiriman awal.\n\n💡 Contoh: Untuk barang impor, user wajib mengunggah dokumen Delivery Order (DO) dan Packing List resmi dari supplier sebagai bukti fisik pengapalan sebelum masuk bea cukai.",
      selector: '#tour-proc-2',
      placement: 'right',
      view: 'board'
    },
    {
      titleEN: "Process 3: Custom Clearance & Duties",
      titleID: "Proses 3: Izin Kepabeanan (Custom Clearance)",
      descEN: "Applies exclusively to imported cargo. The customs team coordinates code verification (HS code), duty payments, and import permit releases.\n\n💡 Example: The user uploads the official Import Permit (PDF) and enters the Air Waybill (AWB) number (e.g. AWB-889922). Once cleared, materials are released to domestic transit.",
      descID: "Berlaku khusus untuk kargo impor dari luar negeri. Tim pabean melakukan verifikasi kode HS, pembayaran pajak/bea masuk, dan penerbitan izin rilis.\n\n💡 Contoh: User mengunggah berkas pdf Izin Impor (Import Permit) resmi dan menginput nomor pelacakan Air Waybill (AWB-889922). Setelah beres, barang baru dapat dikirim ke gudang lokal.",
      selector: '#tour-proc-3',
      placement: 'right',
      view: 'board'
    },
    {
      titleEN: "Process 4: Warehouse Management & Stock GR",
      titleID: "Proses 4: Manajemen Gudang & Penerimaan Stok (GR)",
      descEN: "Physical receipt and storage log. When an order card lands here, the system performs a Goods Receipt (GR) and automatically increments the inventory stock in Master Data.\n\n💡 Example: Once motherboard items physically arrive at the warehouse, staff verify the inventory and sign the Goods Receipt Note (GRN). Stock increases from 0 to 150 units in the database.",
      descID: "Fase pencatatan fisik barang masuk gudang. Begitu kartu pesanan ditarik ke kolom ini (Goods Receipt/GR), sistem secara otomatis menambahkan kuantitas persediaan barang pada Master Data.\n\n💡 Contoh: Setelah item motherboard tiba secara fisik di gudang, staff mencocokkan jumlah dan menandatangani GRN. Stok item tersebut di database akan bertambah otomatis dari 0 menjadi 150 unit.",
      selector: '#tour-proc-4',
      placement: 'right',
      view: 'board'
    },
    {
      titleEN: "Conditional Import Flow: EID Last Mile",
      titleID: "Alur Kondisional Impor: EID Last Mile",
      descEN: "The final stretch for imported goods. Materials are dispatched from the main warehouse straight to the construction site.\n\n💡 Example: A driver transports the physical motherboard to the installation site and uploads the signed Proof of Delivery (POD) document to complete the import workflow.",
      descID: "Jalur akhir khusus pengiriman barang impor. Material yang sudah tercatat di gudang utama langsung dikirim ke lokasi proyek pembangunan.\n\n💡 Contoh: Kurir mengirimkan motherboard ke lokasi pemasangan (site) dan mengunggah dokumen Proof of Delivery (POD) yang telah ditandatangani di lokasi untuk menyelesaikan siklus impor.",
      selector: '#tour-proc-5',
      placement: 'right',
      view: 'board'
    },
    {
      titleEN: "Conditional Local Flow: 3PP",
      titleID: "Alur Kondisional Lokal: 3PP",
      descEN: "Alternate bypass route for locally-sourced goods. Since local orders do not cross borders, they skip Process 2 & 3 completely, jumping directly from Process 1 to Process 6.\n\n💡 Example: A local contractor delivers materials directly to the project. After validating the delivery in Process 6, the order is pulled BACK to Process 4 to log the stock entry.",
      descID: "Jalur khusus pengadaan lokal. Karena barang dibeli di dalam negeri, pesanan tidak membutuhkan proses pabean (skip Proses 2 & 3) dan langsung melompat dari Proses 1 ke Proses 6.\n\n💡 Contoh: Kontraktor lokal mengirim material langsung. Setelah verifikasi alur lokal di Proses 6 selesai, kartu ditarik mundur kembali ke Proses 4 Gudang untuk mencatatkan stok masuknya.",
      selector: '#tour-proc-6',
      placement: 'right',
      view: 'board'
    },
    {
      titleEN: "KPI Dashboard Performance",
      titleID: "Dasbor Kinerja Utama (KPI)",
      descEN: "Monitor aggregate SCM metrics: total active orders, completed jobs, critical/low stocks, and average lead times to catch bottlenecks early.\n\n💡 Example: If the average Lead Time in Process 3 (Customs) exceeds 10 days, managers can spot the delay here and take immediate actions with the customs broker.",
      descID: "Pantau metrik SCM gabungan: total pesanan aktif, rasio penyelesaian, barang dengan stok kritis, serta rata-rata lead time untuk mendeteksi kendala operasional.\n\n💡 Contoh: Jika rata-rata Lead Time di Proses 3 (Pabean) membengkak hingga 10 hari, manajemen bisa langsung mendeteksi hambatan dokumen di sini dan menegur agen pialang.",
      selector: '#tour-metrics-container',
      placement: 'bottom',
      view: 'board'
    },
    {
      titleEN: "Master Data Registry",
      titleID: "Pendaftaran Data Induk (Master Data)",
      descEN: "Configure and register items, SKU categories, prices, initial stocks, and Suppliers before initiating orders.\n\n💡 Example: Add a new SKU (e.g. CPU-AMD-R7) with its price and source Supplier. This product will instantly appear in the dropdown menu when creating new transactions.",
      descID: "Modul konfigurasi database barang dan rekanan. Sebelum membuat pesanan, pastikan Anda mendaftarkan kode SKU barang, kategori, harga unit, dan data supplier.\n\n💡 Contoh: Daftarkan SKU baru (misal CPU-AMD-R7) beserta harga dan supplier terkait. Produk tersebut akan langsung muncul di dropdown pilihan saat Anda membuat pesanan baru.",
      selector: '#tour-sidebar-master',
      placement: 'right',
      view: 'master_data'
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
      el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      
      // Allow scroll animation to finish
      setTimeout(() => {
        const rect = el.getBoundingClientRect();
        setTargetRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height
        });
      }, 350);
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

