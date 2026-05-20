import { useState } from 'react'
import { submitOneFeedback, getFeedback } from '../data/store'

const INITIAL = {
  customer_name: '', customer_email: '', total_spend: '',
  text: '', rating: ''
}

export default function FeedbackIntake() {
  const [tab,     setTab]     = useState('manual')
  const [form,    setForm]    = useState(INITIAL)
  const [loading, setLoading] = useState(false)
  const [result,  setResult]  = useState(null)

  const handleChange = e => setForm(f => ({...f, [e.target.name]: e.target.value}))

  const handleManualSubmit = async e => {
    e.preventDefault()
    if (!form.customer_name || !form.text) return
    setLoading(true); setResult(null)
    try {
      const record = submitOneFeedback({
        customer_name: form.customer_name,
        customer_email: form.customer_email || null,
        total_spend: parseFloat(form.total_spend) || 0,
        text: form.text,
        rating: form.rating ? parseInt(form.rating) : null,
      })
      const alertMsg = record.priority === 'Critical' ? ' (🚨 Urgent Management Alert Created)' : ' (🔔 Standard Alert Created)'
      setResult({ ok: true, message: `✅ Feedback #${record.id} submitted — Sentiment: ${record.sentiment}, Priority: ${record.priority}${alertMsg}` })
      setForm(INITIAL)
    } catch (err) {
      setResult({ ok: false, message: 'Submission failed: ' + (err.message || 'Unknown error') })
    } finally {
      setLoading(false)
    }
  }

  const handleCSVDemo = () => {
    setLoading(true); setResult(null)
    const csv = [
      { customer_name:'CSV Customer 1', customer_email:'csv1@test.com', total_spend:1500, rating:1, text:'The staff were incredibly rude and service was unacceptable for a premium customer.' },
      { customer_name:'CSV Customer 2', customer_email:'csv2@test.com', total_spend:200, rating:2, text:'My package has not arrived after two weeks. The courier says they cannot find it.' },
      { customer_name:'CSV Customer 3', customer_email:'csv3@test.com', total_spend:900, rating:3, text:'Delivery was delayed by five days with no notification from your team.' },
    ]
    csv.forEach(row => submitOneFeedback(row))
    setResult({ ok: true, message: `✅ Imported ${csv.length} records through AI analysis pipeline.` })
    setLoading(false)
  }

  return (
    <main className="page fade-in">
      <div className="page-header">
        <h1 className="page-title">Feedback Intake</h1>
        <p className="page-subtitle">Submit individual feedback or bulk-import via CSV — the AI pipeline runs automatically</p>
      </div>

      <div className="tab-bar">
        <button className={`tab-btn${tab==='manual'?' active':''}`} onClick={() => setTab('manual')}>
          ✏️ Manual Entry
        </button>
        <button className={`tab-btn${tab==='csv'?' active':''}`} onClick={() => setTab('csv')}>
          📁 CSV Upload
        </button>
      </div>

      {result && (
        <div style={{
          padding:'12px 16px', borderRadius:10, marginBottom:20,
          background: result.ok ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
          border: `1px solid ${result.ok ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
          color: result.ok ? '#34d399' : '#f87171', fontSize:'0.875rem',
        }}>
          {result.message}
        </div>
      )}

      {tab === 'manual' && (
        <div className="card" style={{maxWidth:700}}>
          <h2 style={{fontSize:'1rem',fontWeight:700,marginBottom:24,color:'var(--clr-text)'}}>
            New Customer Feedback
          </h2>
          <form onSubmit={handleManualSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Customer Name *</label>
                <input className="form-input" name="customer_name" placeholder="e.g. Sarah Johnson"
                  value={form.customer_name} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input className="form-input" name="customer_email" type="email"
                  placeholder="sarah@email.com" value={form.customer_email} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Total Spend (€)</label>
                <input className="form-input" name="total_spend" type="number"
                  placeholder="0.00" value={form.total_spend} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Rating (1–5)</label>
                <select className="form-input" name="rating" value={form.rating} onChange={handleChange}>
                  <option value="">— Select rating —</option>
                  {[1,2,3,4,5].map(r => <option key={r} value={r}>{'⭐'.repeat(r)} ({r})</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Feedback Text *</label>
              <textarea className="form-input" name="text" rows={5}
                placeholder="Describe the customer's feedback in their own words..."
                value={form.text} onChange={handleChange} required />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? '⏳ Processing...' : '🚀 Submit & Analyse'}
            </button>
          </form>
        </div>
      )}

      {tab === 'csv' && (
        <div style={{maxWidth:700}}>
          <div className="upload-zone" onClick={handleCSVDemo}>
            <div className="upload-icon">📁</div>
            <p style={{color:'var(--clr-text)',fontWeight:600,marginBottom:8}}>
              Click to import sample CSV data (demo mode)
            </p>
            <p style={{color:'var(--clr-text-muted)',fontSize:'0.85rem'}}>
              In standalone mode, this imports 3 pre-built demo records through the analysis pipeline
            </p>
          </div>

          {loading && (
            <div className="loading-wrap" style={{padding:20}}>
              <div className="spinner" />
              <span>Processing CSV through AI pipeline...</span>
            </div>
          )}

          <div className="card" style={{marginTop:24}}>
            <div className="card-title">CSV Format Guide</div>
            <table className="data-table" style={{fontSize:'0.8rem'}}>
              <thead>
                <tr>
                  <th>Column</th><th>Required</th><th>Example</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['customer_name','Yes','Sarah Johnson'],
                  ['feedback_text','Yes','The delivery was very late...'],
                  ['rating','No','1–5 integer'],
                  ['total_spend','No','1500.00'],
                  ['customer_email','No','sarah@email.com'],
                ].map(([col,req,ex]) => (
                  <tr key={col}>
                    <td><code style={{color:'var(--clr-accent)'}}>{col}</code></td>
                    <td style={{color: req==='Yes' ? 'var(--clr-success)' : 'var(--clr-text-muted)'}}>{req}</td>
                    <td style={{color:'var(--clr-text-muted)'}}>{ex}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  )
}
