import { useState } from 'react';
import { Container, Row, Col, Form, Button, Card, Alert, Spinner } from 'react-bootstrap';
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
        setError(''); // Clear error when user types
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
                setSuccess('Registration successful! Redirecting...');
                // Set user in global state if available
                if ((globalThis as any).setUser) {
                    (globalThis as any).setUser(data);
                }
                // Navigate to home after short delay to show success message
                setTimeout(() => navigate('/'), 1500);
            }
        } catch (err) {
            setError('Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <Container fluid className="py-3 py-sm-4 py-md-5 px-2 px-sm-3 px-md-4">
            <Row className="justify-content-center">
                <Col xs={12} sm={10} md={8} lg={6} xl={5}>
                    <Card className="shadow-sm border-0">
                        <Card.Header className="bg-success text-white p-3 p-sm-4 border-0">
                            <h3 className="mb-0 text-center fs-5 fs-sm-4">Create Your Account</h3>
                        </Card.Header>
                        <Card.Body className="p-3 p-sm-4 p-md-5">
                            {error && (
                                <Alert variant="danger" dismissible onClose={() => setError('')} className="mb-3">
                                    <strong>Error:</strong> {error}
                                </Alert>
                            )}

                            {success && (
                                <Alert variant="success" className="mb-3">
                                    <strong>Success!</strong> {success}
                                </Alert>
                            )}

                            <Form onSubmit={send}>
                                <Row className="g-2 g-sm-3">
                                    <Col xs={12} sm={6}>
                                        <Form.Group className="mb-2 mb-sm-3">
                                            <Form.Label className="fw-semibold small">First Name</Form.Label>
                                            <Form.Control
                                                onChange={setProperty}
                                                type="text"
                                                name="firstName"
                                                value={registerCreds.firstName}
                                                placeholder="First name"
                                                required
                                                disabled={loading}
                                                size="lg"
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col xs={12} sm={6}>
                                        <Form.Group className="mb-2 mb-sm-3">
                                            <Form.Label className="fw-semibold small">Last Name</Form.Label>
                                            <Form.Control
                                                onChange={setProperty}
                                                type="text"
                                                name="lastName"
                                                value={registerCreds.lastName}
                                                placeholder="Last name"
                                                required
                                                disabled={loading}
                                                size="lg"
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Form.Group className="mb-2 mb-sm-3">
                                    <Form.Label className="fw-semibold small">Email Address</Form.Label>
                                    <Form.Control
                                        onChange={setProperty}
                                        type="email"
                                        name="email"
                                        value={registerCreds.email}
                                        placeholder="Enter your email"
                                        required
                                        disabled={loading}
                                        size="lg"
                                    />
                                </Form.Group>

                                <Form.Group className="mb-2 mb-sm-3">
                                    <Form.Label className="fw-semibold small">Password</Form.Label>
                                    <Form.Control
                                        onChange={setProperty}
                                        type="password"
                                        name="password"
                                        value={registerCreds.password}
                                        placeholder="Create a password"
                                        required
                                        minLength={8}
                                        disabled={loading}
                                        size="lg"
                                    />
                                    <Form.Text className="text-muted small">
                                        Must be at least 8 characters
                                    </Form.Text>
                                </Form.Group>

                                <Form.Group className="mb-3 mb-sm-4">
                                    <Form.Label className="fw-semibold small">Confirm Password</Form.Label>
                                    <Form.Control
                                        onChange={setProperty}
                                        type="password"
                                        name="passwordRepeat"
                                        value={registerCreds.passwordRepeat}
                                        placeholder="Repeat your password"
                                        required
                                        minLength={8}
                                        disabled={loading}
                                        size="lg"
                                    />
                                </Form.Group>

                                <div className="d-grid gap-2">
                                    <Button
                                        variant="success"
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
                                                Creating account...
                                            </>
                                        ) : (
                                            'Register'
                                        )}
                                    </Button>
                                </div>
                            </Form>

                            <div className="text-center mt-3 mt-sm-4 pt-3 border-top">
                                <p className="text-muted small mb-0">
                                    Already have an account?{' '}
                                    <a href="/login" className="text-decoration-none fw-semibold">
                                        Login here
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