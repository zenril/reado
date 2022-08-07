const express = require('express');
const cors = require('cors');
const fs = require('fs');
const { get } = require('./get');
const { updatefile, closefile, updateJsonFile, writeTemplate } = require('./kitchensink');

const app = express();

app.use(cors());

const port = 3000;
const JOBS = {};
const baseDir = './stories';

const startJob = async (url, cb = (jobID, title) => {}) => {
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
    let cleanTitle = page.extractedContents.title
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    //create a decent name for the directory and the jobid
    let jobID = cleanTitle.replace(/\s+/g, '_').toLowerCase();
    let dir = `${baseDir}/${jobID}`;
    //construct the config that will be saved to the json file.
    let config = {
        id: jobID,
        title: cleanTitle,
        rating: page.extractedContents.rating,
        description: page.extractedContents.description,
        url: url,
        next: page.extractedHrefs.start,
        chapters: 0,
    };

    //set the job status as running
    JOBS[jobID] = 'running';

    //create directory
    if (!fs.existsSync(dir)) {
        console.log(`making new directory ${dir}`);
        fs.mkdirSync(dir);
        fs.writeFileSync(`${dir}/data.json`, JSON.stringify(config));
        writeTemplate(`${dir}/index.html`, cleanTitle);
    } else {
        try {
            console.log(`reading in config for ${dir}`);
            let fetched = JSON.parse(fs.readFileSync(`${dir}/data.json`));

            if (fetched.next) {
                config = fetched;
            }
        } catch (error) {
            console.log('something went wrong reading the data file');
        }
    }

    cb(jobID, cleanTitle);
    nextPageJob(jobID, dir, cleanTitle, config.next, config.chapters);
};

const nextPageJob = async (jobID, dir, title = '', url = '', count = 0) => {
    console.log(`${count} - ${url} - ${jobID}`);
    //if the job has been finished we stop it and we need to clean up the file;
    if (JOBS[jobID] === 'done') {
        closefile(`${dir}/index.html`);
        console.log('job finished');
        return;
    }

    if (JOBS[jobID] === 'pause') {
        console.log('job finished');
        return;
    }

    if (JOBS[jobID] === 'error') {
        console.log('job finished');
        return;
    }

    const nextPage = new Promise(async (resolve, reject) => {
        JOBS[jobID] = 'running ' + count;
        resolve(await get(url, { html: '#chr-content' }, { next: '#next_chap', prev: '#prev_chap' }));
    });

    nextPage
        .then((page) => {
            if (page.extractedHrefs.next) {
                //add the new content to the html
                updatefile(`${dir}/index.html`, page.extractedContents.html);
                //update the data file with things like the new next page
                updateJsonFile(`${dir}/data.json`, { next: page.extractedHrefs.next, chapters: count });
                //recurse
                nextPageJob(jobID, dir, title, page.extractedHrefs.next, ++count);
            } else {
                JOBS[jobID] = 'done';
                //go to next cycle to clean up the task
                nextPageJob(jobID, dir);
            }
        })
        .catch((err) => {
            JOBS[jobID] = 'error';
            //go to next cycle to clean up the task
            nextPageJob(jobID, dir);
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
    await startJob(req.query.url, (jobId, title) => {
        res.send('started jobID: ' + jobId + ', title: ' + title);
    });
});

app.get('/status/:id/:status', cors(), async function (req, res, next) {
    JOBS[req.params.id] = req.params.status;
    res.send('stopped jobID: ' + req.params.id + ', status: ' + req.params.status);
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
