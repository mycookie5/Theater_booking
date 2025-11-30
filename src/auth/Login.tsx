import { useState } from 'react';
import { Container, Row, Col, Form, Button, Card, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

Login.route = {
    path: '/login',
    menuLabel: 'Login',
    index: 10
};

export default function Login() {
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [loginCreds, setLoginCreds] = useState({
        email: '',
        password: ''
    });

    function setProperty(event: React.ChangeEvent) {
        let { name, value }: { name: string, value: string | number | null; } =
            event.target as HTMLInputElement;
        setLoginCreds({ ...loginCreds, [name]: value });
        setError(''); // Clear error when user types
    }

    async function send(event: React.FormEvent) {
        event.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await (await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(loginCreds)
            })).json();

            if (result.error) {
                setError('Invalid email or password. Please try again.');
                setLoginCreds({ email: '', password: '' });
            } else {
                (globalThis as any).setUser(result);
                navigate('/');
            }
        } catch (err) {
            setError('Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <Container fluid className="py-3 py-sm-4 py-md-5 px-2 px-sm-3 px-md-4">
            <Row className="justify-content-center">
                <Col xs={12} sm={10} md={8} lg={6} xl={5}>
                    <Card className="shadow-sm border-0">
                        <Card.Header className="bg-primary text-white p-3 p-sm-4 border-0">
                            <h3 className="mb-0 text-center fs-5 fs-sm-4">Login to Your Account</h3>
                        </Card.Header>
                        <Card.Body className="p-3 p-sm-4 p-md-5">
                            <Form onSubmit={send}>
                                {error && (
                                    <Alert variant="danger" dismissible onClose={() => setError('')} className="mb-3">
                                        <strong>Error:</strong> {error}
                                    </Alert>
                                )}

                                <Form.Group className="mb-3 mb-sm-4">
                                    <Form.Label className="fw-semibold small">Email Address</Form.Label>
                                    <Form.Control
                                        onChange={setProperty}
                                        type="email"
                                        name="email"
                                        value={loginCreds.email}
                                        placeholder="Enter your email"
                                        required
                                        disabled={loading}
                                        size="lg"
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3 mb-sm-4">
                                    <Form.Label className="fw-semibold small">Password</Form.Label>
                                    <Form.Control
                                        onChange={setProperty}
                                        type="password"
                                        name="password"
                                        value={loginCreds.password}
                                        placeholder="Enter your password"
                                        required
                                        minLength={8}
                                        disabled={loading}
                                        size="lg"
                                    />
                                    <Form.Text className="text-muted small">
                                        Must be at least 8 characters
                                    </Form.Text>
                                </Form.Group>

                                <div className="d-grid gap-2">
                                    <Button
                                        variant="primary"
                                        type="submit"
                                        disabled={loading}
                                        size="lg"
                                    >
                                        {loading ? (
                                            <>
                                                <Spinner
                                                    as="span"
                                                    animation="border"
                                                    size="sm"
                                                    role="status"
                                                    aria-hidden="true"
                                                    className="me-2"
                                                />
                                                Logging in...
                                            </>
                                        ) : (
                                            'Login'
                                        )}
                                    </Button>
                                </div>
                            </Form>

                            <div className="text-center mt-3 mt-sm-4 pt-3 border-top">
                                <p className="text-muted small mb-0">
                                    Don't have an account?{' '}
                                    <a href="/register" className="text-decoration-none fw-semibold">
                                        Register here
                                    </a>
                                </p>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}