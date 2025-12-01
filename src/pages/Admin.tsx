import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Modal, Tabs, Tab, Table, Badge, Spinner } from 'react-bootstrap';
import useAuthUser from '../hooks/useAuthUser';

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

interface TicketWithDetails {
    id: number;
    event_id: number;
    seat_id: number;
    user_id: number;
    quantity: number;
    date: string;
    opponent: string;
    section: string;
    user_email?: string;
}

export default function Admin() {
    const { isUserAdmin } = useAuthUser();

    // Create Form States
    const [opponent, setOpponent] = useState('');
    const [eventDate, setEventDate] = useState('');
    const [eventTime, setEventTime] = useState('');
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
    const [editEventTime, setEditEventTime] = useState('');
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

    // Booked Events States
    const [bookedTickets, setBookedTickets] = useState<TicketWithDetails[]>([]);
    const [loadingTickets, setLoadingTickets] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Load events when switching to manage tab
    useEffect(() => {
        if (activeTab === 'manage') {
            fetchEvents();
        } else if (activeTab === 'booked') {
            fetchBookedTickets();
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
        setEventTime('');
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

    // Fetch all booked tickets
    const fetchBookedTickets = async () => {
        setLoadingTickets(true);
        try {
            const response = await fetch('/api/ticket_details');
            if (!response.ok) {
                throw new Error('Failed to fetch tickets');
            }
            const data = await response.json();
            setBookedTickets(data);
        } catch (err) {
            console.error('Error fetching booked tickets:', err);
        } finally {
            setLoadingTickets(false);
        }
    };

    // Format date for display
    const formatDate = (dateString: string): string => {
        // Check if the dateString contains time (format: "YYYY-MM-DD HH:MM")
        if (dateString.includes(' ')) {
            const [datePart, timePart] = dateString.split(' ');
            const date = new Date(datePart);
            const formattedDate = date.toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
            return `${formattedDate} at ${timePart}`;
        }
        // Original behavior for date-only strings
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Create Event Handler
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!opponent || !eventDate || !eventTime) {
            setError('Please fill in all required fields');
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            // Combine date and time into a single string
            const dateTimeString = `${eventDate} ${eventTime}`;

            // Step 1: Create the event
            console.log('Creating event...');
            const eventResponse = await fetch('/api/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: dateTimeString,
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

        // Split date and time if time is present
        if (event.date.includes(' ')) {
            const [datePart, timePart] = event.date.split(' ');
            setEditEventDate(datePart);
            setEditEventTime(timePart);
        } else {
            setEditEventDate(event.date.split('T')[0]); // Format date for input
            setEditEventTime('19:00'); // Default time for old events
        }

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
            // Combine date and time into a single string
            const dateTimeString = `${editEventDate} ${editEventTime}`;

            // Update event basic info
            const eventResponse = await fetch(`/api/events/${editingEvent.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: dateTimeString,
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

    // Filter booked tickets
    const getFilteredTickets = () => {
        let filtered = bookedTickets;

        // Filter by event
        if (selectedEvent !== 'all') {
            filtered = filtered.filter(ticket => ticket.event_id === parseInt(selectedEvent));
        }

        // Filter by search query
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(ticket =>
                ticket.opponent.toLowerCase().includes(query) ||
                ticket.section.toLowerCase().includes(query) ||
                ticket.id.toString().includes(query)
            );
        }

        return filtered;
    };

    const filteredTickets = getFilteredTickets();

    // Get unique events from booked tickets
    const uniqueEvents = Array.from(new Set(bookedTickets.map(t => t.event_id)))
        .map(eventId => {
            const ticket = bookedTickets.find(t => t.event_id === eventId);
            return ticket ? { id: eventId, opponent: ticket.opponent, date: ticket.date } : null;
        })
        .filter(Boolean);

    // Calculate stats
    const totalTickets = filteredTickets.reduce((sum, ticket) => sum + ticket.quantity, 0);
    const totalBookings = filteredTickets.length;

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
                fill
            >
                {/* CREATE EVENT TAB */}
                <Tab
                    eventKey="create"
                    title={
                        <span className="d-inline-block text-center px-2 px-sm-3">
                            <span className="d-none d-sm-inline">Create Event</span>
                            <span className="d-sm-none">Create</span>
                        </span>
                    }
                >
                    <Row className="justify-content-center">
                        <Col xs={12} lg={10} xl={8}>
                            <Card className="shadow">
                                <Card.Header className="bg-primary text-white p-3 p-lg-4">
                                    <h3 className="mb-0 fs-5 fs-lg-4">Create New Event</h3>
                                </Card.Header>
                                <Card.Body className="p-3 p-lg-4">
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
                                            <Col xs={12} md={3} className="mb-3">
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
                                            <Col xs={12} md={3} className="mb-3">
                                                <Form.Group>
                                                    <Form.Label>Match Time *</Form.Label>
                                                    <Form.Control
                                                        type="time"
                                                        value={eventTime}
                                                        onChange={(e) => setEventTime(e.target.value)}
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

                                        <Card className="bg-light mb-3 mb-lg-4">
                                            <Card.Body className="p-3 p-lg-4">
                                                <h5 className="mb-2 mb-lg-3 fs-6 fs-lg-5">Default Configuration</h5>
                                                <Row>
                                                    <Col xs={12} md={6} className="mb-3 mb-md-0">
                                                        <h6 className="fs-6">Seating</h6>
                                                        <ul className="mb-0 small small-lg-normal">
                                                            <li>Section A (A1-A20): 1,000 seats each</li>
                                                            <li>Section B (B1-B24): 2,000 seats each</li>
                                                            <li>Total: 68,000 seats</li>
                                                        </ul>
                                                    </Col>
                                                    <Col xs={12} md={6}>
                                                        <h6 className="fs-6">Pricing</h6>
                                                        <ul className="mb-0 small small-lg-normal">
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
                <Tab
                    eventKey="manage"
                    title={
                        <span className="d-inline-block text-center px-2 px-sm-3">
                            <span className="d-none d-sm-inline">Manage Events</span>
                            <span className="d-sm-none">Manage</span>
                        </span>
                    }
                >
                    <Card className="shadow">
                        <Card.Header className="bg-success text-white p-3 p-lg-4">
                            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2">
                                <h3 className="mb-0 fs-5 fs-lg-4">All Home Events</h3>
                                <Button
                                    variant="light"
                                    size="sm"
                                    onClick={fetchEvents}
                                    disabled={loadingEvents}
                                    className="w-100 w-sm-auto"
                                >
                                    {loadingEvents ? 'Refreshing...' : 'Refresh'}
                                </Button>
                            </div>
                        </Card.Header>
                        <Card.Body className="p-3 p-lg-4">
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

                {/* BOOKED EVENTS TAB */}
                <Tab
                    eventKey="booked"
                    title={
                        <span className="d-inline-block text-center px-2 px-sm-3">
                            <span className="d-none d-sm-inline">Booked Events</span>
                            <span className="d-sm-none">Booked</span>
                        </span>
                    }
                >
                    <div className="mb-3 mb-sm-4">
                        <Row className="g-2 g-sm-3 align-items-end">
                            <Col xs={12} sm={6} md={4} lg={3}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold small">Filter by Event</Form.Label>
                                    <Form.Select
                                        value={selectedEvent}
                                        onChange={(e) => setSelectedEvent(e.target.value)}
                                        size="lg"
                                    >
                                        <option value="all">All Events</option>
                                        {uniqueEvents.map((event: any) => (
                                            <option key={event.id} value={event.id}>
                                                vs {event.opponent} - {formatDate(event.date)}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col xs={12} sm={6} md={4} lg={3}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold small">Search</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Search..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        size="lg"
                                    />
                                </Form.Group>
                            </Col>
                            <Col xs={12} sm={12} md={4} lg={6}>
                                <div className="d-flex flex-column flex-sm-row gap-2 align-items-sm-center justify-content-md-end">
                                    <Badge bg="primary" className="px-3 py-2">
                                        {totalBookings} Bookings
                                    </Badge>
                                    <Badge bg="success" className="px-3 py-2">
                                        {totalTickets} Tickets
                                    </Badge>
                                    <Button
                                        variant="outline-primary"
                                        size="sm"
                                        onClick={fetchBookedTickets}
                                        disabled={loadingTickets}
                                    >
                                        {loadingTickets ? 'Refreshing...' : 'Refresh'}
                                    </Button>
                                </div>
                            </Col>
                        </Row>
                    </div>

                    {loadingTickets ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }}>
                                <span className="visually-hidden">Loading...</span>
                            </Spinner>
                            <p className="mt-3 text-muted">Loading booked tickets...</p>
                        </div>
                    ) : filteredTickets.length === 0 ? (
                        <Card className="shadow-sm border-0">
                            <Card.Body className="p-3 p-sm-4 p-md-5 text-center">
                                <div className="mb-3 mb-sm-4">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="64"
                                        height="64"
                                        fill="currentColor"
                                        className="text-muted"
                                        viewBox="0 0 16 16"
                                    >
                                        <path d="M5.5 7a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1h-5zM5 9.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5z" />
                                        <path d="M9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4.5L9.5 0zm0 1v2A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5z" />
                                    </svg>
                                </div>
                                <h3 className="mb-2 mb-sm-3 fs-5 fs-sm-4">No Tickets Found</h3>
                                <p className="text-muted mb-0">
                                    {searchQuery || selectedEvent !== 'all'
                                        ? 'No tickets match your filters. Try adjusting your search.'
                                        : 'No tickets have been booked yet.'}
                                </p>
                            </Card.Body>
                        </Card>
                    ) : (
                        <Row xs={1} sm={1} md={2} lg={3} xl={3} className="g-3 g-sm-3 g-md-4 row-cols-xl-3">
                            {filteredTickets.map(ticket => (
                                <Col key={ticket.id}>
                                    <Card className="h-100 shadow-sm border-0 overflow-hidden">
                                        {/* Header Section */}
                                        <div className="bg-primary text-white p-3 p-sm-4">
                                            <div className="d-flex justify-content-between align-items-start">
                                                <div className="flex-grow-1">
                                                    <Badge bg="light" text="dark" className="mb-2 px-2 py-1 small fw-semibold">
                                                        BOOKED TICKET
                                                    </Badge>
                                                    <h5 className="mb-0 fw-bold fs-6 fs-sm-5">
                                                        THUNDERBOLTS FC
                                                    </h5>
                                                </div>
                                                <div className="ms-2">
                                                    <div className="bg-white rounded-circle d-flex align-items-center justify-content-center">
                                                        <svg
                                                            width="24"
                                                            height="24"
                                                            viewBox="0 0 100 100"
                                                            fill="none"
                                                            xmlns="http://www.w3.org/2000/svg"
                                                        >
                                                            <path d="M50 10 L58 32 L78 32 L62 46 L68 66 L50 54 L32 66 L38 46 L22 32 L42 32 Z" fill="#0d6efd" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Perforation Effect */}
                                        <div className="position-relative bg-white">
                                            <div className="position-absolute top-50 start-0 translate-middle-y w-100 d-flex justify-content-around">
                                                {[...Array(12)].map((_, i) => (
                                                    <div
                                                        key={i}
                                                        className="bg-light rounded-circle"
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        {/* Content Section */}
                                        <Card.Body className="p-3 p-sm-4">
                                            <div className="mb-3">
                                                <h4 className="mb-1 fw-bold text-dark fs-5 fs-sm-4">
                                                    vs {ticket.opponent}
                                                </h4>
                                            </div>

                                            <div className="mb-3">
                                                <Row className="g-2">
                                                    <Col xs={12}>
                                                        <div className="d-flex justify-content-between align-items-center p-2 bg-light rounded">
                                                            <span className="text-muted small fw-semibold">USER ID</span>
                                                            <Badge bg="secondary" className="px-3 py-1 font-monospace">{ticket.user_id}</Badge>
                                                        </div>
                                                    </Col>
                                                    <Col xs={12}>
                                                        <div className="d-flex justify-content-between align-items-center p-2 bg-light rounded">
                                                            <span className="text-muted small fw-semibold">DATE</span>
                                                            <span className="fw-semibold small">{formatDate(ticket.date)}</span>
                                                        </div>
                                                    </Col>
                                                    <Col xs={6}>
                                                        <div className="d-flex flex-column align-items-center p-2 bg-light rounded">
                                                            <span className="text-muted small fw-semibold mb-1">SECTION</span>
                                                            <Badge bg="primary" className="px-3 py-1">{ticket.section}</Badge>
                                                        </div>
                                                    </Col>
                                                    <Col xs={6}>
                                                        <div className="d-flex flex-column align-items-center p-2 bg-light rounded">
                                                            <span className="text-muted small fw-semibold mb-1">QUANTITY</span>
                                                            <Badge bg="success" className="px-3 py-1">{ticket.quantity}</Badge>
                                                        </div>
                                                    </Col>
                                                </Row>
                                            </div>

                                            <div className="text-center mt-3 pt-3 border-top">
                                                <small className="text-muted font-monospace">
                                                    TICKET #{ticket.id.toString().padStart(6, '0')}
                                                </small>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    )}
                </Tab>
            </Tabs>

            {/* EDIT EVENT MODAL */}
            <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Edit Event</Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-3 p-lg-4">
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
                            <Col xs={12} md={3} className="mb-3">
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
                            <Col xs={12} md={3} className="mb-3">
                                <Form.Group>
                                    <Form.Label>Match Time *</Form.Label>
                                    <Form.Control
                                        type="time"
                                        value={editEventTime}
                                        onChange={(e) => setEditEventTime(e.target.value)}
                                        disabled={loadingEdit}
                                        required
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
                <Modal.Footer className="d-flex flex-column flex-sm-row gap-2 p-3 p-lg-4">
                    <Button
                        variant="secondary"
                        onClick={() => setShowEditModal(false)}
                        disabled={loadingEdit}
                        className="w-100 w-sm-auto order-sm-1"
                        size="lg"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleUpdateEvent}
                        disabled={loadingEdit}
                        className="w-100 w-sm-auto order-sm-2"
                        size="lg"
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
                <Modal.Body className="p-3 p-lg-4">
                    {deleteError && (
                        <Alert variant="danger" dismissible onClose={() => setDeleteError(null)}>
                            {deleteError}
                        </Alert>
                    )}

                    <p>Are you sure you want to delete this event?</p>
                    {deletingEvent && (
                        <Card className="bg-light mb-3">
                            <Card.Body className="p-2 p-lg-3">
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
                <Modal.Footer className="d-flex flex-column flex-sm-row gap-2 p-3 p-lg-4">
                    <Button
                        variant="secondary"
                        onClick={() => setShowDeleteModal(false)}
                        disabled={loadingDelete}
                        className="w-100 w-sm-auto order-sm-1"
                        size="lg"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="danger"
                        onClick={handleConfirmDelete}
                        disabled={loadingDelete}
                        className="w-100 w-sm-auto order-sm-2"
                        size="lg"
                    >
                        {loadingDelete ? 'Deleting...' : 'Delete Event'}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* LOADING MODAL */}
            <Modal show={loading} backdrop="static" keyboard={false} centered>
                <Modal.Body className="text-center py-3 py-lg-4 px-3 px-lg-4">
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