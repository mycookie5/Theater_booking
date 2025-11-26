import { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Modal } from 'react-bootstrap';
import authUser from '../hooks/authUser';

Admin.route = {
    path: '/admin',
    menuLabel: 'Admin',
    index: 10
};

export default function Admin() {
    const { isUserAdmin } = authUser();

    // Event form state
    const [opponent, setOpponent] = useState('');
    const [eventDate, setEventDate] = useState('');
    const homeAway = 'Home'; // Always Home, cannot be changed

    // UI state
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [createdEventId, setCreatedEventId] = useState<number | null>(null);

    // Generate all sections
    const generateSections = (): string[] => {
        const sections: string[] = [];
        // A sections: A1-A20
        for (let i = 1; i <= 20; i++) {
            sections.push(`A${i}`);
        }
        // B sections: B1-B24
        for (let i = 1; i <= 24; i++) {
            sections.push(`B${i}`);
        }
        return sections;
    };

    const allSections = generateSections();

    // Get default values
    const getDefaultSeats = (section: string): number => {
        return section.startsWith('A') ? 1000 : 2000;
    };

    const getDefaultPrice = (section: string): number => {
        return section.startsWith('A') ? 499 : 399;
    };

    // Reset form
    const resetForm = () => {
        setOpponent('');
        setEventDate('');
        setError(null);
    };

    // Helper function to safely parse JSON response
    const parseResponse = async (response: Response, context: string) => {
        const contentType = response.headers.get('content-type');

        if (!response.ok) {
            const text = await response.text();
            console.error(`${context} failed:`, text);
            throw new Error(`${context} failed with status ${response.status}`);
        }

        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error(`${context} returned non-JSON:`, text);
            throw new Error(`${context} did not return JSON. Got: ${contentType}`);
        }

        try {
            return await response.json();
        } catch (err) {
            console.error(`${context} JSON parse error:`, err);
            throw new Error(`${context}: Invalid JSON response`);
        }
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!opponent || !eventDate) {
            setError('Please fill in all required fields');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            console.log('Step 1: Creating event...');
            // Step 1: Create the event
            const eventResponse = await fetch('/api/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: eventDate,
                    Opponent: opponent,
                    Home_Away: homeAway
                })
            });

            const eventData = await parseResponse(eventResponse, 'Event creation');
            console.log('Full event response:', eventData);

            // Try different possible ID field names
            const eventId = eventData.id || eventData.ID || eventData.event_id || eventData.insertId;

            if (!eventId) {
                console.error('Event data structure:', eventData);
                throw new Error('Event created but no ID was returned. Response structure: ' + JSON.stringify(eventData));
            }

            console.log('Event created with ID:', eventId);
            setCreatedEventId(eventId);

            console.log('Step 2: Creating seats for all sections...');
            // Step 2: Create seats for all sections with default values
            const seatPromises = allSections.map(async (section) => {
                const totalSeats = getDefaultSeats(section);

                const seatResponse = await fetch('/api/seats', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        event_id: eventId,
                        total_seats: totalSeats,
                        section: section,
                        available_seats: totalSeats
                    })
                });

                return await parseResponse(seatResponse, `Seat creation for ${section}`);
            });

            const createdSeats = await Promise.all(seatPromises);
            console.log('All seats created:', createdSeats.length);
            console.log('Sample seat data:', createdSeats[0]);

            console.log('Step 3: Creating prices for all sections...');
            // Step 3: Create prices for all sections with default values
            const pricePromises = createdSeats.map(async (seat, index) => {
                const section = allSections[index];
                const price = getDefaultPrice(section);

                // Try different possible ID field names for seat
                const seatId = seat.id || seat.ID || seat.seat_id || seat.insertId;

                if (!seatId) {
                    console.error('Seat data structure:', seat);
                    throw new Error(`Seat created for ${section} but no ID was returned`);
                }

                const priceResponse = await fetch('/api/prices', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        event_id: eventId,
                        seat_id: seatId,
                        price: price
                    })
                });

                return await parseResponse(priceResponse, `Price creation for ${section}`);
            });

            await Promise.all(pricePromises);
            console.log('All prices created successfully');

            // Success!
            setShowSuccessModal(true);
            resetForm();

        } catch (err) {
            console.error('Error creating match:', err);
            setError(err instanceof Error ? err.message : 'Failed to create match');
        } finally {
            setLoading(false);
        }
    };

    if (!isUserAdmin) {
        return (
            <Container className="py-5">
                <Alert variant="danger">
                    <Alert.Heading>Access Denied</Alert.Heading>
                    <p>You do not have permission to view this page.</p>
                </Alert>
            </Container>
        );
    }

    return (
        <Container className="py-4">
            <h1 className="mb-4">Admin Panel - Create Match</h1>

            {error && (
                <Alert variant="danger" dismissible onClose={() => setError(null)}>
                    <strong>Error:</strong> {error}
                    <br />
                    <small>Check the browser console for more details.</small>
                </Alert>
            )}

            <Modal show={showSuccessModal} onHide={() => setShowSuccessModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Match Created Successfully!</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p className="mb-3">The match has been created with Event ID: <strong>{createdEventId}</strong></p>
                    <div className="bg-light p-3 rounded">
                        <h6 className="mb-2">Configuration Summary:</h6>
                        <ul className="mb-0">
                            <li>44 sections created (A1-A20, B1-B24)</li>
                            <li>A sections: 1,000 seats each at $499</li>
                            <li>B sections: 2,000 seats each at $399</li>
                        </ul>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="success" onClick={() => setShowSuccessModal(false)}>
                        OK
                    </Button>
                </Modal.Footer>
            </Modal>

            <Form onSubmit={handleSubmit}>
                {/* Event Details Section */}
                <Card className="mb-4 shadow-sm">
                    <Card.Header className="bg-primary text-white">
                        <h4 className="mb-0">Match Details</h4>
                    </Card.Header>
                    <Card.Body>
                        <Row>
                            <Col md={6} className="mb-3">
                                <Form.Group>
                                    <Form.Label>Opponent Team Name *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="e.g., Eagles FC"
                                        value={opponent}
                                        onChange={(e) => setOpponent(e.target.value)}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={3} className="mb-3">
                                <Form.Group>
                                    <Form.Label>Venue</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value="Home"
                                        readOnly
                                        disabled
                                        className="bg-light"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={3} className="mb-3">
                                <Form.Group>
                                    <Form.Label>Match Date *</Form.Label>
                                    <Form.Control
                                        type="date"
                                        value={eventDate}
                                        onChange={(e) => setEventDate(e.target.value)}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {/* Default Configuration Info */}
                <Card className="mb-4 shadow-sm">
                    <Card.Header className="bg-info text-white">
                        <h4 className="mb-0">Default Configuration</h4>
                    </Card.Header>
                    <Card.Body>
                        <Row>
                            <Col md={6}>
                                <h5 className="mb-3">Seating</h5>
                                <ul>
                                    <li>Section A (A1-A20): <strong>1,000 seats each</strong></li>
                                    <li>Section B (B1-B24): <strong>2,000 seats each</strong></li>
                                    <li>Total sections: <strong>44</strong></li>
                                    <li>Total capacity: <strong>68,000 seats</strong></li>
                                </ul>
                            </Col>
                            <Col md={6}>
                                <h5 className="mb-3">Pricing</h5>
                                <ul>
                                    <li>Section A (A1-A20): <strong>$499 per seat</strong></li>
                                    <li>Section B (B1-B24): <strong>$399 per seat</strong></li>
                                </ul>
                            </Col>
                        </Row>
                        <Alert variant="secondary" className="mb-0 mt-3">
                            <small>
                                <strong>Note:</strong> These default values will be automatically applied when you create the match.
                                All seats will initially be available for booking.
                            </small>
                        </Alert>
                    </Card.Body>
                </Card>

                {/* Action Buttons */}
                <Row>
                    <Col>
                        <Button
                            variant="primary"
                            type="submit"
                            size="lg"
                            disabled={loading}
                            className="me-2"
                        >
                            {loading ? 'Creating Match...' : 'Create Match'}
                        </Button>
                        <Button
                            variant="secondary"
                            size="lg"
                            onClick={resetForm}
                            disabled={loading}
                        >
                            Reset Form
                        </Button>
                    </Col>
                </Row>
            </Form>
        </Container>
    );
}