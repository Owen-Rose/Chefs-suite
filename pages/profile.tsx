import React from 'react';
import Profile from '../components/Profile';
import ProtectedRoute from '../components/ProtectedRoute';

const ProfilePage: React.FC = () => {
    return (
        <ProtectedRoute>
            <Profile />
        </ProtectedRoute>
    );
};

export default ProfilePage;