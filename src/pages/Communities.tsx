import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Frown, Rocket, SlidersHorizontal } from 'lucide-react';
import CommunitiesExplorer from '../components/CommunitiesExplorer';
import CommunityCard from '../components/CommunityCard';
import PageBanner from '../components/ui/PageBanner';
import Pagination, { paginateSlice, totalPages } from '../components/ui/Pagination';
import ScrollReveal, { StaggerReveal } from '../components/motion/ScrollReveal';
import SearchBar from '../components/ui/SearchBar';
import SearchEmptyState from '../components/ui/SearchEmptyState';
import { DIAPO } from '../data/heroSlides';
import { resolveTogoCity } from '../data/togoData';
import { filterBySearch } from '../lib/search';
import { api } from '../lib/api';
import type { Community } from '../types';

const PAGE_SIZE = 6;

export default function Communities() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [pricingFilter, setPricingFilter] = useState<'all' | 'free' | 'paid'>('all');
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api
      .listCommunities()
      .then((res) => setCommunities(res.data.communities))
      .catch(() => setCommunities([]))
      .finally(() => setLoading(false));
  }, []);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    communities.forEach((c) => c.tags.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [communities]);

  const filtered = useMemo(() => {
    const byFilters = communities.filter((c) => {
      const matchTag = !activeTag || c.tags.includes(activeTag);
      const matchCity = !selectedCity || resolveTogoCity(c.city) === selectedCity;
      const matchPricing =
        pricingFilter === 'all' ||
        (pricingFilter === 'free' && (c.pricingType ?? 'free') === 'free') ||
        (pricingFilter === 'paid' && (c.pricingType === 'paid' || c.pricingType === 'freemium'));
      return matchTag && matchCity && matchPricing;
    });
    return filterBySearch(byFilters, search, (c) => [
      c.name,
      c.description,
      c.shortDescription,
      c.city,
      c.country,
      c.tags,
    ]);
  }, [communities, search, activeTag, selectedCity, pricingFilter]);

  const pages = totalPages(filtered.length, PAGE_SIZE);
  const paginated = useMemo(
    () => paginateSlice(filtered, page, PAGE_SIZE),
    [filtered, page]
  );

  useEffect(() => {
    setPage(1);
  }, [search, activeTag, selectedCity, pricingFilter]);

  useEffect(() => {
    if (page > pages) setPage(pages);
  }, [page, pages]);

  const goToPage = (next: number) => {
    setPage(next);
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      <PageBanner
        image={DIAPO.communitiesBanner}
        title={
          <>
            Le{' '}
            <span className="bg-gradient-to-r from-togo-green via-togo-yellow to-togo-red bg-clip-text text-transparent">
              SaaS
            </span>{' '}
            du Togo
          </>
        }
        subtitle="Explorez, filtrez et découvrez les solutions SaaS togolaises — gratuites ou payantes."
      />

      <section className="bg-white pb-24 dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal variant="fade-up" delay={100}>
            <div className="-mt-12 rounded-3xl border border-slate-200 bg-white p-4 shadow-lg dark:border-slate-800 dark:bg-slate-900">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Rechercher une solution, une catégorie, une ville…"
              resultCount={filtered.length}
              totalCount={communities.length}
            />

            {allTags.length > 0 && (
              <div className="mt-4 flex flex-col gap-4 border-t border-slate-100 pt-4 dark:border-slate-800">
                <div className="flex items-start gap-3">
                  <SlidersHorizontal className="mt-1.5 h-4 w-4 shrink-0 text-slate-400" />
                  <div className="flex flex-wrap gap-2">
                    {(['all', 'free', 'paid'] as const).map((pf) => (
                      <button
                        key={pf}
                        onClick={() => setPricingFilter(pf)}
                        className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${
                          pricingFilter === pf
                            ? 'bg-togo-yellow text-slate-900'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {pf === 'all' && 'Tous les tarifs'}
                        {pf === 'free' && 'Gratuit'}
                        {pf === 'paid' && 'Payant / Freemium'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-1.5 w-4 shrink-0" />
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setActiveTag(null)}
                      className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${
                        !activeTag
                          ? 'bg-togo-green text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      Toutes catégories
                    </button>
                    {allTags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => setActiveTag((t) => (t === tag ? null : tag))}
                        className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${
                          activeTag === tag
                            ? 'bg-togo-green text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            </div>
          </ScrollReveal>

          {!loading && communities.length > 0 && (
            <ScrollReveal variant="fade-up" delay={150}>
              <CommunitiesExplorer
                communities={communities}
                selectedCity={selectedCity}
                onSelectCity={setSelectedCity}
              />
            </ScrollReveal>
          )}

          <div ref={resultsRef} className="mt-10 scroll-mt-28 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              {loading ? 'Chargement...' : `${filtered.length} solution(s) trouvée(s)`}
            </p>
            {!loading && filtered.length > PAGE_SIZE && (
              <p className="text-xs font-medium text-slate-400">
                Page {page} / {pages}
              </p>
            )}
          </div>

          {loading ? (
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-64 skeleton rounded-3xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="mt-10 flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 py-20 text-center dark:border-slate-700">
              <Frown className="h-12 w-12 text-slate-300" />
              <h3 className="mt-4 text-lg font-bold text-slate-700 dark:text-slate-200">
                Aucune solution trouvée
              </h3>
              <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                Modifiez vos filtres, ou soyez le premier à publier votre
                solution SaaS sur la plateforme.
              </p>
              <Link
                to="/inscription"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-togo-green px-5 py-3 text-sm font-bold text-white"
              >
                <Rocket className="h-4 w-4" /> Publier ma solution
              </Link>
            </div>
          ) : (
            <>
              <div key={page} className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {paginated.map((c, i) => (
                    <StaggerReveal key={c.id} index={i} variant="gentle-up" stagger={90}>
                      <CommunityCard community={c} />
                    </StaggerReveal>
                  ))}
                </div>

              <ScrollReveal variant="fade-up" delay={200}>
                <Pagination
                  page={page}
                  totalPages={pages}
                  totalItems={filtered.length}
                  pageSize={PAGE_SIZE}
                  onPageChange={goToPage}
                />
              </ScrollReveal>
            </>
          )}
        </div>
      </section>
    </>
  );
}
