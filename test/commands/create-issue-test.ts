import {expect, test} from '@oclif/test'
import {CLIError} from "@oclif/core/lib/errors";

describe('create-issue', () => {

    describe('create-issue -d create-issue-input.not-valid.yaml', () => {
        test
            .stderr()
            .stdout()
            .command(['create-issue',
                '--dry-run', // avoid creation of the actual issue con GitHub
                './test/commands/resources/create-issue-input.not-valid.yaml',
            ])
            .catch(ctx => {
                expect(ctx.message)
                expect(ctx.message).to.contain('Schema validation errors')
                expect(ctx.message).to.contain('must have required property \'sellerName\'')
                expect(ctx.message).to.contain('must have required property \'sellerMarketPlaceAlias\'')
                expect(ctx.message).to.not.contain('must have required property \'accountId\'')
                if (ctx instanceof CLIError)
                    expect(ctx.oclif.exit).to.eq(1)
            })
            .it('Didn\'t try to create the issue due to validation errors',ctx=>{
                console.log(JSON.stringify(ctx))
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
