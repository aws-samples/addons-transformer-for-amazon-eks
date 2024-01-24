/**
 * Is the base class of all our services, holds the configs
 * that are global to services
 */

export interface ServiceConfig {
  // defines chart location
  chart: string;

  // define other stuff common to all services here
}

export type ServiceResponse<T> = {
  success: boolean,
  body?: T,
  error?: {
    input: Error | string,
    options?: {
      code?: string;
      exit?: number;
    }
  }
}

export abstract class BaseService {
  protected config: ServiceConfig;

  constructor(config: ServiceConfig) {
    this.config = config;
  }

  public log(){

  }

  public error() {

  }

  public abstract run(): Promise<ServiceResponse<any>>;
}
