// let address = process.argv[2];
const fs = require('fs');
const { loadPage } = require('./crawler');

const {Queue} = require('./jsqueue');
const { resetTable } = require('./database');

let queue = new Queue();
// let depth = 0;
const maxDepth = process.argv[3];
// const breakTime = process.argv[4];

let counter = 0;

queue.enqueue();

resetTable();

loadPage(process.argv[2], 0, counter++, queue).then(async (response) => {
    let intervalID = setInterval(function() {
        for(let i=0; i<5; i++){
            const element = queue.dequeue();
            if(element==undefined || queue.isEmpty() || element.depth == maxDepth) {
                console.log("Crawler closed successfully");
                clearInterval(intervalID);
            }
            else{
                console.log(`\n\n[level ${element.depth}] Connecting to => ` + element.address);
                loadPage(element.address, element.depth, counter++, queue).then(async (response) => {
                    }
                );
            }
        }
    },20000);
});

