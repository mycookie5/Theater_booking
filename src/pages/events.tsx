import { useState, useEffect } from 'react';
import { Button, Container, Row, Col, Card, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import useAuthUser from '../hooks/useAuthUser';

Events.route = {
    path: '/events',
    menuLabel: 'Events',
    index: 10
};

interface Event {
    id: number;
    date: string;
    Opponent: string;
    Home_Away: string;
}

export default function Events() {
    const navigate = useNavigate();
    const { userData } = useAuthUser();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchTerm, setSearchTerm] = useState<string>('');

    useEffect(() => {
        fetch('/api/events')
            .then(res => res.ok ? res.json() : [])
            .then(data => {
                const homeEvents = data.filter((event: Event) => event['Home_Away'] === 'Home');
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
            navigate(`/booking/${eventId}`);
        }
    };

    const formatDate = (dateString: string) => {
        // Check if the dateString contains time (format: "YYYY-MM-DD HH:MM")
        if (dateString.includes(' ')) {
            const [datePart, timePart] = dateString.split(' ');
            const date = new Date(datePart);
            const formattedDate = date.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            return `${formattedDate} at ${timePart}`;
        }
        // Original behavior for date-only strings
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const filteredEvents = events
        .filter(event => event.Opponent.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => {
            if (!searchTerm) {
                return new Date(a.date).getTime() - new Date(b.date).getTime();
            }

            const searchLower = searchTerm.toLowerCase();
            const aOpponent = a.Opponent.toLowerCase();
            const bOpponent = b.Opponent.toLowerCase();

            const aStartsWith = aOpponent.startsWith(searchLower);
            const bStartsWith = bOpponent.startsWith(searchLower);

            if (aStartsWith && !bStartsWith) return -1;
            if (!aStartsWith && bStartsWith) return 1;

            return new Date(a.date).getTime() - new Date(b.date).getTime();
        });

    return (
        <Container className="events-page-container py-4">
            <h1 className="mb-4">Upcoming Home Games</h1>

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
                            <Card className="h-100 shadow-sm">
                                <Card.Img
                                    variant="top"
                                    src="../../public/images/sport/trophy.png"
                                    alt="Championship Trophy"
                                    className="img-fluid p-3"
                                    style={{ objectFit: 'contain', height: '200px' }}
                                />
                                <Card.Body className="d-flex flex-column">
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