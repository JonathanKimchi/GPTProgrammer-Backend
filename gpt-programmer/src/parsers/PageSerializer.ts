type JsonObject = { [key: string]: any };

export const getPageRequests = (data: string): JsonObject[] => {
  // Define a regular expression to match JSON objects
  const jsonRegEx = /{(?:[^{}]|{[^{}]*})*}/gms;

  // Get all JSON strings from the data
  const jsonStringList = data.match(jsonRegEx) || [];

  // Parse each JSON string into a JSON object and return the list
  const jsonObjectList: JsonObject[] = jsonStringList.map(jsonString => JSON.parse(jsonString));

  return jsonObjectList;
};




