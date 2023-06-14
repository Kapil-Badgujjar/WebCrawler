const sql = require('mssql');
const configuration = {
    user: 'abc',    // username in database
    password: 'abc',    // password of the user in database
    server:'KAPIL-PC\\SQLEXPRESS',  // database server
    database: 'WebCrawler', // database name
    options: {
        trustServerCertificate: true
    }
}

async function addURLToTable(url,filename,depth){
    const pool = await sql.connect(configuration);
    try{
      await pool.request().query(`INSERT INTO WebCrawlerTable VALUES( '${url}', '${filename}', ${depth})`);
      await pool.close();
      return true;
    }
    catch(err){
      console.log(err.message);
      await pool.close();
      return false;
    }
  }

  async function getFileName(depth){
    const pool = await sql.connect(configuration);
    try{
      const data = await pool.request().query(`SELECT codefilename FROM WebCrawlerTable WHERE depth = ${depth}`);
      await pool.close();
      return data.recordset;
    }
    catch(err){
      console.log(err.message);
      await pool.close();
      return [];
    }
  }

  async function resetTable(){
    const pool = await sql.connect(configuration);
    try{
      const data = await pool.request().query(`TRUNCATE TABLE WebCrawlerTable`);
      await pool.close();
      return true;
    }
    catch(err){
      console.log(err.message);
      await pool.close();
      return false;
    }
  }

  module.exports = {addURLToTable, getFileName, resetTable};