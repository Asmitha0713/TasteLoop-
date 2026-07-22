import { useEffect, useState } from 'react'
import CustomerNav from '../components/CustomerNav.jsx'
import Footer from '../components/Footer.jsx'
import './CustomerProfile.css'
import api, { apiError } from '../services/api.js'

const initialProfile = {
  name: 'Ayesha Fernando',
  email: 'ayesha@example.com',
  phone: '077 845 2190',
  address: '42, Station Road',
  city: 'Kilinochchi',
  note: 'Call when you arrive at the gate.',
}

export default function CustomerProfile() {
  const [profile, setProfile] = useState(initialProfile)
  const [draft, setDraft] = useState(profile)
  const [editing, setEditing] = useState(false)
  const [saved, setSaved] = useState(false)
  const [preferences, setPreferences] = useState({ vegetarian: false, halal: true, mild: true, notifications: true })
  const [error, setError] = useState('')
  const [addressId, setAddressId] = useState(null)
  const display = data => ({ name: data.full_name || '', email: data.email || '', phone: data.phone_number || '', address: data.address || '', city: data.city || '', note: data.delivery_note || '' })
  useEffect(() => {
    Promise.all([api.get('/profile'), api.get('/addresses')]).then(([profileResponse, addressResponse]) => {
      const next = display(profileResponse.data.data)
      const address = addressResponse.data.data.find(item => item.is_default) || addressResponse.data.data[0]
      if (address) {
        next.address = address.address_line
        next.city = address.city
        next.note = address.delivery_note || ''
        setAddressId(address.id)
      }
      setProfile(next); setDraft(next); setPreferences(profileResponse.data.data.preferences || preferences)
    }).catch(requestError => setError(apiError(requestError)))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const update = (event) => setDraft(current => ({ ...current, [event.target.name]: event.target.value }))
  const save = async (event) => {
    event.preventDefault()
    try {
      const { data } = await api.patch('/profile', { full_name: draft.name, email: draft.email, phone_number: draft.phone, preferences })
      if (draft.address && draft.city) {
        const addressPayload = { label: 'Home', recipient_name: draft.name, phone_number: draft.phone, address_line: draft.address, city: draft.city, delivery_note: draft.note || null, is_default: true }
        const addressResponse = addressId ? await api.patch(`/addresses/${addressId}`, addressPayload) : await api.post('/addresses', addressPayload)
        setAddressId(addressResponse.data.data.id)
      }
      setProfile({ ...display(data.data), address: draft.address, city: draft.city, note: draft.note }); setEditing(false); setSaved(true); window.setTimeout(() => setSaved(false), 2500)
    }
    catch (requestError) { setError(apiError(requestError)) }
  }

  const deleteAddress = async () => {
    if (!addressId || !window.confirm('Delete your saved delivery address?')) return
    try {
      await api.delete(`/addresses/${addressId}`)
      const next = { ...profile, address: '', city: '', note: '' }
      setAddressId(null); setProfile(next); setDraft(next); setSaved(true); window.setTimeout(() => setSaved(false), 2500)
    } catch (requestError) { setError(apiError(requestError)) }
  }

  return <div className="page customer-profile-page"><CustomerNav />
    <main className="page-content customer-profile-main"><div className="container customer-profile-container">
      {saved && <div className="success-banner">✓ Your profile has been updated.</div>}
      {error && <div className="success-banner">{error}</div>}
      <div className="customer-profile-heading"><div><span className="eyebrow">Your TasteLoop account</span><h1>My profile</h1><p>Manage your personal details, delivery address and food preferences.</p></div>{!editing && <button className="btn btn-primary" onClick={() => { setDraft(profile); setEditing(true) }}>✎ Edit Profile</button>}</div>

      <div className="customer-profile-grid">
        <aside className="card customer-profile-summary">
          <div className="customer-avatar">AF<button aria-label="Change profile picture">＋</button></div>
          <h2>{profile.name}</h2><p>Customer since May 2026</p><span className="customer-member">TasteLoop Member</span>
          <div className="customer-profile-stats"><div><strong>12</strong><span>Orders</span></div><div><strong>4</strong><span>Favourite cooks</span></div></div>
          <nav className="profile-shortcuts"><a href="#details">♙ <span>Personal details</span></a><a href="#address">⌖ <span>Delivery address</span></a><a href="#preferences">♡ <span>Food preferences</span></a></nav>
        </aside>

        <div className="customer-profile-sections">
          <section className="card customer-detail-card" id="details"><div className="profile-card-title"><div><h2>Personal details</h2><p>Your contact information is kept private.</p></div></div>
            {editing ? <form onSubmit={save}><div className="customer-fields"><label className="food-field"><span>Full name</span><input name="name" value={draft.name} onChange={update} required /></label><label className="food-field"><span>Email address</span><input name="email" type="email" value={draft.email} onChange={update} required /></label><label className="food-field"><span>Phone number</span><input name="phone" value={draft.phone} onChange={update} required /></label></div>
              <div className="profile-card-title address-form-title"><div><h2>Delivery address</h2><p>Used as your default address during checkout.</p></div></div><div className="customer-fields two"><label className="food-field full"><span>Street address</span><input name="address" value={draft.address} onChange={update} /></label><label className="food-field"><span>City</span><input name="city" value={draft.city} onChange={update} /></label><label className="food-field full"><span>Delivery note</span><textarea name="note" rows="3" value={draft.note} onChange={update} /></label></div>
              <div className="form-actions customer-profile-actions"><button type="button" className="btn btn-secondary" onClick={() => setEditing(false)}>Cancel</button><button className="btn btn-primary">Save Changes</button></div></form> : <><div className="customer-info-grid"><div><span>Full name</span><strong>{profile.name}</strong></div><div><span>Email address</span><strong>{profile.email}</strong></div><div><span>Phone number</span><strong>{profile.phone}</strong></div></div><div className="profile-card-title address-form-title" id="address"><div><h2>Delivery address</h2><p>Your default destination for new orders.</p></div></div>{addressId ? <div className="saved-address"><i>⌖</i><div><strong>Home</strong><p>{profile.address}<br />{profile.city}</p><small>{profile.note}</small></div><span>Default</span><button type="button" className="btn btn-secondary btn-sm" onClick={deleteAddress}>Delete</button></div> : <p>No delivery address saved. Select Edit Profile to add one.</p>}</>}
          </section>

          <section className="card customer-detail-card" id="preferences"><div className="profile-card-title"><div><h2>Food preferences</h2><p>Help us recommend meals that suit you.</p></div></div><div className="preference-list">
            {[['vegetarian','Vegetarian meals','Prioritise meat-free dishes'],['halal','Halal food','Show meals prepared with halal ingredients'],['mild','Mild spice','Recommend mildly spiced foods'],['notifications','Order notifications','Receive updates about orders and offers']].map(([key,title,text]) => <label key={key}><span><strong>{title}</strong><small>{text}</small></span><input type="checkbox" checked={preferences[key]} onChange={e => setPreferences(current => ({ ...current, [key]: e.target.checked }))} /></label>)}
          </div></section>
        </div>
      </div>
    </div></main><Footer />
  </div>
}
