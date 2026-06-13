'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  authApi, diaryApi, commentApi, bookmarkApi, notificationApi,
  profileApi, uploadApi, blockedApi, viewsApi,
  setToken, clearToken, getToken,
} from '@/lib/api-client';
import LoginOverlay from './LoginOverlay';
import RegisterOverlay from './RegisterOverlay';
import RecoveryOverlay from './RecoveryOverlay';
import ComposeOverlay from './ComposeOverlay';
import DetailOverlay from './DetailOverlay';
import NotificationsOverlay from './NotificationsOverlay';
import ProfileOverlay from './ProfileOverlay';
import SettingsOverlay from './SettingsOverlay';
import BookmarksOverlay from './BookmarksOverlay';
import MyDiariesOverlay from './MyDiariesOverlay';
import AboutOverlay from './AboutOverlay';
import FilterOverlay from './FilterOverlay';
import { styles } from './styles';

const DIARY_COLORS = [
  '#ffffff','#000000','#1a1a2e','#16213e','#0f3460','#533483','#e94560',
  '#ff6b6b','#ff9f43','#feca57','#FFC88A','#E6EBF0','#FFC5B8','#007280',
  '#E87280','#7A7280','#FE5E08','#00cec9','#0984e3','#74b9ff','#6c5ce7',
  '#a8e6cf','#ffd3b6','#ffaaa5','#ff8b94','#b2ebf2','#dfe6e9','#fab1a0',
  '#81ecec','#fdcb6e'
];

const DIARY_FONTS = [
  { name: 'Caveat', family: "'Caveat',cursive" },
  { name: 'Crimson Text', family: "'Crimson Text',Georgia,serif" },
  { name: 'Indie Flower', family: "'Indie Flower',cursive" },
  { name: 'Shadows Into Light', family: "'Shadows Into Light',cursive" },
  { name: 'Kalam', family: "'Kalam',cursive" },
  { name: 'Patrick Hand', family: "'Patrick Hand',cursive" },
];

interface Diary {
  id: string;
  content: string;
  author: string;
  author_id: string;
  avatar_url: string;
  mood: string;
  color: string;
  font: string;
  rotation: number;
  views: number;
  saves: number;
  comments: any[];
  created_at: string;
  tags: string[];
  is_private: boolean;
  is_bookmarked?: boolean;
  repost_chain?: any[];
}

interface UserProfile {
  id: string;
  username: string;
  avatar_url: string;
  recovery_pin: string;
}

