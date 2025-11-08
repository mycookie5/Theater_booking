import { Outlet } from 'react-router-dom';
import { Container } from 'react-bootstrap';

export default function Main() {

    return <main className="mt-5">
        <Container className="mt-5 mb-4">
            <Outlet />
        </Container>
    </main>;
}