import {PrettyPrintableError} from "@oclif/core/lib/errors/index.js";

import {SleekCommand} from "../sleek-command.js";


export abstract class BaseService {
  private commandCaller: SleekCommand;

  constructor(commandCaller: SleekCommand) {
    this.commandCaller = commandCaller;
  }

  public error(input: Error | string, options?: {
    code?: string;
    exit?: number;
  } & PrettyPrintableError): never {
    this.commandCaller.error(input, options)
  }

  public log(message?: string, ...args: any[]): void{
    this.commandCaller.log(message, ...args)
  }

  public logToStderr(message?: string, ...args: any[]): void{
    this.commandCaller.logToStderr(message, ...args)
  }
}
