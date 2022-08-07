
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const puppet = require('./get');
const {updatefile, closefile, updateJsonFile} = require('./kitchensink');

const app = express();

app.use(cors());

const port = 3000
const JOBS = {};

const startJob = async (url, cb = (jobID, title) => {}) => {

    let page = await puppet.get(url, 
        //get content from the page
        {
            title: '.title',
            rating: 'div[itemprop="aggregateRating"]',
            description: 'div[itemprop="description"]',
        },
        //get links from the page
        {
            start: '.btn-read-now'
        }
    );

    //strip html from title
    let cleanTitle = page.extractedContents.title.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    //create a decent name for the directory and the jobid
    let dir, jobID = cleanTitle.replace(/\s+/g, '_').toLowerCase();
    //construct the config that will be saved to the json file.
    let config = {
        id,
        title: cleanTitle,
        rating: page.extractedContents.rating,
        description: page.extractedContents.description,
        url: url,
        next: page.extractedHrefs.start,
    };

    //set the job status as running
    JOBS[jobID] = 'running';
    
    //I should really change this to not the the promise chain but the async await
    const job = new Promise(async (resolve, reject) => {
        //create directory
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
            fs.writeFileSync(`${dir}/data.json`, JSON.stringify(config));

            //write html to file
            fs.writeFileSync(
                `${dir}/index.html`, 
                `
                    <!DOCTYPE html>
                        <html lang="en">
                        <head>
                            <meta charset="UTF-8">
                            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                            <meta http-equiv="X-UA-Compatible" content="ie=edge">
                            <title>Document</title>
                            <link rel="stylesheet" href="./main.css">
                            <body>
                        </head>
                        <article>
                            <h1>${cleanTitle}</h1>
                `
            );

        } else {
            try {
                let fetched = JSON.parse(fs.readFileSync(`${dir}/data.json`));
                if (!fetched.next) {
                    config = fetched;
                }                 
            } catch (error) {
                console.log('something went wrong reading the data file');
            }
        }

        
        
        resolve();
    });

    job.then(async () => {
        cb(jobID, cleanTitle);
        await nextPageJob(jobID, dir, cleanTitle, page.extractedHrefs.start, 0);
    });
    
};



const nextPageJob = (jobID, dir, title, url, count) => {
    


    const nextPage = new Promise(async (resolve, reject) => {
        JOBS[jobID] = 'running ' + count;
        resolve(await puppet.get(url, {html: '#chr-content'}, {next: '#next_chap', prev: '#prev_chap'}));
    });    
    
    nextPage.then((extracted) => {
        if (extracted.extractedHrefs.next) {
            updatefile(`${dir}/index.html`, extracted.extractedContents.html);
            updateJsonFile(`${dir}/data.json`, extracted.extractedContents);
            nextPageJob(jobID, dir, title, extracted.extractedHrefs.next, ++count);
        } else {
            JOBS[jobID] = 'done';
            closefile(`${dir}/index.html`);
        }
    }).catch(err => {
        console.log(err);
        closefile(`${dir}/index.html`);
    });

}



app.get('/fetch', cors(), async function (req, res, next)  {
    let content = await puppet.get(req.query.url, {html: '#chr-content'}, {html: '#next_chap', next: '#prev_chap'});
    res.json({
        html: content.extractedContents.html,
        next: content.extractedHrefs.next,
        prev: content.extractedHrefs.prev,
    });
})

app.get('/make', cors(), async function (req, res, next)  {
    await startJob(req.query.url, (jobId, title) => {
        res.send('started jobID: ' + jobId + ', title: ' + title);
    });
});

app.get('/stop/:id', cors(), async function (req, res, next)  {
    JOBS[req.params.id] = 'stopped';
    res.send('stopped jobID: ' + req.params.id);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})