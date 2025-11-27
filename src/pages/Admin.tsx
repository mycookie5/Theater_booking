import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Modal, Tabs, Tab, Table, Badge, Spinner } from 'react-bootstrap';
import authUser from '../hooks/authUser';

Admin.route = {
    path: '/admin',
    menuLabel: 'Admin',
    index: 10
};

interface Event {
    id: number;
    date: string;
    Opponent: string;
    Home_Away: string;
}

interface Seat {
    id: number;
    event_id: number;
    section: string;
    total_seats: number;
    available_seats: number;
}

interface Price {
    id: number;
    event_id: number;
    seat_id: number;
    price: number;
}

export default function Admin() {
    const { isUserAdmin } = authUser();

    // Create Form States
    const [opponent, setOpponent] = useState('');
    const [eventDate, setEventDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [createdEventId, setCreatedEventId] = useState<number | null>(null);

    // Manage Events States
    const [activeTab, setActiveTab] = useState<string>('create');
    const [events, setEvents] = useState<Event[]>([]);
    const [loadingEvents, setLoadingEvents] = useState(false);

    // Edit States
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingEvent, setEditingEvent] = useState<Event | null>(null);
    const [editOpponent, setEditOpponent] = useState('');
    const [editEventDate, setEditEventDate] = useState('');
    const [editSeats, setEditSeats] = useState<Seat[]>([]);
    const [editPrices, setEditPrices] = useState<Price[]>([]);
    const [selectedSection, setSelectedSection] = useState('');
    const [sectionPrice, setSectionPrice] = useState('');
    const [loadingEdit, setLoadingEdit] = useState(false);
    const [editError, setEditError] = useState<string | null>(null);
    const [editSuccess, setEditSuccess] = useState(false);

    // Delete States
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingEvent, setDeletingEvent] = useState<Event | null>(null);
    const [loadingDelete, setLoadingDelete] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    // Load events when switching to manage tab
    useEffect(() => {
        if (activeTab === 'manage') {
            fetchEvents();
        }
    }, [activeTab]);

    // Generate sections A1-A20 and B1-B24
    const generateSections = (): string[] => {
        const sections: string[] = [];
        for (let i = 1; i <= 20; i++) {
            sections.push(`A${i}`);
        }
        for (let i = 1; i <= 24; i++) {
            sections.push(`B${i}`);
        }
        return sections;
    };

    // Get default seats count based on section (A=1000, B=2000)
    const getDefaultSeats = (section: string): number => {
        return section.startsWith('A') ? 1000 : 2000;
    };

    // Get default price based on section (A=399, B=499)
    const getDefaultPrice = (section: string): number => {
        return section.startsWith('A') ? 399 : 499;
    };

    const resetForm = () => {
        setOpponent('');
        setEventDate('');
        setError(null);
        setSuccess(false);
        setCreatedEventId(null);
    };

    // Fetch all events
    const fetchEvents = async () => {
        setLoadingEvents(true);
        try {
            const response = await fetch('/api/events');
            if (!response.ok) {
                throw new Error('Failed to fetch events');
            }
            const data = await response.json();
            // Filter only Home events
            const homeEvents = data.filter((event: Event) => event.Home_Away === 'Home');
            setEvents(homeEvents);
        } catch (err) {
            console.error('Error fetching events:', err);
        } finally {
            setLoadingEvents(false);
        }
    };

    // Format date for display
    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Create Event Handler
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!opponent || !eventDate) {
            setError('Please fill in all required fields');
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            // Step 1: Create the event
            console.log('Creating event...');
            const eventResponse = await fetch('/api/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: eventDate,
                    Opponent: opponent,
                    Home_Away: 'Home'
                })
            });

            if (!eventResponse.ok) {
                throw new Error(`Failed to create event: ${eventResponse.status}`);
            }

            const eventData = await eventResponse.json();
            const eventId = eventData.id || eventData.ID || eventData.event_id || eventData.insertId;

            if (!eventId) {
                throw new Error('Event created but no ID was returned');
            }

            console.log('Event created with ID:', eventId);
            setCreatedEventId(eventId);

            // Step 2: Create seats for all sections
            console.log('Creating seats...');
            const sections = generateSections();
            const seatIds: { [section: string]: number } = {};

            for (const section of sections) {
                const totalSeats = getDefaultSeats(section);

                const seatResponse = await fetch('/api/seats', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        event_id: eventId,
                        section: section,
                        total_seats: totalSeats,
                        available_seats: totalSeats
                    })
                });

                if (!seatResponse.ok) {
                    throw new Error(`Failed to create seat for section ${section}`);
                }

                const seatData = await seatResponse.json();
                const seatId = seatData.id || seatData.ID || seatData.seat_id || seatData.insertId;

                if (!seatId) {
                    throw new Error(`Seat created for section ${section} but no ID was returned`);
                }

                seatIds[section] = seatId;
                console.log(`Seat created for section ${section} with ID:`, seatId);
            }

            // Step 3: Create prices for all seats
            console.log('Creating prices...');
            for (const section of sections) {
                const seatId = seatIds[section];
                const price = getDefaultPrice(section);

                const priceResponse = await fetch('/api/price', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        event_id: eventId,
                        seat_id: seatId,
                        price: price
                    })
                });

                if (!priceResponse.ok) {
                    throw new Error(`Failed to create price for section ${section}`);
                }

                console.log(`Price created for section ${section}: $${price}`);
            }

            // Success!
            setSuccess(true);
            console.log('Event creation completed successfully!');

        } catch (err) {
            console.error('Error creating event:', err);
            setError(err instanceof Error ? err.message : 'An error occurred while creating the event');
        } finally {
            setLoading(false);
        }
    };

    // Edit Event Handlers
    const handleEditClick = async (event: Event) => {
        setEditingEvent(event);
        setEditOpponent(event.Opponent);
        setEditEventDate(event.date.split('T')[0]); // Format date for input
        setEditError(null);
        setEditSuccess(false);
        setSelectedSection('');
        setSectionPrice('');

        // Fetch seats and prices for this event
        try {
            const [seatsResponse, pricesResponse] = await Promise.all([
                fetch(`/api/seats?event_id=${event.id}`),
                fetch(`/api/price?event_id=${event.id}`)
            ]);

            if (seatsResponse.ok && pricesResponse.ok) {
                const seatsData = await seatsResponse.json();
                const pricesData = await pricesResponse.json();
                setEditSeats(seatsData);
                setEditPrices(pricesData);
            }
        } catch (err) {
            console.error('Error fetching event details:', err);
        }

        setShowEditModal(true);
    };

    const handleSectionChange = (section: string) => {
        setSelectedSection(section);
        // Find the seat for this section
        const seat = editSeats.find(s => s.section === section);
        if (seat) {
            // Find the price for this seat
            const price = editPrices.find(p => p.seat_id === seat.id);
            if (price) {
                setSectionPrice(price.price.toString());
            }
        }
    };

    const handleUpdateEvent = async () => {
        if (!editingEvent) return;

        setLoadingEdit(true);
        setEditError(null);
        setEditSuccess(false);

        try {
            // Update event basic info
            const eventResponse = await fetch(`/api/events/${editingEvent.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: editEventDate,
                    Opponent: editOpponent,
                    Home_Away: 'Home'
                })
            });

            if (!eventResponse.ok) {
                throw new Error('Failed to update event');
            }

            // Update price if a section is selected and price is changed
            if (selectedSection && sectionPrice) {
                const seat = editSeats.find(s => s.section === selectedSection);
                if (seat) {
                    const price = editPrices.find(p => p.seat_id === seat.id);
                    if (price) {
                        const priceResponse = await fetch(`/api/price/${price.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                price: parseFloat(sectionPrice)
                            })
                        });

                        if (!priceResponse.ok) {
                            throw new Error('Failed to update price');
                        }
                    }
                }
            }

            setEditSuccess(true);
            // Refresh events list
            fetchEvents();

            // Close modal after a short delay
            setTimeout(() => {
                setShowEditModal(false);
            }, 1500);

        } catch (err) {
            console.error('Error updating event:', err);
            setEditError(err instanceof Error ? err.message : 'Failed to update event');
        } finally {
            setLoadingEdit(false);
        }
    };

    // Delete Event Handlers
    const handleDeleteClick = (event: Event) => {
        setDeletingEvent(event);
        setDeleteError(null);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!deletingEvent) return;

        setLoadingDelete(true);
        setDeleteError(null);

        try {
            // Delete event (cascade should handle seats and prices)
            const response = await fetch(`/api/events/${deletingEvent.id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Failed to delete event');
            }

            // Refresh events list
            fetchEvents();
            setShowDeleteModal(false);

        } catch (err) {
            console.error('Error deleting event:', err);
            setDeleteError(err instanceof Error ? err.message : 'Failed to delete event');
        } finally {
            setLoadingDelete(false);
        }
    };

    if (!isUserAdmin) {
        return (
            <Container className="py-5">
                <Alert variant="danger">
                    <Alert.Heading>Access Denied</Alert.Heading>
                    <p>You do not have permission to access this page.</p>
                </Alert>
            </Container>
        );
    }

    return (
        <Container className="py-4">
            <h2 className="mb-4">Event Management</h2>

            <Tabs
                activeKey={activeTab}
                onSelect={(k) => setActiveTab(k || 'create')}
                className="mb-4"
            >
                {/* CREATE EVENT TAB */}
                <Tab eventKey="create" title="Create Event">
                    <Row className="justify-content-center">
                        <Col xs={12} lg={10} xl={8}>
                            <Card className="shadow">
                                <Card.Header className="bg-primary text-white">
                                    <h3 className="mb-0">Create New Event</h3>
                                </Card.Header>
                                <Card.Body className="p-4">
                                    {error && (
                                        <Alert variant="danger" dismissible onClose={() => setError(null)}>
                                            {error}
                                        </Alert>
                                    )}

                                    {success && (
                                        <Alert variant="success">
                                            <Alert.Heading>Success!</Alert.Heading>
                                            <p>Event created successfully with ID: {createdEventId}</p>
                                            <ul className="mb-0">
                                                <li>44 sections created (A1-A20, B1-B24)</li>
                                                <li>Total capacity: 68,000 seats</li>
                                                <li>All seats available for booking</li>
                                            </ul>
                                        </Alert>
                                    )}

                                    <Form onSubmit={handleSubmit}>
                                        <Row>
                                            <Col xs={12} md={6} className="mb-3">
                                                <Form.Group>
                                                    <Form.Label>Opponent Team *</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        placeholder="Enter opponent name"
                                                        value={opponent}
                                                        onChange={(e) => setOpponent(e.target.value)}
                                                        disabled={loading}
                                                        required
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col xs={12} md={6} className="mb-3">
                                                <Form.Group>
                                                    <Form.Label>Match Date *</Form.Label>
                                                    <Form.Control
                                                        type="date"
                                                        value={eventDate}
                                                        onChange={(e) => setEventDate(e.target.value)}
                                                        disabled={loading}
                                                        required
                                                    />
                                                </Form.Group>
                                            </Col>
                                        </Row>

                                        <Row className="mb-3">
                                            <Col xs={12} md={6}>
                                                <Form.Group>
                                                    <Form.Label>Home/Away</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        value="Home"
                                                        disabled
                                                        readOnly
                                                    />
                                                    <Form.Text className="text-muted">
                                                        Always set to Home (default)
                                                    </Form.Text>
                                                </Form.Group>
                                            </Col>
                                        </Row>

                                        <Card className="bg-light mb-4">
                                            <Card.Body>
                                                <h5 className="mb-3">Default Configuration</h5>
                                                <Row>
                                                    <Col xs={12} md={6} className="mb-3 mb-md-0">
                                                        <h6>Seating</h6>
                                                        <ul className="mb-0">
                                                            <li>Section A (A1-A20): 1,000 seats each</li>
                                                            <li>Section B (B1-B24): 2,000 seats each</li>
                                                            <li>Total: 68,000 seats</li>
                                                        </ul>
                                                    </Col>
                                                    <Col xs={12} md={6}>
                                                        <h6>Pricing</h6>
                                                        <ul className="mb-0">
                                                            <li>Section A (A1-A20): $399 per seat</li>
                                                            <li>Section B (B1-B24): $499 per seat</li>
                                                        </ul>
                                                    </Col>
                                                </Row>
                                            </Card.Body>
                                        </Card>

                                        <div className="d-grid gap-2 d-md-flex">
                                            <Button
                                                variant="primary"
                                                type="submit"
                                                disabled={loading}
                                                className="flex-md-grow-1"
                                            >
                                                {loading ? 'Creating Event...' : 'Create Event'}
                                            </Button>
                                            <Button
                                                variant="secondary"
                                                onClick={resetForm}
                                                disabled={loading}
                                                className="flex-md-grow-1"
                                            >
                                                Reset Form
                                            </Button>
                                        </div>
                                    </Form>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Tab>

                {/* MANAGE EVENTS TAB */}
                <Tab eventKey="manage" title="Manage Events">
                    <Card className="shadow">
                        <Card.Header className="bg-success text-white">
                            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2">
                                <h3 className="mb-0">All Home Events</h3>
                                <Button
                                    variant="light"
                                    size="sm"
                                    onClick={fetchEvents}
                                    disabled={loadingEvents}
                                >
                                    {loadingEvents ? 'Refreshing...' : 'Refresh'}
                                </Button>
                            </div>
                        </Card.Header>
                        <Card.Body className="p-3 p-md-4">
                            {loadingEvents ? (
                                <div className="text-center py-5">
                                    <Spinner animation="border" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </Spinner>
                                    <p className="mt-2">Loading events...</p>
                                </div>
                            ) : events.length === 0 ? (
                                <Alert variant="info">No home events found.</Alert>
                            ) : (
                                <div className="table-responsive">
                                    <Table striped bordered hover>
                                        <thead>
                                            <tr>
                                                <th className="d-none d-md-table-cell">ID</th>
                                                <th>Opponent</th>
                                                <th className="d-none d-lg-table-cell">Date</th>
                                                <th className="d-none d-sm-table-cell">Status</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {events.map(event => {
                                                const eventDate = new Date(event.date);
                                                const isPast = eventDate < new Date();
                                                return (
                                                    <tr key={event.id}>
                                                        <td className="d-none d-md-table-cell">{event.id}</td>
                                                        <td>
                                                            <strong className="d-block">{event.Opponent}</strong>
                                                            <small className="text-muted d-lg-none d-block">
                                                                {formatDate(event.date)}
                                                            </small>
                                                        </td>
                                                        <td className="d-none d-lg-table-cell">
                                                            {formatDate(event.date)}
                                                        </td>
                                                        <td className="d-none d-sm-table-cell">
                                                            {isPast ? (
                                                                <Badge bg="secondary">Past</Badge>
                                                            ) : (
                                                                <Badge bg="success">Upcoming</Badge>
                                                            )}
                                                        </td>
                                                        <td>
                                                            <div className="d-flex flex-column flex-sm-row gap-2">
                                                                <Button
                                                                    variant="warning"
                                                                    size="sm"
                                                                    onClick={() => handleEditClick(event)}
                                                                    className="w-100 w-sm-auto"
                                                                >
                                                                    Edit
                                                                </Button>
                                                                <Button
                                                                    variant="danger"
                                                                    size="sm"
                                                                    onClick={() => handleDeleteClick(event)}
                                                                    className="w-100 w-sm-auto"
                                                                >
                                                                    Delete
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </Table>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Tab>
            </Tabs>

            {/* EDIT EVENT MODAL */}
            <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Edit Event</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {editError && (
                        <Alert variant="danger" dismissible onClose={() => setEditError(null)}>
                            {editError}
                        </Alert>
                    )}

                    {editSuccess && (
                        <Alert variant="success">
                            Event updated successfully!
                        </Alert>
                    )}

                    <Form>
                        <Row>
                            <Col xs={12} md={6} className="mb-3">
                                <Form.Group>
                                    <Form.Label>Opponent Team</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={editOpponent}
                                        onChange={(e) => setEditOpponent(e.target.value)}
                                        disabled={loadingEdit}
                                    />
                                </Form.Group>
                            </Col>
                            <Col xs={12} md={6} className="mb-3">
                                <Form.Group>
                                    <Form.Label>Match Date</Form.Label>
                                    <Form.Control
                                        type="date"
                                        value={editEventDate}
                                        onChange={(e) => setEditEventDate(e.target.value)}
                                        disabled={loadingEdit}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <hr />

                        <h5 className="mb-3">Edit Section Pricing</h5>
                        <Row>
                            <Col xs={12} md={6} className="mb-3">
                                <Form.Group>
                                    <Form.Label>Select Section</Form.Label>
                                    <Form.Select
                                        value={selectedSection}
                                        onChange={(e) => handleSectionChange(e.target.value)}
                                        disabled={loadingEdit}
                                    >
                                        <option value="">Choose a section...</option>
                                        {editSeats.sort((a, b) => {
                                            // Sort sections properly (A1, A2, ..., A20, B1, ..., B24)
                                            const aNum = parseInt(a.section.substring(1));
                                            const bNum = parseInt(b.section.substring(1));
                                            if (a.section[0] === b.section[0]) {
                                                return aNum - bNum;
                                            }
                                            return a.section[0] < b.section[0] ? -1 : 1;
                                        }).map(seat => (
                                            <option key={seat.id} value={seat.section}>
                                                {seat.section} ({seat.total_seats} seats, {seat.available_seats} available)
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col xs={12} md={6} className="mb-3">
                                <Form.Group>
                                    <Form.Label>Price ($)</Form.Label>
                                    <Form.Control
                                        type="number"
                                        value={sectionPrice}
                                        onChange={(e) => setSectionPrice(e.target.value)}
                                        disabled={!selectedSection || loadingEdit}
                                        placeholder="Select a section first"
                                        min="0"
                                        step="0.01"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Alert variant="info" className="mb-0">
                            <small>
                                <strong>Note:</strong> Total seats and available seats cannot be modified.
                                Select a section from the dropdown to update its price.
                            </small>
                        </Alert>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="secondary"
                        onClick={() => setShowEditModal(false)}
                        disabled={loadingEdit}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleUpdateEvent}
                        disabled={loadingEdit}
                    >
                        {loadingEdit ? 'Updating...' : 'Update Event'}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* DELETE CONFIRMATION MODAL */}
            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Confirm Delete</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {deleteError && (
                        <Alert variant="danger" dismissible onClose={() => setDeleteError(null)}>
                            {deleteError}
                        </Alert>
                    )}

                    <p>Are you sure you want to delete this event?</p>
                    {deletingEvent && (
                        <Card className="bg-light">
                            <Card.Body>
                                <strong>Opponent:</strong> {deletingEvent.Opponent}<br />
                                <strong>Date:</strong> {formatDate(deletingEvent.date)}<br />
                                <strong>ID:</strong> {deletingEvent.id}
                            </Card.Body>
                        </Card>
                    )}
                    <Alert variant="warning" className="mt-3 mb-0">
                        <small>
                            <strong>Warning:</strong> This will also delete all associated seats and prices.
                            This action cannot be undone.
                        </small>
                    </Alert>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="secondary"
                        onClick={() => setShowDeleteModal(false)}
                        disabled={loadingDelete}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="danger"
                        onClick={handleConfirmDelete}
                        disabled={loadingDelete}
                    >
                        {loadingDelete ? 'Deleting...' : 'Delete Event'}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* LOADING MODAL */}
            <Modal show={loading} backdrop="static" keyboard={false} centered>
                <Modal.Body className="text-center py-4">
                    <div className="spinner-border text-primary mb-3" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <h5>Creating Event</h5>
                    <p className="mb-0 text-muted">
                        Please wait while we set up your event...
                    </p>
                </Modal.Body>
            </Modal>
        </Container>
    );
}