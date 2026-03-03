'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/auth-context';
import { api, cachedApi, invalidateCache } from '@/lib/api';
import {
  Shield, Users, ChevronLeft, Save, Loader2, Crown, User, Baby, AlertTriangle,
  BarChart3, Clock, Heart, Star, Eye, X, Activity, TrendingUp, Search,
} from 'lucide-react';

const ROLES = [
  { value: 'admin', label: 'Administrateur', icon: Crown, color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/30' },
  { value: 'adult', label: 'Adulte', icon: User, color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/30' },
  { value: 'child', label: 'Enfant', icon: Baby, color: 'text-green-400', bg: 'bg-green-400/10 border-green-400/30' },
];

const AGE_RATINGS = ['', 'G', 'PG', 'PG-13', 'R', 'NC-17', 'Tout public'];

function StatCard({ icon: Icon, label, value, color = 'text-white' }) {
  return (
    <div data-testid={`stat-${label.toLowerCase().replace(/\s/g, '-')}`} className="glass-card rounded-2xl p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl ${color.replace('text-', 'bg-')}/10 flex items-center justify-center`}>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-white/40">{label}</p>
      </div>
    </div>
  );
}

function GenreBar({ genre, count, maxCount }) {
  const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-white/60 w-28 truncate">{genre}</span>
      <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full"
        />
      </div>
      <span className="text-xs text-white/40 w-8 text-right">{count}</span>
    </div>
  );
}

function TelemetryPanel({ userId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        const r = await api(`admin/telemetry/${userId}`);
        setData(r);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    })();
  }, [userId]);

  const maxGenreCount = useMemo(() => {
    if (!data?.topGenres?.length) return 0;
    return Math.max(...data.topGenres.map(g => g.count));
  }, [data]);

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed top-0 right-0 bottom-0 w-full md:w-[500px] bg-[#0d0d0d] border-l border-white/5 z-[60] overflow-y-auto"
      data-testid="telemetry-panel"
    >
      <div className="sticky top-0 bg-[#0d0d0d]/95 backdrop-blur-md p-5 border-b border-white/5 flex items-center justify-between">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-red-400" />
          Télémétrie utilisateur
        </h2>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5"><X className="w-5 h-5" /></button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-white/30" /></div>
      ) : data ? (
        <div className="p-5 space-y-6">
          {/* Quick stats */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={Clock} label="Heures vues" value={data.totalWatchTimeHours || 0} color="text-blue-400" />
            <StatCard icon={Heart} label="Favoris" value={data.favoritesCount || 0} color="text-red-400" />
            <StatCard icon={Star} label="Notes données" value={data.userRatings?.length || 0} color="text-amber-400" />
            <StatCard icon={Eye} label="Rejets" value={data.preferences?.rejectedContentIds || 0} color="text-gray-400" />
          </div>

          {/* Preferred genres */}
          {data.preferences?.favoriteGenres?.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-white/60 mb-3 flex items-center gap-2">
                <Heart className="w-4 h-4 text-red-400" /> Genres préférés
              </h3>
              <div className="flex flex-wrap gap-2">
                {data.preferences.favoriteGenres.map(g => (
                  <span key={g} className="px-3 py-1 rounded-lg bg-red-500/10 text-red-300 text-xs border border-red-500/20">{g}</span>
                ))}
              </div>
            </div>
          )}

          {/* Top clicked genres */}
          {data.topGenres?.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-white/60 mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-400" /> Genres les plus cliqués
              </h3>
              <div className="space-y-2">
                {data.topGenres.map(g => (
                  <GenreBar key={g.genre} genre={g.genre} count={g.count} maxCount={maxGenreCount} />
                ))}
              </div>
            </div>
          )}

          {/* Recent activity */}
          {data.recentActivity?.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-white/60 mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-400" /> Activité récente
              </h3>
              <div className="space-y-1 max-h-[300px] overflow-y-auto">
                {data.recentActivity.slice(0, 20).map((ev, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-white/[0.02] text-xs">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                      ev.action === 'click' ? 'bg-blue-500/10 text-blue-300' :
                      ev.action === 'watch' ? 'bg-green-500/10 text-green-300' :
                      ev.action === 'rate' ? 'bg-amber-500/10 text-amber-300' :
                      ev.action === 'hide' ? 'bg-red-500/10 text-red-300' :
                      'bg-white/5 text-white/40'
                    }`}>{ev.action}</span>
                    <span className="text-white/50 truncate flex-1">{ev.itemId}</span>
                    {ev.value > 0 && ev.action === 'rate' && <span className="text-amber-400">{ev.value}/5</span>}
                    {ev.timestamp && (
                      <span className="text-white/20 text-[10px]">
                        {new Date(ev.timestamp).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-20 text-white/30">Aucune donnée</div>
      )}
    </motion.div>
  );
}

export default function AdminPage() {
  const { user, status } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingChanges, setPendingChanges] = useState({});
  const [saving, setSaving] = useState({});
  const [toast, setToast] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [globalStats, setGlobalStats] = useState(null);
  const [parentalConfig, setParentalConfig] = useState({});

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [usersData, statsData] = await Promise.all([
        cachedApi('admin/users'),
        cachedApi('admin/stats').catch(() => null),
      ]);
      setUsers(usersData.users || []);
      if (statsData) setGlobalStats(statsData);
    } catch (err) {
      if (err.status === 403) {
        setError('Accès refusé — rôle administrateur requis.');
      } else {
        setError(err.message || 'Erreur lors du chargement.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'ready') loadUsers();
  }, [status, loadUsers]);

  const handleRoleChange = (userId, newRole) => {
    setPendingChanges(prev => ({ ...prev, [userId]: { ...prev[userId], role: newRole } }));
  };

  const handleParentalChange = (userId, field, value) => {
    setParentalConfig(prev => ({ ...prev, [userId]: { ...prev[userId], [field]: value } }));
    setPendingChanges(prev => ({ ...prev, [userId]: { ...prev[userId], [field]: value } }));
  };

  const saveUser = async (userId) => {
    const changes = pendingChanges[userId];
    if (!changes) return;

    setSaving(prev => ({ ...prev, [userId]: true }));
    try {
      const currentUser = users.find(u => u.userId === userId);
      await api('admin/users/update', {
        method: 'POST',
        body: JSON.stringify({
          userId,
          role: changes.role || currentUser?.role || 'adult',
          maxRating: changes.maxRating,
          parentId: changes.parentId,
          maxAgeRating: changes.maxAgeRating,
        }),
      });

      setUsers(prev => prev.map(u => u.userId === userId ? { ...u, ...changes } : u));
      setPendingChanges(prev => { const next = { ...prev }; delete next[userId]; return next; });
      setParentalConfig(prev => { const next = { ...prev }; delete next[userId]; return next; });
      invalidateCache('admin/users');
      setToast({ type: 'success', message: 'Utilisateur mis à jour.' });
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Erreur.' });
    } finally {
      setSaving(prev => ({ ...prev, [userId]: false }));
    }
  };

  if (status === 'loading') {
    return <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a]"><Loader2 className="w-8 h-8 animate-spin text-white/40" /></div>;
  }

  const getRoleInfo = (role) => ROLES.find(r => r.value === role) || ROLES[1];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => router.push('/')} className="p-2 rounded-lg hover:bg-white/5" data-testid="admin-back">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-lg"><Shield className="w-5 h-5 text-amber-400" /></div>
            <div>
              <h1 className="text-lg font-semibold">God-Mode Admin</h1>
              <p className="text-xs text-white/40">Tableau de bord et télémétrie avancée</p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2 text-sm text-white/40">
            <Users className="w-4 h-4" />
            <span>{users.length} utilisateur{users.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="fixed top-20 left-1/2 -translate-x-1/2 z-[100]">
            <div className={`px-5 py-3 rounded-xl border shadow-2xl backdrop-blur-xl flex items-center gap-3 ${toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-red-500/10 border-red-500/30 text-red-300'}`}>
              {toast.type === 'error' && <AlertTriangle className="w-4 h-4" />}
              <span className="text-sm font-medium">{toast.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-white/30" />
            <p className="text-white/40 text-sm">Chargement...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <AlertTriangle className="w-10 h-10 text-red-400/60" />
            <p className="text-red-300/80 text-sm text-center max-w-md">{error}</p>
            <button onClick={() => router.push('/')} className="mt-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm">
              Retour
            </button>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Global stats */}
            {globalStats && (
              <div className="mb-8" data-testid="admin-global-stats">
                <h2 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" /> Vue globale du serveur
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                  <StatCard icon={Users} label="Utilisateurs" value={globalStats.totalUsers} color="text-blue-400" />
                  <StatCard icon={Clock} label="Heures totales" value={globalStats.totalWatchTimeHours} color="text-green-400" />
                  <StatCard icon={Activity} label="Événements" value={globalStats.totalEvents} color="text-purple-400" />
                  <StatCard icon={Heart} label="Favoris" value={globalStats.totalFavorites} color="text-red-400" />
                  <StatCard icon={Star} label="Sessions" value={globalStats.totalSessions} color="text-amber-400" />
                </div>

                {/* Top genres bar chart */}
                {globalStats.topGenres?.length > 0 && (
                  <div className="glass-card rounded-2xl p-5 mb-6">
                    <h3 className="text-sm font-semibold text-white/60 mb-4 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-400" /> Genres populaires (global)
                    </h3>
                    <div className="space-y-2">
                      {globalStats.topGenres.slice(0, 8).map(g => (
                        <GenreBar
                          key={g.genre}
                          genre={g.genre}
                          count={g.count}
                          maxCount={Math.max(...globalStats.topGenres.map(x => x.count))}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Users table */}
            <h2 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Users className="w-4 h-4" /> Gestion des utilisateurs
            </h2>
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
              <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-5 py-3 bg-white/[0.03] border-b border-white/5 text-xs text-white/40 uppercase tracking-wider">
                <span>Utilisateur</span>
                <span className="hidden md:block">Dernière connexion</span>
                <span>Rôle</span>
                <span>Parental</span>
                <span className="text-right">Actions</span>
              </div>

              {users.map((u, idx) => {
                const effectiveRole = pendingChanges[u.userId]?.role || u.role;
                const roleInfo = getRoleInfo(effectiveRole);
                const RoleIcon = roleInfo.icon;
                const hasChange = !!pendingChanges[u.userId];
                const isSaving = !!saving[u.userId];

                return (
                  <motion.div
                    key={u.userId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-5 py-4 border-b border-white/[0.03] hover:bg-white/[0.02] items-center"
                    data-testid={`admin-user-row-${u.userId}`}
                  >
                    {/* Username - clickable for telemetry */}
                    <div className="flex items-center gap-3 min-w-0 cursor-pointer" onClick={() => setSelectedUser(u.userId)}>
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${roleInfo.bg} border`}>
                        {u.username?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate hover:text-red-400 transition-colors">{u.username}</p>
                        <p className="text-xs text-white/30 truncate font-mono">{u.userId?.slice(0, 12)}...</p>
                      </div>
                    </div>

                    {/* Last login */}
                    <span className="hidden md:block text-xs text-white/40">
                      {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </span>

                    {/* Role */}
                    <div className="relative">
                      <select
                        value={effectiveRole}
                        onChange={(e) => handleRoleChange(u.userId, e.target.value)}
                        disabled={isSaving}
                        className={`appearance-none bg-transparent border rounded-lg px-3 py-1.5 pr-7 text-xs font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-white/20 disabled:opacity-40 ${roleInfo.bg} ${roleInfo.color}`}
                        data-testid={`role-select-${u.userId}`}
                      >
                        {ROLES.map(r => (
                          <option key={r.value} value={r.value} className="bg-[#1a1a1a] text-white">{r.label}</option>
                        ))}
                      </select>
                      <RoleIcon className={`absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none ${roleInfo.color}`} />
                    </div>

                    {/* Parental controls */}
                    <div className="flex items-center gap-2">
                      {effectiveRole === 'child' && (
                        <>
                          <select
                            value={parentalConfig[u.userId]?.maxAgeRating || u.maxAgeRating || ''}
                            onChange={(e) => handleParentalChange(u.userId, 'maxAgeRating', e.target.value)}
                            className="appearance-none bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white/60 focus:outline-none"
                            data-testid={`age-rating-${u.userId}`}
                          >
                            <option value="" className="bg-[#1a1a1a]">Aucun</option>
                            {AGE_RATINGS.filter(r => r).map(r => (
                              <option key={r} value={r} className="bg-[#1a1a1a]">{r}</option>
                            ))}
                          </select>
                          <select
                            value={parentalConfig[u.userId]?.parentId || u.parentId || ''}
                            onChange={(e) => handleParentalChange(u.userId, 'parentId', e.target.value)}
                            className="appearance-none bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white/60 focus:outline-none"
                            data-testid={`parent-select-${u.userId}`}
                          >
                            <option value="" className="bg-[#1a1a1a]">Parent...</option>
                            {users.filter(p => p.userId !== u.userId && p.role !== 'child').map(p => (
                              <option key={p.userId} value={p.userId} className="bg-[#1a1a1a]">{p.username}</option>
                            ))}
                          </select>
                        </>
                      )}
                      {effectiveRole !== 'child' && <span className="text-xs text-white/20">—</span>}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => setSelectedUser(u.userId)}
                        className="p-2 rounded-lg bg-white/[0.02] hover:bg-white/5 text-white/40 hover:text-white transition-colors"
                        title="Voir télémétrie"
                        data-testid={`telemetry-btn-${u.userId}`}
                      >
                        <BarChart3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => saveUser(u.userId)}
                        disabled={!hasChange || isSaving}
                        className={`p-2 rounded-lg transition-all ${hasChange ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30' : 'bg-white/[0.02] text-white/15 border border-transparent cursor-not-allowed'}`}
                        data-testid={`save-btn-${u.userId}`}
                      >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
              {users.length === 0 && (
                <div className="px-5 py-12 text-center text-white/30 text-sm">Aucun utilisateur trouvé.</div>
              )}
            </div>

            {/* Legend */}
            <div className="mt-6 flex flex-wrap gap-4 justify-center">
              {ROLES.map(r => {
                const Icon = r.icon;
                return (
                  <div key={r.value} className="flex items-center gap-2 text-xs text-white/40">
                    <Icon className={`w-3.5 h-3.5 ${r.color}`} />
                    <span>{r.label}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>

      {/* Telemetry Side Panel */}
      <AnimatePresence>
        {selectedUser && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-[55]"
              onClick={() => setSelectedUser(null)}
            />
            <TelemetryPanel userId={selectedUser} onClose={() => setSelectedUser(null)} />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
