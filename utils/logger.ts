export enum LogLevel {
    DEBUG = 'debug',
    INFO = 'info',
    WARN = 'warn',
    ERROR = 'error'
}

export class Logger {
    static log(level: LogLevel, message: string, metadata?: any): void {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            message,
            ...metadata
        };

        console.log(JSON.stringify(logEntry));

        // In production, you could send logs to a service like CloudWatch, Datadog, etc.
        if (process.env.NODE_ENV === 'production') {
            // Send to external logging service
            // e.g., sendToLogService(logEntry);
        }
    }

    static debug(message: string, metadata?: any): void {
        this.log(LogLevel.DEBUG, message, metadata);
    }

    static info(message: string, metadata?: any): void {
        this.log(LogLevel.INFO, message, metadata);
    }

    static warn(message: string, metadata?: any): void {
        this.log(LogLevel.WARN, message, metadata);
    }

    static error(message: string, metadata?: any): void {
        this.log(LogLevel.ERROR, message, metadata);
    }
}