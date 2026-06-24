import React from 'react';
import { dictionaryTerms } from '../data/constants';

export default function HelpDictionary({ language }) {
  const categorizedTerms = [
    {
      title: "Process 1: Ordering Preparation",
      definitionTerm: "Process 1: Ordering Preparation",
      terms: ["CPO / ESTA", "VC", "WBS", "NW", "BoQ", "PP", "RO", "OCL"]
    },
    {
      title: "Process 2: Material Delivery",
      definitionTerm: "Process 2: Material Delivery",
      terms: ["EPC", "SLDM"]
    },
    {
      title: "Process 3: Custom Clearance",
      definitionTerm: "Process 3: Custom Clearance",
      terms: []
    },
    {
      title: "Process 4: WH Management & Logistics",
      definitionTerm: "Process 4: WH Management",
      terms: ["LSP", "GR / GI"]
    },
    {
      title: "Process 5: EID Last Mile",
      definitionTerm: "Process 5: EID Last Mile",
      terms: ["OBD", "POD", "MR"]
    },
    {
      title: "Process 6: Local 3PP Flow",
      definitionTerm: "Process 6: Local 3PP Flow",
      terms: ["3PP"]
    }
  ];

  return (
    <div className="help-page animate-fade-in" style={{ paddingBottom: '3rem' }}>
      <h2>{language === 'id' ? 'Bantuan & Terminologi Sistem' : 'System Help & Terminology'}</h2>
      <p style={{marginBottom: '2rem', color: 'var(--text-muted)'}}>
        {language === 'id' ? 'Gunakan panduan ini untuk memahami berbagai singkatan dan sistem yang digunakan di seluruh alur Rantai Pasokan MOAI, dan pelajari cara menggunakan ERP.' : 'Use this categorized guide to understand the various acronyms and systems utilized across the MOAI Supply Chain flow, and learn how to use the ERP.'}
      </p>

      <div style={{ marginBottom: '3rem', backgroundColor: 'white', padding: '2rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <h3 style={{ fontSize: '1.25rem', color: 'var(--primary-color)', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
          📖 {language === 'id' ? 'Buku Panduan ERP (User Manual)' : 'ERP User Manual'}
        </h3>
        
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
              3. Supply Chain Flow: Creating a New Order
            </summary>
            <div style={{ padding: '1rem 0 0 1rem' }}>
              <p><strong>Step 4: Create Order</strong></p>
              <ol>
                <li>{language === 'id' ? 'Masuk ke modul Supply Chain Flow (Kanban Board).' : 'Enter the Supply Chain Flow (Kanban Board) module.'}</li>
                <li>{language === 'id' ? 'Klik tombol New Order untuk menambahkan pesanan baru.' : 'Click the New Order button to add a new order.'}</li>
                <li>{language === 'id' ? 'Pilih Item dari master data dan tentukan Kuantitas yang dipesan.' : 'Select an Item from the master data and specify the ordered Quantity.'}</li>
                <li>{language === 'id' ? 'Masukkan nama Anda sebagai penanggung jawab pesanan (Assignee).' : 'Enter your name as the order assignee.'}</li>
                <li>{language === 'id' ? 'Tentukan tingkat prioritas pesanan. Klik Create Order.' : 'Determine the order priority level. Click Create Order.'}</li>
              </ol>
            </div>
          </details>

          <details open style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
            <summary style={{ fontWeight: '600', cursor: 'pointer', fontSize: '1rem', color: 'var(--primary-color)' }}>
              4. Fulfillment Pipeline Execution (Drag & Drop)
            </summary>
            <div style={{ padding: '1rem 0 0 1rem' }}>
              <p><em>{language === 'id' ? 'Pipeline ERP beroperasi menggunakan sistem Kanban Board. Pesanan harus menyelesaikan semua checklist prasyarat sebelum dapat dipindahkan ke tahap selanjutnya.' : 'The ERP Pipeline operates on a Kanban Board system. Orders must complete all prerequisite checklists before they can be moved to the next stage.'}</em></p>
              
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
                <li><strong>Step 5 (Process 1):</strong> {language === 'id' ? 'Klik pada kartu pesanan. Selesaikan prasyarat (VC, WBS, ESTA/PO, Info Partner). Setelah checklist komplit, tahan dan tarik (drag) order ke kolom selanjutnya di Process 1 secara berurutan.' : 'Click the order card. Complete the prerequisites (VC, WBS, ESTA/PO, Partner Info). Once the checklist is complete, hold and drag the order to the next column in Process 1 sequentially.'}</li>
                <li><strong>Step 6 (Process 2):</strong> {language === 'id' ? 'Lengkapi checklist dan unggah form dokumen pengiriman (DO, Packing List, Invoice, dll) sebelum menyeret order ke Process 2.' : 'Complete the checklist and upload delivery document forms (DO, Packing List, Invoice, etc.) before dragging the order to Process 2.'}</li>
                <li><strong>Step 7 (Process 3):</strong> {language === 'id' ? 'Selesaikan persyaratan pabean dan unggah form Izin Impor sebelum order dapat melewati tahap Custom Clearance.' : 'Complete customs requirements and upload Import Permit forms before the order can pass the Custom Clearance stage.'}</li>
                <li><strong>Step 8 (Process 4):</strong> {language === 'id' ? 'Selesaikan checklist dokumen Gudang (GRN, Put Away List, GI) sebelum order masuk ke tahap Warehouse Management. Di sini stok akan otomatis di-update.' : 'Complete the Warehouse document checklist (GRN, Put Away List, GI) before the order enters Warehouse Management. Inventory stock updates automatically here.'}</li>
                <li><strong>Step 9 & 10 (Process 5 & 6):</strong> {language === 'id' ? 'Untuk jalur EID Last Mile dan Local 3PP Flow, ikuti pola yang sama: klik pesanan, lengkapi dokumen spesifik, lalu geser kartu hingga kolom terakhir.' : 'For EID Last Mile and Local 3PP Flow, follow the same pattern: click the order, complete specific documents, then drag the card to the final column.'}</li>
              </ul>
            </div>
          </details>

          <details style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
            <summary style={{ fontWeight: '600', cursor: 'pointer', fontSize: '1rem', color: 'var(--primary-color)' }}>
              5. Generating Official PO Document
            </summary>
            <div style={{ padding: '1rem 0 0 1rem' }}>
              <ol>
                <li>{language === 'id' ? 'Klik pada kartu order yang diinginkan untuk membuka laci Order Drawer.' : 'Click on the desired order card to open the Order Drawer.'}</li>
                <li>{language === 'id' ? 'Di bagian General Info, cari dan klik tombol Generate PO Document.' : 'In the General Info section, find and click the Generate PO Document button.'}</li>
                <li>{language === 'id' ? 'Sistem akan membuka tab baru berisi PDF Purchase Order resmi yang merangkum vendor, kuantitas, harga, dan total biaya.' : 'The system will open a new tab containing an official Purchase Order PDF summarizing the vendor, quantity, price, and total cost.'}</li>
                <li>{language === 'id' ? 'Klik tombol Print PDF untuk mencetak atau menyimpannya secara lokal.' : 'Click the Print PDF button to print or save it locally.'}</li>
              </ol>
            </div>
          </details>

        </div>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
        {categorizedTerms.map((category) => {
          const definition = dictionaryTerms.find(t => t.term === category.definitionTerm);
          return (
            <div key={category.title} className="dictionary-category">
              <h3 style={{ 
                fontSize: '1.25rem', 
                color: 'var(--primary-color)', 
                borderBottom: '2px solid var(--border-color)', 
                paddingBottom: '0.5rem',
                marginBottom: '0.5rem'
              }}>
                {category.title}
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
                  {definition.desc}
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
                        <div className="term-desc">{termData.desc}</div>
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
