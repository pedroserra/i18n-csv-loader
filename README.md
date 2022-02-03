# i18n-csv-loader

## Purpose

A webpack loader that loads CSV files into a module.

Files like `example.strings.csv`

\_key       | en          | pt
------------|-------------|----------
yes         | Yes         | Sim
no          | No          | Não
hello world | Hello world | Olá mundo

can be used like:

```
    import strings from './example.strings.csv';

    // use strings[lang][key]

    console.log(strings['en']['hello world']);  // output: "Hello world"
    console.log(strings['pt']['hello world']);  // output: "Olá mundo"
```

## Installation

1. Install

```
    npm install --save i18n-csv-loader
```

2. Add the rule to your webpack.config.js

```
const config = {
    module: {
        rules: [
            {
                test: /\.strings\.csv$/,
                use: ['i18n-csv-loader']
            },
        ],
    },
}
```

## Options
Option | Default| Description              
-------|--------|--------------------------
key    | '_key'| Header of the key column 

you can set your options in webpack like 
```
    ...
        use: [
            {
                loader: 'i18n-csv-loader',
                options: {
                    key: '_key',
                },
            },
        ],
    ...
```

## The CSV files
* CSV files are parsed by [csvtojson](https://www.npmjs.com/package/csvtojson) using the default settings which include some auto detection, but keep as close to the [RF4180 specification](https://www.loc.gov/preservation/digital/formats/fdd/fdd000323.shtml)
* empty lines or lines with an empty key column are ignored
* first line should contain the header which should contain
  - *_key* - indicates that this column will contain the key index used to select the string
  - headers started by **_** will be ignored (useful if you want to have a descriptive column to indicate the context or indicate which tags will be supported for string replacement)
  - any other headers will be considered as language identifiers


## Tools
Because sometimes is useful to merge all the strings into a single file (to share with a translator for instance), a couple of scripts are included to facilitate this job

* _export-strings_

    Exports all strings into a single file (a column with the filename is added to allow the import process)
    
    example:
    ```
        npx export-strings --files `find -name *.strings.csv` -o allstrings.csv
    ```
    
* _import-strings_

    Imports previously a previously exported file, updating the matching keys
    
    example:
    ```
        npx import-strings -i allstrings.csv
    ```


## To do
- [ ] allow configuration of the CSV properties for non standard versions
- [ ] export and import scripts should change file paths to be relative to the project root

## Credits
* CSV parsing done by [csvtojson](https://www.npmjs.com/package/csvtojson) 
* CSV writing handled by [csvwriter](https://www.npmjs.com/package/csvwriter) 
