import { useToast } from "@/hooks/use-toast";

export const useNotify = () => {
    const { toast } = useToast();

    const success = (message: string) => {
        toast({
            title: "Success",
            description: message,
            variant: "default",
        });
    };

    const error = (message: string) => {
        toast({
            title: "Error",
            description: message,
            variant: "destructive",
        });
    };

    const info = (message: string) => {
        toast({
            description: message,
        });
    };

    return { success, error, info };
};