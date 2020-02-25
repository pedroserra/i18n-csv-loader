const csv = require('csvtojson');

module.exports = async function(csvSource, {keyColumn, ignoreSlashed = true}) {
    let parsedSource = await csv({}).fromString(csvSource),
        headers = ignoreSlashed ? Object.keys(parsedSource[0]).filter(key => !key.match(/^\_/)) : Object.keys(parsedSource[0]),
        translations = {};

    // filter out empty headers
    headers = headers.filter(text => text.toString().trim().length > 0);

    headers.forEach(lang => {
        translations[lang] = parsedSource.reduce((translations, row) => {
            if (row[keyColumn]) {
                translations[row[keyColumn]] = row[lang];
            }
            return translations;
        }, {});
    });

    return translations;
};
