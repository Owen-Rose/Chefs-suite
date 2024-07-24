import {
  createContext,
  useState,
  useEffect,
  ReactNode,
  Dispatch,
  SetStateAction,
} from "react";

// Define the User type based on the expected structure of user data
type UserType = {
  // Define the properties of the user object, e.g.:
  id: string;
  name: string;
  email: string;
  // Add more properties as needed
};

// Define the UserContext type
type UserContextType = {
  user: UserType[];
  setUser: Dispatch<SetStateAction<UserType[]>>;
};

// Initialize UserContext with the correct type
const UserContext = createContext<UserContextType | null>(null);

interface UserProviderProps {
  children: ReactNode;
}

const UserProvider = ({ children }: UserProviderProps) => {
  const [user, setUser] = useState<UserType[]>([]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("/api/user");
        const data = await response.json();
        setUser(data);
      } catch (error) {
        console.error("Error fetching user: ", error);
      }
    };

    fetchUser();
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

export { UserContext, UserProvider };
