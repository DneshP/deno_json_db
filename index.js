/**
 * Database Handler
 */
export class Database {
  constructor(path) {
    this.path = path;
    this.seperator = "/";
    this.encoder = new TextEncoder();
    this._initDB();
  }

  #json = ".json";

  #uuid;

  /**
   * Initialises the db
   */
  _initDB() {
    const [data, error] = this.tryCatch(Deno.lstatSync, this.directory);
    if (error instanceof Deno.errors.NotFound) {
      const [create, initError] = this.tryCatch(
        Deno.mkdirSync,
        this.directory,
        { mode: 0o777 },
      );
      if (initError) {
        throw new Error("Error initialising DB", initError);
      }
    }
  }

  /**
   * Returns the current db directory
   */
  get directory() {
    return this.path + this.seperator;
  }

  /**
   * Returns a response object
   * @param {boolean} status
   * @param {string} message
   * @returns
   */
  getResponse(status, message = "") {
    return { status, message };
  }

  /**
   * Checks if a path exists
   * @param {string} path
   * @returns {boolean}
   */
  async isfileExists(path) {
    console.log(path);

    const { data, error } = await this.wrapTryCatch(Deno.lstat, path);
    console.log({ data, error });
    return error ? false : true;
  }

  /**
   * fetches file info
   * @param {string} path
   * @returns {boolean}
   */
  async fileInfo(path) {
    return await this.wrapTryCatch(Deno.lstat, path);
  }

  /**
   * Returns a permission object for file
   * @returns {object}
   */
  get allPermissions() {
    return { read: true, write: true, truncate: true, create: true };
  }

  /**
   * Returns directory options
   * @returns {object}
   */
  get directoryOptions() {
    return { recursive: true, mode: 0o700 };
  }

  /**
   * Wraps the method around a tryCatch Block
   * returns a [data, error]
   * @param {} method
   * @param  {...any} values
   * @returns {object}
   */
  async wrapTryCatch(method, ...values) {
    try {
      const response = await method(...values);
      return [response, null];
    } catch (error) {
      return [null, error];
    }
  }

  /**
   * Wraps the method around a tryCatch Block for synchronous methods
   * returns a [data, error]
   * @param {function} method
   * @param  {...any} values
   * @returns {object}
   */
  tryCatch(method, ...values) {
    try {
      const response = method(...values);
      return [response, null];
    } catch (error) {
      return [null, error];
    }
  }

  /**
   * Returns a collection default path
   * @returns {string}
   */
  collectionPath(name) {
    return this.directory + name + this.#json;
  }

  /**
   * Returns a unique UUID
   * @returns
   */
  get randomUUID() {
    return crypto.randomUUID();
  }

  /**
   * Creates a directory if not exists
   * returns a response object
   * @param {string} name
   * @param {object} [directoryOptions]
   * @returns {object} response object
   */
  async createDirectory(name, directoryOptions = {}) {
    const directory = this.directory + name;
    const [data, error] = await this.wrapTryCatch(Deno.lstat, directory);
    if (!error) {
      return this.getResponse(false, "Directory Exists");
    }
    if (error instanceof Deno.errors.NotFound) {
      const [data, error] = await this.wrapTryCatch(
        Deno.mkdir,
        directory,
        directoryOptions,
      );
      return error
        ? this.getResponse(false, error)
        : this.getResponse(true, "Directory created");
    }
  }

  /**
   * Returns a valid update signature object
   * filter only supports AND opeartion on the object
   * @returns {object}
   */
  updateSignature() {
    return {
      "$find": {},
      "$set": {},
    };
  }

  /**
   * Validates the update object
   * @param {object} update
   * @returns {boolean}
   */
  validateUpdateSignature(update) {
    const validFilters = ["$find", "$set"];
    if (!Object.keys(update).every((key) => validFilters.includes(key))) {
      return false;
    }
    for (const [key, updateObject] of Object.entries(update)) {
      for (const updateKey in updateObject) {
        if (Object.hasOwnProperty.call(updateObject, updateKey)) {
          if (updateKey === "_id") {
            return this.getResponse(
              false,
              "Cannot update _id it is system generated value",
            );
          }
          if (!updateObject[updateKey]) {
            if (!this.isfalsyValue(updateObject[updateKey])) {
              return false;
            }
          }
        }
      }
    }
    return true;
  }

  /**
   * Checks if a obect is empty
   * @param {object} object
   * @returns
   */
  isEmpty(object) {
    return (
      object &&
      Object.keys(object).length === 0 &&
      Object.getPrototypeOf(object) === Object.prototype
    );
  }

  /**
   * Checks if the value is falsy
   * @param {any} value
   * @returns {boolean}
   */
  isfalsyValue(value) {
    return (value === false || value === 0 || value === -0) ?? false;
  }

  /**
   * Removes the DB directory
   * @param {string} name
   */
  async removeDB(name) {
    const [response, error] = await this.wrapTryCatch(Deno.remove, name, {
      recursive: true,
    });
    return error
      ? this.getResponse(false, error)
      : this.getResponse(true, "DB Removed");
  }

