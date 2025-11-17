import { Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

Home.route = {
    path: '/',
    menuLabel: 'Home',
    index: 10
};
export default function Home() {
    const navigate = useNavigate();

    return <div className="home-page-container">
        <img
            src="../../public/images/sport/homepage-image.jpg"
            alt="Players Celebrating"
            className="img-fluid w-100 w-sm-75 w-md-50 w-lg-50 w-xl-50 w-xxl-50 mb-4"
        />
        <h1>Welcome to the Thunderbolts FC Ticketing Platform</h1>
        <Button
            className="mb-3"
            variant="primary"
            size="lg"
            onClick={() => navigate('/events')}
        >
            Browse Upcoming Events
        </Button>
        <p>Your one-stop destination for all Thunderbolts FC event tickets. Browse, select, and purchase tickets for your favorite football team with ease.</p>
    </div>;
}