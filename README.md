```
nvm use
yarn
yarn server
```

### To start a story downloading:

http://localhost:3000/start?url=https://readnovelfull.com/kidnapped-dragons.html

The page will contain an jobId which is useful for the pause story

### To pause story

http://localhost:3000/status/{jobid}/pause

To resume a story downloading just hit the start url again

### To finsh a story

http://localhost:3000/status/{jobid}/done

This means it will close off the html file with `</body></html>` if its finished all the chapters or not.

## Todo

-   split sets of chapters into their own files.
-   make it good
-   make `pause` and `done` use the same process, I should be able to start a finished story downloading new chapters.
-   move puppeteer get into the kitchen sink file
-   make sure it can download multiple stories at the same time.
-   remove the `JOB` const and just store the status in the json file.
-   make some sort of index file that has the list of all the stories.
-   ...
-   ...
