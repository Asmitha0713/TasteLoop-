import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api, { apiError, currentUser } from '../services/api.js'

const issueTypes = [
  ['food_quality', 'Food Quality'],
  ['wrong_order', 'Wrong Order'],
  ['late_delivery', 'Late Delivery'],
  ['payment_issue', 'Payment Issue'],
  ['home_cook_issue', 'Home Cook Issue'],
  ['customer_issue', 'Customer Issue'],
  ['food_damaged_during_delivery', 'Food damaged during delivery'],
  ['food_spilled', 'Food spilled'],
  ['wrong_food_received', 'Wrong food received'],
  ['missing_food_item', 'Missing food item'],
  ['poor_packaging', 'Poor packaging'],
  ['other', 'Other'],
]

export default function ComplaintForm({ order, onClose, onSubmitted }) {
  const navigate = useNavigate()
  const user = currentUser()
  const isCook = user?.role === 'home_cook'
  const [orderId, setOrderId] = useState(order?.id || '')
  const [issueType, setIssueType] = useState('food_quality')
  const [description, setDescription] = useState('')
  const [solution, setSolution] = useState('refund')
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview])
  const chooseImage = event => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return setError('Choose a JPEG, PNG, or WebP image.')
    if (file.size > 5 * 1024 * 1024) return setError('Evidence image must not exceed 5 MB.')
    if (preview) URL.revokeObjectURL(preview)
    setImage(file); setPreview(URL.createObjectURL(file)); setError('')
  }
  const submit = async event => {
    event.preventDefault()
    if (!orderId.trim()) return setError('Enter the related order ID.')
    setSubmitting(true); setError('')
    const form = new FormData()
    form.append('order_id', orderId.trim())
    form.append('issue_type', issueType)
    form.append('description', description)
    form.append('requested_solution', isCook ? 'resolution' : solution)
    if (image) form.append('evidence_image', image)
    try {
      const { data } = await api.post('/complaints', form)
      onSubmitted?.(data.data)
      onClose?.()
      navigate(isCook ? '/cook/complaints' : '/complaints')
    } catch (requestError) { setError(apiError(requestError)) }
    finally { setSubmitting(false) }
  }
  return <div className="complaint-modal" role="dialog" aria-modal="true" aria-labelledby="complaint-title"><form className="card complaint-form" onSubmit={submit}>
    <div className="complaint-form-head"><div><span className="eyebrow">Order support</span><h2 id="complaint-title">Submit a complaint</h2>{order&&<p>Order #{order.order_number || order.id}</p>}</div><button type="button" onClick={onClose} aria-label="Close complaint form">×</button></div>
    {error && <div className="error-banner">{error}</div>}
    <div className="complaint-fields"><label><span>Order ID</span><input value={order?.order_number || orderId} onChange={event=>setOrderId(event.target.value)} disabled={Boolean(order)} required placeholder="Example: TL-12345" /></label><label><span>Complaint type</span><select value={issueType} onChange={event => setIssueType(event.target.value)}>{issueTypes.map(([value,label])=><option value={value} key={value}>{label}</option>)}</select></label>
      <label className="wide"><span>Description</span><textarea rows="5" value={description} onChange={event=>setDescription(event.target.value)} minLength="10" maxLength="2000" required placeholder="Explain what happened and which items were affected." /></label>
      <label className="wide"><span>Image evidence (optional)</span><div className="complaint-upload">{preview ? <img src={preview} alt="Complaint evidence preview" /> : <div><b>＋</b><strong>Upload evidence</strong><small>Optional · JPEG, PNG or WebP · maximum 5 MB</small></div>}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseImage} /></div></label>
      {!isCook&&<fieldset className="wide"><legend>Preferred solution</legend><div className="complaint-solutions">{[['refund','Refund'],['replacement','Replacement order']].map(([value,label])=><label className={solution===value?'selected':''} key={value}><input type="radio" name="solution" value={value} checked={solution===value} onChange={()=>setSolution(value)} /><span>{label}</span></label>)}</div></fieldset>}
    </div><div className="complaint-form-actions"><button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={submitting}>{submitting?'Submitting…':'Submit complaint'}</button></div>
  </form></div>
}

export const complaintIssueLabel = value => issueTypes.find(([key]) => key === value)?.[1] || value?.replaceAll('_',' ')
