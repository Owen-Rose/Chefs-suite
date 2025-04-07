import { Message } from "@mui/icons-material";

export const logger = {
    info: (message: string, data?: any) => {
        console.log(`[INFO] ${message}`, data ? data : '');
    },
    error: (message: string, data?: any) => {
        console.error(`[ERROR] ${message}`, data ? data : '');
    },
    warn: (message: string, data?: any) => {
        console.log(`[WARNING] ${message}`, data ? data : '');
    }
};