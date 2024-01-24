/**
 * Is the base class of all our services, holds the configs
 * that are global to services
 */
import {ServiceResponse} from "../types/service.js";

export interface ServiceConfig {
  // defines chart location
  chart: string;

  // define other stuff common to all services here
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
