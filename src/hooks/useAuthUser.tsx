import { useState, useEffect } from 'react';


export interface UserData {
    id: number;
    created: Date;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
}

export default function useAuthUser() {
    const [isUserAdmin, setIsUserAdmin] = useState<boolean>(false);
    const [userData, setUserData] = useState<UserData | null>(null);
    useEffect(() => {
        fetch('/api/login', { credentials: 'include' })
            .then(res => res.ok ? res.json() : null)
            .then(json => {
                if (json && !json.error) {
                    if (json.role === 'admin') {
                        setIsUserAdmin(true);
                        setUserData(json);
                    }
                    else {
                        setIsUserAdmin(false);
                        setUserData(json);
                    }
                }
            })
            .catch(err => {
                console.error('Fetch error:', err);
            });
    }, []);

    return { isUserAdmin, userData };
}