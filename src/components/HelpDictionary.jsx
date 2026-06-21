import React from 'react';
import { dictionaryTerms } from '../data/constants';

export default function HelpDictionary() {
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
      <h2>ERP Dictionary & Terminology</h2>
      <p style={{marginBottom: '2rem', color: 'var(--text-muted)'}}>
        Use this categorized guide to understand the various acronyms and systems utilized across the MOAI Supply Chain flow.
      </p>
      
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
