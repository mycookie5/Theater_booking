import { useState } from 'react';
import { Row, Col, Form, Button, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

Register.route = {
    path: '/register',
    menuLabel: 'Register',
    index: 10
};

export default function Register() {
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [registerCreds, setRegisterCreds] = useState({
        email: '',
        password: '',
        passwordRepeat: '',
        firstName: '',
        lastName: ''
    });

    function setProperty(event: React.ChangeEvent) {
        const { name, value } = event.target as HTMLInputElement;
        setRegisterCreds({ ...registerCreds, [name]: value });
    }

    async function send(event: React.FormEvent) {
        event.preventDefault();
        setError('');
        setSuccess('');

        // Validate passwords match
        if (registerCreds.password !== registerCreds.passwordRepeat) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);
        try {
            const result = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    email: registerCreds.email,
                    password: registerCreds.password,
                    firstName: registerCreds.firstName,
                    lastName: registerCreds.lastName
                })
            });

            const data = await result.json();

            if (data.error) {
                setError(data.error || 'Something went wrong, try again!');
            } else {
                setSuccess('Registered successfully!');
                // Set user in global state if available
                if ((globalThis as any).setUser) {
                    (globalThis as any).setUser(data);
                }
                // Navigate to home after short delay to show success message
                setTimeout(() => navigate('/'), 1000);
            }
        } catch (err) {
            setError('Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <Row>
            <Col>
                <Form onSubmit={send}>
                    <Form.Group className="mb-3">
                        <Form.Label>Email</Form.Label>
                        <Form.Control
                            onChange={setProperty}
                            type="email"
                            name="email"
                            value={registerCreds.email}
                            placeholder="Email"
                            required
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>First Name</Form.Label>
                        <Form.Control
                            onChange={setProperty}
                            type="text"
                            name="firstName"
                            value={registerCreds.firstName}
                            placeholder="First Name"
                            required
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Last Name</Form.Label>
                        <Form.Control
                            onChange={setProperty}
                            type="text"
                            name="lastName"
                            value={registerCreds.lastName}
                            placeholder="Last Name"
                            required
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Password</Form.Label>
                        <Form.Control
                            onChange={setProperty}
                            type="password"
                            name="password"
                            value={registerCreds.password}
                            placeholder="Password"
                            required
                            minLength={8}
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Repeat Password</Form.Label>
                        <Form.Control
                            onChange={setProperty}
                            type="password"
                            name="passwordRepeat"
                            value={registerCreds.passwordRepeat}
                            placeholder="Repeat Password"
                            required
                            minLength={8}
                        />
                    </Form.Group>

                    <Button
                        variant="success"
                        type="submit"
                        disabled={loading}
                        className="mt-2"
                    >
                        {loading ? 'Registering...' : 'Register'}
                    </Button>
                </Form>

                {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
                {success && <Alert variant="success" className="mt-3">{success}</Alert>}
            </Col>
        </Row>
    );
}