import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import otgLogo from '@/assets/logo.png';

export function LoginPage() {
    const { user, login, isLoading } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (user) {
        return <Navigate to="/" replace />;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            await login(email, password);
        } catch (err: any) {
            console.error('Login Error:', err);
            if (err.message === 'Network Error') {
                setError('Erro de conexão. Verifique se o servidor está online.');
            } else if (err.response?.status === 401) {
                setError('Email ou senha inválidos');
            } else if (err.response?.data?.error) {
                setError(err.response.data.error);
            } else {
                setError('Erro ao fazer login. Tente novamente.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-white">
                <div className="animate-spin h-8 w-8 border-4 border-slate-900 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="grid min-h-screen w-full lg:grid-cols-2">
            {/* Left Column - Form */}
            <div className="flex items-center justify-center bg-white p-8">
                <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
                    <div className="flex flex-col space-y-2 text-center">
                        <div className="mx-auto mb-4 h-12 flex items-center justify-center">
                            <img src={otgLogo} alt="Logo" className="h-full w-auto object-contain" />
                        </div>
                        <h1 className="text-2xl font-semibold tracking-tight">Bem-vindo de volta</h1>
                        <p className="text-sm text-slate-500">
                            Entre e acompanhe seus resultados
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                                {error}
                            </div>
                        )}
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="email">
                                Email
                            </label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="bg-slate-50 border-slate-200 focus:bg-white transition-colors h-11"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="password">
                                Senha
                            </label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pr-10 bg-slate-50 border-slate-200 focus:bg-white transition-colors h-11"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            <div className="flex justify-end">
                                <a href="#" className="text-xs font-medium text-slate-600 hover:text-slate-900">
                                    Esqueci minha senha
                                </a>
                            </div>
                        </div>
                        <Button
                            type="submit"
                            className="w-full bg-slate-950 hover:bg-slate-900 text-white h-11 font-medium"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Entrando...' : 'Entrar'}
                        </Button>
                    </form>
                </div>
            </div>

            {/* Right Column - Brand */}
            <div className="hidden bg-slate-950 lg:flex items-center justify-center overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-black z-0" />
                <div className="relative z-10 p-20 opacity-30">
                    <img src={otgLogo} alt="Logo Brand" className="w-[400px] h-auto grayscale brightness-200" />
                </div>
            </div>
        </div>
    );
}