  /**
   * Fetches the data object from a collection
   * @param {string} name
   * @param {object} filterParam
   * @returns {object} response object
   */
  async find(name, filterParam = undefined, getByIndex = false) {
    let filterData;
    const [rawData, error] = await this.wrapTryCatch(
      Deno.readTextFile,
      this.collectionPath(name),
    );
    if (error instanceof Deno.errors.NotFound) {
      return this.getResponse(
        false,
        `There is no ${name} collection available, Try creating one first.`,
      );
    }
    const data = JSON.parse(rawData);
    filterData = data;
    const dataByIndex = [];
    const isFilterParamEmpty = this.isEmpty(filterParam);
    if (filterParam && !isFilterParamEmpty) {
      filterData = data.filter((each, index) => {
        for (const filterKey in filterParam) {
          if (Object.hasOwnProperty.call(filterParam, filterKey)) {
            const element = filterParam[filterKey];
            if (
              !each.hasOwnProperty(filterKey) || !(each[filterKey] === element)
            ) {
              return false;
            }
          }
        }
        dataByIndex.push({ [index]: each });
        return true;
      });
    }
    if (getByIndex && !isFilterParamEmpty) {
      filterData = dataByIndex;
    }
    return error
      ? this.getResponse(false, error)
      : this.getResponse(true, filterData);
  }

  /**
   * Inserts a record into the respective collection
   * @param {string} name
   * @param {object} data
   * @returns {object} response object
   */
  async insert(name, data) {
    if (data._id) {
      return this.getResponse(
        false,
        "Cannot set _id value it is system generated value",
      );
    }
    let insertData = data;
    insertData._id = this.randomUUID;
    const file = this.collectionPath(name);
    const dataObject = await this.find(name);
    if (dataObject.status) {
      const data = dataObject.message;
      data.push(insertData);
      insertData = data;
    } else {
      insertData = [insertData];
    }
    const [info, insertError] = await this.submit(
      file,
      this.encoder.encode(JSON.stringify(insertData)),
    );
    return insertError
      ? this.getResponse(false, "Error inserting data")
      : this.getResponse(true, "Data inserted");
  }

  /**
   * Takes in the name of the collection and the update Object
   * if update object signature is valid.
   * Updates data for the matching key if
   * not exists creates one for you.
   * @param {string} name
   * @param {object} updateData
   * @returns {object}response object
   */
  async update(name, updateData) {
    const response = this.validateUpdateSignature(updateData);
    if (response instanceof Object) {
      return response;
    }
    if (!response) {
      return this.getResponse(
        false,
        "Invalid Update Data Object Signature. Please call updateSignature() to check the valid object signature",
      );
    }
    const filterParam = updateData["$find"];
    const setData = updateData["$set"];
    const findResponse = await this.find(name, filterParam, true);
    if (!findResponse.status) {
      return this.getResponse(false, findResponse.message);
    }

    const filteredData = findResponse.message;
    const dbResponse = await this.find(name);
    if (!dbResponse.status) {
      throw new Error(dbResponse.message);
    }
    const dbData = dbResponse.message;
    for (const key in filteredData) {
      if (Object.hasOwnProperty.call(filteredData, key)) {
        const dataAndIndex = filteredData[key];
        const index = Object.keys(dataAndIndex)[0];
        for (const updateKey in setData) {
          if (Object.hasOwnProperty.call(setData, updateKey)) {
            dbData[index][updateKey] = setData[updateKey];
          }
        }
      }
    }
    const path = this.collectionPath(name);
    const [update, submitError] = await this.submit(
      path,
      this.encoder.encode(JSON.stringify(dbData)),
    );
    return submitError
      ? this.getResponse(
        false,
        "Error while updating data" + "\n" + submitError,
      )
      : this.getResponse(true, "Data Updated");
  }

  /**
   * Takes in the collection and delete parameters
   * finds a matching object
   * and removes from the collection.
   * If {} object is purges the entire document.
   * @param {string} name
   * @param {object} deleteParams
   * @returns {object} response object
   */
  async delete(name, deleteParams = undefined) {
    if (!deleteParams) {
      deleteParams = {};
    }
    const findResponse = await this.find(name, deleteParams, true);
    if (!findResponse.status) {
      throw new Error(findResponse.message + "Occured while performing Delete");
    }
    const dbResponse = await this.find(name);
    if (!dbResponse.status) {
      throw new Error(dbResponse.message);
    }
    const filteredData = findResponse.message;
    const dbData = dbResponse.message;
    for (const key in filteredData) {
      if (Object.hasOwnProperty.call(filteredData, key)) {
        const dataAndIndex = filteredData[key];
        const index = Object.keys(dataAndIndex)[0];
        dbData.splice(index, 1);
      }
    }
    const path = this.collectionPath(name);
    const [update, submitError] = await this.submit(
      path,
      this.encoder.encode(JSON.stringify(dbData)),
    );
    return submitError
      ? this.getResponse(
        false,
        "Error while updating data" + "\n" + submitError,
      )
      : this.getResponse(true, "Removed");
  }

  /**
   * Writes the updates object to the file
   * @param  {...any} values
   * @returns
   */
  async submit(...values) {
    const [submit, error] = await this.wrapTryCatch(Deno.writeFile, ...values);
    return [submit, error];
  }
}
