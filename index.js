const axios = require('axios');
const prompt = require('prompt-sync')({sigint: true});
const fs = require('fs');
const {Queue} = require('./jsqueue');
const { loadPage } = require('./crawler');
const { resetTable } = require('./database');

let queue = new Queue();
let root = {};
let maxDepth = 5 ;
let isTesting = false;
let sessionID;
let emptyQueueCounter = 0;
let counter = 0;
let queueRestore = fs.readFileSync('./queueData.json', 'utf8');
let sessionIDRestore = fs.readFileSync('./lastSessionID.json', 'utf8');

if(queueRestore.length > 0){
    queueRestore = JSON.parse(queueRestore);
    sessionIDRestore = JSON.parse(sessionIDRestore);
    sessionID = sessionIDRestore.data;
    queue.elements = queueRestore.elements;
    queue.head = queueRestore.head;
    queue.tail = queueRestore.tail;
    let flag = 'Y';
    do{
        flag = prompt('Press Y to continue last session/Press N to start with new session (Y/N) : ');
        if(flag === 'Y' || flag === 'y'){
            root = queue.dequeue();
            break;
        }else if(flag === 'N' || flag === 'n'){
            delete(queue);
            queue = new Queue();
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
    root.address = prompt('Enter URL : ');
    root.depth = 0;
    maxDepth = Number(prompt('Max depth : '));
    resetTable();
}

if(root.address == 'http://127.0.0.1:8000/start_session'){
    isTesting = true;
    async function testModeFun(){
        const response = await axios.get(root.address, {withCredentials: true});
        sessionID = response.data.data;
        console.log(response.data);
        fs.writeFile('./lastSessionID.json', JSON.stringify(response.data),(err)=>{
            console.log(`Session ID (${response.data.data}) saved...`);
        });
    }
    testModeFun();
    root.address = 'http://127.0.0.1:8000/seed_session';
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
                        console.log(`\n\n[level ${element.depth}] Connecting to => ` + element.address);
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
        for(let i=0; i<6; i++){
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
                console.log(`\n\n[level ${element.depth}] Connecting to => ` + element.address);
                loadPage(element.address, element.depth, counter++, queue).then(async (res) => {
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

console.log(`\n\n[level ${root.depth}] Connecting to => ` + root.address);

loadPage(root.address, root.depth, counter++, queue, isTesting, sessionID).then((response) => {
        // if(!queue.peak()){
        //     if(emptyQueueCounter<6){
        //         setTimeout(() => {
        //             for(let i=0; i<5; i++){
        //                 const element = queue.dequeue();
        //                 if(element==undefined || queue.isEmpty() || element.depth == maxDepth) {
        //                   console.log("waiting...");
        //                 }
        //                 else{
        //                     console.log(`\n\n[level ${element.depth}] Connecting to => ` + element.address);
        //                     loadPage(element.address, element.depth, counter++, queue).then(async (res) => {
        //                     });
        //                 }
        //             }
        //             let backupQueue = JSON.stringify({...queue});
        //             fs.writeFile('./queueData.json', backupQueue,()=>{});
        //         },10000);
        //         emptyQueueCounter++;
        //     }
        //     else{
        //         fs.writeFile('./queueData.json', "", ()=>{});
        //         console.log("Empty queue! \nCrawler closed successfully...");
        //         clearInterval(intervalID);
        //     }
            
        // }else{
        //     for(let i=0; i<5; i++){
        //         const element = queue.dequeue();
        //         if(element==undefined || queue.isEmpty()) {
        //             if(element.depth == maxDepth){
        //                 console.log("Crawler closed successfully...");
        //                 clearInterval(intervalID);
        //             }
        //             else break;
        //         }
        //         else{
        //             console.log(`\n\n[level ${element.depth}] Connecting to => ` + element.address);
        //             loadPage(element.address, element.depth, counter++, queue).then(async (res) => {
        //             });
        //         }
        //     }
        //     let backupQueue = JSON.stringify({...queue});
        //     fs.writeFile('./queueData.json', backupQueue,()=>{});
        //     emptyQueueCounter = 0;
        // }
        fun(false, undefined);
        caller(60000);
});