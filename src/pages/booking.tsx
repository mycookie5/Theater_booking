import { useState, useRef, useEffect } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import authUser from '../hooks/authUser';

Booking.route = {
    path: '/booking/:id',
    menuLabel: 'Booking',
};

interface Seat {
    id: number;
    event_id: number;
    total_seats: number;
    section: string;
    available_seats: number;
}

export default function Booking() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { userData } = authUser();
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [selectedSection, setSelectedSection] = useState<string | null>(null);
    const [seatCount, setSeatCount] = useState<number>(0);
    const [seats, setSeats] = useState<Seat[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        fetch('/api/seats')
            .then(res => res.ok ? res.json() : [])
            .then((data: Seat[]) => {
                const eventId = parseInt(id || '0', 10);
                const availableSeats = data
                    .filter(seat => seat.event_id === eventId && seat.available_seats > 0)
                    .sort((a, b) => {
                        const aRow = a.section.charAt(0);
                        const bRow = b.section.charAt(0);
                        if (aRow !== bRow) return aRow.localeCompare(bRow);
                        const aNum = parseInt(a.section.slice(1), 10);
                        const bNum = parseInt(b.section.slice(1), 10);
                        return aNum - bNum;
                    });
                setSeats(availableSeats);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching seats:', err);
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
        const seat = seats.find(s => s.section === selectedSection);
        return seat ? seat.available_seats : 0;
    };

    const incrementSeatCount = () => {
        const max = getMaxSeats();
        setSeatCount(prev => Math.min(max, prev + 1));
    };

    const decrementSeatCount = () => {
        setSeatCount(prev => Math.max(0, prev - 1));
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
                                    Go to Login
                                </Button>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        );
    }

    return (
        <Container className="booking-page-container py-4">
            <h1 className="mb-4">Book Your Seats</h1>
            <p className="text-muted mb-4">Event ID: {id}</p>

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
                                className="img-fluid"
                                style={{
                                    maxHeight: '400px',
                                    objectFit: 'contain',
                                    width: '100%'
                                }}
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    target.parentElement!.innerHTML = `
                                        <div class="bg-light d-flex align-items-center justify-content-center" 
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
                <Col xs={12}>
                    <Card className="shadow-sm">
                        <Card.Header as="h5" className="bg-secondary text-white">
                            Select Your Section
                        </Card.Header>
                        <Card.Body>
                            {selectedSection && (
                                <div className="alert alert-success mb-3" role="alert">
                                    <strong>Selected Section:</strong> {selectedSection}
                                </div>
                            )}

                            {loading ? (
                                <p className="text-center text-muted">Loading available sections...</p>
                            ) : seats.length === 0 ? (
                                <p className="text-center text-muted">No available sections for this event.</p>
                            ) : (
                                <>
                                    <div className="d-flex align-items-center gap-2 gap-md-3">
                                        <Button
                                            variant="outline-primary"
                                            onClick={() => scroll('left')}
                                            className="flex-shrink-0 d-flex align-items-center justify-content-center"
                                            style={{ width: '48px', height: '48px' }}
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
                                            className="d-flex gap-2 overflow-hidden flex-grow-1"
                                            style={{
                                                scrollBehavior: 'smooth',
                                                overflowX: 'auto',
                                                scrollbarWidth: 'none',
                                                msOverflowStyle: 'none'
                                            }}
                                        >
                                            {seats.map((seat) => (
                                                <Button
                                                    key={seat.id}
                                                    variant={selectedSection === seat.section ? 'primary' : 'outline-secondary'}
                                                    onClick={() => handleSectionSelect(seat.section)}
                                                    className="flex-shrink-0 d-flex flex-column align-items-center justify-content-center"
                                                    style={{
                                                        minWidth: '100px',
                                                        height: '70px',
                                                        borderRadius: '8px'
                                                    }}
                                                >
                                                    <span
                                                        className="fw-bold"
                                                        style={{ fontSize: '1.1rem' }}
                                                    >
                                                        {seat.section}
                                                    </span>
                                                    <small
                                                        className={selectedSection === seat.section ? 'text-white-50' : 'text-muted'}
                                                        style={{ fontSize: '0.6rem', textAlign: 'center' }}
                                                    >
                                                        {seat.available_seats} seats available
                                                    </small>
                                                </Button>
                                            ))}
                                        </div>

                                        <Button
                                            variant="outline-primary"
                                            onClick={() => scroll('right')}
                                            className="flex-shrink-0 d-flex align-items-center justify-content-center"
                                            style={{ width: '48px', height: '48px' }}
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
                                                    style={{ width: '48px', height: '48px', fontSize: '1.5rem' }}
                                                >
                                                    -
                                                </Button>
                                                <span className="fs-4 fw-bold" style={{ minWidth: '60px', textAlign: 'center' }}>
                                                    {seatCount}
                                                </span>
                                                <Button
                                                    variant="outline-secondary"
                                                    onClick={incrementSeatCount}
                                                    disabled={seatCount >= getMaxSeats()}
                                                    style={{ width: '48px', height: '48px', fontSize: '1.5rem' }}
                                                >
                                                    +
                                                </Button>
                                            </div>
                                            <small className="text-muted mt-2 d-block">
                                                {getMaxSeats()} seats available in {selectedSection}
                                            </small>
                                        </div>
                                    )}

                                    <div className="mt-3 d-flex flex-wrap gap-3 justify-content-center">
                                        {Array.from(new Set(seats.map(s => s.section.charAt(0)))).sort().map(row => (
                                            <div key={row} className="d-flex align-items-center gap-2">
                                                <span
                                                    className={`badge ${row === 'A' ? 'bg-info' : 'bg-warning'}`}
                                                    style={{ width: '20px', height: '20px' }}
                                                ></span>
                                                <small className="text-muted">
                                                    Row {row} ({seats.filter(s => s.section.charAt(0) === row).length} sections)
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
                        disabled={!selectedSection || seatCount === 0}
                    >
                        {selectedSection && seatCount > 0
                            ? `Book ${seatCount} seat${seatCount > 1 ? 's' : ''} in ${selectedSection}`
                            : 'Select Section and Seats'}
                    </Button>
                </Col>
            </Row>
        </Container>
    );
}