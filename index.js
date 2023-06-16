const axios = require('axios');
const prompt = require('prompt-sync')({sigint: true});
const fs = require('fs');
const {Queue} = require('./jsqueue');
const { loadPage } = require('./crawler');
const { resetTable } = require('./database');
const URL = require('url');

let queue = new Queue();
let root = {};
let maxDepth = 5 ;
let isTesting = false;
let sessionID;
let emptyQueueCounter = 0;
let counter = 0;
let queueRestore = fs.readFileSync('./queueData.json', 'utf8');
let sessionIDRestore = fs.readFileSync('./lastSessionID.json', 'utf8');
let counterRestore = fs.readFileSync('./counter.json', 'utf8');

if(queueRestore.length > 0){
    queueRestore = JSON.parse(queueRestore);
    sessionIDRestore = JSON.parse(sessionIDRestore);
    counterRestore = JSON.parse(counterRestore);
    
    queue.elements = queueRestore.elements;
    queue.head = queueRestore.head;
    queue.tail = queueRestore.tail;
    sessionID = sessionIDRestore.data;
    counter = counterRestore.counter ? counterRestore.counter : 0;
    let flag = 'Y';
    do{
        flag = prompt('Press Y to continue last session/Press N to start with new session (Y/N) : ');
        if(flag === 'Y' || flag === 'y'){
            root = queue.dequeue();
            const p = URL.parse(root.address);
            if(p.host == '127.0.0.1' && p.port == '8000' ) isTesting = true;
            break;
        }else if(flag === 'N' || flag === 'n'){
            delete(queue);
            queue = new Queue();
            counter = 0;
            root.address = prompt('Enter URL : ');
            root.depth = 0;
            maxDepth = Number(prompt('Max depth : '));
            resetTable();
            break;
        }
        else{
            console.log('Please enter correct choice!')
        }
    }while(flag != 'Y' || flag != 'y'||flag != 'N' || flag != 'n');

}
else{
    delete(queue);
    queue = new Queue();
    counter = 0;
    root.address = prompt('Enter URL : ');
    root.depth = 0;
    maxDepth = Number(prompt('Max depth : '));
    resetTable();
}

if(root.address == 'http://127.0.0.1:8000/start_session'){
    isTesting = true;
    axios.get(root.address).then((response) => {
        if(response?.data){
            sessionID = response.data.data;
            root.address = 'http://127.0.0.1:8000/seed_session';
            fs.writeFile('./lastSessionID.json', JSON.stringify({data: sessionID}),(err)=>{
                if(!err)
                console.log(`Session ID (${sessionID}) saved...`);
            });
            console.log(`\n\nConnecting to => `);
            loadPage(root.address, root.depth, counter++, queue, isTesting, sessionID).then((response) => {
                fun(false, undefined);
                caller(60000);
            });
        }
    })
}

function fun(flag, intervalID){
    if(!queue.peak()){
        if(emptyQueueCounter<6){
            setTimeout(() => {
                for(let i=0; i<5; i++){
                    const element = queue.dequeue();
                    if(element==undefined || queue.isEmpty() || element.depth == maxDepth) {
                        if(flag == true && element.depth == maxDepth){
                            fs.writeFile('./queueData.json','',()=>{});
                            console.log("Crawler closed successfully...");
                            clearInterval(intervalID);
                        }
                        else console.log("waiting...");
                    }
                    else{
                        console.log(`\n\nConnecting to => `);
                        loadPage(element.address, element.depth, counter++, queue, isTesting, sessionID).then(async (res) => {
                        });
                        
                    }
                }
                let backupQueue = JSON.stringify({...queue});
                fs.writeFile('./queueData.json', backupQueue,()=>{});
            },10000);
            emptyQueueCounter++;
        }
        else{
            fs.writeFile('./queueData.json', "", ()=>{});
            console.log("Empty queue! \nCrawler closed successfully...");
            clearInterval(intervalID);
        }
        
    }else{
        for(let i=0; i<5; i++){
            const element = queue.dequeue();
            if(element==undefined || queue.isEmpty()) {
                if(element.depth == maxDepth){
                    fs.writeFile('./queueData.json','',()=>{});
                    console.log("Crawler closed successfully...");
                    clearInterval(intervalID);
                }
                else break;
            }
            else{
                console.log(`\n\nConnecting to => `);
                loadPage(element.address, element.depth, counter++, queue, isTesting, sessionID).then(async (res) => {
                });
            }
        }
        let backupQueue = JSON.stringify({...queue});
        fs.writeFile('./queueData.json', backupQueue,()=>{});
        emptyQueueCounter = 0;
    }
}

function caller( breakTime){
    let intervalID = setInterval(function() {
        fun(true, intervalID);
    },breakTime);

}
if(!isTesting){
    console.log(`\n\nConnecting to => `);
    loadPage(root.address, root.depth, counter++, queue, isTesting, sessionID).then((response) => {
            fun(false, undefined);
            caller(60000);
    });
}