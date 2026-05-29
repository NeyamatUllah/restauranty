import { useState, useEffect, useContext } from "react";
import { FaTrashCan } from "react-icons/fa6";
import { AuthContext } from "../../../../context/auth.context";
import authService from "../../../../services/auth.service";

function UsersPageList() {
    const [users, setUsers] = useState([]);
    const [error, setError] = useState(null);
    const { user: currentUser } = useContext(AuthContext);

    useEffect(() => {
        authService.getUsers()
            .then((response) => setUsers(response.data))
            .catch((err) => setError("Failed to load users."));
    }, []);

    function toggleRole(user) {
        const updated = { ...user, role: user.role === "admin" ? "user" : "admin" };
        authService.updateUser(updated)
            .then((response) => {
                setUsers((prev) => prev.map((u) => u._id === response.data._id ? response.data : u));
            })
            .catch(() => setError("Failed to update user role."));
    }

    function deleteUser(id) {
        authService.deleteUser(id)
            .then(() => setUsers((prev) => prev.filter((u) => u._id !== id)))
            .catch(() => setError("Failed to delete user."));
    }

    return (
        <div>
            <h1>Users</h1>
            {error && <p className="error-message">{error}</p>}
            <div className="page-container">
                <table className="centered-table text-sm text-gray-800">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Role</th>
                            <th colSpan="2">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user._id}>
                                <td>{user.name} {user.surname}</td>
                                <td>{user.email}</td>
                                <td>{user.phoneNumber || "—"}</td>
                                <td>
                                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${user.role === "admin" ? "bg-primary-50 text-primary-700" : "bg-gray-100 text-gray-600"}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td>
                                    <button
                                        className="button-acoes-edit"
                                        onClick={() => toggleRole(user)}
                                        disabled={user._id === currentUser?._id}
                                        title={user._id === currentUser?._id ? "Cannot change your own role" : `Make ${user.role === "admin" ? "user" : "admin"}`}
                                    >
                                        {user.role === "admin" ? "→ user" : "→ admin"}
                                    </button>
                                </td>
                                <td>
                                    <button
                                        className="button-acoes-delete"
                                        onClick={() => deleteUser(user._id)}
                                        disabled={user._id === currentUser?._id}
                                        title={user._id === currentUser?._id ? "Cannot delete yourself" : "Delete user"}
                                    >
                                        <FaTrashCan />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default UsersPageList;
