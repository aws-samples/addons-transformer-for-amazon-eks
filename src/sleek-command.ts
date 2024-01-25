import * as fs from "fs";
import * as path from "path";
import { Command, Config } from "@oclif/core";

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

  public constructor(argv: string[], config: Config) {
    super(argv, config);
  }
}