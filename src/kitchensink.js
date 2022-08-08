const fs = require('fs');

exports.updatefile = (file, content) => {
    fs.appendFileSync(file, content);
};

exports.readConfig = (file) => {
    return JSON.parse(fs.readFileSync(file, { encoding: 'utf8', flag: 'r' }));
};

exports.updateConfig = (file, newConfig) => {
    fs.writeFileSync(
        file,
        JSON.stringify({
            ///...oldConfig,
            ...JSON.parse(fs.readFileSync(file)),
            ///...newConfig,
            ...newConfig,
        })
    );
};

const template = (title, oldContent = '', newContent = '') => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Document</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Roboto&display=swap');

        body {
            font-family: 'Roboto', sans-serif;
            font-size:  1.1rem;
        }
                            
        article {
            max-width: 75ex;
            margin: 2em 0 0 0;
            font-family: Roboto;
        }
    </style>
</head>
<body>
    <article>
        <h1>${title}</h1>
        <!--start-->
        ${oldContent}
        ${newContent}
        <!--end-->
    </article>
</body>
</html>`;

exports.writeTemplate = (file, title) => {
    fs.writeFileSync(file, template(title));
};

exports.addChapterTofile = (file, bookTitle, newChapter) => {
    let readIn = fs.readFileSync(file, { encoding: 'utf8', flag: 'r' });
    //remove the closing tags
    readIn = readIn.replace(/\n*\s*(<\/article>|<\/body>|<\/html>)/g, '');
    //only keep the substring between <!--start--> and <!--end-->
    readIn = readIn.substring(readIn.indexOf('<!--start-->') + 12, readIn.indexOf('<!--end-->')).trim();

    //add the new chapter
    fs.writeFileSync(file, template(bookTitle, readIn, newChapter));
};
