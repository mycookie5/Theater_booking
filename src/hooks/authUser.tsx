import { useState, useEffect } from 'react';

export default function authUser() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userData, setUserData] = useState(null);
    useEffect(() => {
        fetch('/api/login', { credentials: 'include' })
            .then(res => res.ok ? res.json() : null)
            .then(json => {
                if (json && !json.error) {
                    if (json.role === 'admin' || json.role === 'user') {
                        setIsLoggedIn(true);
                        setUserData(json);
                    } else {
                        setIsLoggedIn(false);
                        setUserData(null);
                    }
                }
            })
            .catch(err => {
                console.error('Fetch error:', err);
            });
    }, []);

    return { isLoggedIn, userData };
}