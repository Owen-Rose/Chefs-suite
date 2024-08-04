import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { ComponentType } from "react";

export function withAuth<P>(
  WrappedComponent: ComponentType<P>,
  allowedRoles: string[]
) {
  return (props: P) => {
    const { data: session, status } = useSession();
    const router = useRouter();

    if (status === "loading") {
      return <p>Loading...</p>;
    }

    if (!session || !allowedRoles.includes(session.user.role)) {
      router.push("/login");
      return null;
    }

    return <WrappedComponent {...props} />;
  };
}
