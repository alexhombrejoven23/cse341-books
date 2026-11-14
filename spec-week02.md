# Books API Week 02 Spec - Version 1

## Feature 1: Book CRUD Operations and Author References

### Goal
Update the existing Week 01 book API so book documents include a reference to an author and the API supports all CRUD operations for books. Every book route must be documented and testable in Swagger.

### Data Model
Book documents will be stored in the `books` collection.

Required book fields:
- `id`: string, required, custom id such as `b1`
- `authorId`: string, required, references the `id` field of an author document
- `title`: string, required
- `publicationDate`: string, required

Books will continue to use custom string ids instead of MongoDB `_id` values for route parameters.

### Relationship to Authors
Each book will identify its author with an `authorId` field. The value of `authorId` must match the custom `id` value of an existing author document.

When creating or updating a book, the API should reject the request with a `400` status code if the submitted `authorId` does not match an existing author.

### Routes

#### GET /books
Purpose: Return all books.

Success:
- Status code: `200`
- Response body: an array of book objects

Errors:
- `500` if an unexpected server or database error occurs

#### GET /books/:id
Purpose: Return one book by its custom id.

Success:
- Status code: `200`
- Response body: the matching book object

Errors:
- `404` if no book exists with that id
- `500` if an unexpected server or database error occurs

#### POST /books
Purpose: Create a new book.

Request body:

    {
      "id": "b4",
      "authorId": "a1",
      "title": "Example Book Title",
      "publicationDate": "2026-01-15"
    }

Success:
- Status code: `201`
- Response body: the newly created book object

Errors:
- `400` if a required field is missing
- `400` if the `id` already exists
- `400` if the `authorId` does not match an existing author
- `500` if an unexpected server or database error occurs

#### PUT /books/:id
Purpose: Update an existing book.

Request body:

    {
      "authorId": "a2",
      "title": "Updated Book Title",
      "publicationDate": "2026-02-20"
    }

Success:
- Status code: `200`
- Response body: the updated book object

Errors:
- `400` if a required field is missing
- `400` if the `authorId` does not match an existing author
- `404` if no book exists with that id
- `500` if an unexpected server or database error occurs

#### DELETE /books/:id
Purpose: Delete an existing book.

Success:
- Status code: `204`
- Response body: none

Errors:
- `404` if no book exists with that id
- `500` if an unexpected server or database error occurs

### Swagger Documentation
Swagger must document every book route.

### Deployment Expectations
After implementation, the book routes must work locally and from the deployed Render application. The deployed Swagger page at `/api-docs` must allow someone to test every book route from the browser.

## Feature 2: Author CRUD Operations

### Goal
Add an `authors` collection and provide all CRUD operations for authors. Books reference authors through their `authorId` field. Every author route must be documented and testable in Swagger.

### Data Model
Author documents will be stored in the `authors` collection.

Required author fields:
- `id`: string, required, custom id such as `a1`
- `name`: string, required
- `birthYear`: number, required

Authors will use custom string ids instead of MongoDB `_id` values for route parameters, the same as books.

### Relationship to Books
Books store the author's custom `id` in their `authorId` field. An author cannot be deleted while any book still references that author. In that case the API returns `409` and does not delete the author.

### Routes

#### GET /authors
Purpose: Return all authors.

Success:
- Status code: `200`
- Response body: an array of author objects

Errors:
- `500` if an unexpected server or database error occurs

#### GET /authors/:id
Purpose: Return one author by their custom id.

Success:
- Status code: `200`
- Response body: the matching author object

Errors:
- `404` if no author exists with that id
- `500` if an unexpected server or database error occurs

#### POST /authors
Purpose: Create a new author.

Request body:

    {
      "id": "a4",
      "name": "Isabel Allende",
      "birthYear": 1942
    }

Success:
- Status code: `201`
- Response body: the newly created author object

Errors:
- `400` if a required field is missing
- `400` if the `id` already exists
- `500` if an unexpected server or database error occurs

#### PUT /authors/:id
Purpose: Update an existing author. The id comes from the URL and cannot be changed.

