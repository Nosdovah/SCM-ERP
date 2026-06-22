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
          📖 {language === 'id' ? 'Cara Menggunakan Sistem' : 'How to Use the System'}
        </h3>
        <ul style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingLeft: '1.5rem', color: 'var(--text-main)', lineHeight: '1.6' }}>
          <li>
            <strong>{language === 'id' ? 'Alur Kerja Drag and Drop:' : 'Drag and Drop Workflow:'}</strong> {language === 'id' ? 'Dasbor utama adalah papan Kanban interaktif. Anda dapat mengeklik dan menahan kartu pesanan apa pun, lalu menariknya ke kolom baru untuk memajukan tahapannya dalam proses rantai pasokan.' : 'The main dashboard is an interactive Kanban board. You can click and hold any order card, then drag it into a new column to advance its stage in the supply chain process.'}
          </li>
          <li>
            <strong>{language === 'id' ? 'Checklist Pesanan 100% Terklarifikasi:' : '100% Clarified Order Checklist:'}</strong> {language === 'id' ? 'Dengan mengeklik kartu pesanan apa pun, laci detail akan muncul dari kanan. Laci ini berisi checklist yang komprehensif. Anda harus menyelesaikan item checklist yang diperlukan untuk suatu tahap sebelum sistem mengizinkan Anda menarik kartu ke fase berikutnya.' : 'By simply clicking on any order card, a details drawer will slide out from the right. This drawer contains a comprehensive checklist. You must complete the required checklist items for a stage before the system allows you to drag the card to the next phase.'}
          </li>
          <li>
            <strong>{language === 'id' ? 'Membuat Pesanan Baru:' : 'Creating New Orders:'}</strong> {language === 'id' ? 'Klik tombol "Pesanan Baru" di kanan atas dasbor. Isi informasi umum untuk memulai alur pelacakan baru.' : 'Click the "New Order" button in the top right of the dashboard. Fill out the general information to initiate a new tracking flow.'}
          </li>
          <li>
            <strong>{language === 'id' ? 'Penyaringan & Pencarian:' : 'Filtering & Searching:'}</strong> {language === 'id' ? 'Gunakan bilah pencarian untuk menemukan pesanan dengan cepat berdasarkan ID, judul, atau penerima tugas. Anda juga dapat memfilter pesanan berdasarkan tingkat prioritas menggunakan dropdown di sebelah bilah pencarian.' : 'Use the search bar to quickly find orders by ID, title, or assignee. You can also filter orders by priority level (High, Medium, Low) using the dropdown next to the search bar.'}
          </li>
        </ul>
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
