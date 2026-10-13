import { HelpCircle } from 'lucide-react';
import { dictionaryTerms } from '../data/constants';

export default function HelpDictionary({ language, onOpenTutorial }) {
  const categorizedTerms = [
    {
      titleEN: "Process 1: Ordering Preparation",
      titleID: "Proses 1: Persiapan Pemesanan",
      definitionTerm: "Process 1: Ordering Preparation",
      terms: ["CPO / ESTA", "VC", "WBS", "NW", "BoQ", "PP", "RO", "OCL"]
    },
    {
      titleEN: "Process 2: Material Delivery",
      titleID: "Proses 2: Pengiriman Material",
      definitionTerm: "Process 2: Material Delivery",
      terms: ["EPC", "SLDM"]
    },
    {
      titleEN: "Process 3: Custom Clearance",
      titleID: "Proses 3: Izin Kepabeanan (Custom Clearance)",
      definitionTerm: "Process 3: Custom Clearance",
      terms: []
    },
    {
      titleEN: "Process 4: WH Management & Logistics",
      titleID: "Proses 4: Manajemen Gudang & Logistik",
      definitionTerm: "Process 4: WH Management",
      terms: ["LSP", "GR / GI"]
    },
    {
      titleEN: "Conditional Import Flow: EID Last Mile",
      titleID: "Alur Kondisional Impor: EID Last Mile",
      definitionTerm: "Conditional Import Flow: EID Last Mile",
      terms: ["OBD", "POD", "MR"]
    },
    {
      titleEN: "Conditional Local Flow: 3PP",
      titleID: "Alur Kondisional Lokal: 3PP",
      definitionTerm: "Conditional Local Flow: 3PP",
      terms: ["3PP"]
    },
    {
      titleEN: "v2.0 Distributor & Computer Integrator Operations",
      titleID: "v2.0 Operasional Distributor & Integrator Komputer",
      definitionTerm: null,
      terms: ["BOM (Bill of Materials)", "SN / IMEI Tracking", "GRN & Inbound QC", "RMA & Defective Quarantine", "COGS Roll-up", "RTV (Return to Vendor)"]
    }
  ];

  return (
    <div className="help-page animate-fade-in" style={{ paddingBottom: '3rem' }}>
      <h2>{language === 'id' ? 'Bantuan & Terminologi Sistem' : 'System Help & Terminology'}</h2>
      <p style={{marginBottom: '2rem', color: 'var(--text-muted)'}}>
        {language === 'id' ? 'Gunakan panduan ini untuk memahami berbagai singkatan dan sistem yang digunakan di seluruh alur Rantai Pasokan MOAI, dan pelajari cara menggunakan ERP.' : 'Use this categorized guide to understand the various acronyms and systems utilized across the MOAI Supply Chain flow, and learn how to use the ERP.'}
      </p>

      <div style={{ marginBottom: '3rem', backgroundColor: 'white', padding: '2rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', color: 'var(--primary-color)', margin: 0 }}>
            📖 {language === 'id' ? 'Buku Panduan ERP (User Manual)' : 'ERP User Manual'}
          </h3>
          <button onClick={onOpenTutorial} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '600', transition: 'all 0.2s' }}>
            <HelpCircle size={18} />
            {language === 'id' ? 'Mulai Tur Interaktif' : 'Start Interactive Tour'}
          </button>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', color: 'var(--text-main)', lineHeight: '1.6', fontSize: '0.95rem' }}>
          
          <details style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
            <summary style={{ fontWeight: '600', cursor: 'pointer', fontSize: '1rem', color: 'var(--primary-color)' }}>
              1. Profile and Settings Configuration
            </summary>
            <div style={{ padding: '1rem 0 0 1rem' }}>
              <p><strong>Step 1:</strong> {language === 'id' ? 'Setelah login dan masuk ke dashboard utama, navigasikan ke menu Profile atau Settings.' : 'After logging into the main dashboard, navigate to the Profile or Settings menu.'}</p>
              <p><strong>Step 2:</strong> {language === 'id' ? 'Masukkan nama perusahaan/organisasi Anda. Tentukan peran sistem (Role) yang diinginkan (Pilih Admin untuk akses penuh). Setelah selesai, klik Update Profile.' : 'Enter your company/organization name. Select your desired system Role (Choose Admin for full access). Click Update Profile when done.'}</p>
            </div>
          </details>

          <details style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
            <summary style={{ fontWeight: '600', cursor: 'pointer', fontSize: '1rem', color: 'var(--primary-color)' }}>
              2. Master Data Setup
            </summary>
            <div style={{ padding: '1rem 0 0 1rem' }}>
              <p><strong>Step 3: Master Data Configuration</strong></p>
              <ul>
                <li style={{marginBottom: '0.5rem'}}><strong>Suppliers:</strong> {language === 'id' ? 'Buka modul Master Data. Pilih tab Suppliers. Masukkan detail perusahaan dan klik Create Supplier.' : 'Open the Master Data module. Select the Suppliers tab. Enter company details and click Create Supplier.'}</li>
                <li><strong>Items (SKUs):</strong> {language === 'id' ? 'Pindah ke tab Items. Isi formulir Add New Item secara lengkap (SKU, Item Name, Category, Supplier, Unit Price, Stock). Klik Create Item.' : 'Switch to the Items tab. Fill out the Add New Item form completely (SKU, Item Name, Category, Supplier, Unit Price, Stock). Click Create Item.'}</li>
              </ul>
            </div>
          </details>

          <details style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
            <summary style={{ fontWeight: '600', cursor: 'pointer', fontSize: '1rem', color: 'var(--primary-color)' }}>
              3. SCM & Inbound: Creating a Purchase Order
            </summary>
            <div style={{ padding: '1rem 0 0 1rem' }}>
              <p><strong>Step 4: Create Purchase Order</strong></p>
              <ol>
                <li>{language === 'id' ? 'Masuk ke modul 2. SCM & QC Inbound.' : 'Enter the 2. SCM & Inbound QC module.'}</li>
                <li>{language === 'id' ? 'Buat Permintaan Pembelian (Requisition) lalu konversi menjadi Purchase Order.' : 'Raise a Purchase Requisition, then convert it into a Purchase Order.'}</li>
                <li>{language === 'id' ? 'Pilih Supplier dan item dari Master Data, lalu tentukan Kuantitas yang dipesan.' : 'Select the Supplier and item from Master Data, then specify the ordered Quantity.'}</li>
                <li>{language === 'id' ? 'Terbitkan PO dan catat penerimaan barang (Goods Receipt) saat material tiba.' : 'Issue the PO and log a Goods Receipt when the materials arrive.'}</li>
                <li>{language === 'id' ? 'Lewatkan batch melalui QC Inspection sebelum stok masuk ke Inventory.' : 'Gate the batch through QC Inspection before stock enters Inventory.'}</li>
              </ol>
            </div>
          </details>

          <details open style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
            <summary style={{ fontWeight: '600', cursor: 'pointer', fontSize: '1rem', color: 'var(--primary-color)' }}>
              4. Fulfillment Pipeline (Inventory → Assembly → Outbound)
            </summary>
            <div style={{ padding: '1rem 0 0 1rem' }}>
              <p><em>{language === 'id' ? 'Pipeline ERP v2.0 beroperasi sebagai alur modul terintegrasi. Setiap modul memperbarui stok dan HPP secara otomatis melalui API v2.' : 'The ERP v2.0 Pipeline operates as an integrated module flow. Each module updates stock and COGS automatically through the v2 API.'}</em></p>

              <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
                <li><strong>Step 5 (Inventory):</strong> {language === 'id' ? 'Pantau saldo stok, nomor seri, dan lokasi bin. Lakukan transfer antar-bin atau penyesuaian stok (stock adjustment) bila ditemukan selisih.' : 'Monitor stock balances, serial numbers, and bin locations. Perform inter-bin transfers or stock adjustments when discrepancies are found.'}</li>
                <li><strong>Step 6 (SCM & QC):</strong> {language === 'id' ? 'Kelola Requisition, Purchase Order, Goods Receipt, QC Inspection, dan Retur ke Vendor (RTV).' : 'Manage Requisitions, Purchase Orders, Goods Receipts, QC Inspections, and Return-to-Vendor (RTV) cases.'}</li>
                <li><strong>Step 7 (BOM & Assembly):</strong> {language === 'id' ? 'Tentukan Bill of Materials, lalu rakit barang jadi. Komponen otomatis dipotong dari stok dan HPP dihitung.' : 'Define the Bill of Materials, then assemble finished goods. Components are automatically deducted from stock and COGS is calculated.'}</li>
                <li><strong>Step 8 (Outbound):</strong> {language === 'id' ? 'Proses Sales Order, hasilkan Pick Task & Pack Task, lalu terbitkan Surat Jalan (Delivery Note) dengan bukti pengiriman.' : 'Process Sales Orders, generate Pick & Pack Tasks, then issue the Delivery Note with proof of delivery.'}</li>
                <li><strong>Step 9 (Finance):</strong> {language === 'id' ? 'Pantau HPP, tagihan utang (AP), faktur piutang (AR), dan pelunasan pembayaran.' : 'Track COGS, Accounts Payable bills, Accounts Receivable invoices, and payment settlement.'}</li>
              </ul>

              {/* Note: Inbound vs Outbound Routing */}
              <div style={{
                marginTop: '1.5rem',
                padding: '1rem',
                backgroundColor: '#eff6ff',
                borderLeft: '4px solid #3b82f6',
                borderRadius: '0.375rem',
                fontSize: '0.875rem'
              }}>
                <strong style={{ color: '#1e40af', display: 'block', marginBottom: '0.5rem' }}>
                  💡 {language === 'id' ? 'Keterangan Penting Alur Kerja (Inbound vs Outbound):' : 'Important Workflow Routing (Inbound vs Outbound):'}
                </strong>
                <div style={{ margin: 0, color: '#1e3a8a', lineHeight: '1.5' }}>
                  {language === 'id' ? (
                    <>
                      <strong>1. Inbound (Pengadaan):</strong> Requisition → <strong>Purchase Order</strong> → Goods Receipt → QC Inspection → Stok masuk Inventory. Supplier mengirim material, gudang mencatat penerimaan, QC memverifikasi mutu.<br/>
                      <strong style={{ display: 'block', marginTop: '0.5rem' }}>2. Outbound (Penjualan):</strong> <strong>Sales Order</strong> → Pick Task → Pack Task → Surat Jalan (Delivery Note) → Pengiriman ke pelanggan. Stok otomatis berkurang dan HPP tercatat.
                    </>
                  ) : (
                    <>
                      <strong>1. Inbound (Procurement):</strong> Requisition → <strong>Purchase Order</strong> → Goods Receipt → QC Inspection → Stock enters Inventory. The supplier ships materials, the warehouse logs receipt, and QC verifies quality.<br/>
                      <strong style={{ display: 'block', marginTop: '0.5rem' }}>2. Outbound (Sales):</strong> <strong>Sales Order</strong> → Pick Task → Pack Task → Delivery Note (Surat Jalan) → Shipment to customer. Stock decrements automatically and COGS is recorded.
                    </>
                  )}
                </div>
              </div>
            </div>
          </details>

          <details style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
            <summary style={{ fontWeight: '600', cursor: 'pointer', fontSize: '1rem', color: 'var(--primary-color)' }}>
              5. Generating Official PO Document
            </summary>
            <div style={{ padding: '1rem 0 0 1rem' }}>
              <ol>
                <li>{language === 'id' ? 'Masuk ke modul 2. SCM & QC Inbound, lalu buka daftar Purchase Order.' : 'Enter the 2. SCM & Inbound QC module, then open the Purchase Order list.'}</li>
                <li>{language === 'id' ? 'Pilih PO yang ingin dicetak dan klik tombol Generate PO Document.' : 'Select the PO you want to print and click the Generate PO Document button.'}</li>
                <li>{language === 'id' ? 'Sistem akan membuka tab baru berisi PDF Purchase Order resmi yang merangkum vendor, kuantitas, harga, dan total biaya.' : 'The system will open a new tab containing an official Purchase Order PDF summarizing the vendor, quantity, price, and total cost.'}</li>
                <li>{language === 'id' ? 'Klik tombol Print PDF untuk mencetak atau menyimpannya secara lokal.' : 'Click the Print PDF button to print or save it locally.'}</li>
              </ol>
            </div>
          </details>

          <details style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
            <summary style={{ fontWeight: '600', cursor: 'pointer', fontSize: '1rem', color: 'var(--primary-color)' }}>
              6. Master Data & Module Navigation
            </summary>
            <div style={{ padding: '1rem 0 0 1rem' }}>
              <p>
                {language === 'id' 
                  ? 'Seluruh transaksi v2.0 bersumber dari Master Data. Pastikan produk, kategori, merek, gudang, bin, supplier, dan klien terdaftar sebelum membuat transaksi apa pun.'
                  : 'Every v2.0 transaction is sourced from Master Data. Ensure products, categories, brands, warehouses, bins, suppliers, and clients are registered before creating any transaction.'
                }
              </p>
              <ol>
                <li>{language === 'id' ? 'Buka modul 6. Master Data v2.0 untuk mengelola katalog produk, gudang & bin, merek, supplier, dan klien.' : 'Open the 6. Master Data v2.0 module to manage the product catalog, warehouses & bins, brands, suppliers, and clients.'}</li>
                <li>{language === 'id' ? 'Gunakan sidebar untuk berpindah antar modul operasional: Inventory, SCM, Assembly, Outbound, dan Finance.' : 'Use the sidebar to switch between operational modules: Inventory, SCM, Assembly, Outbound, and Finance.'}</li>
                <li>{language === 'id' ? 'Pantau Lead Time Analytics dan Managerial & Worker KPI untuk mendeteksi hambatan operasional secara dini.' : 'Monitor Lead Time Analytics and Managerial & Worker KPI to catch operational bottlenecks early.'}</li>
                <li>{language === 'id' ? 'Semua endpoint API v2 memerlukan sesi terautentikasi; isolasi tenant dijaga per perusahaan.' : 'All v2 API endpoints require an authenticated session; tenant isolation is enforced per company.'}</li>
              </ol>
            </div>
          </details>

          {/* Canva Visual Diagram */}
          <div style={{ marginTop: '2.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h4 style={{ color: 'var(--primary-color)', margin: 0, fontWeight: '700', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                🖼️ {language === 'id' ? 'Bagan Alur SCM (Canva Visual Guide)' : 'SCM Flowchart (Canva Visual Guide)'}
              </h4>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <a 
                  href="https://canva.link/wdzwswsu92h7mln" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="btn"
                  title={language === 'id' ? 'Ganti link ini dengan link Canva Anda' : 'Replace this with your Canva link'}
                  style={{ 
                    fontSize: '0.75rem', 
                    color: 'white', 
                    backgroundColor: '#00c4cc',
                    border: '1px solid #00c4cc', 
                    padding: '0.35rem 0.75rem',
                    borderRadius: '0.375rem',
                    textDecoration: 'none', 
                    fontWeight: '600',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#00a3a9'; e.currentTarget.style.borderColor = '#00a3a9'; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#00c4cc'; e.currentTarget.style.borderColor = '#00c4cc'; }}
                >
                  {language === 'id' ? 'Buka di Canva ↗' : 'Open in Canva ↗'}
                </a>
                <a 
                  href="/canva_guide.webp" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="btn"
                  style={{ 
                    fontSize: '0.75rem', 
                    color: 'var(--primary-color)', 
                    border: '1px solid var(--primary-color)', 
                    backgroundColor: 'transparent',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '0.375rem',
                    textDecoration: 'none', 
                    fontWeight: '600',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(79, 70, 229, 0.05)' }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  {language === 'id' ? 'Buka Gambar Penuh ↗' : 'Open Full Image ↗'}
                </a>
              </div>
            </div>
            <div style={{ 
              overflow: 'hidden', 
              borderRadius: '0.75rem', 
              border: '1px solid var(--border-color)', 
              backgroundColor: '#f8fafc', 
              padding: '1rem', 
              display: 'flex', 
              justifyContent: 'center',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
            }}>
              <img 
                src="/canva_guide.webp" 
                alt="Canva SCM Flow Chart Guide" 
                style={{ maxWidth: '100%', height: 'auto', borderRadius: '0.5rem', boxShadow: '0 4px 15px rgba(0,0,0,0.08)' }} 
              />
            </div>
          </div>

        </div>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
        {categorizedTerms.map((category) => {
          const definition = dictionaryTerms.find(t => t.term === category.definitionTerm);
          return (
            <div key={category.titleEN} className="dictionary-category">
              <h3 style={{ 
                fontSize: '1.25rem', 
                color: 'var(--primary-color)', 
                borderBottom: '2px solid var(--border-color)', 
                paddingBottom: '0.5rem',
                marginBottom: '0.5rem'
              }}>
                {language === 'id' ? category.titleID : category.titleEN}
              </h3>
              
              {definition && (
                <p style={{
                  fontSize: '0.9rem',
                  color: 'var(--text-muted)',
                  lineHeight: '1.5',
                  marginBottom: '1.5rem',
                  backgroundColor: '#f8fafc',
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  borderLeft: '4px solid var(--accent-color)'
                }}>
                  {language === 'id' && definition.descID ? definition.descID : definition.desc}
                </p>
              )}

              {category.terms.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                  {category.terms.map(termName => {
                    const termData = dictionaryTerms.find(t => t.term === termName);
                    if (!termData) return null;
                    return (
                      <div className="term-card" key={termName} style={{ margin: 0 }}>
                        <div className="term-title">{termData.term}</div>
                        <div className="term-desc">{language === 'id' && termData.descID ? termData.descID : termData.desc}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
