/**
 * Is the base class of all our services, holds the configs
 * that are global to services
 */
import {ServiceResponse} from "../types/service.js";
import {SleekCommand} from "../sleek-command.js";
import {PrettyPrintableError} from "@oclif/core/lib/errors/index.js";

export interface ServiceConfig {
  // defines chart location
  chart: string;

  // define other stuff common to all services here
}


export abstract class BaseService {
  protected config: ServiceConfig ;
  private commandCaller: SleekCommand;

  constructor(commandCaller: SleekCommand, config: ServiceConfig = {} as ServiceConfig) {
    this.commandCaller = commandCaller;
    this.config = config;
  }

  public log(message?: string, ...args: any[]): void{
    this.commandCaller.log(message, args)
  }

  public logToStderr(message?: string, ...args: any[]): void{
    this.commandCaller.logToStderr(message, args)
  }

  public error(input: Error | string, options?: {
    code?: string;
    exit?: number;
  } & PrettyPrintableError): never {
    this.commandCaller.error(input, options)
  }

  public abstract run(): Promise<ServiceResponse<any>>;
}
