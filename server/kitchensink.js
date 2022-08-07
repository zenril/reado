exports.updatefile = (file, content) => {
    fs.appendFileSync(file, content);
}

exports.closefile = (file) => {
    updatefile(file, '</article></body></html>');
}

exports.updateJsonFile = (file, json) => {
    let contents = fs.readFileSync(file);
    contents = JSON.parse(contents);
    json = {
        ...contents,
        ...json
    };
    fs.writeFileSync(file, JSON.stringify(json));
}