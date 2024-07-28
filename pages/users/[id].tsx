import { useRouter } from "next/router";
import UserForm from "@/components/UserForm";
import User from "@/models/User";

const EditUserPage = () => {
  const router = useRouter();
  const { id } = router.query;

  return <div>{id && <UserForm userId={id as string} />}</div>;
};

export default EditUserPage;
