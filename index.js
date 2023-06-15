const prompt = require('prompt-sync')({sigint: true});
const fs = require('fs');
const {Queue} = require('./jsqueue');
const { loadPage } = require('./crawler');
const { resetTable } = require('./database');

let queue = new Queue();
let root = {};
let maxDepth = 5 ;
let emptyQueueCounter = 0;
let counter = 0;
let queueRestore = fs.readFileSync('./queueData.json', 'utf8');

if(queueRestore.length > 0){
    queueRestore = JSON.parse(queueRestore);
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
    root.address = prompt('Enter URL : ');
    root.depth = 0;
    maxDepth = Number(prompt('Max depth : '));
    resetTable();
}


function caller( breakTime){
    let intervalID = setInterval(function() {
        if(!queue.peak()){
            if(emptyQueueCounter<6){
                setTimeout(() => {
                    for(let i=0; i<5; i++){
                        const element = queue.dequeue();
                        if(element==undefined || queue.isEmpty() || element.depth == maxDepth) {
                            if(element.depth == maxDepth){
                                fs.writeFile('./queueData.json','',()=>{});
                                console.log("Crawler closed successfully...");
                                clearInterval(intervalID);
                            }
                            else console.log("waiting...");
                        }
                        else{
                            console.log(`\n\n[level ${element.depth}] Connecting to => ` + element.address);
                            loadPage(element.address, element.depth, counter++, queue).then(async (res) => {
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
    },breakTime);

}

console.log(`\n\n[level ${root.depth}] Connecting to => ` + root.address);

loadPage(root.address, root.depth, counter++, queue).then((response) => {
        if(!queue.peak()){
            if(emptyQueueCounter<6){
                setTimeout(() => {
                    for(let i=0; i<5; i++){
                        const element = queue.dequeue();
                        if(element==undefined || queue.isEmpty() || element.depth == maxDepth) {
                            if(element.depth == maxDepth){
                                fs.writeFile('./queueData.json','',()=>{});
                                console.log("Crawler closed successfully...");
                                clearInterval(intervalID);
                            }
                            else console.log("waiting...");
                        }
                        else{
                            console.log(`\n\n[level ${element.depth}] Connecting to => ` + element.address);
                            loadPage(element.address, element.depth, counter++, queue).then(async (res) => {
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
        caller(60000);
});