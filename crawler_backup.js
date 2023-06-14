const axios = require('axios');
const fs = require('fs');
const { getLinksFromHTML } = require('./htmlReaderNew');
const { addURLToTable } = require('./database');
async function loadPage(url, depth, counter, queue) {
    try{
        const {data} = await axios.get(url,{Credential:true});
        if(data){
            const filename = `htmlCodeFile${counter}.html`;
            fs.writeFileSync('./files/'+filename, data);
            console.log("File saved")
            const code = fs.readFileSync(`./files/`+filename,'utf-8');
            getLinksFromHTML(url, code, depth+1, queue);
            console.log("Links added to queue...")
            return addURLToTable(url,filename,depth);
        }
    }catch (error){
        filename = `failed_request_logs-${counter}.txt`;
        fs.writeFileSync('./failedRequests/'+filename, 'URL: ' + url+'\n\nError Message:\n'+ error.message);
        console.log(error.message);
        return true;
    }
}

module.exports = { loadPage };