/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, 
  Target, 
  MessageSquare, 
  ShoppingCart, 
  Users, 
  Bell, 
  Settings, 
  TrendingUp, 
  Zap, 
  ChevronRight, 
  CheckCircle2, 
  Star,
  Flame,
  Watch,
  Apple,
  LogOut,
  User
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { UserProfile, NutritionEntry, Recommendation, ChatMessage } from './types';
import { getNutritionRecommendation, chatWithVitalis } from './lib/gemini';
import { api } from './lib/api';
import { getSupabase } from './lib/supabase';
import { AuthComponent } from './components/Auth';

// --- Components ---

const Navbar = ({ activeTab, setActiveTab, onSignOut }: { activeTab: string, setActiveTab: (t: any) => void, onSignOut: () => void }) => {
  const tabs = [
    { id: 'dashboard', icon: Activity, label: 'Vital' },
    { id: 'coach', icon: MessageSquare, label: 'Coach' },
    { id: 'store', icon: ShoppingCart, label: 'Performance' },
    { id: 'community', icon: Users, label: 'Base' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-neutral-900/80 backdrop-blur-xl border-t border-neutral-800 px-4 pb-safe pt-2 z-50 md:top-0 md:bottom-auto md:border-b md:border-t-0 md:px-12 h-20 flex items-center justify-between">
      <div className="hidden md:flex items-center gap-2">
        <div className="w-8 h-8 bg-sky-600 rounded flex items-center justify-center font-bold text-white">V</div>
        <span className="font-bold tracking-tighter text-xl text-white">VITALIS</span>
      </div>
      
      <div className="flex w-full md:w-auto justify-around md:gap-8 max-w-lg mx-auto md:mx-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col md:flex-row items-center gap-1 md:gap-2 px-3 py-1 transition-all relative ${
              activeTab === tab.id ? 'text-sky-500' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <tab.icon className="w-6 h-6 md:w-5 md:h-5" />
            <span className="text-[10px] md:text-sm font-medium uppercase tracking-widest">{tab.label}</span>
            {activeTab === tab.id && (
              <motion.div layoutId="nav-pill" className="absolute -bottom-1 md:-bottom-6 left-0 right-0 h-1 bg-sky-500 hidden md:block" />
            )}
          </button>
        ))}
      </div>
      
      <div className="hidden md:flex items-center gap-4 text-neutral-400">
        <Bell className="w-5 h-5 hover:text-white cursor-pointer" />
        <button onClick={onSignOut} className="flex items-center gap-2 hover:text-white transition-colors group">
          <LogOut className="w-5 h-5 group-hover:text-red-400" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Sair</span>
        </button>
        <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700" />
      </div>
    </nav>
  );
};

// --- Views ---

