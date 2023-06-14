const { loadPage } = require('./crawler');

const {Queue} = require('./jsqueue');
const { resetTable } = require('./database');

let queue = new Queue();
const maxDepth = process.argv[3];
let breakTime = 5000;
let emptyQueueCounter = 0;

let counter = 0;

resetTable();

loadPage(process.argv[2], 0, counter++, queue).then((response) => {
    let intervalID = setInterval(function() {
        if(!queue.peak()){
            if(emptyQueueCounter<6){
                setTimeout(() => {
                    for(let i=0; i<5; i++){
                        const element = queue.dequeue();
                        if(element==undefined || queue.isEmpty() || element.depth == maxDepth) {
                            console.log("waiting...");
                        }
                        else{
                            console.log(`\n\n[level ${element.depth}] Connecting to => ` + element.address);
                            loadPage(element.address, element.depth, counter++, queue).then(async (res) => {
                                }
                            );
                        }
                    }
                },10000);
                emptyQueueCounter++;
            }
            else{
                console.log("Empty queue! \nCrawler closed successfully...");
                clearInterval(intervalID);
            }
            
        }else{
            for(let i=0; i<5; i++){
                const element = queue.dequeue();
                if(element==undefined || queue.isEmpty() || element.depth == maxDepth) {
                    console.log("Crawler closed successfully...");
                    clearInterval(intervalID);
                }
                else{
                    console.log(`\n\n[level ${element.depth}] Connecting to => ` + element.address);
                    loadPage(element.address, element.depth, counter++, queue).then(async (res) => {
                        }
                    );
                }
            }
            emptyQueueCounter = 0;
        }
    },breakTime);
});

