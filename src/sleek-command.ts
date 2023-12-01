import {Command, Config} from "@oclif/core";

/**
 * A base command that provides common functionality for all Sleek Transformer commands:
 *   - Configuration Loading
 *   - Logging
 *   - Error Handling
 *   - Tracing
 *
 *   All implementations of this class need to implement the `run` method.
 */
export abstract class SleekCommand extends Command {
  public static configuration: IConfig;

  public constructor(argv: string[], config: Config) {
    super(argv, config);

    // create config file if it doesn't exist
    // load it if it exists

  }

}

export interface IConfig {
  [key: string]: {
    region: string;
    accId: string;
    helmUrl: string;
    namespace: string;
  };
}