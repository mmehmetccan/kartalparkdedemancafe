import { useEffect, useState } from 'react';
import { KeyRound, LockKeyhole, Plus, Trash2, UsersRound } from 'lucide-react';
import { toast } from 'react-toastify';
import { api, withToken } from '../../lib/api';
import { clearAdminSession, getAdminSession } from '../../lib/adminSession';
import { useI18n } from '../../i18n/useI18n';
import { translateManagement } from '../../i18n/managementTranslations';
import '../../styles/Admin/AdminUsers.css';

const AdminUsers = () => {
  const { language, locale, formatDate } = useI18n();
  const session = getAdminSession();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('reception');
  const [creating, setCreating] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [updating, setUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const mt = (key, values) => translateManagement(language, key, values) || key;
  const sortUsers = (items) => [...items].sort((a, b) => a.username.localeCompare(b.username, locale));

  const unauthorized = () => { clearAdminSession(); window.location.assign('/admin'); };

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const { data } = await api.get('/admin-users', withToken(session.token));
        setUsers(data);
      } catch (error) {
        if (error.response?.status === 401) unauthorized();
        else toast.error(error?.response?.data?.message || translateManagement(language, `api.${error?.response?.data?.messageKey}`, error?.response?.data?.messageParams) || translateManagement(language, 'adminUsers.errors.loadFailed') || 'Yonetici listesi getirilemedi.');
      } finally { setLoading(false); }
    };
    void loadUsers();
  }, [language, session?.token]);

  const createUser = async (event) => {
    event.preventDefault();
    setCreating(true);
    try {
      const { data } = await api.post('/admin-users', { username: username.trim(), password, role }, withToken(session.token));
      setUsers((currentUsers) => sortUsers([...currentUsers, data]));
      setUsername('');
      setPassword('');
      setRole('reception');
      toast.success(mt('adminUsers.toast.created', { username: data.username }));
    } catch (error) {
      if (error.response?.status === 401) unauthorized();
      else toast.error(error?.response?.data?.message || translateManagement(language, `api.${error?.response?.data?.messageKey}`, error?.response?.data?.messageParams) || mt('adminUsers.errors.createFailed'));
    } finally { setCreating(false); }
  };

  const deleteUser = async (user) => {
    if (!window.confirm(mt('adminUsers.confirm.deleteUser', { username: user.username }))) return;
    setDeletingId(user._id);
    try {
      const { data } = await api.delete(`/admin-users/${user._id}`, withToken(session.token));
      setUsers((currentUsers) => currentUsers.filter((item) => item._id !== user._id));
      toast.success(data.message || mt('api.admin_users.deleted', { username: user.username }));
    } catch (error) {
      toast.error(error?.response?.data?.message || translateManagement(language, `api.${error?.response?.data?.messageKey}`, error?.response?.data?.messageParams) || mt('adminUsers.errors.deleteFailed'));
    } finally { setDeletingId(null); }
  };

  const updatePassword = async (event) => {
    event.preventDefault();
    if (!selectedUser) return;
    setUpdating(true);
    try {
      const { data } = await api.put(`/admin-users/${selectedUser._id}/password`, { password: newPassword }, withToken(session.token));
      toast.success(data.message || mt('api.admin_users.password_updated', { username: selectedUser.username }));
      setNewPassword('');
      setSelectedUser(null);
    } catch (error) {
      if (error.response?.status === 401) unauthorized();
      else toast.error(error?.response?.data?.message || translateManagement(language, `api.${error?.response?.data?.messageKey}`, error?.response?.data?.messageParams) || mt('adminUsers.errors.passwordFailed'));
    } finally { setUpdating(false); }
  };

  return <div className="admin-users-page"><header className="admin-page-heading"><div><p>{mt('adminUsers.pageEyebrow')}</p><h1>{mt('adminUsers.pageTitle')}</h1><span>{mt('adminUsers.pageDescription')}</span></div></header><div className="admin-users-layout"><section className="admin-user-create-card"><div className="admin-users-card-icon"><Plus size={21} /></div><div><h2>{mt('adminUsers.createCard.title')}</h2><p>{mt('adminUsers.createCard.description')}</p></div><form onSubmit={createUser}><label htmlFor="new-admin-username">{mt('adminUsers.createCard.username')}</label><input id="new-admin-username" value={username} onChange={(event) => setUsername(event.target.value)} placeholder={mt('adminUsers.createCard.usernamePlaceholder')} minLength="3" maxLength="40" required /><label htmlFor="new-admin-role">{mt('adminUsers.createCard.role')}</label><select id="new-admin-role" value={role} onChange={(event) => setRole(event.target.value)}><option value="admin">{mt('adminUsers.createCard.roles.admin')}</option><option value="reception">{mt('adminUsers.createCard.roles.reception')}</option><option value="chef">{mt('adminUsers.createCard.roles.chef')}</option></select><label htmlFor="new-admin-password">{mt('adminUsers.createCard.password')}</label><input id="new-admin-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength="8" required /><button type="submit" disabled={creating}>{creating ? mt('adminUsers.createCard.creating') : <><Plus size={17} />{mt('adminUsers.createCard.create')}</>}</button></form></section><section className="admin-users-list-card"><div className="admin-users-list-heading"><div><UsersRound size={20} /><h2>{mt('adminUsers.list.title')}</h2></div><span>{mt('adminUsers.list.count', { count: users.length })}</span></div>{loading ? <div className="admin-users-loading">{mt('adminUsers.list.loading')}</div> : <div className="admin-users-list">{users.map((user) => <article key={user._id}><div><strong>{user.username}</strong><span><b className={`admin-role-badge ${user.role}`}>{mt(`adminUsers.roles.${user.role}`)}</b>{mt('adminUsers.list.createdAt', { date: formatDate(user.createdAt) })}</span></div><div className="admin-user-actions"><button type="button" onClick={() => { setSelectedUser(user); setNewPassword(''); }}><KeyRound size={16} />{mt('adminUsers.list.changePassword')}</button><button type="button" className="admin-delete-user-button" disabled={deletingId === user._id} onClick={() => deleteUser(user)} aria-label={mt('adminUsers.aria.deleteUser', { username: user.username })}><Trash2 size={16} /></button></div></article>)}</div>}</section></div>{selectedUser && <section className="admin-password-reset-card"><div><LockKeyhole size={20} /><div><p>{mt('adminUsers.resetCard.eyebrow')}</p><h2>{selectedUser.username}</h2></div></div><form onSubmit={updatePassword}><label htmlFor="reset-password">{mt('adminUsers.resetCard.password')}</label><input id="reset-password" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} minLength="8" autoFocus required /><div><button type="button" className="admin-cancel-button" onClick={() => setSelectedUser(null)}>{mt('adminUsers.resetCard.cancel')}</button><button type="submit" disabled={updating}>{updating ? mt('adminUsers.resetCard.saving') : mt('adminUsers.resetCard.save')}</button></div></form></section>}</div>;
};

export default AdminUsers;
