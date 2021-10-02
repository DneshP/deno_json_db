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

db.update('name', {$find:{filterParam}, $set:{UpdateData}}); yep, ATM -> $find -> runs AND operations only.

db.find('name', {filterParam});

db.delete('name', {filterParam});

Documentation -> https://doc.deno.land/https/deno.land/x/deno_json_db@yo/index.js

Contribute

for sure! create an issue ;)
