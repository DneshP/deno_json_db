import { Database, assertEquals, assertObjectMatch } from "../deps.js";

/**
 * Tests
 */

function assertResponse(response, responseStatus, message) {
    assertEquals(response.status,responseStatus);
    assertEquals(response.message, message);
}

Deno.test("Init Database", async () => {
    const db = new Database('testDB');
    const response = await db.isfileExists('test');
    assertEquals(response, true);
    db.removeDB('testDB');
});

Deno.test("find a collection which does not exists", async () => {
    const db = new Database('testDB');
    const response = await db.find('users', {});
    assertResponse(response, false, 'There is no users collection available, Try creating one first.');
    db.removeDB('testDB');
});

Deno.test("update a collection which does not exists", async () => {
    const db = new Database('testDB');
    const response = await db.find('users', {});
    assertResponse(response, false, 'There is no users collection available, Try creating one first.');
    db.removeDB('testDB');
});

Deno.test("delete a collection which does not exists", async () => {
    const db = new Database('testDB');
    const response = await db.find('users', {});
    assertResponse(response, false, 'There is no users collection available, Try creating one first.');
    db.removeDB('testDB');
});

Deno.test("Insert a record into a collection", async () => {
    const db = new Database('testDB');
    const found = await db.find('users');
    if (found.status) {
        await db.delete('users');
    }
    const response = await db.insert('users', {id: 1, name:"yo", email:"its@d.com"});
    assertResponse(response, true, 'Data inserted');
    const getInserted = await db.find('users', {id:1});
    delete getInserted.message[0]._id; // _id is auto generated
    assertResponse(getInserted, true, [{ id: 1, name: "yo", email: "its@d.com"}]);
    db.removeDB('testDB');
});

Deno.test("Update a records in a collection", async () => {
    const db = new Database('testDB');
    const found = await db.find('users');
    if (found.status) {
        await db.delete('users');
    }
    await db.insert('users', {id: 1, name:"yo", email:"its@d.com"});
    const response = await db.update('users', {$find: {name: 'yo', email:"its@d.com"}, $set: {new: "update@d.com"}});
    assertResponse(response, true, 'Data Updated');
    const updated = await db.find('users');
    delete updated.message[0]._id; // _id is auto generated
    assertResponse(updated, true, [ { id: 1, name: "yo", email: "its@d.com", new: "update@d.com" } ]);
    db.removeDB('testDB');
});

Deno.test("Delete a record from the collection", async () => {
    const db = new Database('testDB');
    const found = await db.find('users');
    if (found.status) {
        await db.delete('users');
    } 
    await db.insert('users', {id: 1, name:"yo", email:"its@d.com"});
    const response = await db.delete('users', {id:1});
    assertResponse(response, true, 'Removed');
    const find = await db.find('users');
    assertResponse(find, true, []);
    db.removeDB('testDB');
});

Deno.test('Validate update object signature', async () => {
    const db = new Database('testDB');
    await db.insert('muggles', {id: 1, name:"yo", email:"its@d.com"});
    const response = await db.update('muggles', {name:"test"},{name: "newTest"});
    assertResponse(response, false, 'Invalid Update Data Object Signature. Please call updateSignature() to check the valid object signature');
    db.removeDB('testDB');
});

