import { ChevronRight } from 'lucide-react';

// End-to-end process flow, grouped by business flow (not by module), so a user
// can follow a single transaction from procure -> build -> sell without hopping
// blindly between the function-grouped sidebar modules.
const FLOWS = [
  {
    key: 'procure',
    label: '1 · Belanja Barang',
    color: '#0369a1',
    steps: [
      { code: '2.2', name: 'Saran Reorder', view: 'scm', feature: 'reorder' },
      { code: '2.1', name: 'Purchase Order', view: 'scm', feature: 'orders' },
      { code: '2.3', name: 'Terima & QC', view: 'scm', feature: 'grn_qc' },
      { code: '5.2', name: 'Bayar AP', view: 'finance', feature: 'ap' },
    ],
  },
  {
    key: 'produce',
    label: '2 · Rakit PC',
    color: '#047857',
    steps: [
      { code: '3.1', name: 'Resep BOM', view: 'assembly', feature: 'boms' },
      { code: '3.3', name: 'Simulator', view: 'assembly', feature: 'simulator' },
      { code: '3.2', name: 'Assembly Order', view: 'assembly', feature: 'orders' },
      { code: '1.2', name: 'Nomor Seri', view: 'inventory', feature: 'serials' },
    ],
  },
  {
    key: 'cash',
    label: '3 · Jual & Kirim',
    color: '#9333ea',
    steps: [
      { code: '4.1', name: 'Sales Order', view: 'outbound', feature: 'orders' },
      { code: '4.2', name: 'Picking', view: 'outbound', feature: 'picking' },
      { code: '4.3', name: 'Packing', view: 'outbound', feature: 'packing' },
      { code: '4.4', name: 'Surat Jalan', view: 'outbound', feature: 'surat_jalan' },
      { code: '5.3', name: 'Terima AR', view: 'finance', feature: 'ar' },
    ],
  },
];

function slug(view, feature) {
  const v = view === 'master_data' ? 'master-data' : view;
  return '#' + (feature ? `/${v}/${feature}` : `/${v}`);
}

export default function FlowGuide({ currentView, currentFeature }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: '0.4rem',
      padding: '0.55rem 0.8rem', marginBottom: '0.75rem',
      backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.6rem',
      overflowX: 'auto',
    }}>
      <div style={{ fontSize: '0.7rem', fontWeight: '800', letterSpacing: '0.03em', color: '#475569' }}>
        ALUR PROSES BISNIS — klik langkah untuk lanjut (tak perlu hafal modul)
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'stretch', flexWrap: 'nowrap', minWidth: 'max-content' }}>
        {FLOWS.map((flow) => (
          <div key={flow.key} style={{ display: 'flex', alignItems: 'stretch', gap: '0.5rem' }}>
            <div style={{
              display: 'flex', alignItems: 'center', padding: '0.35rem 0.6rem',
              backgroundColor: flow.color, color: '#fff', borderRadius: '0.4rem',
              fontWeight: '700', fontSize: '0.75rem', whiteSpace: 'nowrap',
            }}>
              {flow.label}
            </div>
            {flow.steps.map((s, i) => {
              const active = currentView === s.view && (currentFeature || null) === s.feature;
              return (
                <div key={s.code} style={{ display: 'flex', alignItems: 'center' }}>
                  {i > 0 && <ChevronRight size={14} color="#94a3b8" style={{ flexShrink: 0 }} />}
                  <a
                    href={slug(s.view, s.feature)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                      padding: '0.35rem 0.6rem', borderRadius: '0.4rem', whiteSpace: 'nowrap',
                      fontSize: '0.78rem', fontWeight: active ? '700' : '500',
                      backgroundColor: active ? flow.color : '#fff',
                      color: active ? '#fff' : '#334155',
                      border: `1px solid ${active ? flow.color : '#cbd5e1'}`,
                      textDecoration: 'none', cursor: 'pointer',
                    }}
                  >
                    <span style={{ opacity: active ? 0.95 : 0.55, fontWeight: '800' }}>{s.code}</span>
                    {s.name}
                  </a>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}