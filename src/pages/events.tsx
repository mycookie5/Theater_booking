import { useState, useEffect } from 'react';
import { Button, Container, Row, Col, Card, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import authUser from '../hooks/authUser';

Events.route = {
    path: '/events',
    menuLabel: 'Events',
    index: 10
};

interface Event {
    id: number;
    date: string;
    Opponent: string;
    'Home/Away': string;
}

export default function Events() {
    const navigate = useNavigate();
    const { userData } = authUser();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchTerm, setSearchTerm] = useState<string>('');

    useEffect(() => {
        fetch('/api/events')
            .then(res => res.ok ? res.json() : [])
            .then(data => {
                // Filter for Home games only
                const homeEvents = data.filter((event: Event) => event['Home/Away'] === 'Home');
                setEvents(homeEvents);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching events:', err);
                setLoading(false);
            });
    }, []);

    const handleBooking = (eventId: number) => {
        if (userData) {
            navigate(`/bookings?eventId=${eventId}`);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Filter by search term with relevance-based sorting
    const filteredEvents = events
        .filter(event => event.Opponent.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => {
            if (!searchTerm) {
                // If no search term, just sort by date
                return new Date(a.date).getTime() - new Date(b.date).getTime();
            }

            const searchLower = searchTerm.toLowerCase();
            const aOpponent = a.Opponent.toLowerCase();
            const bOpponent = b.Opponent.toLowerCase();

            const aStartsWith = aOpponent.startsWith(searchLower);
            const bStartsWith = bOpponent.startsWith(searchLower);

            // Prioritize matches that start with search term
            if (aStartsWith && !bStartsWith) return -1;
            if (!aStartsWith && bStartsWith) return 1;

            // If both start with or both don't start with search term, sort by date
            return new Date(a.date).getTime() - new Date(b.date).getTime();
        });

    return (
        <Container className="events-page-container py-4">
            <h1 className="mb-4">Upcoming Home Games</h1>

            {/* Search Bar */}
            <Row className="mb-4">
                <Col xs={12} md={8} lg={6}>
                    <Form.Group>
                        <Form.Control
                            type="text"
                            placeholder="Search by opponent name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            size="lg"
                        />
                    </Form.Group>
                </Col>
            </Row>

            {loading ? (
                <p>Loading events...</p>
            ) : filteredEvents.length === 0 ? (
                <p>
                    {searchTerm
                        ? `No home games found matching "${searchTerm}".`
                        : 'No upcoming home games at this time.'}
                </p>
            ) : (
                <Row xs={1} md={2} lg={3} className="g-4">
                    {filteredEvents.map(event => (
                        <Col key={event.id}>
                            <Card
                                className="h-100 shadow-sm"
                                style={{
                                    backgroundImage: 'url(../../public/images/trophy.png)',
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    backgroundRepeat: 'no-repeat',
                                    position: 'relative'
                                }}
                            >
                                <div style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                    backdropFilter: 'blur(2px)'
                                }} />
                                <Card.Body className="d-flex flex-column" style={{ position: 'relative', zIndex: 1 }}>
                                    <Card.Title className="text-primary">
                                        Thunderbolts FC vs {event.Opponent}
                                    </Card.Title>
                                    <Card.Text>
                                        <strong>Date:</strong> {formatDate(event.date)}
                                        <br />
                                        <strong>Venue:</strong> Home
                                    </Card.Text>
                                    <div className="mt-auto">
                                        {userData ? (
                                            <Button
                                                variant="primary"
                                                className="w-100"
                                                onClick={() => handleBooking(event.id)}
                                            >
                                                Book Tickets
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="outline-primary"
                                                className="w-100"
                                                onClick={() => navigate('/login')}
                                            >
                                                Login to Book Ticket
                                            </Button>
                                        )}
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}
        </Container>
    );
}