const ProfileView = ({ profile, user, onUpdate, onSignOut }: { profile: UserProfile, user: any, onUpdate: (p: UserProfile) => void, onSignOut: () => void }) => {
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    name: profile.name,
    goal: profile.goal,
    weight: profile.weight,
    activityLevel: profile.activityLevel,
    proteinTarget: profile.proteinTarget,
    avatarUrl: profile.avatarUrl || ''
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('handleSubmit: user.id:', user.id, 'formData:', formData);
    setSaving(true);
    const success = await api.updateProfile(user.id, formData);
    if (success) {
      onUpdate({ ...profile, ...formData, avatarUrl: formData.avatarUrl });
    }
    setSaving(false);
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h2 className="text-2xl font-black italic tracking-tighter uppercase mb-6 text-slate-800">
        Configuração do Atleta
      </h2>
      <div className="bg-white border border-slate-200 p-8 rounded-sm shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
              <div className="w-16 h-16 rounded-full bg-slate-200 flex-shrink-0 overflow-hidden flex items-center justify-center text-slate-400 font-bold">
                {formData.avatarUrl ? (
                  <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  formData.name?.substring(0, 2).toUpperCase() || '?'
                )}
              </div>
              <div className="flex-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">URL da Foto de Perfil (Opcional)</label>
                <input
                  type="url"
                  placeholder="https://exemplo.com/foto.jpg"
                  value={formData.avatarUrl || ''}
                  onChange={e => setFormData({ ...formData, avatarUrl: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-2 rounded-sm text-sm focus:outline-none focus:border-sky-500 transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Nome Completo</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 px-4 py-2 rounded-sm text-sm focus:outline-none focus:border-sky-500 transition-colors"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Peso Atual (kg)</label>
                <input
                  type="number"
                  value={formData.weight}
                  onChange={e => setFormData({ ...formData, weight: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-2 rounded-sm text-sm focus:outline-none focus:border-sky-500 transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Meta Proteica (g/dia)</label>
                <input
                  type="number"
                  value={formData.proteinTarget}
                  onChange={e => setFormData({ ...formData, proteinTarget: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-2 rounded-sm text-sm focus:outline-none focus:border-sky-500 transition-colors"
                  required
                />
              </div>
            </div>
            <div>
               <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Objetivo Base</label>
               <select 
                 value={formData.goal}
                 onChange={e => setFormData({ ...formData, goal: e.target.value as any })}
                 className="w-full bg-slate-50 border border-slate-200 px-4 py-2 rounded-sm text-sm focus:outline-none focus:border-sky-500 transition-colors"
               >
                 <option value="muscle_gain">Hipertrofia</option>
                 <option value="performance">Performance</option>
                 <option value="weight_loss">Redução Percentual</option>
               </select>
            </div>
            <div>
               <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Nível de Atividade</label>
               <select 
                 value={formData.activityLevel}
                 onChange={e => setFormData({ ...formData, activityLevel: e.target.value as any })}
                 className="w-full bg-slate-50 border border-slate-200 px-4 py-2 rounded-sm text-sm focus:outline-none focus:border-sky-500 transition-colors"
               >
                 <option value="sedentary">Sedentário (Base)</option>
                 <option value="active">Ativo (Intermediário)</option>
                 <option value="athlete">Atleta (Elite)</option>
               </select>
            </div>
          </div>
          <button 
            type="submit"
            disabled={saving}
            className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-700 text-white font-black italic uppercase tracking-[0.2em] py-3 rounded-sm transition-all"
          >
            {saving ? 'Sincronizando...' : 'Atualizar Bio-Métrica'}
          </button>
        </form>
        <button 
          onClick={onSignOut}
          className="w-full mt-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 font-black italic uppercase tracking-[0.2em] py-3 rounded-sm transition-all"
        >
          Encerrar Sessão
        </button>
      </div>
    </div>
  );
};

const DashboardView = ({ profile, entries, user, onEntryAdded }: { profile: UserProfile, entries: NutritionEntry[], user: any, onEntryAdded: () => void }) => {
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [addingEntry, setAddingEntry] = useState(false);
  const [newEntry, setNewEntry] = useState({ protein: 0, calories: 0, label: 'Almoço', date: 'Hoje' });

  useEffect(() => {
    const fetchRec = async () => {
      setLoading(true);
      const rec = await getNutritionRecommendation(profile, 'Endurance Run Z3', '08:00');
      setRecommendation(rec);
      setLoading(false);
    };
    fetchRec();
  }, [profile]);

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingEntry(true);
    const success = await api.addNutritionEntry(user.id, {
      ...newEntry,
      type: 'meal'
    });
    if (success) {
      onEntryAdded();
      setNewEntry({ protein: 0, calories: 0, label: 'Almoço', date: 'Hoje' });
    }
    setAddingEntry(false);
  };

  return (
    <div className="grid grid-cols-12 gap-8">
      {/* Nutritional Evolution */}
      <div className="col-span-12 lg:col-span-8 flex flex-col gap-8">
        <div className="bg-white border border-slate-200 p-8 rounded-sm shadow-sm flex flex-col h-full">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-lg font-bold text-slate-800 uppercase tracking-tight italic">Evolução Proteica</h2>
              <p className="text-sm text-slate-500 font-mono">Meta diária: {profile.proteinTarget}g (2.5g/kg)</p>
            </div>
            <div className="flex gap-2">
              {entries.map(e => (
                <span key={e.id} className={`text-[10px] font-bold ${e.date === 'Dom' ? 'text-slate-900 underline' : 'text-slate-300'} uppercase tracking-tight`}>
                  {e.date}
                </span>
              ))}
            </div>
          </div>
          
          <div className="h-64 w-full">
             {entries.length > 0 ? (
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={entries}>
                   <defs>
                     <linearGradient id="colorProtein" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.1}/>
                       <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0}/>
                     </linearGradient>
                   </defs>
                   <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                   <XAxis dataKey="date" hide />
                   <YAxis hide />
                   <Tooltip 
                     contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '2px', fontSize: '10px' }}
                   />
                   <Area 
                     type="monotone" 
                     dataKey="protein" 
                     stroke="#0EA5E9" 
                     strokeWidth={3}
                     fillOpacity={1} 
                     fill="url(#colorProtein)" 
                   />
                 </AreaChart>
               </ResponsiveContainer>
             ) : (
               <div className="w-full h-full flex items-center justify-center border-2 border-dashed border-slate-100">
                 <p className="text-sm text-slate-400 font-mono italic">Gráfico indisponível. Adicione refeições abaixo.</p>
               </div>
             )}
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-4">Adicionar Refeição Rápida</h3>
            <form onSubmit={handleAddEntry} className="flex gap-4 flex-wrap md:flex-nowrap">
              <input 
                type="text" 
                placeholder="Rótulo (ex: Almoço)"
                value={newEntry.label}
                onChange={e => setNewEntry({...newEntry, label: e.target.value})}
                className="flex-1 min-w-[120px] bg-slate-50 border border-slate-200 px-3 py-2 text-xs rounded-sm focus:outline-none focus:border-sky-500"
                required
              />
              <input 
                type="text" 
                placeholder="Dia (ex: Seg)"
                value={newEntry.date}
                onChange={e => setNewEntry({...newEntry, date: e.target.value})}
                className="w-24 bg-slate-50 border border-slate-200 px-3 py-2 text-xs rounded-sm focus:outline-none focus:border-sky-500"
                required
              />
              <input 
                type="number" 
                placeholder="Proteína (g)"
                value={newEntry.protein || ''}
                onChange={e => setNewEntry({...newEntry, protein: Number(e.target.value)})}
                className="w-28 bg-slate-50 border border-slate-200 px-3 py-2 text-xs rounded-sm focus:outline-none focus:border-sky-500"
                required
              />
              <input 
                type="number" 
                placeholder="Calorias"
                value={newEntry.calories || ''}
                onChange={e => setNewEntry({...newEntry, calories: Number(e.target.value)})}
                className="w-28 bg-slate-50 border border-slate-200 px-3 py-2 text-xs rounded-sm focus:outline-none focus:border-sky-500"
                required
              />
              <button 
                type="submit" 
                disabled={addingEntry}
                className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-sm transition-colors"
               >
                 {addingEntry ? '...' : 'Salvar'}
               </button>
            </form>
          </div>
        </div>
      </div>

      {/* Recommendations & Stats */}
      <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
        <div className="bg-slate-900 text-white p-6 rounded-sm relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 p-3 opacity-20 text-4xl shrink-0">🤖</div>
          <h3 className="text-sky-400 font-bold text-[10px] uppercase tracking-[0.3em] mb-4">Vitalis AI Suggestion</h3>
          
          {loading ? (
             <div className="space-y-3 animate-pulse">
               <div className="h-4 bg-slate-800 rounded w-3/4"></div>
               <div className="h-20 bg-slate-800 rounded"></div>
             </div>
          ) : recommendation ? (
            <div className="space-y-4">
              <p className="text-sm leading-relaxed text-slate-300">
                Com base no seu perfil de <span className="text-white font-semibold italic underline decoration-sky-500">{profile.goal === 'muscle_gain' ? 'Hipertrofia' : 'Performance'}</span>, sugerimos:
              </p>
              <div className="bg-white/5 border border-white/10 p-4 rounded-sm">
                <p className="text-[10px] text-slate-400 mb-1 italic uppercase tracking-wider">Timing Ideal: Agora</p>
                <p className="font-bold text-sm tracking-tight mb-1">{recommendation.title}</p>
                <p className="text-[10px] text-sky-400 font-bold uppercase">{recommendation.scientificInsight}</p>
              </div>
            </div>
          ) : null}
        </div>

        <div className="bg-white border border-slate-200 p-6 rounded-sm shadow-sm flex-1">
          <h3 className="text-slate-800 font-bold text-[10px] uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">Status Bio-Métrico</h3>
          <div className="space-y-6">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Streak Semanal</p>
                <p className="text-lg font-bold text-slate-800 italic">12 DIAS</p>
              </div>
              <Flame className="w-5 h-5 text-orange-500" />
            </div>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Recuperação Zonal</p>
                <p className="text-lg font-bold text-emerald-600 italic">OTIMIZADA</p>
              </div>
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CoachView = ({ profile }: { profile: UserProfile }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg: ChatMessage = { role: 'user', content: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    const response = await chatWithVitalis(messages.map(m => ({ role: m.role, content: m.content })), input, profile);
    
    setMessages(prev => [...prev, { role: 'assistant', content: response, timestamp: Date.now() }]);
    setIsTyping(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-16rem)] bg-white border border-slate-200 p-4 md:p-8 rounded-sm shadow-sm">
      <header className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-sm bg-slate-900 flex items-center justify-center font-bold italic text-lg text-white">V</div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest italic text-slate-800">Vitalis Brain</h2>
            <p className="text-[10px] text-sky-600 font-bold uppercase tracking-[0.2em]">Sincronização Ativa</p>
          </div>
        </div>
        <div className="hidden sm:flex gap-2">
           <span className="px-2 py-1 bg-slate-50 border border-slate-100 rounded text-[9px] font-bold uppercase text-slate-500">GPT-4 Turbo optimized</span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center text-center px-8">
            <div className="space-y-4 max-w-sm">
              <MessageSquare className="w-10 h-10 text-slate-100 mx-auto" />
              <p className="text-slate-400 text-xs italic leading-relaxed">
                "A bioquímica da excelência começa com a dúvida correta. O que vamos otimizar hoje?"
              </p>
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={i} 
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] md:max-w-md p-4 rounded-sm ${
              m.role === 'user' 
                ? 'bg-sky-600 text-white font-medium text-sm' 
                : 'bg-slate-50 border border-slate-100 text-slate-700 text-sm leading-relaxed italic'
            }`}>
              <p>{m.content}</p>
            </div>
          </motion.div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-slate-50 border border-slate-100 p-3 rounded-sm italic flex gap-1 items-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Processando</span>
              <div className="w-1 h-1 bg-slate-300 rounded-full animate-bounce" />
              <div className="w-1 h-1 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]" />
              <div className="w-1 h-1 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 flex gap-2">
        <input 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Dúvida técnica ou nutricional..."
          className="flex-1 bg-slate-50 border border-slate-200 px-4 py-3 rounded-sm focus:outline-none focus:border-sky-500 transition-colors uppercase font-bold tracking-widest text-[10px]"
        />
        <button 
          onClick={handleSend}
          className="bg-slate-900 px-6 py-3 rounded-sm text-white font-bold uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-colors shrink-0 italic"
        >
          Enviar
        </button>
      </div>
    </div>
  );
};

const StoreView = ({ profile }: { profile: UserProfile }) => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const data = await api.getProducts();
      setProducts(data);
      setLoading(false);
    };
    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-64 bg-slate-100 rounded-sm"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="relative h-48 md:h-56 flex items-center p-8 bg-slate-900 text-white rounded-sm overflow-hidden shadow-2xl">
        <div className="relative z-10 space-y-4 max-w-xl">
          <div className="inline-block px-3 py-1 bg-sky-500 text-[10px] font-black uppercase tracking-[0.4em]">Fidelity Cycle</div>
          <h2 className="text-2xl md:text-4xl font-bold italic tracking-tighter uppercase leading-tight">Previsibilidade <br/> Metabólica Ativa</h2>
          <p className="text-slate-400 text-xs font-medium">Sua conta @{profile.name.split(' ')[0].toLowerCase()} possui 10% de desconto recorrente aplicado via Bio-Fidelity.</p>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-sky-500/10 to-transparent pointer-events-none" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {products.map((p) => (
          <div key={p.id} className="bg-white border border-slate-200 p-8 rounded-sm group hover:border-sky-500 transition-all shadow-sm">
            <span className="text-[10px] font-bold text-sky-600 uppercase tracking-widest">{p.tag}</span>
            <h3 className="text-lg font-bold mt-2 uppercase italic tracking-tighter text-slate-800">{p.name}</h3>
            <p className="text-xs text-slate-500 mt-4 leading-relaxed font-medium">{p.info}</p>
            
            <div className="mt-8 pt-8 border-t border-slate-100 flex justify-between items-end">
              <div>
                <p className="text-2xl font-bold text-slate-900 tracking-tight">${p.price.toFixed(2)}</p>
                <p className="text-[9px] text-slate-400 font-mono italic">Fidelity Price: ${(p.price * 0.9).toFixed(2)}</p>
              </div>
              <button className="w-10 h-10 border border-slate-200 flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all rounded-sm">
                <ShoppingCart className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const CommunityView = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [feed, setFeed] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCommunityData = async () => {
      setLoading(true);
      const [reviewsData, feedData] = await Promise.all([
        api.getReviews(),
        api.getFeedEvents()
      ]);
      setReviews(reviewsData);
      setFeed(feedData);
      setLoading(false);
    };
    fetchCommunityData();
  }, []);

  return (
    <div className="grid grid-cols-12 gap-8 h-full">
      <div className="col-span-12 lg:col-span-8 space-y-6">
        <h3 className="text-[10px] uppercase font-bold tracking-[0.3em] text-slate-400 border-b border-slate-100 pb-2">Diferenciais Validados</h3>
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
            <div className="h-40 bg-slate-100 rounded-sm"></div>
            <div className="h-40 bg-slate-100 rounded-sm"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map(r => (
              <div key={r.id} className="p-6 bg-white border border-slate-200 rounded-sm shadow-sm hover:shadow-md transition-shadow relative">
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-3 h-3 ${i < r.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-100'}`} />
                  ))}
                </div>
                <p className="text-xs italic text-slate-600 leading-relaxed mb-6 font-medium">"{r.comment}"</p>
                <div className="flex justify-between items-center text-[9px] font-bold border-t border-slate-50 pt-4">
                  <span className="uppercase text-sky-600 tracking-widest">Atleta: {r.userName}</span>
                  <span className="uppercase text-slate-400 tracking-widest bg-slate-50 px-2 py-0.5 rounded-sm">{r.productName}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="col-span-12 lg:col-span-4 h-full">
        <div className="p-8 bg-slate-900 text-white rounded-sm h-full shadow-lg">
          <h3 className="text-base font-bold uppercase italic tracking-tighter mb-8 border-b border-white/10 pb-4">Performance Feed</h3>
          <div className="space-y-10">
            {loading ? (
              [1, 2, 3].map(i => <div key={i} className="h-10 bg-white/5 rounded-sm animate-pulse"></div>)
            ) : feed.length > 0 ? (
              feed.map((event, i) => (
                <div key={event.id || i} className="flex gap-4">
                  <div className="w-1 bg-sky-500 rounded-full h-auto" />
                  <div className="space-y-1">
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-sky-400">
                      {event.created_at ? new Date(event.created_at).toLocaleTimeString() : `Há ${i * 2} horas`}
                    </p>
                    <p className="text-xs font-medium text-slate-300">{event.content || event.description}</p>
                  </div>
                </div>
              ))
            ) : (
                <p className="text-xs text-slate-500 italic">Nenhuma atividade recente.</p>
            )}
          </div>
          <button className="w-full mt-12 py-3 bg-white text-slate-900 rounded-sm uppercase font-black tracking-widest text-[10px] hover:bg-slate-100 transition-all italic">
            Participar da Elite
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [entries, setEntries] = useState<NutritionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const supabase = getSupabase();
    
    // Test connection to DB
    api.getProducts().then(products => {
      console.log('Supabase Connection Test (Products):', products.length > 0 ? 'SUCCESS' : 'EMPTY OR ERROR');
    });

    // Check session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      const [profileData, entriesData] = await Promise.all([
        api.getProfile(user.id),
        api.getNutritionEntries(user.id)
      ]);

      if (profileData) {
        setProfile(profileData);
      } else {
        // Fallback or default initial profile if not found in DB
        const newProfile = {
          id: user.id,
          name: user.email?.split('@')[0] || 'Atleta Performance',
          email: user.email,
          goal: 'muscle_gain' as any,
          weight: 80,
          activityLevel: 'athlete' as any,
          proteinTarget: 200,
          isSubscribed: true
        };
        await api.createProfile(newProfile);
        setProfile(newProfile);
      }
      
      setEntries(entriesData);
      setLoading(false);
    };

    fetchData();
  }, [user]);

  const handleSignOut = async () => {
    const supabase = getSupabase();
    await supabase.auth.signOut();
  };

  if (loading || (!profile && user)) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-900 text-white italic font-bold">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-sky-500 rounded-sm flex items-center justify-center animate-pulse">V</div>
          <span className="tracking-[0.5em] uppercase text-xs">Sincronizando Bio-Métrica...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthComponent onAuthSuccess={() => {}} />;
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
      {/* Sidebar Navigation */}
      <aside className="hidden md:flex w-64 bg-slate-900 text-white flex-col border-r border-slate-800 shrink-0">
        <div className="p-8 flex-1">
          <div className="flex items-center gap-2 mb-10">
            <div className="w-8 h-8 bg-sky-500 rounded-sm flex items-center justify-center font-bold text-xl">V</div>
            <span className="text-xl font-bold tracking-tight uppercase">Vitalis <span className="text-sky-500">Bio</span></span>
          </div>
          <nav className="space-y-1">
            {[
              { id: 'dashboard', icon: Activity, label: 'Dashboard' },
              { id: 'coach', icon: MessageSquare, label: 'Bio-Algoritmo' },
              { id: 'store', icon: ShoppingCart, label: 'Assinaturas' },
              { id: 'community', icon: Users, label: 'Comunidade' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-200 ${
                  activeTab === tab.id 
                    ? 'bg-sky-500/10 text-sky-400 border-l-2 border-sky-500 font-medium' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'opacity-100' : 'opacity-50'}`} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-6 bg-slate-950/50 border-t border-slate-800">
          <div className="mb-4">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1 font-bold">Ciclo de Fidelidade</p>
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold">Status: Ativo</span>
              <span className="text-xs text-sky-400">-10% aplicado</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 mt-2 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '75%' }}
                className="bg-sky-500 h-full"
              />
            </div>
          </div>
          <div className="flex items-center gap-3 relative">
            <button 
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold ring-2 ring-transparent hover:ring-sky-500 transition-all overflow-hidden"
            >
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                profile.name?.substring(0, 2).toUpperCase() || '?'
              )}
            </button>
            <div className="text-xs">
              <p className="font-medium text-slate-100">{profile.name}</p>
              <div className="flex items-center gap-2">
                <p className="text-slate-500">Elite Performance</p>
              </div>
            </div>

            <AnimatePresence>
              {showUserMenu && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute bottom-12 left-0 w-48 bg-slate-800 border border-slate-700 rounded-sm shadow-xl py-2 z-50 origin-bottom-left"
                >
                  <button 
                    onClick={() => { setActiveTab('profile'); setShowUserMenu(false); }}
                    className="w-full text-left px-4 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 hover:text-sky-400 transition-colors uppercase tracking-wider"
                  >
                    Editar Perfil
                  </button>
                  <div className="h-px bg-slate-700 my-1" />
                  <button 
                    onClick={() => { handleSignOut(); setShowUserMenu(false); }}
                    className="w-full text-left px-4 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 hover:text-red-400 transition-colors uppercase tracking-wider flex items-center gap-2"
                  >
                    <LogOut className="w-3 h-3" />
                    Sair
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 relative h-screen">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-6 md:px-10 shrink-0">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">Performance Digital</h1>
            <p className="text-[10px] md:text-sm text-slate-500">
              Sincronizado com <strong className="text-slate-700">Garmin Forerunner 955</strong>
            </p>
          </div>
          <div className="flex items-center gap-4 md:gap-6">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Último Treino</span>
              <span className="text-xs md:text-sm font-semibold">12km Corrida (Z3)</span>
            </div>
            <div className="hidden sm:block w-[1px] h-8 bg-slate-200"></div>
            <button className="bg-sky-600 hover:bg-sky-700 text-white px-4 md:px-5 py-2 md:py-2.5 rounded-sm font-bold text-xs md:text-sm tracking-wide transition-all shadow-lg shadow-sky-900/10 uppercase italic">
              Otimizar Agora
            </button>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-4 md:p-10 custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'dashboard' && <DashboardView profile={profile} entries={entries} user={user} onEntryAdded={() => {
                api.getNutritionEntries(user.id).then(setEntries);
              }} />}
              {activeTab === 'coach' && <CoachView profile={profile} />}
              {activeTab === 'store' && <StoreView profile={profile} />}
              {activeTab === 'community' && <CommunityView />}
              {activeTab === 'profile' && <ProfileView profile={profile} user={user} onUpdate={setProfile} onSignOut={handleSignOut} />}
            </motion.div>
          </AnimatePresence>
        </section>

        {/* Mobile Navigation */}
        <nav className="md:hidden h-16 bg-white border-t border-slate-200 flex justify-around items-center shrink-0">
          {[
            { id: 'dashboard', icon: Activity },
            { id: 'coach', icon: MessageSquare },
            { id: 'store', icon: ShoppingCart },
            { id: 'community', icon: Users },
            { id: 'profile', icon: User },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => tab.action ? tab.action() : setActiveTab(tab.id)}
              className={`p-2 transition-colors ${activeTab === tab.id ? 'text-sky-600' : 'text-slate-400'} ${tab.id === 'logout' ? 'text-red-400' : ''}`}
            >
              <tab.icon className="w-6 h-6" />
            </button>
          ))}
        </nav>
      </main>

      {/* Decorative Background Mesh */}
      <div className="fixed inset-0 pointer-events-none data-grid opacity-10 -z-10" />
    </div>
  );
}
