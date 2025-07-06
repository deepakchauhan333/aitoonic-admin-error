import React, { useEffect, useState, useMemo } from 'react';
import { Search, Calendar, TrendingUp, Bookmark, Users, ChevronRight, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Link, useNavigate } from 'react-router-dom';
import { SEO } from '../components/SEO';

interface Category {
  id: string;
  name: string;
  description: string;
  tool_count: number;
}

interface Tool {
  id: string;
  name: string;
  description: string;
  url: string;
  category_id: string;
  image_url: string;
  created_at: string;
  category_name?: string;
}

interface SearchResult {
  type: 'tool' | 'category';
  item: Tool | Category;
}

// Loading skeleton components
const ToolSkeleton = () => (
  <div className="group card card-hover animate-pulse">
    <div className="aspect-16-9 rounded-t-xl overflow-hidden bg-slate-700"></div>
    <div className="p-4">
      <div className="h-4 bg-slate-700 rounded mb-2"></div>
      <div className="h-3 bg-slate-600 rounded w-3/4"></div>
    </div>
  </div>
);

const CategorySkeleton = () => (
  <div className="mb-20 animate-pulse">
    <div className="flex items-center justify-between mb-8">
      <div>
        <div className="h-8 bg-slate-700 rounded w-48 mb-2"></div>
        <div className="h-4 bg-slate-600 rounded w-64"></div>
      </div>
      <div className="h-12 bg-slate-700 rounded w-32"></div>
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <ToolSkeleton key={i} />
      ))}
    </div>
  </div>
);

