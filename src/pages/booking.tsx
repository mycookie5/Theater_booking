import { useState, useRef, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Modal } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import useAuthUser from '../hooks/useAuthUser';

Booking.route = {
    path: '/booking/:id',
    menuLabel: 'Booking',
};

interface MatchInfo {
    event_id: number;
    seat_id: number;
    unique_id: string;
    section: string;
    available_seats: number;
    date: string;
    Opponent: string;
    price: number;
}

export default function Booking() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { userData } = useAuthUser();
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [selectedSection, setSelectedSection] = useState<string | null>(null);
    const [seatCount, setSeatCount] = useState<number>(0);
    const [matchInfo, setMatchInfo] = useState<MatchInfo[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [booking, setBooking] = useState<boolean>(false);
    const [bookingSuccess, setBookingSuccess] = useState<boolean>(false);
    const [bookingError, setBookingError] = useState<string | null>(null);

    // Get match details (date, opponent) from first item
    const matchDetails = matchInfo.length > 0 ? {
        date: matchInfo[0].date,
        opponent: matchInfo[0].Opponent
    } : null;

    useEffect(() => {
        fetch('/api/match_info')
            .then(res => res.ok ? res.json() : [])
            .then((data: MatchInfo[]) => {
                console.log('API Response:', data);
                console.log('URL param id:', id);
                const eventId = parseInt(id || '0', 10);
                console.log('Parsed eventId:', eventId);
                console.log('Data for this event:', data.filter(seat => seat.event_id === eventId));
                const availableSeats = data
                    .filter(seat => seat.event_id === eventId)
                    .sort((a, b) => {
                        const aRow = a.section.charAt(0);
                        const bRow = b.section.charAt(0);
                        if (aRow !== bRow) return aRow.localeCompare(bRow);
                        const aNum = parseInt(a.section.slice(1), 10);
                        const bNum = parseInt(b.section.slice(1), 10);
                        return aNum - bNum;
                    });
                console.log('Available seats after filtering:', availableSeats);
                setMatchInfo(availableSeats);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching match info:', err);
                setLoading(false);
            });
    }, [id]);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollAmount = 108;
            const newScrollPosition = direction === 'left'
                ? scrollContainerRef.current.scrollLeft - scrollAmount
                : scrollContainerRef.current.scrollLeft + scrollAmount;

            scrollContainerRef.current.scrollTo({
                left: newScrollPosition,
                behavior: 'smooth'
            });
        }
    };

    const handleSectionSelect = (sectionName: string) => {
        setSelectedSection(sectionName);
        setSeatCount(0);
    };

    const getMaxSeats = (): number => {
        if (!selectedSection) return 0;
        const seat = matchInfo.find(s => s.section === selectedSection);
        return seat ? seat.available_seats : 0;
    };

    const getSectionPrice = (): number => {
        if (!selectedSection) return 0;
        const seat = matchInfo.find(s => s.section === selectedSection);
        return seat ? seat.price : 0;
    };

    const getTotalPrice = (): number => {
        return getSectionPrice() * seatCount;
    };

    const incrementSeatCount = () => {
        const max = getMaxSeats();
        setSeatCount(prev => Math.min(max, prev + 1));
    };

    const decrementSeatCount = () => {
        setSeatCount(prev => Math.max(0, prev - 1));
    };

    const handleBooking = async () => {
        if (!selectedSection || seatCount === 0 || !userData || !id) return;

        setBooking(true);
        setBookingError(null);

        try {
            const selectedSeat = matchInfo.find(s => s.section === selectedSection);
            if (!selectedSeat) return;

            const ticketData = {
                event_id: parseInt(id),
                user_id: userData.id,
                seat_id: selectedSeat.seat_id,
                quantity: seatCount
            };

            console.log('Creating ticket with data:', ticketData);

            const ticketResponse = await fetch('/api/tickets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(ticketData)
            });

            if (!ticketResponse.ok) {
                const errorText = await ticketResponse.text();
                console.error('Ticket creation failed:', errorText);
                throw new Error('Failed to create ticket');
            }

            console.log('Ticket created successfully');

            await fetch(`/api/seats/${selectedSeat.seat_id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    available_seats: selectedSeat.available_seats - seatCount
                })
            });

            setBookingSuccess(true);

        } catch (error) {
            console.error('Booking error:', error);
            setBookingError('Booking failed');
        } finally {
            setBooking(false);
        }
    };

    if (!userData) {
        return (
            <Container className="py-5">
                <Row className="justify-content-center">
                    <Col xs={12} md={8} lg={6}>
                        <Card className="shadow-sm text-center">
                            <Card.Body className="py-5">
                                <h3 className="mb-3">Access Restricted</h3>
                                <p className="text-muted mb-4">
                                    Please log in to book tickets for this event.
                                </p>
                                <Button
                                    variant="primary"
                                    size="lg"
                                    onClick={() => navigate('/login')}
                                >
                                    Log In
                                </Button>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        );
    }

    return (
        <Container className="py-5">
            <Modal show={bookingSuccess} onHide={() => { setBookingSuccess(false); navigate('/mytickets'); }} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Booking Successful!</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Your tickets have been booked successfully.
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="success" onClick={() => { setBookingSuccess(false); navigate('/mytickets'); }}>
                        OK
                    </Button>
                </Modal.Footer>
            </Modal>

            <Modal show={!!bookingError} onHide={() => setBookingError(null)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Booking Failed</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {bookingError}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="danger" onClick={() => setBookingError(null)}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>

            <Row className="mb-4">
                <Col xs={12}>
                    <Card className="shadow-sm">
                        <Card.Header as="h5" className="bg-primary text-white">
                            Stadium Seating Map
                        </Card.Header>
                        <Card.Body className="text-center p-3">
                            <img
                                src="/images/stadium-map.png"
                                alt="Stadium Seating Map"
                                className="img-fluid w-100 stadium-map-img"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    target.parentElement!.innerHTML = `
                                        <div class="bg-light d-flex align-items-center justify-content-center stadium-placeholder" 
                                             style="height: 300px; border: 2px dashed #ccc; border-radius: 8px;">
                                            <div class="text-center text-muted">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="currentColor" viewBox="0 0 16 16">
                                                    <path d="M6.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/>
                                                    <path d="M2.002 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2h-12zm12 1a1 1 0 0 1 1 1v6.5l-3.777-1.947a.5.5 0 0 0-.577.093l-3.71 3.71-2.66-1.772a.5.5 0 0 0-.63.062L1.002 12V3a1 1 0 0 1 1-1h12z"/>
                                                </svg>
                                                <p class="mt-2 mb-0">Stadium Seating Map</p>
                                                <small>Image placeholder</small>
                                            </div>
                                        </div>
                                    `;
                                }}
                            />
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row className="mb-4">
                <Col>
                    {matchDetails && (
                        <Card className="shadow-sm mb-4">
                            <Card.Body>
                                <h2 className="mb-3">Match Information</h2>
                                <Row>
                                    <Col md={6}>
                                        <p className="mb-2">
                                            <strong>Opponent:</strong> {matchDetails.opponent}
                                        </p>
                                    </Col>
                                    <Col md={6}>
                                        <p className="mb-2">
                                            <strong>Date:</strong> {new Date(matchDetails.date).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </p>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    )}
                    <Card className="shadow-sm">
                        <Card.Body>
                            <h3 className="mb-4">Select Your Seats</h3>
                            {loading ? (
                                <p className="text-center text-muted">Loading available sections...</p>
                            ) : matchInfo.length === 0 ? (
                                <p className="text-center text-muted">No available sections for this event.</p>
                            ) : (
                                <>
                                    <div className="d-flex align-items-center gap-2 gap-md-3">
                                        <Button
                                            variant="outline-primary"
                                            onClick={() => scroll('left')}
                                            className="flex-shrink-0 d-flex align-items-center justify-content-center scroll-btn"
                                            aria-label="Scroll left"
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="24"
                                                height="24"
                                                fill="currentColor"
                                                viewBox="0 0 16 16"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"
                                                />
                                            </svg>
                                        </Button>

                                        <div
                                            ref={scrollContainerRef}
                                            className="d-flex gap-2 overflow-hidden flex-grow-1 scroll-container"
                                        >
                                            {matchInfo.map((seat) => (
                                                <Button
                                                    key={seat.unique_id}
                                                    variant={selectedSection === seat.section ? 'primary' : seat.available_seats === 0 ? 'secondary' : 'outline-secondary'}
                                                    onClick={() => handleSectionSelect(seat.section)}
                                                    disabled={seat.available_seats === 0}
                                                    className="flex-shrink-0 d-flex flex-column align-items-center justify-content-center seat-btn rounded-2"
                                                >
                                                    <span className="fw-bold fs-5">
                                                        {seat.section}
                                                    </span>
                                                    <small
                                                        className={`${selectedSection === seat.section ? 'text-white-50' : seat.available_seats === 0 ? 'text-white-50' : 'text-muted'} seat-info`}
                                                    >
                                                        {seat.available_seats === 0 ? 'Sold Out' : `${seat.available_seats} seats`}
                                                    </small>
                                                    {seat.price > 0 && (
                                                        <small
                                                            className={`${selectedSection === seat.section ? 'text-white' : seat.available_seats === 0 ? 'text-white-50' : 'text-success'} fw-bold seat-price`}
                                                        >
                                                            ${seat.price}
                                                        </small>
                                                    )}
                                                    {seat.price === 0 && (
                                                        <small
                                                            className={`${selectedSection === seat.section ? 'text-white' : seat.available_seats === 0 ? 'text-white-50' : 'text-success'} fw-bold seat-price`}
                                                        >
                                                            FREE
                                                        </small>
                                                    )}
                                                </Button>
                                            ))}
                                        </div>

                                        <Button
                                            variant="outline-primary"
                                            onClick={() => scroll('right')}
                                            className="flex-shrink-0 d-flex align-items-center justify-content-center scroll-btn"
                                            aria-label="Scroll right"
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="24"
                                                height="24"
                                                fill="currentColor"
                                                viewBox="0 0 16 16"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"
                                                />
                                            </svg>
                                        </Button>
                                    </div>

                                    {selectedSection && (
                                        <div className="text-center mt-4">
                                            <p className="mb-2 text-muted">Number of seats to book:</p>
                                            <div className="d-flex justify-content-center align-items-center gap-3">
                                                <Button
                                                    variant="outline-secondary"
                                                    onClick={decrementSeatCount}
                                                    disabled={seatCount === 0}
                                                    className="seat-counter-btn fs-3"
                                                >
                                                    -
                                                </Button>
                                                <span className="fs-4 fw-bold seat-count-display text-center">
                                                    {seatCount}
                                                </span>
                                                <Button
                                                    variant="outline-secondary"
                                                    onClick={incrementSeatCount}
                                                    disabled={seatCount >= getMaxSeats()}
                                                    className="seat-counter-btn fs-3"
                                                >
                                                    +
                                                </Button>
                                            </div>
                                            <small className="text-muted mt-2 d-block">
                                                {getMaxSeats()} seats available in {selectedSection}
                                            </small>
                                            {getSectionPrice() > 0 && seatCount > 0 && (
                                                <div className="mt-3">
                                                    <h5 className="text-success">
                                                        Total: ${getTotalPrice()}
                                                    </h5>
                                                    <small className="text-muted">
                                                        ${getSectionPrice()} per seat
                                                    </small>
                                                </div>
                                            )}
                                            {getSectionPrice() === 0 && seatCount > 0 && (
                                                <div className="mt-3">
                                                    <h5 className="text-success">
                                                        FREE
                                                    </h5>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="mt-3 d-flex flex-wrap gap-3 justify-content-center">
                                        {Array.from(new Set(matchInfo.map(s => s.section.charAt(0)))).sort().map(row => (
                                            <div key={row} className="d-flex align-items-center gap-2">
                                                <span
                                                    className={`badge ${row === 'A' ? 'bg-info' : 'bg-warning'} row-badge`}
                                                ></span>
                                                <small className="text-muted">
                                                    Row {row} ({matchInfo.filter(s => s.section.charAt(0) === row).length} sections)
                                                </small>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row>
                <Col xs={12} md={6} lg={4} className="mx-auto">
                    <Button
                        variant="success"
                        size="lg"
                        className="w-100"
                        disabled={!selectedSection || seatCount === 0 || booking}
                        onClick={handleBooking}
                    >
                        {booking
                            ? 'Booking...'
                            : selectedSection && seatCount > 0
                                ? `Book ${seatCount} seat${seatCount > 1 ? 's' : ''} in ${selectedSection}${getTotalPrice() > 0 ? ` - $${getTotalPrice()}` : ' - FREE'}`
                                : 'Select Section and Seats'}
                    </Button>
                </Col>
            </Row>
        </Container>
    );
}