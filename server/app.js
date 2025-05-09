const sqlite = require('sqlite3').verbose();

let sql;

const db = new sqlite3.Database('./test.db', sqlite.OPEN_READWRITE, (err)=>{
    if (err) return console.error;
});

sql =`CREATE TABLE Teachers(id INTEGER PRIMARY KEY, name, email, subject)`;
console.log("something");
try{
    db.run(sql);
    console.log("Table Created")
} catch (err){
    console.error;
}
