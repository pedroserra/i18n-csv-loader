#!/usr/bin/env node

const {flatten} = require('array-flatten');
const commandLineArgs = require('command-line-args');
const commandLineUsage = require('command-line-usage');
const csvwriter = require('csvwriter');
const unique = require('array-unique');

const {existsSync, readFileSync, writeFileSync} = require('fs');
const {exit} = require('process');
const path = require('path');

const readCSV = require('./readCSV');

const PARAMS_DEFINITION = [
    {name: 'help', alias: 'h', type: Boolean, defaultValue: false, description: 'Display this help information'},
    {name: 'version', alias: 'v', type: Boolean, defaultValue: false, description: 'Show the package version number'},
    {name: 'files', alias: 'f', multiple: true, description: '.csv files to merge', defaultValue: []},
    {name: 'key', alias: 'k', defaultValue: '_key', description: 'Key column header'},
    {name: 'fkey', defaultValue: '_file', description: 'Column to store the filename (will be used when reimporting strings)'},
    {name: 'out', alias: 'o', description: 'Output file. If not set, stdout will be used intead.'},
];

//
async function runCommand() {
    let params;
    try {
        params = commandLineArgs(PARAMS_DEFINITION);
        if (!params.files.length) throw new Error('No files to export');
    } catch (error) {
        console.error(error);
        params = {help: true};
    }

    if (params.help) {
        const usage = commandLineUsage([
            {
                header: 'Synopsis',
                content: '$ npx i18n-csv-merge <options>',
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
        let files = params.files
            .filter(f => {
                if (!existsSync(f)) {
                    console.error(`File not found: ${f}`);
                    return false;
                }
                return true;
            })
            .map(fn => {
                let content = readFileSync(fn, 'utf-8');
                return {
                    filename: fn,
                    translations: readCSV(content, {keyColumn: params.key, ignoreSlashed: false}),
                };
            });

        // Wait for all pending promises
        for (let file of files) file.translations = await file.translations;

        // Reduce translations to a single tree
        let supportedLanguages = unique(
                flatten(
                    files.map(file => {
                        return Object.keys(file.translations);
                    })
                )
            ),
            merged = {};

        files.forEach(file => {
            supportedLanguages.forEach(lang =>
                Object.keys(file.translations[lang] || {}).forEach(key => {
                    let translation = file.translations[lang][key],
                        fullKey = `[${file.filename}][${key}]`;
                    if (!merged[fullKey]) {
                        merged[fullKey] = {
                            [params.fkey]: file.filename,
                            [params.key]: key,
                        };
                    }
                    merged[fullKey][lang] = translation;
                })
            );
        });
        merged = csvwriter(Object.values(merged), function(err, data) {
            if (err) {
                console.error(err);
                exit(-1);
            }
            if (params.out) writeFileSync(params.out, data, 'utf-8');
            else {
                console.log(data);
            }
        });
    }
}

runCommand();
