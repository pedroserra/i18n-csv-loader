#!/usr/bin/env node

const commandLineArgs = require('command-line-args');
const commandLineUsage = require('command-line-usage');
const csvtojson = require('csvtojson');
const csvwriter = require('csvwriter');
const unique = require('array-unique');

const {existsSync, writeFileSync} = require('fs');
const {exit} = require('process');

const PARAMS_DEFINITION = [
    {name: 'help', alias: 'h', type: Boolean, defaultValue: false, description: 'Display this help information'},
    {name: 'version', alias: 'v', type: Boolean, defaultValue: false, description: 'Show the package version number'},
    {name: 'input', alias: 'i', description: 'Specifies the input file'},
    {name: 'key', alias: 'k', defaultValue: '_key', description: 'Key column header'},
    {name: 'fkey', defaultValue: '_file', description: 'Column to store the filename (will be used when reimporting strings)'},
    {name: 'skip-missing', defaultValue: false, type: Boolean},
];

//
async function runCommand() {
    let params;
    try {
        params = commandLineArgs(PARAMS_DEFINITION);

        if (!params.input) throw new Error('Input file is required');
        else if (!existsSync(params.input)) throw new Error('`File not found: ${params.input}`');
    } catch (error) {
        console.error(error);
        params = {help: true};
    }

    if (params.help) {
        const usage = commandLineUsage([
            {
                header: 'Synopsis',
                content: '$ npx import-strings <options>',
            },
            {
                header: 'Options',
                optionList: PARAMS_DEFINITION,
            },
        ]);
        console.log(usage);
    } else if (params.version) {
        const version = require(path.resolve(__dirname, '..', 'package.json')).version;
        console.log(version);
    } else {
        const input = await csvtojson({}).fromFile(params.input),
            header = Object.keys(input[0]);

        // Make sure all target files exist (or warn user)
        let wait4me = [],
            filenames = unique(input.map(line => line[params.fkey])).map(fn => {
                if (!existsSync(fn)) {
                    console.error(`Target file not found: ${fn}  (use --skip-missing to skip files not found)`);
                    if (!params['skip-missing']) {
                        exit(-1);
                    }
                }
                return fn;
            }),
            files = {};
        for (const fn of filenames) {
            files[fn] = await csvtojson({}).fromFile(fn);
        }

        // Copy new strings
        for (const translation of input) {
            let file = files[translation[params.fkey]];
            if (file) {
                let row = file.find(row => row[params.key] == translation[params.key]);
                if (row) {
                    for (col of header) {
                        row[col] = translation[col];
                    }
                }
            }
        }

        // save updated files
        for (const fn of filenames) {
            let csv = csvwriter(files[fn], (err, csv) => {
                if (err) {
                    console.error(err);
                    exit(-1);
                }
                writeFileSync(fn, csv);
            });
        }
    }
}

runCommand();
