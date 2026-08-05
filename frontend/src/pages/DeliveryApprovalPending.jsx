import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import { apiError } from '../services/api.js'
import { getDeliveryApplicationStatus } from '../services/deliveryApi.js'

export default function DeliveryApprovalPending() {
  const location = useLocation(); const navigate = useNavigate()
  const application = useMemo(() => {
    if (location.state?.id && location.state?.email) return location.state
    try { return JSON.parse(sessionStorage.getItem('delivery-partner-application')) } catch { return null }
  }, [location.state])
  const [result,setResult] = useState(null); const [loading,setLoading] = useState(false); const [error,setError] = useState('')
  const check = useCallback(async (quiet = false) => {
    if (!application?.id || !application?.email) return
    if (!quiet) setLoading(true); setError('')
    try {
      const response = await getDeliveryApplicationStatus(application.id,application.email); setResult(response.data.data)
      if (response.data.data.approval_status === 'approved') { sessionStorage.removeItem('delivery-partner-application'); navigate('/login',{ replace:true,state:{ message:'Your Delivery Partner application was approved. You can now log in.' } }) }
    } catch (requestError) { if (!quiet) setError(apiError(requestError)) } finally { if (!quiet) setLoading(false) }
  },[application,navigate])
  useEffect(() => { check(); const timer = window.setInterval(() => check(true),30000); return () => window.clearInterval(timer) },[check])

  const rejected = result?.approval_status === 'rejected'
  return <div className="page"><Navbar/><main className="page-content approval-page"><section className="card approval-card"><div className={`approval-icon ${rejected ? 'rejected' : ''}`}>{rejected ? '×' : '⌛'}</div><span className="eyebrow">Delivery Partner application</span><h1>{rejected ? 'Application not approved' : 'Waiting for Admin approval'}</h1><p>{rejected ? 'Your application was not approved. Contact TasteLoop support if you need more information.' : 'Your application has been submitted successfully. An Admin will review your details and documents before activating your account.'}</p>{result && <div className="approval-status-row"><span>Application status</span><strong className={rejected ? 'rejected' : ''}>{result.approval_status.replaceAll('_',' ')}</strong></div>}{error && <div className="form-error" role="alert">{error}</div>}<div className="approval-actions"><button className="btn btn-primary" type="button" disabled={loading || !application} onClick={() => check()}>{loading ? 'Checking…' : 'Check approval status'}</button><Link className="btn btn-outline" to="/login">Return to Login</Link></div>{!application && <p className="approval-help">Application information was not found in this browser. Submit a new application or return to Login.</p>}<small>Status is checked automatically every 30 seconds.</small></section></main><Footer/></div>
}
