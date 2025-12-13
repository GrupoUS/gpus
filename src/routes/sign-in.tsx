import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useId, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export const Route = createFileRoute('/sign-in')({
	component: SignInPage,
});

function SignInPage() {
	const [isLogin, setIsLogin] = useState(true);
	const [showPassword, setShowPassword] = useState(false);
	const [isPending, setIsPending] = useState(false);
	const [formData, setFormData] = useState({
		name: '',
		email: '',
		password: '',
	});
	const navigate = useNavigate();
	const { toast } = useToast();
	const nameId = useId();
	const emailId = useId();
	const passwordId = useId();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsPending(true);

		try {
			// Simulate API call
			await new Promise((resolve) => setTimeout(resolve, 1500));

			// Redirect to dashboard on success
			void navigate({ to: '/dashboard' });

			toast({
				title: isLogin ? 'Login realizado' : 'Cadastro realizado',
				description: isLogin ? 'Bem-vindo de volta!' : 'Conta criada com sucesso!',
			});
		} catch (_error) {
			toast({
				variant: 'destructive',
				title: 'Erro',
				description: 'Ocorreu um erro. Tente novamente.',
			});
		} finally {
			setIsPending(false);
		}
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setFormData((prev) => ({
			...prev,
			[e.target.name]: e.target.value,
		}));
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-mesh bg-noise p-4 relative overflow-hidden">
			{/* Background effects */}
			<div className="absolute inset-0 pointer-events-none">
				<motion.div
					className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl"
					animate={{
						scale: [1, 1.2, 1],
						opacity: [0.3, 0.5, 0.3],
					}}
					transition={{
						duration: 8,
						repeat: Number.POSITIVE_INFINITY,
						ease: 'easeInOut',
					}}
				/>
				<motion.div
					className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-us-gold/10 rounded-full blur-3xl"
					animate={{
						scale: [1.2, 1, 1.2],
						opacity: [0.2, 0.4, 0.2],
					}}
					transition={{
						duration: 10,
						repeat: Number.POSITIVE_INFINITY,
						ease: 'easeInOut',
						delay: 1,
					}}
				/>
			</div>

			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.6 }}
				className="w-full max-w-md relative z-10"
			>
				<Card className="glass-card border-border shadow-2xl">
					<CardHeader className="text-center pb-6">
						{/* Logo */}
						<div className="flex justify-center mb-6">
							<div className="w-16 h-16 bg-gradient-to-br from-primary to-us-gold rounded-xl flex items-center justify-center shadow-lg">
								<span className="text-primary-foreground font-bold text-2xl font-display">GU</span>
							</div>
						</div>

						{/* Title */}
						<h1 className="font-display text-2xl font-bold text-us-gold mb-2">
							{isLogin ? 'Bem-vindo de volta' : 'Crie sua conta'}
						</h1>
						<p className="text-sm text-muted-foreground">
							{isLogin ? 'Entre para acessar seu painel' : 'Cadastre-se para começar sua jornada'}
						</p>
					</CardHeader>

					<CardContent>
						<form onSubmit={handleSubmit} className="space-y-4">
							{/* Name field - only for signup */}
							{!isLogin && (
								<motion.div
									initial={{ opacity: 0, height: 0 }}
									animate={{ opacity: 1, height: 'auto' }}
									exit={{ opacity: 0, height: 0 }}
									className="space-y-2"
								>
									<Label htmlFor={nameId} className="text-sm font-medium text-foreground">
										Nome Completo
									</Label>
									<Input
										id={nameId}
										name="name"
										type="text"
										value={formData.name}
										onChange={handleInputChange}
										placeholder="Seu nome completo"
										required={!isLogin}
										className="bg-muted border-border focus:border-primary focus:ring-primary/20"
										data-testid="input-name"
										disabled={isPending}
									/>
								</motion.div>
							)}

							{/* Email field */}
							<div className="space-y-2">
								<Label htmlFor={emailId} className="text-sm font-medium text-foreground">
									E-mail
								</Label>
								<Input
									id={emailId}
									name="email"
									type="email"
									value={formData.email}
									onChange={handleInputChange}
									placeholder="seu@email.com"
									required
									className="bg-muted border-border focus:border-primary focus:ring-primary/20"
									data-testid="input-email"
									disabled={isPending}
								/>
							</div>

							{/* Password field */}
							<div className="space-y-2">
								<Label htmlFor={passwordId} className="text-sm font-medium text-foreground">
									Senha
								</Label>
								<div className="relative">
									<Input
										id={passwordId}
										name="password"
										type={showPassword ? 'text' : 'password'}
										value={formData.password}
										onChange={handleInputChange}
										placeholder="•••••••••"
										required
										className="bg-muted border-border focus:border-primary focus:ring-primary/20 pr-10"
										data-testid="input-password"
										disabled={isPending}
									/>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
										onClick={() => setShowPassword(!showPassword)}
										disabled={isPending}
									>
										{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
									</Button>
								</div>
							</div>

							{/* Submit button */}
							<Button
								type="submit"
								size="lg"
								className="w-full h-12 bg-us-gold hover:bg-us-gold/90 text-black font-medium shadow-lg shadow-us-gold/20"
								disabled={isPending}
							>
								{isPending ? (
									<span className="flex items-center">
										<svg
											className="animate-spin h-4 w-4 mr-2"
											viewBox="0 0 24 24"
											role="img"
											aria-label="Loading"
										>
											<title>Loading</title>
											<circle
												className="opacity-25"
												cx="12"
												cy="12"
												r="10"
												stroke="currentColor"
												strokeWidth="4"
												fill="none"
											/>
											<path
												className="opacity-75"
												fill="currentColor"
												d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
											/>
										</svg>
										{isLogin ? 'Entrando...' : 'Cadastrando...'}
									</span>
								) : (
									<span className="flex items-center">
										{isLogin ? 'Entrar' : 'Cadastrar'}
										<ArrowRight className="ml-2 h-4 w-4" />
									</span>
								)}
							</Button>
						</form>

						{/* Toggle auth */}
						<div className="mt-6 text-center">
							<p className="text-sm text-muted-foreground">
								{isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}{' '}
								<Button
									variant="link"
									className="p-0 h-auto font-medium text-us-gold hover:text-us-gold/80"
									onClick={() => setIsLogin(!isLogin)}
								>
									{isLogin ? 'Cadastre-se' : 'Faça login'}
								</Button>
							</p>
						</div>
					</CardContent>
				</Card>
			</motion.div>
		</div>
	);
}
