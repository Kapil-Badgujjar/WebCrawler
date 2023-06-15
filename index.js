const fs = require('fs');

const {Queue} = require('./jsqueue');
const { loadPage } = require('./crawler');
const { resetTable } = require('./database');

let queue = new Queue();
let address;
if(process.argv[3] == undefined) {
    const queueRestore = (JSON.parse(fs.readFileSync('./queueData.json', 'utf8')));
    queue.elements = queueRestore.elements;
    queue.head = queueRestore.head;
    queue.tail = queueRestore.tail;
    root = queue.dequeue();
}
else{
    root= {
        address : process.argv[3],
        depth : 0
    }
}
const maxDepth = process.argv[2] ? process.argv[2] : 5 ;
let emptyQueueCounter = 0;

let counter = 0;

resetTable();

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
        // caller(60000);
        // console.log(queue);
});

