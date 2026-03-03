'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth-context';
import { api, cachedApi } from '@/lib/api';
import { GENRE_LIST } from '@/lib/constants';
import {
  ChevronLeft, User, Clock, Heart, Star, Settings, Loader2, Check,
} from 'lucide-react';

export default function ProfilePage() {
  const { user, status, onLogout } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [favGenres, setFavGenres] = useState([]);
  const [dislikedGenres, setDislikedGenres] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (status !== 'ready') return;
    (async () => {
      try {
        const data = await cachedApi('profile');
        setProfile(data);
        setFavGenres(data.preferences?.favoriteGenres || []);
        setDislikedGenres(data.preferences?.dislikedGenres || []);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    })();
  }, [status]);

  const toggleGenre = (genre, list, setList) => {
    if (list.includes(genre)) {
      setList(list.filter(g => g !== genre));
    } else {
      setList([...list, genre]);
    }
    setSaved(false);
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      await api('profile/update', {
        method: 'POST',
        body: JSON.stringify({ favoriteGenres: favGenres, dislikedGenres }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  };

  if (status !== 'ready') return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-[#050505] text-white pb-20"
    >
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#050505]/95 backdrop-blur-md border-b border-white/5">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-white/5" data-testid="profile-back">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold">Mon Profil</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-white/30" /></div>
        ) : profile ? (
          <div className="space-y-8">
            {/* Avatar & Info */}
            <div className="flex items-center gap-6" data-testid="profile-info">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-3xl font-black shadow-lg shadow-red-600/20">
                {profile.profile?.username?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{profile.profile?.username}</h2>
                <p className="text-sm text-white/40 capitalize">{profile.profile?.role}</p>
                {profile.profile?.createdAt && (
                  <p className="text-xs text-white/20 mt-1">
                    Membre depuis {new Date(profile.profile.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                  </p>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3" data-testid="profile-stats">
              <div className="glass-card rounded-2xl p-4 text-center">
                <Clock className="w-5 h-5 mx-auto mb-2 text-blue-400" />
                <p className="text-xl font-bold">{profile.stats?.totalWatchTimeHours || 0}h</p>
                <p className="text-[11px] text-white/40">Temps de visionnage</p>
              </div>
              <div className="glass-card rounded-2xl p-4 text-center">
                <Heart className="w-5 h-5 mx-auto mb-2 text-red-400" />
                <p className="text-xl font-bold">{profile.stats?.favoritesCount || 0}</p>
                <p className="text-[11px] text-white/40">Favoris</p>
              </div>
              <div className="glass-card rounded-2xl p-4 text-center">
                <Star className="w-5 h-5 mx-auto mb-2 text-amber-400" />
                <p className="text-xl font-bold">{profile.stats?.ratingsCount || 0}</p>
                <p className="text-[11px] text-white/40">Notes</p>
              </div>
            </div>

            {/* Genre Preferences */}
            <div>
              <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Settings className="w-4 h-4" /> Genres favoris
              </h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {GENRE_LIST.map(g => (
                  <button
                    key={g}
                    onClick={() => toggleGenre(g, favGenres, setFavGenres)}
                    data-testid={`fav-genre-${g}`}
                    className={`px-3 py-1.5 rounded-xl text-sm transition-all ${
                      favGenres.includes(g)
                        ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                        : 'bg-white/5 text-white/40 border border-white/5 hover:bg-white/10'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">Genres à éviter</h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {GENRE_LIST.map(g => (
                  <button
                    key={g}
                    onClick={() => toggleGenre(g, dislikedGenres, setDislikedGenres)}
                    data-testid={`dislike-genre-${g}`}
                    className={`px-3 py-1.5 rounded-xl text-sm transition-all ${
                      dislikedGenres.includes(g)
                        ? 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                        : 'bg-white/5 text-white/40 border border-white/5 hover:bg-white/10'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Save button */}
            <button
              onClick={savePreferences}
              disabled={saving}
              className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              data-testid="profile-save"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : saved ? <><Check className="w-5 h-5" /> Sauvegardé</> : 'Sauvegarder les préférences'}
            </button>

            {/* Logout */}
            <button
              onClick={onLogout}
              className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white font-medium transition-all"
              data-testid="profile-logout"
            >
              Se déconnecter
            </button>
          </div>
        ) : (
          <div className="text-center py-20 text-white/30">Profil introuvable</div>
        )}
      </div>
    </motion.div>
  );
}
