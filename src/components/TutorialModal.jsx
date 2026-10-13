import { useState, useEffect, useCallback } from 'react';
import { ChevronRight, ChevronLeft, X } from 'lucide-react';

const steps = [
  {
    titleEN: "MOAI ERP: End-to-End SCM Guide",
    titleID: "MOAI ERP: Panduan SCM End-to-End",
    descEN: "Welcome! This interactive guide will walk you through the actual business logic of each module in the v2.0 Supply Chain ERP, with detailed real-world examples.",
    descID: "Selamat datang! Panduan interaktif ini akan membawa Anda membedah logika bisnis sesungguhnya di setiap modul ERP Rantai Pasok v2.0, lengkap dengan contoh kasus detail.",
    selector: null,
    placement: 'center',
    view: 'inventory'
  },
  {
    titleEN: "1. Inventory & Serial Management",
    titleID: "1. Manajemen Persediaan & Nomor Seri",
    descEN: "The operational core: track stock balances, serial numbers, bin locations, transfers, and stock adjustments.\n\n💡 Example: When a motherboard arrives at the warehouse, staff log a Goods Receipt and the system increments its stock balance and registers each serial number.",
    descID: "Inti operasional: pantau saldo stok, nomor seri, lokasi bin, transfer, dan penyesuaian stok.\n\n💡 Contoh: Saat motherboard tiba di gudang, staff mencatat penerimaan barang (GR) dan sistem menambah saldo stok serta mendaftarkan setiap nomor seri.",
    selector: null,
    placement: 'center',
    view: 'inventory'
  },
  {
    titleEN: "2. SCM & Inbound QC Gate",
    titleID: "2. SCM & Gerbang QC Inbound",
    descEN: "Raise purchase requisitions, issue Purchase Orders to suppliers, receive goods, and gate them through QC inspection.\n\n💡 Example: A requisition for 20 CPUs converts into a PO; on arrival the batch passes QC Inspection before entering stock.",
    descID: "Buat permintaan pembelian, terbitkan Purchase Order ke supplier, terima barang, dan lewatkan melalui inspeksi QC.\n\n💡 Contoh: Permintaan 20 unit CPU dikonversi menjadi PO; saat tiba, batch melewati QC Inspection sebelum masuk stok.",
    selector: null,
    placement: 'center',
    view: 'scm'
  },
  {
    titleEN: "3. BOM & Assembly Engine",
    titleID: "3. BOM & Mesin Perakitan",
    descEN: "Define Bills of Materials and assemble finished goods from components, with automatic component debundling and COGS roll-up.\n\n💡 Example: Assembling one Ares Elite PC consumes 1 CPU, 1 motherboard, 1 RAM kit, 1 SSD, 1 GPU, 1 PSU and 1 case — each deducted from stock automatically.",
    descID: "Definisikan Bill of Materials dan rakit barang jadi dari komponen, dengan debundling komponen otomatis dan akumulasi HPP.\n\n💡 Contoh: Merakit satu PC Ares Elite mengonsumsi 1 CPU, 1 motherboard, 1 RAM kit, 1 SSD, 1 GPU, 1 PSU dan 1 casing — masing-masing dikurangi dari stok secara otomatis.",
    selector: null,
    placement: 'center',
    view: 'assembly'
  },
  {
    titleEN: "4. Outbound & Delivery Notes",
    titleID: "4. Outbound & Surat Jalan",
    descEN: "Process sales orders, generate pick/pack tasks, and issue Delivery Notes (Surat Jalan) with signed proof of delivery.\n\n💡 Example: A sales order for a ThinkPad triggers a pick task in bin PB-A-1-01, a pack task, and a Delivery Note for the courier.",
    descID: "Proses pesanan penjualan, hasilkan tugas picking/packing, dan terbitkan Surat Jalan dengan bukti pengiriman tertandatangan.\n\n💡 Contoh: Pesanan penjualan ThinkPad memicu tugas picking di bin PB-A-1-01, tugas packing, dan Surat Jalan untuk kurir.",
    selector: null,
    placement: 'center',
    view: 'outbound'
  },
  {
    titleEN: "5. Finance, COGS & AP/AR",
    titleID: "5. Keuangan, HPP & Utang-Piutang",
    descEN: "Track cost of goods sold, accounts payable bills, accounts receivable invoices, and payment settlement.\n\n💡 Example: Each delivered order rolls up its component costs into COGS, while customer invoices post to AR aging.",
    descID: "Pantau harga pokok penjualan, tagihan utang (AP), faktur piutang (AR), dan pelunasan pembayaran.\n\n💡 Contoh: Setiap pesanan terkirim mengakumulasi biaya komponennya ke HPP, sementara faktur pelanggan masuk ke aging piutang.",
    selector: null,
    placement: 'center',
    view: 'finance'
  },
  {
    titleEN: "6. Master Data Registry",
    titleID: "6. Pendaftaran Data Induk (Master Data)",
    descEN: "Configure products, SKUs, categories, brands, warehouses, bins, suppliers, and clients before initiating transactions.\n\n💡 Example: Add a new SKU (e.g. CPU-AMD-R7) with its price and supplier. It instantly appears in the dropdown when creating new transactions.",
    descID: "Konfigurasi produk, SKU, kategori, merek, gudang, bin, supplier, dan klien sebelum memulai transaksi.\n\n💡 Contoh: Daftarkan SKU baru (misal CPU-AMD-R7) beserta harga dan supplier terkait. Produk tersebut langsung muncul di dropdown saat membuat transaksi baru.",
    selector: '#tour-sidebar-master',
    placement: 'right',
    view: 'master_data'
  },
  {
    titleEN: "Managerial & Worker KPI",
    titleID: "Manajerial & Kinerja Staf",
    descEN: "Monitor aggregate metrics: active orders, completed jobs, critical/low stock, and worker productivity to catch bottlenecks early.\n\n💡 Example: If inbound QC lead time spikes, managers spot the delay here and act immediately.",
    descID: "Pantau metrik gabungan: pesanan aktif, pekerjaan selesai, stok kritis, dan produktivitas staf untuk mendeteksi kendala operasional.\n\n💡 Contoh: Jika lead time QC inbound melonjak, manajemen bisa langsung mendeteksi hambatan di sini dan segera bertindak.",
    selector: null,
    placement: 'center',
    view: 'managerial'
  }
];

export default function TutorialModal({ forceOpen, setForceOpen, currentView, setCurrentView, language }) {
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return !localStorage.getItem('moai_tutorial_completed');
    }
    return false;
  });
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const [prevForceOpen, setPrevForceOpen] = useState(forceOpen);

  if (forceOpen && !prevForceOpen) {
    setPrevForceOpen(forceOpen);
    setIsOpen(true);
    setCurrentStep(0);
  } else if (!forceOpen && prevForceOpen) {
    setPrevForceOpen(forceOpen);
  }

  useEffect(() => {
    if (forceOpen && setForceOpen) {
      setForceOpen(false);
    }
  }, [forceOpen, setForceOpen]);

  const calculateRect = useCallback(() => {
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
  }, [currentStep]);

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
  }, [currentStep, currentView, isOpen, calculateRect, setCurrentView]);

  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener('resize', calculateRect);
    return () => window.removeEventListener('resize', calculateRect);
  }, [isOpen, calculateRect]);

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
    
    let top;
    let left;
    
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

