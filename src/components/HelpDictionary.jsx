import React from 'react';
import { dictionaryTerms } from '../data/constants';

export default function HelpDictionary() {
  return (
    <div className="help-page animate-fade-in">
      <h2>ERP Dictionary & Terminology</h2>
      <p style={{marginBottom: '2rem', color: 'var(--text-muted)'}}>
        Use this guide to understand the various acronyms and systems utilized within the MOAI Supply Chain flow.
      </p>
      {dictionaryTerms.map((item, idx) => (
        <div className="term-card" key={idx}>
          <div className="term-title">{item.term}</div>
          <div className="term-desc">{item.desc}</div>
        </div>
      ))}
    </div>
  );
}
