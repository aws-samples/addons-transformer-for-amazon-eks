import { Command, Config } from "@oclif/core";
import * as fs from "node:fs";
import path from "node:path";

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

    const configPath = path.join(this.config.configDir, 'config.json');

    if (fs.existsSync(configPath)) {
       this.configuration = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } else {
      this.configuration = {};
      fs.mkdirSync(this.config.configDir, { recursive: true });
      fs.writeFileSync(configPath, JSON.stringify(this.configuration), { flag: "wx" })
    }
  }

  public updateConfig() {
    fs.writeFileSync(
      path.join(
        this.config.configDir,
        'config.json'
      ),
      JSON.stringify(this.configuration),
      { flag: "w" }
    );
  }
}

export interface IConfig {
  [key: string]: {
    accId: string;
    helmUrl: string;
    kubeVersion: string;
    namespace: string;
    region: string;
    validated: boolean;
  };
}