import { useEffect, useMemo, useState } from 'react'
import AdminLayout from '../components/AdminLayout.jsx'
import api, { apiError } from '../services/api.js'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [query, setQuery] = useState('')
  const [role, setRole] = useState('All roles')
  const [status, setStatus] = useState('All statuses')
  const [showAddUser, setShowAddUser] = useState(false)
  const [newUser, setNewUser] = useState({ name: '', email: '', phone: '', password: '', role: 'Customer', status: 'Active' })
  const [error, setError] = useState('')
  const visible = useMemo(() => users.filter(u =>
    (role === 'All roles' || u.role === role) &&
    (status === 'All statuses' || u.status === status) &&
    `${u.name} ${u.email}`.toLowerCase().includes(query.toLowerCase())
  ), [users, query, role, status])
  const display = user => ({ ...user, name: user.full_name, role: user.role === 'home_cook' ? 'Home Cook' : user.role === 'admin' ? 'Admin' : 'Customer', status: user.account_status === 'pending_approval' ? 'Pending' : user.account_status[0].toUpperCase() + user.account_status.slice(1), joined: new Date(user.created_at).toLocaleDateString(), avatar: user.full_name.split(/\s+/).slice(0,2).map(part=>part[0]).join('').toUpperCase(), color: '#dfece4' })
  useEffect(() => { api.get('/admin/users').then(({data}) => setUsers(data.data.map(display))).catch(requestError => setError(apiError(requestError))) }, [])
  const changeStatus = async (id, status) => {
    try { await api.patch(`/admin/users/${id}/status`, { account_status: status === 'Pending' ? 'pending_approval' : status.toLowerCase() }); setUsers(current => current.map(user => user.id === id ? {...user, status} : user)) }
    catch (requestError) { setError(apiError(requestError)) }
  }

  const addUser = (event) => {
    event.preventDefault()
    if (!newUser.name.trim() || !newUser.email.trim() || !newUser.phone.trim() || !newUser.password) {
      setError('Name, email, phone and password are required.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUser.email)) {
      setError('Enter a valid email address.')
      return
    }
    api.post('/admin/users', { full_name: newUser.name, email: newUser.email, phone_number: newUser.phone, password: newUser.password, role: newUser.role === 'Home Cook' ? 'home_cook' : 'customer', account_status: newUser.status === 'Pending' ? 'pending_approval' : newUser.status.toLowerCase() }).then(({data}) => {
      setUsers(current => [display(data.data), ...current]); setNewUser({ name: '', email: '', phone: '', password: '', role: 'Customer', status: 'Active' }); setError(''); setShowAddUser(false)
    }).catch(requestError => setError(apiError(requestError)))
  }

  return <AdminLayout title="Manage users" eyebrow="Community management" action={<button className="btn btn-primary" onClick={() => setShowAddUser(true)}>＋ Add User</button>}>
    <div className="admin-summary-row"><span><strong>{users.length}</strong> Total users</span><span><strong>{users.filter(u=>u.role==='Home Cook').length}</strong> Home cooks</span><span><strong>{users.filter(u=>u.status==='Pending').length}</strong> Pending approval</span></div>
    <section className="card admin-table-card"><div className="admin-toolbar"><label className="admin-search">⌕<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search name or email…" /></label><div><select value={role} onChange={e=>setRole(e.target.value)} className="admin-select"><option>All roles</option><option>Customer</option><option>Home Cook</option></select><select value={status} onChange={e=>setStatus(e.target.value)} className="admin-select"><option>All statuses</option><option>Active</option><option>Pending</option><option>Suspended</option></select></div></div>
      <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>User</th><th>Role</th><th>Joined</th><th>Status</th><th>Actions</th></tr></thead><tbody>{visible.map(user => <tr key={user.id}><td><div className="admin-user-cell"><i style={{background:user.color}}>{user.avatar}</i><div><strong>{user.name}</strong><small>{user.email}</small></div></div></td><td><span className="role-chip">{user.role}</span></td><td>{user.joined}</td><td><span className={`admin-status ${user.status.toLowerCase()}`}>{user.status}</span></td><td><select className="row-select" value={user.status} onChange={e=>changeStatus(user.id,e.target.value)} aria-label={`Change status for ${user.name}`}><option>Active</option><option>Pending</option><option>Suspended</option></select></td></tr>)}</tbody></table></div>{!visible.length&&<div className="admin-empty">No matching users found.</div>}
    </section>
    {showAddUser && <div className="admin-modal-backdrop" role="presentation" onMouseDown={() => setShowAddUser(false)}>
      <section className="card admin-modal" role="dialog" aria-modal="true" aria-labelledby="add-user-title" onMouseDown={event => event.stopPropagation()}>
        <div className="admin-modal-head"><div><span className="eyebrow">New account</span><h2 id="add-user-title">Add a user</h2></div><button type="button" onClick={() => setShowAddUser(false)} aria-label="Close">×</button></div>
        <form onSubmit={addUser}>
          <label className="food-field"><span>Full name *</span><input autoFocus value={newUser.name} onChange={e => { setNewUser(current => ({ ...current, name: e.target.value })); setError('') }} placeholder="e.g. Amal Perera" /></label>
          <label className="food-field"><span>Email address *</span><input type="email" value={newUser.email} onChange={e => { setNewUser(current => ({ ...current, email: e.target.value })); setError('') }} placeholder="amal@example.com" /></label>
          <label className="food-field"><span>Phone number *</span><input value={newUser.phone} onChange={e => setNewUser(current => ({ ...current, phone: e.target.value }))} placeholder="0771234567" /></label>
          <label className="food-field"><span>Temporary password *</span><input type="password" value={newUser.password} onChange={e => setNewUser(current => ({ ...current, password: e.target.value }))} placeholder="StrongPass@123" /></label>
          <div className="form-grid admin-modal-grid"><label className="food-field"><span>Role</span><select value={newUser.role} onChange={e => setNewUser(current => ({ ...current, role: e.target.value }))}><option>Customer</option><option>Home Cook</option></select></label><label className="food-field"><span>Status</span><select value={newUser.status} onChange={e => setNewUser(current => ({ ...current, status: e.target.value }))}><option>Active</option><option>Pending</option><option>Suspended</option></select></label></div>
          {error && <p className="admin-form-error">{error}</p>}
          <div className="form-actions"><button type="button" className="btn btn-secondary" onClick={() => setShowAddUser(false)}>Cancel</button><button type="submit" className="btn btn-primary">Add User</button></div>
        </form>
      </section>
    </div>}
  </AdminLayout>
}
