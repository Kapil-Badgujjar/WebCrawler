const fs = require('fs');
const URL = require('url');
function getLinksFromHTML(url, file, depth, queue){
    let temp = "";
    pattern = 'href="';
    let j=0;
    let start = file.search('body');
    let end = file.search('/body');
    const q = URL.parse(url);
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
                if(temp.slice(0,5) !='https'){
                    if(temp.slice(0,4) != 'http'){
                        if(q.host.slice(0,9)=='localhost'||q.host.slice(0,9)=='127.0.0.1'){
                            temp = 'http://' + q.host + temp;
                        }else{
                            temp = 'https://' + q.host + temp;
                        }
                    }
                }
                fs.writeFile(`./URLs/depth-${depth}.text`,(JSON.stringify(temp)+'\n'),{ flag: 'a+'},function(err){
                    }
                )
                queue.enqueue({address: temp, depth: depth})
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