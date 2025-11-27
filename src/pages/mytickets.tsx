import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, Modal } from 'react-bootstrap';
import authUser from '../hooks/authUser';
import '../../sass/myticket.scss'; // Import custom CSS for styles that can't be replicated with Bootstrap

MyTickets.route = {
    path: '/mytickets',
    menuLabel: 'My Tickets',
    index: 10
};

interface Ticket {
    id: number;
    event_id: number;
    seat_id: number;
    user_id: number;
    quantity: number;
}

interface TicketWithDetails extends Ticket {
    date: string;
    opponent: string;
    section: string;
}

export default function MyTickets() {
    const { userData } = authUser();
    const [tickets, setTickets] = useState<TicketWithDetails[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
    const [ticketToCancel, setTicketToCancel] = useState<TicketWithDetails | null>(null);
    const [canceling, setCanceling] = useState<boolean>(false);

    useEffect(() => {
        if (!userData) {
            setLoading(false);
            return;
        }

        fetchTickets();
    }, [userData]);

    const fetchTickets = () => {
        fetch(`/api/ticket_details`)
            .then(res => res.ok ? res.json() : [])
            .then(data => {

                const filteredTickets = data.filter((ticket: TicketWithDetails) =>
                    ticket.user_id === userData?.id
                );

                if (data.length > 0) {
                    const userIds = [...new Set(data.map((t: TicketWithDetails) => t.user_id))];

                }

                setTickets(filteredTickets);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching tickets:', err);
                setLoading(false);
            });
    };

    const handleCancelClick = (ticket: TicketWithDetails) => {
        setTicketToCancel(ticket);
        setShowCancelModal(true);
    };

    const handleCancelConfirm = async () => {
        if (!ticketToCancel) return;

        setCanceling(true);

        try {
            const deleteResponse = await fetch(`/api/tickets/${ticketToCancel.id}`, {
                method: 'DELETE'
            });

            if (!deleteResponse.ok) {
                throw new Error('Failed to cancel ticket');
            }

            const seatResponse = await fetch(`/api/seats/${ticketToCancel.seat_id}`);
            if (!seatResponse.ok) {
                throw new Error('Failed to fetch seat data');
            }
            const seatData = await seatResponse.json();

            await fetch(`/api/seats/${ticketToCancel.seat_id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    available_seats: seatData.available_seats + ticketToCancel.quantity
                })
            });

            setTickets(tickets.filter(t => t.id !== ticketToCancel.id));
            setShowCancelModal(false);
            setTicketToCancel(null);

        } catch (error) {
            console.error('Cancel error:', error);
            alert('Failed to cancel ticket. Please try again.');
        } finally {
            setCanceling(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (!userData) {
        return (
            <Container className="py-5">
                <Row className="justify-content-center">
                    <Col xs={12} md={8} lg={6}>
                        <Card className="shadow-sm text-center">
                            <Card.Body className="py-5">
                                <h3 className="mb-3">Please Log In</h3>
                                <p className="text-muted">
                                    You need to be logged in to view your tickets.
                                </p>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        );
    }

    return (
        <Container className="my-tickets-container py-4">
            <h1 className="mb-4">My Tickets</h1>

            {loading ? (
                <p>Loading your tickets...</p>
            ) : tickets.length === 0 ? (
                <Row className="justify-content-center">
                    <Col xs={12} md={8} lg={6}>
                        <Card className="shadow-sm text-center">
                            <Card.Body className="py-5">
                                <div className="mb-4">
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
                                <h3 className="mb-3">No Tickets Yet</h3>
                                <p className="text-muted">
                                    You haven't booked any tickets yet. Check out our upcoming events!
                                </p>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            ) : (
                <>
                    <p className="text-muted mb-4">
                        You have {tickets.length} ticket{tickets.length !== 1 ? 's' : ''}
                    </p>
                    <Row xs={1} md={2} lg={3} className="g-4">
                        {tickets.map(ticket => (
                            <Col key={ticket.id}>
                                <div className="ticket-card bg-white shadow-sm overflow-hidden position-relative">
                                    <div className="ticket-header p-4 position-relative">
                                        <div className="d-flex justify-content-between align-items-start">
                                            <div>
                                                <h6 className="text-white mb-1 ticket-label fw-bold text-uppercase">
                                                    MATCH TICKET
                                                </h6>
                                                <h5 className="text-white mb-0 fw-bold">
                                                    THUNDERBOLTS FC
                                                </h5>
                                            </div>
                                            <svg
                                                width="50"
                                                height="50"
                                                viewBox="0 0 100 100"
                                                fill="none"
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="ticket-logo"
                                            >
                                                <circle cx="50" cy="50" r="48" fill="white" stroke="#333" strokeWidth="2" />
                                                <path d="M50 10 L58 32 L78 32 L62 46 L68 66 L50 54 L32 66 L38 46 L22 32 L42 32 Z" fill="#333" />
                                                <path d="M50 10 L42 32 M58 32 L68 46 M78 32 L62 46 M68 66 L50 54 M32 66 L38 46 M22 32 L38 46" stroke="#333" strokeWidth="2" />
                                            </svg>
                                        </div>
                                    </div>

                                    <div className="ticket-perforation bg-white position-relative">
                                        <div className="ticket-perforation-circles"></div>
                                    </div>

                                    <div className="p-4">
                                        <div className="mb-3">
                                            <h4 className="mb-1 ticket-opponent fw-bold text-dark">
                                                vs {ticket.opponent}
                                            </h4>
                                        </div>

                                        <div className="mb-3">
                                            <div className="d-flex justify-content-between align-items-center mb-2 pb-2 ticket-info-row">
                                                <span className="text-muted ticket-info-label text-uppercase">Date</span>
                                                <span className="fw-semibold ticket-info-value">{formatDate(ticket.date)}</span>
                                            </div>
                                            <div className="d-flex justify-content-between align-items-center mb-2 pb-2 ticket-info-row">
                                                <span className="text-muted ticket-info-label text-uppercase">Section</span>
                                                <Badge bg="primary" className="ticket-badge">{ticket.section}</Badge>
                                            </div>
                                            <div className="d-flex justify-content-between align-items-center">
                                                <span className="text-muted ticket-info-label text-uppercase">Quantity</span>
                                                <Badge bg="success" className="ticket-badge">{ticket.quantity} {ticket.quantity === 1 ? 'Ticket' : 'Tickets'}</Badge>
                                            </div>
                                        </div>

                                        <div className="mt-3">
                                            <Button
                                                variant="outline-danger"
                                                size="sm"
                                                className="w-100"
                                                onClick={() => handleCancelClick(ticket)}
                                            >
                                                Cancel Ticket
                                            </Button>
                                        </div>

                                        <div className="text-center mt-3 pt-3 ticket-number-section">
                                            <small className="text-muted ticket-number">
                                                TICKET #{ticket.id.toString().padStart(6, '0')}
                                            </small>
                                        </div>
                                    </div>
                                </div>
                            </Col>
                        ))}
                    </Row>
                </>
            )}

            <Modal show={showCancelModal} onHide={() => setShowCancelModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Cancel Ticket</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {ticketToCancel && (
                        <>
                            <p>Are you sure you want to cancel this ticket?</p>
                            <div className="bg-light p-3 rounded">
                                <strong>Thunderbolts FC vs {ticketToCancel.opponent}</strong>
                                <br />
                                <small className="text-muted">
                                    {formatDate(ticketToCancel.date)}
                                </small>
                                <br />
                                <small className="text-muted">
                                    Section {ticketToCancel.section} • {ticketToCancel.quantity} {ticketToCancel.quantity === 1 ? 'Ticket' : 'Tickets'}
                                </small>
                            </div>
                            <p className="text-danger mt-3 mb-0">
                                <small>This action cannot be undone.</small>
                            </p>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowCancelModal(false)} disabled={canceling}>
                        Keep Ticket
                    </Button>
                    <Button variant="danger" onClick={handleCancelConfirm} disabled={canceling}>
                        {canceling ? 'Canceling...' : 'Cancel Ticket'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
}