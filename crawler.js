const axios = require('axios');
const fs = require('fs');
const { getLinksFromHTML } = require('./htmlReaderNew');
const { addURLToTable } = require('./database');
async function loadPage(url, depth, counter, queue) {
    try{
        const {data} = await axios.get(url,{Credential:true});
        if(data){
            getLinksFromHTML(url, data, depth+1, queue);
            console.log("Links added to queue...");
            const filename = `htmlCodeFile${counter}.html`;
            if(!fs.existsSync(`./files/depth-${depth}`)){
                fs.mkdir(`./files/depth-${depth}`,(error) => {
                    if(!error){
                        fs.writeFile(`./files/depth-${depth}/`+filename, data,(error) => {
                            if(!error){
                                console.log("File saved")
                            }
                        });
                    }
                });
            }
            else{
                fs.writeFile(`./files/depth-${depth}/`+filename, data,(error) => {
                    if(!error){
                        console.log("File saved")
                    }
                });
            }
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