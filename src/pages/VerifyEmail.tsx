import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import AuthShell from '../components/layout/AuthShell';
import { useAuth } from '../context/AuthContext';
import { api, ApiError } from '../lib/api';
import { useSeo } from '../lib/seo';

type State = 'loading' | 'success' | 'error';

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const { isAuthenticated, refresh } = useAuth();

  const [state, setState] = useState<State>('loading');
  const [message, setMessage] = useState('Vérification en cours…');
  const done = useRef(false);

  useSeo({
    title: 'Confirmation d’email — TogoSaaS',
    description: 'Confirmez votre adresse email pour sécuriser votre compte TogoSaaS.',
    path: '/verifier-email',
    noIndex: true,
  });

  useEffect(() => {
    if (done.current) return;
    done.current = true;

    if (!token) {
      setState('error');
      setMessage('Lien de confirmation invalide ou incomplet.');
      return;
    }

    api
      .verifyEmail(token)
      .then((res) => {
        setState('success');
        setMessage(res.message || 'Votre adresse email est confirmée.');
        if (isAuthenticated) refresh();
      })
      .catch((err) => {
        setState('error');
        setMessage(err instanceof ApiError ? err.message : 'La confirmation a échoué.');
      });
  }, [token, isAuthenticated, refresh]);

  return (
    <AuthShell title="Confirmation d’email" subtitle="Validation de votre adresse email">
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        {state === 'loading' && <Loader2 className="h-12 w-12 animate-spin text-togo-green" />}
        {state === 'success' && <CheckCircle2 className="h-12 w-12 text-togo-green" />}
        {state === 'error' && <XCircle className="h-12 w-12 text-togo-red" />}

        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{message}</p>

        <div className="mt-2 flex flex-col gap-2">
          <Link
            to={isAuthenticated ? '/espace-lead' : '/connexion'}
            className="rounded-2xl bg-togo-green px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-togo-green-dark"
          >
            {isAuthenticated ? 'Aller à mon espace' : 'Se connecter'}
          </Link>
          <Link
            to="/solutions"
            className="text-sm font-semibold text-togo-green hover:underline dark:text-togo-yellow"
          >
            Explorer les solutions
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}
