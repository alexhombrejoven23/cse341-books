import { getDb } from '../db/connect.js';

const hideMongoId = { projection: { _id: 0 } };

const getAllBooks = async () => {
    const db = getDb();
    const collection = db.collection('books');
    const books = await collection.find({}, hideMongoId).toArray();
    return books;
};

const getBookById = async (bookId) => {
    const db = getDb();
    const collection = db.collection('books');
    const book = await collection.findOne({ id: bookId }, hideMongoId);
    return book;
};

const createBook = async (book) => {
    const db = getDb();
    const collection = db.collection('books');
    await collection.insertOne({ ...book });
    return book;
};

const updateBook = async (bookId, book) => {
    const db = getDb();
    const collection = db.collection('books');
    await collection.updateOne({ id: bookId }, { $set: book });
    return { id: bookId, ...book };
};

const deleteBook = async (bookId) => {
    const db = getDb();
    const collection = db.collection('books');
    const result = await collection.deleteOne({ id: bookId });
    return result;
};

const authorExists = async (authorId) => {
    const db = getDb();
    const collection = db.collection('authors');
    const count = await collection.countDocuments({ id: authorId }, { limit: 1 });
    return count > 0;
};

export { getAllBooks, getBookById, createBook, updateBook, deleteBook, authorExists };