# deno_json_db
A Simple Deno JSON DB
Yo!
Clone the repo
You need deno to run this Database class 
follow these https://deno.land/manual@v1.14.0/getting_started/installation instructions to install Deno
Deno is secure by default so to run the DB Class
you gotta run => deno run -A ./index.js (-A -> grants all permissions)

So here's the deal 

const db = new Database(path); -> This will be the main DB directory which will hold the collections (.json files)
db.insert('name', {insertData}); -> you can create multiple collections ;)
db.update('name', {$find:{filterParam}, $set:{UpdateData}}); yep
db.find('name', {filterParam});
db.delete('name', {filterParam});

I will provide a link to the documentation once I have it. 
