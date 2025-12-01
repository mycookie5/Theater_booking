import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, Modal, Spinner, Alert } from 'react-bootstrap';
import useAuthUser from '../hooks/useAuthUser';

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
    const { userData } = useAuthUser();
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

    if (!userData) {
        return (
            <Container fluid className="py-3 py-sm-4 py-md-5 px-2 px-sm-3 px-md-4">
                <Row className="justify-content-center">
                    <Col xs={12} sm={10} md={8} lg={6} xl={5}>
                        <Card className="shadow-sm border-0">
                            <Card.Body className="p-3 p-sm-4 p-md-5 text-center">
                                <div className="mb-3 mb-sm-4">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="48"
                                        height="48"
                                        fill="currentColor"
                                        className="text-primary"
                                        viewBox="0 0 16 16"
                                    >
                                        <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
                                        <path fillRule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1z" />
                                    </svg>
                                </div>
                                <h3 className="mb-2 mb-sm-3 fs-5 fs-sm-4">Please Log In</h3>
                                <p className="text-muted mb-0 small">
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
        <Container fluid className="py-3 py-sm-4 py-md-4 py-lg-5 px-2 px-sm-3 px-md-4">
            <div className="mb-3 mb-sm-4 mb-md-4 mb-lg-5">
                <h1 className="mb-2 mb-sm-3 text-center text-sm-start fs-4 fs-sm-3 fs-md-2">
                    My Tickets
                </h1>
                {!loading && tickets.length > 0 && (
                    <p className="text-muted mb-0 small text-center text-sm-start">
                        You have <strong>{tickets.length}</strong> ticket{tickets.length !== 1 ? 's' : ''}
                    </p>
                )}
            </div>

            {loading ? (
                <div className="text-center py-4 py-sm-5">
                    <Spinner animation="border" variant="primary" className="mb-3" >
                        <span className="visually-hidden">Loading...</span>
                    </Spinner>
                    <p className="text-muted small">Loading your tickets...</p>
                </div>
            ) : tickets.length === 0 ? (
                <Row className="justify-content-center">
                    <Col xs={12} sm={10} md={8} lg={6} xl={5}>
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
                                <h3 className="mb-2 mb-sm-3 fs-5 fs-sm-4">No Tickets Yet</h3>
                                <p className="text-muted mb-0 small">
                                    You haven't booked any tickets yet. Check out our upcoming events!
                                </p>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            ) : (
                <Row xs={1} sm={1} md={2} lg={3} xl={3} className="g-3 g-sm-3 g-md-4 row-cols-xl-3">
                    {tickets.map(ticket => (
                        <Col key={ticket.id}>
                            <Card className="h-100 shadow-sm border-0 overflow-hidden">
                                {/* Header Section */}
                                <div className="bg-primary text-white p-3 p-sm-4">
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div className="flex-grow-1">
                                            <Badge bg="light" text="dark" className="mb-2 px-2 py-1 small fw-semibold">
                                                MATCH TICKET
                                            </Badge>
                                            <h5 className="mb-0 fw-bold fs-6 fs-sm-5">
                                                THUNDERBOLTS FC
                                            </h5>
                                        </div>
                                        <div className="ms-2">
                                            <div className="bg-white rounded-circle d-flex align-items-center justify-content-center"
                                            >
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

                                    <div className="d-grid gap-2 mt-3">
                                        <Button
                                            variant="outline-danger"
                                            size="lg"
                                            onClick={() => handleCancelClick(ticket)}
                                        >
                                            Cancel Ticket
                                        </Button>
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

            {/* Cancel Modal */}
            <Modal
                show={showCancelModal}
                onHide={() => setShowCancelModal(false)}
                centered
                fullscreen="sm-down"
            >
                <Modal.Header closeButton className="border-bottom bg-danger text-white">
                    <Modal.Title className="fs-5 fs-sm-4">Cancel Ticket</Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-3 p-sm-4">
                    {ticketToCancel && (
                        <>
                            <p className="fw-semibold mb-3">Are you sure you want to cancel this ticket?</p>
                            <Card className="bg-light border-0 mb-3">
                                <Card.Body className="p-3">
                                    <h6 className="mb-2 fw-bold">
                                        Thunderbolts FC vs {ticketToCancel.opponent}
                                    </h6>
                                    <div className="d-flex flex-column gap-2 small">
                                        <div>
                                            <span className="text-muted">Date:</span>{' '}
                                            <span className="fw-semibold">{formatDate(ticketToCancel.date)}</span>
                                        </div>
                                        <div>
                                            <span className="text-muted">Section:</span>{' '}
                                            <Badge bg="primary">{ticketToCancel.section}</Badge>
                                        </div>
                                        <div>
                                            <span className="text-muted">Quantity:</span>{' '}
                                            <Badge bg="success">{ticketToCancel.quantity} {ticketToCancel.quantity === 1 ? 'Ticket' : 'Tickets'}</Badge>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                            <Alert variant="warning" className="mb-0 small">
                                <strong>Warning:</strong> This action cannot be undone.
                            </Alert>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer className="d-flex flex-column-reverse flex-sm-row gap-2 p-3 p-sm-4 border-top">
                    <Button
                        variant="secondary"
                        onClick={() => setShowCancelModal(false)}
                        disabled={canceling}
                        className="w-100 w-sm-auto"
                        size="lg"
                    >
                        Keep Ticket
                    </Button>
                    <Button
                        variant="danger"
                        onClick={handleCancelConfirm}
                        disabled={canceling}
                        className="w-100 w-sm-auto"
                        size="lg"
                    >
                        {canceling ? (
                            <>
                                <Spinner
                                    as="span"
                                    animation="border"
                                    size="sm"
                                    role="status"
                                    aria-hidden="true"
                                    className="me-2"
                                />
                                Canceling...
                            </>
                        ) : (
                            'Cancel Ticket'
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
}