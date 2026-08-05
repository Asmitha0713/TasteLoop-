import { useMemo, useState } from 'react'
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { useNavigate } from 'react-router-dom'
import api, { apiError } from '../services/api.js'

function PaymentForm({ orderId, onClose }) {
  const stripe = useStripe(); const elements = useElements(); const navigate = useNavigate()
  const [submitting,setSubmitting] = useState(false); const [error,setError] = useState('')
  const pay = async (event) => {
    event.preventDefault(); if (!stripe || !elements) return
    setSubmitting(true); setError('')
    const result = await stripe.confirmPayment({ elements, confirmParams:{ return_url:`${window.location.origin}/payment-result?order_id=${orderId}` }, redirect:'if_required' })
    if (result.error) { setError(result.error.message || 'Payment could not be completed.'); setSubmitting(false); return }
    navigate(`/payment-result?order_id=${orderId}`)
  }
  const cancel = async () => {
    setSubmitting(true); setError('')
    try { await api.post(`/orders/${orderId}/payment/cancel`); onClose() } catch (requestError) { setError(apiError(requestError)); setSubmitting(false) }
  }
  return <form className="stripe-payment-form" onSubmit={pay}><PaymentElement options={{layout:'tabs'}}/>{error && <div className="form-error" role="alert">{error}</div>}<div className="stripe-payment-actions"><button type="button" className="btn btn-outline" disabled={submitting} onClick={cancel}>Cancel</button><button type="submit" className="btn btn-primary" disabled={!stripe || submitting}>{submitting ? 'Processing…' : 'Pay securely'}</button></div></form>
}

export default function StripePaymentForm({ payment, orderId, onClose }) {
  const stripePromise = useMemo(() => loadStripe(payment.publishable_key),[payment.publishable_key])
  const options = useMemo(() => ({ clientSecret:payment.client_secret, appearance:{theme:'night',variables:{colorPrimary:'#e8927c',colorBackground:'#211b18',colorText:'#fff8ee',colorDanger:'#ef5b4c',borderRadius:'12px',fontFamily:'Inter, sans-serif'}}}),[payment.client_secret])
  return <div className="stripe-modal" role="dialog" aria-modal="true" aria-labelledby="stripe-payment-title"><div className="stripe-modal-card"><div className="stripe-modal-head"><div><span className="eyebrow">Secure payment</span><h2 id="stripe-payment-title">Enter your card details</h2></div></div><Elements stripe={stripePromise} options={options}><PaymentForm orderId={orderId} onClose={onClose}/></Elements><p className="stripe-security">🔒 Card details are encrypted and sent directly to Stripe. TasteLoop never stores them.</p></div></div>
}