Request body:

    {
      "name": "Isabel Allende",
      "birthYear": 1942
    }

Success:
- Status code: `200`
- Response body: the updated author object

Errors:
- `400` if a required field is missing
- `404` if no author exists with that id
- `500` if an unexpected server or database error occurs

#### DELETE /authors/:id
Purpose: Delete an existing author who has no books.

Success:
- Status code: `204`
- Response body: none

Errors:
- `404` if no author exists with that id
- `409` if one or more books still reference this author
- `500` if an unexpected server or database error occurs

### Swagger Documentation
Swagger must document every author route.

### Deployment Expectations
After implementation, the author routes must work locally and from the deployed Render application. The deployed Swagger page at `/api-docs` must allow someone to test every author route from the browser.

---

# Spec Evaluation

I asked AI the four evaluation questions about Version 1. Summary of the feedback:

### 1. Bugs or short-sighted decisions
- Field types and formats are not defined. `publicationDate` could be any text, and `birthYear` could be a string or a year in the future.
- Empty strings such as `"title": ""` would pass a simple "field exists" check.
- PUT does not say what happens if the client sends an `id` in the body. Changing the id could break book references.
- The order of checks is not defined. For example, PUT with a missing field on a book that does not exist could return either `400` or `404`.
- Without a unique index, two requests at the same time could create duplicate ids.

### 2. Missing security considerations
- Values are not checked to be strings or numbers. A client could send an object such as `{ "$ne": null }` and MongoDB could treat it as a query operator (NoSQL injection).
- Extra fields in the body are not rejected, so a client could store unexpected data.
- Error responses should never include stack traces or raw database messages.
- There are no length limits on text fields.

### 3. Efficiency concerns
- Lookups by `id` and `authorId` scan the whole collection without indexes.
- Checking whether an author has books only needs to find one book, not all of them.
- `GET /books` and `GET /authors` return everything with no pagination. This is fine for a small class project but should be noted for the future.

### 4. Unclear responses or errors
- The JSON format of error responses is not defined.
- It is not clear whether responses include the MongoDB `_id` field.
- The `409` response for deleting an author with books has no example message.

---

# Books API Week 02 Spec - Version 2

## General Rules (apply to both features)

- All error responses use the format `{ "message": "<text>" }`.
- Responses never include the MongoDB `_id` field. Queries use a projection to exclude it.
- `500` responses always return `{ "message": "Internal server error" }`. The real error is logged on the server with `console.error`, not sent to the client.
- Only the fields listed in the data model are saved. Any extra fields in the request body are ignored.
- String fields must be of type string and not empty after trimming. Values are trimmed before saving.
- Ids in the URL are never changed by PUT. If the body includes an `id`, it is ignored.
- Both collections have a unique index on `id`. `books` also has an index on `authorId`.
- Check order for write routes: (1) validate the body → `400`, (2) check the target document exists → `404`, (3) check related data (duplicate id or author reference) → `400` or `409`, (4) write to the database.

## Feature 1: Book CRUD Operations and Author References

### Data Model (`books` collection)
- `id`: string, required, not empty, custom id such as `b1`
- `authorId`: string, required, not empty, must match the `id` of an existing author
- `title`: string, required, not empty
- `publicationDate`: string, required, format `YYYY-MM-DD`

Example document:

    {
      "id": "b1",
      "authorId": "a1",
      "title": "One Hundred Years of Solitude",
      "publicationDate": "1967-05-30"
    }

### Routes

#### GET /books
- `200`: array of book objects
- `500`: `{ "message": "Internal server error" }`

#### GET /books/:id
- `200`: the matching book object
- `404`: `{ "message": "Book not found" }`
- `500`: `{ "message": "Internal server error" }`

#### POST /books
Request body:

    {
      "id": "b4",
      "authorId": "a1",
      "title": "Example Book Title",
      "publicationDate": "2026-01-15"
    }

