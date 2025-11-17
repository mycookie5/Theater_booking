import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Container, Nav, Navbar } from 'react-bootstrap';
import routes from '../routes';
import menuChoicesPerUserRole from '../menuChoicePerUserRole';

export default function Header({ user }: { user: any; }) {

    const userRole = user.role || 'visitor';
    const email = user.email;
    const menuChoicesToShow = (menuChoicesPerUserRole as any)[userRole];
    const [expanded, setExpanded] = useState(false);

    const pathName = useLocation().pathname;
    const currentRoute = routes
        .slice().sort((a, b) => a.path.length > b.path.length ? -1 : 1)
        .find(x => pathName.indexOf(x.path.split(':')[0]) === 0);

    const isActive = (path: string) =>
        path === currentRoute?.path || path === currentRoute?.parent;

    return <header>
        <Navbar
            expanded={expanded}
            expand="md"
            className="bg-primary"
            data-bs-theme="light"
            fixed="top"
        >
            <Container fluid>
                <Navbar.Brand className="me-5" as={Link} to="/">
                    Thunderbolts FC
                </Navbar.Brand>
                <Navbar.Toggle onClick={() => setExpanded(!expanded)} />
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="me-auto">
                        {routes
                            .filter(x => x.menuLabel)
                            .filter(x => menuChoicesToShow.includes(x.menuLabel))
                            .map(
                                ({ menuLabel, path }, i) =>
                                    <Nav.Link
                                        as={Link} key={i} to={path}
                                        className={isActive(path) ? 'active' : ''}
                                        onClick={() => setTimeout(() => setExpanded(false), 200)}
                                    >{menuLabel}</Nav.Link>
                            )}
                    </Nav>
                    {!email ? null :
                        <div className="email float-md-end mt-1 mt-md-0 text-muted">
                            {email} ({user.role})
                        </div>}
                </Navbar.Collapse>
            </Container>
        </Navbar>
    </header>;
}