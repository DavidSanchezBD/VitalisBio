import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getSupabase } from '../lib/supabase';
import { api } from '../lib/api';
import { Zap, Mail, Lock, User, ArrowRight } from 'lucide-react';

export const AuthComponent = ({ onAuthSuccess }: { onAuthSuccess: () => void }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = getSupabase();

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) {
          if (error.message.toLowerCase().includes('rate limit')) {
            throw new Error('LIMITE EXCEDIDO. Vá no painel do Supabase > Authentication > Providers > Email e DESATIVE a opção "Confirm email" para testes.');
          }
          throw error;
        }
        
        // Se o usuário foi criado com sucesso no Auth, criamos o perfil no Banco
        if (data.user) {
          await api.createProfile({
            id: data.user.id,
            name: email.split('@')[0],
            goal: 'muscle_gain',
            weight: 80,
            activityLevel: 'athlete',
            proteinTarget: 160,
            isSubscribed: false
          });
        }
      }
      onAuthSuccess();
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro na autenticação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
      {/* Background Decors */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-sky-500 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500 blur-[120px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-sm shadow-2xl relative z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-sky-500 flex items-center justify-center rounded-sm mb-4">
            <Zap className="text-white w-6 h-6 fill-white" />
          </div>
          <h1 className="text-2xl font-black italic tracking-tighter text-white uppercase">Vitalis Bio</h1>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em] mt-1">High Performance Auth</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-6">
          <div className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="email"
                placeholder="EMAIL@ATHLETE.COM"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white px-10 py-3 rounded-sm text-xs font-bold tracking-widest focus:outline-none focus:border-sky-500 transition-colors uppercase"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="password"
                placeholder="PASSWORD"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white px-10 py-3 rounded-sm text-xs font-bold tracking-widest focus:outline-none focus:border-sky-500 transition-colors uppercase"
              />
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-red-500/10 border border-red-500/20 p-3 rounded-sm"
              >
                <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider text-center">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-sky-500 hover:bg-sky-400 disabled:bg-slate-700 text-white font-black italic uppercase tracking-[0.2em] py-4 flex items-center justify-center gap-2 transition-all rounded-sm group"
          >
            {loading ? 'SINCRONIZANDO...' : (
              <>
                {isLogin ? 'LOG IN' : 'SIGN UP'}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-[10px] font-bold text-slate-500 hover:text-sky-400 uppercase tracking-widest transition-colors underline decoration-slate-800 underline-offset-4"
          >
            {isLogin ? 'New Athlete? Join Vitalis' : 'Already an Athlete? Log In'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