- `201`: the newly created book object
- `400`: `{ "message": "id, authorId, title, and publicationDate are required" }` if a field is missing, empty, or the wrong type
- `400`: `{ "message": "publicationDate must use the format YYYY-MM-DD" }`
- `400`: `{ "message": "A book with this id already exists" }`
- `400`: `{ "message": "authorId does not match an existing author" }`
- `500`: `{ "message": "Internal server error" }`

#### PUT /books/:id
Request body:

    {
      "authorId": "a2",
      "title": "Updated Book Title",
      "publicationDate": "2026-02-20"
    }

- `200`: the updated book object
- `400`: `{ "message": "authorId, title, and publicationDate are required" }` if a field is missing, empty, or the wrong type
- `400`: `{ "message": "publicationDate must use the format YYYY-MM-DD" }`
- `404`: `{ "message": "Book not found" }`
- `400`: `{ "message": "authorId does not match an existing author" }`
- `500`: `{ "message": "Internal server error" }`

#### DELETE /books/:id
- `204`: no response body
- `404`: `{ "message": "Book not found" }`
- `500`: `{ "message": "Internal server error" }`

### Implementation Checklist
- [ ] Every existing book in MongoDB Atlas has a valid `authorId`
- [ ] Model functions: `getAllBooks`, `getBookById`, `createBook`, `updateBook`, `deleteBook`
- [ ] Helper that checks whether an author exists before create or update
- [ ] Controllers validate input and follow the check order above
- [ ] Only `authorId` is stored on the book, not the author's name or document
- [ ] Swagger comments for all five book routes, with `requestBody` examples for POST and PUT
- [ ] `npm run swagger` and `npm run lint` pass
- [ ] Every route tested locally and on Render at `/api-docs`

## Feature 2: Author CRUD Operations

### Data Model (`authors` collection)
- `id`: string, required, not empty, custom id such as `a1`
- `name`: string, required, not empty
- `birthYear`: integer, required, between 1 and the current year

Example document:

    {
      "id": "a1",
      "name": "Gabriel Garcia Marquez",
      "birthYear": 1927
    }

### Routes

#### GET /authors
- `200`: array of author objects
- `500`: `{ "message": "Internal server error" }`

#### GET /authors/:id
- `200`: the matching author object
- `404`: `{ "message": "Author not found" }`
- `500`: `{ "message": "Internal server error" }`

#### POST /authors
Request body:

    {
      "id": "a4",
      "name": "Isabel Allende",
      "birthYear": 1942
    }

- `201`: the newly created author object
- `400`: `{ "message": "id, name, and birthYear are required" }` if a field is missing, empty, or the wrong type
- `400`: `{ "message": "birthYear must be a whole number between 1 and the current year" }`
- `400`: `{ "message": "An author with this id already exists" }`
- `500`: `{ "message": "Internal server error" }`

#### PUT /authors/:id
Request body:

    {
      "name": "Isabel Allende",
      "birthYear": 1942
    }

- `200`: the updated author object
- `400`: `{ "message": "name and birthYear are required" }` if a field is missing, empty, or the wrong type
- `400`: `{ "message": "birthYear must be a whole number between 1 and the current year" }`
- `404`: `{ "message": "Author not found" }`
- `500`: `{ "message": "Internal server error" }`

#### DELETE /authors/:id
- `204`: no response body
- `404`: `{ "message": "Author not found" }`
- `409`: `{ "message": "Cannot delete author with existing books" }` if any book has this `authorId`
- `500`: `{ "message": "Internal server error" }`

The API checks for related books with a single query that stops at the first match. The author is only deleted when no books reference them.

### Implementation Checklist
- [ ] `authors` collection in MongoDB Atlas with at least three documents (`a1`, `a2`, `a3`)
- [ ] Model functions: `getAllAuthors`, `getAuthorById`, `createAuthor`, `updateAuthor`, `deleteAuthor`, `authorHasBooks`
- [ ] Controllers validate input and follow the check order above
- [ ] Swagger comments for all five author routes, with `requestBody` examples for POST and PUT
- [ ] `npm run swagger` and `npm run lint` pass
- [ ] Every route tested locally and on Render at `/api-docs`
- [ ] Deleting an author with books returns `409` and the author still exists afterward
