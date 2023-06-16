const axios = require('axios');
const fs = require('fs');
const { getLinksFromHTML } = require('./htmlReaderNew');
const { addURLToTable } = require('./database');
const URL = require('url');
async function loadPage(url, depth, counter, queue, flag, sid) {
    console.log(url,` -  sessionID: ${sid},`, `depth: ${depth}`);
    try{
        const {data} = await axios.get(flag ? url+`?sid=${sid}&depth=${depth}` : url, {Credential:true});
        if(data){
            getLinksFromHTML(url, data, depth+1, queue);
            console.log("Links added to queue...");
            let filename;
            if(!flag) { 
                filename = `htmlCodeFile${counter}.html`
                if(!fs.existsSync(`./otherFiles/depth-${depth}`)){
                    fs.mkdir(`./otherFiles/depth-${depth}`,(error) => {
                        if(!error){
                            fs.writeFile(`./otherFiles/depth-${depth}/`+filename, data,(error) => {
                                if(!error){
                                    console.log("File saved...  :-",filename);
                                }
                            });
                        }
                    });
                }
                else{
                    fs.writeFile(`./files/depth-${depth}/`+filename, data,(error) => {
                        if(!error){
                            console.log("File saved...  :-",filename);
                        }
                    });
                }
            }else{
                const q = URL.parse(url);
                filename = `FID${counter}_${q.pathname}_sessionid-${sid}_depth-${depth}.html`;
                if(!fs.existsSync(`./files/session-${sid}`)){
                    fs.mkdir(`./files/session-${sid}`,()=>{
                        fs.mkdir(`./files/session-${sid}/depth-${depth}`,(error) => {
                            if(!error){
                                fs.writeFile(`./files/session-${sid}/depth-${depth}/`+filename, data,(error) => {
                                    if(!error){
                                        console.log("File saved...  :-",filename);
                                    }
                                });
                            }
                        });
                    });
                }
                else if (!fs.existsSync(`./files/session-${sid}/depth-${depth}`)){
                    fs.mkdir(`./files/session-${sid}/depth-${depth}`,(error) => {
                        if(!error){
                            fs.writeFile(`./files/session-${sid}/depth-${depth}/`+filename, data,(error) => {
                                if(!error){
                                    console.log("File saved...  :-",filename);
                                }
                            });
                        }
                    });
                }
                else {
                    fs.writeFile(`./files/session-${sid}/depth-${depth}/` + filename, data, (error) => {
                        if(!error){
                            console.log("File saved...  :-",filename);
                        }
                    });
                }
            }
            fs.writeFile('./counter.json', JSON.stringify({counter: counter}),(error)=>{});
            addURLToTable(url,filename,depth);
            return true;
        }
    }catch (error){
        filename = `failed_request_logs-${counter}.txt`;
        fs.writeFile('./failedRequests/'+filename, 'URL: ' + url+'\n\nError Message:\n'+ error.message, (err) => {
            if(err) console.log
            console.log(error.message);
        });
        return true;
    }
}

module.exports = { loadPage };