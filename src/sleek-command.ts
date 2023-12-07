import {Command, Config} from "@oclif/core";
import * as fs from "fs-extra";
import * as path from "path";

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
  public configuration: IConfig;

  public constructor(argv: string[], config: Config) {
    super(argv, config);

    this.configuration = {};

    // use oclif's config to load and store the config
    fs.readJSON(path.join(this.config.configDir, 'config.json'))
      .then(config => this.configuration = config as IConfig)
      .catch(error => {
        // if the error is JSON parsing failed, notify the user, attempt to repair the file
        if (error.name === "SyntaxError") {
          this.log("Configuration file is corrupt, attempting to repair.");
          // TODO: Figure out repairing logic

          this.configuration = {};
        }

        // If the file doesn't exist, create it with empty config
        if (error.code === "ENOENT") {
          this.log("No configuration file found, creating one with default values.");

          fs.writeJson(path.join(this.config.configDir, 'config.json'), {}, { flag: "w" })
            .then(config => this.configuration = {})
            .catch(error => {
              this.log(error);
              this.error(error);
            }
          );
        }
      }
    );
  }

  public updateConfig() {
    fs.writeJson(path.join(this.config.configDir, 'config.json'), this.configuration, { flag: "w" })
      .catch(error => {
          this.log(error);
          this.error(error);
        }
      );
  }
}

export interface IConfig {
  [key: string]: {
    region: string;
    accId: string;
    helmUrl: string;
    namespace: string;
    validated: boolean;
  };
}