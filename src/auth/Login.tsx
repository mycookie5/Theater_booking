import { useState } from 'react';
import { Row, Col, Form, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

Login.route = {
    path: '/login',
    menuLabel: 'Login',
    index: 10
};

export default function Login() {

    const navigate = useNavigate();

    const [error, setError] = useState('');

    const [loginCreds, setLoginCreds] = useState({
        email: '',
        password: ''
    });

    function setProperty(event: React.ChangeEvent) {
        let { name, value }: { name: string, value: string | number | null; } =
            event.target as HTMLInputElement;
        setLoginCreds({ ...loginCreds, [name]: value });
    }

    async function send(event: React.FormEvent) {
        // prevent page reload (default browser behavior) on submit
        event.preventDefault();
        // send login credentials to correct rest route and look at the result
        const result = await (await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(loginCreds)
        })).json();
        if (result.error) {
            setError('Something went wrong try again!');
            setLoginCreds({ email: '', password: '' });
        }
        else {
            (globalThis as any).setUser(result);
            navigate('/');
        }
    }

    return <Row>
        <Col>
            <Form onSubmit={send}>
                {error ? <p className="text-danger">{error}</p> : ''}
                <Form.Group>
                    <Form.Label className="d-block">
                        <p className="mb-1">Email</p>
                        <Form.Control
                            onChange={setProperty}
                            type="email"
                            name="email"
                            placeholder="Email"
                            required
                        />
                    </Form.Label>
                </Form.Group>
                <Form.Group>
                    <Form.Label className="d-block">
                        <p className="mb-1">Password</p>
                        <Form.Control
                            onChange={setProperty}
                            type="password"
                            name="password"
                            placeholder="Password"
                            required
                            minLength={8}
                        />
                    </Form.Label>
                </Form.Group>
                <Button type="submit" className="mt-4 float-end">Login</Button>
            </Form>
        </Col>
    </Row>;
}