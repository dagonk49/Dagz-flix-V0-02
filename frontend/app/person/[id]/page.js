'use client';
import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChevronLeft, User, Calendar, Film, Tv, Loader2, Check, Download, Library } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { setItemCache } from '@/lib/item-store';
import { cachedApi } from '@/lib/api';
import { MediaCard } from '@/components/dagzflix/MediaCard';
import { pageVariants } from '@/lib/constants';

/** Onglets principaux pour la filmographie */
const MAIN_TABS = [
  { id: 'available', label: 'Disponibles', icon: Check },
  { id: 'full', label: 'Filmographie complète', icon: Library },
];

export default function PersonPage() {
  const { status } = useAuth();
  const router = useRouter();
  const params = useParams();
  const personId = params.id;

  const [person, setPerson] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imgErr, setImgErr] = useState(false);
  const [activeTab, setActiveTab] = useState('available');

  useEffect(() => {
    if (status !== 'ready' || !personId) return;
    let cancelled = false;

    (async () => {
      try {
        const data = await cachedApi(`person/detail?id=${personId}`);
        if (cancelled) return;
        setPerson(data.person);
        // Sort items chronologically (most recent first)
        const sorted = (data.items || []).sort((a, b) => {
          const yearA = parseInt(a.year) || 0;
          const yearB = parseInt(b.year) || 0;
          return yearB - yearA;
        });
        setItems(sorted);
      } catch (e) {
        console.error('Person detail error:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [status, personId]);

  if (status !== 'ready') return null;

  const handleItemClick = (item) => {
    const id = item.id || item.tmdbId;
    if (id) setItemCache(id, item);
    router.push(`/media/${id}`);
  };

  // Tab-based filtering
  const filteredItems = useMemo(() => {
    if (activeTab === 'available') return items.filter(i => i.mediaStatus === 5);
    return items; // full filmography
  }, [items, activeTab]);

  const movies = filteredItems.filter(i => i.type === 'Movie');
  const series = filteredItems.filter(i => i.type === 'Series');
  const localCount = items.filter(i => i.mediaStatus === 5).length;

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="min-h-screen bg-[#050505] text-white pb-20"
    >
      <button
        onClick={() => router.back()}
        data-testid="person-back"
        className="fixed top-6 left-6 z-50 w-10 h-10 rounded-full bg-black/60 backdrop-blur flex items-center justify-center hover:bg-white/10 transition"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {loading ? (
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-red-500" />
        </div>
      ) : person ? (
        <>
          {/* Hero */}
          <div className="relative pt-20 px-6 md:px-10 pb-10">
            <div className="flex flex-col md:flex-row gap-8 items-start max-w-6xl mx-auto">
              <div className="w-[200px] h-[200px] md:w-[250px] md:h-[250px] rounded-3xl overflow-hidden bg-white/5 ring-1 ring-white/10 flex-shrink-0 shadow-2xl">
                {person.photoUrl && !imgErr ? (
                  <img src={person.photoUrl} alt={person.name} className="w-full h-full object-cover" onError={() => setImgErr(true)} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                    <User className="w-16 h-16 text-gray-600" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h1 data-testid="person-name" className="text-3xl md:text-4xl font-bold mb-3">{person.name}</h1>
                {person.birthDate && (
                  <p className="text-gray-400 text-sm flex items-center gap-2 mb-4">
                    <Calendar className="w-4 h-4" />
                    {new Date(person.birthDate).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                )}
                {person.overview && <p className="text-gray-400 text-sm leading-relaxed line-clamp-6">{person.overview}</p>}
                <div className="flex items-center gap-3 mt-4 text-xs">
                  <span className="text-green-400">{localCount} disponible{localCount > 1 ? 's' : ''}</span>
                  <span className="text-gray-500">·</span>
                  <span className="text-gray-400">{items.length} au total</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs: Available / Full Filmography */}
          <div className="px-6 md:px-10 max-w-6xl mx-auto mb-8">
            <div className="flex flex-wrap gap-2" data-testid="person-tabs">
              {MAIN_TABS.map(t => (
                <button
                  key={t.id}
                  data-testid={`person-tab-${t.id}`}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-medium transition-all ${
                    activeTab === t.id
                      ? 'bg-white text-black shadow-lg'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <t.icon className="w-4 h-4" />{t.label}
                  {t.id === 'available' && <span className="text-xs opacity-60 ml-1">({localCount})</span>}
                  {t.id === 'full' && <span className="text-xs opacity-60 ml-1">({items.length})</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Filmography */}
          <div className="px-6 md:px-10 max-w-6xl mx-auto">
            {movies.length > 0 && (
              <div className="mb-10">
                <h2 className="text-lg font-bold mb-5 flex items-center gap-2">
                  <Film className="w-5 h-5 text-red-500" /> Films ({movies.length})
                </h2>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-4">
                  {movies.map((item, idx) => (
                    <MediaCard key={item.id || item.tmdbId || idx} item={item} onClick={handleItemClick} index={idx} />
                  ))}
                </div>
              </div>
            )}

            {series.length > 0 && (
              <div className="mb-10">
                <h2 className="text-lg font-bold mb-5 flex items-center gap-2">
                  <Tv className="w-5 h-5 text-blue-500" /> Séries ({series.length})
                </h2>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-4">
                  {series.map((item, idx) => (
                    <MediaCard key={item.id || item.tmdbId || idx} item={item} onClick={handleItemClick} index={idx} />
                  ))}
                </div>
              </div>
            )}

            {filteredItems.length === 0 && (
              <div className="text-center py-20">
                <Film className="w-12 h-12 text-white/10 mx-auto mb-4" />
                <p className="text-gray-500">
                  {activeTab === 'available' ? 'Aucun titre disponible sur le serveur.' : 'Aucun titre trouvé.'}
                </p>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center h-[60vh]">
          <p className="text-gray-500">Personne introuvable.</p>
        </div>
      )}
    </motion.div>
  );
}
