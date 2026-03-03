'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth-context';
import { cachedApi } from '@/lib/api';
import { setItemCache } from '@/lib/item-store';
import { MediaCard } from '@/components/dagzflix/MediaCard';
import { ChevronLeft, Heart, Loader2, Film, Tv } from 'lucide-react';

export default function FavoritesPage() {
  const { status } = useAuth();
  const router = useRouter();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (status !== 'ready') return;
    (async () => {
      try {
        const data = await cachedApi('media/favorites');
        setFavorites(data.favorites || []);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    })();
  }, [status]);

  if (status !== 'ready') return null;

  const handleItemClick = (item) => {
    const id = item.contentId || item.id || item.tmdbId;
    if (id) setItemCache(id, item);
    router.push(`/media/${id}`);
  };

  const filtered = filter === 'all'
    ? favorites
    : filter === 'movies'
    ? favorites.filter(f => f.type === 'Movie')
    : favorites.filter(f => f.type === 'Series');

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-[#050505] text-white pb-20"
    >
      <div className="sticky top-0 z-50 bg-[#050505]/95 backdrop-blur-md border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-white/5" data-testid="favorites-back">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <Heart className="w-5 h-5 text-red-500" />
          <h1 className="text-lg font-semibold">Mes Favoris</h1>
          <span className="text-sm text-white/40">{favorites.length} titre{favorites.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="flex gap-2 mb-8">
          {[
            { id: 'all', label: 'Tout', icon: null },
            { id: 'movies', label: 'Films', icon: Film },
            { id: 'series', label: 'Séries', icon: Tv },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              data-testid={`fav-filter-${f.id}`}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-medium transition-all ${
                filter === f.id ? 'bg-white text-black shadow-lg' : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {f.icon && <f.icon className="w-3.5 h-3.5" />}{f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-white/30" /></div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-4">
            {filtered.map((fav, idx) => (
              <MediaCard
                key={fav.contentId || idx}
                item={{
                  id: fav.contentId,
                  name: fav.name,
                  type: fav.type,
                  posterUrl: fav.posterUrl,
                  year: fav.year,
                  genres: fav.genres || [],
                }}
                onClick={handleItemClick}
                index={idx}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Heart className="w-16 h-16 text-white/10 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white/40 mb-2">Aucun favori</h3>
            <p className="text-sm text-white/20">Ajoutez des films et séries à vos favoris</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
