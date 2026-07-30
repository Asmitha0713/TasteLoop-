import { useEffect, useState } from 'react'
import DeliveryNav from '../components/DeliveryNav.jsx'
import api, { apiError } from '../services/api.js'
import { getDeliveryProfile, updateDeliveryProfile, updateDeliveryProfileImage } from '../services/deliveryApi.js'

export default function DeliveryProfile() {
  const [form, setForm] = useState({})
  const [password, setPassword] = useState({})
  const [image, setImage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getDeliveryProfile().then((response) => setForm(response.data.data)).catch((requestError) => setError(apiError(requestError))).finally(() => setLoading(false))
  }, [])

  const chooseVehicle = (hasVehicle) => setForm((current) => ({ ...current, has_vehicle: hasVehicle, ...(hasVehicle === 'no' ? { vehicle_type: '', vehicle_number: '' } : {}) }))
  const save = async (event) => {
    event.preventDefault(); setError(''); setSaving(true)
    try {
      await updateDeliveryProfile({ phone: form.phone, address: form.address, has_vehicle: form.has_vehicle, vehicle_type: form.has_vehicle === 'yes' ? form.vehicle_type : null, vehicle_number: form.has_vehicle === 'yes' ? form.vehicle_number : null })
      if (image) { const body = new FormData(); body.append('profile_image', image); await updateDeliveryProfileImage(body); setImage(null) }
    } catch (requestError) { setError(apiError(requestError)) } finally { setSaving(false) }
  }
  const changePassword = async (event) => {
    event.preventDefault(); setError(''); setPasswordSaving(true)
    try { await api.post('/auth/change-password', password); setPassword({}) } catch (requestError) { setError(apiError(requestError)) } finally { setPasswordSaving(false) }
  }

  return <div className="delivery-shell"><DeliveryNav/><main className="delivery-main"><span className="eyebrow">Your account</span><h1>Delivery Partner Profile</h1>{error && <div className="form-error" role="alert">{error}</div>}{loading ? <div className="delivery-empty">Loading your profile…</div> : <div className="profile-columns"><form className="card delivery-form" onSubmit={save}><h2>Contact & vehicle</h2><label className="field">Phone<input value={form.phone || ''} required onChange={(event) => setForm({...form, phone:event.target.value})}/></label><label className="field">Address<input value={form.address || ''} required onChange={(event) => setForm({...form, address:event.target.value})}/></label><fieldset className="field vehicle-choice"><legend>Do you have a vehicle?</legend><div className="vehicle-option-cards"><label className={form.has_vehicle === 'yes' ? 'selected' : ''}><input type="radio" name="profile_has_vehicle" checked={form.has_vehicle === 'yes'} onChange={() => chooseVehicle('yes')}/><span className="vehicle-option-copy"><strong>Yes</strong><small>I have a delivery vehicle</small></span><span className="vehicle-check">✓</span></label><label className={form.has_vehicle === 'no' ? 'selected' : ''}><input type="radio" name="profile_has_vehicle" checked={form.has_vehicle === 'no'} onChange={() => chooseVehicle('no')}/><span className="vehicle-option-copy"><strong>No</strong><small>I do not have a vehicle</small></span><span className="vehicle-check">✓</span></label></div></fieldset>{form.has_vehicle === 'yes' && <><label className="field">Vehicle Type<input required value={form.vehicle_type || ''} onChange={(event) => setForm({...form,vehicle_type:event.target.value})}/></label><label className="field">Vehicle Number<input required value={form.vehicle_number || ''} onChange={(event) => setForm({...form,vehicle_number:event.target.value})}/></label></>}<label className="field">Profile image<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setImage(event.target.files[0])}/></label><button className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save profile'}</button></form><form className="card delivery-form" onSubmit={changePassword}><h2>Change password</h2>{[['current_password','Current password'],['new_password','New password'],['confirm_password','Confirm password']].map(([key,label]) => <label className="field" key={key}>{label}<input required type="password" value={password[key] || ''} onChange={(event) => setPassword({...password,[key]:event.target.value})}/></label>)}<button className="btn btn-primary" disabled={passwordSaving}>{passwordSaving ? 'Changing…' : 'Change password'}</button></form></div>}</main></div>
}
