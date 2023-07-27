const axios = require('axios');
const prompt = require('prompt-sync')({sigint: true});
const fs = require('fs');
const URL = require('url');
const { Queue } = require('./utils/dataStructures');
const { downloadPage } = require('./controller/downloadPage');
const { getLinksFromHTML, htmlParser } = require('./controller/htmlReaderNew');
const { indexer, filterStopwords } = require('./controller/indexer');
const {saveToDatabase, getURLs} = require('./services/saveToDatabase(postgresql)');

let queue = new Queue();
let history = [];
let callbackQueue = new Queue();
let waitingQueue = new Queue();
let root = {};

let filesList = [];
let activeURLs = {};
let fileID = 0;
let arrayIndexToVisit = 0;
let startIndexing = prompt('Press 1 to enter into indexing mode\nPress 2 to get URLs for a word\nPress 3 to start Crawler\nPress 4 to exit\n>> ');

if(startIndexing == '1'){
    let arrayRestore = fs.readFileSync('./restoreLastSession/arrayRestore.json', 'utf8');
    if(arrayRestore==undefined) process.exit(0);
    arrayRestore = JSON.parse(arrayRestore);
    let fileList = arrayRestore.array;
    let words = [];
    for(let i = 0; i < fileList.length; i++){
        words =[...words,...indexer(htmlParser(fs.readFileSync('./files/'+fileList[i].filename,'utf-8')),fileList[i].url)];
    }
    let wordsQueue = filterStopwords(words);
    // console.log(wordsQueue);
    saveToDatabase(wordsQueue);
    console.log('Indexer closed successfully');
    // process.exit(0);
}
else if(startIndexing == '2'){
    const word = prompt('Enter a word to search urls: ');
    console.log(`\nSearching urls for : ${word}...\n`);
    let i=1;
    (async () => {
        try {
          const listOfUrls = await getURLs(word.toLowerCase());
          listOfUrls?.forEach((item) => {
            console.log(i++,'-', item.url);
          });
        } catch (error) {
          console.error('Error:', error);
        }
      })();
      
}
else if(startIndexing == '3'){
console.log('Crawler started...\n');

let maxDepth = 5 ;
let isTesting = false;  //to activate testing mode
let sessionID;  //session ID for testing mode only
let isReaderStoped = false;
let arrayIndexToVisitRestore = fs.readFileSync('./restoreLastSession/arrayIndexToVisitRestore.json', 'utf8');
let arrayRestore = fs.readFileSync('./restoreLastSession/arrayRestore.json', 'utf8');
let fileIDRestore = fs.readFileSync('./restoreLastSession/fileIDRestore.json', 'utf8');
let maxDepthRestore = fs.readFileSync('./restoreLastSession/maxDepthRestore.json', 'utf8');
let queueRestore = fs.readFileSync('./restoreLastSession/queueRestore.json', 'utf8');
let waitingQueueRestore = fs.readFileSync('./restoreLastSession/waitingQueueRestore.json', 'utf8');
let callbackQueueRestore = fs.readFileSync('./restoreLastSession/callbackQueueRestore.json', 'utf8');
let historyRestore = fs.readFileSync('./restoreLastSession/historyRestore.json', 'utf8');
let sessionIDRestore = fs.readFileSync('./restoreLastSession/sessionIDRestore.json', 'utf8');

if(queueRestore.length>0){
    arrayIndexToVisitRestore = JSON.parse(arrayIndexToVisitRestore);
    arrayRestore = JSON.parse(arrayRestore);
    fileIDRestore = JSON.parse(fileIDRestore);
    maxDepthRestore = JSON.parse(maxDepthRestore);
    queueRestore = JSON.parse(queueRestore);
    waitingQueueRestore = JSON.parse(waitingQueueRestore);
    callbackQueueRestore = JSON.parse(callbackQueueRestore);
    historyRestore = JSON.parse(historyRestore);
    sessionIDRestore = JSON.parse(sessionIDRestore);

    arrayIndexToVisit = arrayIndexToVisitRestore.arrayIndexToVisit;
    filesList = arrayRestore.array;
    fileID = fileIDRestore.fileID;
    maxDepth = maxDepthRestore.maxDepth;
    queue.elements = queueRestore.elements;
    queue.head = queueRestore.head;
    queue.tail = queueRestore.tail;
    waitingQueue.elements = waitingQueueRestore.elements;
    waitingQueue.head = waitingQueueRestore.head;
    waitingQueue.tail = waitingQueueRestore.tail;
    callbackQueue.elements = callbackQueueRestore.elements;
    callbackQueue.head = callbackQueueRestore.head;
    callbackQueue.tail = callbackQueueRestore.tail;
    history = historyRestore.array;
    sessionID = sessionIDRestore.data;

    let choice = 'Y';
    while(choice != 'Y' || choice != 'y' || choice != 'N' || choice != 'n') {
        choice = prompt('Press Y to continue with last session\nPress N to start with new session (Y/N)\n>> : ');
        if(choice === 'Y' || choice === 'y'){
            root = queue.peak();
            let p = URL.parse(queue.peak().address);
            if(p.host == '127.0.0.1:8000') isTesting = true;
            break;
        }else if(choice === 'N' || choice === 'n'){
            delete(queue);
            queue = new Queue();
            arrayIndexToVisit = 0;
            delete(filesList);
            filesList = [];
            fileID = 0;
            root.address = prompt('Enter URL to start : ');
            root.depth = 0;
            queue.enqueue({address: root.address, depth: root.depth});
            maxDepth = prompt('Enter Maximum depth to crawl : ');
            fs.writeFile('./restoreLastSession/maxDepthRestore.json', JSON.stringify({maxDepth}),(error)=>{
                if(error) console.log('maxDepth in not saved properly');
            });
            break;
        }
        else{
            console.log('Please enter correct choice!')
        }
    }

}else{
    delete(queue);
    queue = new Queue();
    arrayIndexToVisit = 0;
    delete(filesList);
    filesList = [];
    fileID = 0;
    root.address = prompt('Enter URL to start : ');
    root.depth = 0;
    queue.enqueue({address: root.address, depth: root.depth});
    maxDepth = prompt('Enter Maximum depth to crawl : ');
    fs.writeFile('./restoreLastSession/maxDepthRestore.json', JSON.stringify({maxDepth}),(error)=>{
        if(error) console.log('maxDepth in not saved properly');
    });
}

//Add root url to history
history.push(root.address);

if(root.address == 'http://127.0.0.1:8000/start_session'){
    isTesting = true;
    queue.dequeue();
    axios.get(root.address).then((response,reject) => {
        if(response?.data){
            sessionID = response.data.data;
            root.address = 'http://127.0.0.1:8000/seed_session';
            root.depth = 0;
            queue.enqueue({address: root.address, depth: root.depth});
            fs.writeFile('./restoreLastSession/sessionIDRestore.json', JSON.stringify({data: sessionID}),(err)=>{
                if(!err)
                console.log(`Session ID (${sessionID}) saved...`);
            });
            // console.log(`\n\nConnecting to => `);
            // downloadPage(root.address, root.depth, fileID++, isTesting, sessionID, filesList);
            }
    }).catch((reject) => { console.log(reject.message,'\n','Crawler closed'); process.exit(0);});
}

let activeURLsCounter = 0;

let counterIntervalID = setInterval(()=>{
    if(activeURLsCounter>0) activeURLsCounter--;
},4000);
let waitingQueueIntervalID = setInterval(()=>{if(waitingQueue.peak()) callbackQueue.enqueue(waitingQueue.dequeue()); fs.writeFile('./restoreLastSession/callbackQueueRestore.json',JSON.stringify(callbackQueue),(error)=>{if(error){
    console.log('Callback queue note saved!');
}})},12000);
let crawlerID = setInterval(function(){
    console.log(activeURLsCounter, '<<<< counter');
    console.log(activeURLs);
    if(activeURLsCounter<15){
        if(callbackQueue.peak()||queue.peak()||waitingQueue.peak()){
            root = callbackQueue.peak() ? callbackQueue.dequeue() : queue.peak() ? queue.dequeue() : waitingQueue.dequeue();
            const q = URL.parse(root.address);
            if(!(q.host in activeURLs)){
                activeURLs[q.host] = 1;
                activeURLsCounter++;
                setTimeout(()=>{
                    activeURLs[q.host]--;
                    if(activeURLs[q.host]<1){
                        delete activeURLs[q.host];
                    }
                },60000);
                downloadPage(root.address, root.depth, fileID++, isTesting, sessionID, filesList);
            }
            else if(activeURLs[q.host]<5){
                activeURLs[q.host]++;
                activeURLsCounter++;
                setTimeout(()=>{
                    activeURLs[q.host]--;
                    if(activeURLs[q.host]<1){
                        delete activeURLs[q.host];
                    }
                },60000);
                downloadPage(root.address, root.depth, fileID++, isTesting, sessionID, filesList);
            }
            else{
                waitingQueue.enqueue(root);
                fs.writeFile('./restoreLastSession/waitingQueueRestore.json', JSON.stringify(waitingQueue),(queue)=>{ if(error) console.log('waiting queue not saved!')});
            }
            fs.writeFile('./restoreLastSession/queueRestore.json', JSON.stringify(queue),(error)=>{ if(error) console.log('Queue data not saved!');});
            // isTesting ? console.log(root.address, root.depth, isTesting, sessionID) : console.log(root.address, root.depth);
            // downloadPage(root.address, root.depth, fileID++, isTesting, sessionID, filesList);
        }
        else{
            if(isReaderStoped) {
                fs.writeFile('./restoreLastSession/queueRestore.json','',(error)=>{ if(!error) console.log('Queue data saved...');});
                if(isTesting){
                    axios.get(`http://127.0.0.1:8000/stop_session?sessionid=${sesssionid}`).then((response)=>{
                        if(response?.data){
                            console.log(response.data);
                            console.log('Crawler Stopped successfully');
                            clearImmediate(waitingQueueIntervalID)
                            clearInterval(counterIntervalID);
                            clearInterval(crawlerID);
                        }
                    });
                }else{
                    console.log('Crawler Stopped successfully');
                    clearImmediate(waitingQueueIntervalID)
                    clearInterval(counterIntervalID);
                    clearInterval(crawlerID);
                }
            }
        }
    }
},1000);

let fileReaderID = setInterval(function () {
    if(arrayIndexToVisit < filesList.length)
    {   
        if(filesList[arrayIndexToVisit]!=undefined){

            if(filesList[arrayIndexToVisit].depth == maxDepth){ 
                isReaderStoped = true;
                console.log('\n*******************\n\nFile Reader stoped...\n\n*******************\n'); 
                clearInterval(fileReaderID);
            }
            let data = fs.readFileSync(`./files/${filesList[arrayIndexToVisit].filename}`,'utf-8');
            getLinksFromHTML(filesList[arrayIndexToVisit].url, data, filesList[arrayIndexToVisit].depth, queue, history);
            arrayIndexToVisit++;
            fs.writeFile('./restoreLastSession/arrayIndexToVisitRestore.json', JSON.stringify({arrayIndexToVisit}),(error)=>{
                if(error) { console.log('Index is not stored properly'); }
            });
        }
    }
},5000);

}else{
    console.log('Closed Successfully');
    process.exit(0);
}