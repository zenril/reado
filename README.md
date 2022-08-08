```
nvm use
yarn
yarn prepare
yarn start
```

### To start/resume a story downloading:

http://localhost:3000/start?url=https://readnovelfull.com/kidnapped-dragons.html

### To pause story

http://localhost:3000/stop?url=https://readnovelfull.com/kidnapped-dragons.html

## Todo

-   ~~make `pause` and `done` use the same process, I should be able to start a finished story downloading new chapters. Should always be able to read the html file. maybe I just save the index.html as a fragment and serve the fragment in a layout compiled by the server.~~
-   split sets of chapters into their own files.
-   make it good
-   move puppeteer get into the kitchen sink file
-   ~~make sure it can download multiple stories at the same time.~~
-   ~~remove the `JOB` const and just store the status in the json file.~~
-   make some sort of index file that has the list of all the stories.
-   ...
-   ...
