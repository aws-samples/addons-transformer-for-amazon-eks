import {CLIError} from "@oclif/core/lib/errors";
import {expect, test} from '@oclif/test'

describe('create-issue', () => {

    describe('create-issue -d create-issue-input.not-valid.yaml', () => {
        test
            .stderr()
            .stdout()
            .command(['create-issue',
                '--dry-run', // avoid creation of the actual issue con GitHub
                './test/commands/resources/create-issue-input.not-valid.yaml',
            ])
            .catch(error => {
                expect(error.message)
                expect(error.message).to.contain('Schema validation errors')
                expect(error.message).to.contain('must have required property \'sellerName\'')
                expect(error.message).to.contain('must have required property \'sellerMarketPlaceAlias\'')
                expect(error.message).to.not.contain('must have required property \'accountId\'')
                if (error instanceof CLIError)
                    expect(error.oclif.exit).to.eq(1)
            })
            .it('Didn\'t try to create the issue due to validation errors',error=>{
                console.log(JSON.stringify(error))
                // expect(ctx.stdout).to.contain('must have required property')
            })
    });

    describe('create-issue -d create-issue-input.valid.yaml', () => {
        test
            .stdout()
            .command(['create-issue',
                    '--dry-run', // avoid creation of the actual issue con GitHub
                    './test/commands/resources/create-issue-input.valid.yaml',
                ]
            ).it('create-issue with valid input', ctx => {
            expect(ctx.stdout).to.eq('File to process: ./test/commands/resources/create-issue-input.valid.yaml (dry run)\n' +
                'Schema validation correct\n'
            )
        })
    })
})
