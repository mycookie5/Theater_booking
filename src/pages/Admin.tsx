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
                console.log(`Created seat for section ${section} with ID:`, seatId);
            }

            // Step 3: Create prices for all sections
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

                console.log(`Created price for section ${section}`);
            }

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

                // CRITICAL FIX: Filter seats and prices to ensure they belong to THIS event
                const filteredSeats = seatsData.filter((s: Seat) => s.event_id === event.id);
                const filteredPrices = pricesData.filter((p: Price) => p.event_id === event.id);

                console.log(`Loaded ${filteredSeats.length} seats and ${filteredPrices.length} prices for event ${event.id}`);

                setEditSeats(filteredSeats);
                setEditPrices(filteredPrices);
            }
        } catch (err) {
            console.error('Error fetching event details:', err);
            setEditError('Failed to load event details. Please try again.');
        }

        setShowEditModal(true);
    };

    const handleSectionChange = (section: string) => {
        if (!editingEvent) {
            console.error('No event is being edited');
            return;
        }

        setSelectedSection(section);

        // CRITICAL FIX: Find the seat for this section AND verify it belongs to the current event
        const seat = editSeats.find(s => s.section === section && s.event_id === editingEvent.id);

        if (seat) {
            // CRITICAL FIX: Find the price for this seat AND verify it belongs to the current event
            const price = editPrices.find(p =>
                p.seat_id === seat.id &&
                p.event_id === editingEvent.id
            );

            if (price) {
                console.log(`Found price for section ${section} (Seat ID: ${seat.id}, Event ID: ${editingEvent.id}): $${price.price}`);
                setSectionPrice(price.price.toString());
            } else {
                console.warn(`No price found for section ${section} in event ${editingEvent.id}`);
                setSectionPrice('');
            }
        } else {
            console.warn(`No seat found for section ${section} in event ${editingEvent.id}`);
            setSectionPrice('');
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
                // CRITICAL FIX: Find the seat AND verify it belongs to the current event
                const seat = editSeats.find(s =>
                    s.section === selectedSection &&
                    s.event_id === editingEvent.id
                );

                if (seat) {
                    // CRITICAL FIX: Find the price AND verify it belongs to the current event
                    const price = editPrices.find(p =>
                        p.seat_id === seat.id &&
                        p.event_id === editingEvent.id
                    );

                    if (price) {
                        console.log(`Updating price for section ${selectedSection} (Event ID: ${editingEvent.id}, Seat ID: ${seat.id}, Price ID: ${price.id})`);

                        const priceResponse = await fetch(`/api/price/${price.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                price: parseFloat(sectionPrice),
                                // Include these for additional validation on the backend
                                event_id: editingEvent.id,
                                seat_id: seat.id
                            })
                        });

                        if (!priceResponse.ok) {
                            throw new Error('Failed to update price');
                        }

                        console.log('Price updated successfully');
                    } else {
                        throw new Error(`Price not found for section ${selectedSection} in event ${editingEvent.id}`);
                    }
                } else {
                    throw new Error(`Seat not found for section ${selectedSection} in event ${editingEvent.id}`);
                }
            }

            setEditSuccess(true);

            // Refresh the events list
            await fetchEvents();

            // Close modal after a delay
            setTimeout(() => {
                setShowEditModal(false);
            }, 1500);

        } catch (err) {
            console.error('Error updating event:', err);
            setEditError(err instanceof Error ? err.message : 'An error occurred while updating the event');
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
            const response = await fetch(`/api/events/${deletingEvent.id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Failed to delete event');
            }

            // Refresh the events list
            await fetchEvents();
            setShowDeleteModal(false);
            setDeletingEvent(null);

        } catch (err) {
            console.error('Error deleting event:', err);
            setDeleteError(err instanceof Error ? err.message : 'An error occurred while deleting the event');
        } finally {
            setLoadingDelete(false);
        }
    };

    if (!isUserAdmin) {
        return (
            <Container className="mt-5">
                <Alert variant="danger">
                    <Alert.Heading>Access Denied</Alert.Heading>
                    <p>You do not have permission to access this page.</p>
                </Alert>
            </Container>
        );
    }

    return (
        <Container className="mt-4">
            <h1 className="mb-4">Event Management</h1>

            <Tabs
                activeKey={activeTab}
                onSelect={(k) => setActiveTab(k || 'create')}
                className="mb-3"
            >
                <Tab eventKey="create" title="Create New Event">
                    <Card>
                        <Card.Body>
                            {error && (
                                <Alert variant="danger" dismissible onClose={() => setError(null)}>
                                    {error}
                                </Alert>
                            )}

                            {success && (
                                <Alert variant="success" dismissible onClose={() => setSuccess(false)}>
                                    <Alert.Heading>Success!</Alert.Heading>
                                    <p>
                                        Event created successfully with all seats and pricing!
                                        {createdEventId && <><br /><strong>Event ID:</strong> {createdEventId}</>}
                                    </p>
                                    <hr />
                                    <div className="d-flex justify-content-end">
                                        <Button onClick={resetForm} variant="outline-success">
                                            Create Another Event
                                        </Button>
                                    </div>
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
                                                required
                                                disabled={loading}
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
                                                required
                                                disabled={loading}
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Alert variant="info">
                                    <Alert.Heading>Automatic Setup</Alert.Heading>
                                    <p className="mb-0">
                                        <strong>Sections:</strong> A1-A20 (1000 seats each @ $399) and B1-B24 (2000 seats each @ $499)
                                        will be automatically created.
                                    </p>
                                </Alert>

                                <Button variant="primary" type="submit" disabled={loading}>
                                    {loading ? 'Creating Event...' : 'Create Event'}
                                </Button>
                            </Form>
                        </Card.Body>
                    </Card>
                </Tab>

                <Tab eventKey="manage" title="Manage Events">
                    <Card>
                        <Card.Body>
                            {loadingEvents ? (
                                <div className="text-center py-5">
                                    <Spinner animation="border" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </Spinner>
                                    <p className="mt-2">Loading events...</p>
                                </div>
                            ) : events.length === 0 ? (
                                <Alert variant="info">
                                    No events found. Create your first event in the "Create New Event" tab.
                                </Alert>
                            ) : (
                                <div className="table-responsive">
                                    <Table striped bordered hover>
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Date</th>
                                                <th>Opponent</th>
                                                <th>Location</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {events.map((event) => {
                                                return (
                                                    <tr key={event.id}>
                                                        <td>{event.id}</td>
                                                        <td>{formatDate(event.date)}</td>
                                                        <td>{event.Opponent}</td>
                                                        <td>
                                                            <Badge bg="success">{event.Home_Away}</Badge>
                                                        </td>
                                                        <td>
                                                            <div className="d-flex gap-2">
                                                                <Button
                                                                    variant="warning"
                                                                    size="sm"
                                                                    onClick={() => handleEditClick(event)}
                                                                >
                                                                    Edit
                                                                </Button>
                                                                <Button
                                                                    variant="danger"
                                                                    size="sm"
                                                                    onClick={() => handleDeleteClick(event)}
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
                    <Modal.Title>Edit Event {editingEvent && `(ID: ${editingEvent.id})`}</Modal.Title>
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