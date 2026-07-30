import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import { registerDeliveryPartner } from '../services/deliveryApi.js'
import { apiError } from '../services/api.js'
import PasswordEye from '../components/PasswordEye.jsx'

const personalFields = [
  ['full_name', 'Full name'], ['email', 'Email'], ['phone', 'Phone number'],
  ['address', 'Address'],
  ['licence_number', 'Driving licence number'], ['nic_number', 'NIC or ID number'],
]
const bankFields = [
  ['bank_account_number', 'Bank Account Number'], ['bank_account_name', 'Account Holder Name'],
  ['bank_name', 'Bank Name'], ['bank_branch', 'Bank Branch'],
]

export default function DeliveryPartnerRegister() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ has_vehicle: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const update = (name, value) => setForm((current) => ({ ...current, [name]: value }))

  const submit = async (event) => {
    event.preventDefault(); setError('')
    if (form.password !== form.confirm_password) { setError('Passwords do not match'); return }
    setLoading(true)
    try {
      const body = new FormData()
      Object.entries(form).forEach(([key, value]) => { if (value !== undefined && value !== null && value !== '') body.append(key, value) })
      await registerDeliveryPartner(body)
      navigate('/login', { state: { message: 'Application submitted. Admin approval is required before login.' } })
    } catch (requestError) { setError(apiError(requestError)) } finally { setLoading(false) }
  }

  return <div className="page"><Navbar/><main className="page-content delivery-register"><form className="card delivery-form" onSubmit={submit}><span className="eyebrow">Join our delivery team</span><h1>Delivery Partner application</h1><p>Your dashboard becomes available after an Admin approves your documents.</p>{error && <div className="form-error">{error}</div>}
    <section className="delivery-form-section"><h2>Personal & vehicle details</h2><div className="delivery-form-grid">{personalFields.map(([name,label]) => <label className="field" key={name}>{label}<input name={name} type={name === 'email' ? 'email' : 'text'} required onChange={(event) => update(name,event.target.value)}/></label>)}
      <fieldset className="field vehicle-choice"><legend>Do you have a vehicle?</legend><div className="vehicle-option-cards"><label className={form.has_vehicle === 'yes' ? 'selected' : ''}><input type="radio" name="has_vehicle" value="yes" required checked={form.has_vehicle === 'yes'} onChange={(event) => update('has_vehicle',event.target.value)}/><span className="vehicle-option-copy"><strong>Yes</strong><small>I have a vehicle for deliveries</small></span><span className="vehicle-check" aria-hidden="true">✓</span></label><label className={form.has_vehicle === 'no' ? 'selected' : ''}><input type="radio" name="has_vehicle" value="no" required checked={form.has_vehicle === 'no'} onChange={(event) => setForm((current) => ({...current, has_vehicle:event.target.value, vehicle_type:'', vehicle_number:''}))}/><span className="vehicle-option-copy"><strong>No</strong><small>I do not currently have a vehicle</small></span><span className="vehicle-check" aria-hidden="true">✓</span></label></div></fieldset>
      {form.has_vehicle === 'yes' && <><label className="field">Vehicle Type<input type="text" required value={form.vehicle_type || ''} placeholder="e.g. Motorcycle, Car, Van" onChange={(event) => update('vehicle_type',event.target.value)}/></label><label className="field">Vehicle Number<input type="text" required value={form.vehicle_number || ''} onChange={(event) => update('vehicle_number',event.target.value)}/></label></>}
      <label className="field">Driving Licence Image Upload<input type="file" required accept="image/png,image/jpeg,image/webp" onChange={(event) => update('driving_licence_image',event.target.files[0])}/><small>JPEG, PNG or WebP. Maximum 5 MB.</small></label>
      <label className="field">Profile image <span>(optional)</span><input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => update('profile_image',event.target.files[0])}/></label>
      <label className="field">Password<div className="delivery-password-wrap"><input type={showPassword ? 'text' : 'password'} required minLength="8" onChange={(event) => update('password',event.target.value)}/><button type="button" className="delivery-password-eye" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'} title={showPassword ? 'Hide password' : 'Show password'}><PasswordEye visible={showPassword}/></button></div></label><label className="field">Confirm password<div className="delivery-password-wrap"><input type={showConfirmPassword ? 'text' : 'password'} required minLength="8" onChange={(event) => update('confirm_password',event.target.value)}/><button type="button" className="delivery-password-eye" onClick={() => setShowConfirmPassword((visible) => !visible)} aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'} title={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}><PasswordEye visible={showConfirmPassword}/></button></div></label></div></section>
    <section className="delivery-form-section bank-details-section"><div className="section-heading"><span>🏦</span><div><h2>Bank Details</h2><p>Used securely for your delivery earnings payouts.</p></div></div><div className="delivery-form-grid">{bankFields.map(([name,label]) => <label className="field" key={name}>{label}<input name={name} type="text" required onChange={(event) => update(name,event.target.value)}/></label>)}</div></section>
    <button className="btn btn-primary" disabled={loading}>{loading ? 'Submitting…' : 'Submit application'}</button><p>Already approved? <Link to="/login">Log in</Link></p></form></main><Footer/></div>
}
