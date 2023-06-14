const fs = require('fs');
function getLinksFromHTML(file, depth, queue){
    let temp = "";
    pattern = 'href="';
    let j=0;
    let start = file.search('body');
    let end = file.search('/body');

    file = file.slice(start-1, end+6);
    for(let i = 0; i<file.length; i++){
        if(pattern[j] == file[i]){
            j++;
            if(j==6){
                i++;
                while(file[i]!='"'){
                    temp += file[i];
                    i++;
                }
                fs.writeFileSync(`./URLs/depth-${depth}.text`,(JSON.stringify('http://localhost:3541'+temp)+'\n'),{ flag: 'a+'},function(err){
                        if(!err) console.log('URL added');
                    }
                )
                queue.enqueue({address: 'http://localhost:3541'+temp, depth: depth})
                temp="";
                j=0;
            }
        }
        else{
            j=0;
        }
    }
    console.log("Linkes extracted...");
}

module.exports = { getLinksFromHTML };