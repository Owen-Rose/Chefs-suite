import { Logger } from '../utils/logger'

export class MonitoringService {
    // Track import metrics
    static trackImport(metrics: {
        userId: string
        duration: number
        totalRecords: number
        successCount: number
        errorCount: number
        fileSize: number
    }): void {
        // Record metrics
        Logger.info('Recipe import completed', {
            type: 'RECIPE_IMPORT',
            ...metrics
        })

        // In production, send metrics to monitoring system
        // e.g., Prometheus, CloudWatch, etc.
    }

    // Monitor API performance
    static trackApiPerformance(endpoint: string, duration: number, statusCode: number): void {
        Logger.debug('API performance', {
            endpoint,
            duration,
            statusCode
        })
    }
}