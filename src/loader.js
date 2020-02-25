const loaderUtils = require('loader-utils');
const readCSV = require('./readCSV');

module.exports = async function(source) {
    let options = {
        key: '_key',
        ...loaderUtils.getOptions(this),
    };

    let translations = await readCSV(source, {keyColumn: options.key});

    return `export default ${JSON.stringify(translations)}`;
};
