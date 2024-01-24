/**
 * Is the base class of all our services, holds the configs
 * that are global to services
 */
import {ServiceResponse} from "../types/service.js";
import {SleekCommand} from "../sleek-command.js";

export interface ServiceConfig {
  // defines chart location
  chart: string;

  // define other stuff common to all services here
}


export abstract class BaseService {
  protected config: ServiceConfig ;
  protected commandCaller: SleekCommand;

  constructor(commandCaller: SleekCommand, config: ServiceConfig = {} as ServiceConfig) {
    this.commandCaller = commandCaller;
    this.config = config;
  }

  public log(){

  }

  public error() {

  }

  public abstract run(): Promise<ServiceResponse<any>>;
}
