import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

Logout.route = {
    path: '/logout',
    menuLabel: 'Logout',
    index: 11
};

export default function Logout() {
    const navigate = useNavigate();
    useEffect(() => {
        (async () => {
            await fetch('/api/login', { method: 'DELETE' });
            (globalThis as any).setUser({});
            navigate('/');
        })();
    }, []);
    return null;
}