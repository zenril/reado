const express = require('express');
const cors = require('cors');
const fs = require('fs');
const { get } = require('./get');
const { addChapterTofile, updateConfig, readConfig, writeTemplate } = require('./kitchensink');

const app = express();

app.use(cors());

const port = 3000;
const JOBS = {};
const baseDir = './stories';

const storyStartPage = async (url) => {
    let page = await get(
        url,
        //get content from the page
        {
            title: '.title',
            rating: 'div[itemprop="aggregateRating"]',
            description: 'div[itemprop="description"]',
        },
        //get links from the page
        {
            start: '.btn-read-now',
        }
    );

    //strip html from title
    let title = page.extractedContents.title
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    //create a decent name for the directory and the id
    let id = title.replace(/\s+/g, '_').toLowerCase();

    return { page, id, title };
};

const startJob = async (url, cb = (id, title) => {}) => {
    const { page, id, title } = await storyStartPage(url);
    let dir = `${baseDir}/${id}`;

    //construct the config that will be saved to the json file.
    let config = {
        id,
        title,
        rating: page.extractedContents.rating,
        description: page.extractedContents.description,
        url: url,
        next: page.extractedHrefs.start,
        chapters: 0,
        status: 'stopped',
    };

    //create directory
    if (!fs.existsSync(dir)) {
        console.log(`making new directory ${dir}`);
        fs.mkdirSync(dir);
        fs.writeFileSync(`${dir}/data.json`, JSON.stringify(config));
        writeTemplate(`${dir}/index.html`, title);
    } else {
        try {
            console.log(`reading in config for ${dir}`);
            let fetched = JSON.parse(fs.readFileSync(`${dir}/data.json`, { encoding: 'utf8', flag: 'r' }));

            if (fetched.next) {
                config = fetched;
            }
        } catch (error) {
            console.log('something went wrong reading the data file');
        }
    }

    updateConfig(`${dir}/data.json`, { status: 'running' });

    cb(id, title);
    nextPageJob(id, dir, title, config.next, config.chapters);
};

const nextPageJob = async (id, dir, title = '', url = '', count = 0) => {
    const nextPage = new Promise(async (resolve, reject) => {
        //read in the config file
        let config = JSON.parse(fs.readFileSync(`${dir}/data.json`, { encoding: 'utf8', flag: 'r' }));

        if (config.status === 'stopped') {
            reject('job stopped');
        }

        let page = await get(url, { html: '#chr-content' }, { next: '#next_chap', prev: '#prev_chap' });
        console.log(`${count} - ${url} - ${id}`);
        //add the new content to the html
        addChapterTofile(`${dir}/index.html`, page.extractedContents.html);
        //update the data file with things like the new next page
        updateConfig(`${dir}/data.json`, { next: page.extractedHrefs.next, chapters: count });

        resolve(page.extractedHrefs.next);
    });

    nextPage
        .then((next) => {
            nextPageJob(id, dir, title, next, ++count);
        })
        .catch((err) => {
            console.log(err);
        });
};

app.get('/fetch', cors(), async function (req, res, next) {
    let content = await get(req.query.url, { html: '#chr-content' }, { html: '#next_chap', next: '#prev_chap' });
    res.json({
        html: content.extractedContents.html,
        next: content.extractedHrefs.next,
        prev: content.extractedHrefs.prev,
    });
});

app.get('/start', cors(), async function (req, res, next) {
    await startJob(req.query.url, (id, title) => {
        res.send('started id: ' + id + ', title: ' + title);
    });
});

app.get('/stop', cors(), async function (req, res, next) {
    try {
        const { page, id, title } = await storyStartPage(req.query.url);
        let dir = `${baseDir}/${id}`;
        updateConfig(`${dir}/data.json`, { status: 'stopped' });
        res.send('stopped id: ' + id + ', title: ' + title);
    } catch (error) {
        res.send('something went wrong reading the data file');
    }
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
