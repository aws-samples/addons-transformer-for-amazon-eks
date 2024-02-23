# Open Source Contribution Guide
Welcome potential contributors! This document provides information and guidelines for contributing to this open
source project.

### Project Overview
The Sleek transformer is driven to assist partners quickly onboard their helm charts onto the EKS addon
environment (known as Sleek). This system attempts to cover pre-validation checks we conduct before allowing partner
addons into the AWS Console.

The goal is to speed up the iterative process for onboarding partners into the EKS addons environment, increasing the
throughput of partner addons by letting them validate against our checks before they engage with AWS Engineering.

### Getting Started
To add a new command to this CLI, simply add a new file in `./src/commands/` that extends from `SleekCommand`.
Our standard best practice is to separate the static aspects used to generate the OCLIF docs into a separate folder such
as `./src/commandOpts` just to make it easier to read the functional vs. descriptive aspects of code.

This entire CLI is heavily I/O bound, so please try and use Async/Await at appropriate locations. We separate the interface
and logic aspects of the CLI by creating services that are called from the UI classes:
* `./src/commands/` - contains all the interface files
* `./src/services/` - contains all the services and logic
* `./src/commandOpts/` - contains all the interface static properties (used to generate OCLIF documentation)

### Command Management
This project uses OCLIF (Open CLI Framework) to manage commands. OCLIF provides a simple yet powerful framework
for building CLI applications in Node.js. With OCLIF, commands are defined as classes that extend the base
Command class. This allows commands to have common properties like name, description, args and flags.

The commands are then registered with OCLIF via the commands property on the program class. OCLIF takes
care of parsing args, initializing the command class, and executing the command. This makes it easy to add, remove,
and manage commands without having to rewrite the CLI parser.

### Contribution Workflow

1. Fork the repo.
2. Make modifications to code/documentation that are relevant to your contribution
3. Ensure the CLI compiles and is still usable:
    1. Run `npm run prepack` in the context of the folder to ensure everything in the build and docs is up to date
    2. Run `npm pack` to package your modifications
    3. Install the modifications to your local environment using `npm i <tgz file created by pack>`
    4. Validate that the modifications you made pass runtime verification.
4. Submit a PR against this repo with your modifications
5. If there's feedback against the PR, address it.
6. Once the maintainers think it's appropriate to merge, they will merge it.
