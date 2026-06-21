import React from 'react';
import { dictionaryTerms } from '../data/constants';

export default function HelpDictionary() {
  const categorizedTerms = {
    "Process 1: Ordering Preparation": ["CPO / ESTA", "VC", "WBS", "NW", "BoQ", "PP", "RO", "OCL"],
    "Process 2: Material Delivery": ["EPC", "SLDM"],
    "Process 3 & 4: Logistics & Warehouse": ["LSP", "GR / GI"],
    "Process 5: EID Last Mile": ["OBD", "POD", "MR"],
    "Process 6: Local 3PP Flow": ["3PP"],
    "Process Definitions": [
      "Process 1: Ordering Preparation", 
      "Process 2: Material Delivery", 
      "Process 3: Custom Clearance", 
      "Process 4: WH Management", 
      "Process 5: EID Last Mile", 
      "Process 6: Local 3PP Flow"
    ]
  };

  return (
    <div className="help-page animate-fade-in" style={{ paddingBottom: '3rem' }}>
      <h2>ERP Dictionary & Terminology</h2>
      <p style={{marginBottom: '2rem', color: 'var(--text-muted)'}}>
        Use this categorized guide to understand the various acronyms and systems utilized across the MOAI Supply Chain flow.
      </p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {Object.entries(categorizedTerms).map(([category, terms]) => (
          <div key={category} className="dictionary-category">
            <h3 style={{ 
              fontSize: '1.25rem', 
              color: 'var(--primary-color)', 
              borderBottom: '2px solid var(--border-color)', 
              paddingBottom: '0.5rem',
              marginBottom: '1rem'
            }}>
              {category}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
              {terms.map(termName => {
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
          </div>
        ))}
      </div>
    </div>
  );
}
