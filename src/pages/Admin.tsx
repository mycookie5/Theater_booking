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

    const [opponent, setOpponent] = useState('');
    const [eventDate, setEventDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [createdEventId, setCreatedEventId] = useState<number | null>(null);

    const [activeTab, setActiveTab] = useState<string>('create');
    const [events, setEvents] = useState<Event[]>([]);
    const [loadingEvents, setLoadingEvents] = useState(false);

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

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingEvent, setDeletingEvent] = useState<Event | null>(null);
    const [loadingDelete, setLoadingDelete] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    useEffect(() => {
        if (activeTab === 'manage') {
            fetchEvents();
        }
    }, [activeTab]);

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

    const getDefaultSeats = (section: string): number => {
        return section.startsWith('A') ? 1000 : 2000;
    };

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

    const fetchEvents = async () => {
        setLoadingEvents(true);
        try {
            const response = await fetch('/api/events');
            if (!response.ok) {
                throw new Error('Failed to fetch events');
            }
            const data = await response.json();
            const homeEvents = data.filter((event: Event) => event.Home_Away === 'Home');
            setEvents(homeEvents);
        } catch (err) {
            console.error('Error fetching events:', err);
        } finally {
            setLoadingEvents(false);
        }
    };

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

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

            setSuccess(true);
            console.log('Event creation completed successfully!');

        } catch (err) {
            console.error('Error creating event:', err);
            setError(err instanceof Error ? err.message : 'An error occurred while creating the event');
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = async (event: Event) => {
        setEditingEvent(event);
        setEditOpponent(event.Opponent);
        setEditEventDate(event.date.split('T')[0]);
        setEditError(null);
        setEditSuccess(false);
        setSelectedSection('');
        setSectionPrice('');

        try {
            const [seatsResponse, pricesResponse] = await Promise.all([
                fetch(`/api/seats?event_id=${event.id}`),
                fetch(`/api/price?event_id=${event.id}`)
            ]);

            if (seatsResponse.ok && pricesResponse.ok) {
                const seatsData = await seatsResponse.json();
                const pricesData = await pricesResponse.json();

                const filteredSeats = seatsData.filter((s: Seat) => s.event_id === event.id);
                const filteredPrices = pricesData.filter((p: Price) => p.event_id === event.id);

                console.log(`Loaded ${filteredSeats.length} seats and ${filteredPrices.length} prices for event ${event.id}`);

                setEditSeats(filteredSeats);
                setEditPrices(filteredPrices);
            }
        } catch (err) {
            console.error('Error fetching event details:', err);
        }

        setShowEditModal(true);
    };

    const handleSectionChange = (section: string) => {
        if (!editingEvent) {
            console.error('No event is being edited');
            return;
        }

        setSelectedSection(section);

        const seat = editSeats.find(s => s.section === section && s.event_id === editingEvent.id);

        if (seat) {
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

            if (selectedSection && sectionPrice) {
                const seat = editSeats.find(s =>
                    s.section === selectedSection &&
                    s.event_id === editingEvent.id
                );

                if (seat) {
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
            fetchEvents();

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
        <Container fluid className="py-3 py-sm-4 py-md-4 py-lg-5 px-2 px-sm-3 px-md-4">
            <h1 className="mb-3 mb-sm-4 mb-md-4 mb-lg-5 text-center text-sm-start fs-4 fs-sm-3 fs-md-2">Event Management</h1>

            <Tabs
                activeKey={activeTab}
                onSelect={(k) => setActiveTab(k || 'create')}
                className="mb-3 mb-sm-4 mb-md-4 mb-lg-5"
            >
                {/* CREATE EVENT TAB */}
                <Tab eventKey="create" title="Create Event">
                    <Row className="justify-content-center">
                        <Col xs={12} sm={12} md={11} lg={10} xl={8}>
                            <Card className="shadow-sm shadow-md-lg">
                                <Card.Header className="bg-primary text-white p-2 p-sm-3 p-md-3 p-lg-4">
                                    <h3 className="mb-0 fs-6 fs-sm-5 fs-md-4 fs-lg-3">Create New Event</h3>
                                </Card.Header>
                                <Card.Body className="p-2 p-sm-3 p-md-3 p-lg-4">
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
                                        <Row className="g-2 g-sm-3">
                                            <Col xs={12} sm={12} md={6} className="mb-2 mb-sm-3">
                                                <Form.Group>
                                                    <Form.Label className="fw-semibold small">Opponent Team *</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        placeholder="Enter opponent name"
                                                        value={opponent}
                                                        onChange={(e) => setOpponent(e.target.value)}
                                                        disabled={loading}
                                                        required
                                                        size="lg"
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col xs={12} sm={12} md={6} className="mb-2 mb-sm-3">
                                                <Form.Group>
                                                    <Form.Label className="fw-semibold small">Match Date *</Form.Label>
                                                    <Form.Control
                                                        type="date"
                                                        value={eventDate}
                                                        onChange={(e) => setEventDate(e.target.value)}
                                                        disabled={loading}
                                                        required
                                                        size="lg"
                                                    />
                                                </Form.Group>
                                            </Col>
                                        </Row>

                                        <Row className="mb-2 mb-sm-3 g-2 g-sm-3">
                                            <Col xs={12} sm={12} md={6}>
                                                <Form.Group>
                                                    <Form.Label className="fw-semibold small">Home/Away</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        value="Home"
                                                        disabled
                                                        readOnly
                                                        size="lg"
                                                    />
                                                    <Form.Text className="text-muted small">
                                                        Always set to Home (default)
                                                    </Form.Text>
                                                </Form.Group>
                                            </Col>
                                        </Row>

                                        <Card className="bg-light mb-2 mb-sm-3 mb-md-3 mb-lg-4 border-0">
                                            <Card.Body className="p-2 p-sm-3 p-md-3 p-lg-4">
                                                <h5 className="mb-2 mb-sm-3 fs-6 fs-sm-6 fs-md-5">Default Configuration</h5>
                                                <Row className="g-2 g-sm-3">
                                                    <Col xs={12} sm={12} md={6} className="mb-2 mb-sm-2 mb-md-0">
                                                        <h6 className="fs-6 fw-semibold">Seating</h6>
                                                        <ul className="mb-0 small">
                                                            <li className="mb-1">Section A (A1-A20): 1,000 seats each</li>
                                                            <li className="mb-1">Section B (B1-B24): 2,000 seats each</li>
                                                            <li>Total: 68,000 seats</li>
                                                        </ul>
                                                    </Col>
                                                    <Col xs={12} sm={12} md={6}>
                                                        <h6 className="fs-6 fw-semibold">Pricing</h6>
                                                        <ul className="mb-0 small">
                                                            <li className="mb-1">Section A (A1-A20): $399 per seat</li>
                                                            <li className="mb-1">Section B (B1-B24): $499 per seat</li>
                                                        </ul>
                                                    </Col>
                                                </Row>
                                            </Card.Body>
                                        </Card>

                                        <div className="d-grid gap-2 d-sm-flex justify-content-sm-end">
                                            <Button
                                                variant="secondary"
                                                onClick={resetForm}
                                                disabled={loading}
                                                className="order-2 order-sm-1"
                                                size="lg"
                                            >
                                                Reset Form
                                            </Button>
                                            <Button
                                                variant="primary"
                                                type="submit"
                                                disabled={loading}
                                                className="order-1 order-sm-2"
                                                size="lg"
                                            >
                                                {loading ? 'Creating Event...' : 'Create Event'}
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
                    <Card className="shadow-sm shadow-md-lg">
                        <Card.Header className="bg-success text-white p-2 p-sm-3 p-md-3 p-lg-4">
                            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2">
                                <h3 className="mb-0 fs-6 fs-sm-5 fs-md-4 fs-lg-3">All Home Events</h3>
                                <Button
                                    variant="light"
                                    size="sm"
                                    onClick={fetchEvents}
                                    disabled={loadingEvents}
                                    className="w-100 w-sm-auto px-3"
                                >
                                    {loadingEvents ? (
                                        <>
                                            <Spinner
                                                as="span"
                                                animation="border"
                                                size="sm"
                                                role="status"
                                                aria-hidden="true"
                                                className="me-2"
                                            />
                                            Refreshing...
                                        </>
                                    ) : (
                                        'Refresh'
                                    )}
                                </Button>
                            </div>
                        </Card.Header>
                        <Card.Body className="p-2 p-sm-3 p-md-3 p-lg-4">
                            {loadingEvents ? (
                                <div className="text-center py-4 py-sm-5">
                                    <Spinner animation="border" role="status" variant="primary">
                                        <span className="visually-hidden">Loading...</span>
                                    </Spinner>
                                    <p className="mt-3 text-muted small">Loading events...</p>
                                </div>
                            ) : events.length === 0 ? (
                                <Alert variant="info" className="mb-0">
                                    <div className="d-flex align-items-center">
                                        <i className="bi bi-info-circle me-2"></i>
                                        <span>No home events found. Create your first event!</span>
                                    </div>
                                </Alert>
                            ) : (
                                <div className="table-responsive">
                                    <Table striped bordered hover className="mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th className="d-none d-md-table-cell small">ID</th>
                                                <th className="small">Opponent</th>
                                                <th className="d-none d-lg-table-cell small">Date</th>
                                                <th className="d-none d-sm-table-cell small text-center">Status</th>
                                                <th className="small text-center">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {events.map(event => {
                                                const eventDate = new Date(event.date);
                                                const isPast = eventDate < new Date();
                                                return (
                                                    <tr key={event.id}>
                                                        <td className="d-none d-md-table-cell align-middle">
                                                            <Badge bg="secondary" className="font-monospace">{event.id}</Badge>
                                                        </td>
                                                        <td className="align-middle">
                                                            <div>
                                                                <strong className="d-block mb-1">{event.Opponent}</strong>
                                                                <small className="text-muted d-lg-none d-block">
                                                                    {formatDate(event.date)}
                                                                </small>
                                                                <small className="d-sm-none">
                                                                    {isPast ? (
                                                                        <Badge bg="secondary" className="mt-1">Past</Badge>
                                                                    ) : (
                                                                        <Badge bg="success" className="mt-1">Upcoming</Badge>
                                                                    )}
                                                                </small>
                                                            </div>
                                                        </td>
                                                        <td className="d-none d-lg-table-cell align-middle">
                                                            {formatDate(event.date)}
                                                        </td>
                                                        <td className="d-none d-sm-table-cell align-middle text-center">
                                                            {isPast ? (
                                                                <Badge bg="secondary">Past</Badge>
                                                            ) : (
                                                                <Badge bg="success">Upcoming</Badge>
                                                            )}
                                                        </td>
                                                        <td className="align-middle">
                                                            <div className="d-flex flex-column flex-sm-row gap-1 gap-sm-2 justify-content-center">
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
            <Modal
                show={showEditModal}
                onHide={() => setShowEditModal(false)}
                size="lg"
                centered
                fullscreen="sm-down"
            >
                <Modal.Header closeButton className="border-bottom">
                    <Modal.Title className="fs-5 fs-sm-4">
                        Edit Event
                        {editingEvent && <small className="text-muted d-block fs-6"> ID: {editingEvent.id}</small>}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-2 p-sm-3 p-md-4">
                    {editError && (
                        <Alert variant="danger" dismissible onClose={() => setEditError(null)} className="mb-3">
                            <strong>Error:</strong> {editError}
                        </Alert>
                    )}

                    {editSuccess && (
                        <Alert variant="success" className="mb-3">
                            <strong>Success!</strong> Event updated successfully!
                        </Alert>
                    )}

                    <Form>
                        <Row className="g-2 g-sm-3">
                            <Col xs={12} sm={12} md={6} className="mb-2 mb-sm-3">
                                <Form.Group>
                                    <Form.Label className="fw-semibold small">Opponent Team</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={editOpponent}
                                        onChange={(e) => setEditOpponent(e.target.value)}
                                        disabled={loadingEdit}
                                        size="lg"
                                    />
                                </Form.Group>
                            </Col>
                            <Col xs={12} sm={12} md={6} className="mb-2 mb-sm-3">
                                <Form.Group>
                                    <Form.Label className="fw-semibold small">Match Date</Form.Label>
                                    <Form.Control
                                        type="date"
                                        value={editEventDate}
                                        onChange={(e) => setEditEventDate(e.target.value)}
                                        disabled={loadingEdit}
                                        size="lg"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <hr className="my-3" />

                        <h5 className="mb-2 mb-sm-3 fs-6 fs-sm-5">Edit Section Pricing</h5>
                        <Row className="g-2 g-sm-3">
                            <Col xs={12} sm={12} md={6} className="mb-2 mb-sm-3">
                                <Form.Group>
                                    <Form.Label className="fw-semibold small">Select Section</Form.Label>
                                    <Form.Select
                                        value={selectedSection}
                                        onChange={(e) => handleSectionChange(e.target.value)}
                                        disabled={loadingEdit}
                                        size="lg"
                                    >
                                        <option value="">Choose a section...</option>
                                        {editSeats.sort((a, b) => {
                                            const aNum = parseInt(a.section.substring(1));
                                            const bNum = parseInt(b.section.substring(1));
                                            if (a.section[0] === b.section[0]) {
                                                return aNum - bNum;
                                            }
                                            return a.section[0] < b.section[0] ? -1 : 1;
                                        }).map(seat => (
                                            <option key={seat.id} value={seat.section}>
                                                {seat.section} ({seat.total_seats.toLocaleString()} seats, {seat.available_seats.toLocaleString()} available)
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col xs={12} sm={12} md={6} className="mb-2 mb-sm-3">
                                <Form.Group>
                                    <Form.Label className="fw-semibold small">Price ($)</Form.Label>
                                    <Form.Control
                                        type="number"
                                        value={sectionPrice}
                                        onChange={(e) => setSectionPrice(e.target.value)}
                                        disabled={!selectedSection || loadingEdit}
                                        placeholder="Select a section first"
                                        min="0"
                                        step="0.01"
                                        size="lg"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Alert variant="info" className="mb-0 small">
                            <strong>Note:</strong> Total seats and available seats cannot be modified.
                            Select a section from the dropdown to update its price one at a time.
                        </Alert>
                    </Form>
                </Modal.Body>
                <Modal.Footer className="d-flex flex-column-reverse flex-sm-row gap-2 p-2 p-sm-3 p-md-4 border-top">
                    <Button
                        variant="secondary"
                        onClick={() => setShowEditModal(false)}
                        disabled={loadingEdit}
                        className="w-100 w-sm-auto"
                        size="lg"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleUpdateEvent}
                        disabled={loadingEdit}
                        className="w-100 w-sm-auto"
                        size="lg"
                    >
                        {loadingEdit ? (
                            <>
                                <Spinner
                                    as="span"
                                    animation="border"
                                    size="sm"
                                    role="status"
                                    aria-hidden="true"
                                    className="me-2"
                                />
                                Updating...
                            </>
                        ) : (
                            'Update Event'
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* DELETE CONFIRMATION MODAL */}
            <Modal
                show={showDeleteModal}
                onHide={() => setShowDeleteModal(false)}
                centered
                fullscreen="sm-down"
            >
                <Modal.Header closeButton className="border-bottom bg-danger text-white">
                    <Modal.Title className="fs-5 fs-sm-4">Confirm Delete</Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-2 p-sm-3 p-md-4">
                    {deleteError && (
                        <Alert variant="danger" dismissible onClose={() => setDeleteError(null)} className="mb-3">
                            <strong>Error:</strong> {deleteError}
                        </Alert>
                    )}

                    <p className="fw-semibold mb-3">Are you sure you want to delete this event?</p>
                    {deletingEvent && (
                        <Card className="bg-light mb-3 border-0">
                            <Card.Body className="p-2 p-sm-3">
                                <div className="d-flex flex-column gap-2">
                                    <div><strong>Opponent:</strong> <span className="text-primary">{deletingEvent.Opponent}</span></div>
                                    <div><strong>Date:</strong> <span className="text-muted">{formatDate(deletingEvent.date)}</span></div>
                                    <div><strong>ID:</strong> <Badge bg="secondary">{deletingEvent.id}</Badge></div>
                                </div>
                            </Card.Body>
                        </Card>
                    )}
                    <Alert variant="warning" className="mb-0">
                        <div className="small">
                            <strong>Warning:</strong> This will also delete all associated seats and prices.
                            This action <strong>cannot be undone</strong>.
                        </div>
                    </Alert>
                </Modal.Body>
                <Modal.Footer className="d-flex flex-column-reverse flex-sm-row gap-2 p-2 p-sm-3 p-md-4 border-top">
                    <Button
                        variant="secondary"
                        onClick={() => setShowDeleteModal(false)}
                        disabled={loadingDelete}
                        className="w-100 w-sm-auto"
                        size="lg"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="danger"
                        onClick={handleConfirmDelete}
                        disabled={loadingDelete}
                        className="w-100 w-sm-auto"
                        size="lg"
                    >
                        {loadingDelete ? (
                            <>
                                <Spinner
                                    as="span"
                                    animation="border"
                                    size="sm"
                                    role="status"
                                    aria-hidden="true"
                                    className="me-2"
                                />
                                Deleting...
                            </>
                        ) : (
                            'Delete Event'
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* LOADING MODAL */}
            <Modal show={loading} backdrop="static" keyboard={false} centered size="sm">
                <Modal.Body className="text-center py-3 py-sm-4 px-3 px-sm-4">
                    <Spinner animation="border" variant="primary" className="mb-3" >
                        <span className="visually-hidden">Loading...</span>
                    </Spinner>
                    <h5 className="mb-2 fs-6 fs-sm-5">Creating Event</h5>
                    <p className="mb-0 text-muted small">
                        Please wait while we set up your event...
                    </p>
                </Modal.Body>
            </Modal>
        </Container>
    );
}