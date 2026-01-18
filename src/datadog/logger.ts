/**
 * Datadog Structured Logger with Trace Correlation
 *
 * Provides JSON-formatted logging with automatic trace/span ID injection
 * for correlation with Datadog APM traces.
 */

import type { DatadogConfig, LogLevel, LogContext, StructuredLog } from './types.js';
import { getTraceContext } from './tracer.js';

let config: DatadogConfig | null = null;
let initialized = false;
let minLogLevel: LogLevel = 'info';

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * Initialize the structured logger
 */
export function initLogger(datadogConfig: DatadogConfig, logLevel: LogLevel = 'info'): void {
  if (initialized) {
    console.warn('[Datadog] Logger already initialized');
    return;
  }

  config = datadogConfig;
  minLogLevel = logLevel;

  if (!datadogConfig.logsEnabled) {
    console.log('[Datadog] Structured logging disabled');
    initialized = true;
    return;
  }

  console.log(`[Datadog] Structured logger initialized (level: ${logLevel})`);
  initialized = true;
}

/**
 * Check if logger is initialized
 */
export function isLoggerInitialized(): boolean {
  return initialized;
}

/**
 * Set the minimum log level
 */
export function setLogLevel(level: LogLevel): void {
  minLogLevel = level;
}

/**
 * Check if a log level should be logged
 */
function shouldLog(level: LogLevel): boolean {
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[minLogLevel];
}

/**
 * Create a structured log entry
 */
function createLogEntry(
  level: LogLevel,
  message: string,
  context?: LogContext
): StructuredLog {
  const traceContext = getTraceContext();

  const entry: StructuredLog = {
    timestamp: new Date().toISOString(),
    level,
    message,
    service: config?.service ?? 'flowguard',
    env: config?.env ?? 'development',
    ...(config?.version && { version: config.version }),
  };

  // Add Datadog trace correlation
  if (traceContext.traceId || traceContext.spanId) {
    entry.dd = {
      ...(traceContext.traceId && { trace_id: traceContext.traceId }),
      ...(traceContext.spanId && { span_id: traceContext.spanId }),
    };
  }

  // Add custom context
  if (context) {
    entry.context = context;
  }

  return entry;
}

/**
 * Output a log entry to console (JSON format for Datadog ingestion)
 */
function outputLog(entry: StructuredLog): void {
  // Output as JSON for Datadog log ingestion
  const jsonOutput = JSON.stringify(entry);

  switch (entry.level) {
    case 'debug':
      console.debug(jsonOutput);
      break;
    case 'info':
      console.info(jsonOutput);
      break;
    case 'warn':
      console.warn(jsonOutput);
      break;
    case 'error':
      console.error(jsonOutput);
      break;
  }
}

/**
 * Log a debug message
 */
export function debug(message: string, context?: LogContext): void {
  if (!shouldLog('debug')) return;
  outputLog(createLogEntry('debug', message, context));
}

/**
 * Log an info message
 */
export function info(message: string, context?: LogContext): void {
  if (!shouldLog('info')) return;
  outputLog(createLogEntry('info', message, context));
}

/**
 * Log a warning message
 */
export function warn(message: string, context?: LogContext): void {
  if (!shouldLog('warn')) return;
  outputLog(createLogEntry('warn', message, context));
}

/**
 * Log an error message
 */
export function error(message: string, context?: LogContext): void {
  if (!shouldLog('error')) return;
  outputLog(createLogEntry('error', message, context));
}

/**
 * Log an error with stack trace
 */
export function logError(err: Error, message?: string, context?: LogContext): void {
  if (!shouldLog('error')) return;

  const entry = createLogEntry('error', message ?? err.message, {
    ...context,
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack,
    },
  });

  outputLog(entry);
}

// ============================================
// Domain-Specific Logging
// ============================================

/**
 * Log flow execution start
 */
export function logFlowStart(flowName: string, executionMode: 'local' | 'cloud', context?: LogContext): void {
  info(`Starting flow execution: ${flowName}`, {
    flowName,
    executionMode,
    ...context,
  });
}

/**
 * Log flow execution complete
 */
export function logFlowComplete(
  flowName: string,
  verdict: 'pass' | 'fail' | 'error',
  durationMs: number,
  context?: LogContext
): void {
  const level: LogLevel = verdict === 'pass' ? 'info' : verdict === 'fail' ? 'warn' : 'error';
  const entry = createLogEntry(level, `Flow execution complete: ${flowName} (${verdict})`, {
    flowName,
    verdict,
    durationMs,
    ...context,
  });
  outputLog(entry);
}

/**
 * Log step execution
 */
export function logStepExecution(
  flowName: string,
  stepIndex: number,
  action: string,
  success: boolean,
  durationMs: number,
  error?: string,
  context?: LogContext
): void {
  const level: LogLevel = success ? 'debug' : 'warn';
  const status = success ? 'passed' : 'failed';
  const entry = createLogEntry(level, `Step ${stepIndex} (${action}) ${status}`, {
    flowName,
    stepIndex,
    action,
    success,
    durationMs,
    ...(error && { error }),
    ...context,
  });
  outputLog(entry);
}

/**
 * Log Browserbase session event
 */
export function logBrowserbaseEvent(
  event: 'created' | 'connected' | 'terminated' | 'acquired' | 'released' | 'error',
  sessionId?: string,
  context?: LogContext
): void {
  const logContext = {
    browserbaseEvent: event,
    browserbaseSessionId: sessionId,
    ...context,
  };
  const message = `Browserbase session ${event}${sessionId ? `: ${sessionId}` : ''}`;

  if (event === 'error') {
    error(message, logContext);
  } else {
    info(message, logContext);
  }
}

/**
 * Log vision analysis result
 */
export function logVisionAnalysis(
  flowName: string,
  confidence: number,
  durationMs: number,
  context?: LogContext
): void {
  info(`Vision analysis complete: ${flowName} (confidence: ${confidence}%)`, {
    flowName,
    visionConfidence: confidence,
    visionDurationMs: durationMs,
    ...context,
  });
}

/**
 * Log pool statistics
 */
export function logPoolStats(
  idle: number,
  active: number,
  total: number,
  context?: LogContext
): void {
  debug(`Session pool stats: idle=${idle}, active=${active}, total=${total}`, {
    poolIdle: idle,
    poolActive: active,
    poolTotal: total,
    ...context,
  });
}

// ============================================
// Child Logger
// ============================================

/**
 * Create a child logger with preset context
 */
export function createChildLogger(baseContext: LogContext) {
  return {
    debug: (message: string, context?: LogContext) =>
      debug(message, { ...baseContext, ...context }),
    info: (message: string, context?: LogContext) =>
      info(message, { ...baseContext, ...context }),
    warn: (message: string, context?: LogContext) =>
      warn(message, { ...baseContext, ...context }),
    error: (message: string, context?: LogContext) =>
      error(message, { ...baseContext, ...context }),
    logError: (err: Error, message?: string, context?: LogContext) =>
      logError(err, message, { ...baseContext, ...context }),
  };
}

/**
 * Create a flow-scoped logger
 */
export function createFlowLogger(flowName: string, executionMode: 'local' | 'cloud') {
  return createChildLogger({ flowName, executionMode });
}

// ============================================
// Lifecycle
// ============================================

/**
 * Shutdown the logger
 */
export function shutdownLogger(): void {
  config = null;
  initialized = false;
  console.log('[Datadog] Logger shutdown');
}
