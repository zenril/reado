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

exports.writeTemplate = (file, title) => {
    fs.writeFileSync(
        file,
        `
            <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <meta http-equiv="X-UA-Compatible" content="ie=edge">
                    <title>Document</title>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Roboto&display=swap');

                        :root {
                            --space: 0;
                        }
                                            
                        article {
                            max-width: 75ex;
                            margin: 2em 0 0 0;
                            font-family: Roboto;
                        }
                        
                        p {
                            line-height: calc(1.4 + var(--space) / 100);
                            letter-spacing: calc(1em * (var(--space) / 200));
                            word-spacing: calc(1em * (var(--space) / 100));
                        }
                    </style>
                    <body>
                </head>
                <article>
                    <h1>${title}</h1>
                </article>
            </body>
        </html>`
    );
};

exports.addChapterTofile = (file, content) => {
    let buffer = fs.readFileSync(file, { encoding: 'utf8', flag: 'r' });
    //remove the closing tags
    buffer = buffer.replace(/<\/article>|<\/body>|<\/html>/g, '');
    //add the new chapter
    fs.writeFileSync(
        file,
        `
    ${buffer}
    <!-- chapter start -->
    ${content}
    <!-- chapter end -->
        </article>
    </body>
</html>`
    );
};
