import { GetServerSideProps } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { Star, Bot, Globe, Zap, Check, ExternalLink, ChevronRight, Clock, Users, Shield } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Layout from '../../components/Layout';

interface Agent {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  api_endpoint: string;
  pricing_type: string;
  status: string;
  image_url: string;
  is_available_24_7: boolean;
  user_count: number;
  has_fast_response: boolean;
  is_secure: boolean;
}

interface AgentDetailProps {
  agent: Agent | null;
  similarAgents: Agent[];
}

export default function AgentDetail({ agent, similarAgents }: AgentDetailProps) {
  if (!agent) {
    return (
      <Layout>
        <Head>
          <title>Agent Not Found | Aitoonic</title>
          <meta name="robots" content="noindex, nofollow" />
        </Head>
        
        <div className="min-h-screen bg-royal-dark py-20">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-white mb-4">Agent Not Found</h1>
              <p className="text-gray-400 mb-8">The agent you're looking for doesn't exist or has been removed.</p>
              <Link 
                href="/ai-agent"
                className="inline-flex items-center text-royal-gold hover:text-royal-gold/80"
              >
                <ChevronRight className="w-5 h-5 mr-2" />
                Back to AI Agents
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>{agent.name} - AI Agent | Aitoonic</title>
        <meta name="description" content={agent.description} />
        <meta property="og:title" content={`${agent.name} - AI Agent | Aitoonic`} />
        <meta property="og:description" content={agent.description} />
        <meta property="og:image" content={agent.image_url} />
        <meta property="og:type" content="product" />
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Product',
              name: agent.name,
              description: agent.description,
              url: `https://aitoonic.com/ai-agent/${agent.name.toLowerCase().replace(/\s+/g, '-')}`,
              image: agent.image_url,
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
                availability: 'https://schema.org/OnlineOnly'
              }
            })
          }}
        />
      </Head>

      <div className="min-h-screen bg-royal-dark py-20">
        <div className="container mx-auto px-4">
          {/* Breadcrumbs */}
          <div className="flex items-center space-x-2 text-sm mb-8 overflow-x-auto whitespace-nowrap pb-2">
            <Link href="/" className="text-gray-400 hover:text-white">Home</Link>
            <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
            <Link href="/ai-agent" className="text-gray-400 hover:text-white">AI Agents</Link>
            <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
            <span className="text-gray-300">{agent.name}</span>
          </div>

          {/* Hero Section */}
          <div className="bg-royal-dark-card rounded-2xl overflow-hidden border border-royal-dark-lighter mb-12">
            <div className="aspect-video">
              <Image
                src={agent.image_url || 'https://i.imgur.com/NXyUxX7.png'}
                alt={agent.name}
                width={1200}
                height={675}
                className="w-full h-full object-cover"
                priority
              />
            </div>
            
            <div className="p-4 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-6 space-y-4 sm:space-y-0">
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-4">
                    <Bot className="w-12 h-12 text-royal-gold" />
                    <div>
                      <h1 className="text-3xl font-bold gradient-text">{agent.name}</h1>
                      <div className="flex items-center mt-2">
                        <Star className="w-5 h-5 text-royal-gold" fill="currentColor" />
                        <Star className="w-5 h-5 text-royal-gold" fill="currentColor" />
                        <Star className="w-5 h-5 text-royal-gold" fill="currentColor" />
                        <Star className="w-5 h-5 text-royal-gold" fill="currentColor" />
                        <Star className="w-5 h-5 text-royal-gold" fill="currentColor" />
                        <span className="ml-2 text-gray-300">(50+ reviews)</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-300 text-lg">{agent.description}</p>
                </div>
                {agent.pricing_type && (
                  <span className="text-sm font-medium px-4 py-2 rounded-full bg-royal-dark text-royal-gold">
                    {agent.pricing_type}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {agent.is_available_24_7 && (
                  <div className="flex items-center space-x-3 text-gray-300">
                    <Clock className="w-5 h-5 text-royal-gold flex-shrink-0" />
                    <span>24/7 Available</span>
                  </div>
                )}
                {agent.user_count > 0 && (
                  <div className="flex items-center space-x-3 text-gray-300">
                    <Users className="w-5 h-5 text-royal-gold flex-shrink-0" />
                    <span>{agent.user_count.toLocaleString()}+ users</span>
                  </div>
                )}
                {agent.has_fast_response && (
                  <div className="flex items-center space-x-3 text-gray-300">
                    <Zap className="w-5 h-5 text-royal-gold flex-shrink-0" />
                    <span>Fast Response</span>
                  </div>
                )}
                {agent.is_secure && (
                  <div className="flex items-center space-x-3 text-gray-300">
                    <Shield className="w-5 h-5 text-royal-gold flex-shrink-0" />
                    <span>Secure & Private</span>
                  </div>
                )}
              </div>

              {agent.api_endpoint && (
                <div className="flex space-x-4">
                  <a
                    href={agent.api_endpoint}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto inline-flex items-center justify-center bg-royal-gold text-royal-dark px-6 py-3 rounded-lg font-bold hover:bg-opacity-90 transition-all"
                  >
                    Try Agent Now
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-3">
              {/* Capabilities */}
              {agent.capabilities && agent.capabilities.length > 0 && (
                <div className="bg-royal-dark-card rounded-2xl p-4 sm:p-8 border border-royal-dark-lighter mb-12">
                  <h2 className="text-2xl font-bold mb-6">Capabilities</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {agent.capabilities.map((capability, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <Check className="w-5 h-5 text-royal-gold mt-1 flex-shrink-0" />
                        <div>
                          <h3 className="font-semibold text-white mb-1">{capability}</h3>
                          <p className="text-gray-400 text-sm">
                            Detailed explanation of how {agent.name} handles {capability.toLowerCase()}.
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Similar Agents */}
              {similarAgents.length > 0 && (
                <div className="bg-royal-dark-card rounded-2xl p-4 sm:p-8 border border-royal-dark-lighter">
                  <h2 className="text-2xl font-bold mb-6">Similar Agents</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {similarAgents.map((similarAgent) => (
                      <Link
                        key={similarAgent.id}
                        href={`/ai-agent/${similarAgent.name.toLowerCase().replace(/\s+/g, '-')}`}
                        className="group"
                      >
                        <div className="aspect-video rounded-lg overflow-hidden mb-3">
                          <Image
                            src={similarAgent.image_url || 'https://i.imgur.com/NXyUxX7.png'}
                            alt={similarAgent.name}
                            width={300}
                            height={169}
                            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <h3 className="font-semibold text-white group-hover:text-royal-gold transition-colors">
                          {similarAgent.name}
                        </h3>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const { slug } = params!;
  
  try {
    const { data: agentData } = await supabase
      .from('agents')
      .select('*')
      .ilike('name', (slug as string).replace(/-/g, ' '))
      .single();
    
    if (!agentData) {
      return {
        props: {
          agent: null,
          similarAgents: []
        }
      };
    }

    // Fetch similar agents
    const { data: similarAgentsData } = await supabase
      .from('agents')
      .select('*')
      .neq('id', agentData.id)
      .eq('status', 'active')
      .limit(3);

    return {
      props: {
        agent: agentData,
        similarAgents: similarAgentsData || []
      }
    };
  } catch (error) {
    console.error('Error fetching agent:', error);
    return {
      props: {
        agent: null,
        similarAgents: []
      }
    };
  }
};