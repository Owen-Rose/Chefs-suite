// pages/register.tsx
import React from "react";
import Head from "next/head";
import RegistrationCompletion from "../components/RegistrationCompletion";

const RegisterPage: React.FC = () => {
    return (
        <>
            <Head>
                <title>Complete Registration</title>
                <meta name="description" content="Complete your registration" />
            </Head>
            <RegistrationCompletion />
        </>
    );
};

export default RegisterPage;