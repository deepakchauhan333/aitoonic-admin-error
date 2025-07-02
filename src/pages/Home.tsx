import React, { useEffect, useState } from 'react';
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

  useEffect(() => {
    async function fetchData() {
      // Fetch categories with tool count
      const { data: categoriesData } = await supabase
        .from('categories')
        .select(`
          id,
          name,
          description,
          tools (count)
        `);

      if (categoriesData) {
        const categoriesWithCount = categoriesData.map(category => ({
          ...category,
          tool_count: category.tools[0]?.count || 0
        })).sort((a, b) => b.tool_count - a.tool_count); // Sort by tool count descending
        setCategories(categoriesWithCount);
      }

      // Fetch all tools with category names
      const { data: toolsData } = await supabase
        .from('tools')
        .select(`
          *,
          categories (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (toolsData) {
        const toolsWithCategory = toolsData.map(tool => ({
          ...tool,
          category_name: tool.categories?.name
        }));
        setTools(toolsWithCategory);

        // Get today's tools (last 24 hours)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todaysTools = toolsWithCategory.filter(tool => 
          new Date(tool.created_at) >= today
        );
        setTodayTools(todaysTools);
        setFilteredTools(todaysTools);
      }
    }
    
    fetchData();
  }, []);

  // Search functionality
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setSearchResults([]);
      return;
    }

    const term = searchTerm.toLowerCase();
    const results: SearchResult[] = [];

    // Search in tools
    tools.forEach(tool => {
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

    setSearchResults(results.slice(0, 10)); // Limit to 10 results
  }, [searchTerm, tools, categories]);

  // Filter functionality
  useEffect(() => {
    switch (activeFilter) {
      case 'today':
        setFilteredTools(todayTools);
        break;
      case 'new':
        setFilteredTools(tools.slice(0, 12));
        break;
      case 'saved':
        // Mock most saved - in real app, you'd track this
        setFilteredTools([...tools].sort(() => Math.random() - 0.5).slice(0, 12));
        break;
      case 'used':
        // Mock most used - in real app, you'd track this
        setFilteredTools([...tools].sort(() => Math.random() - 0.5).slice(0, 12));
        break;
    }
  }, [activeFilter, tools, todayTools]);

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

      <div className="min-h-screen bg-royal-dark">
        {/* Header Section */}
        <section className="py-12 bg-royal-dark">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">
                Discover The Best AI Websites & Tools
              </h1>
              <p className="text-lg text-gray-300 mb-8">
                Discover the best AI tools directory. AI tools list & GPTs store are updated daily by ChatGPT.
              </p>

              {/* Search Bar */}
              <div className="max-w-2xl mx-auto mb-8">
                <div id="search-container" className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search AI Tools, Video Translation or Tool"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setShowResults(true);
                    }}
                    onFocus={() => setShowResults(true)}
                    className="w-full pl-12 pr-16 py-4 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-blue-500 text-base"
                  />
                  <button className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                    <Search className="w-4 h-4" />
                  </button>

                  {/* Search Results Dropdown */}
                  {showResults && searchResults.length > 0 && (
                    <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden max-h-96 overflow-y-auto z-50">
                      {searchResults.map((result, index) => (
                        <button
                          key={`${result.type}-${index}`}
                          className="w-full px-4 py-3 flex items-center space-x-3 hover:bg-gray-50 transition-colors text-left"
                          onClick={() => handleResultClick(result)}
                        >
                          <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                            {result.type === 'tool' ? '🔧' : '📁'}
                          </div>
                          <div>
                            <h4 className="text-gray-900 font-medium">{result.item.name}</h4>
                            <p className="text-sm text-gray-500 line-clamp-1">
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
                    className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      activeFilter === key
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
        {filteredTools.length > 0 && (
          <section className="py-12 bg-gray-50">
            <div className="container mx-auto px-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
                {activeFilter === 'today' && 'Today\'s New Tools'}
                {activeFilter === 'new' && 'Latest AI Tools'}
                {activeFilter === 'saved' && 'Most Saved Tools'}
                {activeFilter === 'used' && 'Most Used Tools'}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {filteredTools.slice(0, 12).map((tool) => (
                  <Link
                    key={tool.id}
                    to={`/ai/${tool.name.toLowerCase().replace(/\s+/g, '-')}`}
                    className="group bg-white rounded-lg p-4 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
                  >
                    <div className="aspect-square mb-3 overflow-hidden rounded-lg">
                      <img
                        src={tool.image_url || 'https://via.placeholder.com/100'}
                        alt={tool.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    </div>
                    <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-1">
                      {tool.name}
                    </h3>
                    <p className="text-xs text-gray-500 line-clamp-2">
                      {tool.description}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Categories Section */}
        <section className="py-12 bg-white">
          <div className="container mx-auto px-4">
            {categories.map((category) => {
              // Get tools for this category
              const categoryTools = tools.filter(tool => tool.category_id === category.id);
              
              if (categoryTools.length === 0) return null;

              return (
                <div key={category.id} className="mb-16">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {category.name}
                      </h2>
                      <p className="text-gray-600">{category.description}</p>
                    </div>
                    <Link
                      to={`/category/${category.name.toLowerCase().replace(/\s+/g, '-')}`}
                      className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium"
                    >
                      <span>View All ({category.tool_count})</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {categoryTools.slice(0, 12).map((tool) => (
                      <Link
                        key={tool.id}
                        to={`/ai/${tool.name.toLowerCase().replace(/\s+/g, '-')}`}
                        className="group bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
                      >
                        <div className="aspect-square mb-3 overflow-hidden rounded-lg">
                          <img
                            src={tool.image_url || 'https://via.placeholder.com/100'}
                            alt={tool.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                        </div>
                        <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-1">
                          {tool.name}
                        </h3>
                        <p className="text-xs text-gray-500 line-clamp-2">
                          {tool.description}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Newsletter Section */}
        <section className="py-16 bg-royal-dark">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-4 gradient-text">Stay Updated</h2>
              <p className="text-gray-300 mb-8">
                Get the latest AI tools and insights delivered to your inbox
              </p>
              <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-6 py-3 rounded-lg bg-white border border-gray-200 text-gray-900 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  className="w-full sm:w-auto bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 whitespace-nowrap transition-colors"
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