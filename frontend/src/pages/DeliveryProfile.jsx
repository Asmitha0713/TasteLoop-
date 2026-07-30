import { useEffect, useState } from 'react'
import DeliveryNav from '../components/DeliveryNav.jsx'
import api from '../services/api.js'
import { getDeliveryProfile, updateDeliveryProfile, updateDeliveryProfileImage } from '../services/deliveryApi.js'

export default function DeliveryProfile() {
  const [form, setForm] = useState({})
  const [password, setPassword] = useState({})
  const [image, setImage] = useState(null)
  useEffect(() => { getDeliveryProfile().then((response) => setForm(response.data.data)) }, [])

  const save = async (event) => {
    event.preventDefault()
    await updateDeliveryProfile({ phone: form.phone, address: form.address, vehicle_type: form.vehicle_type, vehicle_number: form.vehicle_number })
    if (image) { const body = new FormData(); body.append('profile_image', image); await updateDeliveryProfileImage(body) }
  }
  const changePassword = async (event) => {
    event.preventDefault(); await api.post('/auth/change-password', password); setPassword({})
  }
  return <div className="delivery-shell"><DeliveryNav/><main className="delivery-main"><h1>Delivery Partner Profile</h1><div className="profile-columns"><form className="card delivery-form" onSubmit={save}><h2>Contact & vehicle</h2>{['phone','address','vehicle_type','vehicle_number'].map((key) => <label className="field" key={key}>{key.replaceAll('_',' ')}<input value={form[key] || ''} onChange={(event) => setForm({...form, [key]: event.target.value})}/></label>)}<label className="field">Profile image<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setImage(event.target.files[0])}/></label><button className="btn btn-primary">Save profile</button></form><form className="card delivery-form" onSubmit={changePassword}><h2>Change password</h2>{[['current_password','Current password'],['new_password','New password'],['confirm_password','Confirm password']].map(([key,label]) => <label className="field" key={key}>{label}<input type="password" value={password[key] || ''} onChange={(event) => setPassword({...password, [key]: event.target.value})}/></label>)}<button className="btn btn-primary">Change password</button></form></div></main></div>
}
