import { useEffect, useRef, useState } from 'react'
import api from '../services/api.js'

export default function NotificationBell() {
  const [items, setItems] = useState([])
  const [unread, setUnread] = useState(0)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const wrap = useRef(null)

  const load = () => api.get('/notifications', { params: { limit: 20 }, skipToast: true })
    .then(({ data }) => { setItems(data.data); setUnread(data.unread_count); setError('') })
    .catch(() => setError('Could not load notifications.'))
    .finally(() => setLoading(false))

  useEffect(() => {
    load()
    const timer = window.setInterval(load, 30000)
    const close = event => !wrap.current?.contains(event.target) && setOpen(false)
    document.addEventListener('mousedown', close)
    return () => { window.clearInterval(timer); document.removeEventListener('mousedown', close) }
  }, [])

  const markRead = async notification => {
    if (!notification.read) {
      await api.patch(`/notifications/${notification.id}/read`, {}, { skipToast: true })
      setItems(current => current.map(item => item.id === notification.id ? { ...item, read: true } : item))
      setUnread(current => Math.max(0, current - 1))
    }
  }

  const markAll = async () => {
    await api.patch('/notifications/read-all', {}, { skipToast: true })
    setItems(current => current.map(item => ({ ...item, read: true })))
    setUnread(0)
  }

  return <div className="notification-wrap" ref={wrap}>
    <button type="button" className="notification-bell" onClick={() => setOpen(current => !current)} aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`} aria-expanded={open}>♢{unread > 0 && <b>{unread > 99 ? '99+' : unread}</b>}</button>
    {open && <section className="notification-panel">
      <div className="notification-head"><div><strong>Notifications</strong><small>{unread} unread</small></div>{unread > 0 && <button type="button" onClick={markAll}>Mark all read</button>}</div>
      <div className="notification-list">{loading ? <div className="notification-empty">Loading notifications…</div> : error ? <div className="notification-empty"><p>{error}</p><button type="button" onClick={load}>Try again</button></div> : items.length ? items.map(item => <button type="button" key={item.id} className={item.read ? '' : 'unread'} onClick={() => markRead(item)}><i>{item.type === 'new_order' ? '🍽️' : item.type.includes('delivery') ? '🛵' : item.type === 'order_delivered' ? '✓' : '▣'}</i><span><strong>{item.title}</strong><small>{item.message}</small><time>{new Date(item.created_at).toLocaleString()}</time></span></button>) : <div className="notification-empty">No notifications yet.</div>}</div>
    </section>}
  </div>
}
