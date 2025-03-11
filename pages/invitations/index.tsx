// pages/invitations/index.tsx
import React from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import InvitationManagement from "../../components/InvitationManagement";
import ProtectedRoute from "../../components/ProtectedRoute";
import { Permission } from "../../types/Permission";

const InvitationsPage: React.FC = () => {
    return (
        <ProtectedRoute requiredPermission={Permission.CREATE_USERS}>
            <Head>
                <title>Invitation Management</title>
                <meta name="description" content="Manage user invitations" />
            </Head>
            <InvitationManagement />
        </ProtectedRoute>
    );
};

export default InvitationsPage;