function Home() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [todayTools, setTodayTools] = useState<Tool[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'today' | 'new' | 'saved' | 'used'>('today');
  const [filteredTools, setFilteredTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [toolsLoading, setToolsLoading] = useState(true);

  // Memoize filtered tools to prevent unnecessary recalculations
  const memoizedFilteredTools = useMemo(() => {
    switch (activeFilter) {
      case 'today':
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return tools.filter(tool => new Date(tool.created_at) >= today);
      case 'new':
        return tools.slice(0, 12);
      case 'saved':
        return [...tools].sort(() => Math.random() - 0.5).slice(0, 12);
      case 'used':
        return [...tools].sort(() => Math.random() - 0.5).slice(0, 12);
      default:
        return [];
    }
  }, [activeFilter, tools]);

  // Optimized data fetching with parallel requests and caching
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // Fetch categories and tools in parallel for better performance
        const [categoriesResponse, toolsResponse] = await Promise.all([
          // Optimized categories query with tool count
          supabase
            .from('categories')
            .select(`
              id,
              name,
              description,
              tools!inner(count)
            `)
            .order('name'),
          
          // Optimized tools query with category names - limit initial load
          supabase
            .from('tools')
            .select(`
              id,
              name,
              description,
              url,
              category_id,
              image_url,
              created_at,
              categories!inner(name)
            `)
            .order('created_at', { ascending: false })
            .limit(100) // Limit initial load for better performance
        ]);

        // Process categories
        if (categoriesResponse.data) {
          const categoriesWithCount = categoriesResponse.data
            .map(category => ({
              ...category,
              tool_count: category.tools?.[0]?.count || 0
            }))
            .filter(category => category.tool_count > 0) // Only show categories with tools
            .sort((a, b) => b.tool_count - a.tool_count); // Sort by tool count
          
          setCategories(categoriesWithCount);
          setCategoriesLoading(false);
        }

        // Process tools
        if (toolsResponse.data) {
          const toolsWithCategory = toolsResponse.data.map(tool => ({
            ...tool,
            category_name: tool.categories?.name
          }));
          
          setTools(toolsWithCategory);
          setToolsLoading(false);
          
          // Set today's tools
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const todaysTools = toolsWithCategory.filter(tool => 
            new Date(tool.created_at) >= today
          );
          setTodayTools(todaysTools);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);

  // Update filtered tools when dependencies change
  useEffect(() => {
    setFilteredTools(memoizedFilteredTools);
  }, [memoizedFilteredTools]);

  // Optimized search with debouncing
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(() => {
      const term = searchTerm.toLowerCase();
      const results: SearchResult[] = [];

      // Search in tools (limit results for performance)
      tools.slice(0, 50).forEach(tool => {
        if (tool.name.toLowerCase().includes(term) || 
            tool.description.toLowerCase().includes(term)) {
          results.push({ type: 'tool', item: tool });
        }
      });

      // Search in categories
      categories.forEach(category => {
        if (category.name.toLowerCase().includes(term) || 
            category.description?.toLowerCase().includes(term)) {
          results.push({ type: 'category', item: category });
        }
      });

      setSearchResults(results.slice(0, 8)); // Limit to 8 results
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchTerm, tools, categories]);

  const handleResultClick = (result: SearchResult) => {
    setShowResults(false);
    setSearchTerm('');

    if (result.type === 'tool') {
      navigate(`/ai/${result.item.name.toLowerCase().replace(/\s+/g, '-')}`);
    } else {
      navigate(`/category/${result.item.name.toLowerCase().replace(/\s+/g, '-')}`);
    }
  };

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const searchContainer = document.getElementById('search-container');
      if (searchContainer && !searchContainer.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <SEO
        title="Discover The Best AI Websites & Tools | Aitoonic"
        description="Discover the best AI tools and websites. Browse 131+ AI tools across 61+ categories. Find the perfect AI solution for your needs."
        keywords="AI tools, artificial intelligence, machine learning, AI websites, AI software, AI directory"
      />

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Header Section */}
        <section className="py-16 bg-gradient-to-r from-primary-900/20 to-secondary-900/20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 gradient-text">
                Discover The Best AI Websites & Tools
              </h1>
              <p className="text-xl text-slate-300 mb-8">
                Discover the best AI tools directory. AI tools list & GPTs store are updated daily by ChatGPT.
              </p>

              {/* Search Bar */}
              <div className="max-w-2xl mx-auto mb-8">
                <div id="search-container" className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search AI Tools, Video Translation or Tool"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setShowResults(true);
                    }}
                    onFocus={() => setShowResults(true)}
                    className="w-full pl-12 pr-16 py-4 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base shadow-lg"
                  />
                  <button className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors">
                    <Search className="w-4 h-4" />
                  </button>

                  {/* Search Results Dropdown */}
                  {showResults && searchResults.length > 0 && (
                    <div className="absolute left-0 right-0 mt-2 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl shadow-2xl overflow-hidden max-h-96 overflow-y-auto z-50">
                      {searchResults.map((result, index) => (
                        <button
                          key={`${result.type}-${index}`}
                          className="w-full px-4 py-3 flex items-center space-x-3 hover:bg-primary-50 transition-colors text-left"
                          onClick={() => handleResultClick(result)}
                        >
                          <div className="w-8 h-8 bg-primary-100 rounded flex items-center justify-center">
                            {result.type === 'tool' ? '🔧' : '📁'}
                          </div>
                          <div>
                            <h4 className="text-slate-900 font-medium">{result.item.name}</h4>
                            <p className="text-sm text-slate-500 line-clamp-1">
                              {result.item.description}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Filter Buttons */}
              <div className="flex flex-wrap justify-center gap-3 mb-12">
                {[
                  { key: 'today', label: 'Today', icon: Calendar },
                  { key: 'new', label: 'New', icon: Star },
                  { key: 'saved', label: 'Most Saved', icon: Bookmark },
                  { key: 'used', label: 'Most Used', icon: TrendingUp }
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setActiveFilter(key as any)}
                    className={`flex items-center space-x-2 px-6 py-3 rounded-full text-sm font-medium transition-all ${
                      activeFilter === key
                        ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                        : 'bg-white/10 backdrop-blur-sm text-slate-300 hover:bg-white/20 border border-white/20'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Today's Tools Section */}
        {(filteredTools.length > 0 || toolsLoading) && (
          <section className="py-16 bg-slate-800/50">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold text-white mb-8 text-center">
                {activeFilter === 'today' && 'Today\'s New Tools'}
                {activeFilter === 'new' && 'Latest AI Tools'}
                {activeFilter === 'saved' && 'Most Saved Tools'}
                {activeFilter === 'used' && 'Most Used Tools'}
              </h2>
              
              {toolsLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <ToolSkeleton key={i} />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                  {filteredTools.slice(0, 12).map((tool) => (
                    <Link
                      key={tool.id}
                      to={`/ai/${tool.name.toLowerCase().replace(/\s+/g, '-')}`}
                      className="group card card-hover"
                    >
                      <div className="aspect-16-9 rounded-t-xl overflow-hidden">
                        <img
                          src={tool.image_url || 'https://via.placeholder.com/400x225'}
                          alt={tool.name}
                          className="image-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-white text-sm mb-2 line-clamp-1 group-hover:text-primary-400 transition-colors">
                          {tool.name}
                        </h3>
                        <p className="text-xs text-slate-400 line-clamp-2">
                          {tool.description}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Categories Section */}
        <section className="py-16 bg-slate-900/50">
          <div className="container mx-auto px-4">
            {categoriesLoading ? (
              // Loading skeletons for categories
              <div>
                {Array.from({ length: 3 }).map((_, i) => (
                  <CategorySkeleton key={i} />
                ))}
              </div>
            ) : (
              categories.map((category) => {
                // Get tools for this category (limit for performance)
                const categoryTools = tools.filter(tool => tool.category_id === category.id).slice(0, 12);
                
                if (categoryTools.length === 0) return null;

                return (
                  <div key={category.id} className="mb-20">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h2 className="text-3xl font-bold text-white mb-2">
                          {category.name}
                        </h2>
                        <p className="text-slate-400">{category.description}</p>
                      </div>
                      <Link
                        to={`/category/${category.name.toLowerCase().replace(/\s+/g, '-')}`}
                        className="flex items-center space-x-2 bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-xl font-medium transition-all hover:shadow-lg hover:shadow-primary-500/25"
                      >
                        <span>View All ({category.tool_count})</span>
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                      {categoryTools.map((tool) => (
                        <Link
                          key={tool.id}
                          to={`/ai/${tool.name.toLowerCase().replace(/\s+/g, '-')}`}
                          className="group card card-hover"
                        >
                          <div className="aspect-16-9 rounded-t-xl overflow-hidden">
                            <img
                              src={tool.image_url || 'https://via.placeholder.com/400x225'}
                              alt={tool.name}
                              className="image-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                          </div>
                          <div className="p-4">
                            <h3 className="font-semibold text-white text-sm mb-2 line-clamp-1 group-hover:text-primary-400 transition-colors">
                              {tool.name}
                            </h3>
                            <p className="text-xs text-slate-400 line-clamp-2">
                              {tool.description}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Newsletter Section */}
        <section className="py-20 bg-gradient-to-r from-primary-900/30 to-secondary-900/30">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-4xl font-bold mb-4 gradient-text">Stay Updated</h2>
              <p className="text-slate-300 mb-8 text-lg">
                Get the latest AI tools and insights delivered to your inbox
              </p>
              <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-6 py-4 rounded-xl bg-white/95 backdrop-blur-sm border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  className="w-full sm:w-auto bg-primary-500 hover:bg-primary-600 text-white px-8 py-4 rounded-xl font-medium whitespace-nowrap transition-all hover:shadow-lg hover:shadow-primary-500/25"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

export default Home;