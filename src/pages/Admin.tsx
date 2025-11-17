import authUser from '../hooks/authUser';

Admin.route = {
    path: '/admin',
    menuLabel: 'Admin',
    index: 10
};

export default function Admin() {
    const { isUserAdmin } = authUser();

    if (!isUserAdmin) {
        return <div>Access denied. You do not have permission to view this page.</div>;
    }
    return <div>Welcome to the Admin Page!</div>;
}