export default function DiaryDump() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [notes, setNotes] = useState<Diary[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(8);
  const [loading, setLoading] = useState(false);
  const [overlay, setOverlay] = useState<string | null>(null);
  const [selectedDiary, setSelectedDiary] = useState<Diary | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState<{ msg: string; diaryId?: string } | null>(null);
  const [activeFilters, setActiveFilters] = useState({
    timeRange: 'all', mood: [] as string[], customMood: '',
    font: [] as string[], popularity: 'all', tag: [] as string[],
    customTag: '', colorGroup: 'all', author: '', sortBy: 'newest', contentLength: 'all'
  });
  const [pendingCompose, setPendingCompose] = useState<any>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const viewedIds = useRef<Set<string>>(new Set());

  useEffect(() => { const token = getToken(); if (token) loadProfile(); }, []);
  useEffect(() => { loadDiaries(); }, [activeFilters, searchQuery, visibleCount]);
  useEffect(() => {
    if (!loadMoreRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) setVisibleCount((p) => p + 4); },
      { rootMargin: '200px' }
    );
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [notes]);
  useEffect(() => {
    const interval = setInterval(() => {
      const ids = Array.from(viewedIds.current);
      if (ids.length > 0) { viewsApi.batch(ids).catch(() => {}); viewedIds.current.clear(); }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  async function loadProfile() {
    try {
      const res = await profileApi.get();
      if (res.success) { setCurrentUser(res.data); setIsLoggedIn(true); loadNotifications(); }
    } catch { clearToken(); }
  }

  async function loadDiaries() {
    setLoading(true);
    try {
      const params: Record<string, string> = { limit: visibleCount.toString(), offset: '0' };
      if (activeFilters.timeRange !== 'all') params.timeRange = activeFilters.timeRange;
      if (activeFilters.sortBy !== 'newest') params.sortBy = activeFilters.sortBy;
      if (searchQuery) params.q = searchQuery;
      if (activeFilters.author) params.author = activeFilters.author;
      const res = await diaryApi.getAll(params);
      if (res.success) {
        setNotes(res.data.map((d: any) => ({
          ...d, author: d.profiles?.username || 'unknown',
          avatar_url: d.profiles?.avatar_url || '', comments: [], tags: d.tags || [],
        })));
      }
    } catch (err) { console.error('Failed to load diaries:', err); }
    finally { setLoading(false); }
  }

  async function loadNotifications() {
    try { const res = await notificationApi.getAll(true); if (res.success) setNotifications(res.data); } catch {}
  }

  function getTextColorForBg(bg: string): string {
    const h = bg.replace('#', '');
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5 ? '#1a1a2e' : '#f0f0f0';
  }

  function formatViews(v: number): string { return v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v.toString(); }

  function escapeHtml(t: string): string {
    return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  function formatContent(t: string): string { return escapeHtml(t).replace(/\n/g, '<br>'); }

  function getFontFamily(n: string): string {
    const f = DIARY_FONTS.find((x) => x.name === n);
    return f ? f.family : "'Caveat',cursive";
  }

  function formatDateTime(ts: string): string {
    const d = new Date(ts);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) + ' at ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  function getUnreadCount(): number { return notifications.filter((n) => !n.is_read).length; }

  function showToast(msg: string, diaryId?: string) { setToast({ msg, diaryId }); setTimeout(() => setToast(null), 5000); }

  async function handleLogin(username: string, password: string) {
    try {
      const res = await authApi.login(username, password);
      if (res.success) { setToken(res.access_token); await loadProfile(); setOverlay(null); showToast('Welcome back!'); }
    } catch (err: any) { throw err; }
  }

  async function handleRegister(username: string, password: string, recoveryPin: string) {
    try {
      await authApi.register(username, password, recoveryPin);
      const loginRes = await authApi.login(username, password);
      if (loginRes.success) { setToken(loginRes.access_token); await loadProfile(); setOverlay(null); showToast('Account created!'); }
    } catch (err: any) { throw err; }
  }

  async function handleCheckUsername(username: string): Promise<{ available: boolean; error?: string }> {
    try {
      return await authApi.checkUsername(username);
    } catch (err: any) {
      return { available: false, error: err.message };
    }
  }

  async function handleVerifyRecovery(username: string, recoveryPin: string): Promise<{ success: boolean; userId?: string; error?: string }> {
    try {
      const res = await authApi.verifyRecovery(username, recoveryPin);
      return { success: true, userId: res.userId };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  async function handleResetPassword(userId: string, newPassword: string) {
    try {
      await authApi.resetPassword(userId, newPassword);
    } catch (err: any) { throw err; }
  }

  async function handleLogout() { clearToken(); setCurrentUser(null); setIsLoggedIn(false); setOverlay(null); showToast('Logged out'); }

  async function handleDeleteAccount() {
    if (!confirm('Delete account permanently?')) return;
    if (!confirm('FINAL CONFIRMATION: Cannot be undone.')) return;
    try { await profileApi.deleteAccount(); clearToken(); setCurrentUser(null); setIsLoggedIn(false); setOverlay(null); showToast('Account deleted'); loadDiaries(); }
    catch (err: any) { alert(err.message || 'Delete failed'); }
  }

  async function handlePostDiary(data: any) {
    try { const res = await diaryApi.create(data); if (res.success) { setOverlay(null); setPendingCompose(null); showToast('Diary saved!', res.data.id); loadDiaries(); }}
    catch (err: any) { alert(err.message || 'Failed to post'); }
  }

  async function handleDeleteDiary(id: string) {
    if (!confirm('Delete this diary permanently?')) return;
    try { await diaryApi.delete(id); setOverlay(null); showToast('Diary deleted'); loadDiaries(); }
    catch (err: any) { alert(err.message || 'Delete failed'); }
  }

  async function handleToggleBookmark(id: string) {
    try { await bookmarkApi.toggle(id); loadDiaries(); if (selectedDiary?.id === id) setSelectedDiary({ ...selectedDiary, is_bookmarked: !selectedDiary.is_bookmarked }); }
    catch (err: any) { alert(err.message || 'Failed'); }
  }

  async function loadDiaryDetail(id: string) {
    try {
      const res = await diaryApi.getAll();
      const diary = res.data.find((d: any) => d.id === id);
      if (diary) {
        viewedIds.current.add(id);
        const commentsRes = await commentApi.getByDiary(id);
        setSelectedDiary({ ...diary, author: diary.profiles?.username || 'unknown', avatar_url: diary.profiles?.avatar_url || '', comments: buildCommentTree(commentsRes.data || []), tags: diary.tags || [] });
        setOverlay('detail');
      }
    } catch (err) { console.error('Failed to load detail:', err); }
  }

  function buildCommentTree(flat: any[]): any[] {
    const map = new Map();
    const roots: any[] = [];
    flat.forEach((c) => { map.set(c.id, { ...c, author: c.profiles?.username || 'unknown', avatar_url: c.profiles?.avatar_url || '', replies: [] }); });
    flat.forEach((c) => { const comment = map.get(c.id); if (c.parent_id && map.has(c.parent_id)) map.get(c.parent_id).replies.push(comment); else roots.push(comment); });
    return roots;
  }

  async function handleBlockUser(username: string) {
    if (!confirm(`Block ${username}?`)) return;
    try { await blockedApi.block(username); setOverlay(null); loadDiaries(); showToast(`Blocked ${username}`); }
    catch (err: any) { alert(err.message || 'Block failed'); }
  }

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <button style={styles.menuBtn} onClick={() => setMenuOpen(!menuOpen)}>
            <svg width="18" height="14" viewBox="0 0 18 14" fill="none" stroke="#8f7666" strokeWidth="1.8" strokeLinecap="round"><path d="M2 2h14M2 7h10M2 12h14"/></svg>
          </button>
          <div style={styles.brand}>DIARY DUMP</div>
        </div>
        <div style={styles.headerRight}>
          <button style={styles.btnNotifications} onClick={() => setOverlay('notifications')}>
            <span style={{ ...styles.notificationDot, ...(getUnreadCount() > 0 ? styles.notificationDotUnread : {}) }} />
            {getUnreadCount() > 0 && <span style={styles.notificationBadge}>{getUnreadCount()}</span>}
          </button>
          {isLoggedIn ? (
            <button style={styles.btnDump} onClick={() => { setPendingCompose(null); setOverlay('compose'); }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Dump
            </button>
          ) : (
            <button style={styles.btnDump} onClick={() => setOverlay('login')}>Log In</button>
          )}
        </div>
      </header>

      <div style={styles.searchFilterBar}>
        <button style={{ ...styles.btnFilter, ...(Object.values(activeFilters).some(v => v !== 'all' && v !== '' && (!Array.isArray(v) || v.length > 0)) ? styles.btnFilterActive : {}) }} onClick={() => setOverlay('filter')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
          <span>Filter</span>
        </button>
        <input type="text" style={styles.searchInput} placeholder="search diaries..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setVisibleCount(8); }} />
      </div>

      <div style={{ ...styles.wall, opacity: loading ? 0.6 : 1 }}>
        {notes.length === 0 ? (
          <div style={styles.emptyState}>
            <p>No diaries match your filters</p>
            <button style={styles.emptyStateBtn} onClick={() => { setActiveFilters({ timeRange: 'all', mood: [], customMood: '', font: [], popularity: 'all', tag: [], customTag: '', colorGroup: 'all', author: '', sortBy: 'newest', contentLength: 'all' }); setSearchQuery(''); }}>clear all filters</button>
          </div>
        ) : (
          notes.map((note) => {
            const tc = getTextColorForBg(note.color);
            const ff = getFontFamily(note.font || 'Caveat');
            const tc2 = note.content.length > 200 ? note.content.substring(0, 200).replace(/\s+\S*$/, '') + '...' : note.content;
            return (
              <div key={note.id} style={{ ...styles.noteCard, background: note.color, color: tc, fontFamily: ff, transform: `rotate(${note.rotation}deg)` }} onClick={() => loadDiaryDetail(note.id)}>
                <div style={styles.pin} />
                <p style={{ ...styles.noteContent, color: tc }} dangerouslySetInnerHTML={{ __html: formatContent(tc2) }} />
                <div style={styles.tags}>{note.tags.map((t) => <span key={t} style={{ ...styles.tag, color: tc }}>#{t}</span>)}</div>
                <div style={styles.footer}>
                  <div style={styles.author}>
                    <div style={{ ...styles.avatar, background: '#2a1f1a', color: '#c87800' }}>{note.avatar_url ? <img src={note.avatar_url} style={styles.avatarImg} alt="" /> : note.author.substring(0, 2).toUpperCase()}</div>
                    <span style={{ ...styles.authorName, color: tc }} title={note.author}>{note.author}</span>
                  </div>
                  <div style={{ ...styles.meta, color: tc }}>
                    <span style={styles.metaStat}><svg viewBox="0 0 24 24" fill="none" stroke={tc} strokeWidth="1.5" width="13" height="13"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>{formatViews(note.views)}</span>
                    <span style={styles.metaStat}><svg viewBox="0 0 24 24" fill="none" stroke={tc} strokeWidth="1.5" width="13" height="13"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>{note.comments?.length || 0}</span>
                    <span>{formatDateTime(note.created_at).split(' at ')[0]}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
        {visibleCount < notes.length + 4 && <div ref={loadMoreRef} style={styles.loadingOverlay}><div style={styles.loadingSpinner} /></div>}
      </div>

      {menuOpen && (
        <div style={styles.sideMenuOverlay} onClick={() => setMenuOpen(false)}>
          <div style={styles.sideMenu} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.sideMenuTitle}>diary dump</h3>
            {isLoggedIn && <><button style={styles.sideMenuBtn} onClick={() => { setMenuOpen(false); setOverlay('profile'); }}>Profile</button><button style={styles.sideMenuBtn} onClick={() => { setMenuOpen(false); setOverlay('myDiaries'); }}>My Diaries</button><button style={styles.sideMenuBtn} onClick={() => { setMenuOpen(false); setOverlay('bookmarks'); }}>Bookmarks</button></>}
            <button style={styles.sideMenuBtn} onClick={() => { setMenuOpen(false); setOverlay('settings'); }}>Settings</button>
            <button style={styles.sideMenuBtn} onClick={() => { setMenuOpen(false); setOverlay('about'); }}>About</button>
            {isLoggedIn ? <button style={styles.sideMenuBtn} onClick={() => { setMenuOpen(false); handleLogout(); }}>Logout</button> : <button style={styles.sideMenuBtn} onClick={() => { setMenuOpen(false); setOverlay('login'); }}>Log In</button>}
            <div style={styles.closeMenu} onClick={() => setMenuOpen(false)}>close menu</div>
          </div>
        </div>
      )}

      {toast && <div style={styles.toast}><span style={styles.toastText}>{toast.msg}</span>{toast.diaryId && <button style={styles.toastArrow} onClick={() => {}}>↑</button>}<div style={styles.toastTimer} /></div>}

      {overlay === 'login' && <LoginOverlay onLogin={handleLogin} onRegister={() => setOverlay('register')} onForgotPassword={() => setOverlay('recovery')} onClose={() => setOverlay(null)} />}
      {overlay === 'register' && <RegisterOverlay onRegister={handleRegister} onCheckUsername={handleCheckUsername} onLogin={() => setOverlay('login')} onClose={() => setOverlay(null)} />}
      {overlay === 'recovery' && <RecoveryOverlay onVerifyPin={handleVerifyRecovery} onResetPassword={handleResetPassword} onLogin={() => setOverlay('login')} onClose={() => setOverlay(null)} />}
      {overlay === 'compose' && <ComposeOverlay onPost={handlePostDiary} initialData={pendingCompose} onClose={() => setOverlay(null)} />}
      {overlay === 'detail' && selectedDiary && <DetailOverlay diary={selectedDiary} currentUser={currentUser} onClose={() => { setOverlay(null); setSelectedDiary(null); }} onBookmark={() => handleToggleBookmark(selectedDiary.id)} onDelete={() => handleDeleteDiary(selectedDiary.id)} onBlockUser={handleBlockUser} />}
      {overlay === 'notifications' && <NotificationsOverlay notifications={notifications} onClose={() => setOverlay(null)} onClearAll={async () => { await notificationApi.clearAll(); loadNotifications(); }} />}
      {overlay === 'profile' && currentUser && <ProfileOverlay user={currentUser} onUpdate={async (data: any) => { await profileApi.update(data); loadProfile(); }} onUploadAvatar={async (file: File) => { const res = await uploadApi.avatar(file); return res.avatarUrl; }} onUpdatePassword={async (pw: string) => { await profileApi.updatePassword(pw); }} onDeleteAccount={handleDeleteAccount} onClose={() => setOverlay(null)} />}
      {overlay === 'settings' && <SettingsOverlay onClose={() => setOverlay(null)} />}
      {overlay === 'bookmarks' && <BookmarksOverlay onClose={() => setOverlay(null)} />}
      {overlay === 'myDiaries' && <MyDiariesOverlay onClose={() => setOverlay(null)} onEdit={(d: any) => { setPendingCompose(d); setOverlay('compose'); }} onDelete={handleDeleteDiary} />}
      {overlay === 'about' && <AboutOverlay onClose={() => setOverlay(null)} />}
      {overlay === 'filter' && <FilterOverlay activeFilters={activeFilters} onApply={setActiveFilters} onClose={() => setOverlay(null)} />}
    </div>
  );
}
