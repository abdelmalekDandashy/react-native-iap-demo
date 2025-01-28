import { IapticLoggerVerbosityLevel } from "../types";

export class IapticLogger {
  verbosity: IapticLoggerVerbosityLevel = IapticLoggerVerbosityLevel.WARN;

  constructor(verbosity: IapticLoggerVerbosityLevel) {
    this.verbosity = verbosity;
  }

  info(message: string) {
    if (this.verbosity >= IapticLoggerVerbosityLevel.INFO)
      console.log(`[IapticRN] ${message}`);
  }

  debug(message: string) {
    if (this.verbosity >= IapticLoggerVerbosityLevel.DEBUG)
      console.log(`[IapticRN] ${message}`);
  }

  error(message: string) {
    if (this.verbosity >= IapticLoggerVerbosityLevel.ERROR)
      console.error(`[IapticRN] ${message}`);
  }

  warn(message: string) {
    if (this.verbosity >= IapticLoggerVerbosityLevel.WARN)
      console.warn(`[IapticRN] ${message}`);
  }
}

export const logger = new IapticLogger(IapticLoggerVerbosityLevel.WARN);